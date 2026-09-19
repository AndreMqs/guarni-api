import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { SetupOwnerDto } from './dto/setup-owner.dto.js';
import { SETUP_LOCK_KEY, setupErrorMessages } from './setup.constants.js';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Unit } from '../units/entities/unit.entity.js';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { membershipRoles } from '../memberships/memberships.constants.js';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class SetupService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {}

  async createOwner(dto: SetupOwnerDto, setupToken: string | undefined) {
    const expectedToken = this.configService.get<string>('SETUP_OWNER_TOKEN')

    if (!expectedToken || !setupToken) {
      throw new UnauthorizedException(setupErrorMessages.unauthorized)
    }

    const received = Buffer.from(setupToken, 'utf8');
    const expected = Buffer.from(expectedToken, 'utf8');

    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new UnauthorizedException(setupErrorMessages.unauthorized)
    }

    const passwordHash = await argon2.hash(dto.password)

    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [SETUP_LOCK_KEY])
      
      const unitCount = await manager.count(Unit)

      if (unitCount > 0) {
        throw new ConflictException(setupErrorMessages.alreadyCompleted)
      }

      const user = manager.create(User, {
        name: dto.name.trim(),
        username: dto.username.trim().toLowerCase(),
        passwordHash
      })
      const savedUser = await manager.save(user);

      const unit = manager.create(Unit, {
        name: dto.unitName.trim(),
        timezone: dto.timezone ?? 'America/Sao_Paulo',
        closingTime: dto.closingTime ?? '03:00'
      })
      const savedUnit = await manager.save(unit)

      const membership = manager.create(Membership, {
        userId: savedUser.id,
        unitId: savedUnit.id,
        role: membershipRoles.owner,
        isActive: true
      })
      const savedMembership = await manager.save(membership)

      const response = {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          username: savedUser.username,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
        },
        unit: {
          id: savedUnit.id,
          name: savedUnit.name,
          timezone: savedUnit.timezone,
          closingTime: savedUnit.closingTime
        },
        membership: {
          id: savedMembership.id,
          userId: savedMembership.userId,
          unitId: savedMembership.unitId,
          role: savedMembership.role,
          isActive: savedMembership.isActive
        }
      }

      return response
    })    
  }
}
