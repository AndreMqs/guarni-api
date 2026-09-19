import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';
import {
  taskAssignmentTypes,
  taskFieldLimits,
  type TaskAssignmentType,
} from '../tasks.constants.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CopyTaskDto {
  @ApiProperty({ maxLength: taskFieldLimits.title.maxLength })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(taskFieldLimits.title.minLength, taskFieldLimits.title.maxLength)
  title!: string;

  @ApiPropertyOptional({ maxLength: taskFieldLimits.description.maxLength })
  @IsOptional()
  @IsString()
  @MaxLength(taskFieldLimits.description.maxLength)
  description?: string;

  @ApiProperty({ example: '2026-09-19' })
  @Matches(datePattern)
  executionDate!: string;

  @ApiProperty({ enum: Object.values(taskAssignmentTypes) })
  @IsIn(Object.values(taskAssignmentTypes))
  assignmentType!: TaskAssignmentType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigneeMembershipId?: string;

  @ApiProperty()
  @IsBoolean()
  isEvidenceRequired!: boolean;
}
