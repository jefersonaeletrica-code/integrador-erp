import express from 'express';
import * as erpService from '../services/erpService.js';
import { getLogger } from '../core/logger.js';

const router = express.Router();

// Heurística para determinar se o termo de busca é um SKU.
// Aceita letras, números e hífens, com no mínimo 5 caracteres.
// Não considera um SKU se for composto apenas por letras.
const isSku = (term) => /^[a-zA-Z0-9-]{5,}$/.test(term) && !/^[a-zA-Z]+$/.test(term);

export default (db) => {
    const logger = getLogger();

    // --- ROTAS DE GERENCIAMENTO DE CONEXÕES ERP ---
    const findErpConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM erp_connections WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], credentials: JSON.parse(rows[0].credentials) };
    };

    router.get('/erp-connections', async (req, res) => {
        try {
            const pool = db.getPool();
            const [connections] = await pool.execute('SELECT * FROM erp_connections');

            const connectionsWithStatus = await Promise.all(connections.map(async (conn) => {
                const parsedConn = { ...conn, credentials: JSON.parse(conn.credentials) };
                let status = 'not_applicable';
                if (parsedConn.type === 'bling') {
                    status = await erpService.getBlingConnectionStatus(parsedConn, db);
                } else if (parsedConn.type === 'cisspoder') {
                    status = await erpService.getCissPoderConnectionStatus(parsedConn, db);
                }

                const { password, client_secret, access_token, refresh_token, ...safeCredentials } = parsedConn.credentials;
                const displayCredentials = { ...safeCredentials };
                if (access_token) displayCredentials.access_token = '******';

                return { ...parsedConn, credentials: displayCredentials, status };
            }));
            res.json({ sucesso: true, connections: connectionsWithStatus });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Falha ao buscar conexões ERP: ${e.message}` });
        }
    });

    router.post('/erp-connections', async (req, res) => {
        const { name, type, credentials } = req.body;
        if (!name || !type || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome, tipo e credenciais são obrigatórios.' });
        }

        try {
            const pool = db.getPool();
            const [result] = await pool.execute(
                'INSERT INTO erp_connections (name, type, credentials) VALUES (?, ?, ?)',
                [name, type, JSON.stringify(credentials)]
            );
            const newConnection = { id: result.insertId, name, type, credentials };
            res.status(201).json({ sucesso: true, connection: newConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.put('/erp-connections/:id', async (req, res) => {
        const { id } = req.params;
        const { name, type, credentials } = req.body;

        if (!name || !type || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome, tipo e credenciais são obrigatórios.' });
        }

        try {
            const connection = await findErpConnectionById(id);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão ERP não encontrada.' });
            }

            // Mantém tokens existentes (ex: refresh_token do Bling) ao mesclar.
            const newCredentials = { ...(connection.credentials || {}), ...credentials };
            // Cria o objeto de conexão atualizado completo.
            const updatedConnection = { ...connection, name, type, credentials: newCredentials };

            // Passa o objeto completo para a função de atualização do banco de dados.
            await db.updateDb({ connection: updatedConnection }); // Assumindo que updateDb lida com a atualização no DB

            res.json({ sucesso: true, connection: updatedConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.delete('/erp-connections/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const pool = db.getPool();
            const [result] = await pool.execute('DELETE FROM erp_connections WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada para remover.' });
            res.json({ sucesso: true, mensagem: 'Conexão removida com sucesso.' });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    // --- ROTAS DE AUTENTICAÇÃO E PRODUTOS ERP ---

    router.get('/auth/:connectionId/bling', (req, res) => {
        const { connectionId } = req.params;
        const connection = await findErpConnectionById(connectionId);

        if (!connection || connection.type !== 'bling') {
            return res.status(404).json({ sucesso: false, erro: 'Conexão Bling não encontrada.' });
        }

        const { client_id, redirect_uri } = connection.credentials;
        const state = `connId=${connectionId}`;
        const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;
        res.json({ sucesso: true, url: authUrl });
    });

    router.get('/callback', async (req, res) => {
        const { code, error, state } = req.query;
        if (error) return res.status(400).send('Erro retornado pelo Bling: ' + error);
        if (!code) return res.status(400).send('Código de autorização não encontrado.');

        const stateParams = new URLSearchParams(state);
        const connectionId = stateParams.get('connId');
        const connection = await findErpConnectionById(connectionId);

        if (!connection) {
            return res.status(400).send('Conexão inválida ou não encontrada a partir do state.');
        }

        try {
            const { client_id, client_secret } = connection.credentials;
            const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
            const response = await erpService.axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token',
                new URLSearchParams({ grant_type: 'authorization_code', code }),
                { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            connection.credentials.access_token = response.data.access_token;
            connection.credentials.refresh_token = response.data.refresh_token;
            await db.updateDb({ connection }); // A função updateDb já espera o objeto de conexão

            res.redirect('/?autorizado=true');
        } catch (e) {
            console.error('Falha no callback do Bling:', e.message);
            if (e.response) {
                console.error('Detalhes do erro:', JSON.stringify(e.response.data));
            }
            res.status(500).send('Erro na autorização: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
        }
    });

    /**
     * Rota para buscar produtos em uma conexão ERP específica.
     * Esta rota é utilizada pela nova interface.
     * POST /api/erp-connections/:id/products
     * Body: { "searchTerm": "..." }
     */
    router.post('/erp-connections/:id/products', async (req, res) => {
        const { id } = req.params;
        const { searchTerm, page = 1 } = req.body;

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ sucesso: false, erro: 'O termo de busca é obrigatório.' });
        }

        const connection = await findErpConnectionById(id);
        if (!connection) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão ERP não encontrada.' });
        }

        logger.info(`[ERPRoutes] Iniciando busca de produtos para conexão ${connection.id} (${connection.type}) com o termo: "${searchTerm}"`);

        try {
            let apiProducts = [];
            let paginationInfo = { currentPage: parseInt(page, 10), totalPages: 1, totalItems: 0 };

            if (connection.type === 'bling') {
                await erpService.getBlingConnectionStatus(connection, db); // Garante token válido
                const rawData = isSku(searchTerm)
                    ? await erpService.fetchBlingProductsByCode(connection, searchTerm, page)
                    : await erpService.fetchBlingProductsByName(connection, searchTerm, page);
                apiProducts = rawData.data || [];
                const totalItems = rawData.meta?.total ?? 0;
                const limit = rawData.meta?.limit ?? 100;
                paginationInfo.totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
                paginationInfo.totalItems = totalItems;

            } else if (connection.type === 'cisspoder') {
                await erpService.ensureCissPoderTokenIsValid(connection, db); // Garante token válido
                const rawData = isSku(searchTerm)
                    ? await erpService.fetchCissPoderProductsByCode(connection, searchTerm, page)
                    : await erpService.fetchCissPoderProductsByName(connection, searchTerm, page);
                apiProducts = rawData.data || [];
                const totalItems = rawData.total ?? 0;
                // A API CissPoder não retorna o limite por página, mas a documentação sugere que é 20.
                const limit = 20;
                paginationInfo.totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
                paginationInfo.totalItems = totalItems;

            } else {
                return res.status(400).json({ sucesso: false, erro: `Tipo de conexão ERP '${connection.type}' não suportado.` });
            }

            // Normaliza a estrutura dos produtos para o formato esperado pelo frontend.
            const products = apiProducts.map(p => ({
                sku: p.codigo,
                name: p.nome,
                stock: p.saldoFisicoTotal ?? p.estoque ?? 'N/A', // Usa saldoFisicoTotal (Bling) ou estoque (CissPoder)
                price: p.preco ?? null // Ambas as APIs agora retornam 'preco'
            }));

            logger.info(`[ERPRoutes] Busca concluída. Encontrados ${products.length} produtos.`);
            res.json({ sucesso: true, products, pagination: paginationInfo });
        } catch (error) {
            const errorMessage = error.response?.data?.error_description || error.response?.data?.erro || error.message;
            logger.error(`[ERPRoutes] Erro ao buscar produtos para conexão ${id}: ${errorMessage}`, error);
            res.status(500).json({ sucesso: false, erro: `Falha ao buscar produtos: ${errorMessage}` });
        }
    });

    router.get('/produtos/:connectionId', async (req, res) => {
        const { connectionId } = req.params;
        const connection = await findErpConnectionById(connectionId);

        if (!connection) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
        }

        try {
            if (connection.type === 'bling') {
                await erpService.getBlingConnectionStatus(connection, db);
            } else if (connection.type === 'cisspoder') {
                await erpService.ensureCissPoderTokenIsValid(connection, db);
            }

            const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
            const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

            const { nome, codigo } = req.query;
            let responseData;

            if (connection.type === 'bling') {
                if (typeof nome === 'string' && nome.trim()) {
                    responseData = await erpService.fetchBlingProductsByName(connection, nome.trim(), page);
                } else if (typeof codigo === 'string' && codigo.trim()) {
                    responseData = await erpService.fetchBlingProductsByCode(connection, codigo.trim(), page);
                } else {
                    responseData = await erpService.fetchAllBlingProductsPaginated(connection, page);
                }
            } else if (connection.type === 'cisspoder') {
                const uniqueProductsMap = new Map();
                let totalFromApi = 0;
                let currentPage = page;
                let hasNext = true;
                let fetchFunction;

                if (typeof nome === 'string' && nome.trim()) {
                    fetchFunction = (p) => erpService.fetchCissPoderProductsByName(connection, nome.trim(), p);
                } else if (typeof codigo === 'string' && codigo.trim()) {
                    fetchFunction = (p) => erpService.fetchCissPoderProductsByCode(connection, codigo.trim(), p);
                } else {
                    fetchFunction = (p) => erpService.fetchAllCissPoderProducts(connection, p);
                }

                while (uniqueProductsMap.size < 100 && hasNext) {
                    console.log(`[CissPoder] Buscando página ${currentPage} da API para preencher a página do frontend.`);
                    const result = await fetchFunction(currentPage);
                    result.data.forEach(p => {
                        if (!uniqueProductsMap.has(p.codigo)) {
                            uniqueProductsMap.set(p.codigo, p);
                        }
                    });
                    totalFromApi = result.total;
                    hasNext = result.hasNext;
                    currentPage++;
                }
                const allProducts = Array.from(uniqueProductsMap.values()).slice(0, 100);
                responseData = { data: allProducts, total: totalFromApi };
            } else {
                return res.status(400).json({ sucesso: false, erro: 'Tipo de conexão não suportado para busca de produtos.' });
            }

            let produtos = responseData?.data || [];
            if (connection.type === 'bling') {
                produtos = produtos.map(p => ({
                    codigo: p.codigo,
                    nome: p.nome,
                    preco: p.preco || 0
                }));
            }

            const total = responseData?.total ?? responseData?.meta?.total;
            res.json({ sucesso: true, produtos, pagina: page, total });
        } catch (e) {
            let errorMessage = e.message;
            if (e.code === 'ECONNABORTED') {
                errorMessage = 'A requisição para o ERP demorou demais e foi cancelada (timeout).';
            } else if (e.response) {
                errorMessage = `O ERP retornou um erro ${e.response.status}.`;
            }
            res.status(500).json({ sucesso: false, erro: errorMessage });
        }
    });

    return router;
};