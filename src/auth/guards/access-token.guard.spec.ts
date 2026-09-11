import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { authErrorMessages } from '../auth.constants.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';
import { AccessTokenGuard } from './access-token.guard.js';

type JwtServiceMock = {
  verifyAsync: ReturnType<typeof vi.fn>;
};

const createExecutionContext = (authorization?: string) => {
  const request = {
    headers: authorization ? { authorization } : {},
  } as unknown as AuthenticatedRequest;

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;

  return { context, request };
};

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let jwtService: JwtServiceMock;

  beforeEach(() => {
    vi.clearAllMocks();

    jwtService = {
      verifyAsync: vi.fn(),
    };

    guard = new AccessTokenGuard(jwtService as unknown as JwtService);
  });

  it('allows a valid access token and attaches its payload to the request', async () => {
    const payload = {
      sub: 'user-id',
      username: 'andre.camara',
    };
    const { context, request } = createExecutionContext(
      'Bearer valid-access-token',
    );

    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-access-token');
    expect(request.user).toEqual(payload);
  });

  it('rejects a request without an authorization header', async () => {
    const { context } = createExecutionContext();

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: authErrorMessages.invalidOrExpiredAccessToken,
    });

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it.each([
    'Basic access-token',
    'Bearer',
    'Bearer ',
    'Bearer access-token extra-value',
    'bearer access-token',
  ])('rejects an invalid authorization header: %s', async (authorization) => {
    const { context } = createExecutionContext(authorization);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a token that fails verification', async () => {
    const { context, request } = createExecutionContext(
      'Bearer invalid-access-token',
    );

    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: authErrorMessages.invalidOrExpiredAccessToken,
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-access-token');
    expect(request.user).toBeUndefined();
  });
});
