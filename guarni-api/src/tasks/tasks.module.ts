import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BusinessEventsModule } from '../business-events/business-events.module.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { OperationalDaysModule } from '../operational-days/operational-days.module.js';
import { TaskExecution } from './entities/task-execution.entity.js';
import { Task } from './entities/task.entity.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskExecution]),
    AuthModule,
    MembershipsModule,
    OperationalDaysModule,
    BusinessEventsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
