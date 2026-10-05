import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import type { CreateUnitUserDto } from './dto/create-unit-user.dto.js';
import type { DeactivateMembershipDto } from './dto/deactivate-membership.dto.js';
import type { ListMembershipsQueryDto } from './dto/list-memberships-query.dto.js';
import type { ReactivateMembershipDto } from './dto/reactivate-membership.dto.js';
import type { ResetMembershipPasswordDto } from './dto/reset-membership-password.dto.js';
import type { UpdateMembershipRoleDto } from './dto/update-membership-role.dto.js';
import { Membership } from './entities/membership.entity.js';
import {
  membershipManagementErrorMessages,
  membershipRoles,
} from './memberships.constants.js';
import { DataSource, type EntityManager } from 'typeorm';
import { Unit } from '../units/entities/unit.entity.js';
import { BusinessEvent } from '../business-events/entities/business-event.entity.js';
import {
  businessEventActorTypes,
  businessEventCategories,
  businessEventSubjectTypes,
  businessEventTypes,
} from '../business-events/business-events.constants.js';
import { UpdateMembershipRoleResponseDto } from './dto/update-membership-role-response.dto.js';
import type {
  MembershipResponseDto,
  MembershipListResponseDto,
} from './dto/membership-response.dto.js';

type UpdateRoleParams = {
  requestingMembership: Membership;
  unitId: string;
  membershipToUpdateId: string;
  roleUpdateData: UpdateMembershipRoleDto;
};

type PersistRoleUpdateParams = {
  transactionManager: EntityManager;
  membershipToUpdate: Membership;
  expectedVersion: number;
  roleAfterUpdate: Pick<Membership, 'role' | 'version'>;
};

type RecordRoleChangeEventParams = {
  transactionManager: EntityManager;
  requestingMembership: Membership;
  membershipToUpdate: Membership;
  roleBeforeUpdate: Pick<Membership, 'role' | 'version'>;
  roleAfterUpdate: Pick<Membership, 'role' | 'version'>;
};

@Injectable()
export class MembershipsService {
  constructor(private readonly dataSource: DataSource) {}

