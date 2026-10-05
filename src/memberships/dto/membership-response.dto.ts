import { ApiProperty } from '@nestjs/swagger';
import {
  membershipRoles,
  type MembershipRole,
} from '../memberships.constants.js';

class MembershipUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

export class MembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(membershipRoles) })
  role!: MembershipRole;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ minimum: 1 })
  version!: number;

  @ApiProperty({ type: MembershipUserResponseDto })
  user!: MembershipUserResponseDto;
}

export class MembershipListResponseDto {
  @ApiProperty({ type: [MembershipResponseDto] })
  items!: MembershipResponseDto[];
}
