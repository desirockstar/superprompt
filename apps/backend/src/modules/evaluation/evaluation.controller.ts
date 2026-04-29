import { Controller, Post, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { GradingScheduler } from './grading.scheduler';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('grading')
export class EvaluationController {
  constructor(private readonly scheduler: GradingScheduler) {}

  @UseGuards(RequiredAuthGuard)
  @Post('run')
  async triggerGrading(@Req() req: any) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return this.scheduler.triggerManualGrading();
  }

  @Get('status')
  async getStatus() {
    return { status: 'ok', message: 'Evaluation system ready' };
  }
}
