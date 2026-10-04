# Guarni — progresso e próximos passos

Atualizado em 04/10/2026. Este guia é para você acompanhar o aprendizado.
A IA retoma o trabalho pelo PROJECT_CONTEXT.md; as regras de colaboração ficam
nos arquivos AGENTS. Este documento não precisa ser carregado pelo agente.

## Onde estamos

Concluímos os três primeiros checkpoints. A API já cria a primeira unidade e seu
proprietário, autentica usuários, troca senhas, invalida tokens antigos e verifica
se a pessoa pode acessar uma unidade. A leitura de configurações já funciona.

Isso ainda não significa que todo o MVP está pronto: várias rotas têm DTOs,
controllers e entidades preparados, mas os services continuam retornando 501.
Esses marcadores serão substituídos conforme implementarmos e testarmos as regras.

### 1. Setup seguro — concluído

Você implementou POST /v1/setup/owner com X-Setup-Token. User, Unit e Membership
OWNER são criados na mesma transação. Uma falha reverte tudo; o advisory lock
impede dois bootstraps simultâneos. Uma unidade existente bloqueia novo setup.

Praticamos transação, commit, rollback e concorrência. O token de setup autoriza
o primeiro cadastro; ele não recupera contas nem permite repetir o bootstrap.

### 2. Senha e revogação — concluído

O guard confere o JWT e compara credentialVersion com o usuário no banco.
PUT /v1/auth/password exige a senha atual, grava o novo hash e incrementa a versão.
A resposta traz um novo accessToken; os antigos deixam de autorizar novas requisições.

A atualização condicionada à versão evita que duas trocas simultâneas se
sobrescrevam. Se a assinatura do novo token falhar, a transação reverte a mudança.
Você confirmou a troca e o uso do novo token no Swagger.

Também existem comandos administrativos:

```powershell
npm run admin:list-users
npm run owner:reset-password -- username.do.owner
```

O primeiro identifica as contas sem expor hashes. O segundo exige OWNER ativo,
confirma o alvo e mostra uma nova senha após gravá-la. Ele também invalida tokens
anteriores. A senha gerada não expira e não há troca obrigatória no primeiro login.

### 3. Acesso por unidade — concluído

AccessTokenGuard identifica a pessoa; UnitMembershipGuard verifica seu vínculo
ativo com a unidade da URL. O guard valida o UUID, consulta os três critérios
juntos e anexa a membership à request. @CurrentMembership entrega esse contexto
ao controller. GET /v1/units/:unitId/settings usa a unidade autorizada.

Testamos acesso permitido, ausência de token, UUID inválido, outra unidade,
vínculo de outra pessoa e vínculo inativo. A confirmação manual de settings no
Swagger ainda não foi registrada; o teste automatizado passou.

## Próximo: 4. Hierarquia e último OWNER

Ter acesso à unidade não significa poder administrar qualquer pessoa nela.
OWNER administra os três papéis; MANAGER administra somente EMPLOYEE.
Além disso, a unidade nunca pode ficar sem um OWNER ativo.

O primeiro exercício será uma alteração de papel ou desativação. Vamos aprender
a verificar ator e alvo e usar lock pessimista para preservar o último OWNER
mesmo quando duas requisições tentam alterá-los ao mesmo tempo.

Arquivos de partida: src/memberships/memberships.service.ts, controller e DTOs.
Ainda não vamos implementar toda a gestão de equipe de uma vez.

## Depois disso

| Checkpoint | Problema que vamos resolver |
|---|---|
| 5. Dia operacional | Calcular o dia que fecha às 03:00, usando timezone IANA, Luxon e relógio testável. |
| 6. expectedVersion | Impedir que duas telas sobrescrevam configurações; aprofundar a atualização condicionada já praticada na senha. |
| 7. Eventos de negócio | Gravar alteração e histórico before/after na mesma transação, sem apagar eventos anteriores. |
| 8. Execução concorrente | Coordenar execução, takeover e fechamento, validando novamente o estado sob lock. |
| 9. Scheduler | Fechar dias de forma idempotente e recuperar trabalho após reinícios. |
| 10. Fotos e storage | Receber multipart, validar/processar imagens e usar storage privado com URLs assinadas. |
| 11. Índice parcial | Garantir no banco somente uma evidência vigente por execução. |
| 12. Dashboard/histórico | Usar agregações para produzir resumos e métricas. |

Integração com guarni-web fica para depois da preparação do backend.
As bibliotecas novas serão introduzidas na etapa correspondente.

Os contratos completos ficam em [MVP_SPEC.md](../MVP_SPEC.md), para consulta
quando chegarmos a cada funcionalidade. Este guia acompanha a aprendizagem;
PROJECT_CONTEXT.md resume o estado para a IA. O levantamento antigo das APIs
foi consolidado na especificação, sem manter dois planos concorrentes.

## Como seguimos

Conceitos novos são explicados em passos pequenos e você escreve o núcleo.
Depois da primeira prática, repetições e testes autorizados podem ser automatizados.
Durante a escrita, a revisão é por leitura. Formatação e verificações pesadas
ficam para um fluxo pronto para testar, executar ou preparar para commit.

Última validação registrada: 46 testes unitários e 41 E2E passaram, além de build,
tipos e lint. Esse é o resultado da etapa anterior, não uma nova execução em outubro.
Os E2E usam e limpam guarni_test; não devem apontar para dados reais.

Para conferir manualmente: iniciar a API, abrir /docs, fazer login, usar Authorize
e obter o unitId em /v1/auth/me. Após trocar a senha, substituir o token no Swagger.
