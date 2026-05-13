import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementService } from '../entitlement.service';
import { DB_KEY } from '../../db/db.module';

function makeDbMock() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  };
  return chain;
}

describe('EntitlementService', () => {
  let service: EntitlementService;
  let db: ReturnType<typeof makeDbMock>;

  beforeEach(async () => {
    db = makeDbMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        { provide: DB_KEY, useValue: db },
      ],
    }).compile();
    service = module.get<EntitlementService>(EntitlementService);
  });

  // -------------------------------------------------------------------------
  // hasActiveSubscription
  // -------------------------------------------------------------------------

  describe('hasActiveSubscription', () => {
    it('returns true for active subscription with future expiry', async () => {
      const future = new Date(Date.now() + 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: future }]);

      await expect(service.hasActiveSubscription('user-1')).resolves.toBe(true);
    });

    it('returns false when subscription status is not active', async () => {
      const future = new Date(Date.now() + 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'canceled', expiresAt: future }]);

      await expect(service.hasActiveSubscription('user-1')).resolves.toBe(false);
    });

    it('returns false when expiry is in the past', async () => {
      const past = new Date(Date.now() - 86_400_000);
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: past }]);

      await expect(service.hasActiveSubscription('user-1')).resolves.toBe(false);
    });

    it('returns false when no subscription row exists', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(service.hasActiveSubscription('user-1')).resolves.toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // hasUnlock
  // -------------------------------------------------------------------------

  describe('hasUnlock', () => {
    it('returns true when unlock row exists', async () => {
      db.limit.mockResolvedValueOnce([{ userId: 'user-1', promptSlug: 'test-prompt' }]);

      await expect(service.hasUnlock('user-1', 'test-prompt')).resolves.toBe(true);
    });

    it('returns false when no unlock row exists', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(service.hasUnlock('user-1', 'test-prompt')).resolves.toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // canAccess — the spec's non-negotiable scenarios
  // -------------------------------------------------------------------------

  describe('canAccess', () => {
    it('returns true for active subscriber', async () => {
      const future = new Date(Date.now() + 86_400_000);
      // hasActiveSubscription call
      db.limit.mockResolvedValueOnce([{ status: 'active', expiresAt: future }]);
      // hasUnlock call (not reached due to short-circuit, but mock anyway)
      db.limit.mockResolvedValueOnce([]);

      const result = await service.checkEntitlement('user-1', 'any-slug');
      expect(result.hasAccess).toBe(true);
      expect(result.hasSubscription).toBe(true);
    });

    it('returns true for user with existing unlock row (no subscription)', async () => {
      // No active subscription
      db.limit.mockResolvedValueOnce([]);
      // Has unlock
      db.limit.mockResolvedValueOnce([{ userId: 'user-1', promptSlug: 'test-prompt' }]);

      const result = await service.checkEntitlement('user-1', 'test-prompt');
      expect(result.hasAccess).toBe(true);
      expect(result.hasUnlock).toBe(true);
    });

    it('returns false for authenticated user with neither subscription nor unlock', async () => {
      db.limit.mockResolvedValueOnce([]); // no subscription
      db.limit.mockResolvedValueOnce([]); // no unlock

      const result = await service.checkEntitlement('user-1', 'test-prompt');
      expect(result.hasAccess).toBe(false);
      expect(result.hasSubscription).toBe(false);
      expect(result.hasUnlock).toBe(false);
    });

    it('canAccess returns false for unauthenticated user (empty string userId)', async () => {
      // canAccess with empty string still queries DB — both return nothing
      db.limit.mockResolvedValueOnce([]);
      db.limit.mockResolvedValueOnce([]);

      const result = await service.canAccess('', 'test-prompt');
      expect(result).toBe(false);
    });
  });
});
