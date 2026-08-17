import { initBrowser, closeBrowser } from './browser.js';
import { authenticate, DEFAULT_LOGIN_SELECTORS } from './auth.js';
import { getLogger } from './logger.js';
import {
    isProductPageValid,
    validateProduct,
    pageParser,
    listPageParser,
    isValidSKU
} from './parsers.js';

/**
 * @class DismatalScraper
 * @description Encapsula a lógica de scraping para o portal Dismatal B2B.
 */
export class DismatalScraper {
    constructor(config) {
        this.config = config;
        this.logger = getLogger();
        this.selectors = {
            ...DEFAULT_LOGIN_SELECTORS,
            // Seletores de busca
            searchInput: ['input[name="descricao"]', 'input[placeholder*="produto"]', 'input[type="search"]'],
            // Seletores de página de produto (individual)
            productName: ['h1.product-name', 'h1.product-title', '[data-product-name]', 'h1'],
            productSKU: ['[data-sku]', '.product-sku', '.sku', '[itemprop="sku"]'],
            productPrice: ['[data-price]', '.price-group__unity-price', '.product-price', '.price'],
            promoPrice: ['[data-promo-price]', '.promotional-price', '.sale-price'],
            stock: ['.stock-info', '.product-stock', '#stock', '[data-stock]'],
            // Seletores de lista de produtos
            productListItem: ['.product-item'],
            listItemName: ['.product-name'],
            listItemSKU: ['.product-sku'],
            listItemPrice: ['.product-price'],
            listItemStock: ['.product-stock'],
        };
    }

    /**
     * Testa a conexão e o login no portal.
     * @param {object} connection - Objeto de conexão com credenciais.
     */
    async testConnection(connection) {
        const { url, username, password } = connection.credentials;
        let browserInstance = null;
        this.logger.info('[DismatalScraper] Iniciando teste de conexão...');
        try {
            const authResult = await authenticate(this.config, {
                url,
                credentials: { username, password },
                retryAttempts: 3,
                retryDelayMs: 2000,
            });
            browserInstance = authResult.browserInstance;

            return { sucesso: true, mensagem: 'Conexão com a Dismatal bem-sucedida!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Teste de conexão falhou.', error);
            throw error; // Re-lança o erro para a rota capturar
        } finally {
            // A autenticação agora gerencia a instância, mas precisamos garantir que ela seja fechada.
            if (browserInstance) {
                this.logger.info('[DismatalScraper] Finalizando teste de conexão e fechando browser...');
                await closeBrowser(browserInstance);
            }
        }
    }

    /**
     * Busca produtos no portal.
     * @param {object} connection - Objeto de conexão com credenciais.
     * @param {string} searchTerm - O termo a ser buscado.
     */
    async fetchProducts(connection, searchTerm) {
        const { url, username, password } = connection.credentials;
        let browserInstance = null;
        this.logger.info('[DismatalScraper] Iniciando busca de produtos...');
        try {
            const authResult = await authenticate(this.config, {
                url,
                credentials: { username, password },
                retryAttempts: 3,
                retryDelayMs: 2000,
            });
            browserInstance = authResult.browserInstance;
            const { page } = browserInstance; // Usaremos a página retornada diretamente

            this.logger.info('[DismatalScraper] Autenticação concluída.');

            let produtos = [];

            // Estratégia 1: Navegação Direta (se o termo de busca parece um SKU)
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Estratégia 1: Navegação direta para SKU ${searchTerm}`);
                try {
                    await page.goto(`${url}/produtos/${searchTerm}`, { waitUntil: 'networkidle0', timeout: 15000 });

                    if (await isProductPageValid(page)) {
                        this.logger.info('[DismatalScraper] Página de produto válida. Extraindo...');
                        const produto = await page.evaluate(pageParser, this.selectors);

                        if (produto) {
                            const validatedProduct = { ...produto, codigo: produto.sku || searchTerm };
                            const validation = validateProduct(validatedProduct);
                            if (validation.valid) {
                                produtos.push(validatedProduct);
                                this.logger.info('[DismatalScraper] Estratégia 1 bem-sucedida.');
                            }
                        }
                    }
                } catch (e) {
                    this.logger.warn(`[DismatalScraper] Estratégia 1 falhou. Tentando Estratégia 2.`, { errorMessage: e.message, stack: e.stack });
                }
            }

            // Estratégia 2: Busca no Portal
            if (produtos.length === 0 && searchTerm && searchTerm.trim() !== '') {
                this.logger.info(`[DismatalScraper] Estratégia 2: Buscando por "${searchTerm}"`);
                try {
                    if (!page.url().includes('dismatal.com.br')) {
                        await page.goto(url, { waitUntil: 'networkidle0' });
                    }

                    const searchInput = await page.waitForSelector(this.selectors.searchInput[0], { timeout: 10000 });
                    await searchInput.fill(searchTerm);
                    await searchInput.press('Enter');
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });

                    this.logger.info('[DismatalScraper] Extraindo dados da lista de produtos...');
                    const produtosDaLista = await page.evaluate(listPageParser, this.selectors);

                    const produtosValidos = produtosDaLista.filter(p => validateProduct(p).valid);
                    produtos = produtosValidos;

                    this.logger.info(`[DismatalScraper] Estratégia 2 encontrou ${produtos.length} produtos válidos.`);
                } catch (e) {
                    this.logger.error(`[DismatalScraper] Estratégia 2 falhou.`, e);
                    throw new Error(`Falha ao buscar por "${searchTerm}" no portal.`);
                }
            }

            this.logger.info(`[DismatalScraper] Busca concluída. Total de produtos: ${produtos.length}.`);
            return { sucesso: true, produtos };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha ao buscar produtos.', error);
            throw error;
        } finally {
            if (browserInstance) {
                this.logger.info('[DismatalScraper] Busca de produtos: fechando browser...');
                await closeBrowser(browserInstance);
            }
        }
    }
}