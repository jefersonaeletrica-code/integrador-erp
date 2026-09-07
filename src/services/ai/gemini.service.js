import axios from 'axios';
import { getLogger } from '../../core/logger.js';

const logger = getLogger();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Lista de modelos oficiais padrão suportados pelo Gemini
 */
export const SUPPORTED_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite'
];

/**
 * Testa a validade de uma chave de API do Gemini fazendo uma requisição rápida de ping
 * @param {string} apiKey - Chave da API do Google AI Studio / Gemini
 * @param {string} model - Modelo a testar (padrão: 'gemini-1.5-flash')
 * @returns {Promise<object>} Status do teste
 */
export async function testGeminiApiKey(apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API do Gemini não foi informada.');
  }

  const cleanKey = apiKey.trim();
  const modelsToTry = [
    model.trim(),
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
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
        mensagem: `Conexão com a API do Google Gemini validada com sucesso no modelo ${candidateModel}!`
      };
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      // Se for erro de autenticação (400 ou 403 API Key inválida), para imediatamente
      if (statusCode === 400 && error.response?.data?.error?.message?.includes('API_KEY_INVALID')) {
        throw new Error('Chave de API do Google Gemini inválida. Verifique se copiou a chave correta no Google AI Studio.');
      }
      if (statusCode === 403) {
        throw new Error(`Permissão negada (403): ${error.response?.data?.error?.message || error.message}`);
      }
      // Se for 404 de modelo não encontrado, tenta o próximo modelo da lista
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
 * @param {string} params.model - Modelo Gemini (ex: 'gemini-1.5-flash' ou 'gemini-2.0-flash')
 * @param {string} params.systemPrompt - Instruções de sistema do agente
 * @param {Array} params.contents - Histórico de mensagens formatado para a API Gemini
 * @param {Array} params.tools - Declarações de ferramentas (schemas de functionDeclarations)
 * @param {number} params.temperature - Temperatura (0.0 a 1.0)
 * @param {number} params.maxOutputTokens - Limite de tokens de saída
 * @returns {Promise<object>} Resposta bruta do modelo contendo text e functionCalls
 */
export async function generateGeminiContent({
  apiKey,
  model = 'gemini-1.5-flash',
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
  const modelsToTry = [
    model.trim(),
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const requestBody = {
    contents,
    generationConfig: {
      temperature: parseFloat(temperature) || 0.2,
      maxOutputTokens: parseInt(maxOutputTokens, 10) || 4096
    }
  };

  // Adiciona System Instruction se fornecida
  if (systemPrompt && systemPrompt.trim()) {
    requestBody.systemInstruction = {
      role: 'system',
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
        timeout: 60000
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
      if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        throw new Error(`Erro de autenticação/permissão Gemini (${statusCode}): ${errorMsg}`);
      }
      logger.warn(`[GeminiService] Modelo ${candidateModel} falhou com status ${statusCode || error.message}. Tentando próximo...`);
    }
  }

  const errorMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Erro desconhecido';
  const statusCode = lastError?.response?.status;
  logger.error(`[GeminiService] Erro na requisição Gemini (${statusCode}): ${errorMsg}`);
  throw new Error(`Erro na API do Gemini (${statusCode || 'Erro'}): ${errorMsg}`);
}

