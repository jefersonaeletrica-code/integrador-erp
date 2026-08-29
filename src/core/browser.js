import puppeteer from 'puppeteer';
import { getLogger } from './logger.js'; // logger.js também vai para src/core

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

    if (isBrowserInUse) {
        logger.warn('Tentativa de inicializar o navegador enquanto já está em andamento.');
        throw new Error('A inicialização do navegador já está em processo.');
    }

    if (browserInstance && browserInstance.browser.isConnected()) {
        logger.info('Reutilizando instância do navegador existente.');
        return browserInstance;
    }
    logger.info('Inicializando instância do navegador...');

    if (!BROWSERLESS_API_KEY) {
        throw new Error('A variável de ambiente BROWSERLESS_API_KEY não está configurada.');
    }

    // Endpoint de conexão do Browserless.io
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&--no-sandbox&timeout=300000`;

    try {
        isBrowserInUse = true; // Bloqueia a criação de novas instâncias
        const launchConfig = { ...BROWSER_CONFIG, ...config };
        const browser = await puppeteer.launch({
            browserURL: browserWSEndpoint,
            ...launchConfig,
        });
        const page = await browser.newPage();
        await page.setViewport(launchConfig.defaultViewport);

        browserInstance = { browser, page };
        logger.info('Navegador conectado e página criada com sucesso.');
        return browserInstance;
    } catch (error) {
        logger.error('Falha ao conectar ao serviço de navegador remoto (Browserless).', error);
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
        await instance.browser.close(); // Fecha a conexão com o navegador remoto
        getLogger().info('Conexão com o navegador remoto fechada.');
    }
    // Libera o bloqueio para que uma nova instância possa ser criada no futuro.
    browserInstance = null;
    isBrowserInUse = false;
}