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
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.args || {}
            }
          });
        }
      }
      if (parts.length > 0) {
        contents.push({ role: 'model', parts });
      }
    } else if (msg.sender === 'tool' && Array.isArray(msg.tool_results)) {
      const parts = msg.tool_results.map(tr => ({
        functionResponse: {
          name: tr.name,
          response: { result: tr.result }
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

  const model = agent.model || aiSettings.default_model || 'gemini-2.5-flash';
  const systemPrompt = agent.system_prompt;
  const requireConfirmation = agent.require_confirmation;

  // 2. Filtra as ferramentas permitidas para este agente
  const allowedToolNames = new Set(agent.allowed_tools || []);
  const availableTools = toolDeclarations.filter(t => allowedToolNames.has(t.name));

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
  const maxLoops = 6;
  let finalAssistantText = '';
  const executedActions = [];
  const pendingActions = [];

  // 5. Loop de Function Calling (Execução iterativa das ferramentas)
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

    // Registra a mensagem do modelo com as chamadas de função no histórico
    await dbManager.saveAIMessage({
      conversation_id: conversationId,
      sender: 'assistant',
      content: geminiRes.text || '',
      tool_calls: functionCalls
    });

    // Adiciona ao contents para o próximo ciclo
    const modelParts = [];
    if (geminiRes.text) modelParts.push({ text: geminiRes.text });
    for (const fc of functionCalls) {
      modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
    }
    contents.push({ role: 'model', parts: modelParts });

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
        // Ferramenta de leitura ou execução autônoma permitida
        const executor = toolExecutors[fc.name];
        let result;
        let status = 'executed';

        if (typeof executor === 'function') {
          try {
            result = await executor(fc.args, { db });
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

    // Formata o retorno das ferramentas para enviar de volta ao Gemini
    const userToolParts = toolResults.map(tr => ({
      functionResponse: {
        name: tr.name,
        response: { result: tr.result }
      }
    }));
    contents.push({ role: 'user', parts: userToolParts });
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
