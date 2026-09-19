import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { ListAuditEventsQueryDto } from './dto/list-audit-events-query.dto.js';
import { ListMediaQueryDto } from './dto/list-media-query.dto.js';
import { AuditService } from './audit.service.js';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit/events')
  listEvents(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Query() query: ListAuditEventsQueryDto,
  ) {
    return this.auditService.listEvents(unitId, query);
  }

  @Get('audit/events/:eventId')
  getEvent(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
  ) {
    return this.auditService.getEvent(unitId, eventId);
  }

  @Get('media')
  listMedia(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Query() query: ListMediaQueryDto,
  ) {
    return this.auditService.listMedia(unitId, query);
  }
}
