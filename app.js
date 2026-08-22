import express from 'express';
import path from 'path';
import db from './db.js';
import erpRoutes from './erpRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import { getLogger } from './logger.js';
import { loadInitialData } from './productService.js';

const logger = getLogger();

export async function createApp() {
    const app = express();

    // Middlewares
    app.use(express.json());
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Carregamento de dados
    const { connections: erpConnections, supplierConnections } = await db.readDb();
    // Carrega os dados de produtos do DB para a memória
    await loadInitialData();
    logger.info(`${erpConnections.length} conexões ERP carregadas.`);
    logger.info(`${supplierConnections.length} conexões de fornecedores carregadas.`);

    // Configuração das Rotas
    app.use('/api', erpRoutes(db, erpConnections));
    app.use('/api', supplierRoutes(db, supplierConnections));

    return { app, erpConnections, supplierConnections };
}