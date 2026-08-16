import { initBrowser, closeBrowser } from './browser.js';
import { getLogger } from './logger.js';

const MAX_POOL_SIZE = process.env.BROWSER_POOL_SIZE || 5;
const BROWSER_CONFIG = { headless: true };

/**
 * @typedef {object} PooledBrowser
 * @property {import('puppeteer').Browser} browser
 * @property {import('puppeteer').Page} page
 * @property {boolean} inUse
 */

/** @type {PooledBrowser[]} */
const pool = [];
const logger = getLogger();

/**
 * Adquire uma instância de navegador do pool.
 * Reutiliza uma instância livre ou cria uma nova se o pool não estiver cheio.
 * @returns {Promise<PooledBrowser>}
 */
async function acquire() {
    // Tenta encontrar um navegador não utilizado no pool
    let pooledBrowser = pool.find(p => !p.inUse);

    if (pooledBrowser) {
        logger.debug('[BrowserPool] Reutilizando navegador do pool.');
        // Garante que a página esteja aberta
        if (pooledBrowser.page.isClosed()) {
            pooledBrowser.page = await pooledBrowser.browser.newPage();
        }
    } else if (pool.length < MAX_POOL_SIZE) {
        logger.info(`[BrowserPool] Criando novo navegador. Tamanho do pool: ${pool.length + 1}`);
        const browserInstance = await initBrowser(BROWSER_CONFIG);
        pooledBrowser = { ...browserInstance, inUse: false };
        pool.push(pooledBrowser);
    } else {
        // Se o pool está cheio, espera até que um navegador seja liberado
        logger.warn('[BrowserPool] Pool cheio. Aguardando liberação de um navegador...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Espera simples
        return acquire(); // Tenta novamente
    }

    pooledBrowser.inUse = true;
    return pooledBrowser;
}

/**
 * Libera uma instância de navegador de volta para o pool.
 * @param {PooledBrowser} pooledBrowser
 */
function release(pooledBrowser) {
    if (pooledBrowser) {
        logger.debug('[BrowserPool] Liberando navegador de volta para o pool.');
        pooledBrowser.inUse = false;
    }
}

export const browserPool = {
    acquire,
    release,
};