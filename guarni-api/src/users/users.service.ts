import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, type Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  userErrorMessages,
  usernameUniqueConstraint,
} from './users.constants.js';
import * as argon2 from 'argon2';
import { postgresErrorCodes } from '../database/database.constants.js';
import type { UserResponseDto } from './dto/user-response.dto.js';

const mapUserToResponse = (user: User): UserResponseDto => ({
  id: user.id,
  name: user.name,
  username: user.username,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findUserEntityByUsername(username: string): Promise<User | null> {
    const normalizedUsername = username.trim().toLowerCase();

    return this.usersRepository.findOneBy({
      username: normalizedUsername,
    });
  }

  async findUserEntityById(userId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id: userId });
  }

  async getPublicUserByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.findUserEntityByUsername(username);

    if (!user) {
      throw new NotFoundException(userErrorMessages.userNotFound);
    }

    return mapUserToResponse(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await argon2.hash(createUserDto.password);

    const user = this.usersRepository.create({
      name: createUserDto.name.trim(),
      username: createUserDto.username.trim().toLowerCase(),
      passwordHash,
    });

    try {
      const savedUser = await this.usersRepository.save(user);

      return mapUserToResponse(savedUser);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const databaseError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          databaseError.code === postgresErrorCodes.uniqueViolation &&
          databaseError.constraint === usernameUniqueConstraint
        ) {
          throw new ConflictException(userErrorMessages.usernameAlreadyInUse);
        }
      }

      throw error;
    }
  }

  async deleteUserById(userId: string): Promise<void> {
    const deleteResult = await this.usersRepository.delete(userId);

    if (deleteResult.affected === 0) {
      throw new NotFoundException(userErrorMessages.userNotFound);
    }
  }
}
