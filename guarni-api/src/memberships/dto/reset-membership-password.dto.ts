import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { userFieldLimits } from '../../users/users.constants.js';

export class ResetMembershipPasswordDto {
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
  newPassword!: string;
}
