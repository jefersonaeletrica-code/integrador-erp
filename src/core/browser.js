import puppeteer from 'puppeteer';
import { getLogger } from './logger.js'; // logger.js também vai para src/core

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

/**
 * Inicializa e retorna uma instância do navegador.
 * @param {object} config - Configurações do scraper (headless, useStealth).
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>}
 */
export async function initBrowser(config = {}) {
    const logger = getLogger();
    logger.info('Inicializando instância do navegador...');

    if (!BROWSERLESS_API_KEY) {
        logger.error('A variável de ambiente BROWSERLESS_API_KEY não está configurada. O scraper não pode funcionar sem ela.');
        throw new Error('A variável de ambiente BROWSERLESS_API_KEY não está configurada.');
    }

    // Endpoint de conexão do Browserless.io
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`;

    try {
        // Usa puppeteer.connect para se conectar a um navegador remoto via WebSocket.
        const browser = await puppeteer.connect({
            browserWSEndpoint,
            defaultViewport: { width: 1280, height: 800 }, // Define um viewport padrão
            ...config,
        });

        const page = await browser.newPage();

        logger.info('Conexão com o navegador remoto estabelecida e nova página criada com sucesso.');
        return { browser, page };
    } catch (error) {
        logger.error('Falha ao conectar ao serviço de navegador remoto (Browserless).', error);
        throw new Error('Não foi possível inicializar o navegador remoto.');
    }
}

/**
 * Fecha a instância do navegador.
 * @param {{browser: import('puppeteer').Browser}} instance - A instância do navegador a ser fechada.
 */
export async function closeBrowser(instance) {
    if (instance && instance.browser && instance.browser.isConnected()) {
        await instance.browser.disconnect(); // Desconecta do navegador remoto em vez de fechar
        getLogger().info('Conexão com o navegador remoto fechada.');
    }
}