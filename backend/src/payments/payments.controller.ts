import { Controller, Post, Body, UseGuards, Req, Headers, HttpCode, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a payment (authenticated user).
   * POST /payments/create
   */
  @UseGuards(JwtAuthGuard)
  @Post('payments/create')
  async createPayment(@Req() req: AuthenticatedRequest, @Body('amount') amount: number) {
    const { confirmationUrl } = await this.paymentsService.createPayment(req.user.id, amount);
    return { confirmationUrl };
  }

  /**
   * CryptoCloud webhook endpoint (public).
   * POST /api/webhooks/cryptocloud
   * CryptoCloud sends HMAC-SHA256 signature in X-Signature header.
   */
  @Post('api/webhooks/cryptocloud')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-signature') signature: string,
    @Body() body: { invoice_id?: string; status?: string },
  ) {
    // Verify HMAC signature — CryptoCloud signs the JSON body
    const rawBody = JSON.stringify(body);
    if (!signature || !this.paymentsService.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Webhook signature verification failed');
      return { received: true };
    }

    const invoiceId = body.invoice_id;
    const status = body.status;

    this.logger.log(`Webhook received: invoiceId=${invoiceId}, status=${status}`);

    if (!invoiceId) {
      this.logger.warn('Webhook missing invoice_id');
      return { received: true };
    }

    if (status === 'success') {
      try {
        await this.paymentsService.processSuccessfulPayment(invoiceId);
      } catch (error: unknown) {
        const err = error as { message?: string };
        this.logger.error(`Failed to process webhook for ${invoiceId}: ${err.message}`);
      }
    } else if (status === 'fail' || status === 'expired') {
      this.logger.log(`Invoice ${invoiceId} ended with status: ${status}`);
    } else {
      this.logger.log(`Unhandled status: ${status} for invoice ${invoiceId}`);
    }

    // Always return 200 so CryptoCloud doesn't retry
    return { received: true };
  }
}