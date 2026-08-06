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

// Função auxiliar para obter configurações (do arquivo local ou .env)
function getConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Erro ao ler config.json:', e);
    }
  }
  return {
    BLING_API_KEY: process.env.BLING_API_KEY || '',
    BLING_BASE_URL: process.env.BLING_BASE_URL || 'https://api.bling.com.br/Api/v3',
    LOJA_API_URL: process.env.LOJA_API_URL || '',
    LOJA_API_KEY: process.env.LOJA_API_KEY || ''
  };
}

// 1. Rota para Buscar Configurações
app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

// 2. Rota para Salvar Configurações vindas do painel
app.post('/api/config', (req, res) => {
  const { BLING_API_KEY, BLING_BASE_URL, LOJA_API_URL, LOJA_API_KEY } = req.body;
  const newConfig = {
    BLING_API_KEY: BLING_API_KEY || '',
    BLING_BASE_URL: BLING_BASE_URL || 'https://api.bling.com.br/Api/v3',
    LOJA_API_URL: LOJA_API_URL || '',
    LOJA_API_KEY: LOJA_API_KEY || ''
  };
  
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
  res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
});

// 3. Rota para listar produtos diretamente do Bling
app.get('/api/produtos-bling', async (req, res) => {
  try {
    const config = getConfig();
    if (!config.BLING_API_KEY) {
      return.status(400).json({ sucesso: false, erro: 'Chave API do Bling não configurada.' });
    }

    const response = await axios.get(`${config.BLING_BASE_URL}/produtos`, {
      headers: { 'Authorization': `Bearer ${config.BLING_API_KEY}` }
    });

    const produtos = response.data.data || [];
    res.json({ sucesso: true, produtos });
  } catch (error) {
    // Pega a mensagem detalhada do erro que vem do Bling ou do Axios
    const errorMsg = error.response?.data?.error?.message || error.response?.data || error.message;
    console.error('Erro Bling detalhado:', errorMsg);
    res.status(500).json({ sucesso: false, erro: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
  }
});

// 4. Rota para enviar APENAS os produtos selecionados para a Loja
app.post('/api/sincronizar-selecionados', async (req, res) => {
  try {
    const config = getConfig();
    const { produtos } = req.body; // Array com os produtos marcados pelo usuário

    if (!Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum produto selecionado.' });
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

        await axios.post(`${config.LOJA_API_URL}/products`, payloadLoja, {
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': config.LOJA_API_KEY 
          }
        });
        sucessos++;
      } catch (err) {
        console.error(`Erro SKU ${prod.codigo}:`, err.response?.data || err.message);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});