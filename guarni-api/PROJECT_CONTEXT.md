---
project: Guarni
context_date: 2026-09-19
repository: guarni-api
branch: main
current_commit: b431649
code_working_tree_at_snapshot: clean
current_status: Scaffold do MVP preparado; contratos/entities/migration prontos; conceitos novos marcados como checkpoints de aprendizado
next_focus: Checkpoint 1 — bootstrap transacional com advisory lock e setup token
language: pt-BR
---

# Guarni — contexto compartilhado

## 0. Atualização após preparação do MVP — 19/09/2026

O repositório foi preparado para continuar em modo de estudo:

- conceitos já praticados foram automatizados/repetidos;
- novos módulos, DTOs, entities e migration estrutural do MVP já existem;
- novos endpoints que dependem de conceitos ainda não estudados permanecem com `501 Not Implemented` ou guard bloqueado;
- `LEARNING_NEXT_STEPS.md` é a trilha principal para o Codex ensinar os conceitos novos;
- `GUARNI_API_MVP_IMPLEMENTATION_PLAN.md` é a especificação funcional/técnica completa;
- não alterar o `guarni-web` durante esta fase.

O primeiro exercício manual é o bootstrap seguro: transação + rollback + advisory lock + `X-Setup-Token`.

## 1. Como usar este arquivo

Este arquivo existe para retomar o desenvolvimento em uma nova sessão de IA.

Ao iniciar uma nova conversa:

1. Abra o repositório `guarni-api`.
2. Envie este arquivo para a IA.
3. Peça para conferir o código, o banco e o Git antes de continuar.
4. O código e o estado real do banco são sempre a fonte de verdade caso estejam diferentes deste snapshot.

Preferência de colaboração:

- O usuário está estudando backend e normalmente implementa o código.
- A IA deve explicar conceitos, dividir o trabalho em passos pequenos e revisar a implementação.
- A IA só deve alterar código diretamente quando o usuário autorizar explicitamente.
- A IA pode implementar testes quando receber autorização explícita.
- Fazer commits em marcos funcionais coerentes.
- Não repetir configurações já concluídas.

## 2. Objetivo do produto

Guarni é um checklist operacional mobile-first para restaurantes.

Funcionários poderão:

- Consultar tarefas.
- Executar tarefas próprias, gerais ou de outras pessoas.
- Registrar justificativas.
- Adicionar evidências, como fotos.
- Consultar o histórico permitido.

Donos e gerentes poderão:

- Criar e atribuir tarefas.
- Acompanhar execução e pendências.
- Consultar históricos.
- Gerenciar usuários, unidades e configurações.

O MVP deve ser pequeno, útil para validação em um restaurante real, simples de operar e barato de manter.

Não fazem parte do MVP atual:

- Estoque.
- Pedidos.
- Pagamentos.
- OCR.
- Totens.
- Previsão de demanda.

## 3. Stack e infraestrutura

Backend:

- NestJS 12.
- TypeScript em ESM/NodeNext.
- TypeORM.
- PostgreSQL 17.
- Argon2id para senhas.
- JWT para access tokens.
- Vitest.
- Supertest para E2E.
- Swagger.
- Docker Compose local.

Frontend planejado:

- React + TypeScript + Vite.
- PWA mobile-first.
- SCSS Modules.
- Componentes próprios encapsulando MUI.

Deploy futuro:

- Railway para API e PostgreSQL.
- Tentar manter no plano gratuito.
- Migrar para Hobby se disponibilidade ou consumo exigirem.
- Verificar preços e limites atuais antes do deploy.
- Mídias futuramente em armazenamento compatível com S3.

## 4. Arquitetura ativa

- Aplicação Nest única e modular.
- Repositórios separados: `guarni-api` e `guarni-web`.
- Não transformar em monorepo ou microsserviços.
- `synchronize: false`.
- Toda alteração de schema acontece por migration.
- Entities descrevem o modelo de persistência.
- Migrations alteram o banco e preservam o histórico.
- Controllers recebem e traduzem HTTP.
- Services coordenam regras de negócio e persistência.
- Repositories acessam o banco.
- Modules organizam providers e injeção de dependências.
- Guards decidem se uma requisição pode chegar ao controller.

`DatabaseModule` usa `autoLoadEntities: true` para a aplicação Nest. O `data-source.ts`, usado pela CLI de migrations, possui a lista explícita de entidades e precisa ser atualizado quando uma nova entidade for criada.

## 5. Convenções de código

