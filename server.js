require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
let db; // Será inicializado depois
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

const envConfig = {
    BLING_CLIENT_ID: process.env.BLING_CLIENT_ID || '',
    BLING_CLIENT_SECRET: process.env.BLING_CLIENT_SECRET || '',
    BLING_REDIRECT_URI: process.env.BLING_REDIRECT_URI || '',
    LOJA_API_URL: process.env.LOJA_API_URL || '',
    LOJA_API_KEY: process.env.LOJA_API_KEY || ''
};

let config;
let tokens;
let produtosImportados;

const saveConfig = (newConfig = {}) => {
    if (!db) return; // Garante que o DB está inicializado
    const incoming = newConfig && typeof newConfig === 'object' ? newConfig : {};
    const mergedConfig = { ...config, ...incoming };

    if (incoming.BLING_CLIENT_SECRET === '******' || !incoming.BLING_CLIENT_SECRET) {
        mergedConfig.BLING_CLIENT_SECRET = config.BLING_CLIENT_SECRET || '';
    }

    if (incoming.LOJA_API_KEY === '******' || !incoming.LOJA_API_KEY) {
        mergedConfig.LOJA_API_KEY = config.LOJA_API_KEY || '';
    }

    Object.keys(db.DEFAULT_DB.config).forEach(key => {
        if (mergedConfig[key] === '' || mergedConfig[key] === undefined || mergedConfig[key] === null) {
            mergedConfig[key] = config[key] || '';
        }
    });

    config = { ...db.DEFAULT_DB.config, ...mergedConfig };
    db.updateDb({ config });
    return config;
};

const saveTokens = (data = {}) => {
    if (!db) return;
    const payload = data && typeof data === 'object' ? data : {};
    const nextTokens = {
        access_token: payload.access_token || tokens.access_token || '',
        refresh_token: payload.refresh_token || tokens.refresh_token || ''
    };

    tokens = nextTokens;
    db.updateDb({ tokens });
    return tokens;
};

const saveProdutosImportados = (items) => {
    if (!db) return;
    produtosImportados = items;
    db.updateDb({ produtos: produtosImportados });
};

async function refreshAccessToken() {
    if (!tokens.refresh_token) throw new Error('Refresh token não encontrado.');
    const credentials = Buffer.from(`${config.BLING_CLIENT_ID}:${config.BLING_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }), 
        { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    saveTokens(response.data);
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


const fetchProductPage = async (page, searchParams = {}) => {
    const url = buildProductUrl(page, searchParams);
    console.log('[BlingURL]', url);

    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${tokens.access_token}` } });
    return response.data;
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    const cleanName = words.join(' ');
    return cleanName;
};

const fetchProductsByName = async (name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5', // Critério para "Contém"
        tipo: 'T', // Tipo para "Termo"
        nome: searchTerm
    };

    return fetchProductPage(pagina, searchParams);
};

const fetchProductsByCode = async (code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T&codigo',
        codigo: code
    };

    return fetchProductPage(pagina, searchParams);
};

const fetchAllProductsPaginated = async (pagina = 1) => {
    return fetchProductPage(pagina);
};

// Rotas de Configuração
app.get('/api/config', (req, res) => res.json({
    ...config,
    BLING_CLIENT_SECRET: config.BLING_CLIENT_SECRET ? '******' : '',
    LOJA_API_KEY: config.LOJA_API_KEY ? '******' : '',
    temTokenBling: !!tokens.access_token
}));

app.post('/api/config', (req, res) => {
    saveConfig(req.body);
    res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
});

// OAuth Bling
app.get('/api/auth/bling', (req, res) => {
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${config.BLING_CLIENT_ID}&redirect_uri=${encodeURIComponent(config.BLING_REDIRECT_URI)}&state=${state}`;
    res.json({ sucesso: true, url: authUrl });
});

app.get('/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) return res.status(400).send('Erro retornado pelo Bling: ' + error);
    if (!code) return res.status(400).send('Código de autorização não encontrado.');

    try {
        const credentials = Buffer.from(`${config.BLING_CLIENT_ID}:${config.BLING_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
            new URLSearchParams({ grant_type: 'authorization_code', code }), 
            { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        saveTokens(response.data);
        res.redirect('/?autorizado=true');
    } catch (e) { 
        res.status(500).send('Erro na autorização: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); 
    }
});

// Rota de produtos
app.get('/api/produtos-bling', async (req, res) => {
    try {
        await refreshAccessToken();

        const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
        const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

        const { nome, codigo, tipo } = req.query;
        let responseData;

        if (typeof nome === 'string' && nome.trim()) {
            responseData = await fetchProductsByName(nome.trim(), page);
        } else if (typeof codigo === 'string' && codigo.trim()) {
            responseData = await fetchProductsByCode(codigo.trim(), page);
        } else if (typeof tipo === 'string' && tipo.trim().toUpperCase().startsWith('NOME=')) {
            const nomeValido = normalizeNameForBling(tipo.replace(/^NOME=/i, '').trim());
            responseData = await fetchProductsByName(nomeValido, page);
        } else if (typeof tipo === 'string' && tipo.trim().toUpperCase().startsWith('T&CODIGO=')) {
            const codigoValido = tipo.replace(/^T&CODIGO=/i, '').trim();
            responseData = await fetchProductsByCode(codigoValido, page);
        } else {
            responseData = await fetchAllProductsPaginated(page);
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
        db = require('./db'); // Carrega o driver de DB
        const currentDb = await db.readDb(); // readDb pode ser assíncrono

        config = { ...envConfig, ...db.DEFAULT_DB.config, ...currentDb.config };
        tokens = { ...db.DEFAULT_DB.tokens, ...currentDb.tokens };
        produtosImportados = Array.isArray(currentDb.produtos) ? currentDb.produtos : [];

        app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
    } catch (error) {
        console.error("Falha ao inicializar o servidor:", error);
        process.exit(1);
    }
};

startServer();