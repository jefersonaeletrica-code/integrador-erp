import express from 'express';
import { getLogger } from '../core/logger.js';
import * as dbManager from '../database/db.mysql.js';
import * as geminiService from '../services/ai/gemini.service.js';
import * as agentManager from '../services/ai/agentManager.js';
import { toolDeclarations } from '../services/ai/agentTools.js';

const logger = getLogger();

export default function createAIRoutes(db) {
  const router = express.Router();

  /**
   * GET /ai/settings - Obtém configurações do módulo de IA
   */
  router.get('/ai/settings', async (req, res) => {
    try {
      const settings = await dbManager.getAISettings();
      const rawKey = settings.gemini_api_key || process.env.GEMINI_API_KEY || '';
      
      // Mascara a chave para exibição segura na interface
      let maskedKey = '';
      if (rawKey.length > 8) {
        maskedKey = rawKey.substring(0, 6) + '...' + rawKey.substring(rawKey.length - 4);
      } else if (rawKey.length > 0) {
        maskedKey = '******';
      }

      res.json({
        sucesso: true,
        settings: {
          ...settings,
          has_key: !!rawKey,
          masked_key: maskedKey
        }
      });
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao buscar configurações de IA: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/settings - Salva configurações de IA
   */
  router.post('/ai/settings', async (req, res) => {
    try {
      const { gemini_api_key, default_model, temperature, max_output_tokens, is_active } = req.body;
      const current = await dbManager.getAISettings();

      const newSettings = {
        gemini_api_key: gemini_api_key !== undefined && gemini_api_key.trim() !== '' 
          ? gemini_api_key.trim() 
          : (gemini_api_key === '' ? null : current.gemini_api_key),
        default_model: default_model || current.default_model || 'gemini-2.5-flash',
        temperature: temperature !== undefined ? parseFloat(temperature) : (current.temperature || 0.2),
        max_output_tokens: max_output_tokens !== undefined ? parseInt(max_output_tokens, 10) : (current.max_output_tokens || 4096),
        is_active: is_active !== undefined ? !!is_active : current.is_active
      };

      const saved = await dbManager.saveAISettings(newSettings);
      res.json({
        sucesso: true,
        mensagem: 'Configurações de IA salvas com sucesso!',
        settings: saved
      });
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao salvar configurações de IA: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/settings/test - Testa a conexão com a API do Gemini
   */
  router.post('/ai/settings/test', async (req, res) => {
    try {
      let { apiKey, model } = req.body;
      if (!apiKey || !apiKey.trim()) {
        const settings = await dbManager.getAISettings();
        apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({ sucesso: false, erro: 'Informe a Chave de API do Gemini para realizar o teste.' });
      }

      const result = await geminiService.testGeminiApiKey(apiKey, model || 'gemini-2.5-flash');
      res.json(result);
    } catch (error) {
      res.status(400).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * GET /ai/agents - Lista todos os agentes cadastrados
   */
  router.get('/ai/agents', async (req, res) => {
    try {
      const agents = await dbManager.getAIAgents();
      res.json({
        sucesso: true,
        agents,
        available_tools: toolDeclarations.map(t => ({
          name: t.name,
          description: t.description
        }))
      });
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao listar agentes: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * GET /ai/agents/:id - Obtém dados de um agente
   */
  router.get('/ai/agents/:id', async (req, res) => {
    try {
      const agent = await dbManager.getAIAgentById(req.params.id);
      if (!agent) {
        return res.status(404).json({ sucesso: false, erro: 'Agente não encontrado.' });
      }
      res.json({ sucesso: true, agent });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/agents - Cria ou edita um agente
   */
  router.post('/ai/agents', async (req, res) => {
    try {
      const agentData = req.body;
      if (!agentData.name || !agentData.slug || !agentData.system_prompt) {
        return res.status(400).json({ sucesso: false, erro: 'Nome, Identificador (slug) e Prompt de Sistema são obrigatórios.' });
      }

      const saved = await dbManager.saveOrUpdateAIAgent(agentData);
      res.json({
        sucesso: true,
        mensagem: 'Agente salvo com sucesso!',
        agent: saved
      });
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao salvar agente: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * GET /ai/conversations - Lista conversas recentes
   */
  router.get('/ai/conversations', async (req, res) => {
    try {
      const { agentId } = req.query;
      const conversations = await dbManager.getAIConversations(agentId ? parseInt(agentId, 10) : null);
      res.json({ sucesso: true, conversations });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/conversations - Cria uma nova conversa
   */
  router.post('/ai/conversations', async (req, res) => {
    try {
      const { agent_id, title } = req.body;
      if (!agent_id) {
        return res.status(400).json({ sucesso: false, erro: 'ID do agente é obrigatório.' });
      }

      const conv = await dbManager.createAIConversation(parseInt(agent_id, 10), title || 'Nova Análise');
      res.json({ sucesso: true, conversation: conv });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * GET /ai/conversations/:id - Obtém detalhes e mensagens de uma conversa
   */
  router.get('/ai/conversations/:id', async (req, res) => {
    try {
      const convId = parseInt(req.params.id, 10);
      const conversation = await dbManager.getAIConversationById(convId);
      if (!conversation) {
        return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada.' });
      }

      const messages = await dbManager.getAIMessages(convId);
      res.json({
        sucesso: true,
        conversation,
        messages
      });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * DELETE /ai/conversations/:id - Exclui uma conversa
   */
  router.delete('/ai/conversations/:id', async (req, res) => {
    try {
      const convId = parseInt(req.params.id, 10);
      await dbManager.deleteAIConversation(convId);
      res.json({ sucesso: true, mensagem: 'Conversa excluída com sucesso.' });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/chat - Envia mensagem do usuário para um agente de IA
   */
  router.post('/ai/chat', async (req, res) => {
    try {
      const { agent_id, conversation_id, message } = req.body;

      if (!agent_id) {
        return res.status(400).json({ sucesso: false, erro: 'ID do agente é obrigatório.' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ sucesso: false, erro: 'Mensagem não pode estar vazia.' });
      }

      let convId = conversation_id ? parseInt(conversation_id, 10) : null;
      if (!convId) {
        const newConv = await dbManager.createAIConversation(parseInt(agent_id, 10), message.substring(0, 30));
        convId = newConv.id;
      }

      const response = await agentManager.processAgentMessage({
        agentId: parseInt(agent_id, 10),
        conversationId: convId,
        message: message.trim(),
        db
      });

      res.json({
        ...response,
        conversation_id: convId
      });
    } catch (error) {
      logger.error(`[AIRoutes] Erro no chat com o agente: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/actions/:actionId/approve - Aprova e executa uma ação pendente
   */
  router.post('/ai/actions/:actionId/approve', async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId, 10);
      const result = await agentManager.approvePendingAction(actionId, db);
      res.json(result);
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao aprovar ação: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * POST /ai/actions/:actionId/reject - Rejeita uma ação pendente
   */
  router.post('/ai/actions/:actionId/reject', async (req, res) => {
    try {
      const actionId = parseInt(req.params.actionId, 10);
      const result = await agentManager.rejectPendingAction(actionId, db);
      res.json(result);
    } catch (error) {
      logger.error(`[AIRoutes] Erro ao rejeitar ação: ${error.message}`);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  /**
   * GET /ai/logs - Lista histórico de ações e ferramentas executadas
   */
  router.get('/ai/logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const logs = await dbManager.getAIActionLogs(limit);
      res.json({ sucesso: true, logs });
    } catch (error) {
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  return router;
}
