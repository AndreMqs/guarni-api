import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationalDay } from './entities/operational-day.entity.js';
import { OperationalDaysService } from './operational-days.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OperationalDay])],
  providers: [OperationalDaysService],
  exports: [OperationalDaysService],
})
export class OperationalDaysModule {}
