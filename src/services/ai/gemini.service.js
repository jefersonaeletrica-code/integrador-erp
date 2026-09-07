import axios from 'axios';
import { getLogger } from '../../core/logger.js';

const logger = getLogger();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Lista de modelos oficiais ativos suportados pelo Gemini no endpoint v1beta
 */
export const SUPPORTED_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview'
];

/**
 * Consulta a lista de modelos de chat ativos e suportados diretamente da API do Gemini para a chave informada
 * @param {string} apiKey - Chave da API
 * @returns {Promise<Array<object>>} Lista de modelos com generateContent habilitado
 */
export async function listAvailableGeminiModels(apiKey) {
  if (!apiKey || !apiKey.trim()) return [];
  const cleanKey = apiKey.trim();
  try {
    const url = `${GEMINI_API_BASE}/models?key=${cleanKey}`;
    const res = await axios.get(url, { timeout: 12000 });
    const models = res.data?.models || [];
    
    // Filtra apenas modelos de conversação/geração geral ativos (geração 3.x)
    const isChatGeminiModel = (id) => {
      if (!id || !id.startsWith('gemini-')) return false;
      const lower = id.toLowerCase();
      // Ignora versões descontinuadas (1.x, 2.x, 2.5) e modelos não conversacionais
      if (lower.startsWith('gemini-1.') || lower.startsWith('gemini-2.') || lower.startsWith('gemini-2.5-') ||
          lower.includes('image') || lower.includes('tts') || lower.includes('transcribe') || 
          lower.includes('audio') || lower.includes('robotics') || lower.includes('computer-use') ||
          lower.includes('embedding') || lower.includes('aqa') || lower.includes('imagen') ||
          lower.includes('banana') || lower.includes('customtools') || lower.includes('clip') ||
          lower.includes('vision') || lower.includes('pro-vision')) {
        return false;
      }
      return true;
    };

    return models
      .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => {
        const id = m.name ? m.name.replace(/^models\//, '') : '';
        return {
          id,
          name: m.displayName || id,
          description: m.description || '',
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit
        };
      })
      .filter(m => isChatGeminiModel(m.id));
  } catch (error) {
    logger.warn(`[GeminiService] Não foi possível consultar ListModels da API Gemini (${error.message}).`);
    return [];
  }
}

/**
 * Testa a validade de uma chave de API do Gemini fazendo uma requisição rápida de ping
 * @param {string} apiKey - Chave da API do Google AI Studio / Gemini
 * @param {string} model - Modelo a testar (padrão: 'gemini-3.6-flash')
 * @returns {Promise<object>} Status do teste
 */
