import db from './db.js';
import { getLogger } from './logger.js';

export let produtosImportados = []; // Estado local para produtos importados

/**
 * Carrega os produtos do banco de dados para a memória.
 * Esta função é chamada na inicialização do servidor.
 */
export const loadInitialData = async () => {
    const logger = getLogger();
    try {
        const { produtos } = await db.readDb();
        produtosImportados = Array.isArray(produtos) ? produtos : [];
        logger.info(`[ProductService] Estado inicial de produtos importados carregado: ${produtosImportados.length} itens.`);
    } catch (error) {
        logger.error('[ProductService] Falha ao carregar dados iniciais de produtos.', error);
        // Em caso de erro, garante que a lista de produtos esteja vazia para evitar inconsistências.
        produtosImportados = [];
    }
};

// A função loadProdutosImportados não é mais necessária, pois loadInitialData faz seu trabalho.
// Mantendo saveProdutosImportados para uso futuro.

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