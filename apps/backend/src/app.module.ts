import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './modules/db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './modules/cache/cache.module';
import { AdModule } from './modules/ad/ad.module';
import { RatingModule } from './modules/rating/rating.module';
import { BillingModule } from './modules/billing/billing.module';

import { AccessModule } from './modules/access/access.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ModerationModule } from './modules/moderation/moderation.module';

import { UnlockModule } from './modules/unlock/unlock.module';
import { AdminModule } from './modules/admin/admin.module';

import { HealthController } from './common/controllers/health.controller';
import { DebugController } from './common/controllers/debug.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UserModule,
    CacheModule,
    AdModule,
    BillingModule,

    AccessModule,
    CatalogModule,
    ModerationModule,

    UnlockModule,
    AdminModule,
  ],
  controllers: [HealthController, DebugController],
})
export class AppModule {}