export async function testGeminiApiKey(apiKey, model = 'gemini-3.6-flash') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API do Gemini não foi informada.');
  }

  const cleanKey = apiKey.trim();
  
  // Tenta obter os modelos habilitados para esta chave
  const availableModels = await listAvailableGeminiModels(cleanKey);
  const availableIds = availableModels.map(m => m.id);

  const requestedModel = (model || '').trim() || 'gemini-3.6-flash';

  const modelsToTry = [
    requestedModel,
    ...availableIds,
    ...SUPPORTED_MODELS
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = null;

  for (const candidateModel of modelsToTry) {
    try {
      const url = `${GEMINI_API_BASE}/models/${candidateModel}:generateContent?key=${cleanKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Responda apenas a palavra: OK' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        sucesso: true,
        modelo: candidateModel,
        resposta: reply.trim(),
        available_models: availableModels.length > 0 ? availableModels : SUPPORTED_MODELS.map(id => ({ id, name: id })),
        mensagem: `Conexão com a API do Google Gemini validada com sucesso no modelo "${candidateModel}"!`
      };
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      if (statusCode === 400 && error.response?.data?.error?.message?.includes('API_KEY_INVALID')) {
        throw new Error('Chave de API do Google Gemini inválida. Verifique se copiou a chave correta no Google AI Studio.');
      }
      if (statusCode === 403) {
        throw new Error(`Permissão negada (403): ${error.response?.data?.error?.message || error.message}`);
      }
      logger.warn(`[GeminiService] Modelo ${candidateModel} retornou erro ${statusCode || error.message}. Tentando próximo modelo...`);
    }
  }

  const errorMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Erro desconhecido';
  const statusCode = lastError?.response?.status;
  logger.error(`[GeminiService] Erro ao testar chave Gemini (${statusCode}): ${errorMsg}`);
  throw new Error(`Falha ao conectar com a API do Gemini (${statusCode || 'Rede'}): ${errorMsg}`);
}

/**
 * Executa uma chamada à API do Gemini com suporte a System Instruction, Tools e Histórico Conversacional
 * @param {object} params
 * @param {string} params.apiKey - Chave da API
 * @param {string} params.model - Modelo Gemini (ex: 'gemini-3.6-flash' ou 'gemini-3.5-flash-lite')
 * @param {string} params.systemPrompt - Instruções de sistema do agente
 * @param {Array} params.contents - Histórico de mensagens formatado para a API Gemini
 * @param {Array} params.tools - Declarações de ferramentas (schemas de functionDeclarations)
 * @param {number} params.temperature - Temperatura (0.0 a 1.0)
 * @param {number} params.maxOutputTokens - Limite de tokens de saída
 * @returns {Promise<object>} Resposta bruta do modelo contendo text e functionCalls
 */
export async function generateGeminiContent({
  apiKey,
  model = 'gemini-3.6-flash',
  systemPrompt = '',
  contents = [],
  tools = [],
  temperature = 0.2,
  maxOutputTokens = 4096
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API do Gemini não configurada. Acesse Configurações IA para cadastrar sua chave.');
  }

  const cleanKey = apiKey.trim();

  // Modelos suportados válidos para fallback
  const requestedModel = (model || '').trim() || 'gemini-3.6-flash';

  const modelsToTry = [
    requestedModel,
    ...SUPPORTED_MODELS
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const requestBody = {
    contents,
    generationConfig: {
      temperature: parseFloat(temperature) || 0.2,
      maxOutputTokens: parseInt(maxOutputTokens, 10) || 4096
    }
  };

  // Adiciona System Instruction sem o campo 'role' (compatível com OpenAPI Gemini REST v1beta)
  if (systemPrompt && systemPrompt.trim()) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt.trim() }]
    };
  }

  // Adiciona Tools (Function Declarations) se fornecidas
  if (Array.isArray(tools) && tools.length > 0) {
    requestBody.tools = [
      {
        functionDeclarations: tools
      }
    ];
  }

  let lastError = null;

  for (const candidateModel of modelsToTry) {
    try {
      const url = `${GEMINI_API_BASE}/models/${candidateModel}:generateContent?key=${cleanKey}`;
      const response = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000 // 20 segundos máx por modelo para evitar travamentos
      });

      const candidate = response.data?.candidates?.[0];
      if (!candidate) {
        throw new Error('Nenhuma resposta gerada pelo modelo Gemini.');
      }

      const parts = candidate.content?.parts || [];
      let textContent = '';
      const functionCalls = [];

      for (const part of parts) {
        if (part.text) {
          textContent += part.text;
        }
        if (part.functionCall) {
          functionCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args || {}
          });
        }
      }

      return {
        text: textContent,
        functionCalls,
        modelUsed: candidateModel,
        finishReason: candidate.finishReason,
        usageMetadata: response.data?.usageMetadata || null,
        rawCandidate: candidate
      };
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      const errorDetail = error.response?.data?.error?.message || error.message;

      if (statusCode === 401 || statusCode === 403 || errorDetail.includes('API_KEY_INVALID')) {
        throw new Error(`Erro de autenticação Gemini (${statusCode}): ${errorDetail}`);
      }

      // Se for 429 (cota do modelo esgotada), pula imediatamente para o próximo modelo do pool de fallback
      if (statusCode === 429) {
        logger.warn(`[GeminiService] Cota esgotada (429) no modelo "${candidateModel}". Alternando instantaneamente para o próximo modelo disponível...`);
        continue;
      }

      // Se for 503 (alta demanda temporária no Google) ou timeout, tenta o próximo modelo do pool
      if (statusCode === 503 || error.code === 'ECONNABORTED' || errorDetail.includes('high demand') || errorDetail.includes('unavailable')) {
        logger.warn(`[GeminiService] Modelo "${candidateModel}" indisponível/sobrecarregado (${statusCode || error.code}). Alternando para o próximo modelo disponível...`);
        continue;
      }

      logger.warn(`[GeminiService] Modelo "${candidateModel}" falhou (Status: ${statusCode || 'Erro'}): ${errorDetail}`);

      // Se o erro for 400 Bad Request que não seja relacionado ao nome do modelo, propaga
      if (statusCode === 400 && !errorDetail.toLowerCase().includes('model') && !errorDetail.toLowerCase().includes('not found')) {
        throw new Error(`Erro nos parâmetros enviados para o Gemini (400): ${errorDetail}`);
      }
    }
  }

  const errorMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Erro desconhecido';
  const statusCode = lastError?.response?.status;
  logger.error(`[GeminiService] Erro na requisição Gemini (${statusCode}): ${errorMsg}`);
  throw new Error(`Erro na API do Gemini (${statusCode || 'Erro'}): ${errorMsg}`);
}
