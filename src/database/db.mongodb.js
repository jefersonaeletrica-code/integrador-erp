import { MongoClient } from 'mongodb';

// O DEFAULT_DB define a estrutura inicial dos seus dados.
export const DEFAULT_DB = {
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

// Usaremos um ID fixo para garantir que estamos sempre trabalhando no mesmo documento.
const SETTINGS_ID = 'app_settings';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('A variável de ambiente MONGODB_URI não está definida. Adicione-a ao seu arquivo .env');
}

const client = new MongoClient(MONGODB_URI);
let dbInstance;

/**
 * Conecta ao banco de dados e retorna a coleção de configurações.
 * Gerencia uma única instância de conexão.
 */
async function getCollection() { // Mantida como função interna, não precisa exportar
  if (!dbInstance) {
    await client.connect();
    // Você pode nomear seu banco de dados e coleção como preferir.
    // Aqui, estamos usando 'integradorErpDb' e 'settings'.
    const db = client.db('integradorErpDb');
    dbInstance = db.collection('settings');
    console.log('Conectado ao MongoDB com sucesso!');
  }
  return dbInstance;
}

/**
 * Lê os dados de configuração do MongoDB.
 * Se nenhum dado for encontrado, insere e retorna os dados padrão.
 */
export async function readDb() {
  const collection = await getCollection();
  let data = await collection.findOne({ _id: SETTINGS_ID });

  if (!data) {
    console.log('Nenhuma configuração encontrada, criando documento padrão no MongoDB.');
    const initialData = { _id: SETTINGS_ID, ...DEFAULT_DB };
    await collection.insertOne(initialData);
    return initialData;
  }

  // Garante que todos os campos padrão existam no retorno
  return {
    ...DEFAULT_DB,
    ...data,
  };
}

/**
 * Atualiza os dados de configuração no MongoDB.
 * Usa $set para atualizar apenas os campos fornecidos.
 */
export async function updateDb(partial) {
  const collection = await getCollection();
  const updatePayload = {};

  // Mapeia dinamicamente as chaves do objeto parcial para o operador $set do MongoDB.
  // Ex: { config: {...} } se torna { 'config': {...} }
  for (const key in partial) {
    updatePayload[key] = partial[key];
  }

  const result = await collection.updateOne({ _id: SETTINGS_ID }, { $set: updatePayload }, { upsert: true });
  return result;
}