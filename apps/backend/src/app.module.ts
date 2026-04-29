import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './modules/db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './modules/cache/cache.module';
import { AdModule } from './modules/ad/ad.module';
import { RatingModule } from './modules/rating/rating.module';
import { BillingModule } from './modules/billing/billing.module';

// DDD Bounded Context Modules
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { AccessModule } from './modules/access/access.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ModerationModule } from './modules/moderation/moderation.module';

// Legacy modules (kept for backwards compatibility during migration)
import { PromptModule } from './modules/prompt/prompt.module';
import { UnlockModule } from './modules/unlock/unlock.module';
import { GradingModule } from './modules/grading/grading.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UserModule,
    CacheModule,
    AdModule,
    RatingModule,
    BillingModule,

    // New DDD Bounded Contexts
    EvaluationModule,
    AccessModule,
    CatalogModule,
    ModerationModule,

    // Legacy modules (can be removed once all consumers migrate to new BCs)
    PromptModule,
    UnlockModule,
    GradingModule,
    AdminModule,
  ],
})
export class AppModule {}