# Guarni API — próximos passos de aprendizado

Este arquivo é a instrução de trabalho para continuar o `guarni-api` com o Codex.

## Regra principal

O objetivo não é o Codex implementar tudo sozinho. O usuário está estudando backend.

- Quando a tarefa repetir um conceito que já foi praticado, o Codex pode implementar diretamente.
- Quando aparecer um conceito novo listado abaixo, o Codex deve primeiro explicar o conceito, mostrar onde ele entra no Guarni e dividir o trabalho em passos pequenos.
- No checkpoint novo, o usuário escreve a parte central manualmente. O Codex revisa, explica erros e ajuda a corrigir.
- Depois que o conceito novo foi praticado uma vez, as repetições desse mesmo padrão podem ser implementadas pelo Codex.
- Não reescrever boilerplate que já está preparado neste repositório.
- Não alterar o `guarni-web` nesta fase.

## Conceitos que já foram praticados e podem ser automatizados

O usuário já trabalhou na prática com:

- módulos NestJS;
- controllers, services/providers e injeção de dependência;
- decorators e prefixo `/v1`;
- DTOs com `class-validator`/`class-transformer`;
- `ValidationPipe`;
- Swagger;
- ConfigModule + Joi;
- PostgreSQL + TypeORM;
- entities;
- repositories e `TypeOrmModule.forFeature`;
- migrations versionadas;
- PK, UNIQUE, FK e CHECK com nomes explícitos;
- normalização de dados;
- Argon2id;
- tratamento de `23505`;
- JWT access token;
- guard JWT básico;
- `ParseUUIDPipe`;
- testes unitários com Vitest;
- testes E2E com Supertest/PostgreSQL;
- health check/Terminus.

Por isso, arquivos repetitivos desses tipos já foram preparados sempre que possível.

## O que já foi preparado automaticamente

### Modelo/persistência

Foram preparados:

- `User.credentialVersion`;
- `Unit.timezone`, `closingTime` e `version`;
- `Membership.isActive`, `deactivatedAt` e `version`;
- entity `OperationalDay`;
- entity `Task`;
- entity `TaskExecution`;
- entity `TaskEvidence`;
- entity `BusinessEvent`;
- migration `1790000000000-PrepareMvpDomain.ts`;
- FKs/constraints/índices básicos;
- troca dos FKs históricos de membership de `CASCADE` para `RESTRICT`;
- registro das novas entities no `data-source.ts`.
- remoção do controller público temporário de `users` (`register`, consulta pública e delete físico); `UsersService` permanece apenas como dependência interna.

A migration propositalmente **não** cria a unicidade parcial de evidência corrente. Isso fica no checkpoint de SQL avançado/evidência.

### Contratos HTTP

Foram preparados DTOs, controllers e módulos para:

- setup do primeiro owner;
- contexto/configurações de unidade;
- equipe/memberships;
- cadastro de usuário dentro da unidade;
- tarefas;
- takeover;
- execução;
- correção;
- timeline;
- evidências;
- dashboard/histórico;
- auditoria.

Também já estão preparados, por serem repetição de DTO + ValidationPipe:

- validação de mês do histórico;
- validação da data e filtros do histórico diário;
- filtro do catálogo de mídias;
- filtros de auditoria e `limit` entre 1 e 200;
- `description` opcional na cópia de tarefa, alinhada ao fluxo atual do `guarni-web`.

Quando uma rota depende de conceito ainda não estudado, ela retorna `501 Not Implemented` ou é bloqueada pelo `UnitMembershipGuard` ainda não implementado. Isso é intencional.

### Auth que já usa conceitos conhecidos

Já foi preparado:

- login exige pelo menos uma membership ativa;
- JWT passa a carregar `credentialVersion` além do payload transitório atual;
- `/auth/me` consulta o usuário real e memberships ativas;
- DTO de troca de senha já existe;
- teste unitário do AuthService foi ajustado para a nova consulta.

