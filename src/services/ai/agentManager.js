import { getLogger } from '../../core/logger.js';
import * as dbManager from '../../database/db.mysql.js';
import { generateGeminiContent } from './gemini.service.js';
import { toolDeclarations, toolExecutors } from './agentTools.js';

const logger = getLogger();

// Ferramentas que realizam ações de modificação/escrita
const WRITE_TOOLS = new Set([
  'atualizar_preco_anuncio_ml',
  'atualizar_estoque_anuncio_ml',
  'otimizar_titulo_descricao_ml'
]);

/**
 * Converte o histórico de mensagens do banco no formato esperado pela API Gemini
 * @param {Array} dbMessages - Mensagens salvas na tabela ai_messages
 * @returns {Array} Array de contents formatado para o Gemini
 */
function formatMessagesForGemini(dbMessages) {
  const contents = [];

  for (const msg of dbMessages) {
    if (msg.sender === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.content || '' }]
      });
    } else if (msg.sender === 'assistant') {
      const parts = [];
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          if (tc.functionCall || tc.text !== undefined || tc.thought) {
            // Raw Gemini candidate part (preserves thought_signature, functionCall, etc.)
            parts.push(tc);
          } else if (tc.name) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.args || {}
              }
            });
          }
        }
      }
      // Se houver texto e não estiver já nos parts
      if (parts.length === 0 && msg.content) {
        parts.push({ text: msg.content });
      } else if (parts.length > 0 && msg.content && !parts.some(p => p.text === msg.content)) {
        parts.unshift({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role: 'model', parts });
      }
    } else if (msg.sender === 'tool' && Array.isArray(msg.tool_results)) {
      const parts = msg.tool_results.map(tr => ({
        functionResponse: {
          name: tr.name,
          response: { result: tr.result !== undefined ? tr.result : null }
        }
      }));
      contents.push({ role: 'user', parts });
    }
  }

  return contents;
}

/**
 * Processa uma mensagem do usuário enviada para um agente de IA
 * @param {object} params
 * @param {number} params.agentId - ID do agente
 * @param {number} params.conversationId - ID da conversa
 * @param {string} params.message - Texto enviado pelo usuário
 * @param {object} params.db - Instância do banco de dados
 * @returns {Promise<object>} Resposta gerada, histórico e ações pendentes
 */
