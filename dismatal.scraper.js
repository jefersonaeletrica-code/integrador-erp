import fs from 'fs';
import path from 'path';
import db from './db.js';
import { initBrowser, closeBrowser } from './browser.js'; // closeBrowser pode ser removido se não for mais usado diretamente
import { authenticate, tryPasswordLogin, DEFAULT_LOGIN_SELECTORS } from './auth.js';
import { getLogger } from './logger.js';
import {
    findSelector,
    pageParser,
    listPageParser,
    isValidSKU
} from './parsers.js';
import browserManager from './browserManager.js';

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
            // Seletor para o container principal dos detalhes do produto. O seletor de componente Angular estava falhando.
            productDetailContainer: '.product-details-info', // Usando uma classe CSS mais estável como container principal.
            // Seletores de página de produto (individual) - Adicionando mais alternativas
            productName: ['div.product-description span.title-product'],
            productSKU: ['div.cod-prod div.code span'],
            productPrice: ['div.price-group__unity-price span:not(.price-group__before-price)'],
            promoPrice: ['[data-promo-price]', '.promotional-price', '.sale-price'],
            productImages: ['.product-media img'], // Seletor para capturar todas as imagens do produto
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
     * Executa uma autenticação completa com usuário/senha e salva a sessão no banco de dados.
     * @param {object} connection - Objeto de conexão com credenciais.
     */
    async performAuthentication(connection) {
        const { url, username, password } = connection.credentials;
        let browserInstance = null;
        this.logger.info('[DismatalScraper] Iniciando tarefa de autenticação completa...');
        try {
            browserInstance = await initBrowser(this.config);
            const { page } = browserInstance;

            // Chama diretamente a função de login por senha, ignorando a validação de cookies.
            const authResult = await tryPasswordLogin(page, {
                url,
                credentials: { username, password },
                retryAttempts: 3,
                retryDelayMs: 2000,
                browserConfig: this.config,
            }, this.selectors);

            if (authResult.sessionData) {
                connection.cookies = authResult.sessionData;
                await db.updateSupplierConnection(connection);
                this.logger.info('[DismatalScraper] Sessão salva no banco de dados com sucesso.');
            }

            return { sucesso: true, mensagem: 'Autenticação realizada e sessão salva com sucesso!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha na autenticação completa.', error);
            throw error;
        } finally {
            if (browserInstance) {
                await closeBrowser(browserInstance);
            }
        }
    }

    /**
     * Valida se a sessão salva no banco de dados ainda está ativa.
     * @param {object} connection - Objeto de conexão com credenciais e session_data.
     */
    async validateAuthentication(connection) {
        const { url } = connection.credentials;
        let browserInstance = null;
        this.logger.info('[DismatalScraper] Iniciando validação de sessão...');
        try {
            browserInstance = await initBrowser(this.config);
            const { page } = browserInstance;

            // Para validar, chamamos diretamente a função de autenticação por cookie.
            // Não passamos pelo orquestrador principal para evitar o fallback para login por senha.
            // Precisamos importar a função `tryCookieAuth` do `auth.js`
            const { tryCookieAuth } = await import('./auth.js');
            await tryCookieAuth(page, url, connection.cookies, this.selectors);

            return { sucesso: true, mensagem: 'A sessão salva está ativa!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Validação de sessão falhou.', error);
            throw error; // Re-lança o erro para a rota capturar
        } finally {
            if (browserInstance) {
                await closeBrowser(browserInstance);
            }
        }
    }

    /**
     * Tenta fechar o modal de boas-vindas que pode aparecer após o login ou na navegação.
     * @param {import('puppeteer').Page} page
     * @private
     */
    async _closeWelcomeModal(page) {
        this.logger.debug('[DismatalScraper] Verificando e tentando fechar modal de boas-vindas...');
        try {
            // Usa waitForSelector com um timeout curto para verificar se o modal existe,
            // o que é mais eficiente do que uma pausa fixa.
            const closeModalSelector = await findSelector(page, this.selectors.welcomeModalCloseButton, 5000);
            if (closeModalSelector) {
                this.logger.info('[DismatalScraper] Modal de boas-vindas encontrado. Fechando...');
                await page.click(closeModalSelector);
            }
        } catch (e) {
            // Se o seletor não for encontrado (o que é o esperado na maioria das vezes),
            // apenas registra em modo debug e continua a execução.
            this.logger.debug(`[DismatalScraper] Nenhum modal de boas-vindas encontrado ou erro ao fechar: ${e.message}`);
        }
    }

    /**
     * Lógica de navegação e extração para uma única página de produto.
     * @private
     */
    async _fetchProductPage(page, url, searchTerm) {
        const productUrl = `${url}/produtos/${searchTerm}`;
        this.logger.info(`[DismatalScraper] Navegando para a URL do produto: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

        // Tenta fechar qualquer modal de boas-vindas que possa ter aparecido.
        await this._closeWelcomeModal(page);

        // Adiciona o screenshot solicitado APÓS fechar o modal.
        try {
            const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
            fs.mkdirSync(screenshotDir, { recursive: true });
            const screenshotPath = path.join(screenshotDir, `dismatal-after-product-nav-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            this.logger.info(`[DismatalScraper] Screenshot após navegação para produto salvo em: ${screenshotPath}`);
        } catch (screenshotError) {
            this.logger.error('[DismatalScraper] Falha ao capturar screenshot após fechar o modal.', screenshotError);
        }

        try {
            this.logger.info(`[DismatalScraper] Aguardando o conteúdo dinâmico do produto carregar (URL: ${page.url()})...`);
            // A espera mais robusta é simplesmente aguardar que o container principal do produto
            // esteja visível na página. Isso é mais rápido e confiável do que `waitForFunction`
            // para este cenário, pois o componente Angular renderiza todo o bloco de uma vez.
            await page.waitForSelector(this.selectors.productDetailContainer, { visible: true, timeout: 60000 });
            
            this.logger.info(`[DismatalScraper] Conteúdo do produto carregado. Prosseguindo com a extração.`);
        } catch (waitError) {
            this.logger.error('[DismatalScraper] Timeout ao esperar pelo conteúdo do produto.', waitError);
            
            // LOG APRIMORADO: Extrai e loga o conteúdo do Shadow DOM para depuração.
            if (!page.isClosed()) {
                const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
                fs.mkdirSync(screenshotDir, { recursive: true });
                const screenshotPath = path.join(screenshotDir, `dismatal-product-error-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                this.logger.info(`[DismatalScraper] Screenshot do erro salvo em: ${screenshotPath}`);
            }
            throw new Error('O conteúdo do produto não foi carregado na página.');
        }

        // Extrair os dados da página.
        this.logger.info(`[DismatalScraper] URL final: ${page.url()}`);
        const extractedProducts = await this.extractProductData(page, searchTerm);

        return extractedProducts;
    }

    /**
     * Busca produtos no portal.
     * @param {object} connection - Objeto de conexão com credenciais.
     * @param {string} searchTerm - O termo a ser buscado.
     */
    async fetchProducts(connection, searchTerm) {
        const { url } = connection.credentials;
        this.logger.info('[DismatalScraper] Iniciando busca de produtos...');
        try {
            // Otimização: Obter uma página autenticada do gerenciador
            const page = await browserManager.getOrCreateInstance(connection);

            let produtos = [];

            // Estratégia de Navegação Direta Aprimorada
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Iniciando busca por navegação direta para o SKU: ${searchTerm}`);
                // Passa a página já autenticada para a lógica de busca
                produtos = await this._fetchProductPage(page, url, searchTerm);

            } else if (searchTerm) { // Se não for um SKU válido, mas houver um termo de busca
                this.logger.warn(`[DismatalScraper] O termo "${searchTerm}" não é um SKU válido para navegação direta. Outras estratégias de busca não estão implementadas.`);
            }

            // A lógica de log para "nenhum produto encontrado" já está dentro de _fetchProductPage e extractProductData

            if (produtos.length === 0) {
                this.logger.info('[DismatalScraper] Nenhum produto encontrado para o termo de busca.');
                return { sucesso: false, erro: 'Nenhum produto foi encontrado com este SKU.', produtos: [] };
            }
            this.logger.info(`[DismatalScraper] Busca concluída. Total de produtos: ${produtos.length}.`);
            return { sucesso: true, produtos: produtos };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha ao buscar produtos.', error);
            // A captura de screenshots de erro agora é tratada dentro de _fetchProductPage
            // Em vez de lançar o erro, retorna no formato padrão
            // Garante que o erro seja uma string para evitar problemas de serialização
            const errorMessage = `Falha ao buscar produtos: ${error instanceof Error ? error.message : String(error)}`;
            return { sucesso: false, erro: errorMessage, produtos: [] };
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
                    .filter(p => p.nome && p.preco); // Validação simples
            }
        } else {
            // Se não for uma página de busca, verifica se é uma página de produto individual
            this.logger.info('[DismatalScraper] Detectada página de produto individual. Usando pageParser...');
            const produto = await page.evaluate(pageParser, this.selectors);

            if (produto && produto.nome && produto.preco) { // Validação simples
                produtos.push({ ...produto, codigo: produto.sku || searchTerm.toString() });
                this.logger.info('[DismatalScraper] Extração do produto bem-sucedida.');
            } else if (produto) {
                this.logger.warn('[DismatalScraper] Produto extraído, mas dados inválidos.');
            }
        }

        return produtos;
    }
}