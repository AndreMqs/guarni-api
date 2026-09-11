import {
  Check,
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
import { User } from '../../users/entities/user.entity.js';
import {
  membershipRoleCheckConstraint,
  membershipRoles,
  membershipsPrimaryKeyConstraint,
  membershipUnitForeignKeyConstraint,
  membershipUnitUserUniqueConstraint,
  membershipUserForeignKeyConstraint,
  type MembershipRole,
} from '../memberships.constants.js';

@Entity('memberships')
@Unique(membershipUnitUserUniqueConstraint, ['unitId', 'userId'])
@Check(
  membershipRoleCheckConstraint,
  `"role" IN ('${membershipRoles.owner}', '${membershipRoles.manager}', '${membershipRoles.employee}')`,
)
export class Membership {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: membershipsPrimaryKeyConstraint,
  })
  id!: string;

  @Column({ type: 'uuid' })
  unitId!: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'unitId',
    foreignKeyConstraintName: membershipUnitForeignKeyConstraint,
  })
  unit!: Unit;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: membershipUserForeignKeyConstraint,
  })
  user!: User;

  @Column({ type: 'varchar', length: 20 })
  role!: MembershipRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
