import mysql from 'mysql2/promise';

// Estrutura de dados padrão para consistência
// Removido, pois a nova estrutura é mais dinâmica.
export const DEFAULT_DB = {
  produtos: []
};
let pool;
let initializationPromise = null;

export const getPool = () => {
  if (!pool) {
    // Suporte para ambos os padrões de variáveis de ambiente (MYSQL_ e DB_)
    const HOST = process.env.MYSQL_HOST || process.env.DB_HOST;
    const USER = process.env.MYSQL_USER || process.env.DB_USER;
    const PASSWORD = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
    const DATABASE = process.env.MYSQL_DATABASE || process.env.DB_NAME;
    const PORT = process.env.MYSQL_PORT || process.env.DB_PORT;
    const SOCKET_PATH = process.env.MYSQL_SOCKET_PATH;
    if (!HOST || !USER || !PASSWORD || !DATABASE) {
      throw new Error('As variáveis de ambiente para conexão com o banco de dados (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) não estão configuradas.');
    }
    try {
      const connectionConfig = {
        host: HOST,
        user: USER,
        password: PASSWORD,
        database: DATABASE,
        port: PORT ? parseInt(PORT, 10) : 3306, // Usa a porta definida ou a padrão 3306
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: { rejectUnauthorized: false }
      };
      if (SOCKET_PATH) {
        connectionConfig.socketPath = SOCKET_PATH;
      }
      pool = mysql.createPool(connectionConfig);
      console.log('Pool de conexões MySQL criado com sucesso!');
    } catch (error) {
      console.error('Falha ao criar o pool de conexões MySQL. Verifique as variáveis de ambiente.', error);
      throw error; // Lança o erro para parar a inicialização do app
    }
  }
  return pool;
};

