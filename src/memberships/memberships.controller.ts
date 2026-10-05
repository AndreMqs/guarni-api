import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { CreateUnitUserDto } from './dto/create-unit-user.dto.js';
import { DeactivateMembershipDto } from './dto/deactivate-membership.dto.js';
import { ListMembershipsQueryDto } from './dto/list-memberships-query.dto.js';
import { ReactivateMembershipDto } from './dto/reactivate-membership.dto.js';
import { ResetMembershipPasswordDto } from './dto/reset-membership-password.dto.js';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto.js';
import { UnitMembershipGuard } from './guards/unit-membership.guard.js';
import { MembershipsService } from './memberships.service.js';
import { CurrentMembership } from './decorators/current-membership.decorator.js';
import { Membership } from './entities/membership.entity.js';
import { UpdateMembershipRoleResponseDto } from './dto/update-membership-role-response.dto.js';
import {
  MembershipResponseDto,
  MembershipListResponseDto,
} from './dto/membership-response.dto.js';

@ApiTags('memberships')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('memberships')
  @ApiParam({ name: 'unitId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: MembershipListResponseDto })
  list(
    @CurrentMembership() requestingMembership: Membership,
    @Query() query: ListMembershipsQueryDto,
  ): Promise<MembershipListResponseDto> {
    return this.membershipsService.list(requestingMembership, query);
  }

  @Get('memberships/:membershipId')
  @ApiParam({ name: 'unitId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: MembershipResponseDto })
  getById(
    @CurrentMembership() requestingMembership: Membership,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.getById(requestingMembership, membershipId);
  }

  @Post('users')
  createUser(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() dto: CreateUnitUserDto,
  ) {
    return this.membershipsService.createUser(unitId, dto);
  }

  @Patch('memberships/:membershipId')
  @ApiParam({ name: 'unitId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: UpdateMembershipRoleResponseDto })
  updateRole(
    @Param('membershipId', new ParseUUIDPipe()) membershipToUpdateId: string,
    @CurrentMembership() requestingMembership: Membership,
    @Body() roleUpdateData: UpdateMembershipRoleDto,
  ): Promise<UpdateMembershipRoleResponseDto> {
    return this.membershipsService.updateRole({
      requestingMembership,
      unitId: requestingMembership.unitId,
      membershipToUpdateId,
      roleUpdateData,
    });
  }

  @Get('memberships/:membershipId/reassignment-summary')
  getReassignmentSummary(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ) {
    return this.membershipsService.getReassignmentSummary(unitId, membershipId);
  }

  @Post('memberships/:membershipId/deactivate')
  deactivate(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body() dto: DeactivateMembershipDto,
  ) {
    return this.membershipsService.deactivate(unitId, membershipId, dto);
  }

  @Post('memberships/:membershipId/reactivate')
  reactivate(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body() dto: ReactivateMembershipDto,
  ) {
    return this.membershipsService.reactivate(unitId, membershipId, dto);
  }

  @Put('memberships/:membershipId/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body() dto: ResetMembershipPasswordDto,
  ): Promise<void> {
    await this.membershipsService.resetPassword(unitId, membershipId, dto);
  }
}
