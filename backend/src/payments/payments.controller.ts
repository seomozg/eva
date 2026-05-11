import { Controller, Post, Body, UseGuards, Req, Headers, HttpCode, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
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
    const { confirmationUrl } = await this.paymentsService.createPayment(req.user.userId, amount);
    return { confirmationUrl };
  }

  /**
   * YooKassa webhook endpoint (public).
   * POST /api/webhooks/yookassa
   */
  @Post('api/webhooks/yookassa')
  @HttpCode(200)
  async handleWebhook(@Body() body: { event: string; object?: { id?: string; status?: string } }) {
    const event = body.event;
    const paymentId = body.object?.id;

    this.logger.log(`Webhook received: event=${event}, paymentId=${paymentId}`);

    if (!paymentId) {
      this.logger.warn('Webhook missing payment ID');
      return { received: true };
    }

    if (event === 'payment.succeeded') {
      try {
        await this.paymentsService.processSuccessfulPayment(paymentId);
      } catch (error: unknown) {
        const err = error as { message?: string };
        this.logger.error(`Failed to process webhook for ${paymentId}: ${err.message}`);
      }
    } else if (event === 'payment.canceled') {
      this.logger.log(`Payment ${paymentId} was canceled`);
      // Optionally update transaction to FAILED, but keep it simple for now
    } else {
      this.logger.log(`Unhandled event: ${event}`);
    }

    // Always return 200 so YooKassa doesn't retry
    return { received: true };
  }
}