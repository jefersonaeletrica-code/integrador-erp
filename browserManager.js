import { initBrowser, closeBrowser } from './browser.js';
import { authenticate } from './auth.js';
import { getLogger } from './logger.js';
import db from './db.js';

const logger = getLogger();

/**
 * Gerencia instâncias de navegador ativas e autenticadas para reutilização.
 * Isso evita o custo de iniciar um novo navegador e fazer login a cada requisição.
 */
class BrowserManager {
    constructor() {
        // Armazena as instâncias de navegador por ID de conexão
        this.instances = new Map();
    }

    /**
     * Obtém uma instância de navegador autenticada. Se não existir, cria uma nova.
     * @param {object} connection - O objeto de conexão do fornecedor.
     * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
     */
    async getOrCreateInstance(connection) {
        const connectionId = connection.id;

        // 1. Verifica se já existe uma instância válida
        if (this.instances.has(connectionId)) {
            const instance = this.instances.get(connectionId);
            // Verifica se o navegador ainda está conectado
            if (instance.browser && instance.browser.isConnected()) {
                logger.info(`[BrowserManager] Reutilizando instância do navegador para a conexão ${connectionId}.`);
                return instance.page;
            }
            logger.warn(`[BrowserManager] Instância para a conexão ${connectionId} encontrada, mas o navegador não está conectado. Removendo.`);
            this.instances.delete(connectionId);
        }

        // 2. Se não houver instância, cria uma nova
        logger.info(`[BrowserManager] Criando nova instância do navegador para a conexão ${connectionId}...`);
        const browserInstance = await initBrowser({ headless: true });
        let { page } = browserInstance;

        // Otimização de Performance: Bloqueia requisições desnecessárias
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Otimização de Performance: Desativa o cache para garantir dados frescos,
        // mas isso pode ser ajustado dependendo da necessidade.
        await page.setCacheEnabled(false);


        try {
            const authResult = await authenticate(page, {
                url: connection.credentials.url,
                credentials: connection.credentials,
                sessionData: connection.cookies,
                retryAttempts: 3,
            });

            // A página pode ter sido recriada durante a autenticação
            page = authResult.page;

            // Se a autenticação gerou novos dados de sessão, atualiza no banco
            if (authResult.sessionData) {
                connection.cookies = authResult.sessionData;
                await db.updateSupplierConnection(connection);
            }

            // Armazena a instância completa (browser e page) para uso futuro
            this.instances.set(connectionId, { browser: page.browser(), page });
            logger.info(`[BrowserManager] Nova instância para a conexão ${connectionId} criada e autenticada com sucesso.`);

            return page;
        } catch (error) {
            logger.error(`[BrowserManager] Falha ao criar e autenticar nova instância para a conexão ${connectionId}.`, error);
            // Garante que o navegador seja fechado em caso de falha na autenticação
            await closeBrowser(browserInstance);
            throw error;
        }
    }
}

// Exporta uma instância singleton do gerenciador
const browserManager = new BrowserManager();
export default browserManager;