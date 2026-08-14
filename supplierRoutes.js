import express from 'express';
import { DismatalScraper } from './dismatal.scraper.js';

const router = express.Router();

export default (db, supplierConnections) => {
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
            supplierConnections.push(newConnection);
            res.status(201).json({ sucesso: true, connection: newConnection });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.get('/supplier-connections', async (req, res) => {
        const connectionsWithSafeCredentials = supplierConnections.map(conn => {
            const safeCreds = { ...conn.credentials };
            if (safeCreds.password) {
                safeCreds.password = '******';
            }
            return { ...conn, credentials: safeCreds };
        });
        res.json({ sucesso: true, connections: connectionsWithSafeCredentials });
    });

    router.delete('/supplier-connections/:id', async (req, res) => {
        const { id } = req.params;

        const connectionIndex = supplierConnections.findIndex(c => c.id == id);
        if (connectionIndex === -1) {
            return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        }

        try {
            const pool = db.getPool();
            await pool.execute('DELETE FROM supplier_connections WHERE id = ?', [id]);
            supplierConnections.splice(connectionIndex, 1);
            res.json({ sucesso: true, mensagem: 'Conexão de fornecedor removida com sucesso.' });
        } catch (e) {
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.post('/supplier-connections/:id/test', async (req, res) => {
        const { id } = req.params;
        const connection = supplierConnections.find(c => c.id == id);

        if (!connection) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        if (connection.type !== 'dismatal_webscraper') return res.status(400).json({ sucesso: false, erro: 'Teste disponível apenas para conexões Dismatal.' });

        try {
            // Instancia o scraper com a configuração necessária
            const scraper = new DismatalScraper({ headless: true });
            const result = await scraper.testConnection(connection);
            res.json(result);
        } catch (e) {
            console.error('[Dismatal API] Erro no teste de conexão:', e.message);
            res.status(500).json({ sucesso: false, erro: e.message });
        }
    });

    router.post('/supplier-connections/:id/products', async (req, res) => {
        const { id } = req.params;
        const { searchTerm } = req.body;
        const connection = supplierConnections.find(c => c.id == id);

        if (!connection) return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
        if (connection.type !== 'dismatal_webscraper') return res.status(400).json({ sucesso: false, erro: 'Busca de produtos disponível apenas para conexões Dismatal.' });

        try {
            const scraper = new DismatalScraper({ headless: true });
            const result = await scraper.fetchProducts(connection, searchTerm);
            res.json(result);
        } catch (e) {
            console.error('[Dismatal Scraper] Erro na rota:', e.message);
            res.status(500).json({ sucesso: false, erro: `Erro durante a busca de produtos: ${e.message}` });
        }
    });

    return router;
};