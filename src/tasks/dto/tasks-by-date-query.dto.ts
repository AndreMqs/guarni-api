import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class TasksByDateQueryDto {
  @ApiProperty({ example: '2026-09-18' })
  @Matches(datePattern)
  date!: string;
}
