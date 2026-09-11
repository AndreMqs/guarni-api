import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service.js';
import { authErrorMessages } from './auth.constants.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findUserEntityByUsername(
      loginDto.username,
    );

    if (!user) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    });

    return { accessToken };
  }
}
