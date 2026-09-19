import 'reflect-metadata';
import { listUsers } from './list-users.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Uso: npm run admin:list-users');
    console.log(
      'Lista nomes, usernames e vínculos de todos os usuários, sem senhas ou hashes.',
    );
    return;
  }
  if (args.length) {
    console.error(
      'Este comando não recebe argumentos. Uso: npm run admin:list-users',
    );
    process.exitCode = 1;
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error('Configure DATABASE_URL no ambiente ou no arquivo .env.');
    process.exitCode = 1;
    return;
  }
  const target = new URL(process.env.DATABASE_URL);
  const { default: db } = await import('../database/data-source.js');
  try {
    await db.initialize();
    const [{ database }] = await db.query(
      'SELECT current_database() AS database',
    );
    console.log(
      `Banco: ${database} | Servidor: ${target.hostname}:${target.port || '5432'}`,
    );
    const users = await listUsers(db);
    if (!users.length) {
      console.log('Nenhum usuário cadastrado.');
      return;
    }
    console.table(
      users.flatMap((user) => {
        const identity = {
          ID: user.id,
          Nome: user.name,
          Username: user.username,
          'Reset OWNER': user.canResetOwnerPassword ? 'Sim' : 'Não',
        };
        return user.memberships.length
          ? user.memberships.map((link) => ({
              ...identity,
              Unidade: link.unitName,
              'ID da unidade': link.unitId,
              Papel: link.role,
              Vínculo: link.isActive ? 'Ativo' : 'Inativo',
            }))
          : [
              {
                ...identity,
                Unidade: 'Sem vínculo',
                'ID da unidade': '-',
                Papel: '-',
                Vínculo: '-',
              },
            ];
      }),
    );
    console.log(
      `${users.length} usuário(s). Uma linha por vínculo com unidade.`,
    );
    console.log(
      'Para recuperar um OWNER ativo: npm run owner:reset-password -- <username>',
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
}

main().catch(() => {
  console.error(
    'Não foi possível listar os usuários. Verifique a conexão e as migrations do banco.',
  );
  process.exitCode = 1;
});