Ainda **não** foi implementada a comparação de `credentialVersion` dentro do guard. Esse é um checkpoint abaixo.

### Dependências novas propositalmente não instaladas

O scaffold **não** adiciona ainda bibliotecas dos conceitos que você precisa estudar. Elas entram no checkpoint correspondente:

- Luxon para timezone/dia operacional;
- `@nestjs/schedule` para scheduler;
- `sharp` para processamento de imagem;
- SDK S3 compatível para storage.

Isso evita esconder a instalação/configuração de uma tecnologia nova dentro do boilerplate automático.

### Rotas antigas de usuário

As rotas temporárias `POST /users/register`, `GET /users/:username` e `DELETE /users/:userId` continuam no projeto somente para preservar o estágio atual e os testes existentes enquanto o fluxo protegido ainda não foi aprendido/implementado.

Depois de concluir autorização por membership + cadastro de usuário na unidade, o Codex pode remover/proteger essas rotas diretamente. Essa limpeza não precisa virar uma aula nova; o conceito novo é a autorização que vem antes dela.

---

# Checkpoints novos — fazer manualmente

## 1. Transações TypeORM + concorrência de bootstrap

### Objetivo

Implementar `POST /v1/setup/owner` corretamente.

### Conceitos novos

- `DataSource.transaction` ou `QueryRunner`;
- atomicidade/rollback;
- concorrência entre duas requisições;
- PostgreSQL advisory transaction lock;
- por que `count() === 0` sozinho sofre race condition.

### Arquivos preparados

- `src/setup/setup.module.ts`
- `src/setup/setup.controller.ts`
- `src/setup/setup.service.ts`
- `src/setup/dto/setup-owner.dto.ts`

### O usuário deve implementar

1. proteção por `X-Setup-Token` usando `SETUP_OWNER_TOKEN`;
2. transação;
3. advisory lock;
4. verificação de bootstrap já realizado;
5. criação de User + Unit + Membership OWNER no mesmo commit;
6. rollback e `409 SETUP_ALREADY_COMPLETED`.

### Depois que funcionar

O Codex pode criar/repetir testes extras e aplicar o mesmo padrão de transação em operações futuras.

---

## 2. Access token validado contra o banco

### Objetivo

Fazer troca/reset de senha invalidar tokens antigos.

### Conceitos novos

- diferença entre validar assinatura JWT e validar estado atual da identidade;
- `credentialVersion`;
- custo de consultar o banco no guard;
- token stateless versus revogação lógica.

### O usuário deve implementar

No `AccessTokenGuard`:

1. verificar JWT como já ocorre;
2. buscar `User` por `sub`;
3. comparar `credentialVersion` do token com o banco;
4. rejeitar usuário inexistente ou versão divergente;
5. só então anexar o usuário autenticado à request.

Depois implementar `PUT /v1/auth/password`:

- validar senha atual;
- hash da nova senha;
- incrementar `credentialVersion`;
- emitir novo access token.

---

## 3. Autorização por unidade/membership

### Objetivo

Desbloquear de forma segura todas as rotas `/v1/units/:unitId/...`.

### Conceitos novos

- autenticação versus autorização;
- contexto de recurso;
- membership como autorização por tenant/unidade;
- impedir IDOR/acesso cruzado;
- anexar contexto validado à request.

### Arquivo preparado

`src/memberships/guards/unit-membership.guard.ts`

Ele propositalmente lança `501` hoje. **Não trocar temporariamente por `return true`.**

### O usuário deve implementar

1. ler `unitId` da rota;
2. obter `userId` autenticado;
3. consultar membership `(unitId, userId, isActive=true)`;
4. negar acesso se não existir;
5. anexar membership validada à request;
6. criar tipo/decorator simples para services/controllers consumirem esse contexto.

Depois disso, o Codex pode preencher consultas CRUD repetitivas de memberships e tarefas.

---

## 4. Hierarquia OWNER/MANAGER + locks

### Objetivo

