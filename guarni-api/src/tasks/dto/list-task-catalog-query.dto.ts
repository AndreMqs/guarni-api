import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const catalogPeriods = ['all', 'today', 'future', 'past'] as const;
export type TaskCatalogPeriod = (typeof catalogPeriods)[number];

export class ListTaskCatalogQueryDto {
  @ApiProperty({ example: '2026-09' })
  @Matches(monthPattern)
  month!: string;

  @ApiPropertyOptional({ enum: catalogPeriods, default: 'today' })
  @IsOptional()
  @IsIn(catalogPeriods)
  period?: TaskCatalogPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
