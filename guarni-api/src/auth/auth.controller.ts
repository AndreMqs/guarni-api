import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { authErrorMessages } from './auth.constants.js';
import type { AuthenticatedRequest } from './types/authenticated-request.type.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: authErrorMessages.invalidCredentials })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({
    description: authErrorMessages.invalidOrExpiredAccessToken,
  })
  getCurrentUser(
    @Req() request: AuthenticatedRequest,
  ): Promise<CurrentUserResponseDto> {
    return this.authService.getCurrentUser(request.user.sub);
  }

  @Put('password')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user.sub, dto);
  }
}
