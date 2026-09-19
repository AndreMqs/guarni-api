import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity.js';
import { TaskExecution } from '../../tasks/entities/task-execution.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';
import { Unit } from '../../units/entities/unit.entity.js';
import {
  taskEvidenceExecutionForeignKeyConstraint,
  taskEvidencePrimaryKeyConstraint,
  taskEvidenceTaskForeignKeyConstraint,
  taskEvidenceUnitForeignKeyConstraint,
  taskEvidenceUploaderForeignKeyConstraint,
} from '../evidence.constants.js';

@Entity('task_evidence')
export class TaskEvidence {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: taskEvidencePrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unitId', foreignKeyConstraintName: taskEvidenceUnitForeignKeyConstraint })
  unit!: Unit;

  @Column({ type: 'uuid' })
  taskId!: string;

  @ManyToOne(() => Task, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'taskId', foreignKeyConstraintName: taskEvidenceTaskForeignKeyConstraint })
  task!: Task;

  @Column({ type: 'uuid', nullable: true })
  executionId!: string | null;

  @ManyToOne(() => TaskExecution, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'executionId',
    foreignKeyConstraintName: taskEvidenceExecutionForeignKeyConstraint,
  })
  execution!: TaskExecution | null;

  @Column({ type: 'uuid' })
  uploadedByMembershipId!: string;

  @ManyToOne(() => Membership, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'uploadedByMembershipId',
    foreignKeyConstraintName: taskEvidenceUploaderForeignKeyConstraint,
  })
  uploadedByMembership!: Membership;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'text' })
  storageKey!: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  sizeBytes!: string;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  attachedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  isCurrent!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
