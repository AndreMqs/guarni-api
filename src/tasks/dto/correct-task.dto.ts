import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';
import { taskFieldLimits, taskStatuses } from '../tasks.constants.js';

const executionResults = [taskStatuses.done, taskStatuses.notDone] as const;

export class CorrectTaskDto {
  @ApiPropertyOptional({ enum: executionResults })
  @IsOptional()
  @IsIn(executionResults)
  result?: (typeof executionResults)[number];

  @ApiPropertyOptional({ maxLength: taskFieldLimits.comment.maxLength })
  @IsOptional()
  @IsString()
  @MaxLength(taskFieldLimits.comment.maxLength)
  comment?: string;

  @ApiPropertyOptional({ maxLength: taskFieldLimits.reason.maxLength })
  @IsOptional()
  @IsString()
  @MaxLength(taskFieldLimits.reason.maxLength)
  reason?: string;

  @ApiProperty({ maxLength: taskFieldLimits.reason.maxLength })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(taskFieldLimits.reason.minLength, taskFieldLimits.reason.maxLength)
  correctionReason!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceId?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