export async function processAgentMessage({ agentId, conversationId, message, db }) {
  // 1. Carrega configurações do agente e de IA
  const agent = await dbManager.getAIAgentById(agentId);
  if (!agent) {
    throw new Error(`Agente com ID ${agentId} não encontrado.`);
  }

  const aiSettings = await dbManager.getAISettings();
  const apiKey = aiSettings.gemini_api_key || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave da API do Google Gemini não está configurada. Acesse o menu "Configurações IA" e cadastre sua chave.');
  }

  const model = agent.model || aiSettings.default_model || 'gemini-3.6-flash';
  const requireConfirmation = agent.require_confirmation;

  // 2. Disponibiliza todas as ferramentas do sistema para a IA orquestrar autonomamente
  const availableTools = toolDeclarations;

  // Carrega outros agentes disponíveis para colaboração inter-agentes sob demanda
  const allAgents = await dbManager.getAIAgents();
  const otherAgents = allAgents.filter(a => a.id !== agent.id && a.is_active);
  let otherAgentsContext = '';
  if (otherAgents.length > 0) {
    otherAgentsContext = '\n\n--- AGENTES COLEGAS (Use apenas se solicitado expressamente pelo usuário) ---\n' +
      otherAgents.map(a => `- Slug: "${a.slug}" | Nome: "${a.name}" | Especialidade: "${a.role_title}"`).join('\n');
  }

  const apiDomainsContext = '\n\n--- CAPACIDADES DA API DO MERCADO LIVRE DISPONÍVEIS NO SISTEMA ---\n' +
    'Você tem acesso completo ao ecossistema de dados da conta no Mercado Livre:\n' +
    '- Anúncios & Buy Box: buscar_anuncios_ml, obter_detalhes_anuncio_ml, analisar_oportunidades_buybox\n' +
    '- Vendas & Faturamento: consultar_vendas_e_pedidos_ml (pedidos, faturamento bruto, ticket médio, top produtos)\n' +
    '- Reputação & Qualidade: consultar_reputacao_e_metricas_ml (termômetro, medalha MercadoLíder, taxas de reclamação/atraso)\n' +
    '- Marketing & Campanhas: consultar_promocoes_e_campanhas_ml (campanhas co-funding e descontos elegíveis)\n' +
    '- Publicidade (Mercado Ads): consultar_publicidade_ads_ml (campanhas ativas, metas de ACOS, orçamento)\n' +
    '- Atendimento & SAC: consultar_perguntas_e_atendimento_ml (perguntas pendentes de clientes no pré-venda)\n' +
    '- Diagnóstico de Anúncio: consultar_saude_e_visitas_anuncio_ml (nota de qualidade 0-100% e histórico de visitas)\n' +
    '- Mapa de Capacidades: consultar_mapa_capacidades_ml (para inspecionar quais dados cada endpoint entrega antes de buscar)';

  const performanceGuidance = '\n\nDIRETRIZ DE SELEÇÃO DE FERRAMENTAS E RACIOCÍNIO:\n' +
    '1. REGRA CRÍTICA DE ROTEAMENTO: Para qualquer pergunta sobre "vendas", "mais vendido", "campeão de vendas", "volume vendido", "faturamento", "receita" ou "pedidos" em qualquer período (ex: últimos 30 dias, 60 dias, 12 meses / 1 ano), VOCÊ DEVE OBRIGATORIAMENTE CHAMAR `consultar_vendas_e_pedidos_ml` (passando o parâmetro `dias` correspondente, ex: `dias: 365` para 12 meses/1 ano, `dias: 30` para 30 dias). NUNCA chame `buscar_anuncios_ml` para perguntas de vendas/pedidos, pois `buscar_anuncios_ml` busca apenas o catálogo cadastrado de estoque e não possui histórico de vendas.\n' +
    '2. Responda DIRETAMENTE e OBJETIVAMENTE à pergunta exata do usuário logo na primeira linha, destacando o anúncio/produto principal, número de vendas, faturamento e sua margem líquida exata.\n' +
    '3. Apresente os dados de forma consultiva e executiva (destaque o item campeão, comissão ML, frete e margem líquida percentual).\n' +
    '4. A ferramenta `consultar_vendas_e_pedidos_ml` JÁ RETORNA faturamento, quantidade vendida, preço, taxas e MARGEM LÍQUIDA % dos produtos mais vendidos.\n' +
    '5. Responda em 1 ÚNICO ciclo assim que obtiver os dados, sem fazer chamadas secundárias repetitivas.';

  const systemPrompt = (agent.system_prompt || '') + otherAgentsContext + apiDomainsContext + performanceGuidance;

  // 3. Salva a mensagem do usuário no banco
  await dbManager.saveAIMessage({
    conversation_id: conversationId,
    sender: 'user',
    content: message
  });

  // 4. Carrega histórico da conversa
  let dbMessages = await dbManager.getAIMessages(conversationId);
  let contents = formatMessagesForGemini(dbMessages);

  let loopCount = 0;
  const maxLoops = 2; // Máximo de 2 iterações para resposta ágil e evitar chamadas redundantes
  let finalAssistantText = '';
  const executedActions = [];
  const pendingActions = [];

  // 5. Loop de Function Calling (Execução iterativa das ferramentas)
  try {
    while (loopCount < maxLoops) {
      loopCount++;
      logger.info(`[AgentManager] Ciclo ${loopCount} do Agente "${agent.name}" (Modelo: ${model})...`);

      const geminiRes = await generateGeminiContent({
        apiKey,
        model,
        systemPrompt,
        contents,
        tools: availableTools,
        temperature: aiSettings.temperature || 0.2,
        maxOutputTokens: aiSettings.max_output_tokens || 4096
      });

      if (geminiRes.text) {
        finalAssistantText = geminiRes.text;
      }

      const functionCalls = geminiRes.functionCalls || [];

      // Se o Gemini não chamou nenhuma ferramenta, a resposta final está pronta!
      if (functionCalls.length === 0) {
        break;
      }

      logger.info(`[AgentManager] Agente chamou ${functionCalls.length} ferramenta(s): ${functionCalls.map(f => f.name).join(', ')}`);

      // Registra a mensagem do modelo com as chamadas de função no histórico (preservando raw parts/thought_signature)
      const rawParts = geminiRes.rawCandidate?.content?.parts;
      await dbManager.saveAIMessage({
        conversation_id: conversationId,
        sender: 'assistant',
        content: geminiRes.text || '',
        tool_calls: (rawParts && rawParts.length > 0) ? rawParts : functionCalls
      });

      // Adiciona ao contents para o próximo ciclo
      if (rawParts && rawParts.length > 0) {
        contents.push({ role: 'model', parts: rawParts });
      } else {
        const modelParts = [];
        if (geminiRes.text) modelParts.push({ text: geminiRes.text });
        for (const fc of functionCalls) {
          modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
        }
        contents.push({ role: 'model', parts: modelParts });
      }

      const toolResults = [];
      let hasPendingWrite = false;

      // Executa cada ferramenta chamada
      for (const fc of functionCalls) {
        const isWriteTool = WRITE_TOOLS.has(fc.name);

        // Se for ferramenta de escrita e o agente requer confirmação:
        if (isWriteTool && requireConfirmation) {
          hasPendingWrite = true;
          const loggedAction = await dbManager.logAIAction({
            agent_id: agent.id,
            conversation_id: conversationId,
            tool_name: fc.name,
            tool_args: fc.args,
            tool_result: null,
            status: 'pending_approval',
            executed_by: 'gemini_agent'
          });

          pendingActions.push({
            action_id: loggedAction.id,
            tool_name: fc.name,
            args: fc.args,
            descricao: `Alteração solicitada no anúncio ${fc.args.item_id}: ` + 
              (fc.args.novo_preco ? `Novo Preço R$ ${parseFloat(fc.args.novo_preco).toFixed(2)}` : '') +
              (fc.args.novo_estoque ? `Novo Estoque ${fc.args.novo_estoque} un.` : '') +
              (fc.args.novo_titulo ? `Novo Título "${fc.args.novo_titulo}"` : '')
          });

          toolResults.push({
            name: fc.name,
            result: {
              status: 'pending_approval',
              action_id: loggedAction.id,
              mensagem: 'Ação registrada e aguardando confirmação explícita do vendedor na tela.'
            }
          });
        } else {
          // Ferramenta de leitura, análise ou colaboração inter-agentes
          const executor = toolExecutors[fc.name];
          let result;
          let status = 'executed';

          if (typeof executor === 'function') {
            try {
              result = await executor(fc.args, {
                db,
                agentId: agent.id,
                conversationId,
                consultationDepth: 0
              });
              executedActions.push({ tool_name: fc.name, args: fc.args, result });
            } catch (execErr) {
              status = 'failed';
              result = { erro: execErr.message };
              logger.error(`[AgentManager] Erro ao executar tool ${fc.name}: ${execErr.message}`);
            }
          } else {
            status = 'failed';
            result = { erro: `Ferramenta ${fc.name} não implementada no sistema.` };
          }

          await dbManager.logAIAction({
            agent_id: agent.id,
            conversation_id: conversationId,
            tool_name: fc.name,
            tool_args: fc.args,
            tool_result: result,
            status,
            executed_by: 'gemini_agent'
          });

          toolResults.push({ name: fc.name, result });
        }
      }

      // Salva o resultado das ferramentas no banco
      await dbManager.saveAIMessage({
        conversation_id: conversationId,
        sender: 'tool',
        content: '',
        tool_results: toolResults
      });

      // Formata o retorno das ferramentas para enviar de volta ao Gemini (role DEVE ser 'user')
      const userToolParts = toolResults.map(tr => ({
        functionResponse: {
          name: tr.name,
          response: { result: tr.result !== undefined ? tr.result : null }
        }
      }));
      contents.push({ role: 'user', parts: userToolParts });
    }
  } catch (loopErr) {
    logger.error(`[AgentManager] Erro no loop de raciocínio da IA (${loopErr.message}). Ativando contingência direta...`);
    if (executedActions.length === 0) {
      const fallbackActions = await executeHeuristicToolFallback(message, db, agent);
      executedActions.push(...fallbackActions);
    }
  }

  // Se executou ferramentas e ainda não gerou o texto final estruturado para o usuário:
  if (!finalAssistantText && executedActions.length > 0) {
    logger.info(`[AgentManager] Sintetizando resposta final com base nos dados obtidos...`);
    try {
      const finalRes = await generateGeminiContent({
        apiKey,
        model,
        systemPrompt: systemPrompt + '\n\nIMPORTANTE: Forneça agora uma resposta completa, rica e detalhada em Markdown para o usuário, organizando e sintetizando todas as informações e dados obtidos nas ferramentas acima com tabelas e listas claras.',
        contents,
        tools: [], // Sem tools para forçar texto final consolidado
        temperature: aiSettings.temperature || 0.3,
        maxOutputTokens: aiSettings.max_output_tokens || 4096
      });
      if (finalRes && finalRes.text) {
        finalAssistantText = finalRes.text;
      }
    } catch (synthErr) {
      logger.error(`[AgentManager] Erro na síntese via IA (${synthErr.message}). Gerando síntese estruturada a partir dos dados...`);
      finalAssistantText = generateStructuredFallbackSummary(executedActions, message);
    }
  }

  // Fallback garantido se ainda não tiver texto final
  if (!finalAssistantText) {
    if (executedActions.length > 0) {
      finalAssistantText = generateStructuredFallbackSummary(executedActions, message);
    } else {
      finalAssistantText = 'Não foi possível gerar uma resposta detalhada para sua solicitação no momento. Por favor, tente novamente.';
    }
  }

  // 6. Salva a resposta final do assistente se ainda não foi salva
  if (finalAssistantText) {
    await dbManager.saveAIMessage({
      conversation_id: conversationId,
      sender: 'assistant',
      content: finalAssistantText
    });
  }

  // Atualiza título da conversa se for a primeira mensagem
  dbMessages = await dbManager.getAIMessages(conversationId);
  if (dbMessages.length <= 4) {
    const previewTitle = message.substring(0, 40) + (message.length > 40 ? '...' : '');
    const pool = db.getPool();
    await pool.execute('UPDATE ai_conversations SET title = ? WHERE id = ?', [previewTitle, conversationId]);
  }

  return {
    sucesso: true,
    agent: {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      avatar_icon: agent.avatar_icon,
      avatar_color: agent.avatar_color,
      role_title: agent.role_title
    },
    message: finalAssistantText,
    executed_actions: executedActions,
    pending_actions: pendingActions,
    messages: dbMessages
  };
}

