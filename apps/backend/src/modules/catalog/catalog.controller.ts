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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
    @Query('date') date?: string,
    @Query('tier') tier?: string,
  ) {
    return this.catalogService.findAll({ category, search, page, limit, rating, date, tier });
  }

  @Get(':id/preview')
  async getPreview(@Param('id') id: string) {
    const prompt = await this.catalogService.findOne(id, false);
    return {
      id: prompt.id,
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
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const isLoggedIn = !!userId;

    this.viewCounter.increment(id);

    const entitlement = isLoggedIn
      ? await this.catalogService.checkEntitlement(userId, id)
      : { hasAccess: false, hasSubscription: false, hasUnlock: false };

    const prompt = await this.catalogService.findOne(id, false);
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

  @Get(':id/version/:v')
  async getVersion(
    @Param('id') id: string,
    @Param('v') version: number,
    @Query('level') level: string = 'starter',
    @Req() req: any,
  ) {
    const prompt = await this.catalogService.findOne(id);
    const userId = req.user?.id;
    let hasAccess = false;

    if (userId) {
      const entitlement = await this.catalogService.checkEntitlement(userId, id);
      hasAccess = entitlement.hasAccess;
    }

    return { prompt, hasAccess };
  }

  @Get(':id/evaluation')
  async getEvaluation(@Param('id') id: string) {
    return this.catalogService.getEvaluation(id);
  }

  @UseGuards(RequiredAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: { title: string; category: string; content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.createWithUser(req.user.id, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { content: Record<string, string>; isMultiVersion?: boolean }) {
    return this.catalogService.update(id, body);
  }

  @UseGuards(RequiredAuthGuard)
  @Get('user/my-prompts')
  async getMyPrompts(@Req() req: any) {
    return this.catalogService.findByUser(req.user.id);
  }
}
