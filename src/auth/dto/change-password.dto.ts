import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { userFieldLimits } from '../../users/users.constants.js';

export class ChangePasswordDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @Length(
    userFieldLimits.password.minLength,
    userFieldLimits.password.maxLength,
  )
  currentPassword!: string;

  @ApiProperty({ writeOnly: true })
  @IsString()
  @Length(
    userFieldLimits.password.minLength,
    userFieldLimits.password.maxLength,
  )
  newPassword!: string;
}
