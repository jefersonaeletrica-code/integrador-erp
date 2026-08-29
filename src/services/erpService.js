import * as blingService from './bling.service.js';
import * as cissPoderService from './cisspoder.service.js';
import { axiosInstance } from './api.service.js';

/**
 * Exporta a instância do axios para ser usada em outras partes, como nas rotas de callback.
 */
export { axiosInstance };
/**
 * Retorna o módulo de serviço apropriado com base no tipo de conexão.
 * @param {string} type - O tipo da conexão ('bling' ou 'cisspoder').
 * @returns {object} O módulo de serviço correspondente.
 */
const getService = (type) => {
    switch (type) {
        case 'bling':
            return blingService;
        case 'cisspoder':
            return cissPoderService;
        default:
            throw new Error(`Tipo de serviço ERP desconhecido: ${type}`);
    }
};
export async function getErpConnectionStatus(connection, db) {
    const service = getService(connection.type);
    return service.getBlingConnectionStatus(connection, db); // getBlingConnectionStatus é um nome genérico aqui
}

export async function ensureValidToken(connection, db) {
    const service = getService(connection.type);
    // Ambos os serviços exportam uma função para garantir o token, podemos chamá-la dinamicamente.
    if (service.ensureCissPoderTokenIsValid) { // Nome específico do CissPoder
        return service.ensureCissPoderTokenIsValid(connection, db);
    }
    // O Bling trata a renovação dentro do getBlingConnectionStatus, então podemos chamá-lo.
    if (service.getBlingConnectionStatus) {
        await service.getBlingConnectionStatus(connection, db);
    }
}

export async function fetchProductsByCode(connection, code, page) {
    const service = getService(connection.type);
    return service.fetchProductsByCode(connection, code, page);
}

export async function fetchProductsByName(connection, name, page) {
    const service = getService(connection.type);
    return service.fetchProductsByName(connection, name, page);
}