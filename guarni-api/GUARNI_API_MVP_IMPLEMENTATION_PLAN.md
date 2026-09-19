# Guarni API — plano definitivo de implementação do MVP

**Data de consolidação:** 19/09/2026  
**Repositório alvo:** `guarni-api`  
**Frontend de referência:** `guarni-web` atual enviado junto deste plano  
**Objetivo:** implementar no backend tudo que o frontend atual precisa para sair dos mocks e consumir dados reais, sem redesenhar o frontend nesta etapa.

---

## 1. Instrução principal para o Codex

Este documento é uma especificação de implementação para o **backend**.

### Regra desta fase

- Trabalhar **somente no `guarni-api`**.
- **Não alterar o `guarni-web` agora.**
- O frontend atual serve como referência dos fluxos, hooks e dados necessários.
- Não tentar adaptar o backend aos textos visuais, labels, iniciais, cores ou formatação de datas do frontend. A API deve devolver dados estruturados; o adaptador do frontend fará a apresentação quando iniciarmos a integração.
- Preservar o padrão atual do backend: NestJS modular, TypeORM, PostgreSQL, DTOs, migrations, Swagger, Vitest e E2E.
- Implementar em **incrementos revisáveis**, seguindo a ordem deste documento. Não gerar toda a aplicação em um único arquivo ou em módulos gigantes.
- A cada etapa: implementar, criar/atualizar migrations, adicionar testes, rodar `build`, `lint`, testes unitários e E2E pertinentes e corrigir falhas antes de avançar.
- Não fazer deploy automaticamente.
- Não criar funcionalidades explicitamente marcadas como **fora do MVP**.

O código e o banco são a fonte de verdade. Se alguma descrição antiga do projeto contradizer o estado atual do repositório, preserve o comportamento atual que já está validado, exceto onde este documento explicitamente manda alterá-lo.

---

## 2. Estado atual confirmado do backend

O projeto já possui:

- NestJS 12.
- TypeScript ESM/NodeNext.
- TypeORM.
- PostgreSQL.
- `synchronize: false`.
- migrations para `users`, `units` e `memberships`.
- JWT access token.
- Argon2id.
- `POST /v1/auth/login`.
- `GET /v1/auth/me` ainda simplificado.
- rotas temporárias públicas de usuários.
- Swagger.
- CORS, Helmet e `ValidationPipe` global com `whitelist` + `forbidNonWhitelisted`.
- Vitest e Supertest.
- `users` com username único global.
- `units`.
- `memberships` com roles `OWNER`, `MANAGER`, `EMPLOYEE`.

O próximo trabalho deve evoluir essa base, não substituí-la por outra arquitetura.

---

## 3. Convenções que devem continuar

### Código

- Identificadores em inglês.
- Mensagens públicas para o usuário em português.
- Imports locais com extensão `.js`.
- DTOs representam contratos HTTP.
- Entities representam persistência.
- Services concentram regras de negócio.
- Controllers não devem conter regra de negócio relevante.
- Usar `@InjectRepository`/TypeORM e recursos nativos do Nest sempre que suficientes.
- Não introduzir bibliotecas obscuras ou camadas arquiteturais sem necessidade.
- Booleanos com nomes como `isActive`, `isClosed`, `canExecute`, `hasMore` quando aplicável.
- Funções exportadas e regras relevantes devem possuir testes.
- Valores reutilizáveis, códigos PostgreSQL e mensagens públicas ficam em constants do domínio.
- Helpers locais não precisam ser exportados.

### Banco

Todas as constraints relevantes devem ter nomes explícitos:

- `PK_<table>`
- `UQ_<table>_<columns>`
- `FK_<table>_<reference>`
- `CK_<table>_<rule>`

Migrations devem conter seus próprios literais históricos e **não importar constants mutáveis da aplicação**.

O `data-source.ts` possui lista explícita de entities e deve ser atualizado a cada nova entity.

---

## 4. Escopo congelado do MVP

### 4.1 Identidade e unidades

- Login é por `username` + senha.
- Username é único globalmente, normalizado com `trim().toLowerCase()`.
- Um usuário tecnicamente pode possuir memberships em várias unidades.
- Nesta primeira versão, **não existe fluxo para vincular um usuário já existente a outra unidade**.
- Ao criar usuário dentro da unidade X, criar **User + Membership da unidade X na mesma transação**.
- Se o username já existir, retornar `409 USERNAME_ALREADY_EXISTS`.
- Não tentar reaproveitar silenciosamente a identidade existente.
- Criar unidades adicionais por interface/API administrativa fica fora do MVP.
- O bootstrap cria a primeira unidade e o primeiro OWNER.

### 4.2 Hierarquia

#### OWNER

Pode administrar, na própria unidade:

- EMPLOYEE.
- MANAGER.
- OWNER.

Pode:

- criar usuários desses três papéis;
- alterar papel;
- desativar/reativar membership;
- redefinir senha;
- gerenciar tarefas;
- alterar configurações da unidade;
- acessar auditoria global e mídias.

Sempre preservar pelo menos um OWNER ativo na unidade.

#### MANAGER

Pode administrar **somente EMPLOYEE**.

Pode:

- criar EMPLOYEE;
- alterar dados administrativos permitidos de EMPLOYEE;
- desativar/reativar EMPLOYEE;
- redefinir senha de EMPLOYEE;
- gerenciar tarefas;
- corrigir execuções da unidade;
- alterar configurações operacionais.

Não pode:

- criar MANAGER ou OWNER;
- alterar MANAGER ou OWNER;
- desativar MANAGER ou OWNER;
- redefinir senha de MANAGER ou OWNER;
- acessar auditoria global da unidade.

#### EMPLOYEE

Pode:

- consultar tarefas permitidas;
- executar tarefas gerais ou próprias;
- assumir tarefa pessoal de outra pessoa mediante justificativa;
- consultar timeline de tarefa;
- corrigir **sua própria execução** enquanto o dia operacional estiver aberto;
- trocar a própria senha.

### 4.3 Todas as pessoas ativas executam tarefas

OWNER e MANAGER também são membros operacionais. Eles podem receber, assumir e executar tarefas como um EMPLOYEE.

### 4.4 Senha

- Senha pertence à identidade global `User`, não à membership.
- Troca própria exige senha atual.
- OWNER redefine senha de qualquer membership da própria unidade.
- MANAGER redefine apenas senha de EMPLOYEE da própria unidade.
- Reset administrativo afeta o login desse usuário em todas as unidades.
- Não existe recuperação por e-mail no MVP.
- Não existe obrigação de troca no primeiro login.

### 4.5 Auditoria

- Auditoria global: **somente OWNER**.
- MANAGER continua vendo timeline das tarefas e podendo corrigir execuções, mas não acessa `/audit/events` nem `/media`.
- **Exportação de auditoria está fora do MVP.**

### 4.6 Correção de execução encerrada automaticamente

Se uma tarefa foi encerrada automaticamente (`AUTO_CLOSED`) e OWNER/MANAGER corrigir para `DONE`:

- não criar seletor de executor no MVP;
- considerar o autor da correção como executor da projeção atual;
- preservar nos eventos que antes houve encerramento automático.

Isso pode ser refinado futuramente.

---

## 5. Fora do MVP

Não implementar agora:

- exportação CSV/PDF da auditoria;
- refresh token;
- sessões por dispositivo;
- logout server-side;
- recuperação de senha por e-mail;
- obrigar troca de senha temporária no primeiro login;
- fluxo para associar usuário existente a outra unidade;
- CRUD de novas unidades;
- templates de tarefas;
- recorrência automática de tarefas;
- vídeo;
- várias fotos vigentes por execução;
- operação offline;
- edição/exclusão/ocultação manual de eventos;
- exclusão física de histórico;
- seletor de executor em correção retroativa;
- paginação genérica sofisticada em todas as listas;
- `Idempotency-Key`/tabela genérica de idempotência nesta primeira versão;
- event sourcing;
- microsserviços;
- endpoints de backup;
- alteração do fuso horário pela UI;
- HEIC na primeira integração de fotos.

