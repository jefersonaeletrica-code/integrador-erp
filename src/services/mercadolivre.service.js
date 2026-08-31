import axios from 'axios';
import { getLogger } from '../core/logger.js';

const logger = getLogger();
const MELI_API_BASE = 'https://api.mercadolibre.com';
const MELI_AUTH_BASE = 'https://auth.mercadolivre.com.br';

/**
 * Cria uma instância do axios com timeout configurado para requisições do Mercado Livre
 */
const meliAxios = axios.create({
    baseURL: MELI_API_BASE,
    timeout: 15000,
});

/**
 * Gera a URL de autorização OAuth 2.0 para o Mercado Livre
 * @param {object} connection - Conexão do Mercado Livre
 * @returns {string} URL para redirecionar o usuário
 */
export function getAuthUrl(connection) {
    const { client_id, redirect_uri } = connection.credentials || {};
    if (!client_id || !redirect_uri) {
        throw new Error('Client ID (App ID) e Redirect URI são obrigatórios para autenticação do Mercado Livre.');
    }
    const state = `connId=${connection.id}`;
    return `${MELI_AUTH_BASE}/authorization?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;
}

/**
 * Troca o código de autorização recebido no callback por access_token e refresh_token
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} code - Código de autorização retornado pelo ML
 * @returns {Promise<object>} Dados de autenticação atualizados
 */
export async function exchangeCodeForToken(connection, code) {
    const { client_id, client_secret, redirect_uri } = connection.credentials || {};
    if (!client_id || !client_secret || !redirect_uri) {
        throw new Error('Credenciais incompletas (client_id, client_secret, redirect_uri).');
    }

    try {
        logger.info(`[MercadoLivreService] Trocando código por token para conexão ID ${connection.id}...`);
        const response = await meliAxios.post('/oauth/token', new URLSearchParams({
            grant_type: 'authorization_code',
            client_id,
            client_secret,
            code,
            redirect_uri
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, user_id, expires_in } = response.data;
        const expires_at = Date.now() + (expires_in * 1000);

        // Busca informações do usuário/vendedor
        let nickname = '';
        let email = '';
        let site_id = 'MLB';

        try {
            const userRes = await meliAxios.get('/users/me', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            nickname = userRes.data.nickname || '';
            email = userRes.data.email || '';
            site_id = userRes.data.site_id || 'MLB';
        } catch (uErr) {
            logger.warn(`[MercadoLivreService] Não foi possível buscar perfil do usuário: ${uErr.message}`);
        }

        return {
            ...connection.credentials,
            access_token,
            refresh_token,
            user_id,
            expires_in,
            expires_at,
            nickname,
            email,
            site_id
        };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        logger.error(`[MercadoLivreService] Falha ao trocar code por token: ${errorMsg}`, error);
        throw new Error(`Falha na autorização com o Mercado Livre: ${errorMsg}`);
    }
}

/**
 * Renova o access_token utilizando o refresh_token
 * @param {object} connection - Conexão do Mercado Livre
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<string>} Novo access_token
 */
export async function refreshToken(connection, db) {
    const { client_id, client_secret, refresh_token } = connection.credentials || {};
    if (!refresh_token) {
        throw new Error('Refresh token não encontrado para esta conexão.');
    }

    try {
        logger.info(`[MercadoLivreService] Renovando token para conexão ID ${connection.id}...`);
        const response = await meliAxios.post('/oauth/token', new URLSearchParams({
            grant_type: 'refresh_token',
            client_id,
            client_secret,
            refresh_token
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;
        connection.credentials.access_token = data.access_token;
        connection.credentials.refresh_token = data.refresh_token;
        connection.credentials.user_id = data.user_id || connection.credentials.user_id;
        connection.credentials.expires_in = data.expires_in;
        connection.credentials.expires_at = Date.now() + (data.expires_in * 1000);

        if (db && typeof db.updateMarketplaceConnection === 'function') {
            await db.updateMarketplaceConnection(connection);
        }

        logger.info(`[MercadoLivreService] Token renovado com sucesso para conexão ID ${connection.id}.`);
        return data.access_token;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        logger.error(`[MercadoLivreService] Falha ao renovar token para conexão ${connection.id}: ${errorMsg}`, error);
        throw new Error(`Falha ao renovar autenticação com Mercado Livre: ${errorMsg}`);
    }
}

/**
 * Garante que a conexão possui um access_token válido, renovando se necessário
 * @param {object} connection - Conexão do Mercado Livre
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<string>} Access token válido
 */
export async function ensureValidToken(connection, db) {
    const { access_token, expires_at, refresh_token } = connection.credentials || {};

    if (!access_token && !refresh_token) {
        throw new Error('Conexão não autenticada com o Mercado Livre. Realize a autorização OAuth.');
    }

    // Se o token estiver perto de expirar (menos de 5 minutos) ou já expirou, renova
    const now = Date.now();
    const isExpiredOrNear = !expires_at || (expires_at - now < 300000);

    if (isExpiredOrNear && refresh_token) {
        return await refreshToken(connection, db);
    }

    return access_token;
}

/**
 * Obtém o status da conexão com o Mercado Livre
 * @param {object} connection - Objeto de conexão
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<string>} Status: 'connected', 'requires_auth', 'error'
 */
export async function getMarketplaceConnectionStatus(connection, db) {
    const { credentials } = connection;
    if (!credentials?.access_token && !credentials?.refresh_token) {
        return 'requires_auth';
    }

    try {
        await ensureValidToken(connection, db);
        return 'connected';
    } catch (error) {
        logger.warn(`[MercadoLivreService] Conexão ID ${connection.id} com erro de autenticação: ${error.message}`);
        return 'requires_auth';
    }
}

/**
 * Sugere/prevê categorias do Mercado Livre com base no título do produto
 * @param {string} title - Título ou nome do produto
 * @param {string} siteId - ID do site (padrão: 'MLB')
 * @returns {Promise<Array>} Lista de categorias sugeridas
 */
export async function predictCategory(title, siteId = 'MLB') {
    if (!title || !title.trim()) {
        return [];
    }

    try {
        logger.info(`[MercadoLivreService] Prevendo categoria para: "${title}"...`);
        // Tenta endpoint de domain_discovery
        const response = await meliAxios.get(`/sites/${siteId}/domain_discovery/search`, {
            params: { q: title.trim(), limit: 5 }
        });

        const results = response.data || [];
        return results.map(item => ({
            category_id: item.category_id,
            category_name: item.category_name,
            domain_id: item.domain_id,
            domain_name: item.domain_name,
            attributes: item.attributes || []
        }));
    } catch (error) {
        logger.warn(`[MercadoLivreService] Falha no domain_discovery: ${error.message}. Tentando category_predictor...`);
        try {
            const predRes = await meliAxios.get(`/sites/${siteId}/category_predictor/predict`, {
                params: { title: title.trim() }
            });
            const pred = predRes.data;
            if (pred?.id) {
                return [{
                    category_id: pred.id,
                    category_name: pred.name,
                    domain_id: null,
                    domain_name: null,
                    attributes: []
                }];
            }
            return [];
        } catch (predErr) {
            logger.error(`[MercadoLivreService] Erro ao prever categoria: ${predErr.message}`);
            return [];
        }
    }
}

/**
 * Obtém detalhes e atributos requeridos de uma categoria
 * @param {string} categoryId - ID da categoria (ex: 'MLB12345')
 * @returns {Promise<object>} Detalhes da categoria e atributos
 */
export async function getCategoryAttributes(categoryId) {
    try {
        const [catRes, attrRes] = await Promise.all([
            meliAxios.get(`/categories/${categoryId}`).catch(() => ({ data: {} })),
            meliAxios.get(`/categories/${categoryId}/attributes`).catch(() => ({ data: [] }))
        ]);

        const category = catRes.data || {};
        const attributes = attrRes.data || [];

        // Filtra atributos obrigatórios e recomendados
        const requiredAttributes = attributes.filter(a => a.tags?.required);
        const recommendedAttributes = attributes.filter(a => !a.tags?.required && (a.tags?.catalog_required || a.relevance === 1));

        return {
            category: {
                id: category.id,
                name: category.name,
                path_from_root: category.path_from_root || [],
                settings: category.settings || {}
            },
            attributes,
            requiredAttributes,
            recommendedAttributes
        };
    } catch (error) {
        logger.error(`[MercadoLivreService] Erro ao buscar atributos da categoria ${categoryId}: ${error.message}`);
        throw new Error(`Falha ao obter atributos da categoria: ${error.message}`);
    }
}

/**
 * Cria um novo anúncio no Mercado Livre
 * @param {object} connection - Conexão do Mercado Livre
 * @param {object} itemData - Dados do anúncio a ser criado
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Item criado no Mercado Livre
 */
export async function createItem(connection, itemData, db) {
    const token = await ensureValidToken(connection, db);

    const {
        title,
        category_id,
        price,
        currency_id = 'BRL',
        available_quantity = 1,
        buying_mode = 'buy_it_now',
        listing_type_id = 'gold_special', // 'gold_special' (Clássico), 'gold_pro' (Premium), etc.
        condition = 'new',
        pictures = [],
        attributes = [],
        description = '',
        sku = '',
        video_id = null
    } = itemData;

    if (!title || title.trim().length === 0) {
        throw new Error('O título do anúncio é obrigatório.');
    }
    if (!category_id) {
        throw new Error('A categoria do anúncio é obrigatória.');
    }
    if (!price || Number(price) <= 0) {
        throw new Error('O preço do anúncio deve ser maior que zero.');
    }

    // Mercado Livre limita títulos a no máximo 60 caracteres
    const formattedTitle = title.trim().substring(0, 60);

    // Formata imagens para o padrão [{ source: "url" }]
    const formattedPictures = (Array.isArray(pictures) ? pictures : [])
        .map(pic => (typeof pic === 'string' ? { source: pic } : pic))
        .filter(pic => pic && pic.source);

    if (formattedPictures.length === 0) {
        throw new Error('É necessário fornecer pelo menos uma URL de imagem válida para o anúncio.');
    }

    // Garante que o SKU seja adicionado nos atributos ou seller_custom_field
    const formattedAttributes = [...(Array.isArray(attributes) ? attributes : [])];
    if (sku && !formattedAttributes.some(a => a.id === 'SELLER_SKU')) {
        formattedAttributes.push({ id: 'SELLER_SKU', value_name: sku });
    }

    const payload = {
        title: formattedTitle,
        category_id,
        price: parseFloat(price),
        currency_id,
        available_quantity: parseInt(available_quantity, 10),
        buying_mode,
        listing_type_id,
        condition,
        pictures: formattedPictures,
        attributes: formattedAttributes,
        seller_custom_field: sku || null
    };

    if (video_id) {
        payload.video_id = video_id;
    }

    try {
        logger.info(`[MercadoLivreService] Publicando anúncio "${formattedTitle}" no Mercado Livre...`);
        const response = await meliAxios.post('/items', payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const createdItem = response.data;
        logger.info(`[MercadoLivreService] Anúncio criado com sucesso! ID: ${createdItem.id}`);

        // Se uma descrição foi informada, salva a descrição separadamente
        if (description && description.trim()) {
            try {
                await meliAxios.post(`/items/${createdItem.id}/description`, {
                    plain_text: description.trim()
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                logger.info(`[MercadoLivreService] Descrição adicionada ao anúncio ${createdItem.id}.`);
            } catch (descError) {
                logger.warn(`[MercadoLivreService] Não foi possível salvar a descrição do anúncio ${createdItem.id}: ${descError.message}`);
            }
        }

        return createdItem;
    } catch (error) {
        const errorDetails = error.response?.data?.cause || error.response?.data?.message || error.response?.data?.error || error.message;
        const formattedCause = Array.isArray(errorDetails) 
            ? errorDetails.map(c => c.message || c.code || JSON.stringify(c)).join('; ')
            : (typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails);

        logger.error(`[MercadoLivreService] Falha ao criar anúncio: ${formattedCause}`, error);
        throw new Error(`Erro ao publicar no Mercado Livre: ${formattedCause}`);
    }
}

/**
 * Atualiza campos de um anúncio (Preço, Estoque, Título, etc.)
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio (MLB...)
 * @param {object} updateData - Dados para atualizar
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Anúncio atualizado
 */
export async function updateItem(connection, itemId, updateData, db) {
    const token = await ensureValidToken(connection, db);
    const payload = {};

    if (updateData.price !== undefined) {
        payload.price = parseFloat(updateData.price);
    }
    if (updateData.available_quantity !== undefined) {
        payload.available_quantity = parseInt(updateData.available_quantity, 10);
    }
    if (updateData.title) {
        payload.title = updateData.title.trim().substring(0, 60);
    }
    if (updateData.status) {
        payload.status = updateData.status; // 'active', 'paused', 'closed'
    }

    try {
        logger.info(`[MercadoLivreService] Atualizando anúncio ${itemId}...`);
        const response = await meliAxios.put(`/items/${itemId}`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        logger.error(`[MercadoLivreService] Falha ao atualizar anúncio ${itemId}: ${errorMsg}`, error);
        throw new Error(`Erro ao atualizar anúncio no Mercado Livre: ${errorMsg}`);
    }
}

/**
 * Altera o status do anúncio (Pausar / Reativar / Finalizar)
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio
 * @param {string} status - Novo status ('active', 'paused', 'closed')
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Anúncio com status atualizado
 */
export async function updateItemStatus(connection, itemId, status, db) {
    return await updateItem(connection, itemId, { status }, db);
}

/**
 * Obtém os detalhes completos de um anúncio
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Detalhes do item
 */
export async function getItem(connection, itemId, db) {
    const token = await ensureValidToken(connection, db);
    try {
        const response = await meliAxios.get(`/items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`[MercadoLivreService] Erro ao buscar item ${itemId}: ${errorMsg}`);
        throw new Error(`Falha ao buscar anúncio: ${errorMsg}`);
    }
}

