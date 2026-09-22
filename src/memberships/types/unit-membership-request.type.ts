import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.type.js';
import type { Membership } from '../entities/membership.entity.js';

export type UnitMembershipRequest = AuthenticatedRequest & {
  membership: Membership;
};
