import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import type { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { membershipRoles } from '../memberships/memberships.constants.js';

export class OwnerRecoveryError extends Error {}

// Administrative operation: only the CLI invokes this, never a public route.
export async function resetOwnerPassword(db: DataSource, userId: string) {
  return db.transaction(async (manager) => {
    const user = await manager.findOneBy(User, { id: userId });
    if (!user) throw new OwnerRecoveryError('Usuário não encontrado.');

    const owner = await manager.findOneBy(Membership, {
      userId,
      role: membershipRoles.owner,
      isActive: true,
    });
    if (!owner) {
      throw new OwnerRecoveryError('O usuário não possui vínculo OWNER ativo.');
    }

    const password = randomBytes(24).toString('base64url');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await manager.update(User, { id: userId }, { passwordHash });
    if (result.affected !== 1) {
      throw new OwnerRecoveryError('O usuário não foi atualizado.');
    }

    // Checkpoint 2: add credentialVersion increment when learning revocation.
    // Until then, existing JWTs remain valid until expiration.
    return { username: user.username, password };
  });
}