export const initializeDatabase = async () => {
  const connection = await getPool().getConnection(); // Pega uma conexão do pool
  try {
    console.log('Verificando e inicializando o banco de dados MySQL...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS erp_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'bling' ou 'cisspoder'
        credentials JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS supplier_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'dismatal_webscraper', etc.
        credentials JSON NOT NULL,
        session_data JSON DEFAULT NULL, -- Armazena cookies, localStorage, etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Garante que a coluna 'cookies' exista na tabela supplier_connections
    // Isso é necessário para ambientes onde a tabela já foi criada sem essa coluna.
    try {
      await connection.query(`
        ALTER TABLE supplier_connections CHANGE COLUMN cookies session_data JSON DEFAULT NULL;
      `);
      console.log("Coluna 'cookies' renomeada para 'session_data' na tabela 'supplier_connections'.");
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        // A coluna 'session_data' já existe, o que é esperado. Ignora o erro.
      } else if (error.code === 'ER_BAD_FIELD_ERROR') {
        // A coluna 'cookies' não existe, o que significa que a renomeação já foi feita. Ignora o erro.
        console.log("Coluna 'cookies' não encontrada, migração para 'session_data' provavelmente já concluída.");
      } else {
        throw error; // Lança outros erros inesperados.
      }
    }

    await connection.query(`
        CREATE TABLE IF NOT EXISTS produtos_importados (
          id INT NOT NULL AUTO_INCREMENT,
          codigo VARCHAR(100) NOT NULL,
          nome VARCHAR(255) DEFAULT NULL,
          preco DECIMAL(10,2) DEFAULT '0.00',
          PRIMARY KEY (id),
          UNIQUE KEY codigo (codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS marketplace_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'mercadolivre',
        credentials JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS mercado_livre_anuncios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        connection_id INT NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        sku VARCHAR(100) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        available_quantity INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        listing_type_id VARCHAR(50) DEFAULT 'gold_special',
        permalink VARCHAR(500) DEFAULT NULL,
        thumbnail VARCHAR(500) DEFAULT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        clip_id VARCHAR(100) DEFAULT NULL,
        clip_status VARCHAR(50) DEFAULT NULL,
        clip_details JSON DEFAULT NULL,
        catalog_listing BOOLEAN DEFAULT FALSE,
        catalog_product_id VARCHAR(100) DEFAULT NULL,
        catalog_status VARCHAR(50) DEFAULT NULL,
        catalog_price_to_win DECIMAL(10,2) DEFAULT NULL,
        catalog_details JSON DEFAULT NULL,
        sale_fee_amount DECIMAL(10,2) DEFAULT NULL,
        shipping_cost DECIMAL(10,2) DEFAULT NULL,
        net_amount DECIMAL(10,2) DEFAULT NULL,
        fee_details JSON DEFAULT NULL,
        category_id VARCHAR(50) DEFAULT NULL,
        category_name VARCHAR(255) DEFAULT NULL,
        source_type VARCHAR(50) DEFAULT NULL,
        source_id VARCHAR(100) DEFAULT NULL,
        source_data JSON DEFAULT NULL,
        sync_auto_stock BOOLEAN DEFAULT FALSE,
        sync_auto_price BOOLEAN DEFAULT FALSE,
        markup_percent DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY mlb_item (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migração de colunas para tabela mercado_livre_anuncios existente
    const addColumnIfNotExists = async (table, columnDef, colName) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
        console.log(`Coluna '${colName}' adicionada à tabela '${table}'.`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          // Coluna já existe
        } else {
          console.warn(`Aviso ao verificar coluna '${colName}' em '${table}':`, err.message);
        }
      }
    };

    await addColumnIfNotExists('mercado_livre_anuncios', 'video_url VARCHAR(500) DEFAULT NULL', 'video_url');
    await addColumnIfNotExists('mercado_livre_anuncios', 'clip_id VARCHAR(100) DEFAULT NULL', 'clip_id');
    await addColumnIfNotExists('mercado_livre_anuncios', 'clip_status VARCHAR(50) DEFAULT NULL', 'clip_status');
    await addColumnIfNotExists('mercado_livre_anuncios', 'clip_details JSON DEFAULT NULL', 'clip_details');
    await addColumnIfNotExists('mercado_livre_anuncios', 'catalog_listing BOOLEAN DEFAULT FALSE', 'catalog_listing');
    await addColumnIfNotExists('mercado_livre_anuncios', 'catalog_product_id VARCHAR(100) DEFAULT NULL', 'catalog_product_id');
    await addColumnIfNotExists('mercado_livre_anuncios', 'catalog_status VARCHAR(50) DEFAULT NULL', 'catalog_status');
    await addColumnIfNotExists('mercado_livre_anuncios', 'catalog_price_to_win DECIMAL(10,2) DEFAULT NULL', 'catalog_price_to_win');
    await addColumnIfNotExists('mercado_livre_anuncios', 'catalog_details JSON DEFAULT NULL', 'catalog_details');
    await addColumnIfNotExists('mercado_livre_anuncios', 'sale_fee_amount DECIMAL(10,2) DEFAULT NULL', 'sale_fee_amount');
    await addColumnIfNotExists('mercado_livre_anuncios', 'shipping_cost DECIMAL(10,2) DEFAULT NULL', 'shipping_cost');
    await addColumnIfNotExists('mercado_livre_anuncios', 'net_amount DECIMAL(10,2) DEFAULT NULL', 'net_amount');
    await addColumnIfNotExists('mercado_livre_anuncios', 'fee_details JSON DEFAULT NULL', 'fee_details');

    // --- TABELAS DO MÓDULO DE INTELIGÊNCIA ARTIFICIAL (GEMINI AGENTS) ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gemini_api_key VARCHAR(255) DEFAULT NULL,
        default_model VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
        temperature DECIMAL(3,2) NOT NULL DEFAULT 0.20,
        max_output_tokens INT NOT NULL DEFAULT 4096,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insere registro inicial de ai_settings se vazio
    const [aiSettingRows] = await connection.query('SELECT id FROM ai_settings LIMIT 1');
    if (aiSettingRows.length === 0) {
      await connection.query(`
        INSERT INTO ai_settings (gemini_api_key, default_model, temperature, max_output_tokens, is_active)
        VALUES (NULL, 'gemini-1.5-flash', 0.20, 4096, TRUE)
      `);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        avatar_icon VARCHAR(50) NOT NULL DEFAULT 'fa-robot',
        avatar_color VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
        role_title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        system_prompt LONGTEXT NOT NULL,
        model VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
        allowed_tools JSON NOT NULL,
        require_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'Nova Análise',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_agent_id (agent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system', 'tool'
        content LONGTEXT DEFAULT NULL,
        tool_calls JSON DEFAULT NULL,
        tool_results JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_action_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT DEFAULT NULL,
        conversation_id INT DEFAULT NULL,
        tool_name VARCHAR(100) NOT NULL,
        tool_args JSON DEFAULT NULL,
        tool_result JSON DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'executed', -- 'executed', 'pending_approval', 'approved', 'rejected', 'failed'
        executed_by VARCHAR(50) NOT NULL DEFAULT 'gemini_agent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agent_action (agent_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migração automática de modelos antigos/inválidos para gemini-1.5-flash
    await connection.query("UPDATE ai_settings SET default_model = 'gemini-1.5-flash' WHERE default_model = 'gemini-2.5-flash'");
    await connection.query("UPDATE ai_agents SET model = 'gemini-1.5-flash' WHERE model = 'gemini-2.5-flash'");

    // Semeia agentes padrão caso a tabela esteja vazia
    const [agentRows] = await connection.query('SELECT id FROM ai_agents LIMIT 1');
    if (agentRows.length === 0) {
      const defaultAgents = [
        {
          name: 'Auditor de Rentabilidade & Taxas',
          slug: 'auditor-taxas',
          avatar_icon: 'fa-calculator',
          avatar_color: '#10b981',
          role_title: 'Especialista em Custos, Taxas ML e Margem Líquida',
          description: 'Audita anúncios do Mercado Livre, identifica produtos com margem de lucro baixa ou negativa após comissões e frete, e calcula o preço ideal de venda.',
          system_prompt: `Você é o Auditor de Rentabilidade e Taxas do Integrador ERP. Sua missão é proteger a margem de lucro do vendedor no Mercado Livre.
Regras de atuação:
1. Ao analisar anúncios, sempre consulte as taxas reais, frete e custos operacionais (usando as ferramentas disponíveis).
2. Lembre-se que para o Mercado Livre Brasil (MLB):
   - Produtos abaixo de R$ 79,00 pagam taxa fixa unitária escalonada (R$ 6,00 a R$ 6,75) além da comissão percentual da categoria (10% a 19%).
   - Produtos a partir de R$ 79,00 têm frete grátis obrigatório pago pelo vendedor, mas são isentos de taxa fixa.
3. Se a margem líquida calculada for inferior a 15% ou negativa, alerte o vendedor imediatamente e sugira o preço de venda ideal.
4. Antes de alterar qualquer preço de produto em massa, apresente o resumo das alterações propostas e peça confirmação.
5. Sempre forneça respostas estruturadas com tabelas claras, percentuais de margem e valores em Reais (R$).`,
          model: 'gemini-1.5-flash',
          allowed_tools: JSON.stringify(['buscar_anuncios_ml', 'simular_taxas_e_margem', 'obter_detalhes_anuncio_ml', 'atualizar_preco_anuncio_ml', 'consultar_estoque_fornecedor', 'resumo_geral_loja']),
          require_confirmation: 1
        },
        {
          name: 'Estrategista de Buy Box & Catálogo',
          slug: 'estrategista-buybox',
          avatar_icon: 'fa-trophy',
          avatar_color: '#f59e0b',
          role_title: 'Especialista em Concorrência de Catálogo e Disputa de Buy Box',
          description: 'Monitora anúncios de catálogo que perderam a Buy Box, analisa o preço do concorrente vencedor (price_to_win) e calcula a reprecificação ideal respeitando a margem mínima.',
          system_prompt: `Você é o Estrategista de Buy Box e Catálogo do Integrador ERP. Sua missão é maximizar as vitórias de Buy Box no Mercado Livre com rentabilidade.
Regras de atuação:
1. Identifique anúncios de catálogo com status 'losing' ou 'share'.
2. Compare o preço atual com o 'price_to_win' (preço para ganhar).
3. Antes de sugerir baixar o preço para vencer a Buy Box, simule a nova margem líquida com a ferramenta 'simular_taxas_e_margem' para garantir que não haverá prejuízo.
4. Se o preço para ganhar inviabilizar o lucro mínimo da loja (ex: margem < 10%), recomende pausar a disputa ou manter o preço atual.
5. Apresente propostas de reprecificação claras com a margem antes vs depois da alteração.`,
          model: 'gemini-3.6-flash',
          allowed_tools: JSON.stringify(['buscar_anuncios_ml', 'analisar_oportunidades_buybox', 'simular_taxas_e_margem', 'atualizar_preco_anuncio_ml', 'consultar_estoque_fornecedor']),
          require_confirmation: 1
        },
        {
          name: 'Otimizador de Anúncios & SEO',
          slug: 'otimizador-seo',
          avatar_icon: 'fa-wand-magic-sparkles',
          avatar_color: '#8b5cf6',
          role_title: 'Especialista em Copywriting, SEO e Relevância no Mercado Livre',
          description: 'Audita títulos, descrições e atributos dos anúncios para aumentar relevância nas buscas do Mercado Livre e melhorar a taxa de conversão.',
          system_prompt: `Você é o Otimizador de Anúncios e Especialista em SEO para Mercado Livre.
Regras de atuação:
1. O título no Mercado Livre tem limite estrito de 60 caracteres. Ele deve conter: [Produto] + [Marca] + [Modelo] + [Principal Característica/Compatibilidade]. Evite termos proibidos como 'Frete Grátis', 'Promoção', 'Melhor Preço', 'Novo'.
2. A descrição deve ser em texto puro (plain text), bem estruturada com tópicos claros (Benefícios, Especificações Técnicas, Compatibilidade, Conteúdo da Embalagem e Garantia).
3. Consulte os detalhes do anúncio atual antes de propor alterações.
4. Apresente o título antigo vs o novo título otimizado (com contador de caracteres) e a nova descrição sugerida.`,
          model: 'gemini-3.6-flash',
          allowed_tools: JSON.stringify(['buscar_anuncios_ml', 'obter_detalhes_anuncio_ml', 'otimizar_titulo_descricao_ml']),
          require_confirmation: 1
        },
        {
          name: 'Guardião de Estoque & Fornecedores',
          slug: 'guardiao-estoque',
          avatar_icon: 'fa-shield-halved',
          avatar_color: '#3b82f6',
          role_title: 'Auditoria de Estoque, Preço de Custo e Sincronização',
          description: 'Cruza os anúncios ativos do Mercado Livre com a base de produtos do fornecedor (Dismatal/Bling/CissPoder), prevenindo vendas sem estoque e identificando divergências de custo.',
          system_prompt: `Você é o Guardião de Estoque e Fornecedores do Integrador ERP. Sua missão é garantir a integridade entre o estoque do fornecedor/ERP e os anúncios no Mercado Livre.
Regras de atuação:
1. Localize discrepâncias entre estoque do fornecedor e quantidade anunciada no Mercado Livre.
2. Identifique produtos cujo preço de custo aumentou no fornecedor mas o preço de venda no ML permaneceu inalterado, erodindo a margem.
3. Se um produto estiver esgotado no fornecedor, recomende imediatamente zerar o estoque no Mercado Livre para evitar cancelamentos e penalizações na reputação.
4. Apresente relatórios diretos e acionáveis.`,
          model: 'gemini-3.6-flash',
          allowed_tools: JSON.stringify(['buscar_anuncios_ml', 'consultar_estoque_fornecedor', 'atualizar_estoque_anuncio_ml', 'atualizar_preco_anuncio_ml', 'resumo_geral_loja']),
          require_confirmation: 1
        }
      ];

      for (const agent of defaultAgents) {
        await connection.query(`
          INSERT INTO ai_agents (name, slug, avatar_icon, avatar_color, role_title, description, system_prompt, model, allowed_tools, require_confirmation, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          agent.name,
          agent.slug,
          agent.avatar_icon,
          agent.avatar_color,
          agent.role_title,
          agent.description,
          agent.system_prompt,
          agent.model,
          agent.allowed_tools,
          agent.require_confirmation,
          1
        ]);
      }
      console.log('4 Agentes de IA padrão criados com sucesso!');
    }

    // Migração automática para atualizar modelos legados e descontinuados para 'gemini-3.6-flash'
    await connection.query(`UPDATE ai_agents SET model = 'gemini-3.6-flash' WHERE model LIKE '%1.5%' OR model LIKE '%2.0%' OR model IS NULL OR model = ''`);
    await connection.query(`UPDATE ai_settings SET default_model = 'gemini-3.6-flash' WHERE default_model LIKE '%1.5%' OR default_model LIKE '%2.0%' OR default_model IS NULL OR default_model = ''`);

    // Garante que todos os agentes tenham acesso às novas ferramentas de vendas e APIs do Mercado Livre
    const allToolsJson = JSON.stringify([
      'buscar_anuncios_ml', 'obter_detalhes_anuncio_ml', 'simular_taxas_e_margem',
      'atualizar_preco_anuncio_ml', 'atualizar_estoque_anuncio_ml', 'otimizar_titulo_descricao_ml',
      'consultar_estoque_fornecedor', 'analisar_oportunidades_buybox', 'resumo_geral_loja',
      'consultar_mapa_capacidades_ml', 'consultar_vendas_e_pedidos_ml', 'consultar_reputacao_e_metricas_ml',
      'consultar_promocoes_e_campanhas_ml', 'consultar_publicidade_ads_ml', 'consultar_perguntas_e_atendimento_ml',
      'consultar_saude_e_visitas_anuncio_ml', 'consultar_outro_agente'
    ]);
    await connection.query('UPDATE ai_agents SET allowed_tools = ? WHERE allowed_tools IS NULL OR allowed_tools = "" OR allowed_tools NOT LIKE "%consultar_vendas_e_pedidos_ml%"', [allToolsJson]);

    console.log('Banco de dados MySQL pronto.');
  } finally {
    connection.release();
  }
};

