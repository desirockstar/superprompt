import { Controller, Post, Get, Body, UseGuards, Req, Headers, HttpCode } from '@nestjs/common';
import { BillingService } from './billing.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(RequiredAuthGuard)
  @Post('checkout')
  async createCheckout(@Req() req: any, @Body() body: { plan: 'monthly' | 'yearly' }) {
    return this.billingService.createCheckoutSession(req.user.id, body.plan);
  }

  @UseGuards(RequiredAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.billingService.getSubscriptionStatus(req.user.id);
  }

  @HttpCode(200)
  @Post('webhook')
  async webhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    return this.billingService.handleWebhook(rawBody, signature);
  }
}