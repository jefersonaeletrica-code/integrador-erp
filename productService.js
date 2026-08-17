export let produtosImportados = []; // Estado local para produtos importados

/**
 * Carrega os produtos do banco de dados para a memória na inicialização.
 * @param {Array} items - Os produtos vindos do banco de dados.
 */
export const loadProdutosImportados = (items) => {
    produtosImportados = Array.isArray(items) ? items : [];
    console.log(`[ProductService] Estado inicial de produtos importados carregado: ${produtosImportados.length} itens.`);
};

export const saveProdutosImportados = (items, db) => {
    if (!db || !Array.isArray(items)) {
        console.warn('Tentativa de salvar produtos importados com DB não inicializado ou itens inválidos.');
        return;
    }

    const uniqueProducts = Array.from(new Map(items.map(product => [product.codigo, product])).values());
    // Atualiza o array na memória (a referência é a mesma, então o server.js verá a mudança)
    produtosImportados.splice(0, produtosImportados.length, ...uniqueProducts);
    db.updateDb({ produtos: uniqueProducts });
    console.log(`Produtos importados salvos. Total de únicos: ${uniqueProducts.length}`);
};