O backend deve ser preparado sem bloquear futuras evoluções, mas **não implementar essas evoluções antecipadamente**.

---

# PARTE I — Fundação, autenticação e autorização

## 6. Bootstrap do primeiro OWNER

Criar:

`POST /v1/setup/owner`

### Autorização

Não existe usuário autenticado antes do bootstrap.

Usar header:

`X-Setup-Token: <token>`

Adicionar variável:

```env
SETUP_OWNER_TOKEN=
```

Regras:

- mínimo recomendado de 32 caracteres;
- nunca logar o token;
- não devolver em respostas;
- comparar de forma segura;
- token incorreto: `401 INVALID_SETUP_TOKEN`.

### Body

```ts
{
  name: string;
  username: string;
  password: string;
  unitName: string;
  timezone?: string;     // default America/Sao_Paulo
  closingTime?: string;  // default 03:00
}
```

### Comportamento

Na mesma transação:

1. adquirir lock transacional PostgreSQL para serializar bootstrap;
2. confirmar que ainda não existe unidade;
3. criar `User`;
4. criar `Unit`;
5. criar `Membership` ativa com role `OWNER`;
6. commit integral.

Se já existir unidade:

- `409 SETUP_ALREADY_COMPLETED`.

Duas requisições simultâneas nunca podem criar dois primeiros donos/unidades.

Não criar tabela exclusiva de bootstrap para o MVP. Como unidades não possuem endpoint de exclusão física e sempre haverá pelo menos um OWNER ativo, a existência da primeira unidade é suficiente para bloquear novo bootstrap.

---

## 7. Evolução de `users`

Adicionar:

```ts
credentialVersion: number // int, not null, default 1
```

Manter:

- `id`
- `name`
- `username`
- `passwordHash`
- timestamps

### JWT

Payload recomendado:

```ts
{
  sub: user.id,
  credentialVersion: user.credentialVersion
}
```

Não colocar role ou unidade no JWT. Role pertence à membership e pode mudar durante a validade do token.

O username também não é necessário como fonte de autorização.

---

## 8. `POST /v1/auth/login`

Preservar rota atual.

### Regras novas

Após validar senha:

- confirmar que existe pelo menos uma membership ativa;
- se não existir, rejeitar login com a mesma resposta genérica de credenciais/acesso inválido;
- emitir JWT com `credentialVersion` atual.

Resposta mínima:

```ts
{
  accessToken: string;
}
```

Pode incluir `expiresIn` caso seja útil, mas o frontend não deve assumir TTL fixo.

---

## 9. `AccessTokenGuard`

Evoluir o guard atual.

Depois de validar assinatura/expiração:

1. buscar `User` pelo `sub`;
2. confirmar existência;
3. comparar `credentialVersion` do token com o banco;
4. se divergir, retornar `401 INVALID_OR_EXPIRED_ACCESS_TOKEN`;
5. anexar identidade autenticada à request.

Isso faz troca/reset de senha invalidar tokens anteriores.

---

## 10. `GET /v1/auth/me`

Ampliar para retornar identidade e memberships **ativas**.

Resposta estruturada:

```ts
{
  user: {
    id: string;
    name: string;
    username: string;
  };
  memberships: Array<{
    id: string;
    role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
    unit: {
      id: string;
      name: string;
    };
  }>;
}
```

Não retornar:

- hash;
- credentialVersion;
- senha;
- labels em português;
- iniciais;
- cores;
- strings como “Dono” ou “Gerente”.

---

## 11. Troca da própria senha

Criar:

`PUT /v1/auth/password`

Body:

```ts
{
  currentPassword: string;
  newPassword: string;
}
```

Regras:

- validar senha atual;
- nova senha precisa respeitar limites existentes;
- nova senha deve ser diferente da atual;
- gerar novo hash Argon2id;
- incrementar `credentialVersion` na mesma transação;
- emitir novo access token com a versão nova.

Resposta:

```ts
{
  accessToken: string;
}
```

Assim os tokens anteriores deixam de funcionar, mas a sessão que acabou de trocar a senha pode continuar usando o novo token.

---

## 12. Membership ativa e autorização por unidade

Evoluir `memberships` com:

```ts
isActive: boolean;       // default true
deactivatedAt: Date | null;
version: number;         // int, default 1
```

`updatedAt` já registra última alteração; não é necessário criar uma coluna para cada possível transição.

### Guard/contexto de unidade

Criar uma abstração reutilizável para rotas:

`/v1/units/:unitId/...`

Ela deve:

1. ler `unitId`;
2. buscar membership do `request.user.sub` nessa unidade;
3. exigir `isActive = true`;
4. anexar a membership à request/contexto;
5. nunca confiar em IDs enviados pelo cliente como prova de autorização.

Pode usar guard + decorator próprio, desde que permaneça simples.

### Hierarquia alvo

Autorizações sobre outro usuário devem ser verificadas no service considerando:

- role do ator;
- role do alvo;
- unidade;
- estado ativo;
- regra do último OWNER.

Não tentar resolver toda a hierarquia apenas com um `RolesGuard` genérico.

---

# PARTE II — Unidades e dia operacional

## 13. Evolução de `units`

Adicionar:

```ts
timezone: string;    // IANA, ex. America/Sao_Paulo
closingTime: string; // persistência como TIME ou equivalente
version: number;     // int default 1
```

Defaults do bootstrap:

- `timezone = America/Sao_Paulo`
- `closingTime = 03:00`

O timezone é somente leitura no frontend atual. Não criar PATCH de timezone no MVP.

---

## 14. Contexto da unidade

Criar:

`GET /v1/units/:unitId/context`

Qualquer membership ativa da unidade pode consultar.

Resposta proposta:

```ts
{
  unit: {
    id: string;
    name: string;
    timezone: string;
    closingTime: string;
  };
  membership: {
    id: string;
    role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
  };
  permissions: {
    canManageTasks: boolean;
    canManageUsers: boolean;
    canManageOwnersAndManagers: boolean;
    canManageSettings: boolean;
    canViewAudit: boolean;
    canCorrectAnyExecution: boolean;
  };
  operationalDay: {
    date: string;      // YYYY-MM-DD
    opensAt: string;   // ISO
    closesAt: string;  // ISO
    isClosed: boolean;
  };
  serverTime: string;
}
```

Esse endpoint é a fonte para o frontend saber o dia operacional, não o relógio local do navegador.

---

## 15. Configurações da unidade

### GET

`GET /v1/units/:unitId/settings`

OWNER e MANAGER.

Resposta:

```ts
{
  name: string;
  timezone: string;
  closingTime: string;
  version: number;
}
```

### PATCH

`PATCH /v1/units/:unitId/settings`

Body:

```ts
{
  name?: string;
  closingTime?: string;
  expectedVersion: number;
}
```

Não aceitar `timezone` neste PATCH.

Atualização incrementa `version`.

Se versão divergir:

- `409 UNIT_VERSION_CONFLICT`.

A mudança de `closingTime` deve afetar novos dias operacionais; não reescrever dias históricos já registrados.

---

## 16. Modelo `operational_days`

Criar entity/tabela:

```text
operational_days
- id uuid PK
- unitId uuid FK units
- date date
- opensAt timestamptz
- closesAt timestamptz
- closedAt timestamptz nullable
- createdAt timestamptz
- updatedAt timestamptz
```

Constraint:

```text
UNIQUE(unitId, date)
```

### Regra de dia

Com fechamento `03:00`:

- dia operacional `2026-09-18` abre em `2026-09-18 03:00` local;
- fecha em `2026-09-19 03:00` local.

Antes do corte, o “hoje operacional” ainda é o dia de calendário anterior.

No instante exato do corte, o novo dia começa.

### Datas e timezone

Adicionar uma biblioteca conhecida para operações IANA de timezone. Preferência: **Luxon**.

Não implementar cálculos críticos de fuso usando concatenação manual de strings ou timezone do processo Node.

Criar um serviço/helper de relógio injetável (`ClockService` ou equivalente) para testes determinísticos.

---

# PARTE III — Gestão de equipe

## 17. Remover exposição temporária de usuários

