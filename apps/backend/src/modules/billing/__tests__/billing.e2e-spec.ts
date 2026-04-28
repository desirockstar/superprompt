import { Test, TestingModule } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import request from 'supertest';
import { BillingModule } from '../billing.module';
import { DatabaseModule } from '../../db/db.module';
import { ConfigModule } from '@nestjs/config';

describe('BillingController (e2e)', () => {
  let app: NestApplication;
  let authToken: string;
  const testEmail = `billing-test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        BillingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    authToken = res.body.token;
  }, 60000);

  afterAll(async () => {
    await app.close();
  }, 15000);



  describe('/billing/checkout (POST)', () => {
    it('should create checkout session with monthly plan', () => {
      return request(app.getHttpServer())
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'monthly' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
        });
    });

    it('should create checkout session with yearly plan', () => {
      return request(app.getHttpServer())
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'yearly' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/billing/checkout')
        .send({ plan: 'monthly' })
        .expect(401);
    });
  });

  describe('/billing/status (GET)', () => {
    it('should return subscription status when authenticated', () => {
      return request(app.getHttpServer())
        .get('/billing/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/billing/status')
        .expect(401);
    });
  });

  describe('/billing/webhook (POST)', () => {
    it('should handle checkout.session.completed webhook', () => {
      return request(app.getHttpServer())
        .post('/billing/webhook')
        .send({ type: 'checkout.session.completed' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('received', true);
        });
    });

    it('should handle customer.subscription.deleted webhook', () => {
      return request(app.getHttpServer())
        .post('/billing/webhook')
        .send({ type: 'customer.subscription.deleted' })
        .expect(200);
    });
  });
});