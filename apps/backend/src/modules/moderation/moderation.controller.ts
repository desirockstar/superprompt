import { Controller, Get, Post, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('admin/prompts')
@UseGuards(AuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  async getPrompts(@Req() req: any, @Query('status') status?: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.moderationService.getAllPrompts(status);
  }

  @Get('pending')
  async getPending(@Req() req: any) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.moderationService.getPendingPrompts();
  }

  @Post(':slug/approve')
  async approve(@Req() req: any, @Param('slug') slug: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.moderationService.approvePrompt(slug);
  }

  @Post(':slug/reject')
  async reject(@Req() req: any, @Param('slug') slug: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.moderationService.rejectPrompt(slug);
  }
}
