/**
 * @file src/index.js
 * @description CLI para executar o scraping do portal Dismatal.
 * Suporta múltiplas fontes de dados (SKU único, CSV, JSON) e formatos de saída.
 */
import { argv }_from 'node:process';
import { getEnv, getScraperConfig }_from './config/index.js';
import { initLogger, getLogger }_from './utils/logger.js';
import { loadInternalIds }_from './utils/loaders.js';
import { displayResults, saveReports }_from './utils/reports.js';
import { initBrowser, closeBrowser }_from './core/browser.js';
import { authenticate }_from './auth/index.js';
import { DismatalProductPipelineAdapter }_from './core/dismatal-product-adapter.js';

/**
 * Analisa os argumentos da linha de comando para configurar a execução.
 * Utiliza yargs para uma análise mais robusta e geração de ajuda.
 * @returns {import('./types/index.js').CLIOptions}
 */
function parseArgs() {
    // Em um projeto real, usar uma biblioteca como 'yargs' seria ideal.
    // Para manter a simplicidade, faremos a análise manual.
    const options = {
        source: 'single',
        verbose: argv.includes('--verbose'),
        dryRun: argv.includes('--dry-run') || argv.includes('--test'),
        outputFormat: 'table',
    };

    if (argv.includes('--test')) {
        options.outputFormat = 'test';
    }

    const csvIndex = argv.indexOf('--csv');
    if (csvIndex > -1 && argv[csvIndex + 1]) {
        options.source = 'csv';
        options.filePath = argv[csvIndex + 1];
    }

    const jsonIndex = argv.indexOf('--json');
    if (jsonIndex > -1 && argv[jsonIndex + 1]) {
        options.source = 'json';
        options.filePath = argv[jsonIndex + 1];
    }

    const skuIndex = argv.indexOf('--sku');
    if (skuIndex > -1 && argv[skuIndex + 1]) {
        options.source = 'single';
        options.sku = argv[skuIndex + 1];
    }

    const outputIndex = argv.indexOf('--output');
    if (outputIndex > -1 && argv[outputIndex + 1]) {
        const fmt = argv[outputIndex + 1];
        if (['json', 'csv', 'table', 'test'].includes(fmt)) {
            options.outputFormat = fmt;
        }
    }

    return options;
}

/**
 * Executa o pipeline de scraping.
 * @param {string[]} internalIds - Lista de IDs a serem processados.
 * @param {DismatalProductPipelineAdapter} adapter - Instância do adapter.
 * @param {boolean} dryRun - Se verdadeiro, não persiste os dados.
 * @returns {Promise<import('./types/index.js').ExecutionResult>}
 */
async function runScraping(internalIds, adapter, dryRun) {
    const logger = getLogger();
    const startTime = Date.now();

    logger.info(`🔄 Iniciando pipeline para ${internalIds.length} ID(s)`, {
        count: internalIds.length,
        dryRun,
    });

    if (dryRun) {
        logger.warn('⚠️  DRY RUN MODE - Nenhum dado será persistido.');
    }

    const { products, failed } = await adapter.extractAndPersistBatch(adapter.browserPage, internalIds, {
        persist: !dryRun,
    });

    const duration = Date.now() - startTime;

    logger.info(`✅ Pipeline concluído em ${duration}ms. Sucesso: ${products.length}, Falhas: ${failed.length}`, {
        successful: products.length,
        failed: failed.length,
        duration,
    });

    return {
        products,
        failed,
        duration,
        total: internalIds.length,
    };
}

/**
 * Função principal para orquestrar o scraper.
 */
async function main() {
    const env = getEnv();
    const logger = initLogger(env);
    const config = getScraperConfig(env);

    let browserInstance = null;
    let adapter = null;

    try {
        const options = parseArgs();
        logger.info('🚀 Iniciando Dismatal B2B Scraper', { options });

        logger.info('📂 Carregando IDs internos...');
        const internalIds = await loadInternalIds(options);
        if (internalIds.length === 0) {
            throw new Error('Nenhum ID interno para processar.');
        }
        logger.info(`✅ ${internalIds.length} IDs internos carregados.`);

        logger.info('🌐 Inicializando browser...');
        browserInstance = await initBrowser(config);

        logger.info('🔐 Autenticando no portal...');
        await browserInstance.page.goto(env.PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await authenticate(browserInstance.page, {
            credentials: { username: env.PORTAL_USERNAME, password: env.PORTAL_PASSWORD },
            retryAttempts: env.RETRY_ATTEMPTS,
            retryDelayMs: env.RETRY_DELAY_MS,
        });
        logger.info('✅ Autenticado com sucesso!');

        await browserInstance.page.waitForTimeout(2000); // Pausa para estabilização de cookies/sessão.

        adapter = new DismatalProductPipelineAdapter();
        adapter.browserPage = browserInstance.page;

        const result = await runScraping(internalIds, adapter, options.dryRun);

        displayResults(result, options.outputFormat);
        saveReports(result, options);

        logger.info('🏁 Execução finalizada.');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Erro crítico na execução principal.', error);
        process.exit(1);
    } finally {
        logger.info('🧹 Limpando recursos...');
        // Garante que os recursos sejam sempre liberados.
        if (adapter) {
            await adapter.disconnect().catch(e => logger.error('Erro ao desconectar adapter.', e));
        }
        if (browserInstance) {
            await closeBrowser(browserInstance).catch(e => logger.error('Erro ao fechar browser.', e));
        }
    }
}

main().catch((error) => {
    // Fallback para erros não capturados no bloco try/catch principal.
    console.error('❌ Erro fatal inesperado:', error);
    process.exit(1);
});