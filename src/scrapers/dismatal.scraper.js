import fs from 'fs';
import path from 'path';
import { getLogger } from '../core/logger.js';
import {
    findSelector,
    pageParser,
    isValidSKU
} from './parsers.js';
import browserManager from '../core/browserManager.js';

/**
 * @class DismatalScraper
 * @description Encapsula a lógica de scraping para o portal Dismatal B2B.
 */
export class DismatalScraper {
    constructor(config) {
        this.config = config;
        this.logger = getLogger();
        // Carrega os seletores de um arquivo de configuração JSON externo.
        const selectorsPath = path.join(process.cwd(), 'src', 'config', 'dismatal.selectors.json');
        this.selectors = JSON.parse(fs.readFileSync(selectorsPath, 'utf8'));
    }

    /**
     * Executa uma autenticação completa com usuário/senha e salva a sessão no banco de dados.
     * @param {object} connection - Objeto de conexão com credenciais.
     */
    async performAuthentication(connection) {
        this.logger.info('[DismatalScraper] Iniciando tarefa de autenticação completa...');
        try {
            // Força a criação de uma nova instância, ignorando qualquer sessão de cookies existente.
            // O browserManager se encarregará de criar, autenticar e salvar a nova sessão.
            await browserManager.getOrCreateInstance(connection, { forceNew: true, selectors: this.selectors });
            this.logger.info('[DismatalScraper] Autenticação forçada e sessão renovada com sucesso através do BrowserManager.');

            return { sucesso: true, mensagem: 'Autenticação realizada e sessão salva com sucesso!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Falha na autenticação completa.', error);
            throw error;
        }
    }

