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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { CreateUnitUserDto } from './dto/create-unit-user.dto.js';
import { DeactivateMembershipDto } from './dto/deactivate-membership.dto.js';
import { ListMembershipsQueryDto } from './dto/list-memberships-query.dto.js';
import { ReactivateMembershipDto } from './dto/reactivate-membership.dto.js';
import { ResetMembershipPasswordDto } from './dto/reset-membership-password.dto.js';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto.js';
import { UnitMembershipGuard } from './guards/unit-membership.guard.js';
import { MembershipsService } from './memberships.service.js';

@ApiTags('memberships')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('memberships')
  list(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Query() query: ListMembershipsQueryDto,
  ) {
    return this.membershipsService.list(unitId, query);
  }

  @Get('memberships/:membershipId')
  getById(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
  ) {
    return this.membershipsService.getById(unitId, membershipId);
  }

  @Post('users')
  createUser(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() dto: CreateUnitUserDto,
  ) {
    return this.membershipsService.createUser(unitId, dto);
  }

  @Patch('memberships/:membershipId')
  updateRole(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body() dto: UpdateMembershipRoleDto,
  ) {
    return this.membershipsService.updateRole(unitId, membershipId, dto);
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
