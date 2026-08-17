export let produtosImportados = []; // Estado local para produtos importados

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