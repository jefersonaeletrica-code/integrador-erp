import axios from 'axios';
import https from 'https';
import { getLogger } from './logger.js';

// Cria uma instância do axios com configurações reutilizáveis
const axiosInstance = axios.create({
    timeout: 30000, // Timeout de 30 segundos
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignora erros de certificado SSL
});

// Constantes para CissPoder baseadas na documentação
const CISSPODER_CLIENT_ID = 'cisspoder-oauth';
const CISSPODER_CLIENT_SECRET = 'poder7547';

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

    // Atualiza as credenciais da conexão na memória e no banco
    connection.credentials.access_token = response.data.access_token;
    connection.credentials.refresh_token = response.data.refresh_token;
    await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });
}

export const buildBlingProductUrl = (page, searchParams = {}) => {
    const params = new URLSearchParams();
    params.set('pagina', String(page));
    params.set('limite', '100');

    // Adiciona todos os outros parâmetros de busca (criterio, tipo, nome, codigo)
    for (const key in searchParams) {
        if (searchParams[key]) {
            params.set(key, searchParams[key]);
        }
    }

    return `https://api.bling.com.br/Api/v3/produtos?${params.toString()}`;
};

export const fetchBlingProductPage = async (connection, page, searchParams = {}) => {
    const url = buildBlingProductUrl(page, searchParams);
    console.log('[BlingURL]', url);

    const response = await axiosInstance.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
    return response.data;
};

export const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    const cleanName = words.join(' ');
    return cleanName;
};

export const fetchBlingProductsByName = async (connection, name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5', // Critério para "Contém"
        tipo: 'T', // Tipo para "Termo"
        nome: `%${searchTerm}` // Adiciona o coringa para buscar em qualquer parte do nome
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

export const fetchBlingProductsByCode = async (connection, code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T',
        codigo: code
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

export const fetchAllBlingProductsPaginated = async (connection, pagina = 1) => {
    const searchParams = { criterio: 2 }; // Usa criterio=2 para buscar produtos ativos
    return fetchBlingProductPage(connection, pagina, searchParams);
};

// --- Funções para CissPoder ---

export async function refreshCissPoderToken(connection, db) {
    let { auth_url, username, password } = connection.credentials;

    // Usa o construtor URL para garantir a manipulação correta.
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
    await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });
}

/**
 * Busca dados de preço e estoque para uma lista de produtos CissPoder.
 * @param {object} connection
 * @param {Array<object>} products - Lista de produtos com 'codigo'.
 * @returns {Promise<Array<object>>} - A lista de produtos enriquecida.
 */
