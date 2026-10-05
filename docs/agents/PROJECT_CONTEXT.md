# Contexto rápido — 2026-10-04

## Estado / próxima ação
Guarni: checklist operacional de restaurantes. Repositório guarni-api; guarni-web separado, fora do escopo atual.
FEITO: C1 bootstrap atômico; C2 troca/reset+revogação; C3 autorização por unidade+GET settings; CLIs listar/reset.
C4 VALIDADO: PATCH membership role com hierarquia, lock da unidade, revalidação do solicitante, último OWNER, versão/update condicionado e BusinessEvent atômico. Resposta 200 id/role/version, documentada no Swagger; métodos privados. test/membership-role.e2e-spec.ts: 17 cenários. PRÓXIMO: C5 contexto/dia operacional; não antecipar implementação sem orientação.
FEITO também: GET memberships (OWNER/MANAGER, filtros search/isActive/role, todos os papéis) e GET membership por id (OWNER todos; MANAGER só EMPLOYEE). DTOs/Swagger; somente identificação pública, sem credenciais. Busca literal trim/lowercase, ordem nome/username/id.
PENDENTE: contexto/dia operacional, PATCH settings, cadastro/reativação/desativação/reset pela API de equipe, tarefas/execuções/evidências/auditoria; contratos/entities prontos não significam regra implementada. Preservar stubs 501.
VALIDAÇÃO atual: 46 unitários + 68 E2E passando; build/lint e tipos src+test OK. 10 novos cenários de listagem/detalhe. Testes só guarni_test. Leitura/equipe e settings manual sem confirmação. Este incremento sem commit.

## Stack / mapa
Node24/Nest12/TS ESM NodeNext/TypeORM/PG17/Argon2id/JWT/Vitest/Supertest. Versões: package.json/lock.
API=/v1; Swagger=/docs; saúde=/v1/health. Controllers=HTTP, services=negócio, DTO=entrada, entity=banco. Imports .js; código inglês, mensagens PT-BR em constants; ValidationPipe+Swagger.
Organização em qualquer arquivo: responsabilidades nomeadas; lógica do domínio privada/local, utils somente para lógica independente reutilizável. Regra geral em AGENTS.md.
Toda assinatura: máximo 3 parâmetros; acima disso, objeto explícito (params: Tipo), desestruturação no corpo. updateRole/persistRoleUpdate usam objetos; AuthService obtém repository pelo DataSource.
Revisão C1–C4: login/me/senha, setup, JWT, usuários e CLIs separados em responsabilidades privadas/locais; testes usam cenários nomeados, sem rest posicional para contornar limite. Contratos/transações preservados; funcionalidades 501 não alteradas. Checks acima reexecutados após refatoração; C4 commit d3ba95e, refatoração posterior ainda sem commit.
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
Usuário autorizou automatizar repetições dos conceitos praticados; listagem/detalhe implementados nesse modo. Conceitos novos (dia/fuso, scheduler, fotos/storage, agregações) continuam guiados.
Praticados: Nest/DI/DTO/Swagger/Joi; TypeORM/migrations/constraints/23505; Argon2/JWT/testes; transações/advisory/timingSafeEqual/revogação/update condicionado; membership/decorator.
Praticados no C4: lock pessimista/último OWNER, expectedVersion, snapshots e primeiro BusinessEvent atômico. Novos/aprofundar: C5 Luxon/Clock/dia; C6 settings; C7 eventos nos demais fluxos; C8 execução/fechamento; C9 scheduler; C10 multipart/sharp/S3; C11 índice parcial; C12 agregações.

## Detalhes sob demanda
docs/MVP_SPEC.md: única especificação detalhada; buscar seção por assunto, não ler inteiro. Contratos futuros, não prova de implementação. Código atual confirma o estado.
LEARNING_NEXT_STEPS.md=guia humano; não necessário para retomar. AGENTS.override.md=local ignorado; AGENTS.md=versionado. Não implementar outros checkpoints por haver scaffold.
