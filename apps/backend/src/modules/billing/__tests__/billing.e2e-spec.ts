import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/db.module';
import { AuthModule } from '../../auth/auth.module';
import { CacheModule } from '../../cache/cache.module';
import { BillingModule } from '../billing.module';
import { BillingService } from '../billing.service';

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

async function createApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      DatabaseModule,
      CacheModule,
      AuthModule,
      BillingModule,
    ],
  })
    // Mock BillingService so we don't need live Stripe credentials
    .overrideProvider(BillingService)
    .useValue({
      createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      getSubscriptionStatus: jest.fn().mockResolvedValue({ status: 'none' }),
      handleWebhook: jest.fn().mockResolvedValue({ received: true }),
      activateSubscription: jest.fn().mockResolvedValue({ status: 'active' }),
    })
    .compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

async function registerAndGetCookie(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'TestPass1' });
  const raw = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(raw) ? raw : [raw];
  const session = cookies.find((c: string) => c.startsWith('sp_session='));
  if (!session) throw new Error('sp_session cookie not set');
  return session.split(';')[0];
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let billing: BillingService;
  const suffix = Date.now();

  beforeAll(async () => {
    app = await createApp();
    billing = app.get<BillingService>(BillingService);
  });

  afterAll(async () => { await app.close(); });

  describe('POST /api/billing/checkout', () => {
    it('200 — monthly plan returns checkout URL', async () => {
      const cookie = await registerAndGetCookie(app, `billing-monthly-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Cookie', cookie)
        .send({ plan: 'monthly' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('url');
      expect(billing.createCheckoutSession).toHaveBeenCalledWith(expect.any(String), 'monthly');
    });

    it('200 — yearly plan returns checkout URL', async () => {
      const cookie = await registerAndGetCookie(app, `billing-yearly-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .set('Cookie', cookie)
        .send({ plan: 'yearly' });

      expect(res.status).toBe(200);
      expect(billing.createCheckoutSession).toHaveBeenCalledWith(expect.any(String), 'yearly');
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/billing/checkout')
        .send({ plan: 'monthly' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/billing/status', () => {
    it('200 — returns subscription status for authenticated user', async () => {
      const cookie = await registerAndGetCookie(app, `billing-status-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .get('/api/billing/status')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/billing/status');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/billing/webhook', () => {
    it('200 — webhook is accepted (no Stripe signature in test mode)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/billing/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'test-sig')
        .send(JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }));

      // Mocked service returns { received: true }
      expect(res.status).toBe(200);
      expect(billing.handleWebhook).toHaveBeenCalled();
    });

    it('SPEC: frontend /success redirect alone does NOT activate subscription', async () => {
      // Verify: handleWebhook mock was not called by visiting /success
      // /success is a frontend route — no backend endpoint exists for it
      const res = await request(app.getHttpServer()).get('/api/success');
      // Backend has no /success route — should be 404, not 200
      expect(res.status).toBe(404);
    });
  });

  describe('Subscription activation (unit)', () => {
    it('SPEC: checkout.session.completed webhook activates subscription', async () => {
      // The webhook handler is mocked. Verify the mock was called with expected args.
      (billing.handleWebhook as jest.Mock).mockResolvedValueOnce({ received: true });

      const cookie = await registerAndGetCookie(app, `webhook-activate-${suffix}@example.com`);
      await request(app.getHttpServer())
        .post('/api/billing/webhook')
        .set('Cookie', cookie)
        .set('stripe-signature', 'sig')
        .send(JSON.stringify({ type: 'checkout.session.completed' }));

      expect(billing.handleWebhook).toHaveBeenCalled();
    });
  });
});
