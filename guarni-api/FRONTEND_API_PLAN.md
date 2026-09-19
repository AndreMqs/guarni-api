# Plano de APIs para atender o guarni-web

Data da avaliação: 18/09/2026. Escopo: planejamento, sem implementação.

## 1. Base da avaliação e contexto recuperado

Este documento consolida o código local dos dois projetos, a documentação de produto e as mensagens do usuário recuperadas do histórico local do Codex referente ao `guarni-web`. Não pressupõe acesso a conversas externas que não estejam nesses registros.

Referências examinadas:

- Backend no commit `b431649` — `feat: add units and memberships schema`.
- Frontend no commit `ad26022` — `Corrigindo UX e adicionando reset de senha pelo gerente`.
- [Contexto anterior do backend](PROJECT_CONTEXT.md).
- [README do frontend](../guarni-web/README.md), [contexto de frontend](../guarni-web/docs/frontend-context.md) e [status das telas](../guarni-web/docs/frontend-implementation-status.md).
- Contratos e mocks em [auth.ts](../guarni-web/src/api/auth.ts), [tasks.ts](../guarni-web/src/api/tasks.ts), [management.ts](../guarni-web/src/api/management.ts) e [audit.ts](../guarni-web/src/api/audit.ts).
- Views de operação, gestão, auditoria e conta; hooks, stores, rotas e testes associados aos fluxos.
- Conversa local do frontend `01a0b640-fbc1-70b0-85df-963e66d2356b`, com os ajustes de produto mais recentes.

O frontend está funcional como demonstração em memória, com React, TypeScript, Vite, Mantine, Zustand e TanStack Query. A documentação inicial de “somente login e tarefas de hoje” ficou desatualizada em relação ao código. Mantine substituiu a antiga previsão de MUI. O backend continua no estágio de autenticação básica e schema de usuários/unidades/vínculos.

**Legenda:** “existente” significa confirmado no código; “decidido” significa registrado nas regras ou solicitações do usuário; “proposta” significa desenho técnico deste plano, a fechar ao implementar. Todas as novas rotas e estruturas abaixo são propostas, não APIs já disponíveis nem autorização para começar a implementação.

Não foram executados testes, migrations ou consultas ao banco nesta avaliação documental. O estado de aplicação das migrations e os resultados de testes mencionados nos contextos antigos não foram revalidados.

## 2. Decisões de produto que precisamos preservar

1. Login com username e senha, sem necessidade de e-mail. Username único globalmente, normalizado com trim e lowercase.
2. Papéis `OWNER`, `MANAGER` e `EMPLOYEE` pertencem à membership de uma unidade. Um usuário pode pertencer a várias unidades.
3. Todos os usuários ativos, inclusive dono e gerente, podem receber, assumir e executar tarefas. Gestão também acessa o fluxo operacional.
4. Tarefas manuais por data, gerais ou pessoais. Datas futuras são permitidas; não há recorrência automática no MVP.
5. Executar tarefa de outra pessoa exige justificativa da exceção. Responsável e executor precisam ser identificados separadamente.
6. “Não feita” sempre exige justificativa. Foto obrigatória impede concluir sem uma evidência válida; comentário de conclusão é opcional quando habilitado.
7. Hoje tem abas Minhas/Gerais/Todas, busca e filtro por status. Ordem: pendentes, não feitas, feitas; dentro do grupo, prazo mais cedo primeiro, sem horário por último.
8. Catálogo de gestão exige mês selecionado, começa no período Hoje e ordena datas da mais recente para a mais antiga.
9. Nova tarefa começa na data operacional atual e com horário de fechamento como limite padrão. Cópia preserva o horário da origem, permite ajustes e cria tarefa independente pendente.
10. Funcionário não precisa de tela geral de histórico: consulta eventos dentro da tarefa. Há rotas e mocks antigos de histórico diário ainda no código; isso não torna necessário um endpoint separado para essa navegação antiga.
11. Funcionário corrige somente sua própria execução enquanto o dia estiver aberto. Dono/gerente corrigem execuções da própria unidade, inclusive após fechamento. Toda correção exige motivo e acrescenta evento.
12. Histórico não pode ser editado, excluído ou ocultado diretamente, nem pelo dono.
13. Uma foto vigente por execução. Substituição somente dentro de correção autorizada; cada arquivo, inclusive o substituído, expira 60 dias após seu próprio upload. Eventos e metadados permanecem.
14. Câmera e galeria alimentam o mesmo fluxo de upload. Não há vídeo, várias fotos vigentes ou operação offline no MVP.
15. Desativação/reativação passa por confirmação; desativação contempla revisão e reatribuição das tarefas. Não confundir desativar acesso na unidade com excluir a identidade global.
16. Cada unidade mantém ao menos um dono ativo. Troca de unidade aparece quando houver mais de uma unidade acessível.
17. Usuário altera a própria senha informando a atual. Dono/gerente podem definir nova senha temporária sem visualizar a anterior; recuperação por e-mail foi dispensada pelo usuário.
18. Redefinir senha não altera papel nem reativa acesso. A troca voluntária existe; obrigar troca no primeiro login não foi solicitado.
19. Cards de auditoria destacam a tarefa/objeto afetado, com a ação como subtítulo, e são ordenados pelos eventos mais recentes.
20. Fuso aparece como somente leitura na tela atual. Alteração de fuso pela UI não faz parte da primeira integração.

## 3. O que já existe no guarni-api

