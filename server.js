require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.static('public')); // Adicione esta linha
const PORT = process.env.PORT || 3000;

// Rota de Teste para ver se o app está no ar
app.get('/', (req, res) => {
  res.json({ status: 'Online', mensagem: 'Integrador ERP Rodando com Sucesso!' });
});

// Rota principal que aciona a importação do ERP e o envio para a Loja
app.post('/sincronizar', async (req, res) => {
  try {
    console.log('Iniciando busca de produtos no ERP...');
    
    // 1. Buscar produtos no ERP (Exemplo genérico)
    /*
    const responseERP = await axios.get(`${process.env.ERP_API_URL}/produtos`, {
      headers: { 'Authorization': `Bearer ${process.env.ERP_TOKEN}` }
    });
    const produtos = responseERP.data;
    */

    // Simulação de produto vindo do ERP para teste inicial:
    const produtosMock = [
      { sku: 'EL001', nome: 'Disjuntor 32A', preco: 45.90, estoque: 15 }
    ];

    let sucessos = 0;
    let erros = 0;

    // 2. Enviar cada produto para o E-commerce via API
    for (const produto of produtosMock) {
      try {
        await axios.post(`${process.env.LOJA_API_URL}/products`, produto, {
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': process.env.LOJA_API_KEY 
          }
        });
        sucessos++;
      } catch (err) {
        console.error(`Erro ao enviar SKU ${produto.sku}:`, err.response?.data || err.message);
        erros++;
      }
    }

    return res.json({ 
      sucesso: true, 
      mensagem: 'Processo de sincronização finalizado.',
      estatisticas: { sucessos, erros }
    });

  } catch (error) {
    console.error('Erro geral na sincronização:', error.message);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});