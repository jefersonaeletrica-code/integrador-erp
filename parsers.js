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
    // Função auxiliar para encontrar o shadow root que contém o nosso `productDetailContainer`
    const findProductContentRoot = () => {
        const appRoot = document.querySelector('app-root'); // Assume que app-root é o host principal
        if (!appRoot || !appRoot.shadowRoot) {
            return null;
        }
        const productContainer = appRoot.shadowRoot.querySelector(selectors.productDetailContainer);
        if (productContainer) {
            // Se o container do produto tem seu próprio shadowRoot, usamos ele.
            // Caso contrário, o conteúdo está diretamente dentro do container.
            if (productContainer.shadowRoot) {
                return productContainer.shadowRoot;
            }
            return productContainer;
        }
        return null;
    };

    // Helper que tenta múltiplos seletores e retorna o texto do primeiro que funcionar.
    const extractText = (root, selArray) => {
        if (!root) return null;

        for (const sel of selArray) {
            const element = root.querySelector(sel);
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
    
    const productRoot = findProductContentRoot();

    const nome = extractText(productRoot, selectors.productName);
    const sku = extractText(productRoot, selectors.productSKU);
    const precoText = extractText(productRoot, selectors.productPrice) || extractText(productRoot, selectors.promoPrice);
    const estoqueText = extractText(productRoot, selectors.stock);
    
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