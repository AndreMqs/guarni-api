import { Injectable, NotImplementedException } from '@nestjs/common';
import type { CopyTaskDto } from './dto/copy-task.dto.js';
import type { CorrectTaskDto } from './dto/correct-task.dto.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { ExecuteTaskDto } from './dto/execute-task.dto.js';
import type { ListTaskCatalogQueryDto } from './dto/list-task-catalog-query.dto.js';
import type { TakeoverTaskDto } from './dto/takeover-task.dto.js';
import type { TasksByDateQueryDto } from './dto/tasks-by-date-query.dto.js';
import type { TodayTasksQueryDto } from './dto/today-tasks-query.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  catalog(_unitId: string, _query: ListTaskCatalogQueryDto): never { return this.pending('catálogo'); }
  byDate(_unitId: string, _query: TasksByDateQueryDto): never { return this.pending('tarefas por data'); }
  today(_unitId: string, _query: TodayTasksQueryDto): never { return this.pending('Hoje'); }
  getById(_unitId: string, _taskId: string): never { return this.pending('detalhe'); }
  create(_unitId: string, _dto: CreateTaskDto): never { return this.pending('criação'); }
  update(_unitId: string, _taskId: string, _dto: UpdateTaskDto): never { return this.pending('edição'); }
  copy(_unitId: string, _taskId: string, _dto: CopyTaskDto): never { return this.pending('cópia'); }
  takeover(_unitId: string, _taskId: string, _dto: TakeoverTaskDto): never { return this.pending('takeover'); }
  execute(_unitId: string, _taskId: string, _dto: ExecuteTaskDto): never { return this.pending('execução'); }
  correct(_unitId: string, _taskId: string, _dto: CorrectTaskDto): never { return this.pending('correção'); }
  events(_unitId: string, _taskId: string): never { return this.pending('timeline'); }
  correction(_unitId: string, _taskId: string, _correctionId: string): never { return this.pending('comprovante'); }

  private pending(feature: string): never {
    throw new NotImplementedException(
      `${feature} está preparado no contrato, mas depende dos checkpoints de autorização/dia operacional/transações.`,
    );
  }
}
