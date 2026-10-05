import type { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { membershipRoles } from '../memberships/memberships.constants.js';

export async function listUsers(db: DataSource) {
  // Select only identification fields: never load password hashes for this list.
  const users = await db.manager.find(User, {
    select: { id: true, name: true, username: true },
    order: { name: 'ASC', username: 'ASC' },
  });
  const memberships = await db.manager.find(Membership, {
    select: {
      id: true,
      userId: true,
      unitId: true,
      role: true,
      isActive: true,
      unit: { id: true, name: true },
    },
    relations: { unit: true },
    order: { unit: { name: 'ASC', id: 'ASC' } },
  });
  return users.map((user) => mapUserWithMemberships(user, memberships));
}

function mapUserWithMemberships(user: User, memberships: Membership[]) {
  const links = memberships.filter(
    (membership) => membership.userId === user.id,
  );
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    canResetOwnerPassword: links.some(
      (link) => link.role === membershipRoles.owner && link.isActive,
    ),
    memberships: links.map((link) => ({
      unitId: link.unitId,
      unitName: link.unit.name,
      role: link.role,
      isActive: link.isActive,
    })),
  };
}