/**
 * Lista anúncios diretamente da conta do vendedor no Mercado Livre
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string|null} status - Filtro por status ('active', 'paused', null para todos)
 * @param {number} offset - Ponto de início
 * @param {number} limit - Quantidade máxima
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Lista de anúncios detalhados e paginação
 */
export async function getUserItems(connection, status = null, offset = 0, limit = 50, db) {
    const token = await ensureValidToken(connection, db);
    const userId = connection.credentials?.user_id || 'me';

    try {
        const params = {
            offset,
            limit,
            search_type: 'scan'
        };
        if (status) params.status = status;

        logger.info(`[MercadoLivreService] Buscando anúncios do usuário ${userId}...`);
        const searchRes = await meliAxios.get(`/users/${userId}/items/search`, {
            params,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const itemIds = searchRes.data.results || [];
        const paging = searchRes.data.paging || { total: itemIds.length, offset, limit };

        if (itemIds.length === 0) {
            return { items: [], paging };
        }

        // Multi-get dos detalhes dos anúncios (até 20 por lote na API Meli)
        const batchSize = 20;
        const detailedItems = [];

        for (let i = 0; i < itemIds.length; i += batchSize) {
            const batchIds = itemIds.slice(i, i + batchSize);
            const multigetRes = await meliAxios.get('/items', {
                params: { ids: batchIds.join(',') },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const rawItems = multigetRes.data || [];
            rawItems.forEach(entry => {
                if (entry.code === 200 && entry.body) {
                    detailedItems.push(entry.body);
                }
            });
        }

        return { items: detailedItems, paging };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`[MercadoLivreService] Erro ao listar anúncios do vendedor: ${errorMsg}`);
        throw new Error(`Falha ao listar anúncios: ${errorMsg}`);
    }
}

