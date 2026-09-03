import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  usersPrimaryKeyConstraint,
  usernameUniqueConstraint,
  userFieldLimits,
} from '../users.constants.js';

@Entity('users')
@Unique(usernameUniqueConstraint, ['username'])
export class User {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: usersPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'varchar', length: userFieldLimits.name.maxLength })
  name!: string;

  @Column({ type: 'varchar', length: userFieldLimits.username.maxLength })
  username!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
