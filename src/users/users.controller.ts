import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':username')
  getPublicUserByUsername(@Param('username') username: string) {
    return this.usersService.getPublicUserByUsername(username);
  }

  // TODO: Protect this route with OWNER/MANAGER authorization.
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUserById(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    return this.usersService.deleteUserById(userId);
  }
}