// Função que garante que a inicialização ocorra apenas uma vez.
export const ensureInitialized = () => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  return initializationPromise;
};

// Helper para parsear JSON de forma segura, evitando que a aplicação quebre ou fique com strings aninhadas.
export const safeJsonParse = (data) => {
    if (data === null || data === undefined) return null;
    let result = data;
    while (typeof result === 'string') {
        try {
            const parsed = JSON.parse(result);
            if (typeof parsed === 'object' && parsed !== null) {
                result = parsed;
            } else if (typeof parsed === 'string') {
                result = parsed;
            } else {
                break;
            }
        } catch {
            break;
        }
    }
    return result;
};

export const readDb = async () => {
  await ensureInitialized(); // Garante que a inicialização terminou
  const connection = await getPool().getConnection();
  try {
    const [connections] = await connection.query('SELECT * FROM erp_connections');
    const [supplierConnections] = await connection.query('SELECT * FROM supplier_connections');
    // Lê os produtos
    const [produtos] = await connection.query('SELECT * FROM produtos_importados');

    return {
      connections: connections.map(c => ({...c, credentials: safeJsonParse(c.credentials) })),
      supplierConnections: supplierConnections.map(c => ({
        ...c, 
        credentials: safeJsonParse(c.credentials),
        // Garante que os dados da sessão também sejam parseados do JSON.
        // O campo no DB é 'session_data', mas o app usa 'cookies' internamente.
        cookies: safeJsonParse(c.session_data)
      })),
      produtos: produtos.map(p => ({ ...p, preco: parseFloat(p.preco) })) // Garante que o preço seja número
    };
  } catch (error) {
    console.error('Erro ao ler do banco de dados MySQL:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateSupplierConnection = async (connection) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { id, name, credentials, cookies: sessionData } = connection; // Renomeado para clareza
    const credObj = safeJsonParse(credentials) || {};
    await conn.execute(
      'UPDATE supplier_connections SET name = ?, credentials = ?, session_data = ? WHERE id = ?',
      [
        name,
        JSON.stringify(credObj),
        sessionData ? (typeof sessionData === 'string' ? sessionData : JSON.stringify(sessionData)) : null,
        id
      ]
    );
  } catch (error) {
    console.error(`Erro ao atualizar a conexão de fornecedor (ID: ${connection.id}) no MySQL:`, error);
    throw error;
  } finally {
    conn.release();
  }
};

export const updateErpConnection = async (connection) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { id, name, type, credentials } = connection;
    const credObj = safeJsonParse(credentials) || {};
    await conn.execute(
      'UPDATE erp_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
      [
        name,
        type,
        JSON.stringify(credObj),
        id
      ]
    );
  } catch (error) {
    console.error(`Erro ao atualizar a conexão ERP (ID: ${connection.id}) no MySQL:`, error);
    throw error;
  } finally {
    conn.release();
  }
};

