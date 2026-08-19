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

    // A verificação deve ser consistente com os seletores de extração.
    // Usamos os seletores de nome e preço para validar a estrutura.
    const hasProductStructure = await page.evaluate((selectors) =>
        !!(document.querySelector(selectors.productName.join(',')) && document.querySelector(selectors.productPrice.join(','))),
        { productName: ['div.product-description span.title-product', 'h1.product-name'], productPrice: ['div.price-group span', '.price'] }
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
    // Helper que tenta múltiplos seletores e retorna o texto do primeiro que funcionar.
    const extractText = (doc, selArray) => {
        for (const sel of selArray) {
            const element = doc.querySelector(sel);
            if (element) return element.textContent.trim();
        }
        return null;
    };

    const parsePrice = (text) => {
        if (!text) return null;
        const cleaned = text.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleaned);
        return isNaN(price) ? null : price;
    };
    
    const nome = extractText(document, selectors.productName);
    const sku = extractText(document, selectors.productSKU);
    const precoText = extractText(document, selectors.productPrice) || extractText(document, selectors.promoPrice);
    const estoqueText = extractText(document, selectors.stock);
    
    const preco = parsePrice(precoText);
    const estoque = estoqueText ? parseInt(estoqueText.replace(/\D/g, ''), 10) : 0;

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
    // Helper que tenta múltiplos seletores dentro de um elemento pai.
    const extractTextFromElement = (el, selArray) => {
        for (const sel of selArray) {
            const element = el.querySelector(sel);
            if (element) return element.innerText.trim();
        }
        return null;
    };

    const parsePrice = (text) => {
        if (!text) return null;
        const cleaned = text.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleaned);
        return isNaN(price) ? null : price;
    };
    
    // Itera sobre cada seletor de item de lista para encontrar o container principal dos produtos.
    for (const listItemSelector of selectors.productListItem) {
        document.querySelectorAll(listItemSelector).forEach(el => {
            const nome = extractTextFromElement(el, selectors.listItemName);
            const codigo = extractTextFromElement(el, selectors.listItemSKU);
            const precoText = extractTextFromElement(el, selectors.listItemPrice);

            if (nome && codigo) {
                items.push({ nome, codigo, preco: parsePrice(precoText), estoque: null });
            }
        });
        if (items.length > 0) break; // Se encontrou produtos, não precisa tentar outros seletores de item de lista.
    }
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