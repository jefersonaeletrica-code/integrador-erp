import express from 'express';
import { DismatalScraper } from '../scrapers/dismatal.scraper.js';
import { getLogger } from '../core/logger.js';
import path from 'path';
import { addToQueue } from '../scrapers/scraperQueue.js';

const router = express.Router();

export default (db) => {
    // --- ROTAS DE GERENCIAMENTO DE CONEXÕES DE FORNECEDORES ---
    
    router.post('/supplier-connections', async (req, res) => {
        const { name, type, credentials } = req.body;
        if (!name || !type || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome, tipo e credenciais são obrigatórios.' });
        }

        try {
            const pool = db.getPool();
            const [result] = await pool.execute(
                'INSERT INTO supplier_connections (name, type, credentials) VALUES (?, ?, ?)',
                [name, type, JSON.stringify(credentials)]
            );
            const newConnection = { id: result.insertId, name, type, credentials };
            res.status(201).json({ sucesso: true, connection: newConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.get('/supplier-connections', async (req, res) => {
        // Lê os dados mais recentes do banco de dados a cada requisição.
        const { supplierConnections } = await db.readDb();

        // Remove senhas e outros dados sensíveis antes de enviar para o cliente.
        const connectionsWithSafeCredentials = supplierConnections.map(conn => {
            // Cria uma cópia segura das credenciais, omitindo a senha.
            const { password, ...safeCredentials } = conn.credentials;
            return { ...conn, credentials: { ...safeCredentials, password: password ? '******' : undefined } };
        });
        res.json({ sucesso: true, connections: connectionsWithSafeCredentials });
    });

    router.get('/supplier-connections/:id', async (req, res) => {
        const { id } = req.params;
        const pool = db.getPool();
        try {
            const [rows] = await pool.execute('SELECT * FROM supplier_connections WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
            }
            const connection = rows[0];
            // Garante que as credenciais sejam enviadas como um objeto JSON, não uma string.
            connection.credentials = typeof connection.credentials === 'string' ? JSON.parse(connection.credentials) : connection.credentials;
            res.json({ sucesso: true, connection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Erro ao buscar conexão: ${e.message}` });
        }
    });

    router.put('/supplier-connections/:id', async (req, res) => {
        const { id } = req.params;
        const { name, type, credentials } = req.body;

        if (!name || !type || !credentials) {
            return res.status(400).json({ sucesso: false, erro: 'Nome, tipo e credenciais são obrigatórios.' });
        }

        try {
            const pool = db.getPool();
            const [result] = await pool.execute(
                'UPDATE supplier_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
                [name, type, JSON.stringify(credentials), id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada para atualizar.' });
            res.json({ sucesso: true, connection: { id: parseInt(id, 10), name, type, credentials } });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.delete('/supplier-connections/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const pool = db.getPool();
            const [result] = await pool.execute('DELETE FROM supplier_connections WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada para remover.' });
            res.json({ sucesso: true, mensagem: 'Conexão de fornecedor removida com sucesso.' });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    // Helper para buscar conexão por ID
    const findConnectionById = async (id) => {
        const pool = db.getPool();
        const [rows] = await pool.execute('SELECT * FROM supplier_connections WHERE id = ?', [id]);
        if (!rows[0]) {
            return null;
        }
        const connection = rows[0];
        // Garante que os campos JSON sejam parseados de forma segura, apenas se forem strings.
        const credentials = typeof connection.credentials === 'string' ? JSON.parse(connection.credentials) : connection.credentials;
        const cookies = typeof connection.session_data === 'string' ? JSON.parse(connection.session_data) : connection.session_data;

        return { ...connection, credentials, cookies };
    };

    router.post('/supplier-connections/:id/authenticate', async (req, res) => {
        const { id } = req.params;
        const connection = await findConnectionById(id);

        if (!connection) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        if (connection.type !== 'dismatal_webscraper') return res.status(400).json({ sucesso: false, erro: 'Função disponível apenas para conexões Dismatal.' });

        try {
            // Adiciona a tarefa de autenticação à fila e responde imediatamente
            // para evitar timeouts de requisição em tarefas longas.
            const scraper = new DismatalScraper({ headless: true });
            addToQueue(() => scraper.performAuthentication(connection));
            res.status(202).json({ sucesso: true, mensagem: 'Tarefa de autenticação iniciada. A sessão será salva em segundo plano.' });
        } catch (e) {
            console.error('[Dismatal API] Erro na autenticação:', e.message);
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.post('/supplier-connections/:id/validate-authentication', async (req, res) => {
        const { id } = req.params;
        const connection = await findConnectionById(id);

        if (!connection) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        if (connection.type !== 'dismatal_webscraper') return res.status(400).json({ sucesso: false, erro: 'Função disponível apenas para conexões Dismatal.' });

        try {
            // A validação também pode ser demorada, então usamos a fila.
            const scraper = new DismatalScraper({ headless: true });
            addToQueue(() => scraper.validateAuthentication(connection));
            res.status(202).json({ sucesso: true, mensagem: 'Tarefa de validação iniciada. O resultado aparecerá no console do servidor.' });
        } catch (e) {
            console.error('[Dismatal API] Erro na validação de autenticação:', e.message);
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    // Rota de teste para exibir a página de frontend
    router.get('/supplier-connections/:id/test-scraper', (req, res) => {
        // Presume que o arquivo de teste está na pasta 'public'
        const filePath = path.join(process.cwd(), 'public', 'test-dismatal.html');
        res.sendFile(filePath);
    });

    router.post('/supplier-connections/:id/products', async (req, res) => {
        const { id } = req.params;
        const { searchTerm } = req.body;
        const connection = await findConnectionById(id);

        if (!connection) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        if (connection.type !== 'dismatal_webscraper') return res.status(400).json({ sucesso: false, erro: 'Busca de produtos disponível apenas para conexões Dismatal.' });

        try {
            // A busca agora é síncrona em relação à requisição HTTP.
            // O `addToQueue` garante que apenas uma busca ocorra por vez no backend.
            const scraper = new DismatalScraper({ headless: true });
            const result = await addToQueue(() => scraper.fetchProducts(connection, searchTerm));

            // Retorna o resultado diretamente na resposta da API.
            res.status(200).json(result);
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: `Erro durante a busca de produtos: ${e.message}` });
        }
    });

    return router;
};