import { Controller, Post, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { GradingService } from './grading.service';
import { RequiredAuthGuard } from '../../common/guards/auth.guard';

@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @UseGuards(RequiredAuthGuard)
  @Post('run')
  async triggerGrading(@Req() req: any) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return this.gradingService.triggerManualGrading();
  }

  @Get('status')
  async getStatus() {
    return { status: 'ok', message: 'Evaluation system ready' };
  }
}