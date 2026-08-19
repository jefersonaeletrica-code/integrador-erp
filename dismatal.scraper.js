import fs from 'fs';
import path from 'path';
import db from './db.js';
import { initBrowser, closeBrowser } from './browser.js';
import { authenticate, tryPasswordLogin, DEFAULT_LOGIN_SELECTORS } from './auth.js';
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
            // Seletor para o container principal dos detalhes do produto
            productDetailContainer: ['.product-details', '.product-info', '.product-summary', 'div[role="main"]'],
            // Seletores de página de produto (individual) - Adicionando mais alternativas
            productName: ['div.product-details-container span.title-product', 'h1.product-name', 'h1.product-title'],
            productSKU: ['[data-sku]', '.product-sku', '.sku', '[itemprop="sku"]', '.product-details__sku'],
            productPrice: ['div.price-group span.price-group__unity-price', 'div.product-price-container span.price', '[data-price]'],
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
            // Adiciona uma pausa para dar tempo ao modal de aparecer.
            await new Promise(resolve => setTimeout(resolve, 2000));
            const closeModalSelector = await findSelector(page, this.selectors.welcomeModalCloseButton);
            if (closeModalSelector) {
                this.logger.info('[DismatalScraper] Modal de boas-vindas encontrado. Fechando...');
                await page.click(closeModalSelector);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Espera para o modal fechar
            }
        } catch (e) {
            this.logger.debug('[DismatalScraper] Nenhum modal de boas-vindas encontrado ou erro ao fechar.');
        }
    }

    /**
     * Lógica de navegação e extração para uma única página de produto.
     * @private
     */
    async _fetchProductPage(page, url, searchTerm) {
        const productUrl = `${url}/produtos/${searchTerm}`;
        this.logger.info(`[DismatalScraper] Navegando para a URL do produto: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });

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
            // A validação de sucesso será pelo preço, pois ele só aparece se o usuário estiver logado.
            this.logger.info(`[DismatalScraper] Aguardando o conteúdo dinâmico do produto carregar (URL: ${page.url()})...`);
            await page.waitForSelector(this.selectors.productPrice.join(','), { timeout: 60000 });
        } catch (waitError) {
            this.logger.error('[DismatalScraper] Timeout ao esperar pelo conteúdo do produto.', waitError);
            // Salva o screenshot em um arquivo para facilitar a depuração.
            const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
            fs.mkdirSync(screenshotDir, { recursive: true });
            const screenshotPath = path.join(screenshotDir, `dismatal-product-error-${Date.now()}.png`);
            // Verifica se a página ainda está aberta antes de tentar o screenshot
            if (!page.isClosed()) {
                await page.screenshot({ path: screenshotPath, fullPage: true });
                this.logger.info(`[DismatalScraper] Screenshot do erro salvo em: ${screenshotPath}`);
            }
            throw new Error('O conteúdo do produto não foi carregado na página.');
        }

        // Adiciona log detalhado do HTML para depuração dos seletores.
        try {
            const productContainerSelector = await findSelector(page, this.selectors.productDetailContainer);
            if (productContainerSelector) {
                const productContainerHTML = await page.$eval(productContainerSelector, el => el.outerHTML);
                this.logger.info(`[DismatalScraper] Conteúdo do container do produto (${productContainerSelector}) encontrado para extração:`, { html: productContainerHTML.substring(0, 4000) + '...' });
            } else {
                this.logger.warn('[DismatalScraper] Nenhum container de detalhes do produto encontrado com os seletores atuais. Logando o body inteiro.');
                const bodyHTML = await page.evaluate(() => document.body.outerHTML);
                this.logger.info('[DismatalScraper] Conteúdo do body:', { html: bodyHTML.substring(0, 5000) + '...' });
            }
        } catch (logError) {
            this.logger.error('[DismatalScraper] Erro ao tentar logar o conteúdo da página para depuração.', logError);
        }


        // Extrair os dados da página.
        this.logger.info(`[DismatalScraper] URL final: ${page.url()}`);
        const extractedProducts = await this.extractProductData(page, searchTerm);
        return extractedProducts;
    }

    /**
     * Executa uma função com retentativas em caso de erro de "Target Closed".
     * @private
     */
    async _withTargetClosedRetry(fn, maxAttempts = 2) {
        let attempt = 1;
        while (attempt <= maxAttempts) {
            try {
                return await fn();
            } catch (e) {
                // Se o erro for de "Target Closed" e ainda houver tentativas, tenta novamente.
                if (e.message.includes('Target closed') && attempt < maxAttempts) {
                    this.logger.warn(`[DismatalScraper] Erro de "Target Closed" detectado. Tentativa ${attempt} de ${maxAttempts}. Reiniciando a operação...`);
                    attempt++;
                    // Uma pequena pausa antes de tentar novamente.
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    // Se não for um erro de "Target Closed" ou se as tentativas acabaram, lança o erro.
                    throw e;
                }
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
            // 1. Iniciar o navegador e a página
            this.logger.info('[DismatalScraper] Iniciando navegador para a operação completa...');
            browserInstance = await initBrowser(this.config); // browserInstance contém { browser, page }
            let { page } = browserInstance;

            // 2. Autenticar diretamente na página
            this.logger.info('[DismatalScraper] Executando autenticação na página...');
            const authResult = await authenticate(page, {
                url,
                credentials: { username, password },
                sessionData: connection.cookies, // Passa os dados de sessão salvos (anteriormente chamados de cookies)
                retryAttempts: 3,
                retryDelayMs: 2000,
                browserConfig: this.config, // Passa a config para permitir a recriação do browser
            });
            
            // This is the most critical part. The `page` object might have been
            // recreated inside `authenticate`. We MUST use the returned instance.
            page = authResult.page;

            // Se a autenticação gerou novos cookies, atualiza a conexão
            if (authResult.sessionData) {
                connection.cookies = authResult.sessionData; // Salva os novos dados da sessão no campo 'cookies'
                await db.updateSupplierConnection(connection);
            }
            this.logger.info('[DismatalScraper] Página autenticada com sucesso.');

            let produtos = [];

            // Estratégia de Navegação Direta Aprimorada
            if (searchTerm && isValidSKU(searchTerm)) {
                this.logger.info(`[DismatalScraper] Iniciando busca por navegação direta para o SKU: ${searchTerm}`);
                
                // Envolve a lógica de busca em uma função com retentativas para "Target Closed"
                await this._withTargetClosedRetry(async () => {
                    // A cada tentativa, garante que a página está autenticada.
                    // A função `authenticate` é inteligente e usará cookies se a sessão ainda for válida.
                    // A lógica de retentativa agora inclui a recriação do browser se necessário.
                    const freshAuthResult = await authenticate(page, {
                        url,
                        credentials: connection.credentials,
                        sessionData: connection.cookies,
                        retryAttempts: 1,
                        browserConfig: this.config
                    });
                    page = freshAuthResult.page; // Usa a página mais recente

                    const extractedProducts = await this._fetchProductPage(page, url, searchTerm);
                    produtos = extractedProducts; // Substitui os produtos com o resultado da última tentativa bem-sucedida
                    // Se a tentativa foi bem-sucedida, atualiza a instância do navegador para uso futuro.
                    browserInstance = { browser: page.browser(), page };
                });

            } else if (searchTerm) { // Se não for um SKU válido, mas houver um termo de busca
                this.logger.warn(`[DismatalScraper] O termo "${searchTerm}" não é um SKU válido para navegação direta. Outras estratégias de busca não estão implementadas.`);
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
            // Captura um screenshot no momento de qualquer falha, se o navegador estiver ativo.
            if (browserInstance && browserInstance.page && !browserInstance.page.isClosed()) {
                try {
                    const screenshotDir = path.join(process.cwd(), 'debug_screenshots');
                    fs.mkdirSync(screenshotDir, { recursive: true });
                    const screenshotPath = path.join(screenshotDir, `dismatal-general-failure-${Date.now()}.png`);
                    await browserInstance.page.screenshot({ path: screenshotPath, fullPage: true });
                    this.logger.info(`[DismatalScraper] Screenshot da falha salvo em: ${screenshotPath}`);
                } catch (screenshotError) {
                    this.logger.error('[DismatalScraper] Falha ao tentar capturar o screenshot.', screenshotError);
                }
            }
            // Em vez de lançar o erro, retorna no formato padrão
            // Garante que o erro seja uma string para evitar problemas de serialização
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { sucesso: false, erro: errorMessage, produtos: [] };
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