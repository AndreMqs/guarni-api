import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity.js';
import {
  taskExecutionExecutorForeignKeyConstraint,
  taskExecutionResolutionCheckConstraint,
  taskExecutionResultCheckConstraint,
  taskExecutionTaskForeignKeyConstraint,
  taskExecutionTaskUniqueConstraint,
  taskExecutionsPrimaryKeyConstraint,
  taskResolutionTypes,
  taskStatuses,
  type TaskResolutionType,
  type TaskStatus,
} from '../tasks.constants.js';
import { Task } from './task.entity.js';

@Entity('task_executions')
@Unique(taskExecutionTaskUniqueConstraint, ['taskId'])
@Check(
  taskExecutionResultCheckConstraint,
  `"result" IN ('${taskStatuses.done}', '${taskStatuses.notDone}')`,
)
@Check(
  taskExecutionResolutionCheckConstraint,
  `"resolutionType" IN ('${taskResolutionTypes.manual}', '${taskResolutionTypes.autoClosed}')`,
)
export class TaskExecution {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: taskExecutionsPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  taskId!: string;

  @OneToOne(() => Task, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'taskId',
    foreignKeyConstraintName: taskExecutionTaskForeignKeyConstraint,
  })
  task!: Task;

  @Column({ type: 'uuid', nullable: true })
  executorMembershipId!: string | null;

  @ManyToOne(() => Membership, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'executorMembershipId',
    foreignKeyConstraintName: taskExecutionExecutorForeignKeyConstraint,
  })
  executorMembership!: Membership | null;

  @Column({ type: 'varchar', length: 20 })
  result!: Extract<TaskStatus, 'DONE' | 'NOT_DONE'>;

  @Column({ type: 'varchar', length: 20 })
  resolutionType!: TaskResolutionType;

  @Column({ type: 'timestamptz' })
  completedAt!: Date;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