As rotas atuais de desenvolvimento:

- `POST /v1/users/register`
- `GET /v1/users/:username`
- `DELETE /v1/users/:userId`

não devem permanecer públicas quando o fluxo novo estiver pronto.

Remover do contrato público ou proteger de forma que não sejam usadas pelo produto.

Não usar `DELETE` físico de User como mecanismo de desativação.

---

## 18. Listagem de equipe

Base:

`/v1/units/:unitId`

### `GET /memberships`

OWNER e MANAGER.

Filtros opcionais:

- `search`
- `isActive`
- `role`

Resposta:

```ts
{
  items: Array<{
    id: string; // membershipId
    role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
    isActive: boolean;
    version: number;
    user: {
      id: string;
      name: string;
      username: string;
    };
  }>;
}
```

Busca por nome ou username normalizados para comparação.

Não retornar senha/hash.

---

## 19. Responsáveis elegíveis

Não é necessário criar uma tabela ou domínio separado.

O frontend poderá usar:

`GET /v1/units/:unitId/memberships?isActive=true&search=...`

Todos os papéis ativos podem receber tarefas.

---

## 20. Detalhe de membership

`GET /v1/units/:unitId/memberships/:membershipId`

OWNER/MANAGER conforme hierarquia.

Retornar também ações permitidas se isso simplificar a integração:

```ts
permissions: {
  canChangeRole: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  canResetPassword: boolean;
}
```

---

## 21. Cadastro de usuário dentro da unidade

Criar:

`POST /v1/units/:unitId/users`

### Body

```ts
{
  name: string;
  username: string;
  password: string;
  role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
}
```

### Regra central

A unidade é a `:unitId` da rota autenticada.

O frontend **não precisa enviar unitId no body**.

Na mesma transação:

1. validar permissão do ator;
2. criar User;
3. criar Membership ativa nessa unidade;
4. retornar projeção pública.

### Permissão

- OWNER: pode criar qualquer role.
- MANAGER: body só pode usar `EMPLOYEE`.

Username já existente globalmente:

- `409 USERNAME_ALREADY_EXISTS`.

Não vincular identidade existente.

---

## 22. Alteração de papel

`PATCH /v1/units/:unitId/memberships/:membershipId`

Body MVP:

```ts
{
  role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
  expectedVersion: number;
}
```

Não aceitar `isActive` aqui.

Regras:

- OWNER pode alterar qualquer alvo, respeitando último OWNER.
- MANAGER só pode alterar EMPLOYEE e não pode promovê-lo para MANAGER/OWNER; na prática, role editada por MANAGER deve continuar `EMPLOYEE`.
- preservar ao menos um OWNER ativo.
- incrementar `version`.
- registrar evento de negócio sem dados sensíveis.

Para concorrência na regra de último OWNER, bloquear a unidade (`FOR UPDATE` ou estratégia equivalente) dentro da transação antes de contar owners ativos.

---

## 23. Resumo para desativação

`GET /v1/units/:unitId/memberships/:membershipId/reassignment-summary`

Retornar:

```ts
{
  pendingTasks: number;
  futurePersonalTasks: number;
  totalTasks: number;
}
```

Sem duplicidade:

- `pendingTasks`: tarefas pessoais pendentes no dia operacional aberto;
- `futurePersonalTasks`: tarefas pessoais pendentes em datas futuras;
- `totalTasks = pendingTasks + futurePersonalTasks`.

Dias encerrados não devem possuir tarefas pendentes depois da reconciliação.

---

## 24. Desativação + reatribuição atômica

Criar:

`POST /v1/units/:unitId/memberships/:membershipId/deactivate`

Body:

```ts
{
  replacementMembershipId?: string;
  expectedVersion: number;
}
```

### Regras

- não excluir membership;
- `isActive = false`;
- preencher `deactivatedAt`;
- incrementar version;
- preservar histórico;
- se houver tarefas pessoais pendentes atuais/futuras, exigir substituto;
- substituto deve estar ativo, pertencer à mesma unidade e ser diferente da origem;
- qualquer papel ativo é elegível como substituto;
- reatribuir somente tarefas pessoais `PENDING`;
- tarefas executadas/históricas não mudam;
- tudo na mesma transação;
- recalcular as tarefas elegíveis dentro da transação, não confiar apenas no resumo aberto anteriormente;
- respeitar hierarquia;
- nunca desativar o último OWNER ativo.

Sem substituto quando há tarefas:

- `409 REASSIGNMENT_REQUIRED`.

Retorno:

```ts
{
  membership: ...;
  reassignedTasks: number;
}
```

---

## 25. Reativação

`POST /v1/units/:unitId/memberships/:membershipId/reactivate`

Body:

```ts
{
  expectedVersion: number;
}
```

Regras de hierarquia iguais às de administração.

- `isActive = true`;
- `deactivatedAt = null`;
- incrementar version;
- não reatribuir tarefas automaticamente de volta.

---

## 26. Reset administrativo de senha

`PUT /v1/units/:unitId/memberships/:membershipId/password`

Body:

```ts
{
  newPassword: string;
}
```

Regras:

- OWNER: qualquer alvo da unidade.
- MANAGER: apenas EMPLOYEE.
- não consultar/expor senha antiga;
- validar nova senha;
- gerar novo Argon2id;
- incrementar `User.credentialVersion`;
- invalidar tokens anteriores;
- não alterar role;
- não reativar membership;
- registrar evento sem senha/hash.

Resposta: `204`.

---

# PARTE IV — Tarefas

## 27. Limites de texto do MVP

Usar:

```text
Task title:          1..120
Task description:   0..2000
Execution comment:  0..1000
Not-done reason:    1..1000
Takeover reason:    1..1000
Correction reason:  1..1000
```

Strings obrigatórias devem aplicar trim para validar vazio, preservando conteúdo adequado após normalização.

---

## 28. Modelo `tasks`

Criar entity/tabela:

```text
tasks
- id uuid PK
- unitId uuid FK units
- executionDate date NOT NULL
- title varchar(120) NOT NULL
- description text nullable
- assignmentType varchar(20) NOT NULL
- assigneeMembershipId uuid nullable FK memberships
- dueTime time NOT NULL
- dueAt timestamptz NOT NULL
- isEvidenceRequired boolean NOT NULL
- isCommentEnabled boolean NOT NULL
- status varchar(20) NOT NULL default PENDING
- createdByMembershipId uuid NOT NULL FK memberships
- sourceTaskId uuid nullable FK tasks
- version int NOT NULL default 1
- createdAt timestamptz
- updatedAt timestamptz
```

Enums/checks:

```text
assignmentType: GENERAL | PERSONAL
status: PENDING | DONE | NOT_DONE
```

### Integridade

- GENERAL => `assigneeMembershipId` deve ser null.
- PERSONAL => `assigneeMembershipId` obrigatório.
- responsável precisa pertencer à mesma unidade e estar ativo no momento de criação/alteração.
- `sourceTaskId` é somente rastreabilidade; copiar uma tarefa não cria sincronização entre elas.

Adicionar índices conforme consultas reais, pelo menos:

- `(unitId, executionDate)`
- `(unitId, status, executionDate)`
- `(unitId, assigneeMembershipId, executionDate)`

---

## 29. Horário limite

No MVP toda tarefa possui `dueTime`.

Na criação:

- se o frontend enviar, validar `HH:mm`;
- se omitir, usar `Unit.closingTime`.

### Conversão para `dueAt`

Para dia operacional D:

- horário maior que o corte: ocorre no calendário D;
- horário menor ou igual ao corte: ocorre no calendário D+1.

Exemplo com fechamento `03:00`:

- D às `17:00` => D 17:00;
- D às `01:30` => D+1 01:30;
- D às `03:00` => D+1 03:00, exatamente no fechamento.

Armazenar `dueAt` calculado no momento da criação/edição. Não depender do browser para atraso/autorização.

`isOverdue = status === PENDING && dueAt < serverTime`.

Atraso **não bloqueia execução** enquanto o dia operacional estiver aberto.

---

## 30. Criação em datas

Permitir:

- dia operacional atualmente aberto;
- datas futuras.

