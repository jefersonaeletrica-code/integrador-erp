require('dotenv').config();

const express = require('express');
const axios = require('axios');
const db = require('./db');

const app = express();
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

const currentDb = db.readDb();
let config = { ...envConfig, ...db.DEFAULT_DB.config, ...currentDb.config };
let tokens = { ...db.DEFAULT_DB.tokens, ...currentDb.tokens };
let produtosImportados = Array.isArray(currentDb.produtos) ? currentDb.produtos : [];

const saveConfig = (newConfig = {}) => {
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

const fetchProductPage = async (page, searchParams = {}) => {
    const params = new URLSearchParams();

    if (searchParams.criterio && searchParams.tipo) {
        params.set('criterio', searchParams.criterio);
        params.set('tipo', searchParams.tipo);
    }

    params.set('pagina', String(page));
    params.set('limite', '100');

    const url = `https://api.bling.com.br/Api/v3/produtos?${params.toString()}`;
    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${tokens.access_token}` } });
    return response.data?.data || [];
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    return words.length > 1 ? words.join('%20') : words.join('');
};

const fetchProductsByName = async (name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5',
        tipo: `NOME=${searchTerm}`
    };

    return fetchProductPage(pagina, searchParams);
};

const fetchProductsByCode = async (code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: `T&codigo=${code}`
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

        const searchType = typeof req.query.tipo === 'string' ? req.query.tipo.trim() : '';
        const nomeDigitado = searchType.startsWith('NOME=') ? searchType.replace(/^NOME=/i, '').trim() : '';
        const codigoDigitado = searchType.startsWith('T&codigo=') ? searchType.replace(/^T&codigo=/i, '').trim() : '';

        if (nomeDigitado) {
            const produtos = await fetchProductsByName(nomeDigitado, page);
            return res.json({ sucesso: true, produtos, pagina: page });
        }

        if (codigoDigitado) {
            const produtos = await fetchProductsByCode(codigoDigitado, page);
            return res.json({ sucesso: true, produtos, pagina: page });
        }

        const produtos = await fetchAllProductsPaginated(page);
        res.json({ sucesso: true, produtos, pagina: page });
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

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));