/**
 * Aprova e executa uma ação de escrita que estava pendente de confirmação
 * @param {number} actionId - ID do log de ação
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Resultado da execução
 */
export async function approvePendingAction(actionId, db) {
  const pool = db.getPool();
  const [rows] = await pool.execute('SELECT * FROM ai_action_logs WHERE id = ? LIMIT 1', [actionId]);

  if (rows.length === 0) {
    throw new Error(`Ação com ID ${actionId} não encontrada.`);
  }

  const action = rows[0];
  if (action.status !== 'pending_approval') {
    throw new Error(`Esta ação já foi processada anteriormente (Status atual: ${action.status}).`);
  }

  const toolName = action.tool_name;
  const toolArgs = typeof action.tool_args === 'string' ? JSON.parse(action.tool_args) : action.tool_args;
  const executor = toolExecutors[toolName];

  if (typeof executor !== 'function') {
    throw new Error(`Executor para a ferramenta ${toolName} não encontrado.`);
  }

  logger.info(`[AgentManager] Aprovando e executando ação ID ${actionId} (${toolName})...`);

  try {
    const result = await executor(toolArgs, { db });
    await dbManager.updateAIActionStatus(actionId, 'approved', result);

    if (action.conversation_id) {
      await dbManager.saveAIMessage({
        conversation_id: action.conversation_id,
        sender: 'system',
        content: `✅ **Ação Aprovada pelo Usuário**: ${result.mensagem || 'Executada com sucesso no Mercado Livre.'}`
      });
    }

    return {
      sucesso: true,
      action_id: actionId,
      tool_name: toolName,
      resultado: result,
      mensagem: result.mensagem || 'Ação aprovada e executada com sucesso!'
    };
  } catch (err) {
    await dbManager.updateAIActionStatus(actionId, 'failed', { erro: err.message });
    throw new Error(`Falha ao executar ação aprovada: ${err.message}`);
  }
}

