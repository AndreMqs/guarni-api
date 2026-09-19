import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';
import { membershipRoles, type MembershipRole } from '../memberships.constants.js';

export class UpdateMembershipRoleDto {
  @ApiProperty({ enum: Object.values(membershipRoles) })
  @IsIn(Object.values(membershipRoles))
  role!: MembershipRole;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
