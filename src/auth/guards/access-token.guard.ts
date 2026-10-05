import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';
import { authErrorMessages } from '../auth.constants.js';
import type { AccessTokenPayload } from '../types/access-token-payload.type.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const accessToken = this.extractBearerToken(request);

    if (!accessToken) {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }

    const payload = await this.verifyAccessToken(accessToken);
    await this.ensureCurrentCredentials(payload);
    request.user = payload;
    return true;
  }

  private async verifyAccessToken(
    accessToken: string,
  ): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }
  }

  private async ensureCurrentCredentials(
    payload: AccessTokenPayload,
  ): Promise<void> {
    const user = await this.usersService.findUserEntityById(payload.sub);
    if (!user || user.credentialVersion !== payload.credentialVersion) {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }
  }

  private extractBearerToken(
    request: AuthenticatedRequest,
  ): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const parts = authorization.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    return parts[1];
  }
}
