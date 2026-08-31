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
    await conn.execute(
      'UPDATE supplier_connections SET name = ?, credentials = ?, session_data = ? WHERE id = ?',
      [
        name,
        JSON.stringify(credentials),
        sessionData ? JSON.stringify(sessionData) : null,
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

export const updateDb = async (partial) => {
  // Esta função agora será mais específica para cada tipo de atualização
  // A lógica principal de CRUD será movida para o server.js
  await ensureInitialized(); // Garante que a inicialização terminou
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    if (Array.isArray(partial.produtos)) {
      await connection.query('TRUNCATE TABLE produtos_importados');
      if (partial.produtos.length > 0) {
        const productValues = partial.produtos.map(p => [p.codigo, p.nome, p.preco]);
        await connection.query('INSERT INTO produtos_importados (codigo, nome, preco) VALUES ?', [productValues]);
      }
    } else if (partial.connection) {
      // Lógica para atualizar uma conexão ERP específica
      const { id, name, type, credentials } = partial.connection;
      // A verificação agora inclui o campo 'type' para garantir a integridade dos dados.
      if (id && name && type && credentials) {
        await connection.execute(
          'UPDATE erp_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
          [
            name,
            type,
            JSON.stringify(credentials),
            id
          ]
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
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
    await conn.execute(
      'UPDATE marketplace_connections SET name = ?, type = ?, credentials = ? WHERE id = ?',
      [
        name,
        type,
        JSON.stringify(credentials),
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
        (connection_id, item_id, sku, title, price, available_quantity, status, listing_type_id, permalink, thumbnail, category_id, category_name, source_type, source_id, source_data, sync_auto_stock, sync_auto_price, markup_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      category_id,
      category_name,
      source_type,
      source_id,
      source_data ? JSON.stringify(source_data) : null,
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