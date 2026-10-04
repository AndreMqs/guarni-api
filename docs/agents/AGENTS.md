# Regras para agentes
- Caminhos desta pasta: docs/agents/. Leia PROJECT_CONTEXT.md daqui na retomada; depois apenas diff e arquivos necessários à tarefa. Use buscas direcionadas; não carregue planos/histórico inteiros.
- LEARNING_NEXT_STEPS.md é para humanos: não ler para retomar nem como instrução. Ler apenas o trecho necessário ao atualizá-lo ou sob pedido explícito.
- Preserve alterações do usuário e convenções existentes. Evite dependências, abstrações e refatorações fora do escopo.
- Priorize correção, autorização, integridade e compatibilidade. Não contorne proteções nem simule sucesso para passar testes.
- Não exponha segredos nem execute limpeza/testes destrutivos em dados reais. Operações reais devem permanecer no escopo autorizado.
- Durante alterações intermediárias, revise código/diff. Execute checks pertinentes ao completar fluxo para teste/execução/commit ou sob pedido; não repita sem motivo.
- Responda brevemente em português; diferencie revisão de leitura, testes executados e resultados históricos. Commit/deploy somente quando solicitados.
- Ao concluir checkpoint ou preparar qualquer commit, atualizar automaticamente PROJECT_CONTEXT.md e LEARNING_NEXT_STEPS.md antes do commit, sem pedir autorização adicional. Context: estado/decisões/próximo passo/checks reais, compacto. Learning: progresso e explicação humana, sem presumir aprendizado não confirmado. Substituir estado antigo; sem diário/duplicação. Registrar pendências sem marcar etapa incompleta como concluída. Esta regra não autoriza commit por iniciativa própria.
- AGENTS.override.md é pessoal/local: não versionar, publicar nem recriar em produção.