Bloquear:

- qualquer dia operacional já encerrado.

Erro:

- `409 OPERATIONAL_DAY_CLOSED`.

---

## 31. Catálogo mensal

`GET /v1/units/:unitId/tasks`

OWNER/MANAGER.

Query:

```text
month=YYYY-MM          obrigatório
period=all|today|future|past
search=
```

Retornar tarefas do mês selecionado, com dados estruturados.

Ordenação do catálogo:

- data mais recente primeiro;
- desempate estável por ID.

Não retornar `dateLabel`, `assigneeName` confiado do cliente ou labels visuais.

---

## 32. Tarefas por data

`GET /v1/units/:unitId/tasks/by-date?date=YYYY-MM-DD`

OWNER/MANAGER.

Retorna tarefas daquela data operacional.

---

## 33. Detalhe da tarefa

`GET /v1/units/:unitId/tasks/:taskId`

Qualquer membership ativa da unidade.

Retornar algo equivalente a:

```ts
{
  id: string;
  title: string;
  description: string | null;
  executionDate: string;
  assignmentType: 'GENERAL' | 'PERSONAL';
  assignee: null | {
    membershipId: string;
    userId: string;
    name: string;
  };
  status: 'PENDING' | 'DONE' | 'NOT_DONE';
  dueTime: string;
  dueAt: string;
  isOverdue: boolean;
  isEvidenceRequired: boolean;
  isCommentEnabled: boolean;
  version: number;
  sourceTaskId: string | null;
  execution: null | {
    id: string;
    result: 'DONE' | 'NOT_DONE';
    resolutionType: 'MANUAL' | 'AUTO_CLOSED';
    executor: null | {
      membershipId: string;
      userId: string;
      name: string;
    };
    completedAt: string;
    comment: string | null;
    reason: string | null;
    evidence: null | EvidenceMetadata;
  };
  operationalDay: {
    date: string;
    closesAt: string;
    isClosed: boolean;
  };
  permissions: {
    canExecute: boolean;
    canTakeOver: boolean;
    canCorrect: boolean;
    canEdit: boolean;
  };
}
```

---

## 34. Criação de tarefa

`POST /v1/units/:unitId/tasks`

OWNER/MANAGER.

Body:

```ts
{
  title: string;
  description?: string;
  assignmentType: 'GENERAL' | 'PERSONAL';
  assigneeMembershipId?: string;
  executionDate: string;
  dueTime?: string;
  isEvidenceRequired: boolean;
  isCommentEnabled: boolean;
}
```

Retornar `201` com a tarefa atual e `version = 1`.

Registrar evento `TASK_CREATED`.

---

## 35. Edição de tarefa

O frontend atual edita somente:

- horário limite;
- evidência obrigatória.

Para manter o MVP pequeno, implementar:

`PATCH /v1/units/:unitId/tasks/:taskId`

Body:

```ts
{
  dueTime?: string;
  isEvidenceRequired?: boolean;
  expectedVersion: number;
}
```

Regras:

- OWNER/MANAGER;
- tarefa precisa estar `PENDING`;
- dia não pode estar encerrado;
- incrementar `version`;
- recalcular `dueAt` se `dueTime` mudar;
- registrar before/after em evento `TASK_UPDATED`.

Não transformar esse endpoint em edição de execução.

---

## 36. Cópia de tarefa

`POST /v1/units/:unitId/tasks/:taskId/copies`

OWNER/MANAGER.

O frontend atual copia preservando o horário da tarefa original.

Body mínimo, alinhado ao fluxo atual do `guarni-web`:

```ts
{
  title: string;
  description?: string;
  executionDate: string;
  assignmentType: 'GENERAL' | 'PERSONAL';
  assigneeMembershipId?: string;
  isEvidenceRequired: boolean;
}
```

O frontend atual permite ajustar a descrição durante a cópia. Se `description` não vier, preservar a descrição da origem. Preservar sempre da origem neste fluxo:

- dueTime;
- `isCommentEnabled`.

Nova tarefa:

- ID novo;
- `PENDING`;
- `version = 1`;
- sem execução;
- sem evidência antiga;
- sem eventos antigos;
- `sourceTaskId = origem.id`.

Registrar `TASK_COPIED`.

---

# PARTE V — Hoje, execução e correções

## 37. Modelo `task_executions`

Criar:

```text
task_executions
- id uuid PK
- taskId uuid UNIQUE FK tasks
- executorMembershipId uuid nullable FK memberships
- result varchar(20) NOT NULL
- resolutionType varchar(20) NOT NULL
- completedAt timestamptz NOT NULL
- comment text nullable
- reason text nullable
- createdAt timestamptz
- updatedAt timestamptz
```

Checks:

```text
result: DONE | NOT_DONE
resolutionType: MANUAL | AUTO_CLOSED
```

Existe apenas **uma projeção atual de execução por tarefa**.

Mudanças posteriores atualizam essa projeção através de correção e preservam o passado em `business_events`.

Não criar uma tabela de versões de execution separada no MVP.

---

## 38. Hoje

`GET /v1/units/:unitId/tasks/today`

Qualquer membership ativa.

Query:

```text
scope=mine|general|all
status=all|pending|done|notDone
search=
```

### Escopos

- `mine`: `assigneeMembershipId === membership atual`.
- `general`: `assignmentType === GENERAL`.
- `all`: todas da unidade no dia operacional atual.

### Ordem

1. `PENDING`;
2. `NOT_DONE`;
3. `DONE`.

Dentro do grupo:

- `dueAt ASC`;
- ID como desempate.

Todas as tarefas têm horário no modelo final.

### Resumo

Retornar resumo do **dia inteiro**, independentemente dos filtros aplicados:

```ts
summary: {
  done: number;
  pending: number;
  notDone: number;
}
```

E também:

```ts
operationalDay: {
  date: string;
  closesAt: string;
}
```

---

## 39. Takeover de tarefa pessoal

`POST /v1/units/:unitId/tasks/:taskId/takeover`

Qualquer membership ativa.

Body:

```ts
{
  reason: string;
  expectedVersion: number;
}
```

Regras:

- somente tarefa `PENDING`;
- dia aberto;
- tarefa PERSONAL atribuída a outra membership ativa/inativa historicamente não importa: o ator está assumindo agora;
- reason obrigatório;
- atualizar assignee para membership do ator;
- incrementar `version`;
- registrar responsável anterior e novo no evento;
- lock/version para impedir takeover concorrente.

Tarefa GENERAL não precisa de takeover para executar.

---

## 40. Executar tarefa

`POST /v1/units/:unitId/tasks/:taskId/execution`

Body:

```ts
{
  result: 'DONE' | 'NOT_DONE';
  comment?: string;
  reason?: string;
  evidenceId?: string;
  expectedVersion: number;
}
```

### Regras gerais

- task `PENDING`;
- dia operacional aberto;
- `expectedVersion` deve bater;
- actor vem da sessão/membership;
- task GENERAL pode ser executada diretamente;
- task PERSONAL própria pode ser executada;
- task PERSONAL de outra pessoa exige takeover anterior;
- incrementar `Task.version`;
- criar `task_executions`;
- atualizar `Task.status` na mesma transação;
- registrar evento na mesma transação.

### DONE

- `reason` não é necessário;
- comentário é opcional se `isCommentEnabled = true`;
- se `isCommentEnabled = false`, rejeitar comentário não vazio;
- se `isEvidenceRequired = true`, `evidenceId` obrigatório e válido;
- evidence opcional quando a tarefa não exige foto.

### NOT_DONE

- `reason` obrigatório;
- executor também deve ser registrado;
- evidence não é necessário no fluxo atual.

Depois de executada, nova alteração ocorre via **correção**, nunca repetindo POST `/execution`.

---

## 41. Correção

`POST /v1/units/:unitId/tasks/:taskId/corrections`

Body:

```ts
{
  result?: 'DONE' | 'NOT_DONE';
  comment?: string;
  reason?: string;
  correctionReason: string;
  evidenceId?: string;
  expectedVersion: number;
}
```

### Permissões

EMPLOYEE:

- somente se foi o executor da projeção atual;
- somente enquanto dia operacional estiver aberto.

MANAGER/OWNER:

- qualquer execução da própria unidade;
- inclusive após fechamento do dia.

### Regras

- `correctionReason` sempre obrigatório;
- `reason` significa motivo do resultado `NOT_DONE`;
- não confundir com `correctionReason`;
- correção pode alterar somente comentário/motivo/evidência sem mudar resultado;
- se resultado final for `NOT_DONE`, exigir `reason`;
- se resultado final for `DONE` e tarefa exige foto, deve existir evidência válida vigente após a correção;
- atualização da execution + Task.status + evidência + evento ocorre em uma transação de banco;
- incrementar `Task.version`;
- evento guarda before/after;
- não apagar evento anterior.

### Executor após mudança de resultado pela gestão

No MVP:

- se a correção muda o resultado (`NOT_DONE -> DONE`, `DONE -> NOT_DONE` ou `AUTO_CLOSED -> DONE`), usar a membership do autor da correção como `executorMembershipId` da projeção atual;
- se a correção apenas muda comentário, motivo textual ou foto mantendo o resultado, preservar executor atual.

Se uma execução `AUTO_CLOSED` for corrigida, alterar a projeção corrente para `resolutionType = MANUAL` e preservar o encerramento automático no histórico append-only.

---

## 42. Comprovante de correção

A mutation de correção deve retornar:

```ts
{
  correctionId: string;
  task: ...;
}
```

O `correctionId` pode ser o ID do `business_event` de correção.

Criar:

`GET /v1/units/:unitId/tasks/:taskId/corrections/:correctionId`

Retornar:

- estado anterior;
- estado posterior;
- autor original quando aplicável;
- autor da correção;
- `correctionReason`;
- timestamp;
- referências de evidência.

Não implementar “última correção global”.

---

# PARTE VI — Eventos de negócio / histórico imutável

## 43. Modelo `business_events`

Esta será a **única fonte append-only de eventos** do MVP.

Não criar simultaneamente `task_events` e `business_events`.

Não é event sourcing: as tabelas de domínio continuam sendo a fonte de verdade do estado atual.

Campos recomendados:

```text
business_events
- id uuid PK
- unitId uuid FK units
- category varchar(20)
- eventType varchar(60)
- actorType varchar(20)
- actorMembershipId uuid nullable FK memberships
- actorNameSnapshot varchar(120) nullable
- actorRoleSnapshot varchar(20) nullable
- subjectType varchar(30)
- subjectId uuid
- subjectTitleSnapshot varchar(200)
- taskId uuid nullable FK tasks
- executionId uuid nullable FK task_executions
- evidenceId uuid nullable
- reason text nullable
- before jsonb nullable
- after jsonb nullable
- occurredAt timestamptz
```

Enums/checks mínimos:

```text
category: TASKS | USERS | MEDIA
actorType: USER | SYSTEM
```

### Eventos esperados

Pelo menos:

```text
TASK_CREATED
TASK_UPDATED
TASK_COPIED
TASK_TAKEN_OVER
TASK_EXECUTED
TASK_AUTO_CLOSED
TASK_CORRECTED
USER_CREATED
MEMBERSHIP_ROLE_CHANGED
MEMBERSHIP_DEACTIVATED
MEMBERSHIP_REACTIVATED
USER_PASSWORD_RESET
EVIDENCE_REPLACED
EVIDENCE_EXPIRED
```

Não incluir senha, hash, JWT, binário ou URL assinada em snapshots.

### Índices

- `(unitId, occurredAt DESC, id DESC)`
- `(taskId, occurredAt ASC, id ASC)`

---

## 44. Timeline da tarefa

`GET /v1/units/:unitId/tasks/:taskId/events`

Qualquer membership ativa da unidade.

Pode aceitar `category` futuramente, mas não é obrigatório para primeira implementação.

Retornar eventos em ordem cronológica adequada para timeline da tarefa.

O frontend faz labels e textos relativos; API entrega dados/eventType estruturados.

Funcionários podem consultar a timeline de uma tarefa antiga da própria unidade mesmo sem uma tela geral de histórico.

---

# PARTE VII — Evidências/fotos

## 45. Dependências e armazenamento

Usar storage privado compatível com S3/Railway.

Adicionar, quando iniciar esse domínio:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `sharp`
- tipos necessários de upload/Multer

Criar uma abstração simples de storage para permitir fake em testes, por exemplo:

```ts
interface EvidenceStorage {
  put(...): Promise<...>;
  delete(...): Promise<void>;
  createSignedReadUrl(...): Promise<string>;
}
```

A regra de negócio não deve depender diretamente do SDK em todos os services.

### Variáveis previstas

```env
EVIDENCE_S3_ENDPOINT=
EVIDENCE_S3_REGION=
EVIDENCE_S3_ACCESS_KEY_ID=
EVIDENCE_S3_SECRET_ACCESS_KEY=
EVIDENCE_S3_BUCKET=
EVIDENCE_SIGNED_URL_TTL_SECONDS=300
EVIDENCE_MAX_UPLOAD_BYTES=10485760
```

Nunca expor essas credenciais ao frontend.

---

## 46. Formatos de foto

MVP aceita entrada:

- JPEG;
- PNG;
- WebP.

Máximo: **10 MB** de entrada.

HEIC fica fora do MVP.

Validar se o conteúdo é uma imagem realmente decodificável, não confiar apenas no `Content-Type` enviado.

Usar `sharp` para:

- auto-rotate por metadata;
- limitar maior dimensão a **1600 px** sem ampliar imagens menores;
- normalizar saída para JPEG com qualidade razoável (ex.: 85), simplificando armazenamento e leitura.

Guardar metadata do arquivo original e do arquivo armazenado quando útil.

---

## 47. Modelo `task_evidence`

Criar:

```text
task_evidence
- id uuid PK
- unitId uuid FK units
- taskId uuid FK tasks
- executionId uuid nullable FK task_executions
- uploadedByMembershipId uuid FK memberships
- originalName varchar(...)
- storageKey text
- mimeType varchar(...)
- sizeBytes bigint/int adequado
- width int
- height int
- uploadedAt timestamptz
- expiresAt timestamptz
- attachedAt timestamptz nullable
- deletedAt timestamptz nullable
- isCurrent boolean NOT NULL default false
- createdAt timestamptz
- updatedAt timestamptz
```

Estados podem ser derivados:

- pendente: `executionId IS NULL` e não expirado/deletado;
- anexado: execution presente;
- expirado: `expiresAt <= now`;
- removido fisicamente: `deletedAt != null`.

Criar unicidade parcial via migration para garantir no máximo uma evidência `isCurrent = true` por execution.

---

## 48. Upload

`POST /v1/units/:unitId/tasks/:taskId/evidence-uploads`

Qualquer membership ativa que possa potencialmente executar/corrigir aquela tarefa.

`multipart/form-data` com uma imagem.

Fluxo:

1. validar unidade/tarefa;
2. validar arquivo;
3. processar imagem;
4. armazenar em bucket privado;
5. persistir metadata como evidência ainda não anexada;
6. `expiresAt = uploadedAt + 60 dias`;
7. devolver `evidenceId`.

Resposta:

```ts
{
  evidenceId: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'PENDING';
}
```

Upload isolado **não conclui tarefa**.

---

## 49. Anexar evidência à execução

Quando `/execution` ou `/corrections` receber `evidenceId`:

- evidence deve ser da mesma unidade;
- mesma task;
- ainda não expirada;
- ainda não consumida de forma incompatível;
- attach deve acontecer na mesma transação do banco que atualiza execution;
- `isCurrent = true` para a nova evidência;
- se houver evidência corrente anterior em correção, marcar anterior `isCurrent = false`;
- o arquivo antigo continua existindo até o seu próprio `expiresAt`.

Storage e PostgreSQL não compartilham transação; por isso uploads abandonados serão limpos pelo job.

---

## 50. Metadata e leitura

### Metadata

`GET /v1/units/:unitId/evidence/:evidenceId`

Valida acesso pela unidade/tarefa.