export const updateDb = async (data) => {
  await ensureInitialized();
  const connection = await getPool().getConnection();
  try {
    // 1. Atualizar conexões de ERP
    if (data.connections && Array.isArray(data.connections)) {
      for (const conn of data.connections) {
        const credObj = safeJsonParse(conn.credentials) || {};
        await connection.execute(
          'UPDATE erp_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
          [conn.name, conn.type, JSON.stringify(credObj), conn.id]
        );
      }
    }

    // 2. Atualizar conexões de Fornecedor
    if (data.supplierConnections && Array.isArray(data.supplierConnections)) {
      for (const conn of data.supplierConnections) {
        const credObj = safeJsonParse(conn.credentials) || {};
        await connection.execute(
          'UPDATE supplier_connections SET name = ?, credentials = ?, session_data = ? WHERE id = ?',
          [
            conn.name,
            JSON.stringify(credObj),
            conn.cookies ? JSON.stringify(conn.cookies) : null,
            conn.id
          ]
        );
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar o banco de dados MySQL:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const updateMarketplaceConnection = async (connection) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { id, name, type = 'mercadolivre', credentials } = connection;
    const credObj = safeJsonParse(credentials) || {};
    await conn.execute(
      'UPDATE marketplace_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
      [
        name,
        type,
        JSON.stringify(credObj),
        id
      ]
    );
  } catch (error) {
    console.error(`Erro ao atualizar a conexão de marketplace (ID: ${connection.id}) no MySQL:`, error);
    throw error;
  } finally {
    conn.release();
  }
};

export const saveOrUpdateMercadoLivreAnuncio = async (anuncio) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const {
      connection_id,
      item_id,
      sku = null,
      title,
      price,
      available_quantity = 0,
      status = 'active',
      listing_type_id = 'gold_special',
      permalink = null,
      thumbnail = null,
      video_url = null,
      clip_id = null,
      clip_status = null,
      clip_details = null,
      catalog_listing = false,
      catalog_product_id = null,
      catalog_status = null,
      catalog_price_to_win = null,
      catalog_details = null,
      sale_fee_amount = null,
      shipping_cost = null,
      net_amount = null,
      fee_details = null,
      category_id = null,
      category_name = null,
      source_type = null,
      source_id = null,
      source_data = null,
      sync_auto_stock = false,
      sync_auto_price = false,
      markup_percent = 0.00
    } = anuncio;

    await conn.execute(`
      INSERT INTO mercado_livre_anuncios 
        (connection_id, item_id, sku, title, price, available_quantity, status, listing_type_id, permalink, thumbnail, video_url, clip_id, clip_status, clip_details, catalog_listing, catalog_product_id, catalog_status, catalog_price_to_win, catalog_details, sale_fee_amount, shipping_cost, net_amount, fee_details, category_id, category_name, source_type, source_id, source_data, sync_auto_stock, sync_auto_price, markup_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        connection_id = VALUES(connection_id),
        sku = VALUES(sku),
        title = VALUES(title),
        price = VALUES(price),
        available_quantity = VALUES(available_quantity),
        status = VALUES(status),
        listing_type_id = VALUES(listing_type_id),
        permalink = VALUES(permalink),
        thumbnail = VALUES(thumbnail),
        video_url = VALUES(video_url),
        clip_id = VALUES(clip_id),
        clip_status = VALUES(clip_status),
        clip_details = VALUES(clip_details),
        catalog_listing = VALUES(catalog_listing),
        catalog_product_id = VALUES(catalog_product_id),
        catalog_status = VALUES(catalog_status),
        catalog_price_to_win = VALUES(catalog_price_to_win),
        catalog_details = VALUES(catalog_details),
        sale_fee_amount = VALUES(sale_fee_amount),
        shipping_cost = VALUES(shipping_cost),
        net_amount = VALUES(net_amount),
        fee_details = VALUES(fee_details),
        category_id = VALUES(category_id),
        category_name = VALUES(category_name),
        source_type = VALUES(source_type),
        source_id = VALUES(source_id),
        source_data = VALUES(source_data),
        sync_auto_stock = VALUES(sync_auto_stock),
        sync_auto_price = VALUES(sync_auto_price),
        markup_percent = VALUES(markup_percent),
        updated_at = CURRENT_TIMESTAMP
    `, [
      connection_id,
      item_id,
      sku,
      title,
      price,
      available_quantity,
      status,
      listing_type_id,
      permalink,
      thumbnail,
      video_url,
      clip_id,
      clip_status,
      clip_details ? (typeof clip_details === 'string' ? clip_details : JSON.stringify(clip_details)) : null,
      catalog_listing ? 1 : 0,
      catalog_product_id,
      catalog_status,
      catalog_price_to_win !== null && catalog_price_to_win !== undefined ? parseFloat(catalog_price_to_win) : null,
      catalog_details ? (typeof catalog_details === 'string' ? catalog_details : JSON.stringify(catalog_details)) : null,
      sale_fee_amount !== null && sale_fee_amount !== undefined ? parseFloat(sale_fee_amount) : null,
      shipping_cost !== null && shipping_cost !== undefined ? parseFloat(shipping_cost) : null,
      net_amount !== null && net_amount !== undefined ? parseFloat(net_amount) : null,
      fee_details ? (typeof fee_details === 'string' ? fee_details : JSON.stringify(fee_details)) : null,
      category_id,
      category_name,
      source_type,
      source_id,
      source_data ? (typeof source_data === 'string' ? source_data : JSON.stringify(source_data)) : null,
      sync_auto_stock ? 1 : 0,
      sync_auto_price ? 1 : 0,
      markup_percent
    ]);
  } catch (error) {
    console.error(`Erro ao salvar/atualizar anúncio do Mercado Livre (${anuncio.item_id}) no MySQL:`, error);
    throw error;
  } finally {
    conn.release();
  }
};

