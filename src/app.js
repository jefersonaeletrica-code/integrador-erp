import express from 'express';
import path from 'path';
import erpRoutes from './api/erpRoutes.js';
import supplierRoutes from './api/supplierRoutes.js'; // Caminho já estava correto, apenas confirmando
import productRoutes from './api/productRoutes.js';
import { getLogger } from './core/logger.js'; // logger.js irá para src/core/
import { loadInitialData } from './services/productService.js'; // productService.js irá para src/services/

export async function createApp(db) {
    const app = express();
    const logger = getLogger();

    // Middlewares
    app.use(express.json());
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Configuração das Rotas
    app.use('/api', erpRoutes(db));
    app.use('/api', supplierRoutes(db));
    app.use('/api', productRoutes(db));

    return { app };
}