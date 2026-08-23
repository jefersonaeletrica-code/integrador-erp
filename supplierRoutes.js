import express from 'express';
import { DismatalScraper } from './dismatal.scraper.js';
import { getLogger } from './logger.js';
import { addToQueue } from './scraperQueue.js';
import path from 'path';

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

    router.post('/supplier-connections/:id/authenticate', async (req, res) => {
        const { id } = req.params;
        const connection = supplierConnections.find(c => c.id == id);

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
        const connection = supplierConnections.find(c => c.id == id);

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
        const connection = supplierConnections.find(c => c.id == id);

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