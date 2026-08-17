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
            // Seletores de página de produto (individual) - Adicionando mais alternativas
            productName: ['h1.product-name', 'h1.product-title', '[data-product-name]', 'h1', '.product-details__name'],
            productSKU: ['[data-sku]', '.product-sku', '.sku', '[itemprop="sku"]', '.product-details__sku'],
            productPrice: ['[data-price]', '.price-group__unity-price', '.product-price', '.price', '.product-details__price'],
            promoPrice: ['[data-promo-price]', '.promotional-price', '.sale-price'],
            stock: ['.stock-info', '.product-stock', '#stock', '[data-stock]'],
            // Seletores de lista de produtos
            productListItem: ['.product-item', '.product-card', '.product-tile', 'div[role="listitem"]'],
            listItemName: ['.product-name', '.product-title', 'h3', 'a.link'],
            listItemSKU: ['.product-sku', '.product-code', '[data-sku]'],
            listItemPrice: ['.product-price', '.price', '.price-tag', '[data-price]'],
            listItemStock: ['.product-stock', '.stock-status', '[data-stock-status]'],
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

            // Estratégia de Navegação Direta Aprimorada
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Iniciando busca por navegação direta para o SKU: ${searchTerm}`);
                try {
                    // 1. Navegar para a página inicial primeiro para estabelecer a sessão com os cookies.
                    this.logger.info(`[DismatalScraper] Estabelecendo sessão na página inicial: ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                    
                    // 2. Pausa para garantir que scripts de inicialização da página rodem.
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 3. Agora, navegar diretamente para a URL do produto na mesma aba.
                    const productUrl = `${url}/produtos/${searchTerm}`;
                    this.logger.info(`[DismatalScraper] Navegando para a URL do produto: ${productUrl}`);
                    await page.goto(productUrl, { waitUntil: 'networkidle0', timeout: 30000 });

                    // 4. Extrair os dados da página.
                    this.logger.info(`[DismatalScraper] URL final: ${page.url()}`);
                    produtos = await this.extractProductData(page, searchTerm);

                } catch (e) {
                    this.logger.error(`[DismatalScraper] Falha na estratégia de navegação direta.`, e);
                    throw new Error(`Falha ao navegar para o produto "${searchTerm}" no portal.`);
                }
            }

            if (produtos.length === 0) {
                this.logger.warn(`[DismatalScraper] Nenhum produto encontrado para o SKU "${searchTerm}".`);
                // Adiciona log do conteúdo da página para depuração
                const pageContent = await page.content();
                this.logger.info(`[DismatalScraper] Conteúdo da página onde o produto não foi encontrado (URL: ${page.url()})`, { pageContent: pageContent.substring(0, 5000) + '...' });
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
        let produtos = [];
        const currentUrl = page.url();

        // Verifica se a URL indica uma página de lista de resultados de busca
        if (currentUrl.includes('/busca')) {
            this.logger.info('[DismatalScraper] Detectada página de lista de produtos. Usando listPageParser...');
            const produtosDaLista = await page.evaluate(listPageParser, this.selectors);
            
            if (produtosDaLista.length > 0) {
                this.logger.info(`[DismatalScraper] Encontrados ${produtosDaLista.length} produtos na lista.`);
                // Filtra e valida os produtos da lista
                produtos = produtosDaLista
                    .map(p => ({ ...p, codigo: p.codigo || searchTerm.toString() }))
                    .filter(p => validateProduct(p).valid);
            }
        } else if (await isProductPageValid(page)) {
            // Se não for uma página de busca, verifica se é uma página de produto individual
            this.logger.info('[DismatalScraper] Detectada página de produto individual. Usando pageParser...');
            const produto = await page.evaluate(pageParser, this.selectors);

            if (produto && validateProduct(produto).valid) {
                produtos.push({ ...produto, codigo: produto.sku || searchTerm.toString() });
                this.logger.info('[DismatalScraper] Extração do produto bem-sucedida.');
            } else if (produto) {
                this.logger.warn('[DismatalScraper] Produto extraído, mas dados inválidos.');
            }
        }

        return produtos;
    }
}