import { Test, TestingModule } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import request from 'supertest';
import { GradingModule } from '../grading.module';
import { DatabaseModule } from '../../db/db.module';
import { AuthModule } from '../../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

describe('GradingController (e2e)', () => {
  let app: NestApplication;
  let adminToken: string;
  const adminEmail = `admin-grading-${Date.now()}@example.com`;
  const adminPassword = 'AdminPass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthModule,
        GradingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: adminEmail, password: adminPassword });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = res.body.token;
  }, 60000);

  afterAll(async () => {
    await app.close();
  }, 15000);

  describe('/grading/run (POST)', () => {
    it('should fail with 403 when not admin', () => {
      return request(app.getHttpServer())
        .post('/grading/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .post('/grading/run')
        .expect(401);
    });
  });

  describe('/grading/jobs (GET)', () => {
    it('should return grading jobs when authenticated', () => {
      return request(app.getHttpServer())
        .get('/grading/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without auth', () => {
      return request(app.getHttpServer())
        .get('/grading/jobs')
        .expect(401);
    });
  });
});