- Identificadores em inglês.
- Mensagens ao usuário em português.
- Funções e variáveis com nomes descritivos.
- Textos e valores reutilizáveis ficam em arquivos de constantes por domínio.
- Mensagens públicas de erro devem ficar em arquivos de constantes.
- Helpers usados em apenas um arquivo devem ser `const` internos e não exportados.
- Funções exportadas e comportamentos públicos devem possuir testes.
- DTOs representam contratos HTTP.
- Entities representam persistência.
- Tipos técnicos podem ficar em arquivos/pastas `types`.
- Imports locais usam extensão `.js` por causa de ESM/NodeNext.
- Migrations guardam literais históricos e não importam constantes mutáveis da aplicação.

Constraints são nomeadas explicitamente:

- `PK_<table>`
- `UQ_<table>_<column-or-relation>`
- `FK_<table>_<reference>`
- `CK_<table>_<rule>`

Não depender dos nomes automáticos gerados pelo TypeORM.

## 6. Configuração de ambiente relevante

Variáveis existentes:

- `NODE_ENV`
- `PORT`
- `WEB_ORIGIN`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_TTL_SECONDS`

Regras JWT:

- `JWT_ACCESS_SECRET` deve possuir pelo menos 32 caracteres.
- O segredo real fica somente no `.env` e nunca deve ser commitado.
- `.env.example` possui apenas um placeholder documental.
- O ambiente de testes possui segredo próprio em `test/setup-env.ts`.
- O TTL atual é `900` segundos, equivalente a 15 minutos.

## 7. Modelo User

Tabela `users`:

- `id`: UUID, chave primária.
- `name`: varchar(120).
- `username`: varchar(60), único globalmente.
- `passwordHash`: text.
- `createdAt`: timestamptz.
- `updatedAt`: timestamptz.

Constraints:

- `PK_users`
- `UQ_users_username`

Regras:

- Login por username e senha.
- E-mail não é obrigatório.
- Username é único em todo o Guarni.
- Username é normalizado com `trim().toLowerCase()`.
- Nome mantém acentos e escrita original, removendo espaços externos.
- Senha nunca é persistida ou devolvida em texto puro.
- Respostas públicas nunca incluem `password` ou `passwordHash`.
- Ainda não existe `CHECK`/`citext` garantindo lowercase para inserções SQL externas.

Métodos relevantes de `UsersService`:

- `findUserEntityByUsername`: retorna `User | null`, incluindo o hash para uso interno.
- `getPublicUserByUsername`: retorna `UserResponseDto` ou lança 404.
- `create`: normaliza os dados, gera hash Argon2id e persiste.
- `deleteUserById`: exclui fisicamente pelo UUID ou lança 404.

## 8. Endpoints atuais

### GET /v1/health

- Health check da aplicação e do PostgreSQL.

### POST /v1/users/register

Cadastro temporariamente público para desenvolvimento.

Recebe:

- `name`
- `username`
- `password`

Comportamentos:

- Normaliza nome e username.
- Valida o DTO.
- Rejeita campos extras.
- Gera hash Argon2id.
- Persiste usuário.
- Retorna 201.
- Nunca retorna senha ou hash.
- Username repetido retorna 409.
- O conflito é identificado pelo código PostgreSQL `23505` e pela constraint `UQ_users_username`.

Essa rota será substituída ou protegida depois do fluxo de bootstrap do primeiro proprietário.

### GET /v1/users/:username

Temporariamente pública.

- Normaliza o username.
- Retorna o usuário público com 200.
- Usuário inexistente retorna 404.
- Pode permitir enumeração de usuários e deve ser protegida antes de produção.

### DELETE /v1/users/:userId

Temporariamente pública por decisão consciente de desenvolvimento.

- Valida o parâmetro com `ParseUUIDPipe`.
- Exclui fisicamente o usuário.
- Retorna 204 sem corpo.
- UUID inválido retorna 400.
- Usuário inexistente retorna 404.
- Existe `TODO` para autorização de `OWNER`/`MANAGER`.
- Logs e auditoria serão adicionados futuramente.
- No futuro deve ser avaliado se a ação correta é apagar o usuário global ou apenas remover sua membership da unidade.

### POST /v1/auth/login

Recebe:

- `username`
- `password`

Fluxo:

1. `LoginDto` normaliza e valida o username.
2. `AuthService` busca a entidade completa.
3. `argon2.verify` compara o hash e a senha recebida.
4. Credenciais inválidas retornam sempre a mesma resposta 401.
5. `JwtService.signAsync` gera o access token.

Payload atual:

```json
{
  "sub": "uuid-do-usuario",
  "username": "username.normalizado"
}
```

Resposta:

```json
{
  "accessToken": "jwt"
}
```

### GET /v1/auth/me

Rota protegida por `AccessTokenGuard`.

- Lê `Authorization: Bearer <token>`.
- Valida assinatura e expiração com `JwtService.verifyAsync`.
- Coloca o payload validado em `request.user`.
- Retorna apenas `id` e `username`.
- Token ausente, malformado, inválido ou expirado retorna 401.

O Swagger possui suporte a Bearer Auth por meio de `addBearerAuth()`.

## 9. Autenticação atual

Arquivos principais:

- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `auth.constants.ts`
- `dto/login.dto.ts`
- `dto/login-response.dto.ts`
- `dto/current-user-response.dto.ts`
- `guards/access-token.guard.ts`
- `types/access-token-payload.type.ts`
- `types/authenticated-request.type.ts`

`AccessTokenGuard`:

1. Recebe `ExecutionContext` do Nest.
2. Seleciona o contexto HTTP.
3. Obtém a requisição Express.
4. Extrai exatamente um Bearer token.
5. Valida o token.
6. Anexa o payload a `request.user`.
7. Retorna `true` para permitir o controller.

Mensagens públicas de autenticação estão centralizadas em `auth.constants.ts`.

Limitações atuais:

- Ainda não existem refresh tokens.
- Ainda não existe logout/revogação.
- O guard valida o token, mas não consulta se o usuário ainda existe no banco.
- Ainda não existe autorização por unidade ou papel.

## 10. Modelo Unit

Tabela `units`:

- `id`: UUID, chave primária.
- `name`: varchar(120).
- `createdAt`: timestamptz.
- `updatedAt`: timestamptz.

Constraint:

- `PK_units`

Decisão de modelagem:

- `Unit` não possui `ownerId`.
- Proprietários são representados por memberships com papel `OWNER`.
- Isso permite múltiplos proprietários no futuro.

## 11. Modelo Membership

`Membership` é a entidade associativa entre `User` e `Unit`.

Tabela `memberships`:

- `id`: UUID, chave primária.
- `unitId`: UUID, foreign key para `units.id`.
- `userId`: UUID, foreign key para `users.id`.
- `role`: varchar(20).
- `createdAt`: timestamptz.
- `updatedAt`: timestamptz.

Papéis atuais:

- `OWNER`
- `MANAGER`
- `EMPLOYEE`

Constraints:

- `PK_memberships`
- `UQ_memberships_unit_user`
- `FK_memberships_unit`
- `FK_memberships_user`
- `CK_memberships_role`

Regras:

- Um usuário pode participar de várias unidades.
- Uma unidade pode possuir vários usuários.
- Um usuário possui no máximo uma membership por unidade.
- O papel pertence à membership, não ao usuário global.
- Excluir uma unidade remove suas memberships por `ON DELETE CASCADE`.
- Excluir um usuário remove suas memberships por `ON DELETE CASCADE`.
- Relações são unidirecionais neste momento; não existem coleções `memberships` em `User` ou `Unit`.
- O papel usa `varchar + CHECK` em vez de enum nativo do PostgreSQL para facilitar evolução por migrations.

## 12. Migrations

Migrations existentes e aplicadas:

- `[X] CreateUsers1788399590053`
- `[X] CreateUnitsAndMemberships1789095904034`

`CreateUnitsAndMemberships`:

- Cria `units` primeiro.
- Cria `memberships` depois.
- Adiciona as duas foreign keys nomeadas.
- Não altera `users`.
- O `down()` remove foreign keys e `memberships` antes de remover `units`.

O `data-source.ts` registra explicitamente:

- `User`
- `Unit`
- `Membership`

## 13. Testes

Último resultado confirmado antes da migration de unidades/memberships:

- 20 testes unitários passando.
- 21 testes E2E passando.

Depois da migration, o usuário confirmou que `npm run test:e2e` continuou passando.

Cobertura unitária relevante:

- Normalização e consulta de usuário.
- Resposta pública sem hash.
- Cadastro e hash de senha.
- Conflito específico de username.
- Propagação de erros de banco não relacionados.
- Exclusão bem-sucedida e usuário inexistente.
- Login válido.
- Usuário inexistente e senha inválida.
- Payload usado para assinar JWT.
- Guard com token válido.
- Header ausente ou malformado.
- Falha de verificação JWT.

Cobertura E2E relevante:

- Health check.
- Cadastro e validações.
- Conflito de username.
- Consulta de usuário.
- Exclusão por UUID.
- Login e credenciais inválidas.
- Fluxo cadastro → login → access token → `/auth/me`.
- Ausência ou invalidade do token em `/auth/me`.

A limpeza E2E usa:

```ts
await usersRepository.deleteAll();
```

Não usar `clear()` em `users`, pois `clear()` executa `TRUNCATE` e a tabela agora é referenciada por `memberships`.

Aviso não bloqueante atual:

- O Vitest informa que o Vite já suporta resolução de paths do tsconfig nativamente e sugere substituir `vite-tsconfig-paths`. Essa limpeza ainda não foi feita e não bloqueia os testes.

## 14. Bootstrap do primeiro proprietário

Decisão atual:

- Não é possível proteger todos os cadastros quando ainda não existe usuário autenticado.
- Haverá um fluxo especial para criar o primeiro proprietário.
- O cadastro comum de usuários será protegido futuramente.

Endpoint planejado:

```text
POST /v1/setup/owner
```

Operação planejada, em uma única transação:

```text
validar que ainda não existe proprietário
        ↓
