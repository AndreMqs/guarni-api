import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  taskAssignmentTypes,
  taskFieldLimits,
  type TaskAssignmentType,
} from '../tasks.constants.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateTaskDto {
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

  @ApiProperty({ enum: Object.values(taskAssignmentTypes) })
  @IsIn(Object.values(taskAssignmentTypes))
  assignmentType!: TaskAssignmentType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigneeMembershipId?: string;

  @ApiProperty({ example: '2026-09-18' })
  @Matches(datePattern)
  executionDate!: string;

  @ApiPropertyOptional({ example: '18:30' })
  @IsOptional()
  @Matches(timePattern)
  dueTime?: string;

  @ApiProperty()
  @IsBoolean()
  isEvidenceRequired!: boolean;

  @ApiProperty()
  @IsBoolean()
  isCommentEnabled!: boolean;
}
