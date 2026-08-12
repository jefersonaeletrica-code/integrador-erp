require('dotenv').config();

const https = require('https');
const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');

const app = express();
let db; // Será inicializado depois
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Cria uma instância do axios com configurações reutilizáveis
const axiosInstance = axios.create({
    timeout: 30000, // Timeout de 30 segundos
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignora erros de certificado SSL
});

let erpConnections = [];
let supplierConnections = [];
let produtosImportados;

// Constantes para CissPoder baseadas na documentação
const CISSPODER_CLIENT_ID = 'cisspoder-oauth';
const CISSPODER_CLIENT_SECRET = 'poder7547';
const CISSPODER_DEFAULT_IDEMPRESA = 1; // IDEMPRESA padrão para todas as buscas

const saveProdutosImportados = (items) => {
    if (!db || !Array.isArray(items)) {
        console.warn('Tentativa de salvar produtos importados com DB não inicializado ou itens inválidos.');
        return;
    }

    // Remove duplicados com base no 'codigo'
    const uniqueProducts = Array.from(new Map(items.map(product => [product.codigo, product])).values());

    produtosImportados = uniqueProducts;
    db.updateDb({ produtos: uniqueProducts });
    console.log(`Produtos importados salvos. Total de únicos: ${uniqueProducts.length}`);
};

async function refreshAccessToken(connection) {
    if (connection.type !== 'bling' || !connection.credentials.refresh_token) {
        throw new Error('Apenas conexões Bling com refresh token podem ser atualizadas.');
    }
    const { client_id, client_secret, refresh_token } = connection.credentials;
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const response = await axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token', 
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token }), 
        { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Atualiza as credenciais da conexão na memória e no banco
    connection.credentials.access_token = response.data.access_token;
    connection.credentials.refresh_token = response.data.refresh_token;
    await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });
}

const buildBlingProductUrl = (page, searchParams = {}) => {
    const params = new URLSearchParams();
    params.set('pagina', String(page));
    params.set('limite', '100');

    // Adiciona todos os outros parâmetros de busca (criterio, tipo, nome, codigo)
    for (const key in searchParams) {
        if (searchParams[key]) {
            params.set(key, searchParams[key]);
        }
    }

    return `https://api.bling.com.br/Api/v3/produtos?${params.toString()}`;
};


