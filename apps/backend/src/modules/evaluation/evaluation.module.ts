import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EvaluationController } from './evaluation.controller';
import { GradingOrchestrator } from './grading.orchestrator';
import { GradingScheduler } from './grading.scheduler';
import { RubricService } from './rubric.service';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationEventListener } from './evaluation.event-listener';
import { GroqAdapter } from './adapters/groq.adapter';
import { MockLLMAdapter } from './adapters/mock.adapter';
import { LLM_EVALUATOR } from './ports/llm-evaluator.port';
import { DatabaseModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, ConfigModule, EventEmitterModule.forRoot()],
  controllers: [EvaluationController],
  providers: [
    GradingOrchestrator,
    GradingScheduler,
    RubricService,
    EvaluationRepository,
    EvaluationEventListener,
    {
      provide: LLM_EVALUATOR,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const groqApiKey = config.get('GROQ_API_KEY');
        if (groqApiKey) {
          return new GroqAdapter(config);
        }
        return new MockLLMAdapter();
      },
    },
  ],
  exports: [EvaluationRepository, RubricService, GradingScheduler],
})
export class EvaluationModule {}
