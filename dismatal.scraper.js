import { initBrowser, closeBrowser } from './browser.js';
import { authenticate, DEFAULT_LOGIN_SELECTORS } from './auth.js';
import { getLogger } from './logger.js';
import {
    findSelector,
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
            // O erro "Campo de busca não foi encontrado na página inicial" indica que nenhum desses seletores
            // está correspondendo ao campo de busca real no portal Dismatal. Adicionado seletor com base no placeholder.
            searchInput: ['input[placeholder="O que você está procurando?"]', 'input[name="descricao"]', 'input[placeholder*="produto"]', 'input[type="search"]'],
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
            // Apenas autentica para validar as credenciais. O navegador é fechado dentro de authenticate.
            await authenticate(this.config, {
                url,
                credentials: { username, password },
                retryAttempts: 3,
                retryDelayMs: 2000,
            });

            return { sucesso: true, mensagem: 'Conexão com a Dismatal bem-sucedida!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Teste de conexão falhou.', error);
            throw error; // Re-lança o erro para a rota capturar
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
            // 1. Obter cookies de sessão
            const cookies = await authenticate(this.config, {
                url,
                credentials: { username, password },
                retryAttempts: 3,
                retryDelayMs: 2000,
            });
            this.logger.info('[DismatalScraper] Autenticação e obtenção de cookies concluídas.');

            // 2. Iniciar um navegador novo e limpo para o scraping
            this.logger.info('[DismatalScraper] Iniciando novo navegador para a busca de produtos...');
            browserInstance = await initBrowser(this.config);
            const { page } = browserInstance;
            await page.setCookie(...cookies);
            this.logger.info('[DismatalScraper] Cookies de sessão aplicados ao novo navegador.');

            let produtos = [];

            // Estratégia 1: Navegação Direta por SKU. Esta será a única estratégia.
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Estratégia 1: Navegação direta para SKU ${searchTerm}`);
                try {
                    // Tentando um formato de URL mais comum para páginas de produto.
                    const productUrl = `${url}/produto/${searchTerm}`;
                    this.logger.info(`[DismatalScraper] Navegando para: ${productUrl}`);
                    await page.goto(productUrl, { waitUntil: 'networkidle0', timeout: 20000 });

                    if (await isProductPageValid(page)) {
                        this.logger.info('[DismatalScraper] Página de produto válida. Extraindo...');
                        const produto = await page.evaluate(pageParser, this.selectors);

                        if (produto) {
                            const validatedProduct = { ...produto, codigo: produto.sku || searchTerm.toString() };
                            const validation = validateProduct(validatedProduct);
                            if (validation.valid) {
                                produtos.push(validatedProduct);
                                this.logger.info('[DismatalScraper] Estratégia 1 bem-sucedida.');
                            } else {
                                this.logger.warn('[DismatalScraper] Produto extraído, mas inválido.', { errors: validation.errors });
                            }
                        } else {
                            this.logger.warn('[DismatalScraper] Página de produto parece válida, mas o parser não retornou dados.');
                        }
                    } else {
                        this.logger.warn('[DismatalScraper] A página do produto não é válida ou não foi encontrada.');
                    }
                } catch (e) {
                    this.logger.error(`[DismatalScraper] Estratégia 1 falhou durante a navegação ou extração.`, e);
                    throw new Error(`Falha ao tentar acessar a página do produto para o SKU ${searchTerm}.`);
                }
            }

            if (produtos.length === 0) {
                this.logger.warn(`[DismatalScraper] Nenhum produto encontrado para o SKU "${searchTerm}".`);
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