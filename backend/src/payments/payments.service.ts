import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiUrl = 'https://api.cryptocloud.plus/v2/invoice/create';

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly httpService: HttpService,
  ) {}

  private get apiKey(): string {
    const key = process.env.CRYPTOCLOUD_API_KEY;
    if (!key) {
      throw new BadRequestException('CryptoCloud API key is not configured');
    }
    return key;
  }

  private get shopId(): string {
    const id = process.env.CRYPTOCLOUD_SHOP_ID;
    if (!id) {
      throw new BadRequestException('CryptoCloud shop ID is not configured');
    }
    return id;
  }

  /**
   * Verify HMAC-SHA256 signature from CryptoCloud webhook.
   */
  verifyWebhookSignature(bodyRaw: string, signatureHeader: string): boolean {
    const hmac = createHmac('sha256', this.apiKey);
    hmac.update(bodyRaw);
    const computed = hmac.digest('hex');
    return computed === signatureHeader;
  }

  /**
   * Create an invoice in CryptoCloud and save a pending transaction.
   * Returns the payment link for redirecting the user.
   */
  async createPayment(userId: string, amount: number): Promise<{ confirmationUrl: string; paymentId: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const orderId = `deposit-${userId}-${Date.now()}`;

    const payload = {
      amount: amount.toFixed(2),
      shop_id: this.shopId,
      order_id: orderId,
      currency: 'RUB',
    };

    let cryptoCloudResponse;
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${this.apiKey}`,
          },
        }),
      );
      cryptoCloudResponse = response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      this.logger.error('Failed to create CryptoCloud invoice', err.response?.data || err.message);
      throw new BadRequestException('Failed to create payment. Please try again later.');
    }

    const result = cryptoCloudResponse?.result;
    const paymentId: string = result?.invoice_id;
    const confirmationUrl: string = result?.link;

    if (!paymentId || !confirmationUrl) {
      this.logger.error('CryptoCloud response missing invoice_id or link', cryptoCloudResponse);
      throw new BadRequestException('Invalid payment response from CryptoCloud');
    }

    // Save a pending transaction
    const transaction = this.transactionRepo.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      description: `CryptoCloud invoice: ${paymentId}`,
      externalId: paymentId,
    });
    await this.transactionRepo.save(transaction);

    return { confirmationUrl, paymentId };
  }

  /**
   * Process a successful payment: update transaction status and top up user balance.
   * No API verification needed — webhook signature has already been verified.
   */
  async processSuccessfulPayment(invoiceId: string): Promise<void> {
    // Check if already processed (idempotency)
    const existing = await this.transactionRepo.findOne({
      where: { externalId: invoiceId, status: TransactionStatus.COMPLETED },
    });
    if (existing) {
      this.logger.log(`Invoice ${invoiceId} already processed, skipping`);
      return;
    }

    // Find pending transaction
    const transaction = await this.transactionRepo.findOne({
      where: { externalId: invoiceId, status: TransactionStatus.PENDING },
    });
    if (!transaction) {
      this.logger.warn(`No pending transaction found for invoice ${invoiceId}`);
      return;
    }

    // Update transaction status
    transaction.status = TransactionStatus.COMPLETED;
    await this.transactionRepo.save(transaction);

    // Top up user balance
    await this.userRepo.increment({ id: transaction.userId }, 'balance', Number(transaction.amount));

    this.logger.log(`Invoice ${invoiceId} processed successfully: +${transaction.amount} credits to user ${transaction.userId}`);
  }
}