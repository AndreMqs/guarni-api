import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { UpdateUnitSettingsDto } from './dto/update-unit-settings.dto.js';
import { UnitsService } from './units.service.js';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('context')
  getContext(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.unitsService.getContext(unitId);
  }

  @Get('settings')
  getSettings(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.unitsService.getSettings(unitId);
  }

  @Patch('settings')
  updateSettings(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() dto: UpdateUnitSettingsDto,
  ) {
    return this.unitsService.updateSettings(unitId, dto);
  }
}
