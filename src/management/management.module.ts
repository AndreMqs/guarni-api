import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { OperationalDaysModule } from '../operational-days/operational-days.module.js';
import { ManagementController } from './management.controller.js';
import { ManagementService } from './management.service.js';

@Module({
  imports: [AuthModule, MembershipsModule, OperationalDaysModule],
  controllers: [ManagementController],
  providers: [ManagementService],
})
export class ManagementModule {}
