import { ApiProperty } from '@nestjs/swagger';
import {
  membershipRoles,
  type MembershipRole,
} from '../../memberships/memberships.constants.js';

class UnitContextUnitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  timezone!: string;

  @ApiProperty({ example: '03:00' })
  closingTime!: string;
}

class UnitContextMembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(membershipRoles) })
  role!: MembershipRole;
}

class UnitContextPermissionsResponseDto {
  @ApiProperty()
  canManageTasks!: boolean;

  @ApiProperty()
  canManageUsers!: boolean;

  @ApiProperty()
  canManageOwnersAndManagers!: boolean;

  @ApiProperty()
  canManageSettings!: boolean;

  @ApiProperty()
  canViewAudit!: boolean;

  @ApiProperty()
  canCorrectAnyExecution!: boolean;
}

class UnitContextOperationalDayResponseDto {
  @ApiProperty({ format: 'date', example: '2026-09-18' })
  date!: string;

  @ApiProperty({ format: 'date-time' })
  opensAt!: string;

  @ApiProperty({ format: 'date-time' })
  closesAt!: string;

  @ApiProperty()
  isClosed!: boolean;
}

export class UnitContextResponseDto {
  @ApiProperty({ type: UnitContextUnitResponseDto })
  unit!: UnitContextUnitResponseDto;

  @ApiProperty({ type: UnitContextMembershipResponseDto })
  membership!: UnitContextMembershipResponseDto;

  @ApiProperty({ type: UnitContextPermissionsResponseDto })
  permissions!: UnitContextPermissionsResponseDto;

  @ApiProperty({ type: UnitContextOperationalDayResponseDto })
  operationalDay!: UnitContextOperationalDayResponseDto;

  @ApiProperty({ format: 'date-time' })
  serverTime!: string;
}
