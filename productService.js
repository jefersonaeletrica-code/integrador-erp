let produtosImportados = []; // Estado local para produtos importados

const saveProdutosImportados = (items, db) => {
    if (!db || !Array.isArray(items)) {
        console.warn('Tentativa de salvar produtos importados com DB não inicializado ou itens inválidos.');
        return;
    }

    const uniqueProducts = Array.from(new Map(items.map(product => [product.codigo, product])).values());
    produtosImportados = uniqueProducts;
    db.updateDb({ produtos: uniqueProducts });
    console.log(`Produtos importados salvos. Total de únicos: ${uniqueProducts.length}`);
};

module.exports = { saveProdutosImportados, produtosImportados };