// ==========================================
// FUNÇÕES DE BANCO DE DADOS - MÓDULO IA GEMINI
// ==========================================

export const getAISettings = async () => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM ai_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return {
        gemini_api_key: null,
        default_model: 'gemini-3.6-flash',
        temperature: 0.20,
        max_output_tokens: 4096,
        is_active: true
      };
    }
    return {
      ...rows[0],
      temperature: parseFloat(rows[0].temperature || 0.2),
      is_active: !!rows[0].is_active
    };
  } finally {
    conn.release();
  }
};

export const saveAISettings = async (settings) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { gemini_api_key, default_model, temperature, max_output_tokens, is_active } = settings;
    const [existing] = await conn.query('SELECT id FROM ai_settings LIMIT 1');
    if (existing.length > 0) {
      await conn.execute(`
        UPDATE ai_settings 
        SET gemini_api_key = ?, default_model = ?, temperature = ?, max_output_tokens = ?, is_active = ?
        WHERE id = ?
      `, [
        gemini_api_key || null,
        default_model || 'gemini-3.6-flash',
        temperature !== undefined ? parseFloat(temperature) : 0.20,
        max_output_tokens !== undefined ? parseInt(max_output_tokens, 10) : 4096,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        existing[0].id
      ]);
      return { id: existing[0].id, ...settings };
    } else {
      const [result] = await conn.execute(`
        INSERT INTO ai_settings (gemini_api_key, default_model, temperature, max_output_tokens, is_active)
        VALUES (?, ?, ?, ?, ?)
      `, [
        gemini_api_key || null,
        default_model || 'gemini-3.6-flash',
        temperature !== undefined ? parseFloat(temperature) : 0.20,
        max_output_tokens !== undefined ? parseInt(max_output_tokens, 10) : 4096,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]);
      return { id: result.insertId, ...settings };
    }
  } finally {
    conn.release();
  }
};

