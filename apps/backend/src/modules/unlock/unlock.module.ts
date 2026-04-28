import { Module } from '@nestjs/common';
import { UnlockController, UnlocksController } from './unlock.controller';
import { UnlockService } from './unlock.service';
import { DatabaseModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';
import { AdModule } from '../ad/ad.module';

@Module({
  imports: [DatabaseModule, AuthModule, AdModule],
  controllers: [UnlockController, UnlocksController],
  providers: [UnlockService],
  exports: [UnlockService],
})
export class UnlockModule {}