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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
