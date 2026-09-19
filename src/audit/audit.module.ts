import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BusinessEvent } from '../business-events/entities/business-event.entity.js';
import { TaskEvidence } from '../evidence/entities/task-evidence.entity.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEvent, TaskEvidence]),
    AuthModule,
    MembershipsModule,
  ],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
