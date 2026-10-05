import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import type { DataSource, EntityManager } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Membership } from '../memberships/entities/membership.entity.js';
import { membershipRoles } from '../memberships/memberships.constants.js';

export class OwnerRecoveryError extends Error {}

async function getRecoverableOwner(
  transactionManager: EntityManager,
  userId: string,
): Promise<User> {
  const user = await transactionManager.findOneBy(User, { id: userId });
  if (!user) throw new OwnerRecoveryError('Usuário não encontrado.');
  const owner = await transactionManager.findOneBy(Membership, {
    userId,
    role: membershipRoles.owner,
    isActive: true,
  });
  if (!owner) {
    throw new OwnerRecoveryError('O usuário não possui vínculo OWNER ativo.');
  }
  return user;
}

async function updateOwnerCredentials(
  transactionManager: EntityManager,
  user: User,
  passwordHash: string,
): Promise<void> {
  const result = await transactionManager.update(
    User,
    { id: user.id, credentialVersion: user.credentialVersion },
    { passwordHash, credentialVersion: user.credentialVersion + 1 },
  );
  if (result.affected !== 1) {
    throw new OwnerRecoveryError(
      'As credenciais mudaram durante a recuperação. Execute novamente.',
    );
  }
}

// Administrative operation: only the CLI invokes this, never a public route.
export async function resetOwnerPassword(db: DataSource, userId: string) {
  return db.transaction(async (transactionManager) => {
    const user = await getRecoverableOwner(transactionManager, userId);

    const password = randomBytes(24).toString('base64url');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await updateOwnerCredentials(transactionManager, user, passwordHash);

    return { username: user.username, password };
  });
}