| Recurso | Estado confirmado | Trabalho necessário |
| --- | --- | --- |
| `GET /v1/health` | Saúde da aplicação e PostgreSQL | Preservar |
| `POST /v1/auth/login` | `200`, recebe username/senha e devolve `accessToken` | Integrar credenciais reais e completar contexto da sessão |
| `GET /v1/auth/me` | Bearer JWT; devolve somente `id`, `username` | Buscar usuário real, memberships, unidades e permissões |
| `POST /v1/users/register` | Cadastro público temporário | Substituir no fluxo normal pelo cadastro autorizado em unidade |
| `GET /v1/users/:username` | Consulta pública temporária | Proteger/restringir; não usar como listagem de equipe |
| `DELETE /v1/users/:userId` | Exclusão física pública temporária | Retirar do fluxo público antes da integração de produção; não usar para desativar |
| `users` | UUID, nome, username, hash, timestamps | Reutilizar; evoluir invalidação de credenciais |
| `units` | UUID, nome e timestamps | Acrescentar configurações operacionais |
| `memberships` | UUID, unidade, usuário, papel; vínculo único por par | Acrescentar estado ativo e regras de autorização |
| Infraestrutura | Nest modular, TypeORM, PostgreSQL, migrations, Swagger, CORS, ValidationPipe, Argon2id | Estender padrões existentes |

O guard atual verifica assinatura/expiração, mas não existência do usuário, estado do vínculo ou revogação. Não há APIs de setup, tarefas, execução, fotos, histórico, equipe ou configurações. Não há refresh token nem logout no servidor.

Manter `/v1`, mensagens públicas em português, identificadores em inglês, DTOs separados das entities, imports locais `.js`, `synchronize: false` e constraints nomeadas. Atualizar a lista explícita de entities no data source a cada domínio novo.

## 4. Convenções propostas para os contratos

- Escopo de negócio em `/v1/units/:unitId/...`. Consultar membership ativa em cada operação. IDs enviados pelo cliente nunca são prova de autorização.
- UUIDs reais para unidade, usuário, membership, tarefa, execução, evento e foto. Atribuição usa `assigneeMembershipId`; respostas incluem também `userId` para adaptar as telas existentes.
- Papéis técnicos `OWNER | MANAGER | EMPLOYEE`; o adaptador do frontend converte para `owner | management | employee` e labels traduzidas. Nunca inferir papel pelo username.
- Datas de negócio `YYYY-MM-DD`, mês `YYYY-MM`, horário local `HH:mm`, instantes ISO 8601 com offset/UTC. Servidor informa fuso, data operacional e fechamento; navegador não decide autorização pelo relógio local.
- Labels, iniciais, cores, textos relativos e formatação ficam preferencialmente no frontend. A API entrega dados estruturados e booleanos de permissão, sem depender de textos como “Foto obrigatória”.
- Listas potencialmente grandes usam `limit` e `cursor`, com limite máximo a definir. Resposta proposta: `{ items, page: { nextCursor, hasMore }, summary? }`. Agregados são calculados sobre o conjunto inteiro correspondente, nunca apenas a página carregada.
- Ordenação estável inclui ID como desempate. Validar filtros, datas reais, enum, intervalo e limite; rejeitar campos extras como já ocorre no backend.
- Mutações sobre tarefas retornam projeção atual, `version` e IDs dos registros gerados. Usar `expectedVersion` para detectar leitura desatualizada.
- `Idempotency-Key` nas operações sujeitas a retry: criação/cópia, execução, correção e desativação com reatribuição. Vincular chave a ator/unidade/operação e hash do payload; reenvio idêntico devolve resultado anterior, payload diferente gera conflito. Prazo de retenção da chave a definir.
- `200` para leituras/alterações com resposta, `201` para criação, `204` para troca de senha sem corpo. Erros propostos: `400` validação, `401` sessão inválida, `403` operação proibida, `404` recurso inexistente/inacessível, `409` conflito de estado/versão, `413` upload grande, `415` mídia incompatível, `429` excesso de tentativas.
- Envelope proposto de erro: `{ statusCode, code, message, fieldErrors?, requestId? }`. Exemplos de códigos: `TASK_VERSION_CONFLICT`, `OPERATIONAL_DAY_CLOSED`, `LAST_ACTIVE_OWNER`, `EVIDENCE_REQUIRED`, `EVIDENCE_EXPIRED`. Eles ainda não existem no contrato atual.

## 5. Autenticação, setup e conta

| Método e rota proposta | Entrada | Saída / finalidade |
| --- | --- | --- |
| `POST /v1/setup/owner` | `{ name, username, password, unitName }` | `201` com usuário público, unidade e membership OWNER |
| `POST /v1/auth/login` — existente | `{ username, password }` | Preservar `accessToken`; opcionalmente informar `expiresIn` |
| `GET /v1/auth/me` — ampliar | Bearer token | `{ user: { id, name, username }, memberships: [{ id, role, unit: { id, name } }] }` com vínculos acessíveis |
| `PUT /v1/auth/password` | `{ currentPassword, newPassword }` | `204`; validar atual, alterar hash e invalidar credenciais anteriores conforme política |

### Bootstrap

- Criar usuário, unidade e vínculo OWNER na mesma transação, com rollback integral.
- Impedir segundo bootstrap e corrida entre primeiras requisições por mecanismo de banco/lock; não basta verificar contagem antes de inserir.
- O bloqueio do setup deve persistir após concluído, sem reabrir automaticamente se alguém remover/desativar proprietários.
- Definir se bootstrap é único por instalação e como o primeiro acesso é autorizado. O contexto anterior prevê primeiro OWNER, não signup público de restaurantes.
- Não há tela de setup no frontend atual. É uma dependência de provisionamento para viabilizar os demais fluxos.

