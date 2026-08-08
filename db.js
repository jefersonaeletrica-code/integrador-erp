const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'database.json');

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

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
  }
};

const readDb = () => {
  ensureStore();

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);

    return {
      config: { ...DEFAULT_DB.config, ...(data.config || {}) },
      tokens: { ...DEFAULT_DB.tokens, ...(data.tokens || {}) },
      produtos: Array.isArray(data.produtos) ? data.produtos : []
    };
  } catch (error) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
};

const writeDb = (data) => {
  ensureStore();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const updateDb = (partial) => {
  const current = readDb();
  const next = {
    config: { ...current.config, ...(partial.config || {}) },
    tokens: { ...current.tokens, ...(partial.tokens || {}) },
    produtos: Array.isArray(partial.produtos) ? partial.produtos : current.produtos
  };

  writeDb(next);
  return next;
};

module.exports = {
  DB_FILE,
  DEFAULT_DB,
  ensureStore,
  readDb,
  writeDb,
  updateDb
};
