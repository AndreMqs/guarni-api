import { ApiProperty } from '@nestjs/swagger';
import { membershipRoles, type MembershipRole } from '../../memberships/memberships.constants.js';

class CurrentUserUnitDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

class CurrentUserMembershipDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(membershipRoles) })
  role!: MembershipRole;

  @ApiProperty({ type: CurrentUserUnitDto })
  unit!: CurrentUserUnitDto;
}

class CurrentUserIdentityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: CurrentUserIdentityDto })
  user!: CurrentUserIdentityDto;

  @ApiProperty({ type: [CurrentUserMembershipDto] })
  memberships!: CurrentUserMembershipDto[];
}
