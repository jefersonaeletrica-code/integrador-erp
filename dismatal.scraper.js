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
            productDescription: [
                'div.description-feature',
                '[data-product-description]',
                '.product-description'
            ],
            productSKU: [
                '[data-sku]', '[data-product-sku]', '[itemprop="sku"]', '.sku',
                '.product-sku', '.codigo-produto', 'div.cod-prod div.code span'
            ],
            productPrice: [
                'div.price-group__unity-price span', // Seletor mais específico para o preço unitário.
                '[data-price]', '[data-product-price]', '[itemprop="price"]', // Seletores genéricos.
                '.product-price', '.price-value', '.preco-tabela'
            ],
            promoPrice: [
                '[data-promo-price]', '[data-sale-price]', '.promotional-price',
                '.sale-price', '.preco-promocional'
            ],
            stock: [
                'div.available-stock[style*="cursor: pointer"]', // Seletor mais específico adicionado
                'div.available-stock', // Seletor específico para o estoque disponível.
                '[data-stock]', '[data-product-stock]', '[itemprop="availability"]',
                '.product-stock', '.stock-available', '.estoque', '.stock-info', '.disponivel-time-lead'
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
            // Aumenta o tempo de espera para o modal aparecer, pois ele pode demorar a carregar.
            const closeModalSelector = await findSelector(page, this.selectors.welcomeModalCloseButton, 5000);
            if (closeModalSelector) {
                this.logger.info('[DismatalScraper] Modal de boas-vindas encontrado. Fechando...');
                await page.click(closeModalSelector);
                // Adiciona uma pequena pausa para garantir que a animação de fechamento do modal seja concluída.
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.logger.info('[DismatalScraper] Modal de boas-vindas fechado.');
            }
        } catch (e) {
            // Se o seletor não for encontrado (o que é o esperado na maioria das vezes),
            // apenas registra em modo debug e continua a execução.
            this.logger.debug(`[DismatalScraper] Nenhum modal de boas-vindas encontrado.`);
        }
    }

    /**
     * Lógica de navegação e extração para uma única página de produto.
     * @private
     */
    async _tryDirectNavigation(page, url, searchTerm) {
        const productUrl = `${url}/produtos/${searchTerm}`;

        // OTIMIZAÇÃO: Bloqueia recursos desnecessários para acelerar o carregamento.
        await page.setRequestInterception(true);
        const requestHandler = (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        };
        page.on('request', requestHandler);

        this.logger.info(`[DismatalScraper] Navegando para a URL do produto: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 120000 }); // Timeout de 2 minutos

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

        // LÓGICA DE EXTRAÇÃO OTIMIZADA:
        // Define o conteúdo capturado como a página estática para garantir que a extração
        // ocorra no HTML exato que salvamos, evitando problemas com scripts dinâmicos.
        try {
            const pageContent = await page.content();
            this.logger.info(`[DismatalScraper] Definindo conteúdo HTML estático para extração.`);
            await page.setContent(pageContent, { waitUntil: 'domcontentloaded' });
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha ao definir o conteúdo HTML da página.', error);
            throw new Error(`Falha ao processar o HTML da página do produto: ${error.message}`);
        }

        // Desativa a interceptação para não afetar outras operações.
        page.off('request', requestHandler);
        await page.setRequestInterception(false);

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
        let page;
        try {
            // Otimização: Obter uma página autenticada do gerenciador
            page = await browserManager.getOrCreateInstance(connection);

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
            this.logger.error('[DismatalScraper] Falha crítica ao buscar produtos.', error);
            // Retorna o erro no formato padrão para ser enviado via WebSocket.
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { sucesso: false, erro: errorMessage, produtos: [] };
        }
    }

    /**
     * Tenta extrair o estoque dinamicamente, forçando o aparecimento do pop-up de aviso.
     * @param {import('puppeteer').Page} page
     * @returns {Promise<number|null>}
     * @private
     */
    async _extractDynamicStock(page) {
        this.logger.info('[DismatalScraper] Iniciando estratégia de extração de estoque dinâmico.');
        try {
            // 1. Encontrar o campo de quantidade. Usamos um seletor robusto.
            const quantityInputSelector = 'input[data-test="QUANTITY-INPUT-VALUE"]';
            await page.waitForSelector(quantityInputSelector, { visible: true, timeout: 5000 });

            // 2. Foca, limpa e digita no campo de quantidade para simular um usuário real.
            // Isso é mais confiável para frameworks como Angular.
            this.logger.debug(`[DismatalScraper] Simulando digitação de valor alto no campo de quantidade.`);
            await page.focus(quantityInputSelector);
            // Limpa o campo antes de digitar
            await page.evaluate((selector) => { document.querySelector(selector).value = '' }, quantityInputSelector);
            // Digita o número com pontos para acionar a validação automática do site.
            await page.type(quantityInputSelector, '10.000.000', { delay: 50 });

            // PASSO INTERMEDIÁRIO: Clica fora do campo para disparar o evento 'blur' e validar o valor.
            this.logger.debug('[DismatalScraper] Clicando fora do campo de quantidade para validar o valor.');
            await page.click('body');

            await new Promise(resolve => setTimeout(resolve, 500)); // Pausa para o framework processar a validação.

            // 3. Encontrar e clicar no botão "Adicionar".
            // Voltando a focar no botão interno, mas com uma abordagem de clique mais nativa.
            const addButtonSelector = 'button.add-product.solo-button';
            await page.waitForSelector(`${addButtonSelector}:not([disabled])`, { visible: true, timeout: 8000 });

            // Abordagem de clique nativa via `evaluate`.
            this.logger.debug(`[DismatalScraper] Tentando clicar no botão 'Adicionar' simulando a sequência completa de eventos (mousedown, mouseup, click).`);
            await page.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    // Simula a sequência completa de eventos de um clique real do mouse.
                    const downEvent = new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true });
                    const upEvent = new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true });
                    const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                    button.dispatchEvent(downEvent);
                    button.dispatchEvent(upEvent);
                    button.dispatchEvent(clickEvent);
                } else {
                    throw new Error(`Botão com seletor "${selector}" não foi encontrado no DOM para o clique via dispatchEvent.`);
                }
            }, addButtonSelector);


            // Tira um screenshot imediatamente após o clique para depuração visual.
            try {
                const debugDir = path.join(process.cwd(), 'debug_screenshots');
                fs.mkdirSync(debugDir, { recursive: true });
                const screenshotPath = path.join(debugDir, `dismatal-after-add-click-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                this.logger.info(`[DismatalScraper] Screenshot após clique em 'Adicionar' salvo em: ${screenshotPath}`);
            } catch (screenshotError) {
                this.logger.error('[DismatalScraper] Falha ao capturar screenshot após o clique.', screenshotError);
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa para o pop-up renderizar

            // 4. Aguardar o pop-up de aviso de estoque e extrair o texto.
            // O seletor busca por um contêiner de diálogo que contenha o texto específico.
            const stockWarningSelector = '.mat-dialog-container:has-text("Disponíveis apenas")';
            this.logger.debug(`[DismatalScraper] Aguardando pop-up de aviso de estoque.`);
            const warningElement = await page.waitForSelector(stockWarningSelector, { visible: true, timeout: 10000 });

            // 5. Salva o HTML da página COM O POP-UP para depuração.
            const pageContentWithPopup = await page.content();
            try {
                const debugDir = path.join(process.cwd(), 'debug_screenshots');
                fs.mkdirSync(debugDir, { recursive: true });
                const htmlLogPath = path.join(debugDir, `dismatal-stock-popup-${Date.now()}.html`);
                fs.writeFileSync(htmlLogPath, pageContentWithPopup, 'utf8');
                this.logger.info(`[DismatalScraper] Conteúdo HTML com pop-up de estoque salvo em: ${htmlLogPath}`);
            } catch (logError) {
                this.logger.error('[DismatalScraper] Falha ao salvar o log de conteúdo HTML do pop-up.', logError);
            }

            // 6. Extrai o texto do pop-up e usa o parser para obter o número.
            // Esta abordagem é mais direta e menos propensa a erros do que re-parsear a página inteira.
            const warningText = await warningElement.evaluate(el => el.textContent);
            const stock = parseInt(warningText.match(/(\d+)/)?.[1] || '0', 10);
            this.logger.info(`[DismatalScraper] Estoque dinâmico extraído do pop-up: ${stock}`);
            return stock;
        } catch (error) {
            this.logger.warn(`[DismatalScraper] Estratégia de estoque dinâmico falhou: ${error.message}. O estoque pode não ser retornado.`);
            return null;
        }
    }
    /**
     * Extrai dados do produto da página atual.
     * @param {import('puppeteer').Page} page
     * @param {string} searchTerm
     * @returns {Promise<Array>}
     */
    async extractProductData(page, searchTerm, containerSelectors) {
        const currentUrl = page.url();
        this.logger.info(`[DismatalScraper] Iniciando extração de dados da URL: ${currentUrl}`);

        // A lógica agora é unificada. Se chegamos aqui, a página de produto foi encontrada.
        // Apenas extraímos os dados que estão nela.
        const produtoExtraido = await page.evaluate(pageParser, { ...this.selectors, productDetailContainer: containerSelectors.join(',') });

        if (!produtoExtraido || !produtoExtraido.nome || !produtoExtraido.preco) {
            this.logger.warn('[DismatalScraper] O parser não conseguiu extrair os dados essenciais (nome/preço) do produto.');
            return [];
        }

        // Tenta obter o estoque dinamicamente após a extração principal.
        const dynamicStock = await this._extractDynamicStock(page);

        // Se o estoque dinâmico foi encontrado, ele sobrepõe o que foi extraído inicialmente.
        if (dynamicStock !== null) {
            produtoExtraido.estoque = dynamicStock;
        }

        // O SKU buscado é mantido, e o SKU da página é salvo como um campo separado para referência.
        const produtoFinal = {
            ...produtoExtraido,
            sku: searchTerm, // O SKU original que foi buscado.
            codigoFornecedor: produtoExtraido.sku, // O código de referência encontrado na página.
        };

        this.logger.info('[DismatalScraper] Extração do produto bem-sucedida.', { skuBuscado: searchTerm, skuNaPagina: produtoFinal.codigoFornecedor });
        return [produtoFinal];
    }
}