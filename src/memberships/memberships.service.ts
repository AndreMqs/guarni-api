import { Injectable, NotImplementedException } from '@nestjs/common';
import type { CreateUnitUserDto } from './dto/create-unit-user.dto.js';
import type { DeactivateMembershipDto } from './dto/deactivate-membership.dto.js';
import type { ListMembershipsQueryDto } from './dto/list-memberships-query.dto.js';
import type { ReactivateMembershipDto } from './dto/reactivate-membership.dto.js';
import type { ResetMembershipPasswordDto } from './dto/reset-membership-password.dto.js';
import type { UpdateMembershipRoleDto } from './dto/update-membership-role.dto.js';

@Injectable()
export class MembershipsService {
  list(_unitId: string, _query: ListMembershipsQueryDto): never {
    throw new NotImplementedException('Aguardando autorização por membership.');
  }

  getById(_unitId: string, _membershipId: string): never {
    throw new NotImplementedException('Aguardando autorização/hierarquia.');
  }

  createUser(_unitId: string, _dto: CreateUnitUserDto): never {
    throw new NotImplementedException(
      'Cadastro User + Membership é o exercício de transação após o bootstrap.',
    );
  }

  updateRole(
    _unitId: string,
    _membershipId: string,
    _dto: UpdateMembershipRoleDto,
  ): never {
    throw new NotImplementedException(
      'Alteração de papel depende de hierarquia, lock e expectedVersion.',
    );
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
