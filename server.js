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

const buildProductUrl = (page, searchParams = {}) => {
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


const fetchProductPage = async (connection, page, searchParams = {}) => {
    const url = buildProductUrl(page, searchParams);
    console.log('[BlingURL]', url);

    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
    return response.data;
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    const cleanName = words.join(' ');
    return cleanName;
};

const fetchProductsByName = async (connection, name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5', // Critério para "Contém"
        tipo: 'T', // Tipo para "Termo"
        nome: searchTerm
    };
    return fetchProductPage(connection, pagina, searchParams);
};

const fetchProductsByCode = async (connection, code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T&codigo',
        codigo: code
    };
    return fetchProductPage(connection, pagina, searchParams);
};

const fetchAllProductsPaginated = async (connection, pagina = 1) => {
    return fetchProductPage(connection, pagina);
};

async function getBlingConnectionStatus(connection) {
    if (!connection.credentials || !connection.credentials.access_token) {
        return 'requires_auth';
    }

    try {
        // Tenta uma chamada leve na API para validar o token
        await axios.get('https://api.bling.com.br/Api/v3/usuarios', {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` }
        });
        return 'connected';
    } catch (error) {
        // Se o token estiver expirado (401), tenta renová-lo
        if (error.response && error.response.status === 401) {
            console.log(`Token para a conexão ${connection.id} expirou. Tentando renovar...`);
            try {
                await refreshAccessToken(connection);
                console.log(`Token para a conexão ${connection.id} renovado com sucesso.`);
                return 'connected';
            } catch (refreshError) {
                console.error(`Falha ao renovar o token para a conexão ${connection.id}:`, refreshError.message);
                return 'disconnected';
            }
        }
        // Para outros erros, consideramos a conexão com problemas
        console.error(`Erro ao verificar status da conexão ${connection.id}:`, error.message);
        return 'error';
    }
}

// --- NOVAS ROTAS DE GERENCIAMENTO DE CONEXÕES ---

app.get('/api/erp-connections', async (req, res) => {
    const connectionsWithStatus = await Promise.all(erpConnections.map(async (conn) => {
        let status = 'not_applicable'; // Padrão para tipos não-Bling
        if (conn.type === 'bling') {
            status = await getBlingConnectionStatus(conn);
        }

        // Oculta segredos para a resposta da API
        const safeCreds = { ...conn.credentials };
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
            await refreshAccessToken(connection);
        }

        const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
        const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

        const { nome, codigo, tipo } = req.query;
        let responseData;

        if (typeof nome === 'string' && nome.trim()) {
            responseData = await fetchProductsByName(connection, nome.trim(), page);
        } else if (typeof codigo === 'string' && codigo.trim()) {
            responseData = await fetchProductsByCode(connection, codigo.trim(), page);
        } else if (typeof tipo === 'string' && tipo.trim().toUpperCase().startsWith('NOME=')) {
            const nomeValido = normalizeNameForBling(tipo.replace(/^NOME=/i, '').trim());
            responseData = await fetchProductsByName(connection, nomeValido, page);
        } else if (typeof tipo === 'string' && tipo.trim().toUpperCase().startsWith('T&CODIGO=')) {
            const codigoValido = tipo.replace(/^T&CODIGO=/i, '').trim();
            responseData = await fetchProductsByCode(connection, codigoValido, page);
        } else {
            responseData = await fetchAllProductsPaginated(connection, page);
        }

        const produtos = responseData?.data || [];
        const total = responseData?.total || responseData?.meta?.total; // Captura o total da resposta da API, considerando diferentes estruturas

        res.json({ sucesso: true, produtos, pagina: page, total });
    } catch (e) { res.status(500).json({ sucesso: false, erro: e.message }); }
});

app.get('/api/produtos-importados', (req, res) => {
    res.json({ sucesso: true, produtos: produtosImportados });
});

app.post('/api/produtos-importados', (req, res) => {
    const novosProdutos = Array.isArray(req.body.produtos) ? req.body.produtos : [];
    const mergedProdutos = [...produtosImportados];

    novosProdutos.forEach(produto => {
        if (!mergedProdutos.some(item => item.codigo === produto.codigo)) {
            mergedProdutos.push(produto);
        }
    });

    saveProdutosImportados(mergedProdutos);
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