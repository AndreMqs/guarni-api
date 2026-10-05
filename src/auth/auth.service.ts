import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Membership } from '../memberships/entities/membership.entity.js';
import { UsersService } from '../users/users.service.js';
import { authErrorMessages } from './auth.constants.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';
import { DataSource, type EntityManager, type Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';

type UpdateCredentialsParams = {
  transactionManager: EntityManager;
  user: User;
  passwordHash: string;
  nextCredentialVersion: number;
};

@Injectable()
export class AuthService {
  private readonly membershipsRepository: Repository<Membership>;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {
    this.membershipsRepository = dataSource.getRepository(Membership);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findUserEntityByUsername(
      loginDto.username,
    );

    if (!user) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }

    await this.validatePassword(user, loginDto.password);
    await this.ensureActiveMembership(user.id);
    return this.issueAccessToken(user);
  }

  private async validatePassword(user: User, password: string): Promise<void> {
    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }
  }

  private async ensureActiveMembership(userId: string): Promise<void> {
    const activeMemberships = await this.membershipsRepository.countBy({
      userId,
      isActive: true,
    });

    if (activeMemberships === 0) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }
  }

  private async issueAccessToken(
    user: User,
    credentialVersion = user.credentialVersion,
  ): Promise<LoginResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      credentialVersion,
    });

    return { accessToken };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
    const user = await this.usersService.findUserEntityById(userId);

    if (!user) {
      throw new NotFoundException(authErrorMessages.userNotFound);
    }

    const memberships = await this.membershipsRepository.find({
      where: { userId, isActive: true },
      relations: { unit: true },
      order: { createdAt: 'ASC' },
    });

    return this.mapCurrentUserResponse(user, memberships);
  }

  private mapCurrentUserResponse(
    user: User,
    memberships: Membership[],
  ): CurrentUserResponseDto {
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

  async changePassword(
    userId: string,
    passwordChange: ChangePasswordDto,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findUserEntityById(userId);
    if (!user) {
      throw new UnauthorizedException(authErrorMessages.invalidCredentials);
    }

    await this.validatePassword(user, passwordChange.currentPassword);

    const newPasswordHash = await argon2.hash(passwordChange.newPassword);
    const nextCredentialVersion = user.credentialVersion + 1;
    return this.dataSource.transaction(async (transactionManager) => {
      await this.updateCredentials({
        transactionManager,
        user,
        passwordHash: newPasswordHash,
        nextCredentialVersion,
      });
      return this.issueAccessToken(user, nextCredentialVersion);
    });
  }

  private async updateCredentials(
    params: UpdateCredentialsParams,
  ): Promise<void> {
    const { transactionManager, user, passwordHash, nextCredentialVersion } =
      params;
    const result = await transactionManager.update(
      User,
      {
        id: user.id,
        credentialVersion: user.credentialVersion,
      },
      {
        passwordHash,
        credentialVersion: nextCredentialVersion,
      },
    );

    if (result.affected !== 1) {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }
  }
}
