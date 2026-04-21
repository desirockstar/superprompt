import { Module } from '@nestjs/common';
import { UnlockController } from './unlock.controller';
import { UnlockService } from './unlock.service';
import { DatabaseModule } from '../db/db.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UnlockController],
  providers: [UnlockService],
  exports: [UnlockService],
})
export class UnlockModule {}