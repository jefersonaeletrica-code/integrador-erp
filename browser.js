import puppeteer from 'puppeteer';
import { getLogger } from './logger.js';

export const BROWSER_CONFIG = { headless: true, defaultViewport: { width: 1280, height: 800 } };

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

/**
 * Inicializa e retorna uma instância do navegador.
 * @param {object} config - Configurações do scraper (headless, useStealth).
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
 */
export async function initBrowser(config) {
    const logger = getLogger();
    logger.info('Inicializando instância do navegador...');

    if (!BROWSERLESS_API_KEY) {
        throw new Error('A variável de ambiente BROWSERLESS_API_KEY não está configurada.');
    }

    const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&--no-sandbox`;

    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint,
        });
        const page = await browser.newPage();
        await page.setViewport(BROWSER_CONFIG.defaultViewport);

        logger.info('Navegador conectado e página criada com sucesso.');
        return { browser, page };
    } catch (error) {
        logger.error('Falha ao conectar ao Browserless.', error);
        throw new Error('Não foi possível inicializar o navegador remoto.');
    }
}

/**
 * Fecha a instância do navegador.
 * @param {{browser: import('puppeteer').Browser}} browserInstance - A instância do navegador a ser fechada.
 */
export async function closeBrowser({ browser }) {
    // Usamos disconnect() em vez de close() quando conectados a um endpoint remoto (Browserless).
    // close() termina o browser remoto, o que pode afetar outras sessões concorrentes.
    // disconnect() apenas fecha a nossa conexão com ele.
    if (browser && browser.isConnected()) {        
        await browser.disconnect();
        getLogger().info('Conexão com o navegador remoto fechada.');
    }
}