Retorna metadata mesmo após expiração.

### URL temporária

`GET /v1/units/:unitId/evidence/:evidenceId/content-url`

Se disponível:

```ts
{
  url: string;
  expiresAt: string;
}
```

URL assinada curta, default 5 minutos.

Se evidência expirou:

- `410 EVIDENCE_EXPIRED`.

Não usar bucket público nem URL permanente.

---

## 51. Lista de mídias da auditoria

Somente OWNER:

`GET /v1/units/:unitId/media`

Filtro:

```text
filter=all|active|expiring
```

Definição:

- `active`: disponível e faltam mais de 7 dias;
- `expiring`: disponível e faltam até 7 dias;
- `all`: todas as disponíveis.

Expiradas continuam aparecendo em histórico/evento quando referenciadas, mas não precisam entrar no catálogo padrão de mídias disponíveis.

---

# PARTE VIII — Fechamento automático

## 52. Scheduler

Adicionar `@nestjs/schedule` quando iniciar essa etapa.

O scheduler é interno ao Nest. Não usar Railway Cron no MVP.

Pode executar periodicamente (ex.: a cada minuto), mas **não depender exclusivamente do cron** porque a aplicação pode dormir/reiniciar.

Também reconciliar dias vencidos:

- ao iniciar aplicação;
- e/ou antes de operações sensíveis de contexto/tarefa.

---

## 53. Fechamento do dia

Quando `serverTime >= operationalDay.closesAt`:

Para cada task `PENDING` daquele dia:

1. lock da tarefa;
2. confirmar que continua pending;
3. criar `task_executions` com:
   - `result = NOT_DONE`
   - `resolutionType = AUTO_CLOSED`
   - `executorMembershipId = null`
   - reason padrão do sistema, por exemplo `Não concluída até o fechamento do dia`;
4. mudar `Task.status = NOT_DONE`;
5. incrementar version;
6. registrar `TASK_AUTO_CLOSED` com actor `SYSTEM`;
7. continuar para próxima.

Ao final, preencher `operational_days.closedAt`.

A operação deve ser idempotente e segura em concorrência.

Usar lock/advisory lock por unidade/dia ou equivalente para duas instâncias não fecharem o mesmo dia ao mesmo tempo.

A constraint `UNIQUE taskId` de execution + locks garante proteção adicional.

### Corrida execução x fechamento

A operação que adquirir e validar o estado da tarefa enquanto o dia ainda está aberto pode concluir; depois do corte, a execução deve falhar com:

- `409 OPERATIONAL_DAY_CLOSED`.

Nunca usar “última escrita vence”.

---

## 54. Retenção e limpeza de evidências

Job idempotente:

### Upload abandonado

Se:

- `executionId IS NULL`;
- upload possui mais de **24 horas**;

então remover binário e marcar metadata como removida.

### Retenção normal

Quando `expiresAt <= now`:

- bloquear leitura imediatamente, mesmo antes de remover arquivo;
- remover binário do storage;
- preencher `deletedAt`;
- preservar metadata;
- preservar evento/histórico;
- registrar `EVIDENCE_EXPIRED` apenas uma vez quando fizer sentido para a auditoria.

Cada evidência conta 60 dias a partir do **próprio upload**. Substituir foto não reinicia a retenção da anterior.

---

# PARTE IX — Dashboard e histórico de gestão

## 55. Dashboard

OWNER/MANAGER:

`GET /v1/units/:unitId/dashboard`

Retornar dados estruturados para Hoje e dia anterior:

```ts
{
  generatedAt: string;
  currentDay: {
    date: string;
    closesAt: string;
    done: number;
    notDone: number;
    pending: number;
    overdue: number;
    total: number;
    completionRate: number;
  };
  previousDay: {
    date: string;
    closedAt: string | null;
    done: number;
    notDone: number;
    total: number;
    completionRate: number;
  };
}
```

Não devolver `userName`, `roleLabel`, `dateLabel`, `closingLabel`, `updatedAtLabel` etc.; isso é composição do frontend.

### Fórmula

```text
total = done + notDone + pending
completionRate = total === 0 ? 0 : round(done / total * 100)
overdue é subconjunto de pending
```

Não somar overdue novamente em total.

---

## 56. Resumo do dia atual para gestão

`GET /v1/units/:unitId/days/current/summary`

OWNER/MANAGER.

Retornar:

- data;
- `generatedAt`;
- `closesAt`;
- summary;
- tarefa de atenção opcional;
- pendências atuais.

`attentionTask` pode ser `null`.

Sugestão de regra de atenção:

- primeira tarefa pending atrasada pela ordenação de dueAt;
- se nenhuma atrasada, null.

Não fabricar tarefa quando não houver.

---

## 57. Histórico mensal

`GET /v1/units/:unitId/history/days?month=YYYY-MM`

OWNER/MANAGER.

Retornar:

```ts
{
  summary: {
    done: number;
    notDone: number;
    total: number;
    completionRate: number;
  };
  days: Array<{
    date: string;
    done: number;
    notDone: number;
    total: number;
    completionRate: number;
    closedAt: string | null;
  }>;
}
```

Agregado mensal deve calcular taxa por `total done / total tasks`, não média simples das porcentagens diárias.

---

## 58. Histórico de um dia

`GET /v1/units/:unitId/history/days/:date`

OWNER/MANAGER.

Query opcional:

```text
statuses=DONE,NOT_DONE,AUTO_CLOSED
assigneeMembershipId=<uuid>
```

Para filtro histórico:

- `DONE` => task status done;
- `NOT_DONE` => execução not done com `resolutionType = MANUAL`;
- `AUTO_CLOSED` => execução not done com `resolutionType = AUTO_CLOSED`.

Retornar summary do **dia inteiro**, não recalculado apenas pelos filtros.

Retornar usuários/referências necessários ao filtro, incluindo membership atualmente inativa se ela possuir registros naquele dia.

Detalhes reutilizam:

- `GET /tasks/:taskId`
- `GET /tasks/:taskId/events`

Não criar outro modelo de IDs para histórico.

---

# PARTE X — Auditoria global

## 59. Lista de eventos

Somente OWNER:

`GET /v1/units/:unitId/audit/events`

Filtros:

```text
category=all|tasks|users|media
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
limit=1..200 // default 100
```

Para o MVP não é necessário cursor genérico. Limitar resposta evita consulta sem bound.

Ordenação:

```text
occurredAt DESC, id DESC
```

Datas de filtro devem respeitar timezone da unidade.

Retornar dados estruturados:

```ts
{
  items: Array<{
    id: string;
    category: 'TASKS' | 'USERS' | 'MEDIA';
    eventType: string;
    occurredAt: string;
    actor: null | {
      type: 'USER' | 'SYSTEM';
      membershipId?: string;
      name?: string;
      role?: string;
    };
    subject: {
      type: string;
      id: string;
      title: string;
    };
    taskId?: string;
    executionId?: string;
    evidenceId?: string;
    reason?: string;
  }>;
}
```

O título do card e labels ficam no frontend.

### Taxonomia

- alterações na definição/atribuição/execução/correção da tarefa => `TASKS`;
- criação/desativação/reativação/papel/reset de usuário => `USERS`;
- substituição/expiração de arquivo => `MEDIA`.

---

## 60. Detalhe do evento

Somente OWNER:

`GET /v1/units/:unitId/audit/events/:eventId`

Retornar:

- metadata;
- actor snapshot;
- subject snapshot;
- before/after;
- reason;
- referências à task/execution/evidence.

Nunca retornar segredo ou URL assinada permanente.

Não criar POST/PATCH/DELETE de auditoria.

---

# PARTE XI — Conflitos, erros e versionamento

## 61. Versionamento otimista

Usar `version` explícita pelo menos em:

- `units`;
- `memberships`;
- `tasks`.

Mutações sensíveis recebem `expectedVersion`.

Se não coincidir:

- `409` com código específico.

Exemplos:

```text
UNIT_VERSION_CONFLICT
MEMBERSHIP_VERSION_CONFLICT
TASK_VERSION_CONFLICT
```