Implementar administração de usuários sem violar a regra do último OWNER.

### Conceitos novos

- autorização baseada em ator + alvo, não somente role da rota;
- `SELECT ... FOR UPDATE`/pessimistic lock;
- invariantes sob concorrência.

### Regra

- OWNER administra OWNER/MANAGER/EMPLOYEE;
- MANAGER administra somente EMPLOYEE;
- sempre deve restar pelo menos um OWNER ativo.

### Primeiro exercício manual

Implementar alteração de role ou desativação preservando o último OWNER sob duas requisições concorrentes.

Depois de praticar o lock uma vez, o Codex pode repetir o padrão em reativação/desativação e outras operações.

---

## 5. Dia operacional + timezone IANA + ClockService

### Objetivo

Implementar o conceito de dia que fecha às 03:00 sem depender do timezone do servidor/browser.

### Conceitos novos

- timezone IANA;
- instante UTC versus horário local;
- corte que atravessa meia-noite;
- clock injetável para testes determinísticos.

### Arquivos preparados

- `src/operational-days/entities/operational-day.entity.ts`
- `src/operational-days/operational-days.module.ts`
- `src/operational-days/operational-days.service.ts`

### O usuário deve implementar

1. adicionar Luxon;
2. criar `ClockService`;
3. calcular data operacional atual;
4. calcular `opensAt`/`closesAt`;
5. criar/reutilizar `operational_days` sem alterar históricos;
6. testar antes/no/depois de 03:00.

---

## 6. Versionamento otimista (`expectedVersion`)

### Objetivo

Evitar que duas telas sobrescrevam alterações silenciosamente.

### Conceitos novos

- optimistic concurrency control;
- compare-and-swap;
- update condicionado por versão;
- `409 ..._VERSION_CONFLICT`.

### Primeiro exercício manual

Fazer `PATCH /units/:unitId/settings` atualizar somente quando `version === expectedVersion` e incrementar a versão.

Depois disso, o Codex pode repetir o padrão em membership e task.

---

## 7. Operações atômicas de tarefa + business event

### Objetivo

Ao mudar o estado do domínio, gravar a projeção atual e o histórico no mesmo commit.

### Conceitos novos

- transação envolvendo várias tabelas;
- snapshot `before/after`;
- append-only audit trail;
- por que isto **não** é event sourcing.

### Primeiro exercício manual

Escolher uma operação simples, preferencialmente criação de tarefa:

1. criar Task;
2. criar `BusinessEvent(TASK_CREATED)`;
3. ambos na mesma transação;
4. falha no evento deve reverter a Task.

Depois o Codex pode reutilizar o padrão em edição/cópia/execução.

---

## 8. Execução concorrente / fechamento

### Conceitos novos

- lock da tarefa;
- disputa entre execução, takeover e fechamento;
- validar estado novamente **dentro** da transação;
- por que “li PENDING antes” não garante que ainda está PENDING no commit.

O usuário deve implementar manualmente a primeira execução com lock + `expectedVersion`.

---

## 9. Scheduler e reconciliação

### Conceitos novos

- `@nestjs/schedule`;
- job idempotente;
- aplicação que dorme/reinicia;
- reconciliação em vez de confiar somente no cron.

O usuário deve implementar o primeiro job de fechamento de dia. Depois o Codex pode repetir o mecanismo para retenção de mídia.

---

## 10. Multipart, imagens e storage S3

### Conceitos novos

- `multipart/form-data` no Nest;
- `FileInterceptor`/Multer;
- validar conteúdo real e não só MIME informado;
- `sharp`;
- abstração de storage;
- SDK S3;
- signed URL;
- consistência entre PostgreSQL e storage sem transação distribuída.

O endpoint de upload já está marcado no controller, mas **não recebe arquivo ainda**.

O usuário deve implementar manualmente o primeiro upload completo.

Depois disso o Codex pode implementar metadata, content URL e limpeza repetitiva.

---

## 11. Índice parcial de evidência atual

