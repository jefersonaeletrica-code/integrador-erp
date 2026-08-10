require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
let db; // Será inicializado depois
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let erpConnections = [];
let produtosImportados;

// Constantes para CissPoder baseadas na documentação
const CISSPODER_CLIENT_ID = 'cisspoder-oauth';
const CISSPODER_CLIENT_SECRET = 'poder7547';

const saveProdutosImportados = (items) => {
    if (!db) return;
    produtosImportados = items;
    db.updateDb({ produtos: produtosImportados });
};

async function refreshAccessToken(connection) {
    if (connection.type !== 'bling' || !connection.credentials.refresh_token) {
        throw new Error('Apenas conexões Bling com refresh token podem ser atualizadas.');
    }
    const { client_id, client_secret, refresh_token } = connection.credentials;
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
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

    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
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
    return fetchBlingProductPage(connection, pagina);
};

// --- Funções para CissPoder ---

async function refreshCissPoderToken(connection) {
    let { auth_url, username, password } = connection.credentials;

    // Normaliza a URL para garantir que termine com /oauth/token e não tenha partes duplicadas.
    // Pega a base da URL antes de /oauth/token e anexa o caminho correto.
    const baseUrl = auth_url.split('/oauth/token')[0].replace(/\/$/, '');
    auth_url = `${baseUrl}/oauth/token`;

    const response = await axios.post(auth_url,
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

const fetchCissPoderPrices = async (connection, productIds) => {
    if (!productIds || productIds.length === 0) {
        return {};
    }

    const baseAuthUrl = connection.credentials.auth_url.split('/oauth/token')[0];
    const serviceBaseUrl = baseAuthUrl.replace(/\/$/, "").replace('/cisspoder-auth', '/cisspoder-service');
    const url = `${serviceBaseUrl}/cad_precos`;

    // A API de preços geralmente aceita uma lista de IDs.
    // O campo e operador exatos podem precisar de ajuste ('idsubproduto' e 'IN').
    const payload = {
        page: 1,
        clausulas: [{ campo: "idsubproduto", valor: productIds.join(','), operador: "IN" }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${connection.credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const priceMap = {};
        if (Array.isArray(response.data.data)) {
            response.data.data.forEach(priceInfo => {
                priceMap[priceInfo.idsubproduto] = priceInfo.precovenda;
            });
        }
        return priceMap;
    } catch (error) {
        console.error('[CissPoder] Falha ao buscar preços:', error.message);
        return {}; // Retorna um mapa vazio em caso de erro para não quebrar a busca principal.
    }
};

const fetchCissPoderProductPage = async (connection, page, clausulas = []) => {
    // Normaliza a URL de autenticação para obter a base e derivar a URL de serviço.
    // Remove '/oauth/token' e a barra final, se existirem.
    const baseAuthUrl = connection.credentials.auth_url.split('/oauth/token')[0];

    const serviceBaseUrl = baseAuthUrl
        .replace(/\/$/, "") // Remove barra final se houver
        .replace('/cisspoder-auth', '/cisspoder-service');

    // O serviço de produtos é 'cad_produtos' conforme documentação implícita.
    const url = `${serviceBaseUrl}/cad_produtos`; 
    console.log('[CissPoderURL]', url);

    const payload = {
        page: page,
        clausulas: clausulas
    };
    console.log('[CissPoder Payload]', JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
        headers: {
            'Authorization': `Bearer ${connection.credentials.access_token}`,
            'Content-Type': 'application/json'
        }
    });
    console.log('[CissPoder Response]', JSON.stringify(response.data, null, 2));

    // Normaliza a resposta para o formato esperado (como o do Bling)
    // Adiciona uma verificação para garantir que 'content' seja um array antes de mapear.
    const productsArray = Array.isArray(response.data.data) ? response.data.data : [];

    // Após buscar os produtos, busca os preços para eles.
    const productIds = productsArray.map(p => p.idsubproduto);
    const priceMap = await fetchCissPoderPrices(connection, productIds);

    const data = productsArray.map(p => ({
        codigo: p.idsubproduto,   // Mapeado de: idsubproduto
        nome: p.descrcomproduto,  // Mapeado de: descrcomproduto
        preco: priceMap[p.idsubproduto] || 0 // Usa o preço do mapa de preços ou 0 se não encontrado.
    }));
    console.log(`[CissPoder] Encontrados ${data.length} produtos na resposta.`);

    return {
        data: data,
        total: response.data.total,
    };
};

const fetchCissPoderProductsByName = async (connection, name, pagina = 1) => {
    const clausulas = [{ campo: "descrcomproduto", valor: `%${name}%`, operador: "LIKE" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchCissPoderProductsByCode = async (connection, code, pagina = 1) => {
    const clausulas = [{ campo: "idsubproduto", valor: code, operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchAllCissPoderProducts = async (connection, pagina = 1) => {
    return fetchCissPoderProductPage(connection, pagina);
};

async function getBlingConnectionStatus(connection) {
    if (!connection.credentials || !connection.credentials.access_token) {
        return 'requires_auth';
    }

    try {
        // Tenta uma chamada leve na API para validar o token
        // Usando o endpoint /contatos com limite 1, que é uma chamada leve e confiável.
        await axios.get('https://api.bling.com.br/Api/v3/contatos?limite=1', {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` }
        });
        return 'connected';
    } catch (error) {
        // Se o token estiver expirado (401), tenta renová-lo
        if (error.response && error.response.status === 401) {
            console.log(`Token para a conexão ${connection.id} expirou. Verificando se é possível renovar...`);
            try {
                await refreshAccessToken(connection);
                console.log(`Token para a conexão ${connection.id} renovado com sucesso.`);
                return 'connected';
            } catch (refreshError) {
                const refreshErrorDetails = refreshError.response ? JSON.stringify(refreshError.response.data) : refreshError.message;
                console.error(`Falha ao renovar o token para a conexão ${connection.id}:`, refreshErrorDetails);
                return 'disconnected';
            }
        }
        // Para outros erros, consideramos a conexão com problemas
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Erro ao verificar status da conexão ${connection.id}:`, errorDetails);
        return 'error';
    }
}

async function getCissPoderConnectionStatus(connection) {
    if (!connection.credentials || !connection.credentials.username || !connection.credentials.password) {
        return 'requires_auth'; // Se não tiver credenciais básicas
    }

    // Se não tem token ou se o token está para expirar (margem de 5 min)
    const needsRefresh = !connection.credentials.access_token || connection.credentials.token_expires_at < (Date.now() + 300000);

    if (needsRefresh) {
        console.log(`Token para a conexão CissPoder ${connection.id} inexistente ou expirado. Tentando obter...`);
        try {
            await refreshCissPoderToken(connection);
            console.log(`Token para a conexão CissPoder ${connection.id} obtido com sucesso.`);
            return 'connected';
        } catch (error) {
            const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`Falha ao obter token para a conexão CissPoder ${connection.id}:`, errorDetails);
            return 'disconnected';
        }
    }

    // Se já tem um token válido, consideramos conectado.
    // Uma chamada leve poderia ser adicionada aqui para ter 100% de certeza.
    return 'connected';
}

// --- NOVAS ROTAS DE GERENCIAMENTO DE CONEXÕES ---

app.get('/api/erp-connections', async (req, res) => {
    const connectionsWithStatus = await Promise.all(erpConnections.map(async (conn) => {
        let status = 'not_applicable'; // Padrão para tipos não-Bling
        if (conn.type === 'bling') {
            status = await getBlingConnectionStatus(conn);
        } else if (conn.type === 'cisspoder') {
            status = await getCissPoderConnectionStatus(conn);
        }

        // Oculta segredos para a resposta da API
        const safeCreds = { ...conn.credentials };
        // CissPoder
        if (safeCreds.password) safeCreds.password = '******';
        if (safeCreds.username) safeCreds.username = safeCreds.username; // pode manter o user

        // Bling
        if (safeCreds.client_secret) safeCreds.client_secret = '******';
        if (safeCreds.access_token) safeCreds.access_token = safeCreds.access_token.substring(0, 8) + '...';
        if (safeCreds.refresh_token) safeCreds.refresh_token = '******';
        
        return { ...conn, credentials: safeCreds, status };
    }));

    res.json({ sucesso: true, connections: connectionsWithStatus });
});

app.post('/api/erp-connections', async (req, res) => {
    const { name, type, credentials } = req.body;
    if (!name || !type || !credentials) {
        return res.status(400).json({ sucesso: false, erro: 'Nome, tipo e credenciais são obrigatórios.' });
    }

    try {
        const pool = db.getPool();
        const [result] = await pool.execute(
            'INSERT INTO erp_connections (name, type, credentials) VALUES (?, ?, ?)',
            [name, type, JSON.stringify(credentials)]
        );
        const newConnection = { id: result.insertId, name, type, credentials };
        erpConnections.push(newConnection);
        res.status(201).json({ sucesso: true, connection: newConnection });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

app.put('/api/erp-connections/:id', async (req, res) => {
    const { id } = req.params;
    const { name, credentials } = req.body;

    if (!name || !credentials) {
        return res.status(400).json({ sucesso: false, erro: 'Nome e credenciais são obrigatórios.' });
    }

    const connectionIndex = erpConnections.findIndex(c => c.id == id);
    if (connectionIndex === -1) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
    }

    try {
        const connection = erpConnections[connectionIndex];

        // Mescla as credenciais, mantendo os segredos que não foram alterados
        const newCredentials = { ...connection.credentials, ...credentials };

        const updatedConnection = {
            ...connection,
            name,
            credentials: newCredentials
        };

        await db.updateDb({ connection: { id, name, credentials: newCredentials } });
        erpConnections[connectionIndex] = updatedConnection;

        res.json({ sucesso: true, connection: updatedConnection });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

app.delete('/api/erp-connections/:id', async (req, res) => {
    const { id } = req.params;

    const connectionIndex = erpConnections.findIndex(c => c.id == id);
    if (connectionIndex === -1) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
    }

    try {
        const pool = db.getPool();
        await pool.execute('DELETE FROM erp_connections WHERE id = ?', [id]);

        // Remove from in-memory array
        erpConnections.splice(connectionIndex, 1);

        res.json({ sucesso: true, mensagem: 'Conexão removida com sucesso.' });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

// OAuth Bling
app.get('/api/auth/:connectionId/bling', (req, res) => {
    const { connectionId } = req.params;
    const connection = erpConnections.find(c => c.id == connectionId);

    if (!connection || connection.type !== 'bling') {
        return res.status(404).json({ sucesso: false, erro: 'Conexão Bling não encontrada.' });
    }

    const { client_id, redirect_uri } = connection.credentials;
    const state = `connId=${connectionId}`; // Passa o ID da conexão no state
    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;
    res.json({ sucesso: true, url: authUrl });
});

app.get('/callback', async (req, res) => {
    const { code, error, state } = req.query;
    if (error) return res.status(400).send('Erro retornado pelo Bling: ' + error);
    if (!code) return res.status(400).send('Código de autorização não encontrado.');

    const stateParams = new URLSearchParams(state);
    const connectionId = stateParams.get('connId');
    const connection = erpConnections.find(c => c.id == connectionId);

    if (!connection) {
        return res.status(400).send('Conexão inválida ou não encontrada a partir do state.');
    }

    try {
        const { client_id, client_secret } = connection.credentials;
        const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
        const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
            new URLSearchParams({ grant_type: 'authorization_code', code }), 
            { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        // Atualiza as credenciais da conexão
        connection.credentials.access_token = response.data.access_token;
        connection.credentials.refresh_token = response.data.refresh_token;
        await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });

        res.redirect('/?autorizado=true');
    } catch (e) { 
        res.status(500).send('Erro na autorização: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); 
    }
});

// Rota de produtos
app.get('/api/produtos/:connectionId', async (req, res) => {
    const { connectionId } = req.params;
    const connection = erpConnections.find(c => c.id == connectionId);

    if (!connection) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
    }

    try {
        if (connection.type === 'bling') {
            await getBlingConnectionStatus(connection); // Garante que o token está válido
        } else if (connection.type === 'cisspoder') {
            await getCissPoderConnectionStatus(connection); // Garante que o token está válido
        } 

        const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
        const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

        const { nome, codigo, tipo } = req.query;
        let responseData;

        if (connection.type === 'bling') {
            if (typeof nome === 'string' && nome.trim()) {
                responseData = await fetchBlingProductsByName(connection, nome.trim(), page);
            } else if (typeof codigo === 'string' && codigo.trim()) {
                responseData = await fetchBlingProductsByCode(connection, codigo.trim(), page);
            } else {
                responseData = await fetchAllBlingProductsPaginated(connection, page);
            }
        } else if (connection.type === 'cisspoder') {
            if (typeof nome === 'string' && nome.trim()) {
                responseData = await fetchCissPoderProductsByName(connection, nome.trim(), page);
            } else if (typeof codigo === 'string' && codigo.trim()) {
                responseData = await fetchCissPoderProductsByCode(connection, codigo.trim(), page);
            } else {
                responseData = await fetchAllCissPoderProducts(connection, page);
            }
        } else {
            return res.status(400).json({ sucesso: false, erro: 'Tipo de conexão não suportado para busca de produtos.' });
        }
        
        const produtos = responseData?.data || [];
        // Bling usa meta.total, CissPoder usa total. Normalizamos aqui.
        const total = responseData?.total ?? responseData?.meta?.total; 

        res.json({ sucesso: true, produtos, pagina: page, total });
    } catch (e) { res.status(500).json({ sucesso: false, erro: e.message }); }
});

app.get('/api/produtos-importados', (req, res) => {
    res.json({ sucesso: true, produtos: produtosImportados });
});

app.post('/api/produtos-importados', (req, res) => {
    // A lista enviada pelo frontend agora é a fonte da verdade.
    const produtosParaSalvar = Array.isArray(req.body.produtos) ? req.body.produtos : [];
    saveProdutosImportados(produtosParaSalvar);
    res.json({ sucesso: true, mensagem: 'Produtos importados salvos com sucesso!' });
});

const startServer = async () => {
    try {
        console.log('Verificando variáveis de ambiente para conexão com DB...');
        // O log de variáveis já está dentro do db.mysql.js, não precisa mais aqui.
        console.log('----------------------------------------------------');

        db = require('./db'); // Carrega o driver de DB
        
        // A primeira chamada a uma função do DB (como readDb) vai disparar e aguardar a inicialização.
        const currentDb = await db.readDb(); // readDb pode ser assíncrono

        // Carrega as conexões e produtos na memória
        erpConnections = Array.isArray(currentDb.connections) ? currentDb.connections : [];
        produtosImportados = Array.isArray(currentDb.produtos) ? currentDb.produtos : [];

        console.log(`${erpConnections.length} conexões ERP carregadas.`);
        console.log(`${produtosImportados.length} produtos importados carregados.`);

        app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
    } catch (error) {
        console.error("Falha ao inicializar o servidor:", error);
        process.exit(1);
    }
};

startServer();