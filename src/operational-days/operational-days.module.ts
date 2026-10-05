import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationalDay } from './entities/operational-day.entity.js';
import { OperationalDaysService } from './operational-days.service.js';
import { ClockModule } from '../clock/clock.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([OperationalDay]), ClockModule],
  providers: [OperationalDaysService],
  exports: [OperationalDaysService],
})
export class OperationalDaysModule {}
