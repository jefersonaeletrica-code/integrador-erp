require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Configurações e tokens em memória
let appConfig = {
  CLIENT_ID: process.env.CLIENT_ID || '',
  CLIENT_SECRET: process.env.CLIENT_SECRET || '',
  REDIRECT_URI: process.env.REDIRECT_URI || '', // Ex: https://seu-app.hostingerpsite.com/callback
  ACCESS_TOKEN: '',
  REFRESH_TOKEN: '',
  LOJA_API_URL: process.env.LOJA_API_URL || '',
  LOJA_API_KEY: process.env.LOJA_API_KEY || ''
};

// Rota para Buscar Configurações
app.get('/api/config', (req, res) => {
  res.json({
    CLIENT_ID: appConfig.CLIENT_ID,
    CLIENT_SECRET: appConfig.CLIENT_SECRET ? '******' : '',
    REDIRECT_URI: appConfig.REDIRECT_URI,
    temToken: !!appConfig.ACCESS_TOKEN,
    LOJA_API_URL: appConfig.LOJA_API_URL,
    LOJA_API_KEY: appConfig.LOJA_API_KEY ? '******' : ''
  });
});

// Rota para Salvar Credenciais
app.post('/api/config', (req, res) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, LOJA_API_URL, LOJA_API_KEY } = req.body;
  if (CLIENT_ID) appConfig.CLIENT_ID = CLIENT_ID;
  if (CLIENT_SECRET && CLIENT_SECRET !== '******') appConfig.CLIENT_SECRET = CLIENT_SECRET;
  if (REDIRECT_URI) appConfig.REDIRECT_URI = REDIRECT_URI;
  if (LOJA_API_URL) appConfig.LOJA_API_URL = LOJA_API_URL;
  if (LOJA_API_KEY && LOJA_API_KEY !== '******') appConfig.LOJA_API_KEY = LOJA_API_KEY;

  res.json({ sucesso: true, mensagem: 'Credenciais salvas com sucesso!' });
});

// Passo 1: Redireciona o usuário para a tela de login/autorização do Bling
app.get('/api/auth/bling', (req, res) => {
  if (!appConfig.CLIENT_ID || !appConfig.REDIRECT_URI) {
    return res.status(400).json({ sucesso: false, erro: 'Preencha e salve o Client ID e a URL de Redirecionamento primeiro.' });
  }
  const stateRandom = Math.random().toString(36).substring(7);
  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${appConfig.CLIENT_ID}&redirect_uri=${encodeURIComponent(appConfig.REDIRECT_URI)}&state=${stateRandom}`;
  res.json({ sucesso: true, url: authUrl });
});

// Passo 2: Callback que recebe o código do Bling e troca por Token de Acesso
// Rota de Callback aprimorada para capturar erros e parâmetros do Bling
app.get('/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  // Se o Bling retornou algum erro na URL
  if (error) {
    return res.status(400).send(`Erro retornado pelo Bling: ${error} - ${error_description || ''}`);
  }

  // Se o código não veio
  if (!code) {
    console.log('Query recebida no callback:', req.query);
    return res.status(400).send(`Código de autorização não encontrado. Parâmetros recebidos: ${JSON.stringify(req.query)}`);
  }

  try {
    const credentials = Buffer.from(`${appConfig.CLIENT_ID}:${appConfig.CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
      }), {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    appConfig.ACCESS_TOKEN = tokenResponse.data.access_token;
    appConfig.REFRESH_TOKEN = tokenResponse.data.refresh_token;

    res.redirect('/?autorizado=true');
  } catch (error) {
    console.error('Erro ao obter token OAuth:', error.response?.data || error.message);
    res.status(500).send('Erro na autenticação com o Bling: ' + JSON.stringify(error.response?.data || error.message));
  }
});

// Rota para listar produtos diretamente do Bling usando o Token OAuth
app.get('/api/produtos-bling', async (req, res) => {
  try {
    if (!appConfig.ACCESS_TOKEN) {
      return res.status(400).json({ sucesso: false, erro: 'Sistema não autorizado no Bling. Clique em "Conectar com Bling".' });
    }

    const response = await axios.get('https://api.bling.com.br/Api/v3/produtos', {
      headers: { 'Authorization': `Bearer ${appConfig.ACCESS_TOKEN}` }
    });

    const produtos = response.data.data || [];
    res.json({ sucesso: true, produtos });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.response?.data || error.message;
    res.status(500).json({ sucesso: false, erro: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
  }
});

// Rota para enviar os selecionados para a loja
app.post('/api/sincronizar-selecionados', async (req, res) => {
  try {
    const { produtos } = req.body;
    if (!Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum produto selecionado.' });
    }

    let sucessos = 0;
    let erros = 0;

    for (const prod of produtos) {
      try {
        const payloadLoja = {
          nome: prod.nome,
          codigo: prod.codigo,
          preco: prod.preco
        };

        await axios.post(`${appConfig.LOJA_API_URL}/products`, payloadLoja, {
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': appConfig.LOJA_API_KEY 
          }
        });
        sucessos++;
      } catch (err) {
        erros++;
      }
    }

    res.json({
      sucesso: true,
      mensagem: 'Sincronização concluída.',
      estatisticas: { sucessos, erros }
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});