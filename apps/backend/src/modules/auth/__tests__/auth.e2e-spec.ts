import { Test, TestingModule } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../../../app.module';

describe('AuthController (e2e)', () => {
  let app: NestApplication;
  let userId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testEmail);
          userId = res.body.id;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(401);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('email', testEmail);
        });
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let authToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });
      authToken = res.body.token;
    });

    it('should return user data when authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testEmail);
        });
    });

    it('should fail when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});