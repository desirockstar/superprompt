import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class CheckoutDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.MONTHLY })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Stripe checkout session URL' })
  url: string;

  @ApiProperty({ description: 'Stripe session ID' })
  sessionId: string;
}

export class SubscriptionStatusDto {
  @ApiProperty({ description: 'Subscription status', enum: ['active', 'canceled', 'past_due'] })
  status: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  stripeSubscriptionId?: string;
}

export class WebhookPayloadDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  data: Record<string, unknown>;
}