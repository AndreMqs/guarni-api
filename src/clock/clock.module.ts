import { Module } from '@nestjs/common';
import { ClockService } from './clock.service.js';

@Module({
  providers: [ClockService],
  exports: [ClockService],
})
export class ClockModule {}
