import { ApiProperty } from '@nestjs/swagger';
import {
  membershipRoles,
  type MembershipRole,
} from '../memberships.constants.js';

export class UpdateMembershipRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(membershipRoles) })
  role!: MembershipRole;

  @ApiProperty({ minimum: 1 })
  version!: number;
}
