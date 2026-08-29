import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import * as db from './database/db.mysql.js';
import { getLogger } from './core/logger.js';

const logger = getLogger();
const PORT = process.env.PORT || 3000;

async function startServer() {
    // Garante que o módulo de DB seja carregado antes de qualquer outra coisa.
    await db.initializeDatabase();

    // Inicializa o banco de dados e carrega os dados iniciais
    const { app } = await createApp(db);

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    wss.on('connection', ws => {
        logger.info('[WebSocket] Cliente conectado.');
        ws.on('close', () => {
            logger.info('[WebSocket] Cliente desconectado.');
        });
    });

    // Passa a instância do WSS para o app para que as rotas possam usá-la
    app.set('wss', wss);

    server.listen(PORT, () => {
        logger.info(`Servidor rodando na porta ${PORT}`);
    });
}

startServer().catch(error => {
    logger.error('Falha fatal ao iniciar o servidor.', error);
    process.exit(1);
});