import express from 'express';
import fs from 'fs/promises';
import path from 'path';
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
    // 3.1. UPLOAD DE FOTOS / IMAGENS
    // =========================================================================

    router.post('/marketplace/mercadolivre/upload-picture', async (req, res) => {
        const { imageBase64, filename = 'picture.jpg', mimeType = 'image/jpeg', connectionId } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ sucesso: false, erro: 'Nenhum dado de imagem em Base64 foi fornecido.' });
        }

        try {
            // Processa o Base64
            let cleanBase64 = imageBase64;
            let detectedMime = mimeType;

            if (imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const header = parts[0];
                cleanBase64 = parts[1];
                const match = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
                if (match) detectedMime = match[1];
            }

            const imageBuffer = Buffer.from(cleanBase64, 'base64');

            // Garante o diretório local de uploads
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pictures');
            await fs.mkdir(uploadsDir, { recursive: true });

            const safeExt = detectedMime.includes('png') ? '.png' : (detectedMime.includes('webp') ? '.webp' : '.jpg');
            const uniqueFilename = `ml_pic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
            const localFilePath = path.join(uploadsDir, uniqueFilename);

            await fs.writeFile(localFilePath, imageBuffer);
            const localUrl = `/uploads/pictures/${uniqueFilename}`;

            // Tenta upload na API oficial do Mercado Livre se conexão estiver disponível
            let meliPicture = null;
            let resolvedConnId = connectionId;

            if (!resolvedConnId) {
                const pool = db.getPool();
                const [conns] = await pool.execute('SELECT id FROM marketplace_connections WHERE type = "mercadolivre" ORDER BY id ASC LIMIT 1');
                if (conns[0]) resolvedConnId = conns[0].id;
            }

            if (resolvedConnId) {
                const connection = await findMarketplaceConnectionById(resolvedConnId);
                if (connection) {
                    try {
                        meliPicture = await meliService.uploadPicture(connection, imageBuffer, filename || uniqueFilename, detectedMime, db);
                    } catch (mlUploadErr) {
                        logger.warn(`[MarketplaceRoutes] Upload direto no ML não pôde ser completado: ${mlUploadErr.message}. Usando armazenamento local.`);
                    }
                }
            }

            res.json({
                sucesso: true,
                mensagem: 'Imagem carregada com sucesso!',
                url: meliPicture?.url || localUrl,
                localUrl,
                id: meliPicture?.id || null,
                filename: filename || uniqueFilename
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao processar upload de imagem: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // =========================================================================
    // 3.2. UPLOAD E MODERAÇÃO DE CLIPS DE VÍDEO
    // =========================================================================

    router.post('/marketplace/mercadolivre/upload-clip', async (req, res) => {
        const { videoBase64, filename = 'clip.mp4', mimeType = 'video/mp4', connectionId, itemId } = req.body;

        if (!videoBase64) {
            return res.status(400).json({ sucesso: false, erro: 'Nenhum dado de vídeo em Base64 foi fornecido.' });
        }

        try {
            // Processa Base64
            let cleanBase64 = videoBase64;
            let detectedMime = mimeType;

            if (videoBase64.includes(';base64,')) {
                const parts = videoBase64.split(';base64,');
                const header = parts[0];
                cleanBase64 = parts[1];
                const match = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)/);
                if (match) detectedMime = match[1];
            }

            const videoBuffer = Buffer.from(cleanBase64, 'base64');

            // Garante o diretório local de uploads de vídeos
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
            await fs.mkdir(uploadsDir, { recursive: true });

            const ext = detectedMime.includes('webm') ? '.webm' : (detectedMime.includes('quicktime') || detectedMime.includes('mov') ? '.mov' : '.mp4');
            const uniqueFilename = `ml_clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
            const localFilePath = path.join(uploadsDir, uniqueFilename);

            await fs.writeFile(localFilePath, videoBuffer);
            const localVideoUrl = `/uploads/videos/${uniqueFilename}`;

            // Upload / Registro na API do Mercado Livre
            let meliClip = null;
            let resolvedConnId = connectionId;

            if (!resolvedConnId && itemId) {
                const pool = db.getPool();
                const [itemRows] = await pool.execute('SELECT connection_id FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
                if (itemRows[0]) resolvedConnId = itemRows[0].connection_id;
            }

            if (!resolvedConnId) {
                const pool = db.getPool();
                const [conns] = await pool.execute('SELECT id FROM marketplace_connections WHERE type = "mercadolivre" ORDER BY id ASC LIMIT 1');
                if (conns[0]) resolvedConnId = conns[0].id;
            }

            if (resolvedConnId) {
                const connection = await findMarketplaceConnectionById(resolvedConnId);
                if (connection) {
                    try {
                        meliClip = await meliService.uploadClip(connection, videoBuffer, filename || uniqueFilename, detectedMime, db);
                    } catch (clipErr) {
                        logger.warn(`[MarketplaceRoutes] Aviso ao enviar clipe para ML: ${clipErr.message}`);
                    }
                }
            }

            const clipId = meliClip?.clip_id || `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const clipStatus = meliClip?.clip_status || 'under_review';
            const clipDetails = meliClip?.clip_details || {
                filename: filename || uniqueFilename,
                size: videoBuffer.length,
                mimeType: detectedMime,
                uploaded_at: new Date().toISOString(),
                moderation_status: clipStatus,
                moderation_message: 'Vídeo enviado e aguardando moderação.'
            };

            // Atualiza o anúncio no banco de dados se itemId estiver presente
            if (itemId) {
                const pool = db.getPool();
                await pool.execute(`
                    UPDATE mercado_livre_anuncios 
                    SET video_url = ?, clip_id = ?, clip_status = ?, clip_details = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE item_id = ?
                `, [localVideoUrl, clipId, clipStatus, JSON.stringify(clipDetails), itemId]);
            }

            res.json({
                sucesso: true,
                mensagem: 'Clip de vídeo enviado com sucesso para moderação!',
                videoUrl: localVideoUrl,
                clipId,
                clipStatus,
                clipDetails,
                filename: filename || uniqueFilename
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao processar upload de clipe: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.get('/marketplace/mercadolivre/items/:itemId/clip-status', async (req, res) => {
        const { itemId } = req.params;

        try {
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            const item = rows[0];

            if (!item) {
                return res.status(404).json({ sucesso: false, erro: 'Anúncio não encontrado.' });
            }

            if (!item.clip_id && !item.video_url) {
                return res.json({
                    sucesso: true,
                    hasClip: false,
                    clipStatus: null,
                    videoUrl: null
                });
            }

            let currentStatus = item.clip_status || 'under_review';
            let moderationMessage = 'O clipe de vídeo está sob análise pela moderação do Mercado Livre.';
            let clipDetails = safeJsonParse(item.clip_details) || {};

            // Consulta API do Mercado Livre se conexão existir
            if (item.connection_id && item.clip_id) {
                const connection = await findMarketplaceConnectionById(item.connection_id);
                if (connection) {
                    try {
                        const statusRes = await meliService.checkClipStatus(connection, item.clip_id, itemId, db);
                        if (statusRes.clip_status) {
                            currentStatus = statusRes.clip_status;
                            moderationMessage = statusRes.message || moderationMessage;
                            clipDetails = {
                                ...clipDetails,
                                moderation_status: currentStatus,
                                moderation_message: moderationMessage,
                                checked_at: statusRes.checked_at
                            };

                            // Atualiza no banco
                            await pool.execute(
                                'UPDATE mercado_livre_anuncios SET clip_status = ?, clip_details = ? WHERE item_id = ?',
                                [currentStatus, JSON.stringify(clipDetails), itemId]
                            );
                        }
                    } catch (checkErr) {
                        logger.warn(`[MarketplaceRoutes] Falha ao consultar status remoto do clipe: ${checkErr.message}`);
                    }
                }
            }

            res.json({
                sucesso: true,
                hasClip: true,
                clipId: item.clip_id,
                clipStatus: currentStatus,
                videoUrl: item.video_url,
                moderationMessage,
                clipDetails
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao buscar status do clipe ${itemId}: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.delete('/marketplace/mercadolivre/items/:itemId/clip', async (req, res) => {
        const { itemId } = req.params;

        try {
            const pool = db.getPool();
            await pool.execute(`
                UPDATE mercado_livre_anuncios 
                SET video_url = NULL, clip_id = NULL, clip_status = NULL, clip_details = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE item_id = ?
            `, [itemId]);

            res.json({
                sucesso: true,
                mensagem: 'Clip de vídeo desvinculado do anúncio com sucesso.'
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao desvincular clipe ${itemId}: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
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

            const parsedItems = rows.map(r => {
                const isActive = r.status === 'active';
                const isCatalog = !!r.catalog_listing;
                return {
                    ...r,
                    price: parseFloat(r.price),
                    markup_percent: parseFloat(r.markup_percent || 0),
                    sync_auto_stock: !!r.sync_auto_stock,
                    sync_auto_price: !!r.sync_auto_price,
                    catalog_listing: isCatalog,
                    catalog_product_id: r.catalog_product_id || null,
                    catalog_status: (isCatalog && isActive) ? (r.catalog_status || null) : null,
                    catalog_price_to_win: (isCatalog && isActive && r.catalog_price_to_win !== null && r.catalog_price_to_win !== undefined) ? parseFloat(r.catalog_price_to_win) : null,
                    catalog_details: (isCatalog && isActive) ? safeJsonParse(r.catalog_details) : null,
                    source_data: safeJsonParse(r.source_data),
                    credentials: undefined // omite credenciais
                };
            });

            // Paginação flexível (suporta limit=all, 0 ou números)
            const isAll = limit === 'all' || limit === '0' || limit === 0;
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = isAll ? (parsedItems.length || 1) : (parseInt(limit, 10) || 50);
            const totalItems = parsedItems.length;
            const totalPages = isAll ? 1 : (Math.ceil(totalItems / limitNum) || 1);
            const paginated = isAll ? parsedItems : parsedItems.slice((pageNum - 1) * limitNum, pageNum * limitNum);

            res.json({
                sucesso: true,
                items: paginated,
                pagination: {
                    currentPage: isAll ? 1 : pageNum,
                    totalPages,
                    totalItems,
                    limit: isAll ? totalItems : limitNum
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

    router.get('/marketplace/mercadolivre/items/:itemId/details', async (req, res) => {
        const { itemId } = req.params;
        const { connectionId } = req.query;

        try {
            const pool = db.getPool();
            const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
            const localItem = rows[0] ? {
                ...rows[0],
                price: parseFloat(rows[0].price),
                markup_percent: parseFloat(rows[0].markup_percent || 0),
                sync_auto_stock: !!rows[0].sync_auto_stock,
                sync_auto_price: !!rows[0].sync_auto_price,
                source_data: safeJsonParse(rows[0].source_data)
            } : null;

            const resolvedConnId = connectionId || localItem?.connection_id;
            if (!resolvedConnId) {
                return res.status(400).json({ sucesso: false, erro: 'Conexão do anúncio não identificada.' });
            }

            const connection = await findMarketplaceConnectionById(resolvedConnId);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão do Mercado Livre não encontrada.' });
            }

            // Busca os dados diretamente do Mercado Livre (fotos, atributos, etc.)
            let meliItem = null;
            let description = '';
            let catalog = null;

            try {
                meliItem = await meliService.getItem(connection, itemId, db);
            } catch (err) {
                logger.warn(`[MarketplaceRoutes] Falha ao buscar item ${itemId} da API ML: ${err.message}`);
            }

            try {
                description = await meliService.getItemDescription(connection, itemId, db);
            } catch (err) {
                logger.warn(`[MarketplaceRoutes] Falha ao buscar descrição do item ${itemId}: ${err.message}`);
            }

            // Se for item de catálogo oficial, busca status da Buy Box e preço sugerido para ganhar
            const isCatalog = meliItem ? meliService.isMeliCatalogItem(meliItem) : !!localItem?.catalog_listing;
            const isItemActive = (meliItem?.status || localItem?.status) === 'active';

            if (isCatalog) {
                if (isItemActive) {
                    try {
                        catalog = await meliService.getItemPriceToWin(connection, itemId, db);
                        if (catalog) {
                            await pool.execute(
                                'UPDATE mercado_livre_anuncios SET catalog_listing = 1, catalog_product_id = ?, catalog_status = ?, catalog_price_to_win = ?, catalog_details = ? WHERE item_id = ?',
                                [
                                    catalog.catalog_product_id || meliItem?.catalog_product_id || localItem?.catalog_product_id || null,
                                    catalog.status || null,
                                    catalog.price_to_win !== null && catalog.price_to_win !== undefined ? parseFloat(catalog.price_to_win) : null,
                                    catalog.details ? JSON.stringify(catalog.details) : null,
                                    itemId
                                ]
                            );
                        }
                    } catch (catErr) {
                        logger.warn(`[MarketplaceRoutes] Falha ao buscar concorrência de catálogo do item ${itemId}: ${catErr.message}`);
                    }
                } else {
                    // Anúncio de catálogo pausado/inativo: limpa concorrência da Buy Box
                    await pool.execute(
                        'UPDATE mercado_livre_anuncios SET catalog_listing = 1, catalog_product_id = ?, catalog_status = NULL, catalog_price_to_win = NULL, catalog_details = NULL WHERE item_id = ?',
                        [meliItem?.catalog_product_id || localItem?.catalog_product_id || null, itemId]
                    );
                    catalog = {
                        is_catalog: true,
                        is_paused: true,
                        status: meliItem?.status || localItem?.status || 'paused',
                        status_label: 'Anúncio Pausado (Buy Box Inativa)'
                    };
                }
            } else if (meliItem && !isCatalog && localItem?.catalog_listing) {
                // Se a API do ML confirmou que NÃO é de catálogo mas o DB local tinha 1, corrige no banco
                await pool.execute(
                    'UPDATE mercado_livre_anuncios SET catalog_listing = 0, catalog_status = NULL, catalog_price_to_win = NULL, catalog_details = NULL WHERE item_id = ?',
                    [itemId]
                );
                if (localItem) {
                    localItem.catalog_listing = false;
                    localItem.catalog_status = null;
                    localItem.catalog_price_to_win = null;
                    localItem.catalog_details = null;
                }
            }

            res.json({
                sucesso: true,
                item: meliItem || localItem,
                localItem,
                description,
                catalog
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao buscar detalhes do anúncio ${itemId}: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.get('/marketplace/mercadolivre/items/:itemId/price-to-win', async (req, res) => {
        const { itemId } = req.params;
        const { connectionId } = req.query;

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

            const catalog = await meliService.getItemPriceToWin(connection, itemId, db);

            if (catalog) {
                await pool.execute(
                    'UPDATE mercado_livre_anuncios SET catalog_listing = 1, catalog_product_id = ?, catalog_status = ?, catalog_price_to_win = ?, catalog_details = ? WHERE item_id = ?',
                    [
                        catalog.catalog_product_id || localItem?.catalog_product_id || null,
                        catalog.status || null,
                        catalog.price_to_win !== null && catalog.price_to_win !== undefined ? parseFloat(catalog.price_to_win) : null,
                        catalog.details ? JSON.stringify(catalog.details) : null,
                        itemId
                    ]
                );
            }

            res.json({
                sucesso: true,
                catalog
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao consultar price_to_win do anúncio ${itemId}: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.put('/marketplace/mercadolivre/items/:itemId/update', async (req, res) => {
        const { itemId } = req.params;
        const {
            connectionId,
            title,
            price,
            available_quantity,
            status,
            sku,
            gtin,
            brand,
            model,
            listing_type_id,
            pictures,
            description,
            sync_auto_stock,
            sync_auto_price,
            markup_percent
        } = req.body;

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

            const isCatalog = !!(req.body.is_catalog || localItem?.catalog_listing);

            // Atualiza no Mercado Livre via API
            const updatedMeli = await meliService.updateItem(connection, itemId, {
                title,
                price,
                available_quantity,
                status,
                sku,
                gtin,
                brand,
                model,
                listing_type_id,
                pictures,
                description,
                is_catalog: isCatalog
            }, db);

            // Determina thumbnail principal
            let thumbnail = localItem?.thumbnail || null;
            if (Array.isArray(pictures) && pictures.length > 0) {
                const firstPic = pictures[0];
                thumbnail = typeof firstPic === 'string' ? firstPic : (firstPic.secure_url || firstPic.url || firstPic.source || thumbnail);
            } else if (updatedMeli?.pictures && updatedMeli.pictures[0]) {
                thumbnail = updatedMeli.pictures[0].secure_url || updatedMeli.pictures[0].url || thumbnail;
            }

            // Atualiza no DB local
            if (localItem) {
                const updatedDb = {
                    ...localItem,
                    title: title || localItem.title,
                    price: price !== undefined ? parseFloat(price) : localItem.price,
                    available_quantity: available_quantity !== undefined ? parseInt(available_quantity, 10) : localItem.available_quantity,
                    status: status || localItem.status,
                    sku: sku !== undefined ? sku : localItem.sku,
                    listing_type_id: listing_type_id || localItem.listing_type_id,
                    thumbnail,
                    video_url: localItem.video_url,
                    clip_id: localItem.clip_id,
                    clip_status: localItem.clip_status,
                    clip_details: safeJsonParse(localItem.clip_details),
                    sync_auto_stock: sync_auto_stock !== undefined ? !!sync_auto_stock : !!localItem.sync_auto_stock,
                    sync_auto_price: sync_auto_price !== undefined ? !!sync_auto_price : !!localItem.sync_auto_price,
                    markup_percent: markup_percent !== undefined ? parseFloat(markup_percent) : parseFloat(localItem.markup_percent || 0),
                    source_data: safeJsonParse(localItem.source_data)
                };
                await db.saveOrUpdateMercadoLivreAnuncio(updatedDb);
            }

            res.json({
                sucesso: true,
                mensagem: 'Anúncio atualizado com sucesso no Mercado Livre!',
                item: updatedMeli
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao atualizar anúncio ${itemId}: ${error.message}`, error);
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
                const isNowActive = status === 'active';
                const updatedDb = {
                    ...localItem,
                    status,
                    catalog_status: isNowActive ? localItem.catalog_status : null,
                    catalog_price_to_win: isNowActive ? localItem.catalog_price_to_win : null,
                    catalog_details: isNowActive ? safeJsonParse(localItem.catalog_details) : null,
                    source_data: safeJsonParse(localItem.source_data)
                };
                await db.saveOrUpdateMercadoLivreAnuncio(updatedDb);
            }

            res.json({ sucesso: true, mensagem: `Status do anúncio alterado para ${status}!`, item: updated });
        } catch (error) {
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.put('/marketplace/mercadolivre/items/bulk-status', async (req, res) => {
        const { itemIds, newStatus } = req.body;

        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ sucesso: false, erro: 'Nenhum ID de anúncio fornecido.' });
        }
        if (!['active', 'paused'].includes(newStatus)) {
            return res.status(400).json({ sucesso: false, erro: 'Status inválido. Use "active" ou "paused".' });
        }

        logger.info(`[MarketplaceRoutes] Iniciando ação em massa para alterar status para "${newStatus}" em ${itemIds.length} anúncios.`);

        let successCount = 0;
        let failureCount = 0;
        const pool = db.getPool();

        // A API do ML não tem um endpoint de bulk status real, então iteramos.
        for (const itemId of itemIds) {
            try {
                const [rows] = await pool.execute('SELECT connection_id FROM mercado_livre_anuncios WHERE item_id = ?', [itemId]);
                if (!rows[0]) {
                    logger.warn(`[MarketplaceRoutes] Bulk-status: Anúncio ${itemId} não encontrado no DB local. Pulando.`);
                    failureCount++;
                    continue;
                }
                const connection = await findMarketplaceConnectionById(rows[0].connection_id);
                if (!connection) {
                    logger.warn(`[MarketplaceRoutes] Bulk-status: Conexão para o anúncio ${itemId} não encontrada. Pulando.`);
                    failureCount++;
                    continue;
                }
                await meliService.updateItemStatus(connection, itemId, newStatus, db);
                if (newStatus !== 'active') {
                    await pool.execute('UPDATE mercado_livre_anuncios SET status = ?, catalog_status = NULL, catalog_price_to_win = NULL, catalog_details = NULL, updated_at = CURRENT_TIMESTAMP WHERE item_id = ?', [newStatus, itemId]);
                } else {
                    await pool.execute('UPDATE mercado_livre_anuncios SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE item_id = ?', [newStatus, itemId]);
                }
                successCount++;
            } catch (error) {
                logger.error(`[MarketplaceRoutes] Bulk-status: Falha ao atualizar o anúncio ${itemId}.`, error);
                failureCount++;
            }
        }

        const message = `Ação em massa concluída. ${successCount} anúncio(s) atualizado(s) com sucesso, ${failureCount} falha(s).`;
        res.json({ sucesso: true, mensagem: message, successCount, failureCount });
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
            const { items } = await meliService.getUserItems(connection, null, db);
            let importedCount = 0;

            for (const item of items) {
                const skuAttr = item.attributes?.find(a => a.id === 'SELLER_SKU');
                const sku = skuAttr ? skuAttr.value_name : (item.seller_custom_field || null);
                const thumbnail = (item.pictures && item.pictures[0])
                    ? (item.pictures[0].secure_url || item.pictures[0].url)
                    : (item.thumbnail || null);

                const isCatalog = meliService.isMeliCatalogItem(item);
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
                    catalog_listing: isCatalog,
                    catalog_product_id: item.catalog_product_id || null,
                    catalog_status: null,
                    catalog_price_to_win: null,
                    catalog_details: null,
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

            // Sincroniza automaticamente a Buy Box / status de catálogo para os anúncios importados
            try {
                await meliService.syncAllCatalogItemsStatus(db, connection.id);
            } catch (catSyncErr) {
                logger.warn(`[MarketplaceRoutes] Aviso na sincronização de catálogo pós-importação: ${catSyncErr.message}`);
            }

            res.json({
                sucesso: true,
                mensagem: `${importedCount} anúncios importados/atualizados da conta do Mercado Livre com sucesso!`,
                count: importedCount
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao importar anúncios do Mercado Livre: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    router.post('/marketplace/mercadolivre/sync-all-catalog-status', async (req, res) => {
        const { connectionId } = req.body;
        try {
            const result = await meliService.syncAllCatalogItemsStatus(db, connectionId || null);
            res.json({
                sucesso: true,
                mensagem: `Status da Buy Box atualizado! ${result.updated} de ${result.total} anúncio(s) de catálogo sincronizados (${result.winners} vencendo, ${result.losers} perdendo).`,
                ...result
            });
        } catch (error) {
            logger.error(`[MarketplaceRoutes] Erro ao sincronizar Buy Box em lote: ${error.message}`, error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    return router;
};
