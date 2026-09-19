import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEvent } from './entities/business-event.entity.js';
import { BusinessEventsService } from './business-events.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEvent])],
  providers: [BusinessEventsService],
  exports: [BusinessEventsService],
})
export class BusinessEventsModule {}
