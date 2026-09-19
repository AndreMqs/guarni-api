import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { HistoryDayParamsDto } from './dto/history-day-params.dto.js';
import { HistoryDayQueryDto } from './dto/history-day-query.dto.js';
import { ListHistoryDaysQueryDto } from './dto/list-history-days-query.dto.js';
import { ManagementService } from './management.service.js';

@ApiTags('management')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get('dashboard')
  dashboard(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.managementService.dashboard(unitId);
  }

  @Get('days/current/summary')
  currentDaySummary(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.managementService.currentDaySummary(unitId);
  }

  @Get('history/days')
  history(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Query() query: ListHistoryDaysQueryDto,
  ) {
    return this.managementService.history(unitId, query);
  }

  @Get('history/days/:date')
  historyDay(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param() params: HistoryDayParamsDto,
    @Query() query: HistoryDayQueryDto,
  ) {
    return this.managementService.historyDay(unitId, params.date, query);
  }
}
