const express = require('express');
const erpService = require('./erpService.js');

const router = express.Router();

module.exports = (db, erpConnections) => {
    // --- ROTAS DE GERENCIAMENTO DE CONEXÕES ERP ---

    router.get('/erp-connections', async (req, res) => {
        const connectionsWithStatus = await Promise.all(erpConnections.map(async (conn) => {
            let status = 'not_applicable';
            if (conn.type === 'bling') {
                status = await erpService.getBlingConnectionStatus(conn, db);
            } else if (conn.type === 'cisspoder') {
                status = await erpService.getCissPoderConnectionStatus(conn, db);
            }

            const safeCreds = { ...conn.credentials };
            if (safeCreds.password) safeCreds.password = '******';
            if (safeCreds.client_secret) safeCreds.client_secret = '******';
            if (safeCreds.access_token) safeCreds.access_token = safeCreds.access_token.substring(0, 8) + '...';
            if (safeCreds.refresh_token) safeCreds.refresh_token = '******';

            return { ...conn, credentials: safeCreds, status };
        }));

        res.json({ sucesso: true, connections: connectionsWithStatus });
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
            erpConnections.push(newConnection);
            res.status(201).json({ sucesso: true, connection: newConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.put('/erp-connections/:id', async (req, res) => {
        const { id } = req.params;
        const { name, credentials } = req.body;

        if (!name || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome e credenciais são obrigatórios.' });
        }

        const connectionIndex = erpConnections.findIndex(c => c.id == id);
        if (connectionIndex === -1) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
        }

        try {
            const connection = erpConnections[connectionIndex];
            const newCredentials = { ...connection.credentials, ...credentials };
            const updatedConnection = { ...connection, name, credentials: newCredentials };

            await db.updateDb({ connection: { id, name, credentials: newCredentials } });
            erpConnections[connectionIndex] = updatedConnection;

            res.json({ sucesso: true, connection: updatedConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.delete('/erp-connections/:id', async (req, res) => {
        const { id } = req.params;

        const connectionIndex = erpConnections.findIndex(c => c.id == id);
        if (connectionIndex === -1) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
        }

        try {
            const pool = db.getPool();
            await pool.execute('DELETE FROM erp_connections WHERE id = ?', [id]);
            erpConnections.splice(connectionIndex, 1);
            res.json({ sucesso: true, mensagem: 'Conexão removida com sucesso.' });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    // --- ROTAS DE AUTENTICAÇÃO E PRODUTOS ERP ---

    router.get('/auth/:connectionId/bling', (req, res) => {
        const { connectionId } = req.params;
        const connection = erpConnections.find(c => c.id == connectionId);

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
        const connection = erpConnections.find(c => c.id == connectionId);

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
            await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });

            res.redirect('/?autorizado=true');
        } catch (e) {
            console.error('Falha no callback do Bling:', e.message);
            if (e.response) {
                console.error('Detalhes do erro:', JSON.stringify(e.response.data));
            }
            res.status(500).send('Erro na autorização: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
        }
    });

    router.get('/produtos/:connectionId', async (req, res) => {
        const { connectionId } = req.params;
        const connection = erpConnections.find(c => c.id == connectionId);

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