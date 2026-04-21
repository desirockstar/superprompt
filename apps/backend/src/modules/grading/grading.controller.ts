import { forwardRef, Inject, Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { GradingService } from './grading.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @UseGuards(AuthGuard)
  @Post('run')
  async triggerGrading(@Req() req: any) {
    if (!req.user.isAdmin) {
      throw new Error('Admin access required');
    }
    return this.gradingService.triggerManualGrading();
  }

  @Get('status')
  async getStatus() {
    return { status: 'ok' };
  }
}