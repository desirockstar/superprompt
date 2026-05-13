import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../db/db.module';
import { AuthModule } from '../../auth/auth.module';
import { CacheModule } from '../../cache/cache.module';
import { UnlockModule } from '../unlock.module';
import { AdMobProvider } from '../../ad/ad.provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      DatabaseModule,
      CacheModule,
      AuthModule,
      UnlockModule,
    ],
  })
    // Override AdMobProvider so verifyCompletion is controllable in tests
    .overrideProvider(AdMobProvider)
    .useValue({
      loadAd: jest.fn().mockResolvedValue({ token: 'valid-test-token', adId: 'ad-123' }),
      verifyCompletion: jest.fn().mockResolvedValue({ valid: true }),
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

describe('Unlock (e2e)', () => {
  let app: INestApplication;
  let adProvider: AdMobProvider;
  const suffix = Date.now();
  const testSlug = `test-prompt-${suffix}`;

  beforeAll(async () => {
    app = await createApp();
    adProvider = app.get<AdMobProvider>(AdMobProvider);
  });

  afterAll(async () => { await app.close(); });

  describe('POST /api/prompts/:slug/unlock', () => {
    it('400 — missing adToken is rejected', async () => {
      const cookie = await registerAndGetCookie(app, `unlock-notoken-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock`)
        .set('Cookie', cookie)
        .send({});  // no adToken

      expect(res.status).toBe(400);
    });

    it('401 — invalid adToken is rejected, no DB write', async () => {
      (adProvider.verifyCompletion as jest.Mock).mockResolvedValueOnce({ valid: false });
      const cookie = await registerAndGetCookie(app, `unlock-badtoken-${suffix}@example.com`);

      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock`)
        .set('Cookie', cookie)
        .send({ adToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });

    it('201 — valid token creates unlock row', async () => {
      (adProvider.verifyCompletion as jest.Mock).mockResolvedValueOnce({ valid: true });
      const cookie = await registerAndGetCookie(app, `unlock-valid-${suffix}@example.com`);

      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock`)
        .set('Cookie', cookie)
        .send({ adToken: 'valid-test-token' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('promptSlug', testSlug);
      expect(res.body.unlockedVia).toBe('ad');
    });

    it('201 — duplicate unlock attempt is idempotent (returns existing, no double-write)', async () => {
      (adProvider.verifyCompletion as jest.Mock).mockResolvedValue({ valid: true });
      const cookie = await registerAndGetCookie(app, `unlock-dupe-${suffix}@example.com`);
      const slug = `dupe-slug-${suffix}`;

      // First unlock
      const first = await request(app.getHttpServer())
        .post(`/api/prompts/${slug}/unlock`)
        .set('Cookie', cookie)
        .send({ adToken: 'valid-test-token' });
      expect(first.status).toBe(201);

      // Second unlock — same user, same slug
      const second = await request(app.getHttpServer())
        .post(`/api/prompts/${slug}/unlock`)
        .set('Cookie', cookie)
        .send({ adToken: 'valid-test-token' });
      expect(second.status).toBe(201);
      // Both should return the same unlock id (idempotent)
      expect(second.body.id).toBe(first.body.id);
    });

    it('401 — unauthenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock`)
        .send({ adToken: 'valid-test-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/prompts/:slug/unlock-intent', () => {
    it('201 — returns ad token for authenticated user', async () => {
      const cookie = await registerAndGetCookie(app, `intent-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock-intent`)
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/prompts/${testSlug}/unlock-intent`)
        .send({});
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/unlocks', () => {
    it('200 — returns user unlock list', async () => {
      const cookie = await registerAndGetCookie(app, `unlocks-list-${suffix}@example.com`);
      const res = await request(app.getHttpServer())
        .get('/api/unlocks')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('401 — unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get('/api/unlocks');
      expect(res.status).toBe(401);
    });
  });
});