/**
 * Rejeita uma ação pendente
 * @param {number} actionId - ID do log de ação
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>}
 */
export async function rejectPendingAction(actionId, db) {
  const pool = db.getPool();
  const [rows] = await pool.execute('SELECT * FROM ai_action_logs WHERE id = ? LIMIT 1', [actionId]);

  if (rows.length === 0) {
    throw new Error(`Ação com ID ${actionId} não encontrada.`);
  }

  const action = rows[0];
  if (action.status !== 'pending_approval') {
    throw new Error(`Esta ação já foi processada anteriormente (Status atual: ${action.status}).`);
  }

  await dbManager.updateAIActionStatus(actionId, 'rejected', { motivo: 'Rejeitado pelo usuário' });

  if (action.conversation_id) {
    await dbManager.saveAIMessage({
      conversation_id: action.conversation_id,
      sender: 'system',
      content: `❌ **Ação Cancelada pelo Usuário**: A alteração proposta para ${action.tool_name} foi cancelada.`
    });
  }

  return {
    sucesso: true,
    action_id: actionId,
    mensagem: 'Ação rejeitada com sucesso.'
  };
}

/**
 * Executa delegação/consulta entre agentes especialistas (Colaboração Multi-Agente)
 * @param {object} params
 * @param {string} params.targetSlug - Slug do agente especialista consultado
 * @param {string} params.prompt - Pergunta ou contexto técnico enviado
 * @param {number} params.callingAgentId - ID do agente solicitante
 * @param {object} params.db - Instância do banco de dados
 * @param {number} params.depth - Profundidade de consulta para evitar loops
 * @returns {Promise<object>} Resposta técnica do agente consultado
 */
