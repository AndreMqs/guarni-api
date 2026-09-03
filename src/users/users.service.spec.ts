import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

type UsersRepositoryMock = {
  findOneBy: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

vi.mock('argon2', () => ({
  hash: vi.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: UsersRepositoryMock;

  beforeEach(async () => {
    vi.clearAllMocks();

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
          },
        },
      ],
    }).compile();

    usersService = testingModule.get(UsersService);
    usersRepository = testingModule.get(getRepositoryToken(User));
  });

  describe('findByUsername', () => {
    it('normalizes the username before searching', async () => {
      const existingUser = {
        username: 'andre.camara',
      } as User;

      usersRepository.findOneBy.mockResolvedValue(existingUser);

      const foundUser = await usersService.findByUsername(' Andre.Camara ');

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        username: 'andre.camara',
      });
      expect(foundUser).toBe(existingUser);
    });
  });

  describe('getByUsername', () => {
    it('returns the public user without the password hash', async () => {
      const createdAt = new Date();
      const updatedAt = new Date();

      const existingUser = {
        id: 'user-id',
        name: 'André Câmara',
        username: 'andre.camara',
        passwordHash: 'stored-password-hash',
        createdAt,
        updatedAt,
      } as User;

      usersRepository.findOneBy.mockResolvedValue(existingUser);

      const userResponse = await usersService.getByUsername('andre.camara');

      expect(userResponse).toEqual({
        id: 'user-id',
        name: 'André Câmara',
        username: 'andre.camara',
        createdAt,
        updatedAt,
      });
      expect(userResponse).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(
        usersService.getByUsername('missing.user'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('hashes the password, saves the user and returns the public response', async () => {
      const createUserDto = {
        name: ' André Câmara ',
        username: ' Andre.Camara ',
        password: 'MinhaSenhaDeTeste123!',
      };

      const userToSave = {
        name: 'André Câmara',
        username: 'andre.camara',
        passwordHash: 'generated-password-hash',
      } as User;

      const savedUser = {
        ...userToSave,
        id: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      vi.mocked(argon2.hash).mockResolvedValue('generated-password-hash');
      usersRepository.create.mockReturnValue(userToSave);
      usersRepository.save.mockResolvedValue(savedUser);

      const userResponse = await usersService.create(createUserDto);

      expect(userResponse).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        username: savedUser.username,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      });
      expect(argon2.hash).toHaveBeenCalledWith('MinhaSenhaDeTeste123!');
      expect(usersRepository.create).toHaveBeenCalledWith({
        name: 'André Câmara',
        username: 'andre.camara',
        passwordHash: 'generated-password-hash',
      });
      expect(usersRepository.save).toHaveBeenCalledWith(userToSave);
      expect(userResponse).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException when the username already exists', async () => {
      const createUserDto = {
        name: 'André Câmara',
        username: 'andre.camara',
        password: 'MinhaSenhaDeTeste123!',
      };

      const userToSave = {
        name: createUserDto.name,
        username: createUserDto.username,
        passwordHash: 'generated-password-hash',
      } as User;

      const uniqueViolationError = new QueryFailedError(
        'INSERT INTO users',
        [],
        Object.assign(new Error('Username already exists'), {
          code: '23505',
          constraint: 'UQ_users_username',
        }),
      );

      vi.mocked(argon2.hash).mockResolvedValue('generated-password-hash');
      usersRepository.create.mockReturnValue(userToSave);
      usersRepository.save.mockRejectedValue(uniqueViolationError);

      await expect(usersService.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows database errors unrelated to username uniqueness', async () => {
      const createUserDto = {
        name: 'André Câmara',
        username: 'andre.camara',
        password: 'MinhaSenhaDeTeste123!',
      };

      const userToSave = {
        name: createUserDto.name,
        username: createUserDto.username,
        passwordHash: 'generated-password-hash',
      } as User;

      const unrelatedDatabaseError = new QueryFailedError(
        'INSERT INTO users',
        [],
        Object.assign(new Error('Username already exists'), {
          code: '23505',
          constraint: 'UQ_another_constraint',
        }),
      );

      vi.mocked(argon2.hash).mockResolvedValue('generated-password-hash');
      usersRepository.create.mockReturnValue(userToSave);
      usersRepository.save.mockRejectedValue(unrelatedDatabaseError);

      await expect(usersService.create(createUserDto)).rejects.toBe(
        unrelatedDatabaseError,
      );
    });
  });
});
