require('dotenv').config();

const DB_DRIVER = process.env.DB_DRIVER || 'json';

let db;

if (DB_DRIVER === 'json') {
  console.log('Usando driver de banco de dados: JSON');
  db = require('./db.json');
} else if (DB_DRIVER === 'mongodb') {
  console.log('Usando driver de banco de dados: MongoDB');
  db = require('./db.mongodb'); 
} else {
  throw new Error(`Driver de banco de dados desconhecido: ${DB_DRIVER}`);
}

module.exports = db;
