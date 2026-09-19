import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { UnitMembershipGuard } from '../memberships/guards/unit-membership.guard.js';
import { EvidenceService } from './evidence.service.js';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, UnitMembershipGuard)
@Controller('units/:unitId')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  // LEARNING CHECKPOINT: este endpoint ainda não recebe @UploadedFile/FileInterceptor.
  // Ele existe como marcador do contrato e retorna 501 até a aula de multipart/storage.
  @Post('tasks/:taskId/evidence-uploads')
  upload(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
  ) {
    return this.evidenceService.upload(unitId, taskId);
  }

  @Get('evidence/:evidenceId')
  getMetadata(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('evidenceId', new ParseUUIDPipe()) evidenceId: string,
  ) {
    return this.evidenceService.getMetadata(unitId, evidenceId);
  }

  @Get('evidence/:evidenceId/content-url')
  getContentUrl(
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
    @Param('evidenceId', new ParseUUIDPipe()) evidenceId: string,
  ) {
    return this.evidenceService.getContentUrl(unitId, evidenceId);
  }
}
