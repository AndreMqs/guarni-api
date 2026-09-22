import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership } from '../entities/membership.entity.js';
import { type Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { unitMembershipErrorMessages } from '../memberships.constants.js';
import { type UnitMembershipRequest } from '../types/unit-membership-request.type.js';

@Injectable()
export class UnitMembershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UnitMembershipRequest>();

    const unitId = request.params.unitId;
    const userId = request.user.sub;

    if (typeof unitId !== 'string' || !isUUID(unitId)) {
      throw new BadRequestException(unitMembershipErrorMessages.invalidUuid);
    }

    const membership = await this.membershipRepository.findOneBy({
      userId,
      unitId,
      isActive: true,
    });

    if (!membership) {
      throw new ForbiddenException(unitMembershipErrorMessages.accessDenied);
    }

    request.membership = membership;

    return true;
  }
}