export const getAIAgents = async () => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM ai_agents ORDER BY id ASC');
    return rows.map(a => ({
      ...a,
      allowed_tools: safeJsonParse(a.allowed_tools) || [],
      require_confirmation: !!a.require_confirmation,
      is_active: !!a.is_active
    }));
  } finally {
    conn.release();
  }
};

export const getAIAgentBySlug = async (slug) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute('SELECT * FROM ai_agents WHERE slug = ? LIMIT 1', [slug]);
    if (rows.length === 0) return null;
    const a = rows[0];
    return {
      ...a,
      allowed_tools: safeJsonParse(a.allowed_tools) || [],
      require_confirmation: !!a.require_confirmation,
      is_active: !!a.is_active
    };
  } finally {
    conn.release();
  }
};

export const getAIAgentById = async (id) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute('SELECT * FROM ai_agents WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const a = rows[0];
    return {
      ...a,
      allowed_tools: safeJsonParse(a.allowed_tools) || [],
      require_confirmation: !!a.require_confirmation,
      is_active: !!a.is_active
    };
  } finally {
    conn.release();
  }
};

export const saveOrUpdateAIAgent = async (agent) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { id, name, slug, avatar_icon, avatar_color, role_title, description, system_prompt, model, allowed_tools, require_confirmation, is_active } = agent;
    const toolsJson = Array.isArray(allowed_tools) ? JSON.stringify(allowed_tools) : (allowed_tools || '[]');
    
    if (id) {
      await conn.execute(`
        UPDATE ai_agents 
        SET name = ?, avatar_icon = ?, avatar_color = ?, role_title = ?, description = ?, system_prompt = ?, model = ?, allowed_tools = ?, require_confirmation = ?, is_active = ?
        WHERE id = ?
      `, [
        name,
        avatar_icon || 'fa-robot',
        avatar_color || '#3b82f6',
        role_title || 'Agente Especialista',
        description || '',
        system_prompt,
        model || 'gemini-1.5-flash',
        toolsJson,
        require_confirmation !== undefined ? (require_confirmation ? 1 : 0) : 1,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id
      ]);
      return { ...agent };
    } else {
      const cleanSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const [res] = await conn.execute(`
        INSERT INTO ai_agents (name, slug, avatar_icon, avatar_color, role_title, description, system_prompt, model, allowed_tools, require_confirmation, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        cleanSlug,
        avatar_icon || 'fa-robot',
        avatar_color || '#3b82f6',
        role_title || 'Agente Especialista',
        description || '',
        system_prompt,
        model || 'gemini-1.5-flash',
        toolsJson,
        require_confirmation !== undefined ? (require_confirmation ? 1 : 0) : 1,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]);
      return { id: res.insertId, slug: cleanSlug, ...agent };
    }
  } finally {
    conn.release();
  }
};

export const deleteAIAgent = async (id) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    await conn.execute('DELETE FROM ai_action_logs WHERE agent_id = ?', [id]);
    // Remove mensagens das conversas deste agente
    await conn.execute(`
      DELETE FROM ai_messages 
      WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE agent_id = ?)
    `, [id]);
    await conn.execute('DELETE FROM ai_conversations WHERE agent_id = ?', [id]);
    const [result] = await conn.execute('DELETE FROM ai_agents WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const getAIConversations = async (agentId = null) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    let query = `
      SELECT c.*, a.name as agent_name, a.avatar_icon, a.avatar_color, a.slug as agent_slug,
             (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
             (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.id) as message_count
      FROM ai_conversations c
      JOIN ai_agents a ON c.agent_id = a.id
    `;
    const params = [];
    if (agentId) {
      query += ' WHERE c.agent_id = ?';
      params.push(agentId);
    }
    query += ' ORDER BY c.updated_at DESC LIMIT 50';
    const [rows] = await conn.execute(query, params);
    return rows;
  } finally {
    conn.release();
  }
};

export const createAIConversation = async (agentId, title = 'Nova Análise') => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [res] = await conn.execute(`
      INSERT INTO ai_conversations (agent_id, title)
      VALUES (?, ?)
    `, [agentId, title]);
    return { id: res.insertId, agent_id: agentId, title, created_at: new Date() };
  } finally {
    conn.release();
  }
};

export const getAIConversationById = async (id) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT c.*, a.name as agent_name, a.avatar_icon, a.avatar_color, a.slug as agent_slug, a.role_title, a.model, a.require_confirmation
      FROM ai_conversations c
      JOIN ai_agents a ON c.agent_id = a.id
      WHERE c.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const deleteAIConversation = async (id) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    await conn.execute('DELETE FROM ai_messages WHERE conversation_id = ?', [id]);
    await conn.execute('DELETE FROM ai_action_logs WHERE conversation_id = ?', [id]);
    await conn.execute('DELETE FROM ai_conversations WHERE id = ?', [id]);
    return true;
  } finally {
    conn.release();
  }
};

export const getAIMessages = async (conversationId) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT * FROM ai_messages
      WHERE conversation_id = ?
      ORDER BY id ASC
    `, [conversationId]);
    return rows.map(m => ({
      ...m,
      tool_calls: safeJsonParse(m.tool_calls),
      tool_results: safeJsonParse(m.tool_results)
    }));
  } finally {
    conn.release();
  }
};

