const mysql = require('mysql2/promise');

// Estrutura de dados padrão para consistência
const DEFAULT_DB = {
  config: {
    BLING_CLIENT_ID: '',
    BLING_CLIENT_SECRET: '',
    BLING_REDIRECT_URI: '',
    LOJA_API_URL: '',
    LOJA_API_KEY: ''
  },
  tokens: {
    access_token: '',
    refresh_token: ''
  },
  produtos: []
};

let pool;
let initializationPromise = null;

const getPool = () => {
  if (!pool) {
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
      throw new Error('As variáveis de ambiente do MySQL (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) não estão configuradas.');
    }
    pool = mysql.createPool({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('Pool de conexões MySQL criado com sucesso!');
  }
  return pool;
};

const initializeDatabase = async () => {
  const connection = await getPool().getConnection(); // Pega uma conexão do pool
  try {
    console.log('Verificando e inicializando o banco de dados MySQL...');

    await connection.query(`
        CREATE TABLE IF NOT EXISTS app_config (
          id int NOT NULL DEFAULT '1',
          BLING_CLIENT_ID varchar(255) DEFAULT '',
          BLING_CLIENT_SECRET varchar(255) DEFAULT '',
          BLING_REDIRECT_URI varchar(255) DEFAULT '',
          LOJA_API_URL varchar(255) DEFAULT '',
          LOJA_API_KEY varchar(255) DEFAULT '',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS app_tokens (
          id int NOT NULL DEFAULT '1',
          access_token text,
          refresh_token text,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS produtos_importados (
          id int NOT NULL AUTO_INCREMENT,
          codigo varchar(100) NOT NULL,
          nome varchar(255) DEFAULT NULL,
          preco decimal(10,2) DEFAULT '0.00',
          PRIMARY KEY (id),
          UNIQUE KEY codigo (codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Garante que os registros de configuração e tokens existam
    await connection.query("INSERT INTO app_config (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1;");
    await connection.query("INSERT INTO app_tokens (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1;");

    console.log('Banco de dados MySQL pronto.');
  } finally {
    connection.release();
  }
};

// Função que garante que a inicialização ocorra apenas uma vez.
const ensureInitialized = () => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  return initializationPromise;
};

const readDb = async () => {
  await ensureInitialized(); // Garante que a inicialização terminou
  const connection = await getPool().getConnection();
  try {
    // Inicia as transações para garantir a consistência
    await connection.beginTransaction();

    // Lê a configuração
    let [configRows] = await connection.query('SELECT * FROM app_config WHERE id = 1');
    let config = configRows[0];

    // Lê os tokens
    let [tokenRows] = await connection.query('SELECT * FROM app_tokens WHERE id = 1');
    let tokens = tokenRows[0];

    // Lê os produtos
    const [produtos] = await connection.query('SELECT * FROM produtos_importados');

    await connection.commit();

    return {
      config: { ...DEFAULT_DB.config, ...config },
      tokens: { ...DEFAULT_DB.tokens, ...tokens },
      produtos: produtos.map(p => ({ ...p, preco: parseFloat(p.preco) })) // Garante que o preço seja número
    };
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao ler do banco de dados MySQL:', error);
    throw error;
  } finally {
    connection.release();
  }
};

const updateDb = async (partial) => {
  await ensureInitialized(); // Garante que a inicialização terminou
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    if (partial.config) {
      const fields = Object.keys(partial.config).filter(k => k in DEFAULT_DB.config);
      const values = fields.map(k => partial.config[k]);
      const setClause = fields.map(k => `${k} = ?`).join(', ');
      if (setClause) {
        await connection.execute(`UPDATE app_config SET ${setClause} WHERE id = 1`, values);
      }
    }

    if (partial.tokens) {
      const fields = Object.keys(partial.tokens).filter(k => k in DEFAULT_DB.tokens);
      const values = fields.map(k => partial.tokens[k]);
      const setClause = fields.map(k => `${k} = ?`).join(', ');
      if (setClause) {
        await connection.execute(`UPDATE app_tokens SET ${setClause} WHERE id = 1`, values);
      }
    }

    if (Array.isArray(partial.produtos)) {
      await connection.query('TRUNCATE TABLE produtos_importados');
      if (partial.produtos.length > 0) {
        const productValues = partial.produtos.map(p => [p.codigo, p.nome, p.preco]);
        await connection.query('INSERT INTO produtos_importados (codigo, nome, preco) VALUES ?', [productValues]);
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

module.exports = {
  DEFAULT_DB,
  initialize: ensureInitialized, // Exporta a função de controle
  readDb,
  updateDb,
};