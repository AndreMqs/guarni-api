import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const mediaFilters = ['all', 'active', 'expiring'] as const;
export type MediaFilter = (typeof mediaFilters)[number];

export class ListMediaQueryDto {
  @ApiPropertyOptional({ enum: mediaFilters, default: 'all' })
  @IsOptional()
  @IsIn(mediaFilters)
  filter?: MediaFilter;
}
