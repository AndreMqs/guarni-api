import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { CurrentMembership } from '../memberships/decorators/current-membership.decorator.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { UnitContextResponseDto } from './dto/unit-context-response.dto.js';
import { UpdateUnitSettingsDto } from './dto/update-unit-settings.dto.js';
import { UnitsService } from './units.service.js';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @ApiParam({ name: 'unitId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: UnitContextResponseDto })
  @Get('context')
  getContext(@CurrentMembership() membership: Membership) {
    return this.unitsService.getContext(membership);
  }

  @ApiParam({ name: 'unitId', type: String, format: 'uuid' })
  @Get('settings')
  getSettings(@CurrentMembership() membership: Membership) {
    return this.unitsService.getSettings(membership.unitId);
  }

  @Patch('settings')
  updateSettings(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Body() dto: UpdateUnitSettingsDto,
  ) {
    return this.unitsService.updateSettings(unitId, dto);
  }
}
