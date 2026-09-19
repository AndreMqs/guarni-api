import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import {
  userFieldLimits,
  usernameAllowedCharactersPattern,
  userValidationMessages,
} from '../../users/users.constants.js';
import { unitFieldLimits } from '../../units/units.constants.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class SetupOwnerDto {
  @ApiProperty({ minLength: 1, maxLength: userFieldLimits.name.maxLength })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, userFieldLimits.name.maxLength)
  name!: string;

  @ApiProperty({ minLength: 1, maxLength: userFieldLimits.username.maxLength })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(1, userFieldLimits.username.maxLength)
  @Matches(usernameAllowedCharactersPattern, {
    message: userValidationMessages.invalidUsernameCharacters,
  })
  username!: string;

  @ApiProperty({
    minLength: userFieldLimits.password.minLength,
    maxLength: userFieldLimits.password.maxLength,
    writeOnly: true,
  })
  @IsString()
  @Length(
    userFieldLimits.password.minLength,
    userFieldLimits.password.maxLength,
  )
  password!: string;

  @ApiProperty({
    minLength: unitFieldLimits.name.minLength,
    maxLength: unitFieldLimits.name.maxLength,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(unitFieldLimits.name.minLength, unitFieldLimits.name.maxLength)
  unitName!: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: '03:00' })
  @IsOptional()
  @IsString()
  @Matches(timePattern)
  closingTime?: string;
}
