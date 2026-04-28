import { Test, TestingModule } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import request from 'supertest';
import { UnlockModule } from '../unlock.module';
import { DatabaseModule } from '../../db/db.module';
import { ConfigModule } from '@nestjs/config';

describe('UnlockController (e2e)', () => {
  let app: NestApplication;
  let authToken: string;
  const testEmail = `unlock-test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  const testPromptId = 'c7f3e8a1-4b9d-4f2e-a8c6-d3e1f0a2b9c4';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        UnlockModule,
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

  describe('/prompts/:id/unlock (POST)', () => {
    it('should unlock prompt with ad when authenticated', () => {
      return request(app.getHttpServer())
        .post(`/prompts/${testPromptId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ adToken: 'valid-ad-token' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('promptId', testPromptId);
          expect(res.body).toHaveProperty('unlockedVia', 'ad');
        });
    });

    it('should return existing unlock if already unlocked', () => {
      return request(app.getHttpServer())
        .post(`/prompts/${testPromptId}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ adToken: 'valid-ad-token' })
        .expect(201);
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post(`/prompts/${testPromptId}/unlock`)
        .send({ adToken: 'valid-ad-token' })
        .expect(401);
    });
  });

  describe('/unlocks (GET)', () => {
    it('should return user unlocks when authenticated', () => {
      return request(app.getHttpServer())
        .get('/unlocks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/unlocks')
        .expect(401);
    });
  });
});