import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ClockService } from '../clock/clock.service.js';
import type { Membership } from '../memberships/entities/membership.entity.js';
import {
  membershipRoles,
  type MembershipRole,
} from '../memberships/memberships.constants.js';
import { OperationalDaysService } from '../operational-days/operational-days.service.js';
import type { UnitContextResponseDto } from './dto/unit-context-response.dto.js';
import type { UpdateUnitSettingsDto } from './dto/update-unit-settings.dto.js';
import { Unit } from './entities/unit.entity.js';
import { unitsErrorMessages } from './units.constants.js';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    private readonly operationalDaysService: OperationalDaysService,
    private readonly clockService: ClockService,
  ) {}

  async getContext(
    requestingMembership: Membership,
  ): Promise<UnitContextResponseDto> {
    const unit = await this.unitRepository.findOneBy({
      id: requestingMembership.unitId,
    });

    if (!unit) {
      throw new NotFoundException(unitsErrorMessages.unityNotFound);
    }

    const serverTime = this.clockService.now();
    const operationalDay =
      await this.operationalDaysService.getOrCreateCurrentDay(
        unit,
        serverTime,
      );

    return {
      unit: {
        id: unit.id,
        name: unit.name,
        timezone: unit.timezone,
        closingTime: unit.closingTime,
      },
      membership: {
        id: requestingMembership.id,
        role: requestingMembership.role,
      },
      permissions: this.getPermissions(requestingMembership.role),
      operationalDay: {
        date: operationalDay.date,
        opensAt: operationalDay.opensAt.toISOString(),
        closesAt: operationalDay.closesAt.toISOString(),
        isClosed: operationalDay.closedAt !== null,
      },
      serverTime: serverTime.toISOString(),
    };
  }

  async getSettings(unitId: string) {
    const unit = await this.unitRepository.findOneBy({ id: unitId });

    if (!unit) {
      throw new NotFoundException(unitsErrorMessages.unityNotFound);
    }

    return {
      id: unit.id,
      name: unit.name,
      timezone: unit.timezone,
      closingTime: unit.closingTime,
      version: unit.version,
    };
  }

  updateSettings(_unitId: string, _dto: UpdateUnitSettingsDto): never {
    throw new NotImplementedException(
      'Atualização de settings depende do checkpoint de versionamento otimista.',
    );
  }

  private getPermissions(role: MembershipRole) {
    const isOwner = role === membershipRoles.owner;
    const isManagement = isOwner || role === membershipRoles.manager;

    return {
      canManageTasks: isManagement,
      canManageUsers: isManagement,
      canManageOwnersAndManagers: isOwner,
      canManageSettings: isManagement,
      canViewAudit: isOwner,
      canCorrectAnyExecution: isManagement,
    };
  }
}