export async function delegateToAgent({ targetSlug, prompt, callingAgentId, db, depth = 1 }) {
  if (depth > 2) {
    return {
      sucesso: false,
      erro: 'Limite de profundidade de colaboração entre agentes atingido.'
    };
  }

  const targetAgent = await dbManager.getAIAgentBySlug(targetSlug);
  if (!targetAgent) {
    return {
      sucesso: false,
      erro: `Agente especialista com identificador "${targetSlug}" não foi encontrado no sistema.`
    };
  }

  const aiSettings = await dbManager.getAISettings();
  const apiKey = aiSettings.gemini_api_key || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      sucesso: false,
      erro: 'Chave da API do Gemini não configurada.'
    };
  }

  const callingAgent = callingAgentId ? await dbManager.getAIAgentById(callingAgentId) : null;
  const callingName = callingAgent?.name || 'Agente Colega';

  logger.info(`[AgentCollaboration] Agente "${callingName}" está consultando especialista "${targetAgent.name}" (Slug: ${targetSlug})...`);

  const targetModel = targetAgent.model || aiSettings.default_model || 'gemini-3.6-flash';
  
  // Disponibiliza as ferramentas de leitura e análise para o especialista
  const readTools = toolDeclarations.filter(t => !WRITE_TOOLS.has(t.name) && t.name !== 'consultar_outro_agente');

  let subContents = [
    {
      role: 'user',
      parts: [
        {
          text: `Você foi consultado pelo ${callingName} para fornecer sua análise técnica especializada com a seguinte solicitação:\n\n"${prompt}"\n\nPor favor, faça sua análise detalhada e forneça um parecer técnico estruturado, claro e objetivo com recomendações baseadas no seu conhecimento especializado.`
        }
      ]
    }
  ];

  let replyText = '';
  let cycles = 0;

  while (cycles < 3) {
    cycles++;
    const geminiRes = await generateGeminiContent({
      apiKey,
      model: targetModel,
      systemPrompt: targetAgent.system_prompt,
      contents: subContents,
      tools: readTools,
      temperature: 0.2,
      maxOutputTokens: 2048
    });

    if (geminiRes.text) {
      replyText = geminiRes.text;
    }

    const fcs = geminiRes.functionCalls || [];
    if (fcs.length === 0) break;

    const subToolResults = [];
    for (const fc of fcs) {
      const exec = toolExecutors[fc.name];
      if (exec) {
        try {
          const res = await exec(fc.args, { db, consultationDepth: depth });
          subToolResults.push({ name: fc.name, result: res });
        } catch (e) {
          subToolResults.push({ name: fc.name, result: { erro: e.message } });
        }
      }
    }

    const subRawParts = geminiRes.rawCandidate?.content?.parts;
    if (subRawParts && subRawParts.length > 0) {
      subContents.push({
        role: 'model',
        parts: subRawParts
      });
    } else {
      subContents.push({
        role: 'model',
        parts: [
          ...(geminiRes.text ? [{ text: geminiRes.text }] : []),
          ...fcs.map(fc => ({ functionCall: { name: fc.name, args: fc.args } }))
        ]
      });
    }

    subContents.push({
      role: 'user',
      parts: subToolResults.map(tr => ({
        functionResponse: { name: tr.name, response: { result: tr.result } }
      }))
    });
  }

  // Registra no log de auditoria
  await dbManager.logAIAction({
    agent_id: targetAgent.id,
    conversation_id: null,
    tool_name: 'consultar_outro_agente',
    tool_args: { solicitante: callingName, consulta: prompt },
    tool_result: { parecer: (replyText || '').substring(0, 300) },
    status: 'executed',
    executed_by: `inter_agent:${callingAgent?.slug || 'unknown'}`
  });

  return {
    sucesso: true,
    agente_consultado: targetAgent.name,
    slug: targetAgent.slug,
    cargo: targetAgent.role_title,
    parecer_tecnico: replyText || 'Análise concluída sem observações adicionais.'
  };
}