### Senhas e sessão

- Reutilizar nome de 1–120 caracteres, username de 1–60 e padrão `^[a-z0-9._-]+$`, senha de 12–128. Não aplicar trim na senha.
- Senhas, hashes e tokens nunca entram em respostas de usuário, logs ou snapshots de auditoria.
- Troca própria exige senha atual correta e nova diferente; confirmação duplicada é validação de formulário e não precisa ir à API.
- Reset administrativo opera sobre a identidade global: afeta login em todas as unidades. A hierarquia de quem pode resetar quem precisa ser definida antes dessa entrega.
- Proposta mínima sem refresh: token em memória, `401` encerra sessão e limpa cache; expiração exige novo login. O TTL configurável atual não deve ser fixado no frontend.
- Para senha antiga e tokens anteriores perderem validade após reset, propor `credentialVersion` no usuário e no JWT, validada contra o banco. Alternativamente, adotar sessões persistidas; escolher uma estratégia na implementação.
- Mudança/desativação de membership tem efeito imediato nas operações daquela unidade, mesmo com JWT ainda válido.
- Logout local já existe no frontend. `POST /auth/logout`, refresh com rotação e sessões por dispositivo são evolução separada caso seja requerida revogação individual/persistência de sessão; não fingir que limpar token revoga JWT no servidor.
- Prever limite de tentativas para login e alteração/reset de senha. Não criar fluxo de e-mail, token de recuperação ou leitura de senha atual.

## 6. Unidades, contexto operacional e permissões

| Método e rota proposta | Entrada | Saída / consumidor |
| --- | --- | --- |
| `GET /v1/units` | Sessão | Unidades acessíveis, papel e, para gestão, resumos Hoje/Ontem necessários ao seletor |
| `GET /v1/units/:unitId/context` | Unidade | Identidade da unidade, membership atual, permissões e contexto operacional |
| `GET /v1/units/:unitId/settings` | Gestão | `{ name, timezone, closingTime, version }` |
| `PATCH /v1/units/:unitId/settings` | `{ name?, closingTime?, expectedVersion }` | Configuração atualizada e momento de vigência |

Contexto proposto: `{ unit, membership, permissions, operationalDay: { date, opensAt, closesAt, isClosed }, serverTime }`. O seletor pode reutilizar os dados do `/auth/me`; a rota `/units` complementa os resumos de gestão sem duplicar fontes de verdade.

Trocar unidade é seleção de contexto no frontend, sem necessidade de endpoint de mutação. Todas as queries passam a usar o novo ID. Não criar CRUD completo de unidades sem uma tela/requisito correspondente; falta definir como provisionar unidades adicionais além do bootstrap.

| Capacidade | EMPLOYEE | MANAGER | OWNER |
| --- | --- | --- | --- |
| Consultar tarefas permitidas da unidade e eventos da tarefa | Sim | Sim | Sim |
| Executar geral/própria; assumir alheia com justificativa | Sim | Sim | Sim |
| Corrigir própria execução em dia aberto | Sim | Sim | Sim |
| Corrigir execução alheia ou dia fechado | Não | Sim, na unidade | Sim, na unidade |
| Criar/copiar/editar tarefa pendente | Não | Sim | Sim |
| Dashboard, histórico de gestão, equipe e configurações | Não | Sim | Sim |
| Redefinir senha de outro usuário | Não | Sim, alvos a definir | Sim, alvos a definir |
| Promover/desativar outro gestor ou dono | Não | Pendente | Pendente; preservar último dono |
| Auditoria global da unidade / lista de mídias | Não | Confirmar escopo | Sim |
| Editar/excluir/ocultar eventos diretamente | Não | Não | Não |

O menu atual enfatiza auditoria de negócio no dono, enquanto as referências incluem auditoria para dono/gerente. Fechar a permissão de leitura global do gerente sem restringir sua correção autorizada de tarefas. Também definir o alcance histórico do funcionário dentro de uma tarefa fora do dia atual.

## 7. Gestão de equipe

Base das rotas: `/v1/units/:unitId`.

| Método e caminho | Entrada | Resposta / função atual |
| --- | --- | --- |
| `GET /memberships` | `search`, `isActive?`, `role?`, paginação | Equipe com usuário, role, isActive; `getUsers` |
| `GET /memberships?isActive=true` | `search`, paginação | Responsáveis elegíveis de todos os papéis; `getAssignableUsers` |
| `GET /memberships/:membershipId` | ID | Detalhe e ações permitidas; `getUser` |
| `POST /users` | `{ name, username, password, role }` | Cria usuário + vínculo ativo transacionalmente; `createUser` |
| `PATCH /memberships/:membershipId` | `{ role, expectedVersion }` | Alteração de papel auditada; parte de `updateUser` |
| `GET /memberships/:membershipId/reassignment-summary` | ID | Contagem de pendentes atuais, futuras e total para revisão |
| `POST /memberships/:membershipId/deactivate` | `{ replacementMembershipId?, expectedVersion }` | Desativa e reatribui atomicamente; retorna vínculo e quantidade movida |
| `POST /memberships/:membershipId/reactivate` | `{ expectedVersion }` | Reativa vínculo após confirmação |
| `PUT /memberships/:membershipId/password` | `{ newPassword }` | Reset administrativo; `resetUserPassword`; `204` |

Regras a implementar:

- `isActive` representa acesso na unidade. Desativar um vínculo não apaga usuário nem desativa vínculos de outras unidades.
- Cadastro não pode se apropriar silenciosamente de username global já existente: retornar `409`. Vincular uma identidade existente a outra unidade exige política própria; não é uma tela pronta hoje.
- Preservar ao menos um OWNER ativo inclusive sob requisições concorrentes. Rebaixamento de papel também precisa dessa verificação.
- Destinatário da reatribuição deve ser ativo, diferente da origem e pertencer à mesma unidade; qualquer papel é elegível.
- Recalcular tarefas dentro da transação de desativação: resumo exibido pode ter ficado desatualizado. Não deixar tarefa pendente recém-criada atribuída a alguém que acabou de ser desativado.
- Transferir somente tarefas pessoais pendentes elegíveis, incluindo futuras. Resultados concluídos e autoria histórica não mudam. Tratamento de pendentes passadas depende da regra de fechamento.
- Se houver tarefas elegíveis, exigir substituto ou outra política explicitamente aprovada. Se não houver, permitir desativar sem substituto.
- Proposta para evitar contagem duplicada: `pendingTasks` = pendentes até o dia atual ainda elegíveis; `futurePersonalTasks` = pendentes futuras; `totalTasks` = soma. O mock atual conta futuras também em `pendingTasks`; alinhar os rótulos/contrato na integração.
- Não expor `isActive` no PATCH genérico de papel, evitando contornar o fluxo transacional de desativação.
- `reassignUserTasks` e `updateUser` hoje são chamadas distintas. Para o fluxo de desativação, substituir por uma operação atômica. Reatribuição em lote independente só exige rota própria se houver uso separado confirmado.

## 8. Cadastro, consulta e cópia de tarefas

Base: `/v1/units/:unitId`.

| Método e caminho | Entrada | Saída / função atual |
| --- | --- | --- |
| `GET /tasks` | `month` obrigatório, `period=all|today|future|past`, `search`, paginação | Catálogo mensal; `getTaskCatalog` |
| `GET /tasks/by-date` | `date`, paginação | Tarefas da data selecionada; `getTasksByDate` |
| `GET /tasks/:taskId` | ID | Detalhe consistente para operação, gestão e histórico |
| `POST /tasks` | Definição abaixo | `201`, tarefa pendente; `createTask` |
| `PATCH /tasks/:taskId` | Campos editáveis + `expectedVersion` | Atualiza somente tarefa pendente elegível; `updateTask` |
| `POST /tasks/:taskId/copies` | Nova data e campos ajustados | `201`, nova tarefa; `copyTask` |

Definição proposta: `{ title, description?, assignmentType: "general" | "personal", assigneeMembershipId?, executionDate, dueTime?, isEvidenceRequired, isCommentEnabled }`.

- Título obrigatório com trim; estabelecer limites de título, descrição, comentários e motivos antes de criar DTOs. Não presumir valores numéricos que o produto não definiu.
- Geral não aceita responsável; pessoal exige membership ativa na mesma unidade. Nomes do responsável vêm do banco, nunca de `assigneeName` confiado ao cliente.
- Data padrão operacional atual; horário omitido na criação usa fechamento vigente. Definir se `null` permite explicitamente “sem horário”, pois há tarefas assim no mock, mas a tela de criação exige horário.
- `dueTime` precisa gerar `dueAt` inequívoco, inclusive após meia-noite. A ordenação operacional usa esse instante.
- Confirmar política para criação em datas passadas; proposta inicial: impedir criação em dia fechado, mantendo cópia de tarefa antiga para data aberta/futura.
- Edição da definição não substitui correção de execução. A UI atual edita horário e exigência de foto; os tipos permitem outros campos. Implementar somente campos aprovados, sempre com evento e sem alterar tarefas independentes.
- Cópia carrega origem autorizada, preserva título/descrição/atribuição/regra de foto, horário e configuração de comentário, aplicando ajustes do formulário. Novo ID e versão inicial; sem execução, fotos, justificativas ou eventos antigos.
- Não criar tabelas de templates/recorrência. `sourceTaskId` é opcional para rastrear origem, sem vínculo de atualização entre as cópias.
- Endpoint específico de cópia é escolha deste plano; reutilizar POST de criação com origem validada também atende o produto. Escolher uma abordagem, não implementar ambas sem necessidade.

## 9. Hoje, execução e correções

| Método e caminho na unidade | Entrada | Saída / função atual |
| --- | --- | --- |
| `GET /tasks/today` | `scope=mine|general|all`, `status=all|pending|notDone|done`, `search`, paginação | Data operacional, resumo e tarefas; `getTodayTasks` |
| `GET /tasks/:taskId/events` | Categoria opcional e paginação | Timeline imutável da tarefa |
| `POST /tasks/:taskId/takeover` | `{ reason, expectedVersion }` | Responsável atualizado e evento; `takeOverTask` |
| `POST /tasks/:taskId/execution` | `{ result: "done" | "notDone", comment?, reason?, evidenceId?, expectedVersion }` | Execução atual e tarefa; `completeTask` / `markTaskNotDone` |
| `POST /tasks/:taskId/corrections` | `{ result?, comment?, reason?, correctionReason, evidenceId?, expectedVersion }` | Correção, evento e projeção atual; correção operacional e de gestão |
| `GET /tasks/:taskId/corrections/:correctionId` | IDs | Antes/depois, autores, horários e motivo para comprovante |

Detalhe da tarefa deve incluir: definição, responsável, estado, `version`, `dueAt`, `isOverdue`, resumo da execução (`id`, resultado, executor, horário, comentário, justificativa, evidência), contexto do dia e `permissions` (`canExecute`, `canTakeOver`, `canCorrect`, `canEdit`). Eventos podem vir numa primeira página ou em consulta separada.

### Regras de execução

