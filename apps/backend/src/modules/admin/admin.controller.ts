import { Controller, Get, Post, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('admin/prompts')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getPrompts(@Req() req: any, @Query('status') status?: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.adminService.getAllPrompts(status);
  }

  @Get('pending')
  async getPending(@Req() req: any) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.adminService.getPendingPrompts();
  }

  @Post(':slug/approve')
  async approve(@Req() req: any, @Param('slug') slug: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.adminService.approvePrompt(slug);
  }

  @Post(':slug/reject')
  async reject(@Req() req: any, @Param('slug') slug: string) {
    if (!req.user || !req.user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    return this.adminService.rejectPrompt(slug);
  }
}