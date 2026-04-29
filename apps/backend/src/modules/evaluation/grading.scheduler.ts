import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GradingOrchestrator } from './grading.orchestrator';

@Injectable()
export class GradingScheduler {
  constructor(private readonly orchestrator: GradingOrchestrator) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async runScheduledGrading() {
    await this.orchestrator.runGrading('system');
  }

  async triggerManualGrading() {
    return this.orchestrator.runGrading('admin');
  }
}
