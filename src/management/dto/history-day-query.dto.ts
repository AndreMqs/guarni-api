import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

const historyStatuses = ['DONE', 'NOT_DONE', 'AUTO_CLOSED'] as const;
export type HistoryStatus = (typeof historyStatuses)[number];

export class HistoryDayQueryDto {
  @ApiPropertyOptional({
    description: 'Lista separada por vírgula: DONE,NOT_DONE,AUTO_CLOSED',
    example: 'DONE,AUTO_CLOSED',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  })
  @IsIn(historyStatuses, { each: true })
  statuses?: HistoryStatus[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigneeMembershipId?: string;
}
