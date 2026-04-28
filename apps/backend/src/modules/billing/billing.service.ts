import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { subscriptions as subscriptionsTable } from '@superprompt/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class BillingService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  async createCheckoutSession(userId: string, plan: 'monthly' | 'yearly') {
    const stripeSecretKey = this.config.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return { url: '/billing?error=no-stripe' };
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey);
    const priceId = plan === 'monthly' 
      ? this.config.get('STRIPE_PRICE_ID_MONTHLY')
      : this.config.get('STRIPE_PRICE_ID_YEARLY');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/cancel`,
      metadata: { userId },
    });

    return { url: session.url };
  }

  async getSubscriptionStatus(userId: string) {
    const [sub] = await this.db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);

    if (!sub) return { status: 'none' };
    
    return {
      status: sub.status,
      expiresAt: sub.expiresAt,
    };
  }

  async activateSubscription(userId: string, stripeSubscriptionId: string) {
    const Stripe = require('stripe');
    const stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const [created] = await this.db.insert(subscriptionsTable).values({
      userId,
      status: sub.status === 'active' ? 'active' : 'past_due',
      stripeSubscriptionId,
      expiresAt: new Date(sub.current_period_end * 1000),
    }).onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: {
        status: sub.status === 'active' ? 'active' : 'past_due',
        stripeSubscriptionId,
        expiresAt: new Date(sub.current_period_end * 1000),
      },
    }).returning();

    return created;
  }

  async handleWebhook(body: any, signature: string) {
    const stripeSecretKey = this.config.get('STRIPE_SECRET_KEY');
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !webhookSecret) {
      return { received: true };
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretKey);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        await this.activateSubscription(userId, session.subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await this.db.update(subscriptionsTable)
          .set({ status: 'canceled' })
          .where(eq(subscriptionsTable.stripeSubscriptionId, sub.id));
        break;
      }
    }

    return { received: true };
  }
}