import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';
import { taskFieldLimits } from '../tasks.constants.js';

export class TakeoverTaskDto {
  @ApiProperty({ maxLength: taskFieldLimits.reason.maxLength })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(taskFieldLimits.reason.minLength, taskFieldLimits.reason.maxLength)
  reason!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
