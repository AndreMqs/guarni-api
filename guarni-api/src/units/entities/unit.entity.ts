import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  unitFieldLimits,
  unitsPrimaryKeyConstraint,
} from '../units.constants.js';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: unitsPrimaryKeyConstraint,
  })
  id!: string;

  @Column({
    type: 'varchar',
    length: unitFieldLimits.name.maxLength,
  })
  name!: string;

  @Column({ type: 'varchar', length: 100, default: 'America/Sao_Paulo' })
  timezone!: string;

  @Column({ type: 'time', default: '03:00' })
  closingTime!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
