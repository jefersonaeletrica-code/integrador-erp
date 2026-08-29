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

export const readDb = async () => {
  await ensureInitialized(); // Garante que a inicialização terminou
  const connection = await getPool().getConnection();
  try {
    // Inicia as transações para garantir a consistência
    // await connection.beginTransaction(); // Não é mais necessário para leituras simples

    const [connections] = await connection.query('SELECT * FROM erp_connections');
    const [supplierConnections] = await connection.query('SELECT * FROM supplier_connections');

    // Lê os produtos
    const [produtos] = await connection.query('SELECT * FROM produtos_importados');

    return {
      connections: connections.map(c => ({...c, credentials: typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials })),
      supplierConnections: supplierConnections.map(c => ({
        ...c, 
        credentials: typeof c.credentials === 'string' ? JSON.parse(c.credentials) : c.credentials,
        // Garante que os dados da sessão também sejam parseados do JSON.
        // O campo no DB é 'session_data', mas o app usa 'cookies' internamente.
        cookies: typeof c.session_data === 'string' ? JSON.parse(c.session_data) : c.session_data
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