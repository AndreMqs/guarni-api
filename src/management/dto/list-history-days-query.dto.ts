import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ListHistoryDaysQueryDto {
  @ApiProperty({ example: '2026-09' })
  @Matches(monthPattern)
  month!: string;
}
