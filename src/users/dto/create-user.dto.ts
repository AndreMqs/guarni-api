import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'André Câmara' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({ example: 'andre.camara' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(1, 60)
  @Matches(/^[a-z0-9._-]+$/, {
    message:
      'username deve conter apenas letras sem acento, números, ponto, hífen ou sublinhado',
  })
  username!: string;

  @ApiProperty({
    example: 'MinhaSenhaDeTeste123!',
    minLength: 12,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @Length(12, 128)
  password!: string;
}