export const fetchCissPoderPriceAndStock = async (connection, products) => {
    if (!products || products.length === 0) return products;

    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/produtos/consulta';
    const url = authUrlObject.toString();

    const productIds = products.map(p => p.codigo);

    try {
        const response = await axiosInstance.post(url, { idsSubProduto: productIds }, {
            headers: {
                'Authorization': `Bearer ${connection.credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const priceStockMap = new Map(response.data.map(p => [p.idSubProduto, { preco: p.precoVenda, estoque: p.saldoDisponivel }]));

        // Enriquece a lista de produtos original com os novos dados.
        return products.map(p => ({
            ...p,
            ...priceStockMap.get(p.codigo)
        }));
    } catch (error) {
        getLogger().error(`[CissPoder] Falha ao buscar preço e estoque para ${productIds.length} produtos.`, error);
        return products; // Retorna os produtos originais em caso de falha.
    }
};

export const fetchCissPoderProductPage = async (connection, page, clausulas = []) => {
    // Usa o construtor URL para derivação segura da URL de serviço.
    const authUrlObject = new URL(connection.credentials.auth_url);
    // Voltando a usar o endpoint 'cad_produtos' que temos permissão para acessar.
    authUrlObject.pathname = '/cisspoder-service/cad_produtos';
    const url = authUrlObject.toString();
    console.log('[CissPoderURL]', url);

    const payload = {
        page: page, // Página atual da busca de produtos
        clausulas: [
            ...clausulas
        ],
        ordenacoes: [
            {
                // O campo de nome no endpoint 'cad_produtos' é 'descrcomproduto'
                campo: "descrcomproduto",
                direcao: "ASC" // Corrigido de 'tipo' para 'direcao' conforme o exemplo
            }
        ]
    };
    console.log('[CissPoder Payload]', JSON.stringify(payload, null, 2));

    try {
        const response = await axiosInstance.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${connection.credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('[CissPoder Response]', JSON.stringify(response.data, null, 2));

        const productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        const uniqueProducts = Array.from(new Map(productsArray.map(p => [p.idsubproduto, p])).values());

        const data = uniqueProducts.map(p => ({
            codigo: p.idsubproduto,
            nome: p.descrcomproduto,
            marca: p.descricao // Mapeado para "Descrição do Fabricante"
        }));
        getLogger().info(`[CissPoder] Encontrados ${productsArray.length} registros na API, retornando ${data.length} produtos únicos.`);

        // Enriquece os produtos com dados de preço e estoque.
        const enrichedData = await fetchCissPoderPriceAndStock(connection, data);

        return { data: enrichedData, total: response.data.total, hasNext: response.data.hasNext };
    } catch (error) {
        getLogger().error(`[CissPoder] Falha ao buscar produtos. URL: ${url}`, error);
        throw error;
    }
};

export const fetchCissPoderProductsByName = async (connection, name, pagina = 1) => {
    // Para uma busca mais flexível, criamos uma cláusula LIKE para cada palavra.
    // Isso permite que "cabo acabamento" encontre "ACABAMENTO ... CABO".
    // O valor da busca será a soma das palavras, por exemplo para "cabo flex" o valor deve ser "%cabo%flex%"
    const searchWords = name.trim().split(/\s+/).filter(Boolean);
    const combinedSearchTerm = `%${searchWords.join('%')}%`;

    const clausulas = [{
        campo: "descrcomproduto",
        valor: combinedSearchTerm,
        operador: "LIKE"
    }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

export const fetchCissPoderProductsByCode = async (connection, code, pagina = 1) => {
    const clausulas = [{ campo: "idsubproduto", valor: code, operadorlogico: "AND", operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

export const fetchAllCissPoderProducts = async (connection, pagina = 1) => {
    const clausulas = [
        { campo: "flaginativo", valor: "F", operadorlogico: "AND", operador: "IGUAL" }
    ];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

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
            console.log(`Token para a conexão ${connection.id} expirou. Verificando se é possível renovar...`);
            try {
                await refreshAccessToken(connection, db);
                console.log(`Token para a conexão ${connection.id} renovado com sucesso.`);
                return 'connected';
            } catch (refreshError) {
                const refreshErrorDetails = refreshError.response ? JSON.stringify(refreshError.response.data) : refreshError.message;
                console.error(`Falha ao renovar o token para a conexão ${connection.id}:`, refreshErrorDetails);
                return 'disconnected';
            }
        }
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Erro ao verificar status da conexão ${connection.id}:`, errorDetails);
        return 'error';
    }
}

export async function ensureCissPoderTokenIsValid(connection, db) {
    const { access_token, token_expires_at } = connection.credentials;
    // Considera o token expirado se não existir, não tiver data de expiração,
    // ou se a data de expiração já passou (com uma margem de 60 segundos).
    if (!access_token || !token_expires_at || Date.now() >= token_expires_at - 60000) {
        console.log(`[CissPoder] Token para conexão ${connection.id} está ausente ou expirado. Renovando...`);
        try {
            await refreshCissPoderToken(connection, db);
            console.log(`[CissPoder] Token para conexão ${connection.id} renovado com sucesso.`);
        } catch (error) {
            const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`[CissPoder] Falha ao renovar o token para a conexão ${connection.id}:`, errorDetails);
            // Lança o erro para que a operação que depende do token falhe explicitamente.
            throw new Error('Falha ao renovar o token do CissPoder. Verifique as credenciais.');
        }
    }
}

export async function getCissPoderConnectionStatus(connection, db) {
    try {
        await ensureCissPoderTokenIsValid(connection, db);
        return 'connected';
    } catch (error) {
        console.error(`[CissPoder] Verificação de status falhou para conexão ${connection.id}:`, error.message);
        return 'disconnected';
    }
}