require('dotenv').config();

const express = require('express');

const app = express();

// Importa os módulos de rotas e serviços
const erpRoutes = require('./erpRoutes.js');
const supplierRoutes = require('./supplierRoutes.js');
const productRoutes = require('./productRoutes.js');
const productService = require('./productService.js');

let db; // Será inicializado depois
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let erpConnections = [];
let supplierConnections = [];

// Registra as rotas
app.use('/api', erpRoutes(db, erpConnections));
app.use('/api', supplierRoutes(db, supplierConnections));
app.use('/api', productRoutes(db));

const startServer = async () => {
    try {
        console.log('Verificando variáveis de ambiente para conexão com DB...');
        console.log('----------------------------------------------------');

        db = require('./db'); // Carrega o driver de DB
        
        const currentDb = await db.readDb();

        // Carrega as conexões e produtos na memória
        // Limpa os arrays existentes e adiciona os novos itens para manter a referência
        erpConnections.splice(0, erpConnections.length); // Limpa o array
        (Array.isArray(currentDb.connections) ? currentDb.connections : []).forEach(conn => erpConnections.push(conn));

        supplierConnections.splice(0, supplierConnections.length); // Limpa o array
        (Array.isArray(currentDb.supplierConnections) ? currentDb.supplierConnections : []).forEach(conn => supplierConnections.push(conn));

        productService.produtosImportados = currentDb.produtos; // Atualiza o estado no productService


        console.log(`${erpConnections.length} conexões ERP carregadas.`);
        console.log(`${supplierConnections.length} conexões de fornecedores carregadas.`);
        console.log(`${productService.produtosImportados.length} produtos importados carregados.`);

        app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
    } catch (error) {
        console.error("Falha ao inicializar o servidor:", error);
        process.exit(1);
    }
};

startServer();