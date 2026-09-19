import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Matches, Min } from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: '18:30' })
  @IsOptional()
  @Matches(timePattern)
  dueTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEvidenceRequired?: boolean;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
