import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EntitlementService } from './entitlement.service';
import { UnlockService } from './unlock.service';
import { EntitlementGuard } from './entitlement.guard';
import { DatabaseModule } from '../db/db.module';

@Module({
  imports: [DatabaseModule, EventEmitterModule.forRoot()],
  providers: [EntitlementService, UnlockService, EntitlementGuard],
  exports: [EntitlementService, UnlockService, EntitlementGuard],
})
export class AccessModule {}
