import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromptService } from './prompt.service';
import { AuthGuard, RequiredAuthGuard } from '../../common/guards/auth.guard';

@ApiTags('User Prompts')
@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get(':id/preview')
  async getPreview(@Param('id') id: string) {
    const prompt = await this.promptService.findOne(id, false);
    return {
      id: prompt.id,
      title: prompt.title,
      status: prompt.status,
      basePath: prompt.basePath,
      currentVersion: prompt.currentVersion,
      isMultiVersion: prompt.isMultiVersion,
      createdAt: prompt.createdAt,
      preview: prompt.preview,
      tier: prompt.complexityTier || null,
    };
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const isLoggedIn = !!userId;
    
    const entitlement = isLoggedIn 
      ? await this.promptService.checkEntitlement(userId, id)
      : { hasAccess: false, hasSubscription: false, hasUnlock: false };
    
    const prompt = await this.promptService.findOne(id, false);
    prompt.isLoggedIn = isLoggedIn;
    
    if (!isLoggedIn) {
      return { ...prompt, content: undefined };
    }

    const fullContent = await this.promptService.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    
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
    const prompt = await this.promptService.findOne(id);
    const userId = req.user?.id;
    let hasAccess = false;

    if (userId) {
      const entitlement = await this.promptService.checkEntitlement(userId, id);
      hasAccess = entitlement.hasAccess;
    }

    if (!hasAccess) {
      const preview = await this.promptService.getPreview(prompt.basePath, version, prompt.isMultiVersion);
      return { id, version, level, content: preview, locked: true };
    }

    const content = await this.promptService.getContentByPath(prompt.basePath, level, version);
    return { id, version, level, content, locked: false };
  }

  @UseGuards(RequiredAuthGuard)
  @Get('my')
  async getMyPrompts(@Req() req: any) {
    return this.promptService.findByUser(req.user.id);
  }

  @UseGuards(RequiredAuthGuard)
  @Post()
  async create(@Body() body: { title: string; categoryIds: string[]; content: Record<string, string>; isMultiVersion?: boolean }, @Req() req: any) {
    return this.promptService.createWithUser(req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { content: Record<string, string>; isMultiVersion?: boolean },
  ) {
    return this.promptService.updateWithUser(id, body);
  }
}