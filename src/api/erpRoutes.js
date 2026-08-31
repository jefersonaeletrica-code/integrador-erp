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

    // Helper para parsear JSON de forma segura, evitando que a aplicação quebre.
    const safeJsonParse = (data) => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return null; // Retorna null se a string JSON for inválida
            }
        }
        return data; // Retorna o dado como está se já for um objeto
    };

    // --- ROTAS DE GERENCIAMENTO DE CONEXÕES ERP ---
    const findErpConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM erp_connections WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], credentials: safeJsonParse(rows[0].credentials) };
    };

    router.get('/erp-connections', async (req, res) => {
        try {
            const pool = db.getPool();
            const [connections] = await pool.execute('SELECT * FROM erp_connections');

            const connectionsWithStatus = await Promise.all(connections.map(async (conn) => {
                const parsedConn = { ...conn, credentials: safeJsonParse(conn.credentials) };
                let status;
                try {
                    // A lógica de status agora é abstraída pelo erpService
                    status = await erpService.getErpConnectionStatus(parsedConn, db);
                } catch (statusError) {
                    // Se a verificação de status de uma conexão falhar, registramos o erro
                    // e definimos o status como 'error' em vez de quebrar toda a requisição.
                    logger.error(`Falha ao obter status para a conexão ERP ID ${conn.id}`, statusError);
                    status = 'error';
                }
                // Adiciona um fallback para um objeto vazio para evitar erros de desestruturação se as credenciais forem nulas.
                const { password, client_secret, access_token, refresh_token, ...safeCredentials } = parsedConn.credentials || {};
                const displayCredentials = { ...safeCredentials };
                if (access_token) displayCredentials.access_token = '******';

                return { ...parsedConn, credentials: displayCredentials, status };
            }));
            res.json({ sucesso: true, connections: connectionsWithStatus });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Falha ao buscar conexões ERP: ${e.message}` });
        }
    });

    router.get('/erp-connections/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const connection = await findErpConnectionById(id);
            if (!connection) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão ERP não encontrada.' });
            }
            // Retorna a conexão encontrada como JSON
            res.json({ sucesso: true, connection });
        } catch (e) {
            logger.error(`Falha ao buscar conexão ERP por ID: ${id}`, e);
            res.status(500).json({ sucesso: false, erro: `Erro ao buscar conexão: ${e.message}` });
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

    router.get('/auth/:connectionId/bling', async (req, res) => {
        const { connectionId } = req.params;
        const connection = await findErpConnectionById(connectionId); // Agora funciona, pois a função é async

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
        const connection = await findErpConnectionById(connectionId); // Agora funciona, pois a função é async

        if (!connection) {
            return res.status(400).send('Conexão inválida ou não encontrada a partir do state.');
        }

        try {
            const { client_id, client_secret } = connection.credentials;
            const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
            const response = await erpService.axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token',
                new URLSearchParams({ grant_type: 'authorization_code', code }),
                { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } } // Usa a instância exportada
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

            // Garante que o token de acesso seja válido antes de fazer a chamada
            await erpService.ensureValidToken(connection, db);

            // Determina se a busca é por SKU ou por nome e chama o serviço apropriado
            const rawData = isSku(searchTerm)
                ? await erpService.fetchProductsByCode(connection, searchTerm, page)
                : await erpService.fetchProductsByName(connection, searchTerm, page);

            // Extrai os produtos do campo 'data' da resposta
            apiProducts = rawData.data || [];

            if (connection.type === 'bling') {
                // CORREÇÃO: Acessa o total de itens diretamente do objeto meta.
                const totalItems = rawData.meta?.total || 0;
                const limit = rawData.meta?.limit || 100;
                paginationInfo.totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
                paginationInfo.totalItems = totalItems;
            } else if (connection.type === 'cisspoder') {
                const totalItems = rawData.total || 0;
                const limit = 20;
                paginationInfo.totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1;
                paginationInfo.totalItems = totalItems;
            }

            // Normaliza a estrutura dos produtos para o formato esperado pelo frontend,
            // tratando a extração de estoque de forma específica para cada ERP.
            const products = apiProducts.map(p => ({
                id: p.id,
                sku: p.codigo,
                name: p.nome,
                // CORREÇÃO: Extrai o estoque do Bling do objeto aninhado `estoque.saldoVirtualTotal`.
                // Mantém a compatibilidade com CissPoder (p.saldoFisicoTotal).
                stock: (connection.type === 'bling' && p.estoque)
                    ? p.estoque.saldoVirtualTotal ?? null
                    : p.saldoFisicoTotal ?? p.estoque ?? null,
                price: p.preco ?? null
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
            await erpService.ensureValidToken(connection, db);

            const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
            const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

            const { nome, codigo } = req.query;
            let responseData;

            if (connection.type === 'bling') {
                if (typeof nome === 'string' && nome.trim()) {
                    responseData = await erpService.fetchProductsByName(connection, nome.trim(), page);
                } else if (typeof codigo === 'string' && codigo.trim()) {
                    responseData = await erpService.fetchProductsByCode(connection, codigo.trim(), page);
                } else {
                    responseData = await erpService.getService(connection.type).fetchAllProducts(connection, page);
                }
            } else if (connection.type === 'cisspoder') {
                const uniqueProductsMap = new Map();
                let totalFromApi = 0;
                let currentPage = page;
                let hasNext = true;
                let fetchFunction;

                if (typeof nome === 'string' && nome.trim()) {
                    fetchFunction = (p) => erpService.fetchProductsByName(connection, nome.trim(), p);
                } else if (typeof codigo === 'string' && codigo.trim()) {
                    fetchFunction = (p) => erpService.fetchProductsByCode(connection, codigo.trim(), p);
                } else {
                    fetchFunction = (p) => erpService.getService(connection.type).fetchAllProducts(connection, p);
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

            // Normaliza a resposta para o formato padrão esperado pelo frontend, garantindo consistência.
            const produtos = (responseData?.data || []).map(p => ({
                sku: p.codigo,
                name: p.nome,
                stock: p.saldoFisicoTotal ?? p.estoque ?? null,
                price: p.preco ?? null
            }));

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