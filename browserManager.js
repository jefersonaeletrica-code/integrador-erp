import { initBrowser, closeBrowser } from './browser.js';
import { authenticate } from './auth.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getLogger } from './logger.js';
import db from './db.js';

const logger = getLogger();

/**
 * Gerencia instâncias de navegador ativas e autenticadas para reutilização.
 * Isso evita o custo de iniciar um novo navegador e fazer login a cada requisição.
 */
class BrowserManager {
    constructor() {
        // Adiciona o plugin de stealth para evitar detecção
        puppeteer.use(StealthPlugin());
        // Armazena as instâncias de navegador por ID de conexão
        this.instances = new Map();
    }

    /**
     * Obtém uma instância de navegador autenticada. Se não existir, cria uma nova.
     * @param {object} connection - O objeto de conexão do fornecedor.
     * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
     * @param {object} [options] - Opções adicionais.
     * @param {boolean} [options.forceNew=false] - Força a criação de uma nova instância, ignorando a existente.
     */
    async getOrCreateInstance(connection, options = {}) {
        const connectionId = connection.id;

        // 1. Verifica se já existe uma instância válida
        if (!options.forceNew && this.instances.has(connectionId)) {
            const instance = this.instances.get(connectionId);
            // A verificação mais robusta é ver se a página ainda está aberta.
            // Se a página foi fechada, a instância não é mais válida.
            if (instance.page && !instance.page.isClosed() && instance.browser.isConnected()) {
                logger.info(`[BrowserManager] Reutilizando instância do navegador para a conexão ${connectionId}.`);
                return instance.page;
            }
            logger.warn(`[BrowserManager] Instância para a conexão ${connectionId} encontrada, mas o navegador não está conectado. Removendo.`);
            this.instances.delete(connectionId);
        }

        if (options.forceNew && this.instances.has(connectionId)) {
            logger.warn(`[BrowserManager] Forçando a criação de uma nova instância para a conexão ${connectionId}. Fechando a antiga.`);
            const oldInstance = this.instances.get(connectionId);
            await closeBrowser(oldInstance);
            this.instances.delete(connectionId);
        }
        // 2. Se não houver instância, cria uma nova
        logger.info(`[BrowserManager] Criando nova instância do navegador para a conexão ${connectionId}...`);
        const browserInstance = await initBrowser({ headless: true });
        let { page } = browserInstance;

        // Otimização de Performance: Habilita o cache para simular um navegador real e acelerar carregamentos.
        await page.setCacheEnabled(true);

        // Simula um comportamento mais humano para evitar detecção.
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        try {
            const authResult = await authenticate(page, {
                url: connection.credentials.url,
                credentials: connection.credentials,
                sessionData: options.forceNew ? null : connection.cookies, // Ignora cookies se for forçado um novo login
                retryAttempts: 3,
            }, options.selectors);

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

            // Simula um movimento de mouse para "acordar" a página.
            await page.mouse.move(Math.random() * 800, Math.random() * 600);

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