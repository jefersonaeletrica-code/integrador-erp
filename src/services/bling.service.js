import { axiosInstance } from './api.service.js';
import { getLogger } from '../core/logger.js';

const logger = getLogger();

/**
 * Obtém o status da conexão com o Bling, renovando o token se necessário.
 * @param {object} connection - Objeto de conexão do ERP.
 * @param {object} db - Instância do banco de dados.
 * @returns {Promise<string>} O status da conexão ('connected', 'requires_auth', 'error').
 */
export async function getBlingConnectionStatus(connection, db) {
    const { credentials } = connection;
    if (!credentials.refresh_token) {
        return 'requires_auth';
    }

    try {
        // Tenta renovar o token para validar a conexão
        const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
        const response = await axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token',
            new URLSearchParams({ grant_type: 'refresh_token', refresh_token: credentials.refresh_token }),
            { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Atualiza os tokens no banco de dados
        connection.credentials.access_token = response.data.access_token;
        connection.credentials.refresh_token = response.data.refresh_token;
        await db.updateDb({ connection });

        return 'connected';
    } catch (error) {
        logger.error(`[BlingService] Falha ao renovar token para conexão ${connection.id}.`, error);
        return 'error';
    }
}

/**
 * Busca produtos no Bling pelo código (SKU).
 * @param {object} connection - Objeto de conexão do ERP.
 * @param {string} code - O código do produto.
 * @param {number} page - O número da página a ser buscada.
 * @returns {Promise<object>} A resposta da API do Bling.
 */
export async function fetchProductsByCode(connection, code, page = 1) {
    const { access_token } = connection.credentials;
    const response = await axiosInstance.get(`https://www.bling.com.br/Api/v3/produtos?pagina=${page}&limite=100&criterio=2&codigo=${encodeURIComponent(code)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    return response.data;
}

/**
 * Busca produtos no Bling pelo nome.
 * @param {object} connection - Objeto de conexão do ERP.
 * @param {string} name - O nome do produto.
 * @param {number} page - O número da página a ser buscada.
 * @returns {Promise<object>} A resposta da API do Bling.
 */
export async function fetchProductsByName(connection, name, page = 1) {
    const { access_token } = connection.credentials;
    const response = await axiosInstance.get(`https://www.bling.com.br/Api/v3/produtos?pagina=${page}&limite=100&criterio=1&nome=${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    return response.data;
}

/**
 * Busca todos os produtos do Bling (paginado).
 * @param {object} connection - Objeto de conexão do ERP.
 * @param {number} page - O número da página a ser buscada.
 * @returns {Promise<object>} A resposta da API do Bling.
 */
export async function fetchAllProducts(connection, page = 1) {
    const { access_token } = connection.credentials;
    const response = await axiosInstance.get(`https://www.bling.com.br/Api/v3/produtos?pagina=${page}&limite=100`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    return response.data;
}