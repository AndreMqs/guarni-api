import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, type TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Membership } from '../memberships/entities/membership.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { authErrorMessages } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { DataSource } from 'typeorm';

type UsersServiceMock = {
  findUserEntityByUsername: ReturnType<typeof vi.fn>;
  findUserEntityById: ReturnType<typeof vi.fn>;
};

type JwtServiceMock = { signAsync: ReturnType<typeof vi.fn> };
type MembershipsRepositoryMock = {
  countBy: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
};

vi.mock('argon2', () => ({ verify: vi.fn(), hash: vi.fn() }));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersServiceMock;
  let jwtService: JwtServiceMock;
  let membershipsRepository: MembershipsRepositoryMock;
  const update = vi.fn();
  const transaction = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    transaction.mockImplementation((callback) => callback({ update }));

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: { transaction } },
        {
          provide: UsersService,
          useValue: {
            findUserEntityByUsername: vi.fn(),
            findUserEntityById: vi.fn(),
          },
        },
        { provide: JwtService, useValue: { signAsync: vi.fn() } },
        {
          provide: getRepositoryToken(Membership),
          useValue: { countBy: vi.fn(), find: vi.fn() },
        },
      ],
    }).compile();

    authService = testingModule.get(AuthService);
    usersService = testingModule.get<UsersServiceMock>(UsersService);
    jwtService = testingModule.get<JwtServiceMock>(JwtService);
    membershipsRepository = testingModule.get<MembershipsRepositoryMock>(
      getRepositoryToken(Membership),
    );
  });

  it('returns an access token for valid credentials with an active membership', async () => {
    const existingUser = {
      id: 'user-id',
      name: 'André Câmara',
      username: 'andre.camara',
      passwordHash: 'stored-password-hash',
      credentialVersion: 1,
    } as User;

    usersService.findUserEntityByUsername.mockResolvedValue(existingUser);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    membershipsRepository.countBy.mockResolvedValue(1);
    jwtService.signAsync.mockResolvedValue('signed-access-token');

    await expect(
      authService.login({
        username: 'andre.camara',
        password: 'MinhaSenhaDeTeste123!',
      }),
    ).resolves.toEqual({ accessToken: 'signed-access-token' });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      username: 'andre.camara',
      credentialVersion: 1,
    });
  });

  it('rejects a user without active memberships', async () => {
    usersService.findUserEntityByUsername.mockResolvedValue({
      id: 'user-id',
      username: 'andre.camara',
      passwordHash: 'stored-password-hash',
      credentialVersion: 1,
    } as User);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    membershipsRepository.countBy.mockResolvedValue(0);

    await expect(
      authService.login({
        username: 'andre.camara',
        password: 'MinhaSenhaDeTeste123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown user', async () => {
    usersService.findUserEntityByUsername.mockResolvedValue(null);

    await expect(
      authService.login({
        username: 'missing.user',
        password: 'MinhaSenhaDeTeste123!',
      }),
    ).rejects.toMatchObject({ message: authErrorMessages.invalidCredentials });

    expect(argon2.verify).not.toHaveBeenCalled();
    expect(membershipsRepository.countBy).not.toHaveBeenCalled();
  });

  it('rejects an invalid password', async () => {
    usersService.findUserEntityByUsername.mockResolvedValue({
      id: 'user-id',
      username: 'andre.camara',
      passwordHash: 'stored-password-hash',
      credentialVersion: 1,
    } as User);
    vi.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      authService.login({
        username: 'andre.camara',
        password: 'SenhaIncorreta123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(membershipsRepository.countBy).not.toHaveBeenCalled();
  });

  it('returns current user with active memberships', async () => {
    usersService.findUserEntityById.mockResolvedValue({
      id: 'user-id',
      name: 'André Câmara',
      username: 'andre.camara',
    } as User);
    membershipsRepository.find.mockResolvedValue([
      {
        id: 'membership-id',
        role: 'OWNER',
        unit: { id: 'unit-id', name: 'Guarni Tatuapé' },
      } as Membership,
    ]);

    await expect(authService.getCurrentUser('user-id')).resolves.toEqual({
      user: {
        id: 'user-id',
        name: 'André Câmara',
        username: 'andre.camara',
      },
      memberships: [
        {
          id: 'membership-id',
          role: 'OWNER',
          unit: { id: 'unit-id', name: 'Guarni Tatuapé' },
        },
      ],
    });
  });

  describe('changePassword', () => {
    const dto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };
    beforeEach(() => {
      usersService.findUserEntityById.mockResolvedValue({
        id: 'user-id',
        username: 'owner',
        passwordHash: 'old-hash',
        credentialVersion: 3,
      });
      vi.mocked(argon2.verify).mockResolvedValue(true);
      vi.mocked(argon2.hash).mockResolvedValue('new-hash');
      update.mockResolvedValue({ affected: 1 });
      jwtService.signAsync.mockResolvedValue('new-token');
    });

    it('updates only the verified version and signs a token with the incremented version', async () => {
      await expect(authService.changePassword('user-id', dto)).resolves.toEqual(
        { accessToken: 'new-token' },
      );
      expect(argon2.verify).toHaveBeenCalledWith(
        'old-hash',
        dto.currentPassword,
      );
      expect(update).toHaveBeenCalledWith(
        User,
        { id: 'user-id', credentialVersion: 3 },
        { passwordHash: 'new-hash', credentialVersion: 4 },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        username: 'owner',
        credentialVersion: 4,
      });
    });

    it.each(['missing user', 'wrong password'])(
      'rejects %s before writing',
      async (scenario) => {
        if (scenario === 'missing user')
          usersService.findUserEntityById.mockResolvedValue(null);
        else vi.mocked(argon2.verify).mockResolvedValue(false);
        await expect(
          authService.changePassword('user-id', dto),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(argon2.hash).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
      },
    );

    it('rejects a concurrent credential change without issuing a token', async () => {
      update.mockResolvedValue({ affected: 0 });
      await expect(
        authService.changePassword('user-id', dto),
      ).rejects.toMatchObject({
        message: authErrorMessages.invalidOrExpiredAccessToken,
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('propagates signing errors out of the transaction callback', async () => {
      const error = new Error('Signing failed');
      jwtService.signAsync.mockRejectedValue(error);
      await expect(authService.changePassword('user-id', dto)).rejects.toBe(
        error,
      );
    });
  });
});
