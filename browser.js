import puppeteer from 'puppeteer';
import { getLogger } from './logger.js';

export const BROWSER_CONFIG = { headless: true, defaultViewport: { width: 1280, height: 800 } };

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

let browserInstance = null;
let isBrowserInUse = false;

/**
 * Inicializa e retorna uma instância do navegador.
 * @param {object} config - Configurações do scraper (headless, useStealth).
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
 */
export async function initBrowser(config) {
    const logger = getLogger();
    logger.info('Inicializando instância do navegador...');

    if (isBrowserInUse) {
        logger.warn('[Browser] Tentativa de iniciar um novo navegador enquanto um já está em uso. Operação bloqueada.');
        throw new Error('Uma operação de navegador já está em andamento. Tente novamente mais tarde.');
    }

    if (!BROWSERLESS_API_KEY) {
        throw new Error('A variável de ambiente BROWSERLESS_API_KEY não está configurada.');
    }

    const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&--no-sandbox`;

    try {
        isBrowserInUse = true; // Bloqueia a criação de novas instâncias
        const browser = await puppeteer.connect({
            browserWSEndpoint,
        });
        const page = await browser.newPage();
        await page.setViewport(BROWSER_CONFIG.defaultViewport);

        browserInstance = { browser, page };
        logger.info('Navegador conectado e página criada com sucesso.');
        return browserInstance;
    } catch (error) {
        logger.error('Falha ao conectar ao Browserless.', error);
        isBrowserInUse = false; // Libera o bloqueio em caso de falha
        throw new Error('Não foi possível inicializar o navegador remoto.');
    }
}

/**
 * Fecha a instância do navegador.
 * @param {{browser: import('puppeteer').Browser}} browserInstance - A instância do navegador a ser fechada.
 */
export async function closeBrowser(instance) {
    if (instance && instance.browser && instance.browser.isConnected()) {        
        await instance.browser.disconnect();
        getLogger().info('Conexão com o navegador remoto fechada.');
    }
    // Libera o bloqueio para que uma nova instância possa ser criada no futuro.
    browserInstance = null;
    isBrowserInUse = false;
}