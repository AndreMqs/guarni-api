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

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const accessToken = this.extractBearerToken(request);

    if (!accessToken) {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }

    try {
      request.user =
        await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException(
        authErrorMessages.invalidOrExpiredAccessToken,
      );
    }

    return true;
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