- “Minhas” deriva do responsável comparado à membership atual; “Gerais”, da ausência de atribuição. “Todas” continua restrita à unidade autorizada.
- Preservar resumo de Hoje sobre todas as tarefas autorizadas do dia, independentemente de busca/aba/status, como o mock atual. Informar escopo do resumo para não confundir com a página filtrada.
- Assumir tarefa alheia exige motivo não vazio e estado pendente/dia aberto. O mock permite alterar tarefa já concluída em alguns caminhos; isso não é regra de negócio aprovada.
- Tarefa geral pode ser executada sem alterar previamente a atribuição; registrar executor. Para tarefa pessoal de outro usuário, exigir takeover autorizado, preservando o responsável anterior no evento.
- Executor e autor do evento vêm da sessão. Registrar executor também quando resultado for `notDone`.
- `notDone` exige `reason`; `done` exige foto válida quando configurado. Comentário habilitado não torna justificativa de exceção/correção opcional.
- Uma execução atual por tarefa. Conclusões simultâneas, takeover concorrente e disputa com fechamento precisam de lock/versão e transação. Nunca aplicar “última escrita vence”.
- Encerrada a execução, nova mudança passa por correção, não por outro POST de execução.

### Correções

- Funcionário: conferir autoria da execução, não somente atribuição atual, e dia aberto. Gestão: conferir papel e unidade, inclusive em dias fechados.
- Separar `reason` (motivo do resultado não feito) de `correctionReason` (por que corrigiu). O formulário de gestão já mostra ambos.
- Gravar evento com antes/depois, atualizar resultado atual e trocar foto na mesma transação de banco. Preservar autor original; autor da correção é outro dado.
- Corrigir apenas comentário/motivo/foto não exige inventar mudança de resultado. Substituir foto também usa esse endpoint e as mesmas permissões.
- Sem retorno a pendente/reabertura, a menos que nova regra de produto seja aprovada.
- Quando uma foto expirou, preservar sua referência histórica não significa exigir reupload para qualquer correção textual. Definir especificamente a exigência ao mudar `notDone` para `done` ou substituir evidência.
- Comprovante deve ser consultado pelo ID retornado pela mutation. Não implementar “última correção global”, que pode mostrar a correção de outro usuário.

## 10. Dia operacional, fechamento e métricas

Esta é uma decisão pendente importante. Os mocks mostram `autoClosed` e fechamento às 03:00, mas o contexto registra explicitamente que o comportamento definitivo das pendências ainda precisa ser fechado no backend.

Proposta para discussão:

- Unidade possui fuso IANA e horário de corte. Dia D começa no corte de D e termina no corte de D+1. Antes do corte, “hoje operacional” ainda é D-1.
- Com corte 03:00, a tarefa de D às 01:30 vence em D+1. Horário igual a 03:00, usado como padrão, representa o fechamento D+1. Definir essa convenção para não criar uma tarefa vencida no início do dia.
- `overdue` é atributo derivado de pendente e `dueAt < serverTime`; passar do prazo não impede executar enquanto o dia segue aberto, se essa regra for confirmada.
- No fechamento, pendências viram resultado técnico `notDone` com origem `system`/`autoClosed`, motivo de sistema e evento de fechamento. A API preserva a diferença entre não feita declarada e encerrada automaticamente, necessária ao filtro histórico.
- Proposta de DTO: estado geral `pending|done|notDone` mais `resolutionType=manual|autoClosed`. O adaptador produz `autoClosed` para as telas históricas, sem perder a informação.
- Job de fechamento idempotente por unidade/data. Se a API dormir ou reiniciar, reconciliar dias vencidos. As mutações validam o corte real mesmo se o job ainda não rodou.
- Fechamento e execução simultânea usam a mesma regra transacional. Definir que o servidor aceita o registro somente se ainda aberto ao validar sob lock.
- Configuração de fechamento alterada passa a valer em dia posterior definido; não reescrever datas, prazos e eventos históricos. Armazenar limites efetivos do dia.
- Correção de gestão altera agregados atuais do histórico, mas preserva evento original de encerramento. Se quisermos comparação “no fechamento versus após correções”, isso exige DTO adicional e não está nas telas atuais.

Métricas propostas: `pending` inclui todas as pendentes; `overdue` é subconjunto de `pending`; `total = done + notDone + pending`; `completionRate = round(done / total * 100)`, retornando 0 com total zero. Nas telas que separam “ainda pendente” de “precisa de atenção”, usar `pending - overdue` para evitar contagem dupla. Os números estáticos dos mocks não são fórmulas confiáveis.

## 11. Dashboard e histórico da gestão

| Método e caminho na unidade | Entrada | Saída / consumidor |
| --- | --- | --- |
| `GET /dashboard` | Contexto da unidade | Hoje/Ontem, totais, taxa, fechamento, atualização; `getManagementDashboard` |
| `GET /days/current/summary` | Nenhuma | Resumo, tempo restante, tarefa de atenção opcional e lista limitada de pendências; `getCurrentDaySummary` |
| `GET /history/days` | `month`, paginação | Agregado mensal e dias com totais; `getManagementHistory` |
| `GET /history/days/:date` | `statuses`, `assigneeMembershipId?`, paginação | Resumo do dia, fechamento, tarefas e responsáveis disponíveis; `getHistoryDay` |

