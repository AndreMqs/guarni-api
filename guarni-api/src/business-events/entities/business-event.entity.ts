import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskEvidence } from '../../evidence/entities/task-evidence.entity.js';
import { Membership } from '../../memberships/entities/membership.entity.js';
import { TaskExecution } from '../../tasks/entities/task-execution.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';
import { Unit } from '../../units/entities/unit.entity.js';
import {
  businessEventActorForeignKeyConstraint,
  businessEventActorTypeCheckConstraint,
  businessEventActorTypes,
  businessEventCategories,
  businessEventCategoryCheckConstraint,
  businessEventEvidenceForeignKeyConstraint,
  businessEventExecutionForeignKeyConstraint,
  businessEventsPrimaryKeyConstraint,
  businessEventTaskForeignKeyConstraint,
  businessEventUnitForeignKeyConstraint,
  type BusinessEventActorType,
  type BusinessEventCategory,
} from '../business-events.constants.js';

@Entity('business_events')
@Check(
  businessEventCategoryCheckConstraint,
  `"category" IN ('${businessEventCategories.tasks}', '${businessEventCategories.users}', '${businessEventCategories.media}')`,
)
@Check(
  businessEventActorTypeCheckConstraint,
  `"actorType" IN ('${businessEventActorTypes.user}', '${businessEventActorTypes.system}')`,
)
export class BusinessEvent {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: businessEventsPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unitId', foreignKeyConstraintName: businessEventUnitForeignKeyConstraint })
  unit!: Unit;

  @Column({ type: 'varchar', length: 20 })
  category!: BusinessEventCategory;

  @Column({ type: 'varchar', length: 60 })
  eventType!: string;

  @Column({ type: 'varchar', length: 20 })
  actorType!: BusinessEventActorType;

  @Column({ type: 'uuid', nullable: true })
  actorMembershipId!: string | null;

  @ManyToOne(() => Membership, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'actorMembershipId',
    foreignKeyConstraintName: businessEventActorForeignKeyConstraint,
  })
  actorMembership!: Membership | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  actorNameSnapshot!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  actorRoleSnapshot!: string | null;

  @Column({ type: 'varchar', length: 30 })
  subjectType!: string;

  @Column({ type: 'uuid' })
  subjectId!: string;

  @Column({ type: 'varchar', length: 200 })
  subjectTitleSnapshot!: string;

  @Column({ type: 'uuid', nullable: true })
  taskId!: string | null;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'taskId', foreignKeyConstraintName: businessEventTaskForeignKeyConstraint })
  task!: Task | null;

  @Column({ type: 'uuid', nullable: true })
  executionId!: string | null;

  @ManyToOne(() => TaskExecution, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'executionId',
    foreignKeyConstraintName: businessEventExecutionForeignKeyConstraint,
  })
  execution!: TaskExecution | null;

  @Column({ type: 'uuid', nullable: true })
  evidenceId!: string | null;

  @ManyToOne(() => TaskEvidence, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'evidenceId',
    foreignKeyConstraintName: businessEventEvidenceForeignKeyConstraint,
  })
  evidence!: TaskEvidence | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  occurredAt!: Date;
}
