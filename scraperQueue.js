import { getLogger } from './logger.js';

const logger = getLogger();
const queue = [];
let isProcessing = false;

/**
 * Processa a próxima tarefa na fila.
 */
async function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        logger.debug('[ScraperQueue] Fila vazia. Processamento pausado.');
        return;
    }

    isProcessing = true;
    const { task, resolve, reject } = queue.shift();
    logger.info(`[ScraperQueue] Iniciando nova tarefa. ${queue.length} tarefas restantes.`);

    try {
        const result = await task();
        resolve(result);
    } catch (error) {
        reject(error);
    }

    processQueue(); // Processa o próximo item
}

/**
 * Adiciona uma tarefa de scraping à fila.
 * @param {Function} task - A função assíncrona que executa o scraping.
 * @returns {Promise<any>}
 */
export function addToQueue(task) {
    return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        logger.debug(`[ScraperQueue] Tarefa adicionada. Tamanho da fila: ${queue.length}`);
        if (!isProcessing) {
            processQueue();
        }
    });
}