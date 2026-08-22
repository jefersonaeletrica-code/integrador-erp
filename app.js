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

    // Inicialização do Banco de Dados
    try {
        await db.ensureInitialized();
        logger.info('Banco de dados inicializado com sucesso.');
    } catch (error) {
        logger.error('Falha fatal ao inicializar o banco de dados. O servidor não pode continuar.', error);
        process.exit(1); // Encerra o processo se o DB não puder ser iniciado
    }

    // Carregamento de dados
    const { connections: erpConnections, supplierConnections } = await db.readDb();
    await loadInitialData();
    logger.info(`${erpConnections.length} conexões ERP carregadas.`);
    logger.info(`${supplierConnections.length} conexões de fornecedores carregadas.`);

    // Configuração das Rotas
    app.use('/api', erpRoutes(db, erpConnections));
    app.use('/api', supplierRoutes(db, supplierConnections));

    return { app, erpConnections, supplierConnections };
}