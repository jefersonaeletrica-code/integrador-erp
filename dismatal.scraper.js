const puppeteer = require('puppeteer');

/**
 * Função auxiliar para interagir com um elemento, lançando um erro claro se ele não for encontrado.
 * @param {import('puppeteer').Page} page - A instância da página do Puppeteer.
 * @param {string} selector - O seletor CSS do elemento.
 * @param {string} action - A ação a ser executada ('type', 'click').
 * @param {string} [value] - O valor para a ação 'type'.
 * @param {number} [timeout=5000] - Tempo de espera pelo seletor em milissegundos.
 */
const interactWithSelector = async (page, selector, action, value = '', timeout = 5000) => {
    const element = await page.waitForSelector(selector, { timeout }).catch(() => null);
    if (!element) {
        throw new Error(`O seletor '${selector}' não foi encontrado na página. A estrutura do site pode ter mudado.`);
    }
    if (action === 'type') {
        await element.type(value);
    } else if (action === 'click') {
        await element.click();
    }
    return element;
};

const testConnection = async (connection) => {
    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        await interactWithSelector(page, 'input[name="usuario"]', 'type', username);
        await interactWithSelector(page, 'input[name="senha"]', 'type', password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            interactWithSelector(page, 'button[type="submit"]', 'click')
        ]);

        const successfulLoginIndicator = await page.$('a[href*="sair"]');
        if (successfulLoginIndicator) {
            return { sucesso: true, mensagem: 'Conexão com a Dismatal bem-sucedida!' };
        }

        const errorElement = await page.$('.alert-danger');
        const errorMessage = errorElement ? await page.evaluate(el => el.textContent, errorElement) : 'Credenciais inválidas ou falha no login.';
        throw new Error(errorMessage.trim());

    } finally {
        if (browser) await browser.close();
    }
};

const fetchProducts = async (connection, searchTerm) => {
    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        console.log('[Dismatal Scraper] Iniciando busca de produtos...');
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        console.log('[Dismatal Scraper] Acessando a página de login...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        await interactWithSelector(page, 'input[name="usuario"]', 'type', username);
        await interactWithSelector(page, 'input[name="senha"]', 'type', password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            interactWithSelector(page, 'button[type="submit"]', 'click')
        ]);

        const successfulLoginIndicator = await page.$('a[href*="sair"]');
        if (!successfulLoginIndicator) {
            throw new Error('Falha no login. Verifique as credenciais.');
        }
        console.log('[Dismatal Scraper] Login bem-sucedido.');

        if (searchTerm && searchTerm.trim() !== '') {
            console.log(`[Dismatal Scraper] Buscando por: "${searchTerm}"`);
            const searchInput = await interactWithSelector(page, 'input[name="descricao"]', 'type', searchTerm);
            await searchInput.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
        console.log('[Dismatal Scraper] Extraindo dados dos produtos...');

        const produtos = await page.evaluate(() => {
            const items = [];
            const productElements = document.querySelectorAll('.product-item');
            if (productElements.length === 0) {
                // Não lança erro, apenas retorna array vazio se a busca não tiver resultados.
            }
            productElements.forEach(el => {
                const nome = el.querySelector('.product-name')?.innerText;
                const codigo = el.querySelector('.product-sku')?.innerText;
                const preco = el.querySelector('.product-price')?.innerText;

                if (nome && codigo) {
                    items.push({
                        nome: nome.trim(),
                        codigo: codigo.trim(),
                        preco: preco ? preco.trim() : 'N/A'
                    });
                }
            });
            return items;
        });

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