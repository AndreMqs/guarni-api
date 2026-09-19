import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const todayScopes = ['mine', 'general', 'all'] as const;
const todayStatuses = ['all', 'pending', 'done', 'notDone'] as const;

export class TodayTasksQueryDto {
  @ApiPropertyOptional({ enum: todayScopes, default: 'mine' })
  @IsOptional()
  @IsIn(todayScopes)
  scope?: (typeof todayScopes)[number];

  @ApiPropertyOptional({ enum: todayStatuses, default: 'all' })
  @IsOptional()
  @IsIn(todayStatuses)
  status?: (typeof todayStatuses)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
