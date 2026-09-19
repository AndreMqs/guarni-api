import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Unit } from '../../units/entities/unit.entity.js';
import {
  operationalDaysPrimaryKeyConstraint,
  operationalDayUnitDateUniqueConstraint,
  operationalDayUnitForeignKeyConstraint,
} from '../operational-days.constants.js';

@Entity('operational_days')
@Unique(operationalDayUnitDateUniqueConstraint, ['unitId', 'date'])
export class OperationalDay {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: operationalDaysPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'unitId',
    foreignKeyConstraintName: operationalDayUnitForeignKeyConstraint,
  })
  unit!: Unit;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'timestamptz' })
  opensAt!: Date;

  @Column({ type: 'timestamptz' })
  closesAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