- Detalhes de “Precisa de atenção”, “Ainda pendente” e tarefas do histórico reutilizam `/tasks/:taskId` e `/events`; não manter um cadastro de IDs diferente para cada tela.
- `attentionTask` pode ser `null`. Listas vazias e dias sem tarefas têm resposta válida, sem fabricar tarefa de atenção.
- Selecionar um dia precisa realmente enviar `date`. O mock de `getHistoryDay` recebe somente filtros e sempre mostra um dia fixo; o frontend precisará guardar a data escolhida.
- Filtro histórico distingue feita, não feita manual e fechamento automático. Seleções de responsável devem preservar usuários inativos que tenham registros no período.
- Agregado mensal soma quantidades e calcula taxa sobre o total; não faz média simples das porcentagens diárias.
- Resumo diário representa o dia inteiro, enquanto filtros limitam os itens; nomear isso no DTO/documentação.
- Servidor retorna `generatedAt` e fechamento como instantes. Frontend formata “atualizado agora” e “faltam 2h”.

## 12. Auditoria de negócio

| Método e caminho na unidade | Entrada | Saída |
| --- | --- | --- |
| `GET /audit/events` | `category=all|tasks|users|media`, `startDate?`, `endDate?`, paginação | Eventos mais recentes primeiro; `getAuditEvents` |
| `GET /audit/events/:eventId` | ID | Evento, objeto afetado, autor, mudanças, motivos e referências de evidência; `getAuditEvent` |

Modelo público proposto: `{ id, category, eventType, occurredAt, actor, subject: { type, id, title }, taskId?, executionId?, correctionId?, before?, after?, reason?, evidence? }`.

- `subject.title` preenche o título do card. A ação, como “Correção registrada pela gestão”, fica no subtítulo. Eventos de usuário exibem usuário afetado, sem inventar tarefa.
- Ordenar por `occurredAt DESC, id DESC`; datas do filtro usam o fuso da unidade e intervalo final inclusivo convertido corretamente para consulta.
- Categorias devem ser consistentes; o mock classifica reatribuição como `users`. Definir taxonomia antes de fechar testes para que filtros preservem a expectativa.
- Registrar criação/edição/cópia/atribuição/execução/correção, alterações de vínculo, redefinição administrativa de senha, configurações, substituição e expiração de mídia.
- Gravar auditoria de negócio junto com a mutação que a gerou. Não criar endpoint genérico para o frontend inserir eventos arbitrários.
- Não oferecer PUT/PATCH/DELETE de eventos. Toda correção modifica projeção atual e acrescenta evento.
- Eventos de sistema usam ator de sistema explícito, não usuário fictício. Nome/papel históricos devem ser preservados em snapshots mínimos.
- Sem segredos, hash de senha, binário ou URL assinada em before/after.

## 13. Upload, leitura e retenção de fotos

| Método e caminho na unidade | Entrada | Saída |
| --- | --- | --- |
| `POST /tasks/:taskId/evidence-uploads` | `multipart/form-data` com uma foto | `201`, `{ evidenceId, uploadedAt, expiresAt, status }` |
| `GET /evidence/:evidenceId` | ID | Metadados e disponibilidade, mesmo após expiração |
| `GET /evidence/:evidenceId/content` | ID | Conteúdo autorizado ou redirecionamento para URL assinada curta |
| `GET /media` | `filter=all|active|expiring`, paginação | Arquivos consultáveis e expiração; `getAuditMedia` |

Proposta inicial: upload pela API, com arquivo em storage privado e metadados no PostgreSQL. Upload direto por URL assinada é alternativa técnica se necessária; não implementar ambos antecipadamente.

Fluxo: selecionar/capturar foto → enviar arquivo → receber `evidenceId` → executar/corrigir referenciando o ID → confirmar sucesso apenas após persistência da operação. Nome do arquivo não prova que houve upload.

- Validar bytes/tipo real da imagem, tamanho, quantidade, dimensões e permissões; definir limites e formatos suportados, inclusive tratamento de HEIC de celulares. Compressão/redimensionamento planejados, parâmetros pendentes.
- Upload não altera sozinho a foto vigente. Vincular somente evidência válida, autorizada, da tarefa/unidade correta e ainda não consumida por outra operação.
- Referência temporária deve expirar/ser limpa se conclusão falhar ou usuário abandonar. Definir período de limpeza e compensação entre storage e banco, pois não há transação única entre ambos.
- Uma foto vigente por execução, com unicidade no banco. Substituição preserva metadados e arquivo anterior até sua expiração original.
- Arquivo expira após 60 dias do próprio upload; substituição não renova a retenção do anterior. Retenção não se aplica a tarefas/eventos.
- Disponibilidade (`available`, `expired`, eventualmente `pending`) é independente de ser a foto vigente. Uma foto vigente também pode estar expirada.
- Acesso sempre valida unidade e permissão de consultar tarefa/evento. Bucket e URLs permanentes não ficam públicos. Não expor credenciais de storage ao navegador.
- Após expiração, metadados respondem normalmente com estado expirado; leitura de conteúdo pode responder `410` com `EVIDENCE_EXPIRED`. Falha temporária de storage não deve ser apresentada como expiração.
- Job remove binários vencidos de forma idempotente e mantém metadados/eventos. Bloquear leitura vencida mesmo antes da limpeza física.
- Para compatibilidade com a tela atual: `active` significa disponível por mais de 7 dias; `expiring`, disponível com até 7 dias restantes; `all`, união dos disponíveis. Evidências expiradas seguem consultáveis pelo histórico. Documentar que “active” é filtro de prazo, não “foto vigente”.
- Nenhum endpoint de exclusão manual isolada ou substituição fora da correção.

## 14. Modelo de persistência proposto

