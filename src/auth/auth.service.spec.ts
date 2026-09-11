import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { authErrorMessages } from './auth.constants.js';
import { AuthService } from './auth.service.js';

type UsersServiceMock = {
  findUserEntityByUsername: ReturnType<typeof vi.fn>;
};

type JwtServiceMock = {
  signAsync: ReturnType<typeof vi.fn>;
};

vi.mock('argon2', () => ({
  verify: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersServiceMock;
  let jwtService: JwtServiceMock;

  beforeEach(async () => {
    vi.clearAllMocks();

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUserEntityByUsername: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
          },
        },
      ],
    }).compile();

    authService = testingModule.get(AuthService);
    usersService = testingModule.get<UsersServiceMock>(UsersService);
    jwtService = testingModule.get<JwtServiceMock>(JwtService);
  });

  it('returns an access token for valid credentials', async () => {
    const existingUser = {
      id: 'user-id',
      name: 'André Câmara',
      username: 'andre.camara',
      passwordHash: 'stored-password-hash',
    } as User;

    usersService.findUserEntityByUsername.mockResolvedValue(existingUser);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-access-token');

    await expect(
      authService.login({
        username: 'andre.camara',
        password: 'MinhaSenhaDeTeste123!',
      }),
    ).resolves.toEqual({ accessToken: 'signed-access-token' });

    expect(usersService.findUserEntityByUsername).toHaveBeenCalledWith(
      'andre.camara',
    );
    expect(argon2.verify).toHaveBeenCalledWith(
      'stored-password-hash',
      'MinhaSenhaDeTeste123!',
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      username: 'andre.camara',
    });
  });

  it('rejects an unknown user', async () => {
    usersService.findUserEntityByUsername.mockResolvedValue(null);

    await expect(
      authService.login({
        username: 'missing.user',
        password: 'MinhaSenhaDeTeste123!',
      }),
    ).rejects.toMatchObject({
      message: authErrorMessages.invalidCredentials,
    });

    expect(argon2.verify).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    const existingUser = {
      id: 'user-id',
      username: 'andre.camara',
      passwordHash: 'stored-password-hash',
    } as User;

    usersService.findUserEntityByUsername.mockResolvedValue(existingUser);
    vi.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      authService.login({
        username: 'andre.camara',
        password: 'SenhaIncorreta123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(argon2.verify).toHaveBeenCalledWith(
      'stored-password-hash',
      'SenhaIncorreta123!',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