Versionamento não substitui transação/lock para invariantes como último OWNER ou execução concorrente.

---

## 62. Formato de erro

Padronizar erros de domínio relevantes para o frontend:

```ts
{
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
```

`requestId` pode ficar para evolução futura.

Pode ser implementado com uma exception base/filter simples, sem criar framework interno complexo.

Códigos mínimos esperados:

```text
INVALID_SETUP_TOKEN
SETUP_ALREADY_COMPLETED
INVALID_CREDENTIALS
INVALID_OR_EXPIRED_ACCESS_TOKEN
USERNAME_ALREADY_EXISTS
UNIT_NOT_FOUND
MEMBERSHIP_NOT_FOUND
INACTIVE_MEMBERSHIP
INSUFFICIENT_PERMISSION
LAST_ACTIVE_OWNER
MEMBERSHIP_VERSION_CONFLICT
REASSIGNMENT_REQUIRED
TASK_NOT_FOUND
TASK_VERSION_CONFLICT
TASK_ALREADY_EXECUTED
OPERATIONAL_DAY_CLOSED
TAKEOVER_REASON_REQUIRED
NOT_DONE_REASON_REQUIRED
CORRECTION_REASON_REQUIRED
EVIDENCE_REQUIRED
EVIDENCE_NOT_FOUND
EVIDENCE_INVALID
EVIDENCE_EXPIRED
EVIDENCE_ALREADY_ATTACHED
```

Usar:

- `400` validação de DTO/formato;
- `401` autenticação;
- `403` permissão;
- `404` recurso inexistente ou inacessível quando apropriado;
- `409` conflito de estado/versão/invariante;
- `410` evidência expirada;
- `413` arquivo grande;
- `415` formato incompatível.

---

# PARTE XII — Integridade e FKs

## 63. Revisar cascades atuais

Atualmente memberships apontam para User/Unit com `onDelete: CASCADE`.

Antes de introduzir histórico, migrations devem revisar essa política.

Objetivo:

- não permitir que remover uma identidade/unidade apague tarefas, execution, evidence e auditoria;
- como não haverá delete físico pelo produto no MVP, preferir `RESTRICT`/`NO ACTION` nas relações históricas relevantes.

Não criar endpoints de hard delete de User, Membership, Unit, Task, Execution ou Event.

---

## 64. Mesma unidade

FK isolada não garante que IDs de tabelas distintas pertencem à mesma unidade.

Toda regra que relaciona:

- task;
- assignee membership;
- executor;
- actor;
- evidence;
- replacement membership;

precisa validar explicitamente a mesma `unitId` dentro da transação/service.

UUID válido de outra unidade deve ser tratado como inacessível/inválido.

---

# PARTE XIII — Dependências novas previstas

Adicionar somente quando a etapa exigir:

```text
luxon
@types/luxon
@nestjs/schedule
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
sharp
@types/multer (se necessário)
```

Antes de adicionar outra dependência, verificar se Nest/Node/TypeORM já resolvem o problema.

---

# PARTE XIV — Ordem de implementação

## 65. Etapa 1 — Fundação segura

Implementar primeiro:

1. migration `credentialVersion` em users;
2. `isActive`, `deactivatedAt`, `version` em memberships;
3. `timezone`, `closingTime`, `version` em units;
4. bootstrap `POST /setup/owner` transacional + concorrente;
5. `AccessTokenGuard` validando User + credentialVersion;
6. login exigindo alguma membership ativa;
7. `/auth/me` completo;
8. contexto/guard de unidade;
9. retirar endpoints públicos temporários de users.

### Testes obrigatórios

- bootstrap bem-sucedido;
- rollback do bootstrap;
- segundo bootstrap;
- duas requisições simultâneas;
- token com credentialVersion antiga;
- usuário inexistente;
- login sem membership ativa;
- acesso a unit sem membership.

---

## 66. Etapa 2 — Conta e equipe

Implementar:

1. troca da própria senha;
2. listagem/detalhe de memberships;
3. criação User + Membership na unidade atual;
4. alteração de role;
5. reset administrativo de senha;
6. reativação básica;
7. eventos de usuários necessários.

A desativação com reatribuição completa entra depois de tasks existir.

### Testes

- hierarquia OWNER/MANAGER;
- username duplicado;
- transação User + Membership;
- último OWNER em role change;
- reset incrementa credentialVersion;
- reset não reativa membership.

---

## 67. Etapa 3 — Dia operacional e configurações

Implementar:

1. Luxon/ClockService;
2. `operational_days`;
3. cálculo do dia atual;
4. `/units/:id/context`;
5. GET/PATCH settings;
6. version conflict de settings.

### Testes

- antes do corte;
- exatamente no corte;
- depois do corte;
- meia-noite;
- fechamento 03:00;
- timezone IANA;
- mudança de closingTime sem alterar operational_day histórico.

---

## 68. Etapa 4 — Tarefas e business events

Implementar:

1. `tasks`;
2. `business_events`;
3. create;
4. catalog;
5. by-date;
6. detail;
7. patch permitido;
8. copy;
9. task events/timeline.

### Testes

- assignment geral/pessoal;
- membership de outra unidade;
- responsável inativo;
- dueAt antes/depois do corte;
- data passada fechada;
- data atual/futura;
- edição apenas pending;
- expectedVersion;
- cópia sem execution/histórico.

---

## 69. Etapa 5 — Execução sem foto + fechamento

Implementar:

1. `task_executions`;
2. `/tasks/today`;
3. takeover;
4. DONE sem evidência quando opcional;
5. NOT_DONE;
6. scheduler;
7. auto-close;
8. reconciliação ao subir/usar contexto;
9. desativação + reatribuição atômica agora que tasks existe.

### Testes

- filtros Hoje;
- resumo não muda com filtro;
- ordem;
- geral executada diretamente;
- pessoal alheia exige takeover;
- takeover reason;
- notDone reason;
- concorrência de duas execuções;
- execução x fechamento;
- job repetido;
- app “perdeu” o horário e reconciliou depois;
- desativação move current+future pending personal tasks;
- rollback da desativação.

---

## 70. Etapa 6 — Evidências

Implementar:

1. storage abstraction;
2. S3 provider;
3. `task_evidence`;
4. upload;
5. attach na execução;
6. signed read URL;
7. image processing;
8. evidence required;
9. limpeza de órfãs;
10. retenção 60 dias.

### Testes

- tipo inválido;
- >10 MB;
- imagem corrompida;
- outra unit/task;
- evidence requerida;
- evidence já consumida;
- signed URL só para autorizado;
- expiração retorna 410;
- metadata continua após expiração;
- órfã >24h é removida.

E2E de storage pode usar fake provider; não depender de Railway real para todos os testes.

---

## 71. Etapa 7 — Correções

Implementar:

1. correção de employee da própria execução/dia aberto;
2. correção de gestão após fechamento;
3. troca de status;
4. substituição de evidence;
5. correction receipt por ID;
6. before/after.

### Testes

- autoria vs assignee;
- employee depois do fechamento;
- manager/owner;
- reason vs correctionReason;
- DONE exige evidence quando configurado;
- correção textual com evidence antiga expirada não exige novo upload se resultado continua válido e foto não está sendo substituída;
- mudança para DONE exige evidence válida quando obrigatória;
- autoClosed -> done usa autor da correção como executor atual;
- foto antiga mantém expiração própria.

---

## 72. Etapa 8 — Dashboard, histórico e auditoria OWNER

Implementar:

1. dashboard;
2. current day summary;
3. history month;
4. history day;
5. audit events;
6. audit event detail;
7. media list.

### Testes

- métricas sem dupla contagem de overdue;
- taxa de mês por totais, não média diária;
- filtro manual notDone vs autoClosed;
- usuário inativo preservado no histórico;
- auditoria negada para MANAGER;
- auditoria OWNER;
- ordem desc estável;
- filtro de data no timezone da unidade;
- sem endpoint de exportação.

---

## 73. Etapa 9 — Preparação para integração

Somente depois de todas as etapas acima:

