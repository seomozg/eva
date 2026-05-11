import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiUrl = 'https://api.yookassa.ru/v3/payments';

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly httpService: HttpService,
  ) {}

  private getAuthHeader(): string {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secretKey) {
      throw new BadRequestException('YooKassa credentials are not configured');
    }
    const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Create a payment in YooKassa and save a pending transaction.
   * Returns the confirmation_url for redirecting the user.
   */
  async createPayment(userId: string, amount: number): Promise<{ confirmationUrl: string; paymentId: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const idempotenceKey = `deposit-${userId}-${Date.now()}`;
    const returnUrl = process.env.YOOKASSA_RETURN_URL || process.env.BASE_URL || 'https://your-virtual-cutie.ru';
    const description = `Пополнение баланса на ${amount} ₽`;

    const payload = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true,
      description,
      metadata: {
        user_id: userId,
      },
    };

    let yookassaPayment;
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.getAuthHeader(),
            'Idempotence-Key': idempotenceKey,
          },
        }),
      );
      yookassaPayment = response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      this.logger.error('Failed to create YooKassa payment', err.response?.data || err.message);
      throw new BadRequestException('Failed to create payment. Please try again later.');
    }

    const paymentId: string = yookassaPayment.id;
    const confirmationUrl: string = yookassaPayment.confirmation?.confirmation_url;

    if (!paymentId || !confirmationUrl) {
      this.logger.error('YooKassa response missing payment ID or confirmation URL', yookassaPayment);
      throw new BadRequestException('Invalid payment response from YooKassa');
    }

    // Save a pending transaction
    const transaction = this.transactionRepo.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      description: `YooKassa payment: ${paymentId}`,
      externalId: paymentId,
    });
    await this.transactionRepo.save(transaction);

    return { confirmationUrl, paymentId };
  }

  /**
   * Verify payment status by calling YooKassa API directly.
   * Returns the actual payment status from YooKassa.
   */
  async verifyPayment(paymentId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/${paymentId}`, {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }),
      );
      return response.data?.status;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      this.logger.error('Failed to verify YooKassa payment', err.response?.data || err.message);
      throw new BadRequestException('Failed to verify payment');
    }
  }

  /**
   * Process a succeeded payment: update transaction status and top up user balance.
   */
  async processSuccessfulPayment(paymentId: string): Promise<void> {
    // Check if already processed (idempotency)
    const existing = await this.transactionRepo.findOne({
      where: { externalId: paymentId, status: TransactionStatus.COMPLETED },
    });
    if (existing) {
      this.logger.log(`Payment ${paymentId} already processed, skipping`);
      return;
    }

    // Find pending transaction
    const transaction = await this.transactionRepo.findOne({
      where: { externalId: paymentId, status: TransactionStatus.PENDING },
    });
    if (!transaction) {
      this.logger.warn(`No pending transaction found for payment ${paymentId}`);
      return;
    }

    // Verify with YooKassa API
    const status = await this.verifyPayment(paymentId);
    if (status !== 'succeeded') {
      this.logger.warn(`Payment ${paymentId} status is "${status}", not "succeeded" — skipping`);
      return;
    }

    // Update transaction status
    transaction.status = TransactionStatus.COMPLETED;
    await this.transactionRepo.save(transaction);

    // Top up user balance
    await this.userRepo.increment({ id: transaction.userId }, 'balance', Number(transaction.amount));

    this.logger.log(`Payment ${paymentId} processed successfully: +${transaction.amount} credits to user ${transaction.userId}`);
  }
}