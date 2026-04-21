import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/db/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { UnlockModule } from './modules/unlock/unlock.module';
import { BillingModule } from './modules/billing/billing.module';
import { RatingModule } from './modules/rating/rating.module';
import { GradingModule } from './modules/grading/grading.module';
import { AdminModule } from './modules/admin/admin.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UserModule,
    PromptModule,
    UnlockModule,
    BillingModule,
    RatingModule,
    GradingModule,
    AdminModule,
    CacheModule,
  ],
})
export class AppModule {}