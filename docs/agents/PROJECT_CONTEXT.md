# Contexto rápido — 2026-10-05

## Estado / próxima ação
Guarni: checklist operacional de restaurantes. Repositório guarni-api; guarni-web separado e congelado até a etapa futura de integração.
FEITO: C1 bootstrap atômico; C2 troca/reset+revogação; C3 autorização por unidade+GET settings; C4 alteração de role com hierarquia, lock, último OWNER, expectedVersion e BusinessEvent atômico; GET memberships/listagem e detalhe com filtros e isolamento.
C5 CONCLUÍDO: núcleo manual no commit d60f587 (ClockService, Luxon, timezone IANA, corte operacional e limites 02:59/03:00) e automação no commit 9167d8f (persistência idempotente de operational_day, recuperação da corrida por UNIQUE(unitId,date), GET /context, permissões, Swagger e E2E). Ajuste final atual: setup rejeita timezone que não seja IANA válido.
PRÓXIMO: C6 PATCH settings/expectedVersion é repetição do padrão já praticado e pode ser automatizado; depois avançar para o primeiro núcleo realmente novo de execução concorrente.
PENDENTE de produto: PATCH settings, cadastro/reativação/desativação/reset pela API de equipe, tarefas/execuções/fechamento/evidências/correções/dashboard/histórico/auditoria. Contratos/entities preparados não significam regra implementada; preservar stubs 501 fora do fluxo atual.

## Stack / mapa
Node24/Nest12/TS ESM NodeNext/TypeORM/PG17/Argon2id/JWT/Vitest/Supertest/Luxon. Versões: package.json/lock.
API=/v1; Swagger=/docs; saúde=/v1/health. Controllers=HTTP, services=negócio, DTO=entrada/saída, entity=banco. Imports .js; código inglês, mensagens PT-BR em constants; ValidationPipe+Swagger.
Organização em qualquer arquivo: responsabilidades nomeadas; lógica do domínio privada/local, utils somente para lógica independente reutilizável. Regra geral em AGENTS.md.
Toda assinatura: máximo 3 parâmetros; acima disso, objeto explícito (params: Tipo), desestruturação no corpo.
Auth: src/auth/; setup: src/setup/; autorização: src/memberships/guards/ e decorators/; dia operacional: src/clock/ + src/operational-days/; contexto/settings: src/units/; CLIs: src/admin/; migrations: src/database/.

## Invariantes
- synchronize=false; migrations com literais históricos/constraints nomeadas; registrar entity em database/data-source.ts. Mesmo manager nas transações; rollback real; concorrência exige lock/update condicionado ou constraint com recuperação explícita.
- Username único/normalizado; senha somente hash. Setup usa X-Setup-Token/timingSafeEqual/advisory lock; unidade existente→409.
- Login exige vínculo ativo. JWT contém sub/credentialVersion; guard consulta usuário/versão. Troca exige senha atual, atualiza hash+versão condicionados e assina token na transação. Reset também revoga.
- Guards JWT→membership(userId=request.user.sub,unitId=rota,isActive=true); validar UUID antes de query; contexto via @CurrentMembership. Validar mesma unidade e permissão por operação.
- Hierarquia: OWNER administra todos; MANAGER só EMPLOYEE; sempre ≥1 OWNER ativo. Auditoria global da unidade exclusiva de OWNER. Preservar histórico, sem hard-delete público.
- Dia operacional: horário é interpretado no timezone IANA da unidade. Com corte 03:00, antes de 03:00 pertence à data operacional anterior; exatamente 03:00 inicia a nova data. operational_days persiste opensAt/closesAt para não reescrever histórico quando settings mudarem.
- .env/Joi; nunca expor segredos/hashes. Docker volume persistente; Stop não apaga. Railway planejado, não confirmado. Testes E2E somente em guarni_test.

## Comandos
Dev: npm run start:dev
Checks: npm run build / npm run lint / npm test / npm run test:e2e
Format: npx prettier --write <arquivos>
Migrations: npm run migration:show / npm run migration:run (disparam build)
Admin: npm run admin:list-users / npm run owner:reset-password -- <username>
Reset é interativo e imprime senha: não logar. Build Nest exclui tipos dos testes; conferir separadamente no marco relevante. Sem reinstalação automática.

## Progresso de estudo
Regra atual: aprender o primeiro exemplar real de cada conceito novo; após o usuário confirmar entendimento/prática, automatizar todas as repetições equivalentes. Não transformar checkpoint inteiro em exercício manual.
Praticados: Nest/DI/DTO/Swagger/Joi; TypeORM/migrations/constraints/23505; Argon2/JWT/testes; transações/advisory/timingSafeEqual/revogação/update condicionado; membership/decorator; lock pessimista/último OWNER; expectedVersion; snapshots/BusinessEvent atômico; ClockService/Luxon/timezone/dia operacional.
Podem ser automatizados quando equivalentes: CRUD/DTO/Swagger/filtros/testes repetitivos, transações, expectedVersion, BusinessEvents, autorização por membership e locks já praticados.
Ainda novos/aprofundar: primeira execução concorrente completa (execução x fechamento), scheduler/reconciliação, multipart/sharp/S3, índice parcial e primeira agregação QueryBuilder/SQL.

## Validação
Antes de d60f587: 46 unitários + 68 E2E, build/lint e tipos src+test OK. No núcleo manual de C5, o usuário confirmou npm test passando.
Após a automação do C5 e o ajuste dos cleanups de OperationalDay, o usuário confirmou que o fluxo voltou a passar e enviou o commit 9167d8f. Neste micro-ajuste de timezone, reexecutar build, lint, unitários e E2E antes do commit.

## Detalhes sob demanda
docs/MVP_SPEC.md: única especificação detalhada; buscar seção por assunto, não ler inteiro. Contratos futuros não provam implementação.
LEARNING_NEXT_STEPS.md=guia humano. AGENTS.override.md=local ignorado; AGENTS.md=versionado.
