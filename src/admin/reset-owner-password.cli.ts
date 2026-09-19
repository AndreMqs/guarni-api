import 'reflect-metadata';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { User } from '../users/entities/user.entity.js';
import {
  OwnerRecoveryError,
  resetOwnerPassword,
} from './reset-owner-password.js';

async function main() {
  const [input, ...extra] = process.argv.slice(2);
  if (input === '--help' || input === '-h') {
    console.log('Uso: npm run owner:reset-password -- <username>');
    console.log(
      'Gera uma nova senha para um OWNER ativo após confirmação interativa.',
    );
    return;
  }
  if (!input?.trim() || extra.length) {
    throw new OwnerRecoveryError(
      'Informe apenas o username: npm run owner:reset-password -- <username>',
    );
  }
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new OwnerRecoveryError(
      'Execute em um terminal interativo; não use pipes nem redirecionamento.',
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new OwnerRecoveryError(
      'Configure DATABASE_URL no ambiente ou no arquivo .env.',
    );
  }
  const target = new URL(process.env.DATABASE_URL);
  const { default: db } = await import('../database/data-source.js');
  try {
    await db.initialize();
    const user = await db.manager.findOne(User, {
      where: { username: input.trim().toLowerCase() },
      select: { id: true, name: true, username: true },
    });
    if (!user) throw new OwnerRecoveryError('Usuário não encontrado.');
    const [{ database }] = await db.query(
      'SELECT current_database() AS database',
    );
    console.log(
      `Banco: ${database} | Servidor: ${target.hostname}:${target.port || '5432'}`,
    );
    console.log(
      `Usuário: ${user.username} | Nome: ${user.name} | ID: ${user.id}`,
    );
    console.log(
      'A senha atual será substituída. Tokens antigos continuam válidos até expirar (checkpoint 2 pendente).',
    );
    const terminal = createInterface({ input: stdin, output: stdout });
    let answer: string;
    try {
      answer = await terminal.question(
        `Digite RESET ${user.username} para confirmar: `,
      );
    } finally {
      terminal.close();
    }
    if (answer !== `RESET ${user.username}`) {
      console.log('Cancelado. Nenhuma senha foi alterada.');
      return;
    }
    const result = await resetOwnerPassword(db, user.id);
    console.log(`Senha redefinida para ${result.username}.`);
    console.log(`Nova senha: ${result.password}`);
    console.log(
      'Guarde a senha em local seguro e entregue-a ao proprietário por um canal privado.',
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

main().catch((error: unknown) => {
  // Avoid printing connection strings, SQL parameters or password hashes.
  console.error(
    error instanceof OwnerRecoveryError
      ? error.message
      : 'Não foi possível concluir a recuperação. Verifique a conexão e as migrations do banco.',
  );
  process.exitCode = 1;
});
