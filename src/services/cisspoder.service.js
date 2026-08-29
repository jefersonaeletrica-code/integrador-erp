import { getLogger } from '../core/logger.js';
import { axiosInstance } from './api.service.js';

const logger = getLogger();

const CISSPODER_CLIENT_ID = 'cisspoder-oauth';
const CISSPODER_CLIENT_SECRET = 'poder7547';

export async function getCissPoderConnectionStatus(connection, db) {
    try {
        await ensureCissPoderTokenIsValid(connection, db);
        return 'connected';
    } catch (error) {
        logger.error(`[CissPoderService] Verificação de status falhou para conexão ${connection.id}:`, error.message);
        return 'disconnected';
    }
}

export async function ensureCissPoderTokenIsValid(connection, db) {
    const { access_token, token_expires_at } = connection.credentials;
    if (!access_token || !token_expires_at || Date.now() >= token_expires_at - 60000) {
        logger.info(`[CissPoderService] Token para conexão ${connection.id} está ausente ou expirado. Renovando...`);
        try {
            await refreshCissPoderToken(connection, db);
            logger.info(`[CissPoderService] Token para conexão ${connection.id} renovado com sucesso.`);
        } catch (error) {
            const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
            logger.error(`[CissPoderService] Falha ao renovar o token para a conexão ${connection.id}:`, errorDetails);
            throw new Error('Falha ao renovar o token do CissPoder. Verifique as credenciais.');
        }
    }
}

async function refreshCissPoderToken(connection, db) {
    let { auth_url, username, password } = connection.credentials;

    const urlObject = new URL(auth_url);
    urlObject.pathname = '/cisspoder-auth/oauth/token';
    auth_url = urlObject.toString();
    const response = await axiosInstance.post(auth_url,
        new URLSearchParams({
            grant_type: 'password',
            username,
            password,
            client_id: CISSPODER_CLIENT_ID,
            client_secret: CISSPODER_CLIENT_SECRET
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );

    connection.credentials.access_token = response.data.access_token;
    connection.credentials.token_expires_at = Date.now() + (response.data.expires_in * 1000);
    await db.updateDb({ connection });
}

async function fetchCissPoderPriceAndStock(connection, products) {
    if (!products || products.length === 0) return products;

    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/produtos/consulta';
    const url = authUrlObject.toString();
    const productIds = products.map(p => p.codigo);

    try {
        const response = await axiosInstance.post(url, { idsubproduto: productIds }, {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}`, 'Content-Type': 'application/json' }
        });
        const priceStockMap = new Map(response.data.map(p => [p.idsubproduto, { preco: p.precovenda, estoque: p.saldodisponivel }]));
        return products.map(p => ({ ...p, ...priceStockMap.get(p.codigo) }));
    } catch (error) {
        logger.error(`[CissPoderService] Falha ao buscar preço e estoque para ${productIds.length} produtos.`, error);
        return products;
    }
}

async function fetchCissPoderProductPage(connection, page, clausulas = []) {
    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/cad_produtos';
    const url = authUrlObject.toString();

    const payload = {
        page,
        clausulas,
        ordenacoes: [{ campo: "descrcomproduto", direcao: "ASC" }]
    };

    try {
        const response = await axiosInstance.post(url, payload, {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}`, 'Content-Type': 'application/json' }
        });

        const productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        const uniqueProducts = Array.from(new Map(productsArray.map(p => [p.idsubproduto, p])).values());

        const data = uniqueProducts.map(p => ({
            codigo: p.idsubproduto,
            nome: p.descrcomproduto,
            marca: p.descricao
        }));

        const enrichedData = await fetchCissPoderPriceAndStock(connection, data);
        return { data: enrichedData, total: response.data.total, hasNext: response.data.hasNext };
    } catch (error) {
        logger.error(`[CissPoderService] Falha ao buscar produtos. URL: ${url}`, error);
        throw error;
    }
}

export const fetchProductsByName = async (connection, name, pagina = 1) => {
    const searchWords = name.trim().split(/\s+/).filter(Boolean);
    const combinedSearchTerm = `%${searchWords.join('%')}%`;
    const clausulas = [{ campo: "descrcomproduto", valor: combinedSearchTerm, operador: "LIKE" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

export const fetchProductsByCode = async (connection, code, pagina = 1) => {
    const clausulas = [{ campo: "idsubproduto", valor: code, operadorlogico: "AND", operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

export const fetchAllProducts = async (connection, pagina = 1) => {
    const clausulas = [{ campo: "flaginativo", valor: "F", operadorlogico: "AND", operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};