    /**
     * Valida se a sessão salva no banco de dados ainda está ativa.
     * @param {object} connection - Objeto de conexão com credenciais e session_data.
     */
    async validateAuthentication(connection) {
        this.logger.info('[DismatalScraper] Iniciando validação de sessão...');
        try {
            // O gerenciador tentará reutilizar a sessão. Se falhar, lançará um erro.
            await browserManager.getOrCreateInstance(connection, { selectors: this.selectors });

            return { sucesso: true, mensagem: 'A sessão salva está ativa!' };
        } catch (error) {
            this.logger.error('[DismatalScraper] Validação de sessão falhou.', error);
            throw error; // Re-lança o erro para a rota capturar
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
            if (req.isInterceptResolutionHandled()) return;
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

        // Desativa a interceptação para não afetar outras operações.
        page.off('request', requestHandler);
        await page.setRequestInterception(false);

        // Extrair os dados da página.
        this.logger.info(`[DismatalScraper] URL final: ${page.url()}`);
        const extractedProducts = await this.extractProductData(page, searchTerm, this.selectors.productDetailContainer);
        return extractedProducts;
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
            page = await browserManager.getOrCreateInstance(connection, { selectors: this.selectors });

            // Garante que, se a página fechar inesperadamente, a instância seja limpa.
            page.on('close', () => {
                this.logger.warn(`[DismatalScraper] A página foi fechada inesperadamente durante a busca. Removendo instância do cache.`);
                browserManager.instances.delete(connection.id);
            });

            // Apenas tenta a navegação direta se o termo de busca for um SKU válido.
            if (!searchTerm || !isValidSKU(searchTerm)) {
                throw new Error('O termo de busca não é um SKU válido.');
            }

            this.logger.info(`[DismatalScraper] Tentando navegação direta para o SKU: ${searchTerm}`);
            const produtos = await this._tryDirectNavigation(page, url, searchTerm);

            if (produtos.length === 0) {
                this.logger.warn('[DismatalScraper] A navegação direta não encontrou um produto para o termo de busca.');
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

            // 2. Foca no campo e simula a digitação humana para contornar máscaras de input.
            this.logger.debug('[DismatalScraper] Focando e limpando o campo de quantidade.');
            await page.focus(quantityInputSelector);
            
            // Simula Ctrl+A (selecionar tudo) e Backspace para limpar o campo de forma robusta.
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');

            this.logger.debug('[DismatalScraper] Digitanto o valor de alta quantidade.');
            await page.type(quantityInputSelector, '999999', { delay: 20 });

            // Dispara um evento de input final para garantir que o Angular detecte a mudança.
            this.logger.debug('[DismatalScraper] Disparando evento de input final.');
            await page.evaluate(selector => {
                const input = document.querySelector(selector);
                if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
            }, quantityInputSelector);

            // 3. Encontrar e clicar no botão "Adicionar".
            // Voltando a focar no botão interno, mas com uma abordagem de clique mais nativa.
            const addButtonSelector = 'button.add-product.solo-button';
            await page.waitForSelector(`${addButtonSelector}:not([disabled])`, { visible: true, timeout: 8000 });

            // Salva o HTML ANTES do clique para depuração.
            try {
                const pageContentBeforeClick = await page.content();
                const debugDir = path.join(process.cwd(), 'debug_screenshots');
                fs.mkdirSync(debugDir, { recursive: true });
                const htmlLogPath = path.join(debugDir, `dismatal-before-add-click-${Date.now()}.html`);
                fs.writeFileSync(htmlLogPath, pageContentBeforeClick, 'utf8');
                this.logger.info(`[DismatalScraper] Conteúdo HTML antes do clique salvo em: ${htmlLogPath}`);
            } catch (logError) {
                this.logger.error('[DismatalScraper] Falha ao salvar o log de conteúdo HTML antes do clique.', logError);
            }


            // Abordagem mais robusta: usar o clique direto no elementHandle.
            // Isso é mais confiável do que clicar por coordenadas.
            this.logger.debug(`[DismatalScraper] Tentando clicar no botão 'Adicionar' via page.evaluate.`);
            await page.evaluate((selector) => {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                }
            }, addButtonSelector);
            this.logger.info(`[DismatalScraper] Clique executado no botão 'Adicionar' via page.evaluate.`);


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

            // 4. Aguardar o pop-up de aviso de estoque e extrair o texto.
            // O seletor busca por um contêiner de diálogo que contenha o texto específico.
            const dialogSelector = '.mat-dialog-container';
            await page.waitForSelector(dialogSelector, { visible: true, timeout: 10000 });
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
            // Extrai o dado de estoque diretamente do HTML salvo, conforme solicitado.
            // Esta abordagem analisa a string de conteúdo da página que já foi capturada.
            this.logger.info('[DismatalScraper] Analisando o HTML capturado para extrair o estoque do pop-up.');
            
            // Regex para encontrar o padrão "Disponíveis apenas XX peças" no HTML.
            // A regex busca pelo texto e captura o número logo em seguida.
            const stockMatch = pageContentWithPopup.match(/Disponíveis apenas (\d+)/);
            const stock = stockMatch ? parseInt(stockMatch[1], 10) : null;

            if (stock === null) {
                // Se o HTML foi capturado mas o padrão de texto não foi encontrado, lança um erro.
                this.logger.error('[DismatalScraper] O HTML do pop-up foi capturado, mas o texto "Disponíveis apenas" não foi encontrado na análise.');
                throw new Error('O texto de estoque não foi encontrado no HTML do pop-up.');
            }

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
        const produtoExtraido = await page.evaluate(pageParser, { ...this.selectors, productDetailContainer: containerSelectors });

        if (!produtoExtraido || !produtoExtraido.nome) {
            this.logger.warn('[DismatalScraper] O parser não conseguiu extrair os dados essenciais (nome) do produto.');
            return [];
        }

        // Tenta obter o estoque dinamicamente após a extração principal.
        const dynamicStock = await this._extractDynamicStock(page);

        // Se o estoque dinâmico foi encontrado, ele sobrepõe o que foi extraído inicialmente.
        if (dynamicStock !== null) {
            produtoExtraido.estoque = dynamicStock;
        }

        // Retorna os dados brutos e estruturados. O frontend será responsável pela formatação.
        const produtoFinal = {
            ...produtoExtraido,
            nome: produtoExtraido.nome,
            sku: produtoExtraido.sku,
            barcode: produtoExtraido.barcode,
            estoque: produtoExtraido.estoque ?? 0, // Garante que o estoque seja um número
            preco: produtoExtraido.preco,
        };

        this.logger.info('[DismatalScraper] Extração do produto bem-sucedida.', { skuBuscado: searchTerm, skuNaPagina: produtoExtraido.sku });
        return [produtoFinal];
    }
}