/**
 * Gera um resumo executivo estruturado em Markdown a partir dos dados retornados pelas ferramentas
 * caso a API de geração de texto enfrente sobrecarga ou indisponibilidade temporária
 * @param {Array} executedActions - Lista de ações executadas
 * @param {string} userMessage - Mensagem do usuário
 * @returns {string} Resumo formatado em Markdown
 */
function generateStructuredFallbackSummary(executedActions, userMessage = '') {
  if (!Array.isArray(executedActions) || executedActions.length === 0) {
    return 'Concluí a consulta aos dados, mas não foi possível gerar o texto sintetizado no momento. Por favor, repita a pergunta.';
  }

  let text = '';

  for (const action of executedActions) {
    const { tool_name, result } = action;
    if (!result) continue;

    if (result.erro) {
      text += `⚠️ **Aviso ao executar ${tool_name}:** ${result.erro}\n\n`;
      continue;
    }

    if (tool_name === 'consultar_vendas_e_pedidos_ml') {
      const topProducts = Array.isArray(result.produtos_mais_vendidos) ? result.produtos_mais_vendidos : [];
      const top1 = topProducts[0];

      if (top1) {
        const margemStr = top1.margem_liquida_percent !== undefined ? `${top1.margem_liquida_percent}%` : 'N/A';
        text += `### 🎯 Anúncio Campeão de Vendas & Rentabilidade\n\n`;
        text += `O anúncio com maior número de vendas é **${top1.titulo}** (ID: \`${top1.item_id}\`).\n\n`;
        text += `**Métricas Detalhadas do Item:**\n`;
        text += `- 📦 **Volume Vendido:** **${top1.quantidade_vendida} unidades**\n`;
        text += `- 💰 **Faturamento Gerado:** **R$ ${top1.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n`;
        text += `- 🏷️ **Preço Atual de Venda:** R$ ${top1.preco_atual ? top1.preco_atual.toFixed(2) : '-'}\n`;
        text += `- 💸 **Comissão Mercado Livre:** R$ ${top1.taxa_ml ? top1.taxa_ml.toFixed(2) : '-'}\n`;
        text += `- 🚚 **Frete Pago pelo Vendedor:** R$ ${top1.frete_vendedor ? top1.frete_vendedor.toFixed(2) : '0.00'}\n`;
        text += `- 💵 **Recebimento Líquido Unitário:** R$ ${top1.valor_liquido ? top1.valor_liquido.toFixed(2) : '-'}\n`;
        text += `- 📈 **Margem de Lucro Líquida:** **${margemStr}**\n\n`;

        const margemNum = top1.margem_liquida_percent || 0;
        const statusLucro = margemNum >= 25 ? 'excelente rentabilidade líquida' : margemNum >= 15 ? 'rentabilidade equilibrada e sustentável' : 'margem de lucro reduzida (recomendado reavaliar preço/custos)';
        text += `> 💡 **Parecer do Especialista:** Este item é o carro-chefe de vendas da sua loja com ${statusLucro}, entregando **${margemStr}** de margem líquida real por unidade vendida.\n\n`;
      }

      const periodoStr = result.periodo_dias_analisado ? ` (Período: ${result.periodo_dias_analisado === 'completo_disponivel' ? 'Histórico Completo' : result.periodo_dias_analisado + ' dias'})` : '';
      text += `#### 🛒 Panorama Consolidado de Vendas no Mercado Livre${periodoStr}\n`;
      text += `- **Total de Pedidos Consolidados:** ${result.pedidos_consolidados || result.pedidos_listados || result.total_pedidos_encontrados || 0}\n`;
      text += `- **Faturamento Total:** R$ ${(result.faturamento_total || result.faturamento_total_amostra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      text += `- **Ticket Médio:** R$ ${(result.ticket_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

      if (topProducts.length > 0) {
        text += '##### 🏆 Ranking dos Produtos Mais Vendidos & Margens:\n';
        text += '| Anúncio / Produto | Qtd Vendida | Faturamento | Preço Unit. | Valor Líquido | Margem Líquida |\n';
        text += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
        for (const p of topProducts) {
          const preco = p.preco_atual ? `R$ ${p.preco_atual.toFixed(2)}` : '-';
          const liquido = p.valor_liquido ? `R$ ${p.valor_liquido.toFixed(2)}` : '-';
          const margem = p.margem_liquida_percent !== undefined ? `${p.margem_liquida_percent}%` : '-';
          text += `| **${p.titulo}** (\`${p.item_id}\`) | ${p.quantidade_vendida} un. | R$ ${p.faturamento.toFixed(2)} | ${preco} | ${liquido} | **${margem}** |\n`;
        }
        text += '\n';
      }
    } else if (tool_name === 'resumo_geral_loja') {
      text += '#### 🏪 Resumo Geral da Loja\n';
      if (result.metricas_anuncios) {
        text += `- **Total de Anúncios no ML:** ${result.metricas_anuncios.total_anuncios_ml || 0} (${result.metricas_anuncios.anuncios_ativos || 0} ativos)\n`;
        text += `- **Anúncios com Margem Crítica (< 15%):** ${result.metricas_anuncios.anuncios_com_margem_critica_menor_15_pct || 0}\n`;
      }
      if (result.metricas_buybox) {
        text += `- **Catálogo Buy Box:** ${result.metricas_buybox.total_anuncios_catalogo || 0} itens (${result.metricas_buybox.ganhando_buybox || 0} ganhando / ${result.metricas_buybox.perdendo_buybox || 0} perdendo)\n`;
      }
      if (result.fornecedor) {
        text += `- **Produtos de Fornecedores Cadastrados:** ${result.fornecedor.produtos_importados_cadastrados || 0}\n`;
      }
      text += '\n';
    } else if (tool_name === 'buscar_anuncios_ml' && Array.isArray(result.anuncios)) {
      text += `#### 📦 Anúncios da Conta (${result.total || result.anuncios.length} itens)\n`;
      text += '| Item ID | Título | Preço | Estoque | Status | Margem Líquida |\n';
      text += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
      for (const a of result.anuncios.slice(0, 10)) {
        const margem = a.financeiro?.margem_percent !== undefined ? `${a.financeiro.margem_percent}%` : '-';
        text += `| \`${a.item_id}\` | ${a.titulo} | R$ ${a.preco?.toFixed(2) || '0.00'} | ${a.estoque} un. | ${a.status} | **${margem}** |\n`;
      }
      text += '\n';
    } else if (tool_name === 'obter_detalhes_anuncio_ml') {
      text += `#### 🔍 Diagnóstico do Anúncio: **${result.titulo}** (\`${result.item_id}\`)\n`;
      text += `- **Preço Atual:** R$ ${result.preco?.toFixed(2) || '0.00'}\n`;
      text += `- **Estoque Disponível:** ${result.estoque} unidades (${result.status})\n`;
      if (result.financeiro) {
        text += `- **Comissão ML:** R$ ${result.financeiro.taxa_ml_total?.toFixed(2) || '0.00'}\n`;
        text += `- **Frete Vendedor:** R$ ${result.financeiro.frete_vendedor?.toFixed(2) || '0.00'}\n`;
        text += `- **Valor Líquido Recebido:** R$ ${result.financeiro.valor_liquido?.toFixed(2) || '0.00'}\n`;
        text += `- **Margem Líquida Estimada:** **${result.financeiro.margem_percent || 0}%**\n`;
      }
      text += '\n';
    } else if (tool_name === 'consultar_reputacao_e_metricas_ml') {
      text += '#### 🏅 Reputação & Qualidade Operacional da Conta\n';
      text += `- **Vendedor:** ${result.apelido || 'N/A'} (Termômetro: \`${result.nivel_reputacao}\`)\n`;
      text += `- **Medalha:** ${result.medalha_mercadolider || 'Nenhuma'}\n`;
      text += `- **Saúde Operacional:** **${result.status_saude_conta}**\n`;
      text += `- **Taxa de Reclamações:** ${result.metricas?.taxa_reclamacoes_percent || 0}%\n`;
      text += `- **Atraso no Envio:** ${result.metricas?.taxa_despachos_atrasados_percent || 0}%\n`;
      text += `- **Cancelamentos:** ${result.metricas?.taxa_cancelamentos_percent || 0}%\n\n`;
    }
  }

  return text || 'Consulta concluída com sucesso.';
}

/**
 * Executa heuristicamente a ferramenta adequada com base na intenção da pergunta
 * caso a API do Gemini esteja temporariamente com cota esgotada (429) ou instabilidade (503)
 */
async function executeHeuristicToolFallback(userMessage, db, agent) {
  const lower = (userMessage || '').toLowerCase();
  const executedActions = [];

  let dias = null;
  if (lower.includes('12 meses') || lower.includes('1 ano') || lower.includes('um ano') || lower.includes('365 dias')) {
    dias = 365;
  } else if (lower.includes('6 meses') || lower.includes('180 dias')) {
    dias = 180;
  } else if (lower.includes('3 meses') || lower.includes('90 dias')) {
    dias = 90;
  } else if (lower.includes('2 meses') || lower.includes('60 dias')) {
    dias = 60;
  } else if (lower.includes('30 dias') || lower.includes('1 mes') || lower.includes('um mes') || lower.includes('último mês')) {
    dias = 30;
  } else if (lower.includes('7 dias') || lower.includes('1 semana') || lower.includes('uma semana')) {
    dias = 7;
  }

  try {
    if (lower.includes('venda') || lower.includes('pedido') || lower.includes('vendido') || lower.includes('faturamento') || lower.includes('ticket') || lower.includes('margem') || lower.includes('mais vendid') || lower.includes('campeão') || lower.includes('campeao')) {
      logger.info(`[AgentManager:Contingência] Executando consulta direta de vendas, faturamento e margens (dias: ${dias || 'todos'})...`);
      const args = dias ? { dias } : {};
      const res = await toolExecutors.consultar_vendas_e_pedidos_ml(args, { db, agentId: agent?.id });
      executedActions.push({ tool_name: 'consultar_vendas_e_pedidos_ml', args, result: res });
    } else if (lower.includes('anuncio') || lower.includes('anúncio') || lower.includes('estoque') || lower.includes('preço') || lower.includes('preco')) {
      logger.info('[AgentManager:Contingência] Executando consulta direta de anúncios e estoque...');
      const res = await toolExecutors.buscar_anuncios_ml({ limit: 30 }, { db, agentId: agent?.id });
      executedActions.push({ tool_name: 'buscar_anuncios_ml', args: { limit: 30 }, result: res });
    } else if (lower.includes('reputa') || lower.includes('saude') || lower.includes('saúde') || lower.includes('reclam')) {
      logger.info('[AgentManager:Contingência] Executando consulta direta de reputação e métricas...');
      const res = await toolExecutors.consultar_reputacao_e_metricas_ml({}, { db, agentId: agent?.id });
      executedActions.push({ tool_name: 'consultar_reputacao_e_metricas_ml', args: {}, result: res });
    }
  } catch (err) {
    logger.warn(`[AgentManager:Contingência] Erro na execução heurística: ${err.message}`);
  }

  return executedActions;
}