const fetchBlingProductPage = async (connection, page, searchParams = {}) => {
    const url = buildBlingProductUrl(page, searchParams);
    console.log('[BlingURL]', url);

    const response = await axiosInstance.get(url, { headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` } });
    return response.data;
};

const normalizeNameForBling = (name) => {
    const words = (name || '').trim().split(/\s+/);
    const cleanName = words.join(' ');
    return cleanName;
};

const fetchBlingProductsByName = async (connection, name, pagina = 1) => {
    const searchTerm = normalizeNameForBling(name);
    const searchParams = {
        criterio: '5', // Critério para "Contém"
        tipo: 'T', // Tipo para "Termo"
        nome: `%${searchTerm}` // Adiciona o coringa para buscar em qualquer parte do nome
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

const fetchBlingProductsByCode = async (connection, code, pagina = 1) => {
    const searchParams = {
        criterio: '5',
        tipo: 'T&codigo',
        codigo: code
    };
    return fetchBlingProductPage(connection, pagina, searchParams);
};

const fetchAllBlingProductsPaginated = async (connection, pagina = 1) => {
    const searchParams = { criterio: 2 }; // Usa criterio=2 para buscar produtos ativos
    return fetchBlingProductPage(connection, pagina, searchParams);
};

// --- Funções para CissPoder ---

async function refreshCissPoderToken(connection) {
    let { auth_url, username, password } = connection.credentials;

    // Usa o construtor URL para garantir a manipulação correta.
    const urlObject = new URL(auth_url);
    urlObject.pathname = '/cisspoder-auth/oauth/token';
    auth_url = urlObject.toString();
    const response = await axiosInstance.post(auth_url,
        new URLSearchParams({
            grant_type: 'password',
            username,
            password,
            client_id: CISSPODER_CLIENT_ID,
            client_secret: CISSPODER_CLIENT_SECRET
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );

    connection.credentials.access_token = response.data.access_token;
    connection.credentials.token_expires_at = Date.now() + (response.data.expires_in * 1000);
    await db.updateDb({ connection: { id: connection.id, credentials: connection.credentials } });
}

const fetchCissPoderProductPage = async (connection, page, clausulas = []) => {
    // Usa o construtor URL para derivação segura da URL de serviço.
    const authUrlObject = new URL(connection.credentials.auth_url);
    // Voltando a usar o endpoint 'cad_produtos' que temos permissão para acessar.
    authUrlObject.pathname = '/cisspoder-service/cad_produtos';
    const url = authUrlObject.toString();
    console.log('[CissPoderURL]', url);

    const payload = {
        page: page, // Página atual da busca de produtos
        clausulas: [
            ...clausulas
        ],
        ordenacoes: [
            {
                // O campo de nome no endpoint 'cad_produtos' é 'descrcomproduto'
                campo: "descrcomproduto",
                direcao: "ASC" // Corrigido de 'tipo' para 'direcao' conforme o exemplo
            }
        ]
    };
    console.log('[CissPoder Payload]', JSON.stringify(payload, null, 2));

    try {
        const response = await axiosInstance.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${connection.credentials.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('[CissPoder Response]', JSON.stringify(response.data, null, 2));

        const productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        const uniqueProducts = Array.from(new Map(productsArray.map(p => [p.idsubproduto, p])).values());

        const data = uniqueProducts.map(p => ({
            codigo: p.idsubproduto,
            nome: p.descrcomproduto,
            marca: p.descricao // Mapeado para "Descrição do Fabricante"
        }));
        console.log(`[CissPoder] Encontrados ${productsArray.length} registros na API, retornando ${data.length} produtos únicos.`);

        return { data, total: response.data.total, hasNext: response.data.hasNext };
    } catch (error) {
        console.error(`[CissPoder] Falha ao buscar produtos. URL: ${url}`, error.message);
        throw error;
    }
};

const fetchCissPoderProductsByName = async (connection, name, pagina = 1) => {
    // Para uma busca mais flexível, criamos uma cláusula LIKE para cada palavra.
    // Isso permite que "cabo acabamento" encontre "ACABAMENTO ... CABO".
    const searchWords = name.trim().split(/\s+/).filter(Boolean);
    const clausulas = searchWords.map(word => ({
        campo: "descrcomproduto",
        valor: `%${word}%`,
        operadorlogico: "AND",
        operador: "LIKE"
    }));
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchCissPoderProductsByCode = async (connection, code, pagina = 1) => {
    const clausulas = [{ campo: "idsubproduto", valor: code, operadorlogico: "AND", operador: "IGUAL" }];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

const fetchAllCissPoderProducts = async (connection, pagina = 1) => {
    const clausulas = [
        { campo: "flaginativo", valor: "F", operadorlogico: "AND", operador: "IGUAL" }
    ];
    return fetchCissPoderProductPage(connection, pagina, clausulas);
};

async function getBlingConnectionStatus(connection) {
    if (!connection.credentials || !connection.credentials.access_token) {
        return 'requires_auth';
    }

    try {
        // Tenta uma chamada leve na API para validar o token
        // Usando o endpoint /contatos com limite 1, que é uma chamada leve e confiável.
        await axiosInstance.get('https://api.bling.com.br/Api/v3/contatos?limite=1', {
            headers: { 'Authorization': `Bearer ${connection.credentials.access_token}` }
        });
        return 'connected';
    } catch (error) {
        // Se o token estiver expirado (401), tenta renová-lo
        if (error.response && error.response.status === 401) {
            console.log(`Token para a conexão ${connection.id} expirou. Verificando se é possível renovar...`);
            try {
                await refreshAccessToken(connection);
                console.log(`Token para a conexão ${connection.id} renovado com sucesso.`);
                return 'connected';
            } catch (refreshError) {
                const refreshErrorDetails = refreshError.response ? JSON.stringify(refreshError.response.data) : refreshError.message;
                console.error(`Falha ao renovar o token para a conexão ${connection.id}:`, refreshErrorDetails);
                return 'disconnected';
            }
        }
        // Para outros erros, consideramos a conexão com problemas
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Erro ao verificar status da conexão ${connection.id}:`, errorDetails);
        return 'error';
    }
}

async function getCissPoderConnectionStatus(connection) {
    // Força a renovação do token a cada verificação para garantir que ele esteja sempre válido.
    // Isso resolve os erros 401 de forma definitiva.
    console.log(`Tentando obter/renovar token para a conexão CissPoder ${connection.id}...`);
    try {
        await refreshCissPoderToken(connection);
        console.log(`Token para a conexão CissPoder ${connection.id} obtido/renovado com sucesso.`);
        return 'connected';
    } catch (error) {
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`Falha ao obter/renovar token para a conexão CissPoder ${connection.id}:`, errorDetails);
        return 'disconnected';
    }
}

