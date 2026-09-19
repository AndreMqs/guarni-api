import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { TaskEvidence } from './entities/task-evidence.entity.js';
import { EvidenceController } from './evidence.controller.js';
import { EvidenceService } from './evidence.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEvidence]), AuthModule, MembershipsModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
