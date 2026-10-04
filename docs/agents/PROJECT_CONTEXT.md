# Contexto rápido — 2026-10-04

## Estado / próxima ação
Guarni: checklist operacional de restaurantes. Repositório guarni-api; guarni-web separado, fora do escopo atual.
FEITO: C1 bootstrap atômico; C2 troca/reset+revogação; C3 autorização por unidade+GET settings; CLIs listar/reset.
PRÓXIMO: C4 hierarquia ator/alvo e último OWNER ativo sob concorrência. Primeiro exercício: alterar role OU desativar; src/memberships/memberships.service.ts, controller e dto/.
PENDENTE: contexto/dia operacional, PATCH settings, gestão de equipe/tarefas/execuções/evidências/auditoria; contratos/entities prontos não significam regra implementada. Preservar stubs 501.
VALIDAÇÃO histórica: 46 unitários+41 E2E, build/tipos/lint OK. Senha confirmada no Swagger; settings manual sem confirmação. Não reexecutada nesta retomada.

## Stack / mapa
Node24/Nest12/TS ESM NodeNext/TypeORM/PG17/Argon2id/JWT/Vitest/Supertest. Versões: package.json/lock.
API=/v1; Swagger=/docs; saúde=/v1/health. Controllers=HTTP, services=negócio, DTO=entrada, entity=banco. Imports .js; código inglês, mensagens PT-BR em constants; ValidationPipe+Swagger.
Auth: src/auth/; setup: src/setup/; autorização: src/memberships/guards/ e decorators/; settings: src/units/; CLIs: src/admin/; migrations: src/database/.

## Invariantes
- synchronize=false; migrations com literais históricos/constraints nomeadas; registrar entity em database/data-source.ts. Mesmo manager nas transações; rollback real; concorrência exige lock/update condicionado.
- Username único/normalizado; senha somente hash. Setup usa X-Setup-Token/timingSafeEqual/advisory lock; unidade existente→409.
- Login exige vínculo ativo. JWT contém sub/credentialVersion; guard consulta usuário/versão. Troca exige senha atual, atualiza hash+versão condicionados e assina token na transação. Reset também revoga.
- Guards JWT→membership(userId=request.user.sub,unitId=rota,isActive=true); validar UUID antes de query; contexto via @CurrentMembership. Validar mesma unidade e permissão por operação.
- Hierarquia prevista: OWNER administra todos; MANAGER só EMPLOYEE; sempre ≥1 OWNER ativo. Auditoria global da unidade exclusiva de OWNER. Preservar histórico, sem hard-delete público.
- .env/Joi; nunca expor segredos/hashes. Docker volume persistente; Stop não apaga. Railway planejado, não confirmado. Testes só guarni_test; E2E serializados entre suites.

## Comandos
Dev: npm run start:dev
Checks: npm run build / npm run lint / npm test / npm run test:e2e
Format: npx prettier --write <arquivos>
Migrations: npm run migration:show / npm run migration:run (disparam build)
Admin: npm run admin:list-users / npm run owner:reset-password -- <username>
Reset é interativo e imprime senha: não logar. Build Nest exclui tipos dos testes; conferir separadamente no marco relevante. Sem reinstalação automática.

## Progresso de estudo (aplicar apenas no modo local)
Praticados: Nest/DI/DTO/Swagger/Joi; TypeORM/migrations/constraints/23505; Argon2/JWT/testes; transações/advisory/timingSafeEqual/revogação/update condicionado; membership/decorator.
Novos: C4 lock pessimista/último OWNER; C5 Luxon/Clock/dia; C6 expectedVersion settings; C7 BusinessEvent; C8 execução/fechamento; C9 scheduler; C10 multipart/sharp/S3; C11 índice parcial; C12 agregações.

## Detalhes sob demanda
docs/MVP_SPEC.md: única especificação detalhada; buscar seção por assunto, não ler inteiro. Contratos futuros, não prova de implementação. Código atual confirma o estado.
LEARNING_NEXT_STEPS.md=guia humano; não necessário para retomar. AGENTS.override.md=local ignorado; AGENTS.md=versionado. Não implementar outros checkpoints por haver scaffold.
