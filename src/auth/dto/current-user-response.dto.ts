import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;
}
