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

// Carrega configurações e tokens de forma independente
let config = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : { 
    BLING_CLIENT_ID: '', BLING_CLIENT_SECRET: '', BLING_REDIRECT_URI: '', 
    LOJA_API_URL: '', LOJA_API_KEY: '' 
};
let tokens = fs.existsSync(TOKEN_FILE) ? JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) : { access_token: '', refresh_token: '' };

const saveConfig = (newConfig) => { config = { ...config, ...newConfig }; fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); };
const saveTokens = (data) => { tokens = { access_token: data.access_token, refresh_token: data.refresh_token }; fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens)); };

async function refreshAccessToken() {
    if (!tokens.refresh_token) return;
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
    const data = req.body;
    if (data.BLING_CLIENT_SECRET === '******') delete data.BLING_CLIENT_SECRET;
    if (data.LOJA_API_KEY === '******') delete data.LOJA_API_KEY;
    saveConfig(data);
    res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
});

// OAuth Bling
app.get('/api/auth/bling', (req, res) => {
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${config.BLING_CLIENT_ID}&redirect_uri=${encodeURIComponent(config.BLING_REDIRECT_URI)}&state=${state}`;
    res.json({ sucesso: true, url: authUrl });
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const credentials = Buffer.from(`${config.BLING_CLIENT_ID}:${config.BLING_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
            new URLSearchParams({ grant_type: 'authorization_code', code }), 
            { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        saveTokens(response.data);
        res.redirect('/?autorizado=true');
    } catch (e) { res.status(500).send('Erro na autorização com o Bling: ' + e.message); }
});

// Produtos
app.get('/api/produtos-bling', async (req, res) => {
    try {
        await refreshAccessToken();
        const response = await axios.get('https://api.bling.com.br/Api/v3/produtos', { headers: { 'Authorization': `Bearer ${tokens.access_token}` } });
        res.json({ sucesso: true, produtos: response.data.data });
    } catch (e) { res.status(500).json({ sucesso: false, erro: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));