1. revisar Swagger completo;
2. remover TODOs/rotas temporárias de desenvolvimento;
3. rodar todos os testes;
4. rodar coverage e revisar gaps críticos;
5. rodar lint e build;
6. conferir migrations do zero em banco vazio;
7. conferir migrations sobre o schema atual;
8. revisar `.env.example`;
9. revisar logs para garantir ausência de segredo/senha/token;
10. documentar exemplos reais de requests/responses.

**Ainda não alterar o frontend nesta etapa.**

Depois disso iniciaremos uma tarefa separada de integração `guarni-web -> guarni-api`.

---

# PARTE XV — Testes e qualidade

## 74. Estratégia

Manter:

- unit tests para services, helpers, guards e regras puras;
- E2E com PostgreSQL para transações, constraints e autorização real.

Não mockar o banco justamente nos testes cujo objetivo é provar:

- transação;
- concorrência;
- FK;
- unique;
- lock;
- rollback.

### Clock

Usar serviço injetável de relógio para regras de data. Evitar testes frágeis dependentes do horário real da máquina.

### Storage

Usar provider fake/in-memory em unit/E2E quando o objetivo não for testar SDK S3.

---

## 75. Cenários E2E mínimos finais

Ao terminar o MVP, deve existir cobertura integrada pelo menos para:

### Setup/auth

- setup inicial;
- setup duplicado;
- login;
- `/me`;
- token inválido;
- token invalidado por troca/reset de senha.

### Autorização

- owner;
- manager;
- employee;
- unitId de outra unidade;
- membership inativa.

### Equipe

- criar employee por manager;
- manager tentando criar owner;
- owner criando manager/owner;
- último owner;
- reset de senha;
- deactivate + reassignment.

### Tarefas

- create;
- edit;
- copy;
- today;
- takeover;
- execute done/notDone;
- conflito de versão.

### Dia

- fechamento automático;
- reconciliação;
- concorrência com execução.

### Foto

- upload;
- execução com evidência obrigatória;
- leitura autorizada;
- expiração.

### Correção

- employee própria;
- employee alheia negada;
- management;
- dia fechado;
- autoClosed corrigida.

### Histórico/auditoria

- agregados;
- filtros;
- owner-only audit.

---

# PARTE XVI — Contratos resumidos

## 76. Endpoints do MVP

### Setup

```text
POST   /v1/setup/owner
```

### Auth

```text
POST   /v1/auth/login
GET    /v1/auth/me
PUT    /v1/auth/password
```

### Unidade

```text
GET    /v1/units/:unitId/context
GET    /v1/units/:unitId/settings
PATCH  /v1/units/:unitId/settings
```

### Equipe

```text
GET    /v1/units/:unitId/memberships
GET    /v1/units/:unitId/memberships/:membershipId
POST   /v1/units/:unitId/users
PATCH  /v1/units/:unitId/memberships/:membershipId
GET    /v1/units/:unitId/memberships/:membershipId/reassignment-summary
POST   /v1/units/:unitId/memberships/:membershipId/deactivate
POST   /v1/units/:unitId/memberships/:membershipId/reactivate
PUT    /v1/units/:unitId/memberships/:membershipId/password
```

### Tarefas

```text
GET    /v1/units/:unitId/tasks
GET    /v1/units/:unitId/tasks/by-date
GET    /v1/units/:unitId/tasks/today
GET    /v1/units/:unitId/tasks/:taskId
GET    /v1/units/:unitId/tasks/:taskId/events
POST   /v1/units/:unitId/tasks
PATCH  /v1/units/:unitId/tasks/:taskId
POST   /v1/units/:unitId/tasks/:taskId/copies
POST   /v1/units/:unitId/tasks/:taskId/takeover
POST   /v1/units/:unitId/tasks/:taskId/execution
POST   /v1/units/:unitId/tasks/:taskId/corrections
GET    /v1/units/:unitId/tasks/:taskId/corrections/:correctionId
```

### Evidências

```text
POST   /v1/units/:unitId/tasks/:taskId/evidence-uploads
GET    /v1/units/:unitId/evidence/:evidenceId
GET    /v1/units/:unitId/evidence/:evidenceId/content-url
```

### Gestão

```text
GET    /v1/units/:unitId/dashboard
GET    /v1/units/:unitId/days/current/summary
GET    /v1/units/:unitId/history/days
GET    /v1/units/:unitId/history/days/:date
```

### Auditoria OWNER

```text
GET    /v1/units/:unitId/audit/events
GET    /v1/units/:unitId/audit/events/:eventId
GET    /v1/units/:unitId/media
```

Não existe endpoint de exportação no MVP.

---

# PARTE XVII — Integração futura com o frontend

## 77. Não executar agora

O `guarni-web` atual usa mocks e alguns tipos de apresentação. Isso é intencional neste momento.

Quando o backend estiver pronto, faremos outra etapa para preservar o padrão:

```text
view -> hook -> api/adaptador -> HTTP
```

O objetivo será manter hooks/views o máximo possível e substituir os mocks em `src/api` por chamadas reais/adaptadores.

Mudanças pontuais inevitáveis na futura integração incluem:

- unit IDs reais em query keys;
- membership IDs em vez de IDs mockados de usuário;
- `expectedVersion`;
- `File -> evidenceId`;
- correctionId real;
- data operacional vinda do servidor;
- token novo após troca de senha;
- permissões reais de owner/manager;
- tratamento de códigos 403/409/410.

**Não antecipar essas mudanças no frontend enquanto este plano de backend estiver sendo executado.**

---

# PARTE XVIII — Critério de conclusão

## 78. Definition of Done do backend MVP

O trabalho descrito neste documento está concluído quando:

- [ ] não existem rotas públicas temporárias de cadastro/consulta/delete de usuário usadas pelo produto;
- [ ] bootstrap é atômico e seguro contra concorrência;
- [ ] login usa usuários reais e membership ativa;
- [ ] credentialVersion invalida tokens após troca/reset de senha;
- [ ] `/auth/me` retorna memberships reais;
- [ ] autorização por unidade está centralizada;
- [ ] hierarquia OWNER/MANAGER está aplicada no backend;
- [ ] cadastro cria User + Membership da unidade atual atomicamente;
- [ ] último OWNER ativo é preservado sob concorrência;
- [ ] dia operacional é calculado pelo servidor/fuso da unidade;
- [ ] tarefas reais suportam create/list/detail/edit/copy;
- [ ] Hoje suporta filtros, resumo e ordenação;
- [ ] takeover funciona com justificativa;
- [ ] DONE/NOT_DONE funcionam com transação e conflito de versão;
- [ ] fechamento automático é idempotente;
- [ ] desativação reatribui tarefas atomicamente;
- [ ] upload de foto usa storage privado;
- [ ] foto obrigatória é validada no servidor;
- [ ] fotos expiram individualmente após 60 dias;
- [ ] uploads órfãos são limpos;
- [ ] correções preservam before/after e regras de permissão;
- [ ] business_events são append-only;
- [ ] dashboard/histórico usam dados reais e agregados consistentes;
- [ ] auditoria global é exclusiva de OWNER;
- [ ] não existe exportação de auditoria;
- [ ] Swagger representa os contratos implementados;
- [ ] migrations funcionam do schema atual até o final;
- [ ] `npm run build` passa;
- [ ] `npm run lint` passa;
- [ ] `npm test` passa;
- [ ] `npm run test:e2e` passa com PostgreSQL;
- [ ] `.env.example` contém todas as novas variáveis sem segredos reais;
- [ ] nenhum log/response contém senha, hash, setup token, access token ou credenciais de storage;
- [ ] `PROJECT_CONTEXT.md` é atualizado ao final com o novo estado real do backend.

---

## 79. Observação final para execução

Priorizar **correção, simplicidade e testes** em vez de criar abstrações para funcionalidades futuras.

Se durante a implementação surgir uma dúvida que altere regra de produto deste documento, **não inventar silenciosamente**. Registrar a dúvida e parar apenas aquela regra específica; continuar o que for independente dela.

Pequenas decisões técnicas internas que não mudem contrato ou regra de negócio podem ser tomadas seguindo o padrão já existente do projeto.
