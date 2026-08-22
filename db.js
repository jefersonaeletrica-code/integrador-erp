import 'dotenv/config';

const DB_DRIVER = process.env.DB_DRIVER || 'json';
let dbModule;

const db = {
  _initialized: false,
  
  async initialize() {
    if (this._initialized) return;
    
    console.log(`Usando driver de banco de dados: ${DB_DRIVER.toUpperCase()}`);
    if (DB_DRIVER === 'json') {
      dbModule = await import('./db.json.js');
    } else if (DB_DRIVER === 'mysql') {
      dbModule = await import('./db.mysql.js');
    } else if (DB_DRIVER === 'mongodb') {
      dbModule = await import('./db.mongodb.js');
    } else {
      throw new Error(`Driver de banco de dados desconhecido: ${DB_DRIVER}`);
    }
    // Mescla os métodos do módulo de DB específico (ex: getPool, readDb) no objeto 'db'
    Object.assign(this, dbModule);
    this._initialized = true;
  }
};

export default db;
