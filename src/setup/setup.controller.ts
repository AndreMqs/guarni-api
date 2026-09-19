import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetupOwnerDto } from './dto/setup-owner.dto.js';
import { SetupService } from './setup.service.js';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Post('owner')
  createOwner(@Body() dto: SetupOwnerDto): Promise<never> {
    return this.setupService.createOwner(dto);
  }
}
