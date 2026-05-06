import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ViewCounterService } from './view-counter.service';
import { AuthGuard, RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('prompts')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly viewCounter: ViewCounterService,
  ) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
    @Query('date') date?: string,
    @Query('tier') tier?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.catalogService.findAll({ 
      category, 
      search, 
      page: pageNum, 
      limit: limitNum, 
      rating: rating ? parseInt(rating, 10) : undefined, 
      date, 
      tier 
    });
  }

  @Get(':slug/preview')
  async getPreview(@Param('slug') slug: string) {
    const prompt = await this.catalogService.findOne(slug, false);
    return {
      slug: prompt.slug,
      title: prompt.title,
      category: prompt.category,
      status: prompt.status,
      basePath: prompt.basePath,
      currentVersion: prompt.currentVersion,
      isMultiVersion: prompt.isMultiVersion,
      createdAt: prompt.createdAt,
      preview: prompt.preview,
    };
  }

  @UseGuards(AuthGuard)
  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    const isLoggedIn = !!userId;

    this.viewCounter.increment(slug);

    const entitlement = isLoggedIn
      ? await this.catalogService.checkEntitlement(userId, slug)
      : { hasAccess: false, hasSubscription: false, hasUnlock: false };

    const prompt = await this.catalogService.findOne(slug, false);
    prompt.isLoggedIn = isLoggedIn;

    if (!isLoggedIn) {
      return { ...prompt, content: undefined };
    }

    const fullContent = await this.catalogService.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);

    if (!entitlement.hasAccess) {
      const { super: _, ...filteredContent } = fullContent;
      return { ...prompt, content: filteredContent };
    }

    return { ...prompt, content: fullContent };
  }

  @Get(':slug/version/:v')
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
      const entitlement = await this.catalogService.checkEntitlement(userId, slug);
      hasAccess = entitlement.hasAccess;
    }

    return { prompt, hasAccess };
  }

  @Get(':slug/evaluation')
  async getEvaluation(@Param('slug') slug: string) {
    return this.catalogService.getEvaluation(slug);
  }

  @Get(':slug/related')
  async getRelated(
    @Param('slug') slug: string,
    @Query('limit') limit: number = 3,
  ) {
    return this.catalogService.getRelatedPrompts(slug, limit);
  }

  @UseGuards(RequiredAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: { title: string; category: string; content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.createWithUser(req.user.id, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Put(':slug')
  async update(@Param('slug') slug: string, @Body() body: { content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.update(slug, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Get('user/my-prompts')
  async getMyPrompts(@Req() req: any) {
    return this.catalogService.findByUser(req.user.id);
  }
}
