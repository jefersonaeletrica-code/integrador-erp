require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Armazenamento temporário em memória para as chaves configuradas na tela
let appConfig = {
  BLING_API_KEY: process.env.BLING_API_KEY || '',
  BLING_BASE_URL: process.env.BLING_BASE_URL || 'https://api.bling.com.br/Api/v3',
  LOJA_API_URL: process.env.LOJA_API_URL || '',
  LOJA_API_KEY: process.env.LOJA_API_KEY || ''
};

// Rota para Buscar Configurações
app.get('/api/config', (req, res) => {
  res.json(appConfig);
});

// Rota para Salvar Configurações
app.post('/api/config', (req, res) => {
  const { BLING_API_KEY, BLING_BASE_URL, LOJA_API_URL, LOJA_API_KEY } = req.body;
  appConfig = {
    BLING_API_KEY: BLING_API_KEY || '',
    BLING_BASE_URL: BLING_BASE_URL || 'https://api.bling.com.br/Api/v3',
    LOJA_API_URL: LOJA_API_URL || '',
    LOJA_API_KEY: LOJA_API_KEY || ''
  };
  res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
});

// Rota para listar produtos diretamente do Bling
app.get('/api/produtos-bling', async (req, res) => {
  try {
    if (!appConfig.BLING_API_KEY) {
      return res.status(400).json({ sucesso: false, erro: 'Chave API do Bling não configurada.' });
    }

    const response = await axios.get(`${appConfig.BLING_BASE_URL}/produtos`, {
      headers: { 'Authorization': `Bearer ${appConfig.BLING_API_KEY}` }
    });

    const produtos = response.data.data || [];
    res.json({ sucesso: true, produtos });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.response?.data || error.message;
    res.status(500).json({ sucesso: false, erro: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
  }
});

// Rota para enviar os selecionados
app.post('/api/sincronizar-selecionados', async (req, res) => {
  try {
    const { produtos } = req.body;
    if (!Array.isArray(produtos) || produtos.length === 0) {
      return.status(400).json({ sucesso: false, erro: 'Nenhum produto selecionado.' });
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