Depois de estudar evidências, criar uma nova migration para garantir no banco no máximo uma evidência corrente por execução, usando índice UNIQUE parcial (`WHERE isCurrent = true`).

Não colocar essa regra apenas no service.

---

## 12. Agregações de dashboard/histórico

Se o usuário ainda não tiver praticado agregações SQL/QueryBuilder (`COUNT`, `GROUP BY`, condicionais), ensinar usando primeiro o resumo do dia.

Depois que uma agregação for feita manualmente, o Codex pode implementar as demais métricas repetitivas.

---

# Ordem recomendada das sessões

1. Rodar migration preparada e conferir schema.
2. Bootstrap transacional.
3. `credentialVersion` no guard + troca de senha.
4. `UnitMembershipGuard`.
5. Hierarquia e último OWNER.
6. Dia operacional/ClockService.
7. `expectedVersion` em settings.
8. CRUD/listagens simples de equipe — Codex pode fazer a parte repetitiva.
9. Criação de Task + BusinessEvent na mesma transação.
10. Catálogo/detalhe/filtros — Codex pode fazer depois do padrão estar aprendido.
11. Execução/takeover/locks.
12. Scheduler/fechamento.
13. Upload/storage.
14. Correções.
15. Dashboard/histórico/auditoria.
16. Integração com `guarni-web`.

# Como o Codex deve conduzir cada checkpoint

Ao abrir ou retomar este projeto, o Codex deve primeiro:

1. conferir o diff/estado do repositório;
2. ler o código relevante e identificar o ponto atual do aprendizado;
3. fazer uma revisão simples por leitura dos arquivos e do diff;
4. deixar instalação de dependências e verificações executáveis para quando forem necessárias para testar ou rodar um fluxo pronto;
5. **não** implementar automaticamente nenhum checkpoint novo só porque encontrou um `501`.

Para cada item novo:

1. explicar em português simples **qual problema o conceito resolve**;
2. apontar os arquivos exatos envolvidos;
3. mostrar a forma/assinatura da solução, sem entregar a implementação inteira de imediato;
4. pedir ao usuário para escrever a parte central;
5. revisar o código enviado por leitura, conferindo imports, assinaturas, tipos aparentes, lógica e ordem das operações;
6. explicar os problemas encontrados e orientar o próximo passo pequeno, sem executar build ou testes a cada edição;
7. quando houver uma funcionalidade ou etapa completa pronta para testar, rodar de verdade ou preparar para commit, executar as verificações adequadas e explicar eventuais erros;
8. somente depois automatizar as repetições do mesmo padrão.

Evitar transformar cada aula em refatoração arquitetural. Usar NestJS e TypeORM de forma direta e consistente com o projeto atual.

## Momento das verificações

- Durante a escrita e os passos intermediários, a revisão padrão é simples: ler os arquivos alterados e o diff. Não executar automaticamente build, typecheck, lint, testes unitários, E2E ou consultas ao banco a cada "feito" ou "próximo".
- Reservar build e verificações mais pesadas para uma etapa funcional pronta para teste/execução ou para preparação de commit. Executar apenas as verificações pertinentes às mudanças; não repetir suites sem alterações ou dúvidas que justifiquem a repetição.
- Comandos auxiliares também contam: `npm run migration:show`, por exemplo, dispara build neste projeto e não deve ser usado como revisão leve.
- Não executar `npm ci` automaticamente ao retomar a conversa; instalar dependências quando necessário para a execução planejada.
- Se o usuário pedir explicitamente um teste, build ou investigação de erro em execução, fazer a verificação solicitada naquele momento.
- Distinguir revisão de código de validação executada: não afirmar que compilou ou passou em testes quando houve apenas leitura.

# Importante sobre os stubs 501

Os `NotImplementedException` atuais são marcadores de segurança/aprendizado.

Eles devem ser removidos **somente** quando a regra correspondente estiver realmente implementada e testada. Não substituir por retorno fake nem liberar guard temporariamente.
