import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { CopyTaskDto } from './dto/copy-task.dto.js';
import { CorrectTaskDto } from './dto/correct-task.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ExecuteTaskDto } from './dto/execute-task.dto.js';
import { ListTaskCatalogQueryDto } from './dto/list-task-catalog-query.dto.js';
import { TakeoverTaskDto } from './dto/takeover-task.dto.js';
import { TasksByDateQueryDto } from './dto/tasks-by-date-query.dto.js';
import { TodayTasksQueryDto } from './dto/today-tasks-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  catalog(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Query() query: ListTaskCatalogQueryDto) {
    return this.tasksService.catalog(unitId, query);
  }

  @Get('by-date')
  byDate(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Query() query: TasksByDateQueryDto) {
    return this.tasksService.byDate(unitId, query);
  }

  @Get('today')
  today(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Query() query: TodayTasksQueryDto) {
    return this.tasksService.today(unitId, query);
  }

  @Get(':taskId')
  getById(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string) {
    return this.tasksService.getById(unitId, taskId);
  }

  @Post()
  create(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(unitId, dto);
  }

  @Patch(':taskId')
  update(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(unitId, taskId, dto);
  }

  @Post(':taskId/copies')
  copy(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string, @Body() dto: CopyTaskDto) {
    return this.tasksService.copy(unitId, taskId, dto);
  }

  @Post(':taskId/takeover')
  takeover(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string, @Body() dto: TakeoverTaskDto) {
    return this.tasksService.takeover(unitId, taskId, dto);
  }

  @Post(':taskId/execution')
  execute(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string, @Body() dto: ExecuteTaskDto) {
    return this.tasksService.execute(unitId, taskId, dto);
  }

  @Post(':taskId/corrections')
  correct(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string, @Body() dto: CorrectTaskDto) {
    return this.tasksService.correct(unitId, taskId, dto);
  }

  @Get(':taskId/events')
  events(@Param('unitId', new ParseUUIDPipe()) unitId: string, @Param('taskId', new ParseUUIDPipe()) taskId: string) {
    return this.tasksService.events(unitId, taskId);
  }

  @Get(':taskId/corrections/:correctionId')
  correction(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Param('correctionId', new ParseUUIDPipe()) correctionId: string,
  ) {
    return this.tasksService.correction(unitId, taskId, correctionId);
  }
}
