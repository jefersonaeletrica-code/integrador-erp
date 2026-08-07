require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const TOKEN_FILE = path.join(__dirname, 'tokens.json');
const PRODUCTS_FILE = path.join(__dirname, 'produtos.json');

const DEFAULT_CONFIG = {
    BLING_CLIENT_ID: '',
    BLING_CLIENT_SECRET: '',
    BLING_REDIRECT_URI: '',
    LOJA_API_URL: '',
    LOJA_API_KEY: ''
};

const DEFAULT_TOKENS = { access_token: '', refresh_token: '' };
const DEFAULT_PRODUCTS = [];

const envConfig = {
    BLING_CLIENT_ID: process.env.BLING_CLIENT_ID || '',
    BLING_CLIENT_SECRET: process.env.BLING_CLIENT_SECRET || '',
    BLING_REDIRECT_URI: process.env.BLING_REDIRECT_URI || '',
    LOJA_API_URL: process.env.LOJA_API_URL || '',
    LOJA_API_KEY: process.env.LOJA_API_KEY || ''
};

const ensureFileExists = (filePath, defaultValue) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    }
};

ensureFileExists(CONFIG_FILE, DEFAULT_CONFIG);
ensureFileExists(TOKEN_FILE, DEFAULT_TOKENS);
ensureFileExists(PRODUCTS_FILE, DEFAULT_PRODUCTS);

const fileConfig = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : {};
let config = { ...envConfig, ...DEFAULT_CONFIG, ...fileConfig };

// Carrega tokens e produtos importados
let tokens = fs.existsSync(TOKEN_FILE) ? JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) : DEFAULT_TOKENS;
let produtosImportados = fs.existsSync(PRODUCTS_FILE) ? JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')) : DEFAULT_PRODUCTS;

const saveConfig = (newConfig) => { 
    const mergedConfig = { ...config, ...newConfig };

    if (newConfig.BLING_CLIENT_SECRET === '******' || !newConfig.BLING_CLIENT_SECRET) mergedConfig.BLING_CLIENT_SECRET = config.BLING_CLIENT_SECRET;
    if (newConfig.LOJA_API_KEY === '******' || !newConfig.LOJA_API_KEY) mergedConfig.LOJA_API_KEY = config.LOJA_API_KEY;

    Object.keys(config).forEach(key => {
        if (mergedConfig[key] === '' || mergedConfig[key] === undefined || mergedConfig[key] === null) {
            mergedConfig[key] = config[key];
        }
    });

    config = mergedConfig;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); 
};

const saveTokens = (data) => { 
    tokens = { access_token: data.access_token, refresh_token: data.refresh_token }; 
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens)); 
};

const saveProdutosImportados = (items) => {
    produtosImportados = items;
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(produtosImportados, null, 2));
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
        const response = await axios.get('https://api.bling.com.br/Api/v3/produtos', { 
            headers: { 'Authorization': `Bearer ${tokens.access_token}` } 
        });
        res.json({ sucesso: true, produtos: response.data.data });
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