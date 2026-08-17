/**
 * Encontra o primeiro seletor visível de uma lista.
 * @param {import('puppeteer').Page} page
 * @param {string[]} selectors
 * @returns {Promise<string|null>}
 */
export async function findSelector(page, selectors) {
    for (const selector of selectors) {
        try {
            await page.waitForSelector(selector, { visible: true, timeout: 15000 }); // Increased timeout
            return selector;
        } catch (e) {
            // Continua para o próximo seletor
        }
    }
    return null;
}

/**
 * Verifica se a página de produto é válida, procurando por indicadores de erro.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<boolean>}
 */
export async function isProductPageValid(page) {
    const url = page.url();
    if (url.includes('/login') || url.includes('/erro')) {
        return false;
    }

    const pageText = await page.evaluate(() => document.body.innerText || '').catch(() => '');
    const errorPatterns = [/produto n[ã|a]o encontrado/i, /página não encontrada/i];

    if (errorPatterns.some(pattern => pattern.test(pageText))) {
        return false;
    }

    const hasProductStructure = await page.evaluate(() =>
        !!(document.querySelector('h1, .product-name') && document.querySelector('.price, [data-price]'))
    ).catch(() => false);

    return hasProductStructure;
}

/**
 * Valida os dados de um produto extraído.
 * @param {object} productData - Os dados do produto.
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateProduct(productData) {
    const errors = [];
    if (!productData.nome || productData.nome.trim().length < 3) {
        errors.push('Nome do produto inválido.');
    }
    if (productData.preco === null || productData.preco <= 0) {
        errors.push('Preço do produto inválido.');
    }
    return { valid: errors.length === 0, errors };
}

/**
 * Parser para a página de produto individual. Executado no contexto do navegador.
 * @param {object} selectors - Configuração dos seletores.
 * @returns {object|null}
 */
export const pageParser = (selectors) => {
    const extractText = (doc, sel) => doc.querySelector(sel)?.textContent.trim() || null;
    const parsePrice = (text) => {
        if (!text) return null;
        const cleaned = text.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleaned);
        return isNaN(price) ? null : price;
    };

    const nome = extractText(document, selectors.productName[0]);
    const sku = extractText(document, selectors.productSKU[0]);
    const precoText = extractText(document, selectors.productPrice[0]);
    const estoqueText = extractText(document, selectors.stock[0]);

    const preco = parsePrice(precoText);
    const estoque = estoqueText ? parseInt(estoqueText.match(/\d+/)?.[0] || '0', 10) : 0;

    if (!nome || !preco) return null;

    return { nome, sku, preco, estoque };
};

/**
 * Parser para a página de lista de produtos. Executado no contexto do navegador.
 * @param {object} selectors - Configuração dos seletores.
 * @returns {Array<object>}
 */
export const listPageParser = (selectors) => {
    const items = [];
    const parsePrice = (text) => {
        if (!text) return null;
        const cleaned = text.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleaned);
        return isNaN(price) ? null : price;
    };

    document.querySelectorAll(selectors.productListItem[0]).forEach(el => {
        const nome = el.querySelector(selectors.listItemName[0])?.innerText.trim();
        const codigo = el.querySelector(selectors.listItemSKU[0])?.innerText.trim();
        const precoText = el.querySelector(selectors.listItemPrice[0])?.innerText;

        if (nome && codigo) {
            items.push({
                nome,
                codigo,
                preco: parsePrice(precoText),
                estoque: null, // Estoque geralmente não está na lista
            });
        }
    });
    return items;
};

/**
 * Verifica se um termo de busca parece ser um SKU.
 * @param {string} term - O termo de busca.
 * @returns {boolean}
 */
export const isValidSKU = (term) => {
    return /^\d{5,}$/.test(term);
};