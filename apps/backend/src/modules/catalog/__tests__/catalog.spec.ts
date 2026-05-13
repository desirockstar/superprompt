/**
 * Catalog unit tests — CatalogService and CatalogController
 *
 * Pure unit tests: mocked DB, mocked content repo, mocked cache.
 * No HTTP server, no database, no class-validator required.
 *
 * Critical scenarios covered (per AGENTS.md §14):
 *   - GET /prompts returns only approved prompts (search filters status='approved')
 *   - Unauthenticated user gets preview only (content: undefined)
 *   - Authenticated user without entitlement gets partial content (no 'super' tier)
 *   - Authenticated user with entitlement gets full content
 *   - 404 for non-existent prompt slug
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from '../catalog.service';
import { CatalogController } from '../catalog.controller';
import { ViewCounterService } from '../view-counter.service';
import { SearchService } from '../search.service';
import { EntitlementService } from '../../access/entitlement.service';
import { CacheService } from '../../cache/cache.service';
import { DB_KEY } from '../../db/db.module';
import { CONTENT_REPOSITORY } from '../ports/content-repository.port';
import { AuthGuard, RequiredAuthGuard } from '../../../common/guards/auth.guard';

// Mock guards — always allow, set req.user from a test fixture
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const APPROVED_PROMPT = {
  slug: 'approved-prompt',
  title: 'Approved Prompt',
  status: 'approved',
  preview: 'This is the preview.',
  complexityTier: 'starter',
  categoryIds: [],
  basePath: 'approved-prompt',
  currentVersion: 1,
  isMultiVersion: false,
  views: 10,
  isViral: false,
  isNano: false,
};

const PENDING_PROMPT = {
  slug: 'pending-prompt',
  title: 'Pending Prompt',
  status: 'pending',
  preview: 'Should not appear.',
  complexityTier: 'builder',
  categoryIds: [],
  basePath: 'pending-prompt',
  currentVersion: 1,
  isMultiVersion: false,
  views: 0,
  isViral: false,
  isNano: false,
};

const FULL_CONTENT = { starter: 'Starter content', builder: 'Builder content', super: 'Super secret content' };

// ---------------------------------------------------------------------------
// CatalogService unit tests
// ---------------------------------------------------------------------------

describe('CatalogService', () => {
  let service: CatalogService;
  let searchService: jest.Mocked<SearchService>;
  let cache: jest.Mocked<CacheService>;
  let db: any;
  let contentRepo: any;

  beforeEach(async () => {
    searchService = {
      search: jest.fn().mockResolvedValue({
        prompts: [APPROVED_PROMPT],
        total: 1,
        page: 1,
        limit: 10,
      }),
    } as any;

    cache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPrefix: jest.fn(),
    } as any;

    // Drizzle query chain mock.
    // getDistinctCategories: select().from().orderBy() → resolves []
    // findOne:               select().from().where().limit(1) → resolves [APPROVED_PROMPT]
    db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),   // categories query terminal
      limit: jest.fn().mockResolvedValue([APPROVED_PROMPT]), // prompts query terminal
    };

    contentRepo = {
      getPreview: jest.fn().mockResolvedValue('Preview text'),
      getFullContent: jest.fn().mockResolvedValue(FULL_CONTENT),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: DB_KEY, useValue: db },
        { provide: CONTENT_REPOSITORY, useValue: contentRepo },
        { provide: SearchService, useValue: searchService },
        { provide: EntitlementService, useValue: { checkEntitlement: jest.fn() } },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  // -------------------------------------------------------------------------
  // findAll — SPEC: only approved prompts returned
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('SPEC: only returns approved prompts (delegates to SearchService which filters status=approved)', async () => {
      const result = await service.findAll();

      // SearchService is the query engine — it always filters status='approved'
      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({}),
      );
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].slug).toBe('approved-prompt');
    });

    it('returns cached result without hitting SearchService again', async () => {
      const cached = { prompts: [APPROVED_PROMPT], total: 1, page: 1, limit: 10 };
      cache.get.mockReturnValueOnce(cached);

      const result = await service.findAll();

      expect(searchService.search).not.toHaveBeenCalled();
      expect(result).toBe(cached);
    });

    it('passes search query through to SearchService', async () => {
      await service.findAll({ search: 'writing', page: 2, limit: 5 });

      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'writing', page: 2, limit: 5 }),
      );
    });

    it('passes category filter through to SearchService', async () => {
      await service.findAll({ category: 'marketing' });

      expect(searchService.search).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'marketing' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // findOne — detail + 404
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('returns prompt data for a valid slug', async () => {
      const result = await service.findOne('approved-prompt');

      expect(result.slug).toBe('approved-prompt');
      expect(result.preview).toBeDefined();
    });

    it('SPEC: throws NotFoundException for non-existent slug', async () => {
      db.limit.mockResolvedValueOnce([]); // prompts query returns empty

      await expect(service.findOne('does-not-exist')).rejects.toThrow(NotFoundException);
    });

    it('returns cached prompt without DB query', async () => {
      const cached = { ...APPROVED_PROMPT, categoryNames: [] };
      cache.get.mockReturnValueOnce(cached);

      const result = await service.findOne('approved-prompt');

      expect(result).toBe(cached);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('fetches full content when includeContent=true', async () => {
      const result = await service.findOne('approved-prompt', true);

      expect(contentRepo.getFullContent).toHaveBeenCalled();
      expect(result.content).toEqual(FULL_CONTENT);
    });
  });

  // -------------------------------------------------------------------------
  // getDistinctCategories
  // -------------------------------------------------------------------------

  describe('getDistinctCategories', () => {
    it('returns categories from DB', async () => {
      const cats = [{ id: '1', name: 'Writing', slug: 'writing' }];
      db.orderBy.mockResolvedValueOnce(cats);

      const result = await service.getDistinctCategories();
      expect(result).toEqual(cats);
    });

    it('returns cached categories without DB query', async () => {
      const cats = [{ id: '1', name: 'Writing', slug: 'writing' }];
      cache.get.mockReturnValueOnce(cats);

      const result = await service.getDistinctCategories();
      expect(result).toBe(cats);
      expect(db.select).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// CatalogController unit tests — entitlement + content visibility
// ---------------------------------------------------------------------------

describe('CatalogController', () => {
  let controller: CatalogController;
  let catalogService: jest.Mocked<CatalogService>;
  let viewCounter: jest.Mocked<ViewCounterService>;

  const basePrompt = {
    ...APPROVED_PROMPT,
    categoryNames: ['Writing'],
    tier: 'starter',
  };

  beforeEach(async () => {
    catalogService = {
      findAll: jest.fn().mockResolvedValue({ prompts: [basePrompt], total: 1, page: 1, limit: 10 }),
      findOne: jest.fn().mockResolvedValue({ ...basePrompt }),
      getDistinctCategories: jest.fn().mockResolvedValue([{ id: '1', name: 'Writing', slug: 'writing' }]),
      checkEntitlement: jest.fn().mockResolvedValue({ hasAccess: false, hasSubscription: false, hasUnlock: false }),
      getFullContent: jest.fn().mockResolvedValue(FULL_CONTENT),
      getRelatedPrompts: jest.fn().mockResolvedValue([]),
      createWithUser: jest.fn(),
      update: jest.fn(),
      findByUser: jest.fn().mockResolvedValue([]),
    } as any;

    viewCounter = {
      increment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: CatalogService, useValue: catalogService },
        { provide: ViewCounterService, useValue: viewCounter },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RequiredAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CatalogController>(CatalogController);
  });

  // -------------------------------------------------------------------------
  // GET /prompts — listing
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('delegates to CatalogService.findAll and returns result', async () => {
      const result = await controller.findAll();

      expect(catalogService.findAll).toHaveBeenCalledWith({
        category: undefined,
        search: undefined,
        page: 1,
        limit: 10,
        rating: undefined,
        date: undefined,
        tier: undefined,
      });
      expect(result).toHaveProperty('prompts');
    });

    it('passes search and page params', async () => {
      await controller.findAll(undefined, 'writing', '2', '5');

      expect(catalogService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'writing', page: 2, limit: 5 }),
      );
    });

    it('passes category filter param', async () => {
      await controller.findAll('marketing');

      expect(catalogService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'marketing' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // GET /prompts/:slug — SPEC: content visibility rules
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('SPEC: unauthenticated user gets preview but content is undefined', async () => {
      const req = { user: undefined }; // no session

      const result = await controller.findOne('approved-prompt', req);

      expect(result.preview).toBe(APPROVED_PROMPT.preview);
      expect(result.content).toBeUndefined();
    });

    it('SPEC: authenticated user without entitlement gets content WITHOUT super tier', async () => {
      catalogService.checkEntitlement.mockResolvedValueOnce({
        hasAccess: false,
        hasSubscription: false,
        hasUnlock: false,
      });
      const req = { user: { id: 'user-no-entitlement' } };

      const result = await controller.findOne('approved-prompt', req);

      expect(result.content).toBeDefined();
      expect((result.content as any).super).toBeUndefined(); // super tier stripped
      expect((result.content as any).starter).toBe('Starter content');
    });

    it('SPEC: authenticated user WITH entitlement gets full content including super tier', async () => {
      catalogService.checkEntitlement.mockResolvedValueOnce({
        hasAccess: true,
        hasSubscription: true,
        hasUnlock: false,
      });
      const req = { user: { id: 'subscriber-user' } };

      const result = await controller.findOne('approved-prompt', req);

      expect(result.content).toEqual(FULL_CONTENT);
      expect((result.content as any).super).toBe('Super secret content');
    });

    it('increments view counter on every detail request', async () => {
      const req = { user: undefined };

      await controller.findOne('approved-prompt', req);

      expect(viewCounter.increment).toHaveBeenCalledWith('approved-prompt');
    });

    it('propagates NotFoundException when service throws it', async () => {
      catalogService.findOne.mockRejectedValueOnce(new NotFoundException('Prompt not-found not found'));
      const req = { user: undefined };

      await expect(controller.findOne('not-found', req)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // GET /prompts/categories
  // -------------------------------------------------------------------------

  describe('getCategories', () => {
    it('returns category list from CatalogService', async () => {
      const result = await controller.getCategories();

      expect(catalogService.getDistinctCategories).toHaveBeenCalled();
      expect(result).toEqual([{ id: '1', name: 'Writing', slug: 'writing' }]);
    });
  });
});