export const saveAIMessage = async (message) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { conversation_id, sender, content, tool_calls, tool_results } = message;
    const [res] = await conn.execute(`
      INSERT INTO ai_messages (conversation_id, sender, content, tool_calls, tool_results)
      VALUES (?, ?, ?, ?, ?)
    `, [
      conversation_id,
      sender,
      content || '',
      tool_calls ? (typeof tool_calls === 'string' ? tool_calls : JSON.stringify(tool_calls)) : null,
      tool_results ? (typeof tool_results === 'string' ? tool_results : JSON.stringify(tool_results)) : null
    ]);

    // Atualiza timestamp da conversa
    await conn.execute('UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversation_id]);

    return { id: res.insertId, ...message, created_at: new Date() };
  } finally {
    conn.release();
  }
};

export const logAIAction = async (actionData) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const { agent_id, conversation_id, tool_name, tool_args, tool_result, status, executed_by } = actionData;
    const [res] = await conn.execute(`
      INSERT INTO ai_action_logs (agent_id, conversation_id, tool_name, tool_args, tool_result, status, executed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      agent_id || null,
      conversation_id || null,
      tool_name,
      tool_args ? (typeof tool_args === 'string' ? tool_args : JSON.stringify(tool_args)) : null,
      tool_result ? (typeof tool_result === 'string' ? tool_result : JSON.stringify(tool_result)) : null,
      status || 'executed',
      executed_by || 'gemini_agent'
    ]);
    return { id: res.insertId, ...actionData, created_at: new Date() };
  } finally {
    conn.release();
  }
};

export const getAIActionLogs = async (limit = 100) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT l.*, a.name as agent_name, a.avatar_icon, a.avatar_color
      FROM ai_action_logs l
      LEFT JOIN ai_agents a ON l.agent_id = a.id
      ORDER BY l.id DESC
      LIMIT ?
    `, [parseInt(limit, 10)]);
    return rows.map(r => ({
      ...r,
      tool_args: safeJsonParse(r.tool_args),
      tool_result: safeJsonParse(r.tool_result)
    }));
  } finally {
    conn.release();
  }
};

export const updateAIActionStatus = async (actionId, status, tool_result = null) => {
  await ensureInitialized();
  const conn = await getPool().getConnection();
  try {
    await conn.execute(`
      UPDATE ai_action_logs 
      SET status = ?, tool_result = ?
      WHERE id = ?
    `, [
      status,
      tool_result ? (typeof tool_result === 'string' ? tool_result : JSON.stringify(tool_result)) : null,
      actionId
    ]);
    return true;
  } finally {
    conn.release();
  }
};

