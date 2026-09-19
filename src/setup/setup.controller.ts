import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { SetupOwnerDto } from './dto/setup-owner.dto.js';
import { SetupService } from './setup.service.js';

@ApiTags('setup')
@ApiHeader({
  name: 'X-Setup-Token',
  description: 'Segredo configurado em SETUP_OWNER_TOKEN.',
  required: true,
})
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Post('owner')
  
  createOwner(@Body() dto: SetupOwnerDto, @Headers('x-setup-token') setupToken: string | undefined) {
    return this.setupService.createOwner(dto, setupToken);
  }
}
