import { getLogger } from '../core/logger.js';
import { axiosInstance } from './api.service.js';

const logger = getLogger();

export async function getBlingConnectionStatus(connection, db) {
    if (!connection.credentials || !connection.credentials.access_token) {
        return 'requires_auth';
    }

    try {
        await axiosInstance.get('https://api.bling.com.br/Api/v3/contatos?limite=1', {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` }
        });
        return 'connected';
    } catch (error) {
        if (error.response && error.response.status === 401) {
            logger.warn(`[BlingService] Token para a conexão ${connection.id} expirou. Tentando renovar...`);
            try {
                await refreshAccessToken(connection, db);
                logger.info(`[BlingService] Token para a conexão ${connection.id} renovado com sucesso.`);
                return 'connected';
            } catch (refreshError) {
                const refreshErrorDetails = refreshError.response ? JSON.stringify(refreshError.response.data) : refreshError.message;
                logger.error(`[BlingService] Falha ao renovar o token para a conexão ${connection.id}:`, refreshErrorDetails);
                return 'disconnected';
            }
        }
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`[BlingService] Erro ao verificar status da conexão ${connection.id}:`, errorDetails);
        return 'error';
    }
}

export async function refreshAccessToken(connection, db) {
    if (connection.type !== 'bling' || !connection.credentials.refresh_token) {
        throw new Error('Apenas conexões Bling com refresh token podem ser atualizadas.');
    }
    const { client_id, client_secret, refresh_token } = connection.credentials;
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const response = await axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token',
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
        { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    connection.credentials.access_token = response.data.access_token;
    connection.credentials.refresh_token = response.data.refresh_token;
    await db.updateDb({ connection });
}

const buildBlingProductUrl = (page, searchParams = {}) => {
    const params = new URLSearchParams();
    params.set('pagina', String(page));
    params.set('limite', '100');

    for (const key in searchParams) {
        if (searchParams[key]) {
            params.set(key, searchParams[key]);
        }
    }
    return `https://api.bling.com.br/Api/v3/produtos?${params.toString()}`;
};

const fetchBlingProductPage = async (connection, page, searchParams = {}) => {
    const url = buildBlingProductUrl(page, searchParams);
    logger.debug(`[BlingService] Buscando URL: ${url}`);

    const response = await axiosInstance.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
    return response.data;
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    return words.join(' ');
};

export const fetchProductsByName = async (connection, name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5',
        tipo: 'T',
        nome: `%${searchTerm}`
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

export const fetchProductsByCode = async (connection, code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T',
        codigo: code
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

export const fetchAllProducts = async (connection, pagina = 1) => {
    const searchParams = { criterio: 2 };
    return fetchBlingProductPage(connection, pagina, searchParams);
};