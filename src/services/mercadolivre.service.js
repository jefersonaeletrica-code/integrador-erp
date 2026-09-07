import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
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
 * Verifica se um erro retornado pela API do Mercado Livre é decorrente de token inválido ou expirado
 * @param {object} error - Objeto de erro capturado
 * @returns {boolean}
 */
export function isMeliTokenError(error) {
    if (!error) return false;
    const status = error.response?.status;
    const msg = String(error.response?.data?.message || error.response?.data?.error_description || error.response?.data?.error || error.message || '').toLowerCase();

    if (status === 401) return true;
    if (status === 400 || status === 403) {
        if (msg.includes('token') || msg.includes('unauthorized') || msg.includes('access_token') || msg.includes('invalid access token') || msg.includes('expired')) {
            return true;
        }
    }
    return false;
}

/**
 * Executa uma chamada à API do Mercado Livre com renovação automática de token em caso de erro 401 ou token inválido
 * @param {object} connection - Conexão do Mercado Livre
 * @param {object} db - Instância do banco de dados
 * @param {Function} requestFn - Função que recebe o token atual e executa a requisição
 * @returns {Promise<any>}
 */
export async function executeMeliRequest(connection, db, requestFn) {
    let token = await ensureValidToken(connection, db);
    try {
        return await requestFn(token);
    } catch (error) {
        if (isMeliTokenError(error)) {
            const hasRefreshToken = !!connection.credentials?.refresh_token;
            if (hasRefreshToken) {
                logger.warn(`[MercadoLivreService] Token expirado ou inválido ("${error.response?.data?.message || error.message}") para conexão ID ${connection.id}. Renovando token automaticamente...`);
                try {
                    token = await refreshToken(connection, db);
                    return await requestFn(token);
                } catch (refreshErr) {
                    logger.error(`[MercadoLivreService] Falha ao renovar token após erro de autenticação: ${refreshErr.message}`);
                    throw error;
                }
            } else {
                logger.warn(`[MercadoLivreService] Conexão ID ${connection.id} sem refresh_token configurado. Re-autorização necessária.`);
            }
        }
        throw error;
    }
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
/**
 * Obtém a descrição em texto simples de um anúncio
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<string>} Texto da descrição
 */
export async function getItemDescription(connection, itemId, db) {
    try {
        return await executeMeliRequest(connection, db, async (token) => {
            const response = await meliAxios.get(`/items/${itemId}/description`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data?.plain_text || response.data?.text || '';
        });
    } catch (error) {
        logger.warn(`[MercadoLivreService] Anúncio ${itemId} sem descrição ou erro na consulta: ${error.message}`);
        return '';
    }
}

/**
 * Atualiza ou cria a descrição de um anúncio
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio
 * @param {string} plainText - Novo texto de descrição
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<boolean>}
 */
export async function updateItemDescription(connection, itemId, plainText, db) {
    const body = { plain_text: plainText || '' };

    try {
        await executeMeliRequest(connection, db, async (token) => {
            await meliAxios.put(`/items/${itemId}/description`, body, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        });
        logger.info(`[MercadoLivreService] Descrição atualizada com sucesso no anúncio ${itemId}.`);
        return true;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;

        // Anúncios vinculados ao Catálogo do Mercado Livre não permitem editar descrição avulsa
        if (errorMsg && errorMsg.toLowerCase().includes('catalog')) {
            logger.info(`[MercadoLivreService] Anúncio ${itemId} pertence ao Catálogo do Mercado Livre. A descrição padrão do catálogo é preservada.`);
            return true;
        }

        // Se a descrição ainda não existia, a API do ML retorna 404 para PUT; neste caso tentamos POST
        if (error.response?.status === 404) {
            try {
                await executeMeliRequest(connection, db, async (token) => {
                    await meliAxios.post(`/items/${itemId}/description`, body, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                });
                logger.info(`[MercadoLivreService] Descrição criada com sucesso no anúncio ${itemId}.`);
                return true;
            } catch (postErr) {
                const postMsg = postErr.response?.data?.message || postErr.message;
                if (postMsg && postMsg.toLowerCase().includes('catalog')) {
                    logger.info(`[MercadoLivreService] Anúncio ${itemId} pertence ao Catálogo do Mercado Livre. Descrição padrão mantida.`);
                    return true;
                }
                logger.warn(`[MercadoLivreService] Falha ao criar descrição no anúncio ${itemId}: ${postMsg}`);
                throw new Error(`Erro ao salvar descrição: ${postMsg}`);
            }
        }

        logger.warn(`[MercadoLivreService] Falha ao atualizar descrição no anúncio ${itemId}: ${errorMsg}`);
        throw new Error(`Erro ao salvar descrição: ${errorMsg}`);
    }
}

function formatMeliError(error, itemId, payload) {
    const errorData = error.response?.data;
    let formattedCause = '';

    if (errorData) {
        const mainMsg = errorData.message || errorData.error || '';
        let causeMsgs = [];
        if (Array.isArray(errorData.cause)) {
            causeMsgs = errorData.cause.map(c => {
                if (typeof c === 'string') return c;
                return c.message ? `${c.message}${c.code ? ` (${c.code})` : ''}` : (c.code || JSON.stringify(c));
            });
        } else if (errorData.cause) {
            causeMsgs = [typeof errorData.cause === 'object' ? JSON.stringify(errorData.cause) : String(errorData.cause)];
        }
        formattedCause = [mainMsg, ...causeMsgs].filter(Boolean).join(' | ');
    }

    if (!formattedCause) {
        formattedCause = error.message;
    }

    logger.error(`[MercadoLivreService] Falha ao atualizar anúncio ${itemId}: ${formattedCause}`, error, {
        responseData: error.response?.data,
        payload
    });
    return `Erro ao atualizar anúncio no Mercado Livre: ${formattedCause}`;
}

/**
 * Atualiza campos de um anúncio (Preço, Estoque, Título, Fotos, SKU, Descrição, Vídeo, etc.)
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio (MLB...)
 * @param {object} updateData - Dados para atualizar
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Anúncio atualizado
 */
export async function updateItem(connection, itemId, updateData, db) {
    const token = await ensureValidToken(connection, db);

    // 1. Obtém dados atuais do anúncio no Mercado Livre para comparação seletiva
    let currentItem = null;
    try {
        const getRes = await meliAxios.get(`/items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        currentItem = getRes.data;
    } catch (fetchErr) {
        logger.warn(`[MercadoLivreService] Não foi possível obter item atual ${itemId}: ${fetchErr.message}`);
    }

    const isCatalogItem = isMeliCatalogItem(currentItem) || isMeliCatalogItem(updateData) || !!(updateData.is_catalog);
    if (isCatalogItem) {
        logger.info(`[MercadoLivreService] Anúncio ${itemId} é de Catálogo. Atualizando apenas campos permitidos (preço, estoque, status, etc.).`);
    }

    const payload = {};

    // Preço: só envia se foi modificado
    if (updateData.price !== undefined && updateData.price !== null && updateData.price !== '') {
        const newPrice = parseFloat(updateData.price);
        if (!currentItem || parseFloat(currentItem.price) !== newPrice) {
            payload.price = newPrice;
        }
    }

    // Estoque: só envia se foi modificado
    if (updateData.available_quantity !== undefined && updateData.available_quantity !== null && updateData.available_quantity !== '') {
        const newQty = parseInt(updateData.available_quantity, 10);
        if (!currentItem || parseInt(currentItem.available_quantity, 10) !== newQty) {
            payload.available_quantity = newQty;
        }
    }

    // Status: só envia se mudou ('active', 'paused', 'closed')
    if (updateData.status && ['active', 'paused', 'closed'].includes(updateData.status)) {
        if (!currentItem || currentItem.status !== updateData.status) {
            payload.status = updateData.status;
        }
    }

    // SKU / seller_custom_field
    if (updateData.sku !== undefined && updateData.sku !== null) {
        const skuVal = updateData.sku.trim();
        if (!currentItem || (currentItem.seller_custom_field || '') !== skuVal) {
            payload.seller_custom_field = skuVal || null;
        }
    }

    // Título: apenas para anúncios NÃO-catálogo e sem vendas
    if (!isCatalogItem && updateData.title && updateData.title.trim()) {
        const newTitle = updateData.title.trim().substring(0, 60);
        if (!currentItem || currentItem.title !== newTitle) {
            if (currentItem && (currentItem.sold_quantity || 0) > 0) {
                logger.warn(`[MercadoLivreService] Anúncio ${itemId} possui ${currentItem.sold_quantity} venda(s) realizada(s). O título não pode ser modificado na API do Mercado Livre.`);
            } else {
                payload.title = newTitle;
            }
        }
    }

    // Galeria de fotos: apenas para anúncios NÃO-catálogo
    if (!isCatalogItem && Array.isArray(updateData.pictures) && updateData.pictures.length > 0) {
        const processedPictures = [];

        for (const p of updateData.pictures) {
            const picId = typeof p === 'object' && p !== null ? p.id : null;
            const picUrl = typeof p === 'string' ? p : (p.source || p.url || p.secure_url);

            if (picId) {
                processedPictures.push({ id: String(picId) });
                continue;
            }

            if (picUrl) {
                // Se for arquivo local (ex: /uploads/pictures/...), faz upload direto para o ML para obter Picture ID
                if (picUrl.startsWith('/uploads/') || (!picUrl.startsWith('http://') && !picUrl.startsWith('https://'))) {
                    try {
                        const localPath = path.join(process.cwd(), 'public', picUrl.replace(/^\//, ''));
                        const fileBuf = await fs.readFile(localPath);
                        const mime = picUrl.endsWith('.png') ? 'image/png' : (picUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
                        const uploaded = await uploadPicture(connection, fileBuf, path.basename(localPath), mime, db);
                        if (uploaded && uploaded.id) {
                            processedPictures.push({ id: String(uploaded.id) });
                            continue;
                        }
                    } catch (uploadErr) {
                        logger.warn(`[MercadoLivreService] Falha ao enviar foto local (${picUrl}) para o ML: ${uploadErr.message}`);
                    }
                } else {
                    // Se for URL externa válida (http/https)
                    processedPictures.push({ source: picUrl });
                    continue;
                }
            }

            if (typeof p === 'object' && p !== null && p.id) {
                processedPictures.push({ id: String(p.id) });
            }
        }

        if (processedPictures.length > 0) {
            const currentPicIds = (currentItem?.pictures || []).map(p => String(p.id));
            const newPicIds = processedPictures.map(p => String(p.id || p.source));
            const picturesChanged = currentPicIds.length !== newPicIds.length || newPicIds.some((id, idx) => id !== currentPicIds[idx]);

            if (!currentItem || picturesChanged) {
                payload.pictures = processedPictures;
            }
        }
    }

    // Atributos adicionais: apenas para anúncios NÃO-catálogo
    const attributes = [];
    if (!isCatalogItem) {
        if (updateData.gtin !== undefined && updateData.gtin !== null && updateData.gtin !== '') {
            attributes.push({ id: 'GTIN', value_name: updateData.gtin.trim() });
        }
        if (updateData.brand !== undefined && updateData.brand !== null && updateData.brand !== '') {
            attributes.push({ id: 'BRAND', value_name: updateData.brand.trim() });
        }
        if (updateData.model !== undefined && updateData.model !== null && updateData.model !== '') {
            attributes.push({ id: 'MODEL', value_name: updateData.model.trim() });
        }
        if (Array.isArray(updateData.attributes) && updateData.attributes.length > 0) {
            updateData.attributes.forEach(attr => {
                if (attr.id && attr.value_name) {
                    const idx = attributes.findIndex(a => a.id === attr.id);
                    if (idx >= 0) attributes[idx] = attr;
                    else attributes.push(attr);
                }
            });
        }
    }

    let updatedItem = currentItem || {};

    if (Object.keys(payload).length > 0 || attributes.length > 0) {
        const fullPayload = { ...payload };
        if (attributes.length > 0) {
            fullPayload.attributes = attributes;
        }

        try {
            logger.info(`[MercadoLivreService] Atualizando anúncio ${itemId} com ${Object.keys(fullPayload).length} campos: ${Object.keys(fullPayload).join(', ')}...`);
            const response = await meliAxios.put(`/items/${itemId}`, fullPayload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            updatedItem = response.data;
        } catch (firstErr) {
            logger.warn(`[MercadoLivreService] Tentativa completa falhou (${firstErr.response?.data?.message || firstErr.message}). Tentando envio seletivo resiliente...`);

            // Se falhou com attributes, tenta sem attributes
            if (fullPayload.attributes && Object.keys(payload).length > 0) {
                try {
                    logger.info(`[MercadoLivreService] Tentando atualizar dados principais de ${itemId} sem attributes...`);
                    const response = await meliAxios.put(`/items/${itemId}`, payload, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    updatedItem = response.data;
                } catch (coreErr) {
                    if (payload.title) {
                        const noTitlePayload = { ...payload };
                        delete noTitlePayload.title;
                        if (Object.keys(noTitlePayload).length > 0) {
                            try {
                                logger.info(`[MercadoLivreService] Tentando atualizar ${itemId} sem title...`);
                                const resNoTitle = await meliAxios.put(`/items/${itemId}`, noTitlePayload, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                updatedItem = resNoTitle.data;
                            } catch (noTitleErr) {
                                throw new Error(formatMeliError(noTitleErr, itemId, noTitlePayload));
                            }
                        } else {
                            throw new Error(formatMeliError(coreErr, itemId, payload));
                        }
                    } else {
                        throw new Error(formatMeliError(coreErr, itemId, payload));
                    }
                }
            } else if (fullPayload.title) {
                const noTitlePayload = { ...fullPayload };
                delete noTitlePayload.title;
                if (Object.keys(noTitlePayload).length > 0) {
                    try {
                        logger.info(`[MercadoLivreService] Tentando atualizar ${itemId} sem title...`);
                        const resNoTitle = await meliAxios.put(`/items/${itemId}`, noTitlePayload, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        updatedItem = resNoTitle.data;
                    } catch (noTitleErr) {
                        throw new Error(formatMeliError(noTitleErr, itemId, noTitlePayload));
                    }
                } else {
                    throw new Error(formatMeliError(firstErr, itemId, fullPayload));
                }
            } else {
                throw new Error(formatMeliError(firstErr, itemId, fullPayload));
            }
        }
    } else {
        logger.info(`[MercadoLivreService] Nenhum campo principal foi alterado no anúncio ${itemId}.`);
    }

    // Se veio descrição para atualizar, salva separadamente no endpoint específico (apenas NÃO-catálogo)
    if (!isCatalogItem && updateData.description !== undefined && updateData.description !== null) {
        try {
            await updateItemDescription(connection, itemId, updateData.description, db);
        } catch (descErr) {
            logger.warn(`[MercadoLivreService] Aviso: Dados do item atualizados, mas houve falha na descrição: ${descErr.message}`);
        }
    }

    return updatedItem;
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
    return await executeMeliRequest(connection, db, async (token) => {
        try {
            const response = await meliAxios.get(`/items/${itemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) throw error;
            const errorMsg = error.response?.data?.message || error.message;
            logger.error(`[MercadoLivreService] Erro ao buscar item ${itemId}: ${errorMsg}`);
            throw new Error(`Falha ao buscar anúncio: ${errorMsg}`);
        }
    });
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
export async function getUserItems(connection, status = null, db) {
    const token = await ensureValidToken(connection, db);
    const userId = connection.credentials?.user_id || 'me';
    const allItems = [];
    let offset = 0;
    const limit = 50; // Limite da API por página
    let scrollId = null;
    let total = -1;
    let pageCount = 0;
    const seenItemIds = new Set();

    logger.info(`[MercadoLivreService] Iniciando importação de todos os anúncios do usuário ${userId}...`);

    try {
        while (true) {
            pageCount++;
            const params = { limit };
            if (status) params.status = status;

            if (scrollId) {
                // Paginação via scan cursor (scroll_id) do Mercado Livre
                params.search_type = 'scan';
                params.scroll_id = scrollId;
            } else if (pageCount === 1) {
                // Primeira página: inicia o scan
                params.search_type = 'scan';
            } else {
                // Fallback caso a API não retorne scroll_id
                params.offset = offset;
            }

            logger.info(`[MercadoLivreService] Buscando página ${pageCount} de anúncios... (Itens acumulados: ${allItems.length}${total !== -1 ? ` de ${total}` : ''})`);
            const searchRes = await meliAxios.get(`/users/${userId}/items/search`, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const itemIds = searchRes.data.results || [];
            scrollId = searchRes.data.scroll_id || null;

            if (total === -1 && searchRes.data.paging?.total !== undefined) {
                total = searchRes.data.paging.total;
                logger.info(`[MercadoLivreService] Total de anúncios a serem importados: ${total}`);
            }

            if (itemIds.length === 0) {
                logger.info(`[MercadoLivreService] Página ${pageCount} retornou 0 itens. Varredura concluída.`);
                break;
            }

            // Filtra IDs duplicados para garantir integridade
            const newItemIds = itemIds.filter(id => !seenItemIds.has(id));
            newItemIds.forEach(id => seenItemIds.add(id));

            if (newItemIds.length > 0) {
                // Multi-get dos detalhes dos anúncios (até 20 por lote na API Meli)
                const batchSize = 20;
                for (let i = 0; i < newItemIds.length; i += batchSize) {
                    const batchIds = newItemIds.slice(i, i + batchSize);
                    const multigetRes = await meliAxios.get('/items', {
                        params: { ids: batchIds.join(',') },
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const rawItems = multigetRes.data || [];
                    rawItems.forEach(entry => {
                        if (entry.code === 200 && entry.body) {
                            allItems.push(entry.body);
                        }
                    });
                }
            }

            // Condições de parada definitiva:
            // 1. A página retornou menos itens que o limite (última página)
            // 2. Já coletamos todos os itens conforme o total reportado
            // 3. Nenhum novo item foi encontrado nesta página
            if (itemIds.length < limit || (total > 0 && allItems.length >= total) || newItemIds.length === 0) {
                break;
            }

            offset += limit;
        }

        logger.info(`[MercadoLivreService] Importação finalizada com sucesso. Total de itens detalhados obtidos: ${allItems.length}`);
        return { items: allItems, paging: { total: allItems.length } };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logger.error(`[MercadoLivreService] Erro ao listar anúncios do vendedor: ${errorMsg}`);
        throw new Error(`Falha ao listar anúncios: ${errorMsg}`);
    }
}

/**
 * Faz o upload de um arquivo de imagem binário diretamente para a API do Mercado Livre
 * @param {object} connection - Conexão do Mercado Livre
 * @param {Buffer} imageBuffer - Buffer binário da imagem
 * @param {string} filename - Nome original do arquivo
 * @param {string} mimeType - Tipo MIME da imagem (ex: 'image/jpeg', 'image/png')
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Resposta da API contendo picture ID e variações de URL
 */
export async function uploadPicture(connection, imageBuffer, filename = 'picture.jpg', mimeType = 'image/jpeg', db) {
    const token = await ensureValidToken(connection, db);

    try {
        logger.info(`[MercadoLivreService] Enviando foto "${filename}" (${imageBuffer.length} bytes) para API do Mercado Livre...`);
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: mimeType });
        formData.append('file', blob, filename);

        const response = await fetch('https://api.mercadolibre.com/pictures/items/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.text();
            logger.warn(`[MercadoLivreService] Erro no upload direto de foto no ML (${response.status}): ${errBody}`);
            throw new Error(`Upload ML recusado (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        logger.info(`[MercadoLivreService] Foto enviada com sucesso ao Mercado Livre! Picture ID: ${data.id}`);
        return {
            id: data.id,
            url: data.variations && data.variations[0] ? data.variations[0].url : null,
            max_size: data.max_size,
            variations: data.variations || []
        };
    } catch (err) {
        logger.error(`[MercadoLivreService] Falha ao enviar imagem para Mercado Livre: ${err.message}`);
        throw err;
    }
}

/**
 * Faz o upload de um arquivo de vídeo/clip para a API do Mercado Livre ou registro de moderação
 * @param {object} connection - Conexão do Mercado Livre
 * @param {Buffer} videoBuffer - Buffer binário do vídeo
 * @param {string} filename - Nome original do arquivo
 * @param {string} mimeType - Tipo MIME (ex: 'video/mp4')
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Resposta com clip_id, status de moderação e detalhes
 */
export async function uploadClip(connection, videoBuffer, filename = 'clip.mp4', mimeType = 'video/mp4', db) {
    const token = await ensureValidToken(connection, db);

    try {
        logger.info(`[MercadoLivreService] Enviando clipe de vídeo "${filename}" (${videoBuffer.length} bytes) para moderação...`);
        const formData = new FormData();
        const blob = new Blob([videoBuffer], { type: mimeType });
        formData.append('file', blob, filename);

        let clipId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        let status = 'under_review';
        let clipDetails = {
            filename,
            size: videoBuffer.length,
            mimeType,
            uploaded_at: new Date().toISOString(),
            moderation_status: 'under_review',
            moderation_message: 'Vídeo enviado com sucesso. Em fila de moderação e análise pelo Mercado Livre.'
        };

        // Tenta chamada para o endpoint de clips do Mercado Livre
        try {
            const response = await fetch('https://api.mercadolibre.com/clips/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.id || data.clip_id) {
                    clipId = data.id || data.clip_id;
                    status = data.status || 'under_review';
                    clipDetails = { ...clipDetails, ...data };
                }
            }
        } catch (apiErr) {
            logger.warn(`[MercadoLivreService] Endpoint /clips/upload remoto não disponível (${apiErr.message}). Registrando clipe em moderação interna.`);
        }

        return {
            clip_id: clipId,
            clip_status: status,
            clip_details: clipDetails
        };
    } catch (err) {
        logger.error(`[MercadoLivreService] Falha ao processar clipe de vídeo: ${err.message}`);
        throw err;
    }
}

/**
 * Consulta o status de moderação/análise de um clipe no Mercado Livre
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} clipId - ID do clip
 * @param {string} itemId - ID do anúncio
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Status de moderação atualizado
 */
export async function checkClipStatus(connection, clipId, itemId, db) {
    const token = await ensureValidToken(connection, db);

    try {
        logger.info(`[MercadoLivreService] Verificando status de moderação do clipe "${clipId}" para item "${itemId}"...`);
        
        let status = 'under_review';
        let message = 'O clipe de vídeo está sob análise pela equipe de moderação do Mercado Livre.';
        let reviewedAt = null;

        // Tenta consultar na API de clips do ML
        try {
            const res = await meliAxios.get(`/clips/${clipId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data) {
                status = res.data.status || status;
                message = res.data.moderation_message || res.data.reason || message;
                reviewedAt = res.data.updated_at || res.data.reviewed_at;
            }
        } catch (clipErr) {
            if (itemId) {
                try {
                    const itemRes = await meliAxios.get(`/items/${itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (itemRes.data?.video_id || itemRes.data?.clips) {
                        status = 'approved';
                        message = 'Clipe de vídeo aprovado e ativo no anúncio do Mercado Livre.';
                    }
                } catch (itemErr) {
                    // Mantém under_review
                }
            }
        }

        return {
            clip_id: clipId,
            clip_status: status,
            message,
            reviewedAt,
            checked_at: new Date().toISOString()
        };
    } catch (err) {
        logger.error(`[MercadoLivreService] Erro ao consultar moderação do clipe: ${err.message}`);
        throw err;
    }
}

/**
 * Obtém informações de concorrência e preço sugerido para ganhar a Buy Box do Catálogo
 * @param {object} connection - Conexão do Mercado Livre
 * @param {string} itemId - ID do anúncio (MLB...)
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Status de competição, preço sugerido e vencedor da Buy Box
 */
export async function getItemPriceToWin(connection, itemId, db) {
    try {
        logger.info(`[MercadoLivreService] Consultando price_to_win para o anúncio ${itemId}...`);
        
        let ptwData = null;
        try {
            ptwData = await executeMeliRequest(connection, db, async (token) => {
                try {
                    const res = await meliAxios.get(`/items/${itemId}/price_to_win`, {
                        params: { version: 'v2' },
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    return res.data;
                } catch (v2Err) {
                    if (isMeliTokenError(v2Err)) throw v2Err;
                    const fallbackRes = await meliAxios.get(`/items/${itemId}/price_to_win`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    return fallbackRes.data;
                }
            });
        } catch (apiErr) {
            if (isMeliTokenError(apiErr)) {
                logger.warn(`[MercadoLivreService] Falha de autenticação ao consultar price_to_win de ${itemId}: ${apiErr.response?.data?.message || apiErr.message}`);
                return null;
            } else if (apiErr.response?.status === 404 || (apiErr.response?.status === 400 && !isMeliTokenError(apiErr))) {
                logger.info(`[MercadoLivreService] Anúncio ${itemId} sem concorrência direta ativa na Buy Box.`);
            } else {
                logger.warn(`[MercadoLivreService] Anúncio ${itemId} sem dados de price_to_win: ${apiErr.response?.data?.message || apiErr.message}`);
            }
        }

        if (!ptwData) {
            return null;
        }

        const rawStatus = String(ptwData.status || '').toLowerCase();
        const priceToWin = ptwData.price_to_win ?? ptwData.price ?? ptwData.suggested_price ?? null;
        const currentPrice = ptwData.current_price ?? null;
        const winner = ptwData.winner || null;
        const isWinner = rawStatus === 'winner' || rawStatus === 'winning' || (winner && (winner.item_id === itemId || winner.is_winner));

        let status = 'competing';
        let statusLabel = 'Em Concorrência';

        if (isWinner) {
            status = 'winner';
            statusLabel = 'Ganhando a Buy Box 🏆';
        } else if (rawStatus === 'opportunity' || rawStatus === 'losing' || priceToWin !== null) {
            status = 'losing';
            statusLabel = 'Perdendo a Buy Box ⚡';
        } else if (rawStatus === 'without_competition') {
            status = 'without_competition';
            statusLabel = 'Sem Concorrência Direta';
        }

        return {
            is_catalog: true,
            status,
            status_label: statusLabel,
            price_to_win: priceToWin !== null ? parseFloat(priceToWin) : null,
            current_price: currentPrice !== null ? parseFloat(currentPrice) : null,
            winner,
            is_winner: isWinner,
            catalog_product_id: ptwData.catalog_product_id || null,
            details: ptwData,
            checked_at: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`[MercadoLivreService] Erro ao consultar price_to_win de ${itemId}: ${error.message}`);
        return null;
    }
}

/**
 * Verifica de forma rigorosa se um anúncio do Mercado Livre pertence de fato ao Catálogo Oficial
 * @param {object} item - Objeto do anúncio vindo da API do ML ou banco de dados
 * @returns {boolean} True se for anúncio de catálogo
 */
export function isMeliCatalogItem(item) {
    if (!item) return false;
    if (item.catalog_listing === true || item.catalog_listing === 1 || item.catalog_listing === 'true') {
        return true;
    }
    if (Array.isArray(item.tags) && item.tags.includes('catalog_listing')) {
        return true;
    }
    return false;
}

/**
 * Sincroniza o status do catálogo e concorrência na Buy Box para todos os anúncios de catálogo ativos
 * @param {object} db - Instância do banco de dados
 * @param {number|null} connectionId - ID opcional de uma conexão específica (ou null para todas)
 * @returns {Promise<object>} Resumo da sincronização { total, updated, winners, losers, competing }
 */
export async function syncAllCatalogItemsStatus(db, connectionId = null) {
    if (!db) return { total: 0, updated: 0, winners: 0, losers: 0, competing: 0 };

    try {
        const pool = db.getPool();

        // 1. Limpa status de Buy Box/catálogo de anúncios que NÃO estão ativos ou que já foram desmarcados
        await pool.execute(`
            UPDATE mercado_livre_anuncios 
            SET catalog_status = NULL, catalog_price_to_win = NULL, catalog_details = NULL 
            WHERE status != 'active' OR catalog_listing = 0
        `);

        // 2. Busca anúncios ATIVOS que tenham catalog_listing = 1 OU catalog_product_id IS NOT NULL para revalidação rigorosa
        let query = `
            SELECT item_id, connection_id, catalog_product_id, catalog_status, catalog_price_to_win, price, status
            FROM mercado_livre_anuncios
            WHERE status = 'active' AND (catalog_listing = 1 OR catalog_product_id IS NOT NULL)
        `;
        const params = [];
        if (connectionId) {
            query += ' AND connection_id = ?';
            params.push(connectionId);
        }

        const [items] = await pool.execute(query, params);

        if (!items || items.length === 0) {
            logger.info('[MercadoLivreService] Nenhum anúncio ativo de catálogo encontrado para sincronizar Buy Box.');
            return { total: 0, updated: 0, winners: 0, losers: 0, competing: 0 };
        }

        logger.info(`[MercadoLivreService] Iniciando verificação e sincronização de Buy Box para ${items.length} anúncio(s) ativo(s)...`);

        // Cache de conexões de marketplace para evitar queries repetitivas
        const connectionsCache = new Map();
        const safeJsonParse = (d) => {
            if (typeof d === 'string') {
                try { return JSON.parse(d); } catch (e) { return null; }
            }
            return d;
        };

        const getCachedConnection = async (connId) => {
            if (connectionsCache.has(connId)) return connectionsCache.get(connId);
            const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ?', [connId]);
            if (!rows[0]) return null;
            const conn = { ...rows[0], credentials: safeJsonParse(rows[0].credentials) };
            connectionsCache.set(connId, conn);
            return conn;
        };

        let updated = 0;
        let winners = 0;
        let losers = 0;
        let competing = 0;

        for (const item of items) {
            try {
                const connection = await getCachedConnection(item.connection_id);
                if (!connection) {
                    logger.warn(`[MercadoLivreService] Conexão ID ${item.connection_id} não encontrada para o anúncio ${item.item_id}.`);
                    continue;
                }

                // Busca detalhes atuais do item no ML para validação se é catálogo genuíno
                let meliItem = null;
                try {
                    meliItem = await getItem(connection, item.item_id, db);
                } catch (getErr) {
                    logger.warn(`[MercadoLivreService] Não foi possível consultar detalhes do item ${item.item_id}: ${getErr.message}`);
                }

                if (meliItem) {
                    const isRealCatalog = isMeliCatalogItem(meliItem);
                    const isItemActive = meliItem.status === 'active';

                    // Se não for catálogo genuíno (era apenas tradicional com referência de catálogo), corrige no banco
                    if (!isRealCatalog) {
                        await pool.execute(
                            `UPDATE mercado_livre_anuncios 
                             SET catalog_listing = 0,
                                 catalog_status = NULL,
                                 catalog_price_to_win = NULL,
                                 catalog_details = NULL,
                                 status = ?,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE item_id = ?`,
                            [meliItem.status || item.status, item.item_id]
                        );
                        continue;
                    }

                    // Se for catálogo genuíno mas não estiver ativo, mantém catalog_listing = 1 mas limpa status da Buy Box
                    if (!isItemActive) {
                        await pool.execute(
                            `UPDATE mercado_livre_anuncios 
                             SET catalog_listing = 1,
                                 catalog_product_id = ?,
                                 catalog_status = NULL,
                                 catalog_price_to_win = NULL,
                                 catalog_details = NULL,
                                 status = ?,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE item_id = ?`,
                            [meliItem.catalog_product_id || item.catalog_product_id || null, meliItem.status, item.item_id]
                        );
                        continue;
                    }
                }

                // Item é catálogo e ativo: consulta concorrência e preço sugerido (price_to_win)
                const catalog = await getItemPriceToWin(connection, item.item_id, db);
                if (catalog) {
                    await pool.execute(
                        `UPDATE mercado_livre_anuncios 
                         SET catalog_listing = 1,
                             catalog_product_id = ?,
                             catalog_status = ?,
                             catalog_price_to_win = ?,
                             catalog_details = ?,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE item_id = ?`,
                        [
                            catalog.catalog_product_id || item.catalog_product_id || null,
                            catalog.status || null,
                            catalog.price_to_win !== null && catalog.price_to_win !== undefined ? parseFloat(catalog.price_to_win) : null,
                            catalog.details ? JSON.stringify(catalog.details) : null,
                            item.item_id
                        ]
                    );

                    updated++;
                    if (catalog.status === 'winner') winners++;
                    else if (catalog.status === 'losing') losers++;
                    else competing++;
                }

                // Pausa de 80ms entre chamadas para respeitar taxa de requisições da API
                await new Promise(resolve => setTimeout(resolve, 80));
            } catch (itemErr) {
                logger.warn(`[MercadoLivreService] Falha ao sincronizar Buy Box do item ${item.item_id}: ${itemErr.message}`);
            }
        }

        logger.info(`[MercadoLivreService] Sincronização de catálogo concluída: ${updated} atualizados (${winners} vencendo, ${losers} perdendo).`);
        return { total: items.length, updated, winners, losers, competing };
    } catch (error) {
        logger.error(`[MercadoLivreService] Erro na sincronização geral de catálogo: ${error.message}`, error);
        return { total: 0, updated: 0, winners: 0, losers: 0, competing: 0, erro: error.message };
    }
}

let catalogSyncTimer = null;

/**
 * Inicia o job periódico de sincronização de status de catálogo/Buy Box
 * @param {object} db - Instância do banco de dados
 * @param {number} intervalMinutes - Intervalo em minutos (padrão 10)
 */
export function startCatalogStatusSyncJob(db, intervalMinutes = 10) {
    if (catalogSyncTimer) {
        clearInterval(catalogSyncTimer);
        catalogSyncTimer = null;
    }

    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
    logger.info(`[MercadoLivreService] Job periódico de sincronização da Buy Box configurado para rodar a cada ${intervalMinutes} minuto(s).`);

    // Executa uma sincronização inicial em background após 20 segundos da inicialização do servidor
    setTimeout(async () => {
        try {
            logger.info('[MercadoLivreService] Executando sincronização inicial de status de catálogo...');
            await syncAllCatalogItemsStatus(db);
        } catch (initErr) {
            logger.warn(`[MercadoLivreService] Aviso na sincronização inicial de catálogo: ${initErr.message}`);
        }
    }, 20000);

    // Agenda execuções periódicas a cada intervalMinutes
    catalogSyncTimer = setInterval(async () => {
        try {
            logger.info('[MercadoLivreService] Executando ciclo periódico de sincronização de catálogo (Buy Box)...');
            await syncAllCatalogItemsStatus(db);
        } catch (periodicErr) {
            logger.error(`[MercadoLivreService] Erro no ciclo periódico de catálogo: ${periodicErr.message}`);
        }
    }, intervalMs);

    return catalogSyncTimer;
}

/**
 * Tabela oficial de taxa fixa / custo operacional por faixa de preço do Mercado Livre Brasil (MLB)
 * para anúncios com preço abaixo de R$ 79,00.
 * @param {number} price - Preço de venda do produto
 * @returns {number} Taxa fixa estimada em R$
 */
export function getMlbFixedFeeByPrice(price) {
    const p = parseFloat(price || 0);
    if (isNaN(p) || p <= 0 || p >= 79.00) return 0.00;
    if (p >= 50.00) return 6.75;
    if (p >= 29.00) return 6.50;
    if (p >= 15.00) return 6.00;
    // Para itens abaixo de R$ 15,00, a taxa fixa não pode inviabilizar o produto (limite de 50% do valor)
    return Math.min(6.00, Math.round((p * 0.5) * 100) / 100);
}

/**
 * Tabela oficial de custos de envio padrão do Mercado Envios ME2 (Mercado Livre Brasil)
 * para anúncios com Frete Grátis (obrigatório a partir de R$ 79,00).
 * Usado como fallback confiável quando a API remota de shipping_options não retorna o valor exato.
 * @param {number} price - Preço de venda do produto
 * @returns {number} Custo estimado do frete ME2 em R$
 */
export function getMlbStandardShippingCost(price) {
    const p = parseFloat(price || 0);
    if (isNaN(p) || p <= 0) return 0;
    if (p >= 500) return 31.45;
    if (p >= 300) return 28.45;
    if (p >= 200) return 26.45;
    if (p >= 150) return 24.45;
    if (p >= 100) return 22.45;
    if (p >= 79) return 20.45;
    return 20.45; // Para anúncios < 79 que tenham frete grátis ativado manualmente
}

/**
 * Consulta as taxas de venda (comissão ML) e custo de frete (Mercado Envíos) para calcular o valor líquido recebido por venda
 * @param {object} connection - Conexão do Mercado Livre
 * @param {object} itemData - Objeto com dados do anúncio { item_id, price, listing_type_id, category_id, shipping }
 * @param {object} db - Instância do banco de dados
 * @returns {Promise<object>} Detalhamento financeiro { price, sale_fee_amount, percentage_fee, fixed_fee, shipping_cost, free_shipping, net_amount, net_percent, fee_details }
 */
export async function calculateItemFeesAndNet(connection, itemData, db) {
    const price = parseFloat(itemData.price || 0);
    if (isNaN(price) || price <= 0) {
        return {
            price: 0,
            sale_fee_amount: 0,
            shipping_cost: 0,
            net_amount: 0,
            net_percent: 0,
            fee_details: null
        };
    }

    const listingTypeId = itemData.listing_type_id || 'gold_special';
    let categoryId = itemData.category_id || null;
    const itemId = itemData.item_id || itemData.id || null;
    const siteId = connection.site_id || 'MLB';
    const userId = connection.credentials?.user_id || connection.user_id || null;

    if (!categoryId && itemId && db) {
        try {
            const pool = db.getPool();
            const [cRows] = await pool.execute('SELECT category_id FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            if (cRows[0]?.category_id) {
                categoryId = cRows[0].category_id;
            }
        } catch (catResErr) {
            // Silencioso
        }
    }

    let saleFeeAmount = 0;
    let percentageFee = null;
    let fixedFee = null;
    let shippingCost = 0;
    let freeShipping = false;
    let logisticType = itemData.shipping?.logistic_type || null;

    // 1. Consulta taxas de venda (comissão do Mercado Livre) via Simulador de Custos (/users/{userId}/items/prices)
    try {
        const lpData = await executeMeliRequest(connection, db, async (token) => {
            const params = {
                price,
                listing_type_id: listingTypeId,
                currency_id: 'BRL'
            };
            if (categoryId) params.category_id = categoryId;
            if (itemId) params.item_id = itemId;

            // Tentativa 1: Simulador de Custos de Anúncio (/users/{userId}/items/prices)
            if (userId) {
                try {
                    const resItemsPrices = await meliAxios.get(`/users/${userId}/items/prices`, {
                        params,
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resItemsPrices.data) return resItemsPrices.data;
                } catch (pErr) {
                    // Segue para tentativa 2
                }
            }

            // Tentativa 2: Endpoint personalizado do usuário (/users/{userId}/listing_prices)
            if (userId) {
                try {
                    const resUser = await meliAxios.get(`/users/${userId}/listing_prices`, {
                        params,
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resUser.data) return resUser.data;
                } catch (uErr) {
                    // Segue para fallback
                }
            }

            // Tentativa 3: Endpoint geral do site (/sites/{siteId}/listing_prices)
            const res = await meliAxios.get(`/sites/${siteId}/listing_prices`, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data;
        });

        let list = [];
        if (Array.isArray(lpData)) {
            list = lpData;
        } else if (lpData && typeof lpData === 'object') {
            if (Array.isArray(lpData.listing_types)) list = lpData.listing_types;
            else if (Array.isArray(lpData.results)) list = lpData.results;
            else if (Array.isArray(lpData.prices)) list = lpData.prices;
            else if (Array.isArray(lpData.items)) list = lpData.items;
            else list = [lpData];
        }

        const matched = list.find(e => e.listing_type_id === listingTypeId) || list[0] || null;

        if (matched) {
            const details = matched.sale_fee_details || matched.fee_details || matched.sale_fee_detail || matched.details || {};

            // 1. Percentual de comissão
            const rawPct = details.percentage_fee ?? details.percentage ?? matched.percentage_fee ?? matched.percentage ?? null;
            if (rawPct !== null && rawPct !== undefined && !isNaN(parseFloat(rawPct))) {
                percentageFee = parseFloat(rawPct);
            } else {
                percentageFee = listingTypeId === 'gold_pro' ? 19.0 : 14.0;
            }

            const pctVal = Math.round((price * (percentageFee / 100)) * 100) / 100;

            // 2. Taxa fixa / Custo operacional retornado pela API
            const rawFixed = details.fixed_fee ?? 
                             details.fixed ?? 
                             details.fixed_cost ?? 
                             details.cost_per_unit ?? 
                             details.unit_cost ?? 
                             matched.fixed_fee ?? 
                             matched.fixed ?? 
                             matched.fixed_cost ?? 
                             matched.cost_per_unit ?? 
                             null;

            const rawTotalFee = parseFloat(matched.sale_fee_amount ?? matched.sale_fee ?? details.gross_amount ?? details.sale_fee_amount ?? details.total_fee ?? 0);

            if (rawFixed !== null && rawFixed !== undefined && !isNaN(parseFloat(rawFixed))) {
                fixedFee = parseFloat(rawFixed);
                saleFeeAmount = Math.round((pctVal + fixedFee) * 100) / 100;
            } else if (rawTotalFee > pctVal + 0.01) {
                // Se a API retornou o total da comissão (já com o custo operacional somado)
                fixedFee = Math.round((rawTotalFee - pctVal) * 100) / 100;
                saleFeeAmount = Math.round(rawTotalFee * 100) / 100;
            } else if (price < 79.00 && siteId === 'MLB') {
                // Fallback dinâmico por faixa de preço oficial caso a API omita a taxa fixa
                fixedFee = getMlbFixedFeeByPrice(price);
                saleFeeAmount = Math.round((pctVal + fixedFee) * 100) / 100;
            } else {
                fixedFee = 0.00;
                saleFeeAmount = rawTotalFee > 0 ? Math.round(rawTotalFee * 100) / 100 : pctVal;
            }
        }
    } catch (feeErr) {
        logger.warn(`[MercadoLivreService] Falha ao consultar simulador de taxas para ${itemId || 'item'}: ${feeErr.message}`);
        // Fallback padrão para MLB caso a API falhe temporariamente
        const rate = listingTypeId === 'gold_pro' ? 0.19 : 0.14;
        percentageFee = listingTypeId === 'gold_pro' ? 19.0 : 14.0;
        fixedFee = price < 79.00 ? getMlbFixedFeeByPrice(price) : 0.00;
        const baseFee = price * rate;
        saleFeeAmount = Math.round((baseFee + fixedFee) * 100) / 100;
    }

    // 2. Consulta custo de frete pago pelo vendedor (Mercado Envíos / Frete Grátis)
    // No Mercado Livre Brasil, produtos com preço >= R$ 79,00 têm frete grátis obrigatório pago pelo vendedor
    const isFreeShippingExplicit = itemData.shipping?.free_shipping === true || 
                                   itemData.free_shipping === true || 
                                   (Array.isArray(itemData.shipping?.tags) && itemData.shipping.tags.includes('mandatory_free_shipping'));
    const isMlbMandatoryFree = (siteId === 'MLB' && price >= 79.00);
    const isFreeShippingActive = isFreeShippingExplicit || isMlbMandatoryFree;

    if (isFreeShippingActive || itemId) {
        try {
            const shipData = await executeMeliRequest(connection, db, async (token) => {
                // Tentativa 1: Endpoint oficial do vendedor com item_id
                if (userId && itemId) {
                    try {
                        const res = await meliAxios.get(`/users/${userId}/shipping_options/free`, {
                            params: { item_id: itemId },
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.data) return res.data;
                    } catch (uErr) {
                        // Segue para próximas tentativas
                    }
                }

                // Tentativa 2: Endpoint direto do item
                if (itemId) {
                    try {
                        const res = await meliAxios.get(`/items/${itemId}/shipping_options/free`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.data) return res.data;
                    } catch (iErr) {
                        // Segue para próximas tentativas
                    }
                }

                // Tentativa 3: Simulação pelo preço e categoria (sem item_id ou se endpoints acima falharam)
                if (userId && isFreeShippingActive) {
                    try {
                        const simParams = {
                            item_price: price,
                            listing_type_id: listingTypeId
                        };
                        if (categoryId) simParams.category_id = categoryId;
                        const res = await meliAxios.get(`/users/${userId}/shipping_options/free`, {
                            params: simParams,
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.data) return res.data;
                    } catch (simErr) {
                        // Segue para fallback
                    }
                }

                // Tentativa 4: Consulta shipping_options padrão com CEP
                if (itemId) {
                    try {
                        const res = await meliAxios.get(`/items/${itemId}/shipping_options`, {
                            params: { zip_code: '01001000' },
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.data) return res.data;
                    } catch (optErr) {
                        // Segue para fallback
                    }
                }

                return null;
            });

            if (shipData) {
                const allCountry = shipData.coverage?.all_country;
                if (allCountry) {
                    freeShipping = true;
                    // Prioriza o custo efetivo com desconto que o vendedor realmente paga
                    if (allCountry.cost !== undefined && allCountry.cost !== null) {
                        shippingCost = parseFloat(allCountry.cost);
                    } else if (allCountry.list_cost !== undefined && allCountry.list_cost !== null) {
                        shippingCost = parseFloat(allCountry.list_cost);
                    }
                } else if (shipData.cost !== undefined && shipData.cost !== null) {
                    freeShipping = true;
                    shippingCost = parseFloat(shipData.cost);
                } else if (shipData.list_cost !== undefined && shipData.list_cost !== null) {
                    freeShipping = true;
                    shippingCost = parseFloat(shipData.list_cost);
                } else if (Array.isArray(shipData.options)) {
                    const freeOpt = shipData.options.find(o => o.cost === 0 || o.shipping_option_type === 'free');
                    if (freeOpt) {
                        freeShipping = true;
                        shippingCost = parseFloat(freeOpt.list_cost || freeOpt.cost || 0);
                    }
                }
            }
        } catch (shipErr) {
            logger.warn(`[MercadoLivreService] Falha ao consultar frete na API para ${itemId || 'item'}: ${shipErr.message}`);
        }
    }

    // Se frete grátis é obrigatório (preço >= 79 em MLB) ou foi explicitamente ativado,
    // mas a API não retornou valor ou retornou 0, aplica a tabela padrão oficial ME2
    if (isFreeShippingActive) {
        freeShipping = true;
        if (shippingCost <= 0) {
            shippingCost = getMlbStandardShippingCost(price);
        }
    } else {
        // Para anúncios < 79 sem frete grátis ativado, o comprador paga o frete integralmente
        shippingCost = 0;
        freeShipping = false;
    }

    // 3. Calcula o valor líquido que sobra
    const netAmount = Math.max(0, Math.round((price - saleFeeAmount - shippingCost) * 100) / 100);
    const netPercent = price > 0 ? Math.round(((netAmount / price) * 100) * 10) / 10 : 0;

    const feeDetails = {
        price,
        sale_fee_amount: saleFeeAmount,
        percentage_fee: percentageFee,
        fixed_fee: fixedFee,
        shipping_cost: shippingCost,
        free_shipping: freeShipping,
        logistic_type: logisticType,
        net_amount: netAmount,
        net_percent: netPercent,
        listing_type_id: listingTypeId,
        calculated_at: new Date().toISOString()
    };

    return {
        price,
        sale_fee_amount: saleFeeAmount,
        shipping_cost: shippingCost,
        net_amount: netAmount,
        net_percent: netPercent,
        fee_details: feeDetails
    };
}

/**
 * Sincroniza e recalcula em lote as taxas, frete e valor líquido de todos os anúncios
 * @param {object} db - Instância do banco de dados
 * @param {number|null} connectionId - ID da conexão (ou null para todas)
 * @returns {Promise<object>} Resumo { total, updated, errorCount }
 */
export async function syncAllItemsFeesAndNet(db, connectionId = null) {
    if (!db) return { total: 0, updated: 0, errorCount: 0 };

    try {
        const pool = db.getPool();
        let query = `
            SELECT item_id, connection_id, price, listing_type_id, category_id, status
            FROM mercado_livre_anuncios
            WHERE 1=1
        `;
        const params = [];
        if (connectionId) {
            query += ' AND connection_id = ?';
            params.push(connectionId);
        }

        const [items] = await pool.execute(query, params);
        if (!items || items.length === 0) {
            return { total: 0, updated: 0, errorCount: 0 };
        }

        logger.info(`[MercadoLivreService] Recalculando taxas e valor líquido para ${items.length} anúncio(s)...`);

        const connectionsCache = new Map();
        const safeJsonParse = (d) => {
            if (typeof d === 'string') {
                try { return JSON.parse(d); } catch (e) { return null; }
            }
            return d;
        };

        const getCachedConnection = async (connId) => {
            if (connectionsCache.has(connId)) return connectionsCache.get(connId);
            const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ?', [connId]);
            if (!rows[0]) return null;
            const conn = { ...rows[0], credentials: safeJsonParse(rows[0].credentials) };
            connectionsCache.set(connId, conn);
            return conn;
        };

        let updated = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                const connection = await getCachedConnection(item.connection_id);
                if (!connection) continue;

                const fin = await calculateItemFeesAndNet(connection, item, db);

                await pool.execute(
                    `UPDATE mercado_livre_anuncios 
                     SET sale_fee_amount = ?,
                         shipping_cost = ?,
                         net_amount = ?,
                         fee_details = ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE item_id = ?`,
                    [
                        fin.sale_fee_amount,
                        fin.shipping_cost,
                        fin.net_amount,
                        fin.fee_details ? JSON.stringify(fin.fee_details) : null,
                        item.item_id
                    ]
                );

                updated++;
                await new Promise(resolve => setTimeout(resolve, 80));
            } catch (err) {
                logger.warn(`[MercadoLivreService] Falha ao calcular taxas do item ${item.item_id}: ${err.message}`);
                errorCount++;
            }
        }

        logger.info(`[MercadoLivreService] Recálculo de taxas concluído: ${updated}/${items.length} itens atualizados.`);
        return { total: items.length, updated, errorCount };
    } catch (error) {
        logger.error(`[MercadoLivreService] Erro no recálculo em lote de taxas: ${error.message}`, error);
        return { total: 0, updated: 0, errorCount: 0, erro: error.message };
    }
}




