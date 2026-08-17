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

            // Estratégia de busca: Simular o comportamento do usuário usando a barra de pesquisa.
            // A navegação direta para a URL do produto está sendo bloqueada pelo portal.
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Iniciando busca por SKU: ${searchTerm}`);
                try {
                    // 1. Navegar para a página inicial para garantir que a barra de busca esteja disponível.
                    this.logger.info(`[DismatalScraper] Navegando para a página inicial: ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

                    // 2. Encontrar e preencher o campo de busca.
                    const searchInputSelector = await findSelector(page, this.selectors.searchInput);
                    if (!searchInputSelector) {
                        throw new Error('Campo de busca não foi encontrado na página inicial.');
                    }
                    this.logger.info(`[DismatalScraper] Campo de busca encontrado. Inserindo termo: "${searchTerm}"`);
                    await page.type(searchInputSelector, searchTerm);
                    await page.press(searchInputSelector, 'Enter');

                    // 3. Aguardar a página de resultados carregar.
                    this.logger.info('[DismatalScraper] Aguardando resultados da busca...');
                    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });

                    // 4. Verificar se a busca levou a uma página de produto válida.
                    this.logger.info(`[DismatalScraper] URL após a busca: ${page.url()}`);
                    produtos = await this.extractProductData(page, searchTerm);

                } catch (e) {
                    this.logger.error(`[DismatalScraper] Falha na estratégia de busca.`, e);
                    throw new Error(`Falha ao buscar por "${searchTerm}" no portal.`);
                }
            }

            if (produtos.length === 0) {
                this.logger.warn(`[DismatalScraper] Nenhum produto encontrado para o SKU "${searchTerm}".`);
            }

            this.logger.info(`[DismatalScraper] Busca concluída. Total de produtos: ${produtos.length}.`);
            return { sucesso: true, produtos };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha ao buscar produtos.', error);
            // Em vez de lançar o erro, retorna no formato padrão
            return { sucesso: false, erro: error.message, produtos: [] };
        } finally {
            if (browserInstance) {
                this.logger.info('[DismatalScraper] Busca de produtos: fechando browser...');
                await closeBrowser(browserInstance);
            }
        }
    }

    /**
     * Extrai dados do produto da página atual.
     * @param {import('puppeteer').Page} page
     * @param {string} searchTerm
     * @returns {Promise<Array>}
     */
    async extractProductData(page, searchTerm) {
        const produtos = [];
        if (await isProductPageValid(page)) {
            this.logger.info('[DismatalScraper] Página de produto válida. Extraindo dados...');
            const produto = await page.evaluate(pageParser, this.selectors);

            if (produto) {
                const validatedProduct = { ...produto, codigo: produto.sku || searchTerm.toString() };
                const validation = validateProduct(validatedProduct);
                if (validation.valid) {
                    produtos.push(validatedProduct);
                    this.logger.info('[DismatalScraper] Extração do produto bem-sucedida.');
                } else {
                    this.logger.warn('[DismatalScraper] Produto extraído, mas dados inválidos.', { errors: validation.errors });
                }
            }
        }
        return produtos;
    }
}