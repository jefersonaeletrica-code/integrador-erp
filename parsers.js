/**
 * Encontra o primeiro seletor visível de uma lista.
 * @param {import('puppeteer').Page} page
 * @param {string[]} selectors
 * @returns {Promise<string|null>}
 */
export async function findSelector(page, selectors, timeout = 15000) {
    for (const selector of selectors) { // Itera sobre a lista de seletores fornecida
        try {
            await page.waitForSelector(selector, { visible: true, timeout });
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
    const productRoot = document.querySelector(selectors.productDetailContainer);
    if (!productRoot) return null;

    // --- Funções Auxiliares (inspiradas no seu exemplo) ---

    const extractText = (root, selArray) => {
        if (!root) return null;
        for (const sel of selArray) {
            const element = root.querySelector(sel);
            if (element && element.textContent) {
                // Remove prefixos comuns como "Código: " ou "SKU: " para limpar o dado.
                const cleanedText = element.textContent.replace(/^(c[óo]digo|sku|ref[eê]rencia):?\s*/i, '').trim();
                if (cleanedText) return cleanedText;
            }
        }
        return null;
    };

    const extractContent = (root, selArray, { removeChild = '' } = {}) => {
        if (!root) return null;
        for (const sel of selArray) {
            const element = root.querySelector(sel);
            if (element) {
                const clone = element.cloneNode(true);
                if (removeChild) {
                    const childToRemove = clone.querySelector(removeChild);
                    if (childToRemove) childToRemove.remove();
                }
                // Adiciona um espaçamento entre os parágrafos para melhorar a legibilidade.
                // Esta alteração é apenas visual e será refletida no frontend.
                clone.querySelectorAll('p').forEach(p => {
                    p.style.marginBottom = '1em'; // Adiciona uma margem inferior a cada parágrafo.
                });

                return clone.innerHTML.trim();
            }
        }
        return null;
    };
    const extractImageUrls = (root, selArray) => {
        if (!root) return [];
        const urls = new Set();
        for (const sel of selArray) {
            const elements = root.querySelectorAll(sel);
            elements.forEach(img => {
                if (img.src) {
                    const absoluteUrl = new URL(img.src, document.baseURI).href;
                    urls.add(absoluteUrl);
                }
            });
        }
        return Array.from(urls);
    };

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

    const getLowestValidPrice = (prices) => {
        const validPrices = prices.filter(p => p !== undefined && p !== null && p > 0);
        return validPrices.length > 0 ? Math.min(...validPrices) : null;
    };

    const extractMultiplePrice = (root) => {
        for (const tableSelector of selectors.multipleTable) {
            const table = root.querySelector(tableSelector);
            if (!table) continue;
            for (const priceSelector of selectors.multipleLowerPrice) {
                const priceEl = table.querySelector(priceSelector);
                if (priceEl?.textContent) {
                    const price = parsePrice(priceEl.textContent);
                    if (price !== null && price > 0) return price;
                }
            }
        }
        return null;
    };

    const extractAndGetLowestPrice = (root, selArray) => {
        if (!root) return null;
        for (const sel of selArray) {
            const element = root.querySelector(sel);
            if (element && element.textContent) {
                // Encontra todos os números que parecem ser preços no texto
                const priceMatches = element.textContent.match(/R\$\s*[\d.,]+/g);
                if (priceMatches) {
                    const prices = priceMatches.map(parsePrice).filter(p => p !== null && p > 0);
                    if (prices.length > 0) {
                        return Math.min(...prices);
                    }
                }
            }
        }
        return null;
    };

    const extractIPI = (root) => {
        // Estratégia 1: Campo específico
        for (const selector of selectors.ipiField) {
            const el = root.querySelector(selector);
            if (el?.textContent) {
                const ipi = parsePrice(el.textContent);
                if (ipi !== null && ipi >= 0) return ipi;
            }
        }
        // Estratégia 2: Seção de informações tributárias
        for (const selector of selectors.tributaryInfo) {
            const el = root.querySelector(selector);
            if (el?.textContent) {
                const matches = el.textContent.match(/ipi[:\s]+([0-9,]+\.?[0-9]*)\s*%?/i);
                if (matches?.[1]) {
                    const ipi = parsePrice(matches[1]);
                    if (ipi !== null && ipi >= 0) return ipi;
                }
            }
        }
        // Estratégia 3: Fallback no corpo do documento
        const bodyText = document.body?.textContent || '';
        const matches = bodyText.match(/ipi[:\s]+([0-9,]+\.?[0-9]*)\s*%?/i);
        if (matches?.[1]) {
            const ipi = parsePrice(matches[1]);
            if (ipi !== null && ipi >= 0) return ipi;
        }
        return null;
    };

    // --- Extração Principal ---
    const nome = extractText(productRoot, selectors.productName);
    const sku = extractText(productRoot, selectors.productSKU);
    const descricao = extractContent(productRoot, selectors.productDescription, { removeChild: 'h2' });
    const estoque = parseStock(extractText(productRoot, selectors.stock));
    const imagens = extractImageUrls(productRoot, selectors.productImages);

    // --- Lógica de Preços ---
    const precoRegular = extractAndGetLowestPrice(productRoot, selectors.productPrice);
    const precoPromocional = parsePrice(extractText(productRoot, selectors.promoPrice));
    const precoMultiplo = extractMultiplePrice(productRoot);

    const precoFinal = getLowestValidPrice([precoRegular, precoPromocional, precoMultiplo]);

    // --- Lógica de IPI ---
    const ipi = extractIPI(productRoot);

    // Validação final: um produto precisa ter nome e preço para ser considerado válido.
    if (!nome || !precoFinal) return null;

    return {
        nome,
        sku,
        descricao,
        preco: precoFinal,
        estoque,
        imagens,
        ipi,
        precoMultiplo,
    };
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
    // Torna a validação mais flexível, aceitando números, letras e hífens, com no mínimo 5 caracteres.
    return /^[a-zA-Z0-9-]{5,}$/.test(term);
};