criar User
        ↓
criar Unit
        ↓
criar Membership com role OWNER
        ↓
commit
```

Se qualquer etapa falhar, a transação deve executar rollback e nenhuma linha parcial deve permanecer.

Após o bootstrap:

- O proprietário fará login normalmente.
- Cadastros posteriores acontecerão dentro de uma unidade.
- A rota futura poderá ser semelhante a `POST /v1/units/:unitId/users`.
- Essa rota exigirá access token e papel `OWNER` ou `MANAGER`.

Ainda precisam ser definidas regras de concorrência para impedir duas requisições simultâneas de bootstrap. Uma rota pública que simplesmente verifica `count = 0` pode sofrer corrida; a solução deve usar proteção transacional/banco e possivelmente um segredo de setup dependendo do modelo de implantação.

## 15. Próximos passos em ordem sugerida

### Imediato

1. Criar o domínio/módulo de setup do primeiro proprietário.
2. Criar DTO contendo dados do proprietário e nome da unidade.
3. Implementar a criação de User, Unit e Membership `OWNER` em uma transação TypeORM.
4. Impedir um segundo bootstrap.
5. Criar testes unitários da orquestração.
6. Criar testes E2E para sucesso, validações, rollback e segunda tentativa.
7. Fazer commit do marco funcional.

### Depois do bootstrap

1. Criar services de units e memberships conforme surgirem operações reais.
2. Criar autorização por unidade e papel.
3. Proteger cadastro, consulta e exclusão de usuários.
4. Definir a hierarquia exata:
   - O que um `OWNER` pode administrar.
   - O que um `MANAGER` pode administrar.
   - Se gerente pode remover apenas `EMPLOYEE`.
   - Se proprietário pode remover outro proprietário.
   - Impedir exclusão do último proprietário.
5. Decidir entre exclusão global de usuário e remoção da membership.

### Autenticação futura

1. Refresh tokens.
2. Rotação de refresh token.
3. Sessões por dispositivo.
4. Logout e revogação.
5. Tratamento de usuário excluído/desativado com access token ainda válido.

### Auditoria futura

- Registrar ator, ação, alvo, unidade, data e metadados relevantes.
- Avaliar soft delete/desativação em vez de exclusão física.
- Manter informação histórica mesmo quando usuários ou memberships forem removidos.

## 16. Estado Git no snapshot

- Branch: `main`.
- Commit: `b431649 feat: add units and memberships schema`.
- A árvore de código estava limpa antes da criação deste arquivo de contexto.
- Este próprio arquivo aparecerá como novo no Git até ser commitado ou removido.

Commits recentes:

```text
b431649 feat: add units and memberships schema
d1a029d feat: validate JWT access tokens
14513a2 feat: add JWT authentication and user deletion
f31c860 refactor: centralize user validation constants
6c01dc3 test: adding e2e tests
```

## 17. Comando inicial recomendado na próxima sessão

Depois de fornecer este arquivo à IA, pedir:

> Confira o Git, as migrations e os testes sem alterar o código. Depois me guie na implementação do bootstrap transacional do primeiro proprietário. Eu implemento o código; você explica e revisa. Só altere arquivos quando eu autorizar explicitamente.