| Tabela / evolução | Conteúdo e integridade |
| --- | --- |
| `users` | Identidade existente; possível `credentialVersion` para invalidação após senha |
| `units` | Nome existente + `timezone`, `closingTime`, versão/configuração de vigência |
| `memberships` | Papel existente + `isActive`, datas de desativação/reativação e versão; manter UNIQUE unidade/usuário |
| `operational_days` | Unidade, data, abre/fecha efetivos, encerramento; UNIQUE unidade/data; proposta para fechamento consistente |
| `tasks` | Unidade, data operacional, título, descrição, atribuição, prazo local/instante, regras de foto/comentário, criador, versão, origem de cópia opcional |
| `task_executions` | UNIQUE taskId; resultado atual, executor original ou sistema, instante, comentário, motivo, origem do encerramento e versão |
| `business_events` | Evento append-only com unidade, tarefa/execução opcionais, ator, objeto afetado, tipo, timestamp, motivo e snapshots antes/depois |
| `task_photos` | Tarefa, execução após vínculo, uploader, evento, storageKey, MIME, tamanho/dimensões, upload/expiração/remoção e marcador vigente |
| `idempotency_records` | Chave/escopo/payload hash/resultado/expiração das operações repetíveis, caso adotado esse mecanismo |

O contexto anterior propunha `task_events`. Aqui `business_events` é alternativa para atender também usuários/configurações/mídias. Escolher uma fonte de eventos, ou separar projeções com vínculo explícito; não manter históricos contraditórios em tabelas desconectadas.

Integridade indispensável:

- FK e validação de mesma unidade para tarefa, membership, execução, foto e evento. UUID existente de outra unidade continua inválido.
- Uma execução atual por tarefa e uma foto vigente por execução; resultados anteriores ficam nos eventos.
- Desativação preserva membership para relações históricas. Revisar os `ON DELETE CASCADE` atuais de users/units antes de introduzir histórico: não permitir que exclusão global apague trilha de negócio.
- Constraints de estado/papel, índices de listagem `(unitId, executionDate)`, atribuição/status, eventos `(unitId, occurredAt, id)` e `(taskId, occurredAt, id)`, fotos por expiração.
- Testar planos/índices com o volume esperado; não adicionar índices indiscriminadamente.
- Jobs de fechamento e retenção podem integrar a aplicação modular, com exclusão mútua/idempotência entre instâncias. Não há necessidade de microsserviços no MVP.

## 15. Ajustes necessários no frontend durante a integração futura

Estes itens são dependências para atender as telas, não alterações realizadas nesta avaliação.

| Situação atual | Ajuste necessário |
| --- | --- |
| Login aceita aliases e cria contas em memória | Usar login real; retirar inferência de papel e contas demo da autenticação de produção |
| `CurrentUserContext` tem unidade fixa e papel apresentado como label | Compor usuário/membership/unidade reais; não tratar papel como global |
| Store limita unidade a `tatuape | liberdade` | Aceitar IDs reais e unidades da sessão |
| Quase todas as funções/keys não recebem unidade | Incluir `unitId` nas APIs, query keys, seleções e invalidações |
| Tarefas de operação, gestão, painel e histórico têm mocks independentes | Compartilhar os mesmos IDs, estados e projeções retornados pelo backend |
| `getHistoryDay` não recebe data | Guardar/enviar data e incluir na query key |
| Correção de auditoria envia título, não tarefa/execução | Enviar IDs e versão; título é somente apresentação |
| `getLatestAuditCorrection` é global | Abrir comprovante pelo `correctionId` retornado |
| Upload transmite apenas `evidenceName` | Transmitir `File`, receber `evidenceId` e renderizar foto real/expirada |
| Permissão de foto derivada de labels; estados incompletos nos mocks | Consumir `isEvidenceRequired`, `isCommentEnabled` e permissões explícitas |
| Desativar/reatribuir exige duas mutations | Usar operação transacional única |
| `isActive` do mock bloqueia conta global | Representar desativação por membership e contexto acessível |
| Mutations invalidam somente domínio local | Atualizar tarefa, Hoje, catálogo, painel, histórico, auditoria e mídias afetadas |
| Totais calculados pela lista retornada | Usar agregados do servidor ao paginar |
| Hoje e datas dependem do dispositivo | Inicializar pelo contexto operacional e revalidar na virada do dia |
| Tipos retornam `undefined` e views possuem fallbacks estáticos | Tratar `404`, vazio, carregamento e erro sem mostrar dados de demonstração |
| Rotas de conflito/restrição são demonstrativas | Acioná-las por códigos reais `409`/`403` e recarregar estado sem sobrescrever |

Manter o padrão view → hook → API/adaptador. Entretanto, não é realista prometer alteração somente no corpo de `src/api`: unidade, data, paginação, arquivos, IDs e versões exigem ajustes pontuais também em hooks, stores e formulários.

## 16. Ordem de implementação proposta

Cada etapa é um incremento revisável. Este plano não autoriza executá-las automaticamente.

1. **Bootstrap e proteção da base:** setup transacional/concorrrente, retirar exposição temporária de usuários, ampliar `/auth/me`, membership ativa e autorização por unidade. Revisar política de donos.
2. **Conta e equipe:** cadastro na unidade, listagem/detalhe, papéis, troca própria/reset de senha e invalidação; estrutura de ativação preservando histórico. Desativação com tarefas depende da etapa 5.
3. **Contexto operacional:** configurações, fuso/corte, regras de datas/prazos e estratégia de fechamento. Aprovar semântica antes de tarefas reais.
4. **Tarefas e eventos:** modelo de tarefa concreta, criação, catálogo mensal, data, detalhe, edição pendente, cópia e fonte de auditoria.
5. **Operação completa:** Hoje/filtros/ordem, takeover, execução, controle de versão/idempotência, upload inicial para concluir com foto e desativação com reatribuição atômica.
6. **Fechamento e gestão:** job/reconciliação, painel Hoje/Ontem, histórico mensal/diário e agregações coerentes.
7. **Correções, auditoria e retenção:** própria execução/gestão, comprovante por ID, substituição de foto, lista de mídias e expiração. Retenção deve estar operacional antes de armazenar fotos reais em produção.
8. **Integração por fluxo e preparação de publicação:** remover mocks de produção, testes de contrato/E2E, CORS/erros, configuração de storage e rotinas operacionais. Sem deploy implícito.

