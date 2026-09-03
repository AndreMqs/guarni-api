import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { usersPrimaryKeyConstraint, usernameUniqueConstraint } from '../users.constants.js';

@Entity('users')
@Unique(usernameUniqueConstraint, ['username'])
export class User {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: usersPrimaryKeyConstraint })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 60 })
  username!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
