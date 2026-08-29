import express from 'express';
import path from 'path';
import db from './db.js'; // db.js também será movido para src/
import erpRoutes from './api/erpRoutes.js';
import supplierRoutes from './api/supplierRoutes.js'; // Caminho já estava correto, apenas confirmando
import productRoutes from './api/productRoutes.js';
import { getLogger } from './core/logger.js'; // logger.js irá para src/core/
import { loadInitialData } from './services/productService.js'; // productService.js irá para src/services/

const logger = getLogger();

export async function createApp() {
    const app = express();

    // Middlewares
    app.use(express.json());
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Carregamento de dados
    const { connections: erpConnections, supplierConnections } = await db.readDb();
    // Carrega os dados de produtos do DB para a memória (assumindo que productService será movido)
    await loadInitialData();
    logger.info(`${erpConnections.length} conexões ERP carregadas.`);
    logger.info(`${supplierConnections.length} conexões de fornecedores carregadas.`);

    // Configuração das Rotas
    app.use('/api', erpRoutes(db, erpConnections));
    app.use('/api', supplierRoutes(db, supplierConnections));
    app.use('/api', productRoutes(db));

    return { app, erpConnections, supplierConnections };
}