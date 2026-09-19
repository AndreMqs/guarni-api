import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const categories = ['all', 'tasks', 'users', 'media'] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class ListAuditEventsQueryDto {
  @ApiPropertyOptional({ enum: categories, default: 'all' })
  @IsOptional()
  @IsIn(categories)
  category?: (typeof categories)[number];

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @Matches(datePattern)
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @Matches(datePattern)
  endDate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 100 })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
