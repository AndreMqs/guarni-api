import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { Unit } from './entities/unit.entity.js';
import { UnitsController } from './units.controller.js';
import { UnitsService } from './units.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Unit]), AuthModule, MembershipsModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
