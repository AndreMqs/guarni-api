import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { taskFieldLimits, taskStatuses } from '../tasks.constants.js';

const executionResults = [taskStatuses.done, taskStatuses.notDone] as const;

export class ExecuteTaskDto {
  @ApiProperty({ enum: executionResults })
  @IsIn(executionResults)
  result!: (typeof executionResults)[number];

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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceId?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
