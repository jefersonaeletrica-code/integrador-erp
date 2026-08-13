const path = require('path');
// **Solução para o erro EACCES em servidores**
// Define um diretório de cache local e gravável para o Puppeteer ANTES de importá-lo.
// Isso força o Puppeteer a baixar e executar o Chromium a partir daqui, evitando o /tmp.
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '.cache', 'puppeteer');
const puppeteer = require('puppeteer');

/**
 * Seletores CSS e configuração específica para Dismatal B2B Portal
 * Inspirado no arquivo de configuração profissional fornecido.
 */
const SELECTORS = {
    // Seletores de autenticação
    loginButton: ['a.login-btn', 'p.login-btn__click', '#drawer-header-btn', '[data-testid="login-btn"]', 'button.btn-login'],
    welcomeLoginButton: ['button.btn-login'], // Novo botão no pop-up de boas-vindas
    loginModal: ['[role="dialog"]', '.modal', '.login-modal'],
    usernameInput: ['input[formcontrolname="usuario"]', 'input[name="usuario"]', 'input[placeholder="CNPJ"]', 'input[data-placeholder="CNPJ"]', 'input[placeholder*="Usuário"]'],
    passwordInput: ['input[formcontrolname="senha"]', 'input[name="senha"]', 'input[type="password"]'],
    submitButton: ['button.btn-login', 'button[type="submit"]'],
    logoutLink: ['a[href*="sair"]'],
    cookieAcceptButton: ['button[data-test="COOKIE-POPUP-CLOSE-BTN"]', '.cookie-popup__button'],
    loginError: ['.alert-danger'],

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

/**
 * Função auxiliar para interagir com um elemento, lançando um erro claro se ele não for encontrado.
 * @param {import('puppeteer').Page} page - A instância da página do Puppeteer.
 * @param {string[]} selectors - Um array de seletores CSS para tentar em ordem.
 * @param {string} action - A ação a ser executada ('type', 'click').
 * @param {string} [value] - O valor para a ação 'type'.
 * @param {number} [timeout=3000] - Tempo de espera para cada seletor em milissegundos.
 */
const interactWithSelector = async (page, selectors, action, value = '', timeout = 5000) => {
    for (const selector of selectors) {
        try {
            const element = await page.waitForSelector(selector, { timeout });
            if (action === 'type') {
                await element.type(value);
            } else if (action === 'click') {
                await element.click();
            }
            return element; // Retorna sucesso ao encontrar e interagir com o primeiro seletor válido
        } catch (error) {
            // Ignora o erro e tenta o próximo seletor da lista
        }
    }
    // Se nenhum seletor funcionou, loga o HTML da página e lança um erro.
    console.error('Falha ao encontrar seletor. Conteúdo da página no momento do erro:');
    try {
        const pageContent = await page.content();
        console.error(pageContent);
    } catch (htmlError) {
        console.error('Não foi possível obter o conteúdo HTML da página.', htmlError);
    }

    throw new Error(`Nenhum dos seletores [${selectors.join(', ')}] foi encontrado na página. A estrutura do site pode ter mudado.`);
};

const getBrowser = async () => {
    const apiKey = process.env.BROWSERLESS_API_KEY;
    if (!apiKey) {
        throw new Error('A variável de ambiente BROWSERLESS_API_KEY não está configurada. Obtenha uma em https://www.browserless.io/');
    }
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${apiKey}`;
    console.log('[Dismatal Scraper] Conectando ao navegador remoto...');
    return puppeteer.connect({ browserWSEndpoint });
};

const testConnection = async (connection) => {
    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        // Usando 'networkidle0' para esperar um carregamento mais completo da página.
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });

        // PASSO ADICIONAL: Fechar o pop-up de cookies se ele aparecer.
        try {
            await interactWithSelector(page, SELECTORS.cookieAcceptButton, 'click', '', 5000);
            console.log('[Dismatal Scraper] Pop-up de cookies fechado com sucesso.');
        } catch (e) {
            console.log('[Dismatal Scraper] Pop-up de cookies não encontrado ou já fechado, continuando...');
        }

        // LÓGICA UNIFICADA: Tenta clicar em qualquer botão de login disponível (pop-up ou cabeçalho).
        console.log('[Dismatal Scraper] Procurando por um botão de login (pop-up ou cabeçalho)...');
        await interactWithSelector(page, SELECTORS.loginButton, 'click', '', 15000);
        console.log('[Dismatal Scraper] Botão de login clicado.');

        // PASSO ADICIONAL: Aguardar o pop-up de login aparecer.
        console.log('[Dismatal Scraper] Aguardando o modal de login aparecer...');
        await page.waitForSelector(SELECTORS.loginModal[0], { visible: true, timeout: 10000 });

        await interactWithSelector(page, SELECTORS.usernameInput, 'type', username);
        await interactWithSelector(page, SELECTORS.passwordInput, 'type', password);

        // Clica no botão de submit e espera a navegação.
        await interactWithSelector(page, SELECTORS.submitButton, 'click');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });

        const successfulLoginIndicator = await page.$(SELECTORS.logoutLink[0]);
        if (successfulLoginIndicator) {
            return { sucesso: true, mensagem: 'Conexão com a Dismatal bem-sucedida!' };
        }

        const errorElement = await page.$(SELECTORS.loginError[0]);
        const errorMessage = errorElement ? await page.evaluate(el => el.textContent, errorElement) : 'Credenciais inválidas ou falha no login.';
        throw new Error(errorMessage.trim());

    } finally {
        if (browser) await browser.close();
    }
};

/**
 * Verifica se a página atual é uma página de produto válida, procurando por indicadores de erro.
 * Inspirado na função isProductPage do novo scraper.
 * @param {import('puppeteer').Page} page
 */
const isProductPageValid = async (page) => {
    const url = page.url();
    if (url.includes('/login') || url.endsWith('/erro')) {
        console.warn('[Dismatal Scraper] Redirecionado para página de login ou erro.');
        return false;
    }

    const pageText = await page.evaluate(() => document.body.innerText || '').catch(() => '');
    const errorPatterns = [
        /produto n[ã|a]o encontrado/i,
        /página não encontrada/i,
        /sessão expirada/i,
        /acesso negado/i,
        /faça login/i
    ];

    for (const pattern of errorPatterns) {
        if (pattern.test(pageText)) {
            console.warn(`[Dismatal Scraper] Indicador de erro encontrado na página: ${pattern}`);
            return false;
        }
    }

    // Verifica se existe uma estrutura mínima de produto
    const hasProductStructure = await page.evaluate(() => {
        const hasTitle = document.querySelector('h1, .product-name, [data-product-name]');
        const hasPrice = document.querySelector('.price, [data-price]');
        const hasSku = document.querySelector('.sku, .product-sku, [data-sku]');
        return !!(hasTitle && (hasPrice || hasSku));
    }).catch(() => false); // Em caso de erro na avaliação, assume que não é válida

    if (!hasProductStructure) {
        console.warn('[Dismatal Scraper] Estrutura de produto não encontrada na página.');
        return false;
    }

    return true;
};

/**
 * Valida os dados de um produto extraído, inspirado na lógica de validação profissional.
 * @param {object} productData - Os dados do produto extraído.
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
const validateProduct = (productData) => {
    const errors = [];
    const warnings = [];

    // Validação de Nome (crítico)
    if (!productData.nome || productData.nome.trim().length < 3) {
        errors.push('Nome do produto é inválido ou muito curto.');
    }

    // Validação de Preço (crítico)
    if (productData.preco === null || productData.preco <= 0) {
        errors.push('Preço do produto é inválido ou não foi encontrado.');
    }

    // Validação de SKU (aviso)
    if (!productData.codigo || !productData.codigo.trim()) {
        warnings.push('SKU (código) do produto não foi encontrado.');
    }

    // Validação de Estoque (aviso)
    if (productData.estoque === null) {
        warnings.push('Estoque do produto não foi encontrado.');
    } else if (productData.estoque < 0) {
        warnings.push(`Estoque negativo detectado: ${productData.estoque}`);
    }

    const valid = errors.length === 0;
    if (!valid) {
        console.warn(`[Validator] ❌ Produto inválido: ${productData.nome || 'Sem nome'}. Erros: ${errors.join(', ')}`);
    }

    return { valid, errors, warnings };
};

/**
 * Funções de parse robustas, inspiradas no novo código.
 */
const pageParser = (selectorsConfig) => {
    // Esta função será executada no contexto do navegador pela page.evaluate()

    const parsePrice = (text) => {
        if (!text || typeof text !== 'string' || text.trim().length === 0) return null;
        let cleaned = text.replace(/R\$\s*/gi, '').replace(/\s/g, '').trim();
        if (cleaned.length === 0) return null;

        const priceMatch = cleaned.match(/[\d.,]+/);
        if (!priceMatch) return null;

        let numberPart = priceMatch[0];
        if (numberPart.includes(',') && numberPart.includes('.')) {
            numberPart = numberPart.replace(/\./g, '').replace(',', '.');
        } else if (numberPart.includes(',')) {
            numberPart = numberPart.replace(',', '.');
        }

        const parsed = parseFloat(numberPart);
        return isNaN(parsed) || parsed < 0 ? null : Math.round(parsed * 100) / 100;
    };

    const parseStock = (text) => {
        if (!text) return null;
        const matches = text.match(/(\d+)/);
        if (matches?.[1]) {
            const stock = parseInt(matches[1], 10);
            return !isNaN(stock) && stock >= 0 ? stock : null;
        }
        return null;
    };

    const extractText = (doc, selectors) => {
        for (const selector of selectors) {
            const el = doc.querySelector(selector);
            if (el?.textContent) {
                const text = el.textContent.trim();
                if (text) return text;
            }
        }
        return null;
    };

    const getLowestValidPrice = (prices) => {
        const validPrices = prices.filter(p => p !== null && p > 0);
        return validPrices.length > 0 ? Math.min(...validPrices) : null;
    };

    const SELECTORS = selectorsConfig;

    // --- Lógica de Extração Principal ---
    const doc = document;
    const nome = extractText(doc, SELECTORS.productName);
    const sku = extractText(doc, SELECTORS.productSKU);

    const precoText = extractText(doc, SELECTORS.productPrice);
    const precoPromoText = extractText(doc, SELECTORS.promoPrice);
    const estoqueText = extractText(doc, SELECTORS.stock);

    const preco = parsePrice(precoText);
    const precoPromocional = parsePrice(precoPromoText);
    const estoque = parseStock(estoqueText);

    const precoFinal = getLowestValidPrice([preco, precoPromocional]);

    return { nome, sku, preco: precoFinal, estoque };
};

const listPageParser = (selectorsConfig) => {
    // Parser para a página de lista de produtos
    const parsePrice = (text) => {
        if (!text || typeof text !== 'string') return null;
        let cleaned = text.replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    };

    const parseStock = (text) => {
        if (!text) return null;
        const matches = text.match(/(\d+)/);
        return matches ? parseInt(matches[1], 10) : null;
    };

    const items = [];
    const SELECTORS = selectorsConfig;

    document.querySelectorAll(SELECTORS.productListItem[0]).forEach(el => {
        const nome = el.querySelector(SELECTORS.listItemName[0])?.innerText.trim();
        const codigo = el.querySelector(SELECTORS.listItemSKU[0])?.innerText.trim();
        const precoText = el.querySelector(SELECTORS.listItemPrice[0])?.innerText;
        const estoqueText = el.querySelector(SELECTORS.listItemStock[0])?.innerText;

        if (nome && codigo) {
            items.push({
                nome,
                codigo,
                preco: parsePrice(precoText),
                estoque: parseStock(estoqueText)
            });
        }
    });
    return items;
};
const isValidSKU = (term) => {
    // Considera um SKU válido se for um número com 5 ou mais dígitos.
    return /^\d{5,}$/.test(term);
};

const fetchProducts = async (connection, searchTerm) => {
    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        console.log('[Dismatal Scraper] Iniciando busca de produtos...');
        browser = await getBrowser();
        const page = await browser.newPage();

        console.log('[Dismatal Scraper] Acessando a página e aguardando carregamento completo...');
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });

        // PASSO ADICIONAL: Fechar o pop-up de cookies se ele aparecer.
        try {
            await interactWithSelector(page, SELECTORS.cookieAcceptButton, 'click', '', 5000);
            console.log('[Dismatal Scraper] Pop-up de cookies fechado com sucesso.');
        } catch (e) {
            console.log('[Dismatal Scraper] Pop-up de cookies não encontrado ou já fechado, continuando...');
        }

        // LÓGICA UNIFICADA: Tenta clicar em qualquer botão de login disponível (pop-up ou cabeçalho).
        console.log('[Dismatal Scraper] Procurando por um botão de login (pop-up ou cabeçalho)...');
        await interactWithSelector(page, SELECTORS.loginButton, 'click', '', 15000);
        console.log('[Dismatal Scraper] Botão de login clicado.');

        // PASSO ADICIONAL: Aguardar o pop-up de login aparecer.
        console.log('[Dismatal Scraper] Aguardando o modal de login aparecer...');
        await page.waitForSelector(SELECTORS.loginModal[0], { visible: true, timeout: 15000 });

        await interactWithSelector(page, SELECTORS.usernameInput, 'type', username);
        await interactWithSelector(page, SELECTORS.passwordInput, 'type', password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            interactWithSelector(page, SELECTORS.submitButton, 'click')
        ]).catch(() => console.log("Navegação iniciada pelo clique.")); // Evita erro se a navegação for muito rápida

        const successfulLoginIndicator = await page.$(SELECTORS.logoutLink[0]);
        if (!successfulLoginIndicator) {
            throw new Error('Falha no login. Verifique as credenciais.');
        }
        console.log('[Dismatal Scraper] Login bem-sucedido.');

        let produtos = [];

        // --- Estratégia 1: Navegação Direta (se o termo de busca parece um SKU) ---
        if (searchTerm && isValidSKU(searchTerm)) {
            console.log(`[Dismatal Scraper] Estratégia 1: Tentando navegação direta para o produto ${searchTerm}...`);
            try {
                // IMPORTANTE: O URL /produtos/{SKU} é um exemplo e pode precisar de ajuste.
                await page.goto(`${url}/produtos/${searchTerm}`, { waitUntil: 'networkidle2', timeout: 15000 });

                if (await isProductPageValid(page)) {
                    console.log('[Dismatal Scraper] Página de produto individual validada. Extraindo com parser...');
                    const produto = await page.evaluate(pageParser, SELECTORS);

                    if (produto) {
                        const validatedProduct = {
                            nome: produto.nome,
                            codigo: produto.sku || searchTerm,
                            preco: produto.preco,
                            estoque: produto.estoque
                        };
                        const validation = validateProduct(validatedProduct);
                        if (validation.valid) {
                            produtos.push(validatedProduct);
                            console.log('[Dismatal Scraper] Estratégia 1 bem-sucedida.');
                        }
                    }
                }
            } catch (e) {
                console.warn(`[Dismatal Scraper] Estratégia 1 falhou: ${e.message}. Tentando Estratégia 2.`);
                // Se a navegação direta falhar, o scraper continuará para a estratégia 2.
            }
        }

        // --- Estratégia 2: Busca no Portal (se a Estratégia 1 falhou ou não foi usada) ---
        if (produtos.length === 0 && searchTerm && searchTerm.trim() !== '') {
            console.log(`[Dismatal Scraper] Estratégia 2: Buscando por "${searchTerm}" no portal...`);
            try {
                // Garante que estamos na página principal para buscar
                if (!page.url().includes('dismatal.com.br')) { // Evita recarregar desnecessariamente
                    await page.goto(url, { waitUntil: 'networkidle2' });
                }

                const searchInput = await interactWithSelector(page, SELECTORS.searchInput, 'type', searchTerm);
                await searchInput.press('Enter');
                await page.waitForNavigation({ waitUntil: 'networkidle2' });

                console.log('[Dismatal Scraper] Extraindo dados da lista de produtos com parser...');
                const produtosDaLista = await page.evaluate(listPageParser, SELECTORS);

                // Valida cada produto da lista
                const produtosValidos = produtosDaLista.filter(p => validateProduct(p).valid);
                produtos = produtosValidos;

                console.log(`[Dismatal Scraper] Estratégia 2 concluída. Encontrados ${produtosDaLista.length}, válidos: ${produtosValidos.length}.`);
            } catch (e) {
                console.error(`[Dismatal Scraper] Estratégia 2 falhou: ${e.message}`);
                throw new Error(`Falha ao buscar por "${searchTerm}" no portal.`);
            }
        }

        console.log(`[Dismatal Scraper] ${produtos.length} produtos encontrados.`);
        return { sucesso: true, produtos };
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = {
    testConnection,
    fetchProducts
};