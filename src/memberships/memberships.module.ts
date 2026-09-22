import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Unit } from '../units/entities/unit.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Membership } from './entities/membership.entity.js';
import { UnitMembershipGuard } from './guards/unit-membership.guard.js';
import { MembershipsController } from './memberships.controller.js';
import { MembershipsService } from './memberships.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, User, Unit]), AuthModule],
  controllers: [MembershipsController],
  providers: [MembershipsService, UnitMembershipGuard],
  exports: [MembershipsService, UnitMembershipGuard, TypeOrmModule],
})
export class MembershipsModule {}
