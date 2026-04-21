import { Controller, Get, Post, Put, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
    @Query('date') date?: string,
  ) {
    return this.promptService.findAll({ category, search, page, limit, rating, date });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const prompt = await this.promptService.findOne(id);
    const userId = req.user?.id;
    
    if (!userId) {
      return { ...prompt, content: undefined, preview: prompt.preview };
    }

    const hasAccess = await this.promptService.checkEntitlement(userId, id);
    if (!hasAccess) {
      return { ...prompt, content: undefined, preview: prompt.preview };
    }

    return prompt;
  }

  @Get(':id/version/:v')
  async getVersion(
    @Param('id') id: string,
    @Param('v') version: number,
    @Query('level') level: string = 'starter',
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    let hasAccess = false;

    if (userId) {
      hasAccess = await this.promptService.checkEntitlement(userId, id);
    }

    if (!hasAccess) {
      const preview = await this.promptService.getPreview(id, version);
      return { id, version, level, content: preview, locked: true };
    }

    const content = await this.promptService.getContent(id, level, version);
    return { id, version, level, content, locked: false };
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() body: { title: string; category: string; content: Record<string, string> }, @Req() req: any) {
    return this.promptService.create(body);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { content: Record<string, string> },
  ) {
    return this.promptService.update(id, body);
  }
}