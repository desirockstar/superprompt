import { Test, TestingModule } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import request from 'supertest';
import { PromptModule } from '../prompt.module';
import { DatabaseModule } from '../../db/db.module';
import { AuthModule } from '../../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

describe('PromptController (e2e)', () => {
  let app: NestApplication;
  let authToken: string;
  const testEmail = `prompt-test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthModule,
        PromptModule,
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

  describe('/prompts (GET)', () => {
    it('should return list of approved prompts', () => {
      return request(app.getHttpServer())
        .get('/prompts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prompts');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
        });
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get('/prompts?category=Business Communication')
        .expect(200);
    });

    it('should return paginated results', () => {
      return request(app.getHttpServer())
        .get('/prompts?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.prompts.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('/prompts/:id/preview (GET)', () => {
    it('should return preview data without auth', () => {
      return request(app.getHttpServer())
        .get('/prompts/b5e3c8a7-9f2d-4e1b-8c6f-3a2d1e0f9b8c/preview')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('preview');
          expect(res.body).not.toHaveProperty('content');
        });
    });

    it('should return 404 for non-existent prompt', () => {
      return request(app.getHttpServer())
        .get('/prompts/a1b2c3d4-5678-90ab-cdef-1234567890ab/preview')
        .expect(404);
    });
  });

  describe('/prompts/:id (GET)', () => {
    it('should return full content when authenticated', () => {
      return request(app.getHttpServer())
        .get('/prompts/b5e3c8a7-9f2d-4e1b-8c6f-3a2d1e0f9b8c')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('content');
          expect(res.body).toHaveProperty('isLoggedIn', true);
        });
    });

    it('should return preview without auth', () => {
      return request(app.getHttpServer())
        .get('/prompts/b5e3c8a7-9f2d-4e1b-8c6f-3a2d1e0f9b8c')
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('content');
          expect(res.body).toHaveProperty('preview');
          expect(res.body).toHaveProperty('isLoggedIn', false);
        });
    });
  });

  describe('/prompts (POST)', () => {
    it('should create a new prompt when authenticated', () => {
      return request(app.getHttpServer())
        .post('/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Prompt',
          category: 'Test Category',
          content: { starter: 'Test content' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'Test Prompt');
          expect(res.body).toHaveProperty('status', 'pending');
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/prompts')
        .send({
          title: 'Test Prompt',
          category: 'Test Category',
          content: { starter: 'Test content' },
        })
        .expect(401);
    });
  });
});