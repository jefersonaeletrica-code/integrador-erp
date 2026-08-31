import express from 'express';
import * as meliService from '../services/mercadolivre.service.js';
import * as erpService from '../services/erpService.js';
import { DismatalScraper } from '../scrapers/dismatal.scraper.js';
import { addToQueue } from '../core/scraperQueue.js';
import { getLogger } from '../core/logger.js';

const router = express.Router();

export default (db) => {
    const logger = getLogger();

    // Helper para parsear JSON com segurança
    const safeJsonParse = (data) => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return null;
            }
        }
        return data;
    };

    // Helper para encontrar conexão de marketplace por ID
    const findMarketplaceConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], credentials: safeJsonParse(rows[0].credentials) };
    };

    // Helper para encontrar conexão ERP por ID
    const findErpConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM erp_connections WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], credentials: safeJsonParse(rows[0].credentials) };
    };

    // Helper para encontrar conexão de fornecedor por ID
    const findSupplierConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM supplier_connections WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { 
            ...rows[0], 
            credentials: safeJsonParse(rows[0].credentials), 
            cookies: safeJsonParse(rows[0].session_data) 
        };
    };

    // =========================================================================
    // 1. ROTAS DE GERENCIAMENTO DE CONEXÕES MARKETPLACE (MERCADO LIVRE)
    // =========================================================================

    router.get('/marketplace-connections', async (req, res) => {
        try {
            const pool = db.getPool();
            const [connections] = await pool.execute('SELECT * FROM marketplace_connections');

            const connectionsWithStatus = await Promise.all(connections.map(async (conn) => {
                const parsedConn = { ...conn, credentials: safeJsonParse(conn.credentials) };
                let status;
                try {
                    status = await meliService.getMarketplaceConnectionStatus(parsedConn, db);
                } catch (statusError) {
                    logger.error(`Falha ao obter status para conexão de Marketplace ID ${conn.id}`, statusError);
                    status = 'error';
                }

                const { client_secret, access_token, refresh_token, ...safeCredentials } = parsedConn.credentials || {};
                const displayCredentials = { ...safeCredentials };
                if (access_token) displayCredentials.access_token = '******';
                if (refresh_token) displayCredentials.refresh_token = '******';

                return { ...parsedConn, credentials: displayCredentials, status };
            }));

            res.json({ sucesso: true, connections: connectionsWithStatus });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Falha ao buscar conexões de marketplace: ${e.message}` });
        }
    });

    router.get('/marketplace-connections/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const connection = await findMarketplaceConnectionById(id);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão de Marketplace não encontrada.' });
            }
            res.json({ sucesso: true, connection });
        } catch (e) {
            logger.error(`Falha ao buscar conexão de Marketplace por ID: ${id}`, e);
            res.status(500).json({ sucesso: false, erro: `Erro ao buscar conexão: ${e.message}` });
        }
    });

    router.post('/marketplace-connections', async (req, res) => {
        const { name, type = 'mercadolivre', credentials } = req.body;
        if (!name || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome e credenciais são obrigatórios.' });
        }

        try {
            const pool = db.getPool();
            const [result] = await pool.execute(
                'INSERT INTO marketplace_connections (name, type, credentials) VALUES (?, ?, ?)',
                [name, type, JSON.stringify(credentials)]
            );
            const newConnection = { id: result.insertId, name, type, credentials };
            res.status(201).json({ sucesso: true, connection: newConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.put('/marketplace-connections/:id', async (req, res) => {
        const { id } = req.params;
        const { name, type = 'mercadolivre', credentials } = req.body;

        if (!name || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome e credenciais são obrigatórios.' });
        }

        try {
            const connection = await findMarketplaceConnectionById(id);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão de Marketplace não encontrada.' });
            }

            // Mantém tokens já autenticados ao mesclar
            const newCredentials = { ...(connection.credentials || {}), ...credentials };
            const updatedConnection = { ...connection, name, type, credentials: newCredentials };

            await db.updateMarketplaceConnection(updatedConnection);
            res.json({ sucesso: true, connection: updatedConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.delete('/marketplace-connections/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const pool = db.getPool();
            const [result] = await pool.execute('DELETE FROM marketplace_connections WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada para remover.' });
            }
            res.json({ sucesso: true, mensagem: 'Conexão de Marketplace removida com sucesso.' });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    // =========================================================================
    // 2. ROTAS DE AUTENTICAÇÃO OAUTH MERCADO LIVRE
    // =========================================================================

    router.get('/marketplace/auth/:id/mercadolivre', async (req, res) => {
        const { id } = req.params;
        const connection = await findMarketplaceConnectionById(id);

        if (!connection || connection.type !== 'mercadolivre') {
            return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
        }

        try {
            const authUrl = meliService.getAuthUrl(connection);
            res.json({ sucesso: true, url: authUrl });
        } catch (err) {
            res.status(400).json({ sucesso: false, erro: err.message });
        }
    });

    router.get('/marketplace/callback', async (req, res) => {
        const { code, error, state } = req.query;
        if (error) return res.status(400).send(`Erro retornado pelo Mercado Livre: ${error}`);
        if (!code) return res.status(400).send('Código de autorização não informado pelo Mercado Livre.');

        let connectionId = null;
        if (state) {
            const stateParams = new URLSearchParams(state);
            connectionId = stateParams.get('connId');
        }

        if (!connectionId) {
            // Tenta pegar a primeira conexão do Mercado Livre se não vier no state
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT id FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
            if (rows[0]) connectionId = rows[0].id;
        }

        const connection = await findMarketplaceConnectionById(connectionId);
        if (!connection) {
            return res.status(400).send('Conexão do Mercado Livre não encontrada a partir do state.');
        }

        try {
            const updatedCredentials = await meliService.exchangeCodeForToken(connection, code);
            connection.credentials = updatedCredentials;
            await db.updateMarketplaceConnection(connection);

            res.redirect('/?ml_autorizado=true');
        } catch (e) {
            logger.error('Falha no callback do Mercado Livre:', e);
            res.status(500).send(`Erro na autorização com Mercado Livre: ${e.message}`);
        }
    });

    // =========================================================================
    // 3. CATEGORIAS E ATRIBUTOS
    // =========================================================================

    router.post('/marketplace/mercadolivre/predict-category', async (req, res) => {
        const { title, siteId = 'MLB' } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ sucesso: false, erro: 'Título do produto é obrigatório.' });
        }

        try {
            const categories = await meliService.predictCategory(title, siteId);
            res.json({ sucesso: true, categories });
        } catch (err) {
            res.status(500).json({ sucesso: false, erro: err.message });
        }
    });

    router.get('/marketplace/mercadolivre/categories/:categoryId/attributes', async (req, res) => {
        const { categoryId } = req.params;
        try {
            const data = await meliService.getCategoryAttributes(categoryId);
            res.json({ sucesso: true, ...data });
        } catch (err) {
            res.status(500).json({ sucesso: false, erro: err.message });
        }
    });

    // =========================================================================
    // 4. ANÚNCIOS DO MERCADO LIVRE (CRUD, IMPORTAÇÃO, SINCRONIZAÇÃO)
    // =========================================================================

    router.get('/marketplace/mercadolivre/items', async (req, res) => {
        try {
            const pool = db.getPool();
            const { connectionId, status, search, page = 1, limit = 50 } = req.query;

            let query = `
                SELECT a.*, c.name as connection_name, c.credentials 
                FROM mercado_livre_anuncios a
                JOIN marketplace_connections c ON a.connection_id = c.id
                WHERE 1=1
            `;
            const queryParams = [];

            if (connectionId) {
                query += ' AND a.connection_id = ?';
                queryParams.push(connectionId);
            }
            if (status) {
                query += ' AND a.status = ?';
                queryParams.push(status);
            }
            if (search) {
                query += ' AND (a.title LIKE ? OR a.sku LIKE ? OR a.item_id LIKE ?)';
                const s = `%${search.trim()}%`;
                queryParams.push(s, s, s);
            }

            query += ' ORDER BY a.updated_at DESC';

            const [rows] = await pool.execute(query, queryParams);

            const parsedItems = rows.map(r => ({
                ...r,
                price: parseFloat(r.price),
                markup_percent: parseFloat(r.markup_percent || 0),
                sync_auto_stock: !!r.sync_auto_stock,
                sync_auto_price: !!r.sync_auto_price,
                source_data: safeJsonParse(r.source_data),
                credentials: undefined // omite credenciais
            }));

            // Paginação em memória para flexibilidade
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 50;
            const totalItems = parsedItems.length;
            const totalPages = Math.ceil(totalItems / limitNum) || 1;
            const paginated = parsedItems.slice((pageNum - 1) * limitNum, pageNum * limitNum);

            res.json({
                sucesso: true,
                items: paginated,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems
                }
            });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Falha ao buscar anúncios: ${e.message}` });
        }
    });

    router.post('/marketplace/mercadolivre/items/create', async (req, res) => {
        const {
            connectionId,
            title,
            category_id,
            category_name = '',
            price,
            available_quantity = 1,
            listing_type_id = 'gold_special',
            condition = 'new',
            pictures = [],
            attributes = [],
            description = '',
            sku = '',
            source_type = 'manual',
            source_id = null,
            source_data = null,
            markup_percent = 0,
            sync_auto_stock = false,
            sync_auto_price = false
        } = req.body;

        if (!connectionId) {
            return res.status(400).json({ sucesso: false, erro: 'ID da Conexão do Mercado Livre é obrigatório.' });
        }

        const connection = await findMarketplaceConnectionById(connectionId);
        if (!connection) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
        }

        try {
            // Publica o anúncio na API do Mercado Livre
            const createdMeliItem = await meliService.createItem(connection, {
                title,
                category_id,
                price,
                available_quantity,
                listing_type_id,
                condition,
                pictures,
                attributes,
                description,
                sku
            }, db);

            // Thumbnail
            const thumbnail = (createdMeliItem.pictures && createdMeliItem.pictures[0])
                ? createdMeliItem.pictures[0].url || createdMeliItem.pictures[0].secure_url
                : (pictures[0] || null);

            // Salva no banco de dados local
            const dbAnuncio = {
                connection_id: connection.id,
                item_id: createdMeliItem.id,
                sku: sku || createdMeliItem.seller_custom_field || null,
                title: createdMeliItem.title || title,
                price: parseFloat(createdMeliItem.price || price),
                available_quantity: parseInt(createdMeliItem.available_quantity ?? available_quantity, 10),
                status: createdMeliItem.status || 'active',
                listing_type_id: createdMeliItem.listing_type_id || listing_type_id,
                permalink: createdMeliItem.permalink || null,
                thumbnail,
                category_id: createdMeliItem.category_id || category_id,
                category_name: category_name || null,
                source_type,
                source_id: source_id ? String(source_id) : null,
                source_data,
                sync_auto_stock: !!sync_auto_stock,
                sync_auto_price: !!sync_auto_price,
                markup_percent: parseFloat(markup_percent) || 0.00
            };

            await db.saveOrUpdateMercadoLivreAnuncio(dbAnuncio);

            res.status(201).json({
                sucesso: true,
                mensagem: 'Anúncio publicado com sucesso no Mercado Livre!',
                item: createdMeliItem,
                localItem: dbAnuncio
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao criar anúncio: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.put('/marketplace/mercadolivre/items/:itemId/update', async (req, res) => {
        const { itemId } = req.params;
        const { price, available_quantity, title, status, connectionId } = req.body;

        try {
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            const localItem = rows[0];

            const resolvedConnId = connectionId || localItem?.connection_id;
            if (!resolvedConnId) {
                return res.status(400).json({ sucesso: false, erro: 'Conexão do anúncio não identificada.' });
            }

            const connection = await findMarketplaceConnectionById(resolvedConnId);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
            }

            const updatedMeli = await meliService.updateItem(connection, itemId, {
                price,
                available_quantity,
                title,
                status
            }, db);

            // Atualiza no DB local
            if (localItem) {
                const updatedDb = {
                    ...localItem,
                    price: price !== undefined ? parseFloat(price) : localItem.price,
                    available_quantity: available_quantity !== undefined ? parseInt(available_quantity, 10) : localItem.available_quantity,
                    title: title || localItem.title,
                    status: status || localItem.status,
                    source_data: safeJsonParse(localItem.source_data)
                };
                await db.saveOrUpdateMercadoLivreAnuncio(updatedDb);
            }

            res.json({ sucesso: true, mensagem: 'Anúncio atualizado com sucesso!', item: updatedMeli });
        } catch (error) {
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.put('/marketplace/mercadolivre/items/:itemId/status', async (req, res) => {
        const { itemId } = req.params;
        const { status, connectionId } = req.body;

        if (!status || !['active', 'paused', 'closed'].includes(status)) {
            return res.status(400).json({ sucesso: false, erro: 'Status inválido. Use "active", "paused" ou "closed".' });
        }

        try {
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            const localItem = rows[0];

            const resolvedConnId = connectionId || localItem?.connection_id;
            const connection = await findMarketplaceConnectionById(resolvedConnId);

            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
            }

            const updated = await meliService.updateItemStatus(connection, itemId, status, db);

            if (localItem) {
                const updatedDb = {
                    ...localItem,
                    status,
                    source_data: safeJsonParse(localItem.source_data)
                };
                await db.saveOrUpdateMercadoLivreAnuncio(updatedDb);
            }

            res.json({ sucesso: true, mensagem: `Status do anúncio alterado para ${status}!`, item: updated });
        } catch (error) {
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.post('/marketplace/mercadolivre/items/:itemId/sync-from-source', async (req, res) => {
        const { itemId } = req.params;

        try {
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            if (!rows[0]) {
                return res.status(404).json({ sucesso: false, erro: 'Anúncio não encontrado no banco de dados local.' });
            }

            const localItem = rows[0];
            const connection = await findMarketplaceConnectionById(localItem.connection_id);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre associada não encontrada.' });
            }

            let currentCostPrice = null;
            let currentStock = null;
            const sku = localItem.sku;

            // Busca preço/estoque atualizado na origem
            if (localItem.source_type === 'erp' && localItem.source_id) {
                const erpConn = await findErpConnectionById(localItem.source_id);
                if (erpConn) {
                    await erpService.ensureValidToken(erpConn, db);
                    let result;
                    if (sku) {
                        result = await erpService.fetchProductsByCode(erpConn, sku, 1);
                    }
                    const product = (result?.data && result.data[0]) ? result.data[0] : null;
                    if (product) {
                        currentCostPrice = parseFloat(product.preco || 0);
                        currentStock = (erpConn.type === 'bling' && product.estoque)
                            ? (product.estoque.saldoVirtualTotal ?? 0)
                            : (product.saldoFisicoTotal ?? product.estoque ?? 0);
                    }
                }
            } else if (localItem.source_type === 'supplier' && localItem.source_id) {
                const supplierConn = await findSupplierConnectionById(localItem.source_id);
                if (supplierConn && supplierConn.type === 'dismatal_webscraper' && sku) {
                    const scraper = new DismatalScraper({ headless: true });
                    const scraperResult = await addToQueue(() => scraper.fetchProducts(supplierConn, sku));
                    if (scraperResult.sucesso && scraperResult.produtos?.length > 0) {
                        const supProd = scraperResult.produtos[0];
                        currentCostPrice = typeof supProd.preco === 'number' ? supProd.preco : parseFloat(String(supProd.preco).replace(/[^\d.,]/g, '').replace(',', '.'));
                        currentStock = supProd.estoque !== undefined ? parseInt(supProd.estoque, 10) : null;
                    }
                }
            }

            if (currentCostPrice === null && currentStock === null) {
                return res.status(400).json({ 
                    sucesso: false, 
                    erro: 'Não foi possível consultar os dados atualizados na fonte de origem (ERP/Fornecedor).' 
                });
            }

            // Calcula novo preço com markup se configurado
            const markup = parseFloat(localItem.markup_percent || 0);
            const updatePayload = {};

            if (currentCostPrice !== null && !isNaN(currentCostPrice) && currentCostPrice > 0) {
                const finalSellingPrice = currentCostPrice * (1 + (markup / 100));
                updatePayload.price = Math.round(finalSellingPrice * 100) / 100;
            }

            if (currentStock !== null && !isNaN(currentStock)) {
                updatePayload.available_quantity = Math.max(0, currentStock);
            }

            // Atualiza no Mercado Livre
            const updatedMeli = await meliService.updateItem(connection, itemId, updatePayload, db);

            // Atualiza no DB local
            const updatedDb = {
                ...localItem,
                price: updatePayload.price !== undefined ? updatePayload.price : localItem.price,
                available_quantity: updatePayload.available_quantity !== undefined ? updatePayload.available_quantity : localItem.available_quantity,
                source_data: safeJsonParse(localItem.source_data)
            };
            await db.saveOrUpdateMercadoLivreAnuncio(updatedDb);

            res.json({
                sucesso: true,
                mensagem: 'Anúncio sincronizado com sucesso com a fonte de dados!',
                synced: {
                    price: updatePayload.price,
                    stock: updatePayload.available_quantity,
                    costPrice: currentCostPrice
                },
                item: updatedMeli
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro na sincronização do item ${itemId}: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.post('/marketplace/mercadolivre/items/import-from-meli', async (req, res) => {
        const { connectionId } = req.body;
        if (!connectionId) {
            return res.status(400).json({ sucesso: false, erro: 'ID da Conexão do Mercado Livre é obrigatório.' });
        }

        const connection = await findMarketplaceConnectionById(connectionId);
        if (!connection) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
        }

        try {
            const { items } = await meliService.getUserItems(connection, null, 0, 50, db);
            let importedCount = 0;

            for (const item of items) {
                const skuAttr = item.attributes?.find(a => a.id === 'SELLER_SKU');
                const sku = skuAttr ? skuAttr.value_name : (item.seller_custom_field || null);
                const thumbnail = (item.pictures && item.pictures[0])
                    ? (item.pictures[0].secure_url || item.pictures[0].url)
                    : (item.thumbnail || null);

                const anuncio = {
                    connection_id: connection.id,
                    item_id: item.id,
                    sku,
                    title: item.title,
                    price: parseFloat(item.price),
                    available_quantity: parseInt(item.available_quantity || 0, 10),
                    status: item.status,
                    listing_type_id: item.listing_type_id || 'gold_special',
                    permalink: item.permalink,
                    thumbnail,
                    category_id: item.category_id,
                    category_name: null,
                    source_type: 'manual',
                    source_id: null,
                    source_data: null,
                    sync_auto_stock: false,
                    sync_auto_price: false,
                    markup_percent: 0.00
                };

                await db.saveOrUpdateMercadoLivreAnuncio(anuncio);
                importedCount++;
            }

            res.json({
                sucesso: true,
                mensagem: `${importedCount} anúncios importados da conta do Mercado Livre com sucesso!`,
                count: importedCount
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao importar anúncios do Mercado Livre: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    return router;
};

