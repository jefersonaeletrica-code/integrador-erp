import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import erpRoutes from './api/erpRoutes.js';
import supplierRoutes from './api/supplierRoutes.js'; // Caminho já estava correto, apenas confirmando
import productRoutes from './api/productRoutes.js';
import { getLogger } from './core/logger.js'; // logger.js irá para src/core/
import { loadInitialData } from './services/productService.js'; // productService.js irá para src/services/

export async function createApp(db) {
    const app = express();
    // Gera um identificador único na inicialização do servidor.
    // Isso garante que, a cada nova implantação, os arquivos de cache sejam invalidados.
    const cacheBuster = Date.now().toString();
    const logger = getLogger();

    // Middleware de Log de Requisições:
    // Este é o primeiro middleware a ser executado. Ele registrará todas as requisições
    // recebidas pelo servidor, o que é essencial para depurar erros como "Failed to fetch".
    app.use((req, res, next) => {
        logger.info(`[HTTP Request] ${req.method} ${req.originalUrl}`);
        next(); // Passa a requisição para o próximo middleware na cadeia.
    });

    // Middlewares
    app.use(express.json());

    // Configuração das Rotas de API
    // API routes MUST be declared before the static middleware and the catch-all route.
    app.use('/api', erpRoutes(db));
    app.use('/api', supplierRoutes(db));
    app.use('/api', productRoutes(db));

    // Middleware para servir arquivos estáticos com controle de cache inteligente.
    app.use(express.static(path.join(process.cwd(), 'public'), {
        index: false, // Desativa o envio automático do index.html pelo middleware estático para passar pelo catch-all
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }));

    // Rota "Catch-All": Para qualquer outra requisição que não seja de API,
    // serve o index.html com cacheBuster dinâmico.
    app.get('*', async (req, res, next) => {
        try {
            const indexPath = path.join(process.cwd(), 'public', 'index.html');
            let html = await fs.readFile(indexPath, 'utf-8');
            
            // Substitui o placeholder por um cache buster novo a cada requisição
            const dynamicCacheBuster = Date.now().toString();
            html = html.replace(/__CACHE_BUSTER__/g, dynamicCacheBuster);

            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Content-Type', 'text/html').send(html);
        } catch (error) {
            next(error);
        }
    });

    return { app };
}