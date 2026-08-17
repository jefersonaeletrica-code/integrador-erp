// Carrega as variáveis de ambiente do arquivo .env o mais cedo possível.
import 'dotenv/config';
import express from 'express';

const app = express();

// Importa os módulos de rotas e serviços
import erpRoutes from './erpRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import productRoutes from './productRoutes.js';
import * as productService from './productService.js';

import db from './db.js'; // Carrega o driver de DB imediatamente
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

        await db.initialize(); // Garante que o módulo de DB esteja carregado

        const currentDb = await db.readDb();

        // Carrega as conexões e produtos na memória
        // Limpa os arrays existentes e adiciona os novos itens para manter a referência
        erpConnections.splice(0, erpConnections.length); // Limpa o array
        (Array.isArray(currentDb.connections) ? currentDb.connections : []).forEach(conn => erpConnections.push(conn));

        supplierConnections.splice(0, supplierConnections.length); // Limpa o array
        (Array.isArray(currentDb.supplierConnections) ? currentDb.supplierConnections : []).forEach(conn => supplierConnections.push(conn));

        productService.loadProdutosImportados(currentDb.produtos); // Atualiza o estado no productService

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