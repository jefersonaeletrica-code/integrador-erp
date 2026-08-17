import 'dotenv/config';

const DB_DRIVER = process.env.DB_DRIVER || 'json';

async function loadDbModule() {
  let dbModule;
  if (DB_DRIVER === 'json') {
    console.log('Usando driver de banco de dados: JSON');
    dbModule = await import('./db.json.js');
  } else if (DB_DRIVER === 'mysql') {
    console.log('Usando driver de banco de dados: MySQL');
    dbModule = await import('./db.mysql.js');
  } else if (DB_DRIVER === 'mongodb') {
    console.log('Usando driver de banco de dados: MongoDB');
    dbModule = await import('./db.mongodb.js');
  } else {
    throw new Error(`Driver de banco de dados desconhecido: ${DB_DRIVER}`);
  }
  return dbModule;
}

export default await loadDbModule();
