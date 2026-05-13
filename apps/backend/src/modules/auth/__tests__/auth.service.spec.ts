import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { DB_KEY } from '../../db/db.module';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDbMock(overrides: Record<string, any> = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    set: jest.fn().mockReturnThis(),
    ...overrides,
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;
  let db: ReturnType<typeof makeDbMock>;

  beforeEach(async () => {
    db = makeDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DB_KEY, useValue: db },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------

  describe('register', () => {
    it('creates a new user and returns id + email', async () => {
      // No existing user
      db.limit.mockResolvedValueOnce([]);
      // Insert returns new user
      db.returning.mockResolvedValueOnce([{ id: 'uuid-1', email: 'test@example.com' }]);

      const result = await service.register('test@example.com', 'Password1');

      expect(result).toEqual({ id: 'uuid-1', email: 'test@example.com' });
    });

    it('throws UnauthorizedException for duplicate email', async () => {
      db.limit.mockResolvedValueOnce([{ id: 'existing', email: 'dupe@example.com' }]);

      await expect(service.register('dupe@example.com', 'Password1'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('returns user on valid credentials', async () => {
      // Pre-hash a known password to get a valid stored hash for testing
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('Password1', salt, 64).toString('hex');
      const storedHash = `${salt}:${hash}`;

      db.limit.mockResolvedValueOnce([
        { id: 'uuid-1', email: 'test@example.com', isAdmin: false, passwordHash: storedHash },
      ]);

      const result = await service.login('test@example.com', 'Password1');
      expect(result).toEqual({ id: 'uuid-1', email: 'test@example.com', isAdmin: false });
    });

    it('throws UnauthorizedException for unknown email', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(service.login('nobody@example.com', 'Password1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('CorrectPassword1', salt, 64).toString('hex');

      db.limit.mockResolvedValueOnce([
        { id: 'uuid-1', email: 'test@example.com', isAdmin: false, passwordHash: `${salt}:${hash}` },
      ]);

      await expect(service.login('test@example.com', 'WrongPassword1'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // getUser
  // -------------------------------------------------------------------------

  describe('getUser', () => {
    it('returns user by id', async () => {
      db.limit.mockResolvedValueOnce([{ id: 'uuid-1', email: 'test@example.com', isAdmin: false }]);

      const result = await service.getUser('uuid-1');
      expect(result).toEqual({ id: 'uuid-1', email: 'test@example.com', isAdmin: false });
    });

    it('throws NotFoundException for unknown id', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(service.getUser('no-such-id')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // hasActiveSubscription
  // -------------------------------------------------------------------------

  describe('hasActiveSubscription', () => {
    it('returns true for active subscription with future expiry', async () => {
      const future = new Date(Date.now() + 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: future }]);

      await expect(service.hasActiveSubscription('uuid-1')).resolves.toBe(true);
    });

    it('returns false for expired subscription', async () => {
      const past = new Date(Date.now() - 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: past }]);

      await expect(service.hasActiveSubscription('uuid-1')).resolves.toBe(false);
    });

    it('returns false when no subscription exists', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(service.hasActiveSubscription('uuid-1')).resolves.toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // canAccess
  // -------------------------------------------------------------------------

  describe('canAccess', () => {
    it('returns false for null userId', async () => {
      await expect(service.canAccess(null, 'some-slug')).resolves.toBe(false);
    });

    it('returns true when user has active subscription', async () => {
      const future = new Date(Date.now() + 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: future }]);

      await expect(service.canAccess('uuid-1', 'some-slug')).resolves.toBe(true);
    });

    it('returns true when user has unlock for the prompt', async () => {
      // No active subscription
      db.limit.mockResolvedValueOnce([]);
      // Has unlock — select returns rows, some() checks promptSlug
      db.limit.mockResolvedValueOnce([{ promptSlug: 'some-slug', userId: 'uuid-1' }]);

      await expect(service.canAccess('uuid-1', 'some-slug')).resolves.toBe(true);
    });

    it('returns false for authenticated user with no subscription and no unlock', async () => {
      db.limit.mockResolvedValueOnce([]); // no subscription
      db.limit.mockResolvedValueOnce([]); // no unlock

      await expect(service.canAccess('uuid-1', 'some-slug')).resolves.toBe(false);
    });
  });
});
