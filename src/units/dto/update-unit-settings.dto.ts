import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { unitFieldLimits } from '../units.constants.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateUnitSettingsDto {
  @ApiPropertyOptional({
    minLength: unitFieldLimits.name.minLength,
    maxLength: unitFieldLimits.name.maxLength,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(unitFieldLimits.name.minLength, unitFieldLimits.name.maxLength)
  name?: string;

  @ApiPropertyOptional({ example: '03:00' })
  @IsOptional()
  @IsString()
  @Matches(timePattern)
  closingTime?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
