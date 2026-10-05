# Guarni — progresso e próximos passos

Atualizado em 05/10/2026. Este guia acompanha o aprendizado.
A IA retoma pelo PROJECT_CONTEXT.md; regras de colaboração ficam nos AGENTS.

## Estratégia atual

Queremos chegar ao MVP em produção mais rápido sem transformar o projeto em código
que você não entende. Para cada conceito realmente novo:

1. eu explico o problema e preparo o mínimo necessário;
2. você implementa o primeiro exemplar real;
3. revisamos e testamos;
4. quando você confirma que entendeu, o conceito passa a ser repetição;
5. endpoints, DTOs, testes e usos equivalentes podem ser automatizados.

Não vamos mais manter um checkpoint inteiro manual só porque uma parte dele é nova.
O frontend continua congelado; a integração guarni-web -> guarni-api será uma etapa
separada depois do backend MVP.

## O que já foi praticado

### 1. Setup seguro
POST /v1/setup/owner cria User, Unit e Membership OWNER na mesma transação.
Você praticou transação, rollback, advisory lock e concorrência de bootstrap.

### 2. Senha e revogação
credentialVersion invalida tokens antigos após troca/reset. Você praticou update
condicionado, transação e emissão do novo token.

### 3. Acesso por unidade
AccessTokenGuard + UnitMembershipGuard + @CurrentMembership centralizam identidade
e vínculo ativo da unidade.

### 4. Hierarquia, versão e eventos
PATCH de role pratica lock pessimista, proteção do último OWNER, expectedVersion,
snapshots e BusinessEvent na mesma transação. Listagem/detalhe de memberships foi
automatizada depois como repetição.

### 5. Dia operacional — concluído
No commit d60f587 você implementou ClockService, Luxon, timezone IANA e a regra
do corte operacional. Com fechamento 03:00, 02:59 ainda pertence ao dia anterior
e 03:00 inicia o novo dia. Você confirmou os testes do cálculo passando.

Depois disso, o restante foi automatizado no commit 9167d8f: operational_days
passou a ser persistido/reutilizado, a corrida de duas requests é recuperada pela
constraint UNIQUE(unitId,date), e GET /v1/units/:unitId/context expõe unidade,
membership, permissões, dia operacional e serverTime. O setup também valida que
o timezone informado é um identificador IANA válido.

## Próximos núcleos novos

| Tema | O que você precisa praticar | O que pode ser automatizado depois |
|---|---|---|
| Settings | Nenhum conceito novo relevante; expectedVersion já foi praticado | PATCH settings, conflito, evento e testes equivalentes |
| Equipe | Nenhum para cadastro/reset/reativação; padrões já praticados | User+Membership transacional, reset, reativação e testes |
| Execução concorrente | Primeiro fluxo real de execução sob lock, revalidando estado | takeover, DONE/NOT_DONE e variações equivalentes |
| Scheduler | Primeiro job idempotente + reconciliação após restart | fechamento em lote e rotinas derivadas |
| Fotos/storage | Um upload multipart completo até storage privado/metadata | leitura assinada, substituição, retenção e órfãs |
| Índice parcial | Entender/criar o primeiro UNIQUE parcial | demais índices comuns sem aula |
| Agregações | Uma agregação real com QueryBuilder/SQL | dashboard e histórico derivados |

BusinessEvents, DTOs, Swagger, autorização por membership, transações,
expectedVersion e locks equivalentes já podem ser automatizados quando não houver
um problema novo por trás.

## Marcos do produto

### Marco A — Backend MVP funcional
Completar equipe, settings, dia operacional, tarefas, execução, fechamento,
evidências, correções, dashboard/histórico e auditoria conforme MVP_SPEC.md.

### Marco B — Integração do frontend
Somente depois do backend: substituir mocks por HTTP preservando
view -> hook -> api/adaptador -> HTTP, usando IDs, versões, arquivos e erros reais.

## Validação

Antes de C5: 46 unitários + 68 E2E, build/lint e tipos src+test OK.
Após o núcleo manual de C5, você confirmou npm test passando. Depois da automação
e da correção dos cleanups de OperationalDay, o fluxo voltou a passar e o commit
9167d8f foi enviado. O micro-ajuste de validação IANA deve ser verificado com
build, lint, unitários e E2E antes do próximo commit.

Os E2E usam e limpam guarni_test; nunca apontar para dados reais.
