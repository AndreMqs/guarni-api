import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Membership } from '../entities/membership.entity.js';
import type { UnitMembershipRequest } from '../types/unit-membership-request.type.js';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Membership => {
    const request = context.switchToHttp().getRequest<UnitMembershipRequest>();

    return request.membership;
  },
);
