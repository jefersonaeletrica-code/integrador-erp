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
            // --- Seletores de Autenticação (baseado no seu exemplo) ---
            ...DEFAULT_LOGIN_SELECTORS,
            loginModal: ['[role="dialog"]', '.modal', '.login-modal', '.mat-dialog-container'],

            // --- Seletores de Busca ---
            searchInput: [
                'input[placeholder*="sku"]', 'input[placeholder*="SKU"]',
                'input[placeholder*="produto"]', 'input[placeholder*="Produto"]',
                'input.search-input', '.search-field input', 'input[type="search"]'
            ],

            // --- Contêineres e Estados da Página ---
            productDetailContainer: ['div.product-details', '.product-details-info', 'app-detalhe-produto', '[data-product-container]'],
            productListItem: ['.product-grid', '.product-list', '.items-list', '.product-item', '.product-card'],
            productNotFound: ['.not-found-container', '.product-not-found', '.empty-results'],
            captchaContainer: ['#captcha-container', 'div.g-recaptcha', '[data-captcha]'],
            loadingSpinner: ['.spinner', 'app-loading', '[class*="loading"]', '[class*="spinner"]'],

            // --- Detalhes do Produto (Página Individual) ---
            productName: [
                '[data-product-name]', '[itemprop="name"]', 'h1.product-title',
                'h1.product-name', '.product-name h1', 'div.product-description span.title-product', 'h1'
            ],
            productSKU: [
                '[data-sku]', '[data-product-sku]', '[itemprop="sku"]', '.sku',
                '.product-sku', '.codigo-produto', 'div.cod-prod div.code span'
            ],
            productPrice: [
                '[data-price]', '[data-product-price]', '[itemprop="price"]',
                '.product-price', '.price-value', '.preco-tabela',
                'div.price-group__unity-price span:not(.price-group__before-price)'
            ],
            promoPrice: [
                '[data-promo-price]', '[data-sale-price]', '.promotional-price',
                '.sale-price', '.preco-promocional'
            ],
            stock: [
                '[data-stock]', '[data-product-stock]', '[itemprop="availability"]',
                '.product-stock', '.stock-available', '.estoque', '.stock-info'
            ],
            productImages: [
                '.product-media img', 'img.product-image', '[data-product-image]'
            ],

            // --- Detalhes do Produto (Página de Lista) ---
            listItemName: [
                '.product-name', '.product-title', 'h3', 'a.link'
            ],
            listItemSKU: [
                '.product-sku', '.product-code', '[data-sku]'
            ],
            listItemPrice: [
                '.product-price', '.price', '.price-tag', '[data-price]'
            ],

            // --- Seletores de Preços Múltiplos / Atacado ---
            multipleTable: [
                '[data-multiplos-table]', '.tabela-multiplos', '.tabela-atacado',
                '.compre-pague-menos', 'table.multiplos'
            ],
            multipleLowerPrice: [
                '[data-multiple-price]', '.multiplo-preco', 'td[data-price]'
            ],
            multipleQuantity: [
                '[data-multiple-qty]', '.multiplo-quantidade', 'td[data-qty]'
            ],

            // --- Seletores de Informações Tributárias (IPI) ---
            tributaryInfo: [
                '[data-tributary-info]', '.infos-tributarias', '.tax-information'
            ],
            ipiField: [
                '[data-ipi-value]', '.ipi-percent', '.ipi-value', 'span.ipi'
            ],
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
    async _tryDirectNavigation(page, url, searchTerm) {
        const productUrl = `${url}/produtos/${searchTerm}`;
        this.logger.info(`[DismatalScraper] Navegando para a URL do produto: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 120000 }); // Timeout de 2 minutos

        // Tenta fechar qualquer modal de boas-vindas que possa ter aparecido.
        await this._closeWelcomeModal(page);

        // Simula uma rolagem para "acordar" scripts de lazy-loading.
        this.logger.debug('[DismatalScraper] Simulando rolagem da página para disparar a renderização de conteúdo.');
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.evaluate(() => window.scrollBy(0, -500));

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

        // LOG DE DEPURAÇÃO: Salva o conteúdo HTML da página para análise.
        try {
            const pageContent = await page.content();
            const debugDir = path.join(process.cwd(), 'debug_screenshots');
            fs.mkdirSync(debugDir, { recursive: true });
            const htmlLogPath = path.join(debugDir, `dismatal-page-content-${Date.now()}.html`);
            fs.writeFileSync(htmlLogPath, pageContent, 'utf8');
            this.logger.info(`[DismatalScraper] Conteúdo HTML da página salvo para depuração em: ${htmlLogPath}`);
        } catch (logError) {
            this.logger.error('[DismatalScraper] Falha ao salvar o log de conteúdo HTML.', logError);
        }


        try {
            this.logger.info(`[DismatalScraper] Aguardando o conteúdo do produto ou um estado alternativo (erro, captcha)...`);

            const raceResult = await Promise.race([
                // SALVAGUARDA: Timeout de segurança para evitar travamento indefinido.
                new Promise(resolve => setTimeout(() => resolve({ state: 'hard_timeout' }), 30000)),
                // Adiciona uma promessa que resolve se um spinner ficar visível por muito tempo
                (async () => {
                    try {
                        await page.waitForSelector(this.selectors.loadingSpinner.join(','), { visible: true, timeout: 15000 });
                        // Se o spinner ainda estiver lá após 15s, consideramos que a página travou.
                        return { state: 'loading_stuck', selector: this.selectors.loadingSpinner[0] };
                    } catch (e) {
                        // Se o spinner não aparecer ou desaparecer, esta promessa nunca vencerá a corrida, o que é bom.
                        return new Promise(() => {}); // Retorna uma promessa que nunca resolve
                    }
                })(),
                findSelector(page, this.selectors.productDetailContainer, 120000).then(selector => ({ state: 'product', selector })),
                findSelector(page, this.selectors.productNotFound, 120000).then(selector => ({ state: 'not_found', selector })),
                findSelector(page, this.selectors.captchaContainer, 120000).then(selector => ({ state: 'captcha', selector })),
            ]);

            if (raceResult.state === 'product') {
                this.logger.info(`[DismatalScraper] Conteúdo do produto carregado (usando seletor '${raceResult.selector}'). Prosseguindo com a extração.`);
            } else if (raceResult.state === 'not_found') {
                this.logger.warn(`[DismatalScraper] Página de 'Produto não encontrado' detectada.`);
                throw new Error('Produto não encontrado no portal do fornecedor.');
            } else if (raceResult.state === 'captcha') {
                this.logger.error(`[DismatalScraper] CAPTCHA detectado. A busca não pode continuar.`);
                throw new Error('CAPTCHA detectado, bloqueando o acesso do scraper.');
            } else if (raceResult.state === 'loading_stuck') {
                this.logger.error(`[DismatalScraper] A página parece ter travado em um estado de carregamento.`);
                throw new Error('A página do produto travou durante o carregamento.');
            } else if (raceResult.state === 'hard_timeout') {
                this.logger.error(`[DismatalScraper] Timeout de segurança atingido. A página não respondeu em 30 segundos.`);
                throw new Error('A página não respondeu em tempo hábil.');
            } else {
                // Este caso não deve acontecer com Promise.race, mas é uma salvaguarda.
                throw new Error('Estado da página indeterminado após o carregamento.');
            }
        } catch (waitError) {
            
            // LOG APRIMORADO: Extrai e loga o conteúdo do Shadow DOM para depuração.
            if (!page.isClosed()) {
                const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
                fs.mkdirSync(screenshotDir, { recursive: true });
                const screenshotPath = path.join(screenshotDir, `dismatal-product-error-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                this.logger.info(`[DismatalScraper] Screenshot do erro salvo em: ${screenshotPath}`);
            }
            // Se o erro já for específico, repassa.
            if (['CAPTCHA', 'Produto não encontrado', 'travou', 'não respondeu'].some(term => waitError.message.includes(term))) {
                throw waitError;
            }
            throw new Error(`Timeout: O conteúdo do produto não foi carregado em 2 minutos.`);
        }

        // Extrair os dados da página.
        this.logger.info(`[DismatalScraper] URL final: ${page.url()}`);
        const extractedProducts = await this.extractProductData(page, searchTerm, this.selectors.productDetailContainer);

        return extractedProducts;
    }

    /**
     * Tenta encontrar o produto simulando uma busca manual no site.
     * @private
     */
    async _trySearchStrategy(page, url, searchTerm) {
        this.logger.info(`[DismatalScraper] Iniciando busca por simulação de usuário para o termo: ${searchTerm}`);

        // 1. Garante que estamos na página inicial para realizar a busca
        if (!page.url().endsWith('.br/')) {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
            // Adiciona uma pausa e rolagem para garantir que a página inicial esteja totalmente renderizada
            // antes de procurar o campo de busca.
            this.logger.debug('[DismatalScraper] Página inicial carregada. Aguardando estabilização...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            await page.evaluate(() => window.scrollBy(0, 200));
        }

        // 2. Encontra o campo de busca e digita o termo
        const searchInputSelector = await findSelector(page, this.selectors.searchInput, 15000);
        if (!searchInputSelector) throw new Error('Campo de busca não encontrado na página.');

        await page.type(searchInputSelector, searchTerm);
        await page.keyboard.press('Enter');

        // 3. Aguarda o resultado da busca, que é uma atualização dinâmica, não uma navegação.
        // Usamos a mesma lógica de "corrida" da navegação direta para aguardar o resultado.
        this.logger.info('[DismatalScraper] Busca executada. Aguardando resultados dinâmicos...');
        const raceResult = await Promise.race([
            new Promise(resolve => setTimeout(() => resolve({ state: 'hard_timeout' }), 30000)),
            findSelector(page, this.selectors.productDetailContainer, 120000).then(selector => ({ state: 'product', selector })),
            findSelector(page, this.selectors.productNotFound, 120000).then(selector => ({ state: 'not_found', selector })),
        ]);

        if (raceResult.state === 'product') {
            this.logger.info(`[DismatalScraper] Resultados da busca carregados. Prosseguindo com a extração.`);
        } else if (raceResult.state === 'not_found' || raceResult.state === 'hard_timeout') {
            this.logger.warn(`[DismatalScraper] A busca não retornou um produto válido ou excedeu o tempo de espera.`);
            throw new Error('A busca manual não encontrou o produto ou a página não respondeu.');
        }

        return await this.extractProductData(page, searchTerm, this.selectors.productDetailContainer);
    }

    /**
     * Busca produtos no portal.
     * @param {object} connection - Objeto de conexão com credenciais.
     * @param {string} searchTerm - O termo a ser buscado.
     */
    async fetchProducts(connection, searchTerm) {
        const { url } = connection.credentials;
        this.logger.info(`[DismatalScraper] Iniciando busca de produtos para o termo: ${searchTerm}`);
        try {
            // Otimização: Obter uma página autenticada do gerenciador
            const page = await browserManager.getOrCreateInstance(connection);

            let produtos = [];

            // --- ESTRATÉGIA 1: Tentar Navegação Direta (mais rápido) ---
            try {
                // Apenas tenta a navegação direta se o termo de busca for um SKU válido.
                if (searchTerm && isValidSKU(searchTerm)) {
                    this.logger.info(`[DismatalScraper] Estratégia 1: Tentando navegação direta para o SKU: ${searchTerm}`);
                    produtos = await this._tryDirectNavigation(page, url, searchTerm);
                } else {
                    // Se não for um SKU, pula direto para a busca manual.
                    throw new Error('Termo de busca não é um SKU válido, pulando para a Estratégia 2.');
                }
            } catch (e) {
                this.logger.warn(`[DismatalScraper] Estratégia 1 (Navegação Direta) falhou ou foi pulada: ${e.message}. Iniciando Estratégia 2 (Busca Manual).`);
                // --- ESTRATÉGIA 2: Fallback para Busca Manual ---
                produtos = await this._trySearchStrategy(page, url, searchTerm);
            }

            if (produtos.length === 0) {
                this.logger.warn('[DismatalScraper] Nenhuma das estratégias encontrou um produto para o termo de busca.');
                return { sucesso: false, erro: 'Nenhum produto foi encontrado com este SKU.', produtos: [] };
            }
            this.logger.info(`[DismatalScraper] Busca concluída. Total de produtos: ${produtos.length}.`);
            return { sucesso: true, produtos: produtos };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha ao buscar produtos.', error);
            // Retorna o erro no formato padrão para ser enviado via WebSocket.
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { sucesso: false, erro: errorMessage, produtos: [] };
        }
    }

    /**
     * Extrai dados do produto da página atual.
     * @param {import('puppeteer').Page} page
     * @param {string} searchTerm
     * @returns {Promise<Array>}
     */
    async extractProductData(page, searchTerm, containerSelectors) {
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
            const produto = await page.evaluate(pageParser, { ...this.selectors, productDetailContainer: containerSelectors.join(',') });

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