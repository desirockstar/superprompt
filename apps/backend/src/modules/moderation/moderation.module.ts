import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { DatabaseModule } from '../db/db.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, EventEmitterModule.forRoot()],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
