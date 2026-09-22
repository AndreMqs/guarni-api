import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { authErrorMessages } from '../auth.constants.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';
import { AccessTokenGuard } from './access-token.guard.js';
import type { UsersService } from '../../users/users.service.js';

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
  const findUserEntityById = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    findUserEntityById.mockResolvedValue({
      id: 'user-id',
      credentialVersion: 1,
    });

    jwtService = {
      verifyAsync: vi.fn(),
    };

    guard = new AccessTokenGuard(
      jwtService as unknown as JwtService,
      { findUserEntityById } as unknown as UsersService,
    );
  });

  it('allows a valid access token and attaches its payload to the request', async () => {
    const payload = {
      sub: 'user-id',
      username: 'andre.camara',
      credentialVersion: 1,
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
    expect(findUserEntityById).not.toHaveBeenCalled();
  });

  it.each([null, { credentialVersion: 2 }])(
    'rejects missing users or revoked versions (%j)',
    async (user) => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        credentialVersion: 1,
      });
      findUserEntityById.mockResolvedValue(user);
      const { context, request } = createExecutionContext(
        'Bearer signed-token',
      );
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(request.user).toBeUndefined();
    },
  );

  it('rejects legacy tokens without a credential version', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
    const { context } = createExecutionContext('Bearer legacy-token');
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('does not disguise database errors as invalid credentials', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      credentialVersion: 1,
    });
    const failure = new Error('Database unavailable');
    findUserEntityById.mockRejectedValue(failure);
    const { context, request } = createExecutionContext('Bearer signed-token');
    await expect(guard.canActivate(context)).rejects.toBe(failure);
    expect(request.user).toBeUndefined();
  });
});
