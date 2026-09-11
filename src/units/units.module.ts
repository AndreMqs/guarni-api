import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Unit])],
})
export class UnitsModule {}
