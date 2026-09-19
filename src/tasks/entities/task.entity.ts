import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity.js';
import { Unit } from '../../units/entities/unit.entity.js';
import {
  taskAssignmentCheckConstraint,
  taskAssignmentTypeCheckConstraint,
  taskAssignmentTypes,
  taskAssigneeForeignKeyConstraint,
  taskCreatorForeignKeyConstraint,
  taskFieldLimits,
  tasksPrimaryKeyConstraint,
  taskSourceForeignKeyConstraint,
  taskStatusCheckConstraint,
  taskStatuses,
  taskUnitForeignKeyConstraint,
  type TaskAssignmentType,
  type TaskStatus,
} from '../tasks.constants.js';

@Entity('tasks')
@Check(
  taskAssignmentTypeCheckConstraint,
  `"assignmentType" IN ('${taskAssignmentTypes.general}', '${taskAssignmentTypes.personal}')`,
)
@Check(
  taskStatusCheckConstraint,
  `"status" IN ('${taskStatuses.pending}', '${taskStatuses.done}', '${taskStatuses.notDone}')`,
)
@Check(
  taskAssignmentCheckConstraint,
  `("assignmentType" = '${taskAssignmentTypes.general}' AND "assigneeMembershipId" IS NULL) OR ("assignmentType" = '${taskAssignmentTypes.personal}' AND "assigneeMembershipId" IS NOT NULL)`,
)
export class Task {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: tasksPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unitId', foreignKeyConstraintName: taskUnitForeignKeyConstraint })
  unit!: Unit;

  @Column({ type: 'date' })
  executionDate!: string;

  @Column({ type: 'varchar', length: taskFieldLimits.title.maxLength })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20 })
  assignmentType!: TaskAssignmentType;

  @Column({ type: 'uuid', nullable: true })
  assigneeMembershipId!: string | null;

  @ManyToOne(() => Membership, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'assigneeMembershipId',
    foreignKeyConstraintName: taskAssigneeForeignKeyConstraint,
  })
  assigneeMembership!: Membership | null;

  @Column({ type: 'time' })
  dueTime!: string;

  @Column({ type: 'timestamptz' })
  dueAt!: Date;

  @Column({ type: 'boolean' })
  isEvidenceRequired!: boolean;

  @Column({ type: 'boolean' })
  isCommentEnabled!: boolean;

  @Column({ type: 'varchar', length: 20, default: taskStatuses.pending })
  status!: TaskStatus;

  @Column({ type: 'uuid' })
  createdByMembershipId!: string;

  @ManyToOne(() => Membership, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'createdByMembershipId',
    foreignKeyConstraintName: taskCreatorForeignKeyConstraint,
  })
  createdByMembership!: Membership;

  @Column({ type: 'uuid', nullable: true })
  sourceTaskId!: string | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'sourceTaskId',
    foreignKeyConstraintName: taskSourceForeignKeyConstraint,
  })
  sourceTask!: Task | null;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
