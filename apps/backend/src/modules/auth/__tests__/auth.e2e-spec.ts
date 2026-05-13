import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/db.module';
import { AuthModule } from '../auth.module';
import { CacheModule } from '../../cache/cache.module';

async function createApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      DatabaseModule,
      CacheModule,
      AuthModule,
    ],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

async function registerAndGetCookie(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password });
  const raw = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(raw) ? raw : [raw];
  const session = cookies.find((c: string) => c.startsWith('sp_session='));
  if (!session) throw new Error('sp_session cookie not set');
  return session.split(';')[0];
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const suffix = Date.now();
  const email = `e2e-auth-${suffix}@example.com`;
  const password = 'TestPass1';

  beforeAll(async () => { app = await createApp(); });
  afterAll(async () => { await app.close(); });

  describe('POST /api/auth/register', () => {
    it('201 — creates user and sets HttpOnly sp_session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(email);

      const raw = res.headers['set-cookie'];
      const cookies: string[] = Array.isArray(raw) ? raw : [raw];
      const session = cookies.find((c: string) => c.startsWith('sp_session='));
      expect(session).toBeDefined();
      expect(session).toContain('HttpOnly');
    });

    it('401 — duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/login', () => {
    it('200 — returns user and sets HttpOnly cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(email);
      expect(res.body).toHaveProperty('isAdmin');

      const raw = res.headers['set-cookie'];
      const cookies: string[] = Array.isArray(raw) ? raw : [raw];
      expect(cookies.some((c: string) => c.startsWith('sp_session=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('401 — wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('401 — unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `nobody-${suffix}@example.com`, password });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('200 — returns user when authenticated via cookie', async () => {
      const cookie = await registerAndGetCookie(app, `me-${suffix}@example.com`, password);
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(`me-${suffix}@example.com`);
    });

    it('401 — no cookie', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me/state', () => {
    it('200 — returns { subscription, unlocks[], ratings{} }', async () => {
      const cookie = await registerAndGetCookie(app, `state-${suffix}@example.com`, password);
      const res = await request(app.getHttpServer())
        .get('/api/auth/me/state')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('subscription');
      expect(Array.isArray(res.body.unlocks)).toBe(true);
      expect(typeof res.body.ratings).toBe('object');
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me/state');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('200 — clears session; subsequent /me returns 401', async () => {
      const cookie = await registerAndGetCookie(app, `logout-${suffix}@example.com`, password);

      const logoutRes = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookie);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie);
      expect(meRes.status).toBe(401);
    });
  });
});
