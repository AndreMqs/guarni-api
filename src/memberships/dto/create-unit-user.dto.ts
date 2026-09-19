import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';
import {
  userFieldLimits,
  usernameAllowedCharactersPattern,
  userValidationMessages,
} from '../../users/users.constants.js';
import { membershipRoles, type MembershipRole } from '../memberships.constants.js';

export class CreateUnitUserDto {
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

  @ApiProperty({ enum: Object.values(membershipRoles) })
  @IsIn(Object.values(membershipRoles))
  role!: MembershipRole;
}
