import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import type { Repository } from 'typeorm';
import { Membership } from '../memberships/entities/membership.entity.js';
import { UsersService } from '../users/users.service.js';
import { authErrorMessages } from './auth.constants.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Membership)
    private readonly membershipsRepository: Repository<Membership>,
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

    const activeMemberships = await this.membershipsRepository.countBy({
      userId: user.id,
      isActive: true,
    });

    if (activeMemberships === 0) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      credentialVersion: user.credentialVersion,
    });

    return { accessToken };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
    const user = await this.usersService.findUserEntityById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const memberships = await this.membershipsRepository.find({
      where: { userId, isActive: true },
      relations: { unit: true },
      order: { createdAt: 'ASC' },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      memberships: memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        unit: {
          id: membership.unit.id,
          name: membership.unit.name,
        },
      })),
    };
  }

  changePassword(_userId: string, _dto: ChangePasswordDto): never {
    // LEARNING CHECKPOINT:
    // Você vai implementar a troca de senha + incremento de credentialVersion
    // e emissão do novo token depois de estudar invalidação de credenciais.
    throw new NotImplementedException(
      'Troca de senha com invalidação de tokens ainda não foi implementada.',
    );
  }
}