Decisões de infraestrutura já documentadas: API/PostgreSQL/storage no Railway, frontend no Cloudflare Pages; backup diário e exportação semanal com cópias externas manuais. São contexto de implantação, não recursos confirmados nesta avaliação. Revalidar disponibilidade/custos ao implantar, sem adicionar telas ou APIs públicas de backup.

## 17. Critérios de aceite e testes necessários na implementação

- Setup: rollback, segunda tentativa e duas requisições simultâneas; nunca criar dois primeiros donos por corrida.
- Sessão: credenciais reais, usuário inexistente, vínculo inativo, `401`, papel diferente em duas unidades e troca de contexto sem cache cruzado.
- Autorização: negar leitura e mutação por IDs de outra unidade em todos os domínios, incluindo fotos/eventos; validar hierarquia aprovada.
- Senhas: limites, senha atual incorreta, nova igual, reset sem consultar senha antiga, credencial/token antigo inválido conforme política e nenhuma reativação acidental.
- Equipe: username global duplicado, cadastro atômico, último dono sob concorrência, reativação, reatribuição somente de pendentes elegíveis e rollback integral na desativação.
- Tarefas: datas reais, mês obrigatório, filtros combinados, ordenação estável, responsável ativo de qualquer papel, data/prazo padrão e cópia sem dados de execução.
- Execução: justificativas exigidas, foto validada, comentário configurado, executor correto para feita/não feita, takeover alheio e conflito entre dois executores.
- Retry: falha de rede após commit não duplica criação/cópia/evento/execução; chave repetida com payload diferente é rejeitada.
- Correções: autoria versus atribuição, dia fechado para funcionário, permissão de gestão, before/after preservado, motivo distinto e comprovante certo com múltiplos usuários.
- Dia operacional: antes/no/depois do corte, meia-noite, horário igual ao fechamento, mudança de configuração, fuso, job atrasado/repetido e concorrência execução/fechamento.
- Métricas: totais consistentes entre telas, atraso sem dupla contagem, resumo independente da página, dia vazio e correção refletida no histórico.
- Fotos: câmera/galeria usando mesmo contrato, tipo/tamanho, upload órfão, arquivo de outra unidade/tarefa, duas substituições concorrentes, expiração individual de versões e metadados preservados.
- Auditoria: ordem decrescente estável, categoria/data, nome da tarefa como assunto, eventos de usuário/sistema e impossibilidade de modificar eventos por API.
- Integração: carregando/vazio/erro, `401`/`403`/`404`/`409`, retry seguro, limpeza no logout, mudança de unidade e sucesso exibido somente após confirmação do servidor.
- Manter testes unitários das regras e E2E com PostgreSQL para transações, constraints e isolamento. Publicar DTOs, filtros, enums, exemplos e erros no Swagger a cada entrega.

## 18. Decisões a fechar antes das etapas correspondentes

| Decisão | Por que importa | Direção proposta neste plano |
| --- | --- | --- |
| Bootstrap por instalação e provisionamento de novas unidades | Evitar cadastro público indevido e desbloquear multiunidade | Primeiro bootstrap único; unidades adicionais por fluxo a definir |
| Hierarquia entre gestores/donos | UI permite escolher papéis, mas não define todos os alvos autorizados | Gerente não deve ganhar poder implícito sobre donos; confirmar regras |
| Reset de identidade com múltiplas unidades | Senha é global; gestor de uma unidade afeta todos os logins | Definir alvos e autoridade global antes de liberar reset |
| Escopo de auditoria do gerente e histórico do funcionário | Documentação/menu não fixam exatamente a mesma visibilidade | Separar leitura global de auditoria da correção autorizada por tarefa |
| Corte e pendência automática | Mocks não são decisão definitiva | Dia operacional com fechamento idempotente e origem `autoClosed` |
| Datas passadas, horário ausente e fronteira do corte | Previne prazos ambíguos e execução fora do período | Bloquear criação em dia fechado; default fechamento; decidir suporte a `null` |
| Vigência de configuração | Mudança de horário não pode alterar retrospectivamente o histórico | Aplicar a dia futuro, preservando limites efetivos já registrados |
| Validações de texto, paginação e upload | Contratos precisam de limites reais | Definir valores por campo e formatos de imagem antes dos DTOs |
| Foto expirada em correção de resultado | Regra de evidência precisa distinguir histórico de novo envio | Preservar referência antiga em correção textual; validar nova conclusão |
| Sessão e invalidação | Token atual é curto e não revogável | Memória + novo login no MVP; credentialVersion para troca/reset |
| Uso de membro existente em outra unidade | Username é global, formulário atual cadastra nova pessoa | Não vincular silenciosamente; definir fluxo separado se necessário |

Nenhuma dessas pendências impede preparar os contratos e dividir o trabalho; elas precisam ser resolvidas antes de implementar a regra correspondente. O próximo incremento já previsto pelo contexto do backend continua sendo o bootstrap transacional do primeiro proprietário.
