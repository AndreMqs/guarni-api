import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  userFieldLimits,
  usernameAllowedCharactersPattern,
  userValidationMessages,
} from '../users.constants.js';

export class CreateUserDto {
  @ApiProperty({
    example: 'André Câmara',
    minLength: userFieldLimits.name.minLength,
    maxLength: userFieldLimits.name.maxLength,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(userFieldLimits.name.minLength, userFieldLimits.name.maxLength)
  name!: string;

  @ApiProperty({
    example: 'andre.camara',
    minLength: userFieldLimits.username.minLength,
    maxLength: userFieldLimits.username.maxLength,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(
    userFieldLimits.username.minLength,
    userFieldLimits.username.maxLength,
  )
  @Matches(usernameAllowedCharactersPattern, {
    message: userValidationMessages.invalidUsernameCharacters,
  })
  username!: string;

  @ApiProperty({
    example: 'MinhaSenhaDeTeste123!',
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
}
