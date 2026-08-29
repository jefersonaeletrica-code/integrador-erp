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

    // Middleware para servir arquivos estáticos com controle de cache inteligente.
    // Isso ajuda a resolver o problema de "visual diferente" entre o ambiente local e o servidor.
    app.use(express.static(path.join(process.cwd(), 'public'), {
        etag: true, // Habilita o uso de ETags para validação de cache.
        lastModified: true, // Habilita o uso do cabeçalho Last-Modified.
        setHeaders: (res, filePath) => {
            // Para o arquivo HTML principal, desativa o cache completamente.
            // O navegador sempre pedirá a versão mais recente.
            if (path.basename(filePath) === 'index.html') {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        }
    }));

    // Configuração das Rotas
    app.use('/api', erpRoutes(db));
    app.use('/api', supplierRoutes(db));
    app.use('/api', productRoutes(db));

    return { app };
}