import axios from 'axios';
import { getLogger } from '../../core/logger.js';

const logger = getLogger();

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Testa a validade de uma chave de API do Gemini fazendo uma requisição rápida de ping
 * @param {string} apiKey - Chave da API do Google AI Studio / Gemini
 * @param {string} model - Modelo a testar (padrão: 'gemini-2.5-flash')
 * @returns {Promise<object>} Status do teste
 */
export async function testGeminiApiKey(apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API do Gemini não foi informada.');
  }

  const cleanKey = apiKey.trim();
  const cleanModel = model.trim() || 'gemini-2.5-flash';

  try {
    const url = `${GEMINI_API_BASE}/models/${cleanModel}:generateContent?key=${cleanKey}`;
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
      modelo: cleanModel,
      resposta: reply.trim(),
      mensagem: 'Conexão com a API do Google Gemini validada com sucesso!'
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    const statusCode = error.response?.status;
    logger.error(`[GeminiService] Erro ao testar chave Gemini (${statusCode}): ${errorMsg}`);
    throw new Error(`Falha ao conectar com a API do Gemini (${statusCode || 'Rede'}): ${errorMsg}`);
  }
}

/**
 * Executa uma chamada à API do Gemini com suporte a System Instruction, Tools e Histórico Conversacional
 * @param {object} params
 * @param {string} params.apiKey - Chave da API
 * @param {string} params.model - Modelo Gemini (ex: 'gemini-2.5-flash' ou 'gemini-2.5-pro')
 * @param {string} params.systemPrompt - Instruções de sistema do agente
 * @param {Array} params.contents - Histórico de mensagens formatado para a API Gemini
 * @param {Array} params.tools - Declarações de ferramentas (schemas de functionDeclarations)
 * @param {number} params.temperature - Temperatura (0.0 a 1.0)
 * @param {number} params.maxOutputTokens - Limite de tokens de saída
 * @returns {Promise<object>} Resposta bruta do modelo contendo text e functionCalls
 */
export async function generateGeminiContent({
  apiKey,
  model = 'gemini-2.5-flash',
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
  const cleanModel = model.trim() || 'gemini-2.5-flash';
  const url = `${GEMINI_API_BASE}/models/${cleanModel}:generateContent?key=${cleanKey}`;

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

  try {
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
      finishReason: candidate.finishReason,
      usageMetadata: response.data?.usageMetadata || null,
      rawCandidate: candidate
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    const statusCode = error.response?.status;
    logger.error(`[GeminiService] Erro na requisição Gemini (${statusCode}): ${errorMsg}`);
    throw new Error(`Erro na API do Gemini (${statusCode || 'Erro'}): ${errorMsg}`);
  }
}