// --- NOVAS ROTAS DE GERENCIAMENTO DE CONEXÕES ---

app.get('/api/erp-connections', async (req, res) => {
    const connectionsWithStatus = await Promise.all(erpConnections.map(async (conn) => {
        let status = 'not_applicable'; // Padrão para tipos não-Bling
        if (conn.type === 'bling') {
            status = await getBlingConnectionStatus(conn);
        } else if (conn.type === 'cisspoder') {
            status = await getCissPoderConnectionStatus(conn);
        }

        // Oculta segredos para a resposta da API
        const safeCreds = { ...conn.credentials };
        // CissPoder
        if (safeCreds.password) safeCreds.password = '******';
        if (safeCreds.username) safeCreds.username = safeCreds.username; // pode manter o user

        // Bling
        if (safeCreds.client_secret) safeCreds.client_secret = '******';
        if (safeCreds.access_token) safeCreds.access_token = safeCreds.access_token.substring(0, 8) + '...';
        if (safeCreds.refresh_token) safeCreds.refresh_token = '******';
        
        return { ...conn, credentials: safeCreds, status };
    }));

    res.json({ sucesso: true, connections: connectionsWithStatus });
});

app.post('/api/erp-connections', async (req, res) => {
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

app.post('/api/supplier-connections', async (req, res) => {
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

app.get('/api/supplier-connections', async (req, res) => {
    const connectionsWithSafeCredentials = supplierConnections.map(conn => {
        const safeCreds = { ...conn.credentials };
        if (safeCreds.password) {
            safeCreds.password = '******';
        }
        return { ...conn, credentials: safeCreds };
    });
    res.json({ sucesso: true, connections: connectionsWithSafeCredentials });
});

app.put('/api/erp-connections/:id', async (req, res) => {
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

        // Mescla as credenciais, mantendo os segredos que não foram alterados
        const newCredentials = { ...connection.credentials, ...credentials };

        const updatedConnection = {
            ...connection,
            name,
            credentials: newCredentials
        };

        await db.updateDb({ connection: { id, name, credentials: newCredentials } });
        erpConnections[connectionIndex] = updatedConnection;

        res.json({ sucesso: true, connection: updatedConnection });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

app.delete('/api/erp-connections/:id', async (req, res) => {
    const { id } = req.params;

    const connectionIndex = erpConnections.findIndex(c => c.id == id);
    if (connectionIndex === -1) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
    }

    try {
        const pool = db.getPool();
        await pool.execute('DELETE FROM erp_connections WHERE id = ?', [id]);

        // Remove from in-memory array
        erpConnections.splice(connectionIndex, 1);

        res.json({ sucesso: true, mensagem: 'Conexão removida com sucesso.' });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

app.delete('/api/supplier-connections/:id', async (req, res) => {
    const { id } = req.params;

    const connectionIndex = supplierConnections.findIndex(c => c.id == id);
    if (connectionIndex === -1) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
    }

    try {
        const pool = db.getPool();
        await pool.execute('DELETE FROM supplier_connections WHERE id = ?', [id]);

        // Remove from in-memory array
        supplierConnections.splice(connectionIndex, 1);

        res.json({ sucesso: true, mensagem: 'Conexão de fornecedor removida com sucesso.' });
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: e.message });
    }
});

app.post('/api/supplier-connections/:id/test', async (req, res) => {
    const { id } = req.params;
    const connection = supplierConnections.find(c => c.id == id);

    if (!connection) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
    }

    if (connection.type !== 'dismatal_webscraper') {
        return res.status(400).json({ sucesso: false, erro: 'Teste disponível apenas para conexões Dismatal.' });
    }

    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Preenche os campos de login
        await page.type('input[name="usuario"]', username);
        await page.type('input[name="senha"]', password);

        // Clica no botão de login e aguarda a navegação
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        // Verifica se o login foi bem-sucedido procurando por um elemento que só existe após o login
        // Por exemplo, um link de "Sair" ou o nome do usuário.
        const successfulLoginIndicator = await page.$('a[href*="sair"]');

        if (successfulLoginIndicator) {
            res.json({ sucesso: true, mensagem: 'Conexão com a Dismatal bem-sucedida!' });
        } else {
            // Se o indicador não for encontrado, verifica se há uma mensagem de erro
            const errorElement = await page.$('.alert-danger'); // Exemplo de seletor de erro
            const errorMessage = errorElement ? await page.evaluate(el => el.textContent, errorElement) : 'Credenciais inválidas ou falha no login.';
            res.status(401).json({ sucesso: false, erro: errorMessage.trim() });
        }
    } catch (e) {
        res.status(500).json({ sucesso: false, erro: `Erro durante o teste de conexão: ${e.message}` });
    } finally {
        if (browser) await browser.close();
    }
});

app.post('/api/supplier-connections/:id/products', async (req, res) => {
    const { id } = req.params;
    const { searchTerm } = req.body; // Recebe o termo de busca do frontend
    const connection = supplierConnections.find(c => c.id == id);

    if (!connection) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão de fornecedor não encontrada.' });
    }

    if (connection.type !== 'dismatal_webscraper') {
        return res.status(400).json({ sucesso: false, erro: 'Busca de produtos disponível apenas para conexões Dismatal.' });
    }

    const { url, username, password } = connection.credentials;
    let browser = null;
    try {
        console.log('[Dismatal Scraper] Iniciando busca de produtos...');
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        // --- 1. Login ---
        console.log('[Dismatal Scraper] Acessando a página de login...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.type('input[name="usuario"]', username);
        await page.type('input[name="senha"]', password);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        const successfulLoginIndicator = await page.$('a[href*="sair"]');
        if (!successfulLoginIndicator) {
            return res.status(401).json({ sucesso: false, erro: 'Falha no login. Verifique as credenciais.' });
        }
        console.log('[Dismatal Scraper] Login bem-sucedido.');

        // --- 2. Navegação e Extração (Exemplo) ---
        if (searchTerm && searchTerm.trim() !== '') {
            console.log(`[Dismatal Scraper] Buscando por: "${searchTerm}"`);
            // IMPORTANTE: Substitua 'input[name="descricao"]' pelo seletor real do campo de busca no portal.
            await page.type('input[name="descricao"]', searchTerm);

            // IMPORTANTE: Adapte a forma como a busca é submetida.
            // Opção 1: Clicar em um botão de busca.
            // await page.click('#botao-buscar');

            // Opção 2: Pressionar Enter (mais comum).
            await page.keyboard.press('Enter');

            // Aguarda a navegação ou a atualização da página com os resultados.
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }
        console.log('[Dismatal Scraper] Extraindo dados dos produtos...');

        const produtos = await page.evaluate(() => {
            const items = [];
            // IMPORTANTE: Substitua '.product-item' pelo seletor correto que engloba cada produto na lista.
            document.querySelectorAll('.product-item').forEach(el => {
                // IMPORTANTE: Substitua os seletores abaixo pelos seletores corretos para cada campo.
                const nome = el.querySelector('.product-name')?.innerText;
                const codigo = el.querySelector('.product-sku')?.innerText;
                const preco = el.querySelector('.product-price')?.innerText;

                if (nome && codigo) {
                    items.push({
                        nome: nome.trim(),
                        codigo: codigo.trim(),
                        preco: preco ? preco.trim() : 'N/A'
                    });
                }
            });
            return items;
        });

        console.log(`[Dismatal Scraper] ${produtos.length} produtos encontrados.`);
        res.json({ sucesso: true, produtos });

    } catch (e) {
        console.error('[Dismatal Scraper] Erro:', e.message);
        res.status(500).json({ sucesso: false, erro: `Erro durante a busca de produtos: ${e.message}` });
    } finally {
        if (browser) await browser.close();
    }
});

// OAuth Bling
app.get('/api/auth/:connectionId/bling', (req, res) => {
    const { connectionId } = req.params;
    const connection = erpConnections.find(c => c.id == connectionId);

    if (!connection || connection.type !== 'bling') {
        return res.status(404).json({ sucesso: false, erro: 'Conexão Bling não encontrada.' });
    }

    const { client_id, redirect_uri } = connection.credentials;
    const state = `connId=${connectionId}`; // Passa o ID da conexão no state
    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;
    res.json({ sucesso: true, url: authUrl });
});

app.get('/callback', async (req, res) => {
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
        const response = await axiosInstance.post('https://www.bling.com.br/Api/v3/oauth/token', 
            new URLSearchParams({ grant_type: 'authorization_code', code }), 
            { headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        // Atualiza as credenciais da conexão
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

// Rota de produtos
app.get('/api/produtos/:connectionId', async (req, res) => {
    const { connectionId } = req.params;
    const connection = erpConnections.find(c => c.id == connectionId);

    if (!connection) {
        return res.status(404).json({ sucesso: false, erro: 'Conexão não encontrada.' });
    }

    try {
        if (connection.type === 'bling') {
            await getBlingConnectionStatus(connection); // Garante que o token está válido
        } else if (connection.type === 'cisspoder') {
            await getCissPoderConnectionStatus(connection); // Garante que o token está válido
        } 

        const requestedPage = parseInt(req.query.pagina || req.query.page || '1', 10);
        const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

        const { nome, codigo, tipo } = req.query;
        let responseData;

        if (connection.type === 'bling') {
            if (typeof nome === 'string' && nome.trim()) {
                responseData = await fetchBlingProductsByName(connection, nome.trim(), page);
            } else if (typeof codigo === 'string' && codigo.trim()) {
                responseData = await fetchBlingProductsByCode(connection, codigo.trim(), page);
            } else {
                responseData = await fetchAllBlingProductsPaginated(connection, page);
            }
        } else if (connection.type === 'cisspoder') {
            const uniqueProductsMap = new Map();
            let totalFromApi = 0;
            let currentPage = page;
            let hasNext = true;
            let fetchFunction;

            if (typeof nome === 'string' && nome.trim()) {
                fetchFunction = (p) => fetchCissPoderProductsByName(connection, nome.trim(), p);
            } else if (typeof codigo === 'string' && codigo.trim()) {
                fetchFunction = (p) => fetchCissPoderProductsByCode(connection, codigo.trim(), p);
            } else {
                fetchFunction = (p) => fetchAllCissPoderProducts(connection, p);
            }

            // Lógica de paginação unificada para todas as buscas CissPoder
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

        // Normaliza a resposta do Bling para o formato padrão, extraindo a marca.
        if (connection.type === 'bling') {
            produtos = produtos.map(p => ({
                codigo: p.codigo,
                nome: p.nome,
                preco: p.preco || 0 // Para Bling, retornamos o preço
            }));
        }

        // Bling usa meta.total, CissPoder usa total. Normalizamos aqui.
        const total = responseData?.total ?? responseData?.meta?.total; 

        res.json({ sucesso: true, produtos, pagina: page, total });
    } catch (e) {
        // O erro já foi logado dentro da função de fetch, aqui apenas retornamos o 500.
        let errorMessage = e.message;
        if (e.code === 'ECONNABORTED') {
            errorMessage = 'A requisição para o ERP demorou demais e foi cancelada (timeout).';
        } else if (e.response) {
            errorMessage = `O ERP retornou um erro ${e.response.status}.`;
        }
        res.status(500).json({ sucesso: false, erro: errorMessage }); }
});

app.get('/api/produtos-importados', (req, res) => {
    res.json({ sucesso: true, produtos: produtosImportados });
});

app.post('/api/produtos-importados', (req, res) => {
    // A lista enviada pelo frontend agora é a fonte da verdade.
    const produtosParaSalvar = Array.isArray(req.body.produtos) ? req.body.produtos : [];
    saveProdutosImportados(produtosParaSalvar);
    res.json({ sucesso: true, mensagem: 'Produtos importados salvos com sucesso!' });
});

const startServer = async () => {
    try {
        console.log('Verificando variáveis de ambiente para conexão com DB...');
        // O log de variáveis já está dentro do db.mysql.js, não precisa mais aqui.
        console.log('----------------------------------------------------');

        db = require('./db'); // Carrega o driver de DB
        
        // A primeira chamada a uma função do DB (como readDb) vai disparar e aguardar a inicialização.
        const currentDb = await db.readDb(); // readDb pode ser assíncrono

        // Carrega as conexões e produtos na memória
        erpConnections = Array.isArray(currentDb.connections) ? currentDb.connections : [];
        supplierConnections = Array.isArray(currentDb.supplierConnections) ? currentDb.supplierConnections : [];
        produtosImportados = Array.isArray(currentDb.produtos) ? currentDb.produtos : [];

        console.log(`${erpConnections.length} conexões ERP carregadas.`);
        console.log(`${supplierConnections.length} conexões de fornecedores carregadas.`);
        console.log(`${produtosImportados.length} produtos importados carregados.`);

        app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
    } catch (error) {
        console.error("Falha ao inicializar o servidor:", error);
        process.exit(1);
    }
};

startServer();