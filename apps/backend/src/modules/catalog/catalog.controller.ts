import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { ViewCounterService } from './view-counter.service';
import { EntitlementService } from '../access/entitlement.service';
import { AuthGuard, RequiredAuthGuard } from '../../common/guards/auth.guard';
import { UnlockService } from '../unlock/unlock.service';
import { RatingService } from '../rating/rating.service';
import { AdMobProvider } from '../ad/ad.provider';

@ApiTags('Prompts')
@Controller('prompts')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly viewCounter: ViewCounterService,
    private readonly entitlementService: EntitlementService,
    private readonly unlockService: UnlockService,
    private readonly ratingService: RatingService,
    private readonly adProvider: AdMobProvider,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories', description: 'Returns list of all prompt categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully', schema: { example: [{ id: 'uuid', name: 'Marketing', slug: 'marketing' }] } })
  async getCategories() {
    return this.catalogService.getDistinctCategories();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags', description: 'Returns list of all prompt tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getTags() {
    return this.catalogService.getDistinctTags();
  }

  @Get()
  @ApiOperation({ summary: 'List all prompts', description: 'Returns paginated list of approved prompts with optional filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category name' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag name' })
  @ApiQuery({ name: 'search', required: false, description: 'Search prompts by title' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 100)', example: '20' })
  @ApiQuery({ name: 'tier', required: false, description: 'Filter by tier: starter, builder, pro, super' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort by: newest, oldest, popular' })
  @ApiQuery({ name: 'fields', required: false, description: 'Comma-separated fields to return' })
  @ApiResponse({ status: 200, description: 'Prompts retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async findAll(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
    @Query('date') date?: string,
    @Query('tier') tier?: string,
    @Query('fields') fields?: string,
    @Query('sort') sort?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const fieldList = fields ? fields.split(',').map(f => f.trim()) : undefined;
    return this.catalogService.findAll({ 
      category,
      tag,
      search, 
      page: pageNum, 
      limit: limitNum, 
      rating: rating ? parseInt(rating, 10) : undefined, 
      date, 
      tier,
      fields: fieldList,
      sort,
    });
  }

  @Get(':slug/preview')
  @ApiOperation({ summary: 'Get prompt preview', description: 'Returns preview content without full access' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiResponse({ status: 200, description: 'Preview retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async getPreview(@Param('slug') slug: string) {
    const prompt = await this.catalogService.findOne(slug, false);
    const { categoryIds, tagIds, ...rest } = prompt;
    return {
      ...rest,
      categoryNames: prompt.categoryNames || [],
      tagNames: prompt.tagNames || [],
    };
  }

  @UseGuards(AuthGuard)
  @Get(':slug')
  @ApiOperation({ summary: 'Get prompt details', description: 'Returns full prompt content if user has access (subscription or unlocked)' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Prompt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  
  async findOne(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    const isLoggedIn = !!userId;

    this.viewCounter.increment(slug);

    const entitlement = isLoggedIn
      ? await this.entitlementService.checkEntitlement(userId, slug)
      : { hasAccess: false, hasSubscription: false, hasUnlock: false };

    const prompt = await this.catalogService.findOne(slug, false);
    prompt.isLoggedIn = isLoggedIn;
    const { categoryIds, tagIds, ...promptWithoutCategoryIds } = prompt;

    if (!isLoggedIn) {
      return { ...promptWithoutCategoryIds, content: undefined };
    }

    const fullContent = await this.catalogService.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);

    if (!entitlement.hasAccess) {
      const { super: _, ...filteredContent } = fullContent;
      return { ...promptWithoutCategoryIds, content: filteredContent };
    }

    return { ...promptWithoutCategoryIds, content: fullContent };
  }

  @Get(':slug/version/:v')
  @ApiOperation({ summary: 'Get specific prompt version', description: 'Returns a specific version of a prompt' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiParam({ name: 'v', description: 'Version number', example: 1 })
  @ApiQuery({ name: 'level', required: false, description: 'Content tier: starter, builder, pro, super', example: 'starter' })
  @ApiResponse({ status: 200, description: 'Version retrieved successfully' })
  async getVersion(
    @Param('slug') slug: string,
    @Param('v') version: number,
    @Query('level') level: string = 'starter',
    @Req() req: any,
  ) {
    const prompt = await this.catalogService.findOne(slug);
    const userId = req.user?.id;
    let hasAccess = false;

    if (userId) {
      const entitlement = await this.entitlementService.checkEntitlement(userId, slug);
      hasAccess = entitlement.hasAccess;
    }

    return { prompt, hasAccess };
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related prompts', description: 'Returns prompts related to the given slug' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of related prompts', example: 3 })
  @ApiResponse({ status: 200, description: 'Related prompts retrieved' })
  async getRelated(
    @Param('slug') slug: string,
    @Query('limit') limit: number = 3,
  ) {
    return this.catalogService.getRelatedPrompts(slug, limit);
  }

  @UseGuards(RequiredAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create new prompt', description: 'Creates a new prompt (requires authentication)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Prompt created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() req: any, @Body() body: { title: string; categoryId?: string; categoryIds?: string[]; tagIds?: string[]; content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.createWithUser(req.user.id, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Put(':slug')
  @ApiOperation({ summary: 'Update prompt', description: 'Updates an existing prompt (requires authentication)' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Prompt updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async update(@Param('slug') slug: string, @Body() body: { content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.update(slug, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Get('user/my-prompts')
  @ApiOperation({ summary: 'Get user prompts', description: 'Returns prompts created by the authenticated user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User prompts retrieved' })
  async getMyPrompts(@Req() req: any) {
    return this.catalogService.findByUser(req.user.id);
  }

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/unlock')
  @ApiOperation({ summary: 'Unlock prompt with ad', description: 'Unlocks a prompt by verifying ad completion token' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiBearerAuth()
  @ApiResponse({ status:200, description: 'Prompt unlocked successfully' })
  @ApiResponse({ status: 400, description: 'Ad token required' })
  @ApiResponse({ status: 401, description: 'Invalid ad token' })
  async unlockPrompt(
    @Param('slug') slug: string,
    @Body() body: { adToken: string },
    @Req() req: any,
  ) {
    if (!body.adToken) {
      throw new BadRequestException('Ad token required');
    }
    const userId = req.user.id;
    const verification = await this.adProvider.verifyCompletion(body.adToken);
    if (!verification.valid) {
      throw new UnauthorizedException('Invalid ad token');
    }
    const unlocked = await this.unlockService.unlockViaAd(userId, slug);
    return { ...unlocked, unlockedVia: 'ad' };
  }

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/unlock-intent')
  @ApiOperation({ summary: 'Start unlock process', description: 'Initiates ad-based unlock process and returns ad token' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Ad token returned', schema: { example: { token: 'ad-token-xyz' } } })
  async startUnlock(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const adData = await this.adProvider.loadAd(userId, slug);
    return { token: adData.token };
  }

  @UseGuards(RequiredAuthGuard)
  @Post(':slug/rate')
  @ApiOperation({ summary: 'Rate a prompt', description: 'Submit a rating for a prompt (1-5 stars)' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Rating submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating value' })
  async submitRating(
    @Param('slug') slug: string,
    @Body() body: { rating: number },
    @Req() req: any,
  ) {
    return this.ratingService.submitRating(req.user.id, slug, body.rating);
  }

  @Get(':slug/rating')
  @ApiOperation({ summary: 'Get prompt rating', description: 'Returns the average rating for a prompt' })
  @ApiParam({ name: 'slug', description: 'Prompt slug' })
  @ApiResponse({ status: 200, description: 'Rating retrieved successfully' })
  async getRating(@Param('slug') slug: string) {
    return this.ratingService.getRating(slug);
  }
}
