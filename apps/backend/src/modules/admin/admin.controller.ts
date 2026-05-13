import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin/prompts')
@UseGuards(RequiredAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getPrompts(@Query('status') status?: string) {
    return this.adminService.getAllPrompts(status);
  }

  @Get('pending')
  async getPending() {
    return this.adminService.getPendingPrompts();
  }

  @Post(':slug/approve')
  async approve(@Param('slug') slug: string) {
    return this.adminService.approvePrompt(slug);
  }

  @Post(':slug/reject')
  async reject(@Param('slug') slug: string) {
    return this.adminService.rejectPrompt(slug);
  }
}