  async list(
    requestingMembership: Membership,
    filters: ListMembershipsQueryDto,
  ): Promise<MembershipListResponseDto> {
    this.ensureCanReadTeam(requestingMembership);
    const query = this.createMembershipReadQuery(requestingMembership.unitId);
    if (filters.isActive !== undefined) {
      query.andWhere('membership.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }
    if (filters.role !== undefined) {
      query.andWhere('membership.role = :role', { role: filters.role });
    }
    const search = filters.search?.trim().toLowerCase();
    if (search) {
      // Literal substring search: %, _ and quotes are not wildcard operators.
      query.andWhere(
        '(POSITION(:search IN LOWER(TRIM(user.name))) > 0 OR POSITION(:search IN LOWER(TRIM(user.username))) > 0)',
        { search },
      );
    }
    const memberships = await query
      .orderBy('LOWER(user.name)', 'ASC')
      .addOrderBy('user.username', 'ASC')
      .addOrderBy('membership.id', 'ASC')
      .getMany();
    return {
      items: memberships.map((membership) =>
        this.mapMembershipResponse(membership),
      ),
    };
  }

  async getById(
    requestingMembership: Membership,
    membershipId: string,
  ): Promise<MembershipResponseDto> {
    this.ensureCanReadTeam(requestingMembership);
    const membership = await this.createMembershipReadQuery(
      requestingMembership.unitId,
    )
      .andWhere('membership.id = :membershipId', { membershipId })
      .getOne();
    if (!membership) {
      throw new NotFoundException(
        membershipManagementErrorMessages.membershipNotFound,
      );
    }
    if (
      requestingMembership.role === membershipRoles.manager &&
      membership.role !== membershipRoles.employee
    ) {
      throw new ForbiddenException(
        membershipManagementErrorMessages.accessDenied,
      );
    }
    return this.mapMembershipResponse(membership);
  }

  private ensureCanReadTeam(membership: Membership): void {
    if (
      !membership.isActive ||
      (membership.role !== membershipRoles.owner &&
        membership.role !== membershipRoles.manager)
    ) {
      throw new ForbiddenException(
        membershipManagementErrorMessages.accessDenied,
      );
    }
  }

  private createMembershipReadQuery(unitId: string) {
    return this.dataSource
      .getRepository(Membership)
      .createQueryBuilder('membership')
      .innerJoin('membership.user', 'user')
      .select([
        'membership.id',
        'membership.role',
        'membership.isActive',
        'membership.version',
        'user.id',
        'user.name',
        'user.username',
      ])
      .where('membership.unitId = :unitId', { unitId });
  }

  private mapMembershipResponse(membership: Membership): MembershipResponseDto {
    return {
      id: membership.id,
      role: membership.role,
      isActive: membership.isActive,
      version: membership.version,
      user: {
        id: membership.user.id,
        name: membership.user.name,
        username: membership.user.username,
      },
    };
  }

  createUser(_unitId: string, _dto: CreateUnitUserDto): never {
    throw new NotImplementedException(
      'Cadastro User + Membership é o exercício de transação após o bootstrap.',
    );
  }

  private canUpdateRole(
    requestingMembership: Membership,
    membershipToUpdate: Membership,
    roleUpdateData: UpdateMembershipRoleDto,
  ) {
    if (requestingMembership.role === membershipRoles.owner) {
      return true;
    }

    if (requestingMembership.role === membershipRoles.manager) {
      return (
        membershipToUpdate.role === membershipRoles.employee &&
        roleUpdateData.role === membershipRoles.employee
      );
    }

    return false;
  }

  private isDemotingActiveOwner(
    membershipToUpdate: Membership,
    roleUpdateData: UpdateMembershipRoleDto,
  ) {
    return (
      membershipToUpdate.isActive &&
      membershipToUpdate.role === membershipRoles.owner &&
      roleUpdateData.role !== membershipRoles.owner
    );
  }

  private async lockUnitForMembershipChange(
    transactionManager: EntityManager,
    unitId: string,
  ): Promise<void> {
    const unit = await transactionManager.findOne(Unit, {
      where: { id: unitId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!unit) {
      throw new NotFoundException(
        membershipManagementErrorMessages.unitNotFound,
      );
    }
  }

  private async getCurrentRequestingMembership(
    transactionManager: EntityManager,
    requestingMembershipId: string,
    unitId: string,
  ): Promise<Membership> {
    const membership = await transactionManager.findOne(Membership, {
      where: { id: requestingMembershipId, unitId, isActive: true },
      relations: { user: true },
    });

    if (!membership || membership.role === membershipRoles.employee) {
      throw new ForbiddenException(
        membershipManagementErrorMessages.accessDenied,
      );
    }

    return membership;
  }

  private async getMembershipToUpdate(
    transactionManager: EntityManager,
    membershipToUpdateId: string,
    unitId: string,
  ): Promise<Membership> {
    const membership = await transactionManager.findOne(Membership, {
      where: { id: membershipToUpdateId, unitId },
      relations: { user: true },
    });

    if (!membership) {
      throw new NotFoundException(
        membershipManagementErrorMessages.membershipNotFound,
      );
    }

    return membership;
  }

  private validateRoleUpdate(
    requestingMembership: Membership,
    membershipToUpdate: Membership,
    roleUpdateData: UpdateMembershipRoleDto,
  ): void {
    if (
      !this.canUpdateRole(
        requestingMembership,
        membershipToUpdate,
        roleUpdateData,
      )
    ) {
      throw new ForbiddenException(
        membershipManagementErrorMessages.accessDenied,
      );
    }

    if (membershipToUpdate.version !== roleUpdateData.expectedVersion) {
      throw new ConflictException(
        membershipManagementErrorMessages.versionConflict,
      );
    }
  }

  private async ensureActiveOwnerRemains(
    transactionManager: EntityManager,
    membershipToUpdate: Membership,
    roleUpdateData: UpdateMembershipRoleDto,
  ): Promise<void> {
    if (!this.isDemotingActiveOwner(membershipToUpdate, roleUpdateData)) {
      return;
    }

    // A unidade deve estar bloqueada pela mesma transação antes desta contagem.
    const activeOwnerCount = await transactionManager.count(Membership, {
      where: {
        unitId: membershipToUpdate.unitId,
        role: membershipRoles.owner,
        isActive: true,
      },
    });

    if (activeOwnerCount <= 1) {
      throw new ConflictException(
        membershipManagementErrorMessages.lastActiveOwner,
      );
    }
  }

  private async persistRoleUpdate(
    params: PersistRoleUpdateParams,
  ): Promise<void> {
    const {
      transactionManager,
      membershipToUpdate,
      expectedVersion,
      roleAfterUpdate,
    } = params;
    const updateResult = await transactionManager.update(
      Membership,
      {
        id: membershipToUpdate.id,
        unitId: membershipToUpdate.unitId,
        version: expectedVersion,
      },
      roleAfterUpdate,
    );

    if (updateResult.affected !== 1) {
      throw new ConflictException(
        membershipManagementErrorMessages.versionConflict,
      );
    }
  }

  private async recordRoleChangeEvent(
    params: RecordRoleChangeEventParams,
  ): Promise<void> {
    const {
      transactionManager,
      requestingMembership,
      membershipToUpdate,
      roleBeforeUpdate,
      roleAfterUpdate,
    } = params;

    await transactionManager.insert(BusinessEvent, {
      unitId: membershipToUpdate.unitId,
      category: businessEventCategories.users,
      eventType: businessEventTypes.membershipRoleChanged,
      actorType: businessEventActorTypes.user,
      actorMembershipId: requestingMembership.id,
      actorNameSnapshot: requestingMembership.user.name,
      actorRoleSnapshot: requestingMembership.role,
      subjectType: businessEventSubjectTypes.membership,
      subjectId: membershipToUpdate.id,
      subjectTitleSnapshot: membershipToUpdate.user.name,
      before: roleBeforeUpdate,
      after: roleAfterUpdate,
      occurredAt: new Date(),
    });
  }

  updateRole(
    params: UpdateRoleParams,
  ): Promise<UpdateMembershipRoleResponseDto> {
    const {
      requestingMembership,
      unitId,
      membershipToUpdateId,
      roleUpdateData,
    } = params;
    if (requestingMembership.role === membershipRoles.employee) {
      throw new ForbiddenException(
        membershipManagementErrorMessages.accessDenied,
      );
    }

    return this.dataSource.transaction(async (transactionManager) => {
      await this.lockUnitForMembershipChange(transactionManager, unitId);
      const currentRequestingMembership =
        await this.getCurrentRequestingMembership(
          transactionManager,
          requestingMembership.id,
          unitId,
        );

      const membershipToUpdate = await this.getMembershipToUpdate(
        transactionManager,
        membershipToUpdateId,
        unitId,
      );

      this.validateRoleUpdate(
        currentRequestingMembership,
        membershipToUpdate,
        roleUpdateData,
      );
      await this.ensureActiveOwnerRemains(
        transactionManager,
        membershipToUpdate,
        roleUpdateData,
      );

      const roleBeforeUpdate = {
        role: membershipToUpdate.role,
        version: membershipToUpdate.version,
      };
      const roleAfterUpdate = {
        role: roleUpdateData.role,
        version: roleUpdateData.expectedVersion + 1,
      };

      await this.persistRoleUpdate({
        transactionManager,
        membershipToUpdate,
        expectedVersion: roleUpdateData.expectedVersion,
        roleAfterUpdate,
      });

      await this.recordRoleChangeEvent({
        transactionManager,
        requestingMembership: currentRequestingMembership,
        membershipToUpdate,
        roleBeforeUpdate,
        roleAfterUpdate,
      });

      return {
        id: membershipToUpdate.id,
        role: roleAfterUpdate.role,
        version: roleAfterUpdate.version,
      };
    });
  }

  getReassignmentSummary(_unitId: string, _membershipId: string): never {
    throw new NotImplementedException(
      'Resumo ficará para depois do modelo de tarefas estar operacional.',
    );
  }

  deactivate(
    _unitId: string,
    _membershipId: string,
    _dto: DeactivateMembershipDto,
  ): never {
    throw new NotImplementedException(
      'Desativação + reatribuição é um checkpoint de transação/lock.',
    );
  }

  reactivate(
    _unitId: string,
    _membershipId: string,
    _dto: ReactivateMembershipDto,
  ): never {
    throw new NotImplementedException(
      'Reativação depende de autorização/hierarquia e expectedVersion.',
    );
  }

  resetPassword(
    _unitId: string,
    _membershipId: string,
    _dto: ResetMembershipPasswordDto,
  ): never {
    throw new NotImplementedException(
      'Reset administrativo depende de hierarquia e credentialVersion.',
    );
  }
}
