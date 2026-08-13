const axios = require('axios');
const https = require('https');

// Cria uma instância do axios com configurações reutilizáveis
const axiosInstance = axios.create({
    timeout: 30000, // Timeout de 30 segundos
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignora erros de certificado SSL
});

// Constantes para CissPoder baseadas na documentação
const CISSPODER_CLIENT_ID = 'cisspoder-oauth';
const CISSPODER_CLIENT_SECRET = 'poder7547';

async function refreshAccessToken(connection, db) {
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

const buildBlingProductUrl = (page, searchParams = {}) => {
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

const fetchBlingProductPage = async (connection, page, searchParams = {}) => {
    const url = buildBlingProductUrl(page, searchParams);
    console.log('[BlingURL]', url);

    const response = await axiosInstance.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
    return response.data;
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    const cleanName = words.join(' ');
    return cleanName;
};

const fetchBlingProductsByName = async (connection, name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5', // Critério para "Contém"
        tipo: 'T', // Tipo para "Termo"
        nome: `%${searchTerm}` // Adiciona o coringa para buscar em qualquer parte do nome
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

const fetchBlingProductsByCode = async (connection, code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T&codigo',
        codigo: code
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

const fetchAllBlingProductsPaginated = async (connection, pagina = 1) => {
    const searchParams = { criterio: 2 }; // Usa criterio=2 para buscar produtos ativos
    return fetchBlingProductPage(connection, pagina, searchParams);
};

// --- Funções para CissPoder ---

async function refreshCissPoderToken(connection, db) {
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

const fetchCissPoderProductPage = async (connection, page, clausulas = []) => {
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
        console.log(`[CissPoder] Encontrados ${productsArray.length} registros na API, retornando ${data.length} produtos únicos.`);

        return { data, total: response.data.total, hasNext: response.data.hasNext };
    } catch (error) {
        console.error(`[CissPoder] Falha ao buscar produtos. URL: ${url}`, error.message);
        throw error;
    }
};

const fetchCissPoderProductsByName = async (connection, name, pagina = 1) => {
    // Para uma busca mais flexível, criamos uma cláusula LIKE para cada palavra.
    // Isso permite que "cabo acabamento" encontre "ACABAMENTO ... CABO".
    const searchWords = name.trim().split(/\s+/).filter(Boolean);
    const clausulas = searchWords.map(word => ({
        campo: "descrcomproduto",
        valor: `%${word}%`,
        operadorlogico: "AND",
        operador: "LIKE"
    }));
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchCissPoderProductsByCode = async (connection, code, pagina = 1) => {
    const clausulas = [{ campo: "idsubproduto", valor: code, operadorlogico: "AND", operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchAllCissPoderProducts = async (connection, pagina = 1) => {
    const clausulas = [
        { campo: "flaginativo", valor: "F", operadorlogico: "AND", operador: "IGUAL" }
    ];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

async function getBlingConnectionStatus(connection, db) {
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

async function getCissPoderConnectionStatus(connection, db) {
    console.log(`Tentando obter/renovar token para a conexão CissPoder ${connection.id}...`);
    try {
        await refreshCissPoderToken(connection, db);
        console.log(`Token para a conexão CissPoder ${connection.id} obtido/renovado com sucesso.`);
        return 'connected';
    } catch (error) {
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Falha ao obter/renovar token para a conexão CissPoder ${connection.id}:`, errorDetails);
        return 'disconnected';
    }
}

module.exports = {
    refreshAccessToken,
    fetchBlingProductsByName,
    fetchBlingProductsByCode,
    fetchAllBlingProductsPaginated,
    refreshCissPoderToken,
    fetchCissPoderProductsByName,
    fetchCissPoderProductsByCode,
    fetchAllCissPoderProducts,
    getBlingConnectionStatus,
    getCissPoderConnectionStatus,
    axiosInstance // Exporta a instância do axios para ser usada em outros lugares se necessário
};