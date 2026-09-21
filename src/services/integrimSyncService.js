import { getLogger } from '../core/logger.js';
import { axiosInstance } from './api.service.js';
import { ensureCissPoderTokenIsValid } from './cisspoder.service.js';

const logger = getLogger();
const resolvePool = (db) => typeof db?.getPool === 'function' ? db.getPool() : db;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PAGE_DELAY_MS = 250; // Delay de 250ms entre requisições paginadas para evitar sobrecarga e timeouts

/**
 * Executa requisição POST com retentativas automáticas (backoff exponencial) e proteção contra timeouts/429
 */
async function fetchIntegrimWithRetry(url, payload, headers, maxRetries = 3, initialDelay = 1000) {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const response = await axiosInstance.post(url, payload, {
                headers,
                timeout: 30000 // 30 segundos por requisição
            });
            return response;
        } catch (error) {
            attempt++;
            const isRetryable = error.code === 'ECONNABORTED' 
                || error.code === 'ETIMEDOUT' 
                || error.code === 'ECONNRESET' 
                || (error.response && [429, 500, 502, 503, 504].includes(error.response.status));

            if (!isRetryable || attempt > maxRetries) {
                logger.error(`[IntegrimSync] Falha definitiva na requisição ${url}:`, error.message);
                throw error;
            }

            const backoffTime = initialDelay * Math.pow(2, attempt - 1);
            logger.warn(`[IntegrimSync] Tentativa ${attempt}/${maxRetries} falhou (${error.message}). Aguardando ${backoffTime}ms antes de retentar...`);
            await sleep(backoffTime);
        }
    }
}

/**
 * =========================================================================
 * SERVIÇO DE SINCRONIZAÇÃO OTIMIZADA INTEGRIM (CISS PODER)
 * 3 Endpoints Principais:
 *   1. CAD_PRODUTOS (Produtos + Estrutura Mercadológica + Marcas)
 *   2. PRODUTOS_SALDO_ESTOQUE_EMPRESA (Saldos Físicos e Reservas por Filial)
 *   3. PRECOS_CUSTOS_PRODUTOS_EMPRESA (Custos Gerencial, Fiscal, Reposição e Preços)
 * =========================================================================
 */

/**
 * Retorna a data/hora atual formatada no fuso horário oficial do Brasil (America/Sao_Paulo / UTC-03:00)
 * Formato: "YYYY-MM-DD HH:mm:ss"
 */
export function getBrazilNow() {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    return formatter.format(d).replace(', ', ' ');
}

/**
 * Formata data/hora para o padrão do CISS Poder: "YYYY-MM-DD HH:mm:ss"
 * Garante conversão estrita para o fuso horário de Brasília (UTC-03:00).
 * Corrige automaticamente registros passados armazenados em UTC e aplica margem de segurança opcional.
 * @param {Date|string} dateInput - Data de entrada
 * @param {number} bufferMinutes - Minutos de margem de segurança a subtrair (padrão: 0)
 */
export function formatCissDateTime(dateInput, bufferMinutes = 0) {
    if (!dateInput) return null;

    let targetDate = null;

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return null;
        targetDate = new Date(dateInput.getTime() - (bufferMinutes * 60 * 1000));
    } else {
        let str = String(dateInput).trim();
        // Se for string ISO com Z ou offset
        if (str.includes('T') || str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                targetDate = new Date(parsed.getTime() - (bufferMinutes * 60 * 1000));
            }
        } else {
            const sqlMatch = str.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
            if (sqlMatch) {
                const brazilNow = getBrazilNow();
                // Se a string armazenada é maior que o horário atual do Brasil, foi salva em UTC (+3h)!
                if (str > brazilNow) {
                    const parsed = new Date(str.replace(' ', 'T') + 'Z');
                    targetDate = new Date(parsed.getTime() - (bufferMinutes * 60 * 1000));
                } else {
                    // String já está em horário de Brasília: subtrai o buffer se houver
                    if (bufferMinutes > 0) {
                        const parsed = new Date(str.replace(' ', 'T') + '-03:00');
                        targetDate = new Date(parsed.getTime() - (bufferMinutes * 60 * 1000));
                    } else {
                        return str;
                    }
                }
            }
        }
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
        targetDate = new Date();
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    return formatter.format(targetDate).replace(', ', ' ');
}

/**
 * Consulta a última sincronização concluída com sucesso no MySQL formatada no fuso de Brasília
 */
export async function getLastSuccessfulSync(db) {
    const pool = resolvePool(db);
    try {
        const [rows] = await pool.execute(`
            SELECT id, sync_type, produtos_count, saldos_count, custos_count, 
                   DATE_FORMAT(started_at, '%Y-%m-%d %H:%i:%s') as started_at,
                   DATE_FORMAT(finished_at, '%Y-%m-%d %H:%i:%s') as finished_at,
                   status
            FROM bi_sync_history
            WHERE status = 'success'
            ORDER BY started_at DESC
            LIMIT 1
        `);
        const row = rows[0] || null;
        if (!row) return null;

        // Normaliza as datas retornadas para o horário oficial de Brasília
        return {
            ...row,
            started_at: formatCissDateTime(row.started_at),
            finished_at: formatCissDateTime(row.finished_at)
        };
    } catch (err) {
        return null;
    }
}

/**
 * Registra histórico de sincronização no MySQL com carimbos no horário oficial do Brasil (-03:00)
 */
export async function recordSyncHistory(db, { syncType, produtosCount, saldosCount, custosCount, startedAt, finishedAt, status, errorMessage = null }) {
    const pool = resolvePool(db);
    try {
        const startedAtStr = formatCissDateTime(startedAt) || getBrazilNow();
        const finishedAtStr = formatCissDateTime(finishedAt) || getBrazilNow();
        await pool.execute(`
            INSERT INTO bi_sync_history (
                sync_type, produtos_count, saldos_count, custos_count,
                started_at, finished_at, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            syncType || 'integrim_full',
            produtosCount || 0,
            saldosCount || 0,
            custosCount || 0,
            startedAtStr,
            finishedAtStr,
            status || 'success',
            errorMessage
        ]);
    } catch (err) {
        logger.error('[IntegrimSync] Erro ao gravar bi_sync_history:', err.message);
    }
}

// Estado global em memória para monitoramento de sincronização em segundo plano
const integrimSyncStatus = {
    isRunning: false,
    startedAt: null,
    finishedAt: null,
    syncType: 'full', // 'full' | 'delta'
    lastSyncDate: null,
    stage: 'idle', // 'idle' | 'cad_produtos' | 'produtos_saldo_estoque' | 'precos_custos' | 'curva_abc' | 'done' | 'error'
    stageLabel: 'Nenhuma sincronização em andamento',
    progress: {
        produtos: 0,
        saldos: 0,
        custos: 0,
        currentPage: 0
    },
    error: null,
    message: 'Nenhuma sincronização em andamento'
};

export async function getIntegrimSyncStatus(db = null) {
    let lastSync = null;
    if (db) {
        lastSync = await getLastSuccessfulSync(db);
    }
    return {
        ...integrimSyncStatus,
        lastSuccessfulSync: lastSync
    };
}

/**
 * Inicia a sincronização em segundo plano (Incremental por padrão se houver sincronização prévia, ou Completa)
 */
export async function startIntegrimBackgroundSync(connection, db, { forceFull = false } = {}) {
    if (integrimSyncStatus.isRunning) {
        return {
            sucesso: true,
            isRunning: true,
            alreadyRunning: true,
            mensagem: 'Sincronização com Integrim CISS Poder já está em andamento em segundo plano.'
        };
    }

    const lastSync = await getLastSuccessfulSync(db);
    const isDelta = !forceFull && !!lastSync?.started_at;
    // Margem de segurança de 2 minutos sobre o INÍCIO da sincronização anterior
    // para capturar alterações realizadas no ERP durante o período de execução da rotina
    const lastSyncDate = isDelta ? formatCissDateTime(lastSync.started_at, 2) : null;
    const syncType = isDelta ? 'integrim_delta' : 'integrim_full';

    const nowBrazil = getBrazilNow();
    integrimSyncStatus.isRunning = true;
    integrimSyncStatus.startedAt = nowBrazil;
    integrimSyncStatus.finishedAt = null;
    integrimSyncStatus.syncType = isDelta ? 'delta' : 'full';
    integrimSyncStatus.lastSyncDate = lastSyncDate;
    integrimSyncStatus.stage = 'iniciando';
    integrimSyncStatus.stageLabel = isDelta 
        ? `Iniciando sincronização incremental (alterados após ${lastSyncDate})...`
        : 'Iniciando sincronização completa...';
    integrimSyncStatus.progress = { produtos: 0, saldos: 0, custos: 0, currentPage: 0 };
    integrimSyncStatus.error = null;
    integrimSyncStatus.message = isDelta
        ? `Sincronização incremental em andamento (desde ${lastSyncDate})...`
        : 'Sincronização completa em andamento...';

    // Dispara a execução assíncrona desacoplada da conexão HTTP do cliente
    (async () => {
        const startedAtDb = getBrazilNow();
        try {
            logger.info(`[IntegrimSync Background] Iniciando rotina de sincronização (${syncType}) em segundo plano (Fuso -03:00)...`);

            if (!isDelta) {
                // Na sincronização completa (Full Sync), remove os registros demonstrativos de teste/mock para garantir catálogo 100% real
                await purgeMockEstoqueData(db);
            }

            // Etapa 1: CAD_PRODUTOS
            integrimSyncStatus.stage = 'cad_produtos';
            integrimSyncStatus.stageLabel = isDelta 
                ? `Importando produtos alterados após ${lastSyncDate}...`
                : 'Importando cadastro de produtos (CAD_PRODUTOS)...';
            const resProd = await syncIntegrimProducts(connection, db, null, (prog) => {
                integrimSyncStatus.progress.produtos = prog.total;
                integrimSyncStatus.progress.currentPage = prog.page;
                integrimSyncStatus.stageLabel = `Importando produtos (pág. ${prog.page} - ${prog.total} produtos)...`;
            }, lastSyncDate);
            integrimSyncStatus.progress.produtos = resProd.total;

            // Etapa 2: PRODUTOS_SALDO_ESTOQUE_EMPRESA
            integrimSyncStatus.stage = 'produtos_saldo_estoque';
            integrimSyncStatus.stageLabel = isDelta 
                ? `Importando saldos alterados após ${lastSyncDate}...`
                : 'Importando saldos de estoque (PRODUTOS_SALDO_ESTOQUE_EMPRESA)...';
            const resSaldo = await syncIntegrimStockBalances(connection, db, null, (prog) => {
                integrimSyncStatus.progress.saldos = prog.total;
                integrimSyncStatus.progress.currentPage = prog.page;
                integrimSyncStatus.stageLabel = `Importando saldos físicos (pág. ${prog.page} - ${prog.total} saldos)...`;
            }, lastSyncDate);
            integrimSyncStatus.progress.saldos = resSaldo.total;

            // Etapa 3: PRECOS_CUSTOS_PRODUTOS_EMPRESA
            integrimSyncStatus.stage = 'precos_custos';
            integrimSyncStatus.stageLabel = isDelta 
                ? `Importando custos e preços alterados após ${lastSyncDate}...`
                : 'Importando custos e preços (PRECOS_CUSTOS_PRODUTOS_EMPRESA)...';
            const resCustos = await syncIntegrimCostsAndPrices(connection, db, null, (prog) => {
                integrimSyncStatus.progress.custos = prog.total;
                integrimSyncStatus.progress.currentPage = prog.page;
                integrimSyncStatus.stageLabel = `Importando custos e preços (pág. ${prog.page} - ${prog.total} registros)...`;
            }, lastSyncDate);
            integrimSyncStatus.progress.custos = resCustos.total;

            // Etapa 4: Recalcular Curva ABC e Cobertura
            integrimSyncStatus.stage = 'curva_abc';
            integrimSyncStatus.stageLabel = 'Recalculando Curva ABC e Dias de Cobertura...';
            await recalculateAbcAndCoverage(db);

            const finishedAtDb = getBrazilNow();
            integrimSyncStatus.isRunning = false;
            integrimSyncStatus.stage = 'done';
            integrimSyncStatus.stageLabel = 'Sincronização concluída com sucesso!';
            integrimSyncStatus.finishedAt = finishedAtDb;
            integrimSyncStatus.message = isDelta
                ? `Sincronização incremental concluída: ${resProd.total} produtos, ${resSaldo.total} saldos e ${resCustos.total} custos/preços atualizados (desde ${lastSyncDate}).`
                : `Sincronização completa concluída: ${resProd.total} produtos, ${resSaldo.total} saldos e ${resCustos.total} custos/preços atualizados.`;

            // Grava histórico de sucesso no MySQL no horário de Brasília (-03:00)
            await recordSyncHistory(db, {
                syncType,
                produtosCount: resProd.total,
                saldosCount: resSaldo.total,
                custosCount: resCustos.total,
                startedAt: startedAtDb,
                finishedAt: finishedAtDb,
                status: 'success'
            });

            logger.info(`[IntegrimSync Background] ${integrimSyncStatus.message}`);
        } catch (error) {
            const finishedAtDb = getBrazilNow();
            logger.error('[IntegrimSync Background] Erro durante sincronização em segundo plano:', error);
            integrimSyncStatus.isRunning = false;
            integrimSyncStatus.stage = 'error';
            integrimSyncStatus.stageLabel = `Erro na sincronização: ${error.message}`;
            integrimSyncStatus.error = error.message;
            integrimSyncStatus.finishedAt = finishedAtDb;

            // Grava histórico de erro no MySQL
            await recordSyncHistory(db, {
                syncType,
                produtosCount: integrimSyncStatus.progress.produtos || 0,
                saldosCount: integrimSyncStatus.progress.saldos || 0,
                custosCount: integrimSyncStatus.progress.custos || 0,
                startedAt: startedAtDb,
                finishedAt: finishedAtDb,
                status: 'error',
                errorMessage: error.message
            });
        }
    })();

    return {
        sucesso: true,
        isRunning: true,
        started: true,
        isDelta,
        lastSyncDate,
        mensagem: isDelta
            ? `Sincronização incremental iniciada (filtrando alterações após ${lastSyncDate}).`
            : 'Sincronização completa iniciada em segundo plano.'
    };
}

/**
 * 1. Sincroniza Cadastro de Produtos e Estrutura Mercadológica (CAD_PRODUTOS)
 * Por padrão busca TODOS os produtos (batchLimit = null). Suporta filtro incremental por dtalteracao.
 */
export async function syncIntegrimProducts(connection, db, batchLimit = null, onProgress = null, lastSyncDate = null) {
    const pool = resolvePool(db);
    await ensureCissPoderTokenIsValid(connection, db);

    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/cad_produtos';
    const url = authUrlObject.toString();

    let page = 1;
    let hasNext = true;
    let totalImportados = 0;

    const clausulas = [
        { campo: "flaginativo", valor: "F", operador: "IGUAL", operadorlogico: "AND" },
        { campo: "flagbloqueiavenda", valor: "F", operador: "IGUAL", operadorlogico: "AND" }
    ];

    if (lastSyncDate) {
        clausulas.push({ campo: "dtalteracao", valor: lastSyncDate, operador: "MAIOR_IGUAL", operadorlogico: "AND" });
    }

    logger.info(`[IntegrimSync] Iniciando sincronização de produtos via CAD_PRODUTOS (Delta: ${lastSyncDate || 'Não'})...`);

    while (hasNext && (!batchLimit || totalImportados < batchLimit)) {
        const payload = {
            page,
            clausulas,
            ordenacoes: [{ campo: "idsubproduto", direcao: "ASC" }]
        };

        const headers = {
            'Authorization': `Bearer ${connection.credentials.access_token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetchIntegrimWithRetry(url, payload, headers);

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (items.length === 0) break;

        for (const item of items) {
            const idsubproduto = parseInt(item.idsubproduto, 10);
            if (!idsubproduto) continue;

            const bloqueiaVenda = item.flagbloqueiavenda === 'T';
            const inativo = (item.flaginativo === 'T') || bloqueiaVenda;

            const idproduto = parseInt(item.idproduto, 10) || idsubproduto;
            const codBarras = item.nrcodbarprod ? String(item.nrcodbarprod) : null;
            const codBarrasCx = item.idcodbarcx ? String(item.idcodbarcx) : null;
            const descricao = item.descrcomproduto || item.descrresproduto || `Produto ${idsubproduto}`;
            const descricaoResumida = item.descrresproduto || null;
            const marca = item.descricao || null;
            const idMarca = parseInt(item.idmarcafabricante, 10) || null;
            const divisao = item.descrdivisao || null;
            const idDivisao = parseInt(item.iddivisao, 10) || null;
            const secao = item.descrsecao || null;
            const idSecao = parseInt(item.idsecao, 10) || null;
            const grupo = item.descrgrupo || null;
            const idGrupo = parseInt(item.idgrupo, 10) || null;
            const subgrupo = item.descrsubgrupo || null;
            const idSubgrupo = parseInt(item.idsubgrupo, 10) || null;
            const ncm = item.ncm ? String(item.ncm) : null;
            const unMedida = item.embalagemsaida || 'UN';

            await pool.execute(`
                INSERT INTO bi_produtos (
                    idproduto, idsubproduto, codigo_barras, codigo_barras_cx,
                    descricao, descricao_resumida, marca, id_marca,
                    divisao, id_divisao, secao, id_secao,
                    grupo, id_grupo, subgrupo, id_subgrupo,
                    ncm, unidade_medida, inativo, bloqueia_venda
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    idproduto = VALUES(idproduto),
                    codigo_barras = VALUES(codigo_barras),
                    codigo_barras_cx = VALUES(codigo_barras_cx),
                    descricao = VALUES(descricao),
                    descricao_resumida = VALUES(descricao_resumida),
                    marca = VALUES(marca),
                    id_marca = VALUES(id_marca),
                    divisao = VALUES(divisao),
                    id_divisao = VALUES(id_divisao),
                    secao = VALUES(secao),
                    id_secao = VALUES(id_secao),
                    grupo = VALUES(grupo),
                    id_grupo = VALUES(id_grupo),
                    subgrupo = VALUES(subgrupo),
                    id_subgrupo = VALUES(id_subgrupo),
                    ncm = VALUES(ncm),
                    unidade_medida = VALUES(unidade_medida),
                    inativo = VALUES(inativo),
                    bloqueia_venda = VALUES(bloqueia_venda)
            `, [
                idproduto, idsubproduto, codBarras, codBarrasCx,
                descricao, descricaoResumida, marca, idMarca,
                divisao, idDivisao, secao, idSecao,
                grupo, idGrupo, subgrupo, idSubgrupo,
                ncm, unMedida, inativo, bloqueiaVenda
            ]);

            // Se o produto está inativo ou com venda bloqueada no ERP, remove imediatamente seus saldos para não distorcer o estoque
            if (inativo || bloqueiaVenda) {
                await pool.execute('DELETE FROM bi_estoque_saldos WHERE idsubproduto = ?', [idsubproduto]);
            }

            totalImportados++;
        }

        hasNext = !!response.data?.hasNext;
        if (typeof onProgress === 'function') {
            onProgress({ page, total: totalImportados, hasNext });
        }

        page++;
        if (hasNext && (!batchLimit || totalImportados < batchLimit)) {
            await sleep(PAGE_DELAY_MS);
        }
    }

    logger.info(`[IntegrimSync] CAD_PRODUTOS concluído: ${totalImportados} produtos sincronizados.`);
    return { sucesso: true, total: totalImportados };
}

/**
 * Valida com precisão o registro de estoque da loja oficial no CISS Poder:
 * - Empresa 1 (Matriz / Loja 1) -> idlocalestoque = 1 e descrlocalestoque = "AREA VENDA LOJA01"
 * - Empresa 2 (Filial 2 / Loja 2) -> idlocalestoque = 2 e descrlocalestoque = "AREA VENDA LOJA02"
 */
export function isValidStoreStockRecord(idempresa, idlocalestoque, descrlocalestoque) {
    const emp = parseInt(idempresa, 10);
    const locId = parseInt(idlocalestoque, 10);
    const desc = String(descrlocalestoque || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

    // Se for empresa 1: deve ser local 1 ("AREA VENDA LOJA01")
    if (emp === 1) {
        if (locId === 1 && (desc.includes('LOJA01') || desc.includes('LOJA1') || !desc)) return true;
        if (desc.includes('LOJA01') || desc.includes('LOJA1') || desc.includes('MATRIZ')) {
            return !desc.includes('TROCA') && !desc.includes('AVARIA') && !desc.includes('DEPOSITO');
        }
        return locId === 1;
    }

    // Se for empresa 2: deve ser local 2 ("AREA VENDA LOJA02")
    if (emp === 2) {
        if (locId === 2 && (desc.includes('LOJA02') || desc.includes('LOJA2') || !desc)) return true;
        if (desc.includes('LOJA02') || desc.includes('LOJA2') || desc.includes('FILIAL')) {
            return !desc.includes('TROCA') && !desc.includes('AVARIA') && !desc.includes('DEPOSITO');
        }
        return locId === 2;
    }

    return false;
}

export function isOfficialSalesLocation(empresaId, descrLocalEstoque) {
    return isValidStoreStockRecord(empresaId, null, descrLocalEstoque);
}

/**
 * 2. Sincroniza Saldos de Estoque por Loja (PRODUTOS_SALDO_ESTOQUE_EMPRESA)
 * Sincroniza exclusivamente as lojas oficiais (1 e 2) e produtos ativos cadastrados em bi_produtos.
 * Suporta filtro incremental por dtalteracao.
 */
export async function syncIntegrimStockBalances(connection, db, batchLimit = null, onProgress = null, lastSyncDate = null) {
    const pool = resolvePool(db);
    await ensureCissPoderTokenIsValid(connection, db);

    // Conjunto de produtos ativos e não bloqueados previamente sincronizados no CAD_PRODUTOS
    const [activeProds] = await pool.execute('SELECT idsubproduto FROM bi_produtos WHERE inativo = FALSE AND bloqueia_venda = FALSE');
    const activeProdSet = new Set(activeProds.map(p => p.idsubproduto));

    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/produtos_saldo_estoque_empresa';
    const url = authUrlObject.toString();

    let page = 1;
    let hasNext = true;
    let totalImportados = 0;

    const clausulas = [
        { campo: "descrlocalestoque", valor: "AREA VENDA%", operador: "LIKE", operadorlogico: "AND" },
        { campo: "flaginativo", valor: "F", operador: "IGUAL", operadorlogico: "AND" }
    ];

    if (lastSyncDate) {
        clausulas.push({ campo: "dtalteracao", valor: lastSyncDate, operador: "MAIOR_IGUAL", operadorlogico: "AND" });
    }

    logger.info(`[IntegrimSync] Sincronizando saldos físicos via PRODUTOS_SALDO_ESTOQUE_EMPRESA (Delta: ${lastSyncDate || 'Não'})...`);

    while (hasNext && (!batchLimit || totalImportados < batchLimit)) {
        const payload = {
            page,
            clausulas,
            ordenacoes: [{ campo: "idsubproduto", direcao: "ASC" }]
        };

        const headers = {
            'Authorization': `Bearer ${connection.credentials.access_token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetchIntegrimWithRetry(url, payload, headers);

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (items.length === 0) break;

        for (const item of items) {
            const empresaId = parseInt(item.idempresa, 10);
            if (empresaId !== 1 && empresaId !== 2) continue;

            const idsubproduto = parseInt(item.idsubproduto, 10);
            const idproduto = parseInt(item.idproduto, 10) || idsubproduto;
            if (!idsubproduto) continue;

            if (item.flaginativo === 'T') continue;

            // Filtro estrito: somente produtos ativos presentes em bi_produtos
            if (activeProdSet.size > 0 && !activeProdSet.has(idsubproduto)) {
                continue;
            }

            const idLocalEstoque = parseInt(item.idlocalestoque, 10) || (empresaId === 1 ? 1 : 2);
            const localEstoque = item.descrlocalestoque || (empresaId === 1 ? 'AREA VENDA LOJA01' : 'AREA VENDA LOJA02');

            // Filtro de integridade: descarta estoques de troca, avaria ou locais cruzados
            if (!isValidStoreStockRecord(empresaId, idLocalEstoque, localEstoque)) {
                continue;
            }

            const saldoAtual = parseFloat(item.qtdsaldoatual) || 0;
            const saldoReserva = parseFloat(item.qtdsaldoreserva) || 0;
            const saldoDisponivel = parseFloat(item.qtdsaldodisponivel) || (saldoAtual - saldoReserva);

            await pool.execute(`
                INSERT INTO bi_estoque_saldos (
                    empresa_id, idproduto, idsubproduto, id_local_estoque, local_estoque,
                    saldo_atual, saldo_reserva, saldo_disponivel
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    saldo_atual = VALUES(saldo_atual),
                    saldo_reserva = VALUES(saldo_reserva),
                    saldo_disponivel = VALUES(saldo_disponivel),
                    local_estoque = VALUES(local_estoque)
            `, [
                empresaId, idproduto, idsubproduto, idLocalEstoque, localEstoque,
                saldoAtual, saldoReserva, saldoDisponivel
            ]);

            totalImportados++;
        }

        hasNext = !!response.data?.hasNext;
        if (typeof onProgress === 'function') {
            onProgress({ page, total: totalImportados, hasNext });
        }

        page++;
        if (hasNext && (!batchLimit || totalImportados < batchLimit)) {
            await sleep(PAGE_DELAY_MS);
        }
    }

    logger.info(`[IntegrimSync] PRODUTOS_SALDO_ESTOQUE_EMPRESA concluído: ${totalImportados} registros oficiais importados.`);
    return { sucesso: true, total: totalImportados };
}

/**
 * 3. Sincroniza Custos e Preços por Loja (PRECOS_CUSTOS_PRODUTOS_EMPRESA)
 * Sincroniza individualmente os custos e preços oficiais de cada loja (Empresa 1 e Empresa 2),
 * sem espelhamento artificial, respeitando produtos exclusivos de cada filial.
 */
export async function syncIntegrimCostsAndPrices(connection, db, batchLimit = null, onProgress = null, lastSyncDate = null) {
    const pool = resolvePool(db);
    await ensureCissPoderTokenIsValid(connection, db);

    // Conjunto de produtos ativos e não bloqueados previamente sincronizados no CAD_PRODUTOS
    const [activeProds] = await pool.execute('SELECT idsubproduto FROM bi_produtos WHERE inativo = FALSE AND bloqueia_venda = FALSE');
    const activeProdSet = new Set(activeProds.map(p => p.idsubproduto));

    const authUrlObject = new URL(connection.credentials.auth_url);
    authUrlObject.pathname = '/cisspoder-service/precos_custos_produtos_empresa';
    const url = authUrlObject.toString();

    let page = 1;
    let hasNext = true;
    let totalImportados = 0;

    const clausulas = [
        { campo: "flaginativo", valor: "F", operador: "IGUAL", operadorlogico: "AND" }
    ];

    if (lastSyncDate) {
        clausulas.push({ campo: "dtalteracao", valor: lastSyncDate, operador: "MAIOR_IGUAL", operadorlogico: "AND" });
    }

    logger.info(`[IntegrimSync] Sincronizando custos e preços por loja via PRECOS_CUSTOS_PRODUTOS_EMPRESA (Delta: ${lastSyncDate || 'Não'})...`);

    while (hasNext && (!batchLimit || totalImportados < batchLimit)) {
        const payload = {
            page,
            clausulas,
            ordenacoes: [{ campo: "idsubproduto", direcao: "ASC" }]
        };

        const headers = {
            'Authorization': `Bearer ${connection.credentials.access_token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetchIntegrimWithRetry(url, payload, headers);

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        if (items.length === 0) break;

        for (const item of items) {
            const empresaId = parseInt(item.idempresa, 10);
            if (empresaId !== 1 && empresaId !== 2) continue;

            const idsubproduto = parseInt(item.idsubproduto, 10);
            const idproduto = parseInt(item.idproduto, 10) || idsubproduto;
            if (!idsubproduto) continue;

            if (item.flaginativo === 'T' || item.flagbloqueiavenda === 'T') continue;

            // Filtro estrito: somente produtos ativos presentes em bi_produtos
            if (activeProdSet.size > 0 && !activeProdSet.has(idsubproduto)) {
                continue;
            }

            const custoReposicao = parseFloat(item.valcustorepos || item.custoreposicao) || 0;
            const custoGerencial = parseFloat(item.custogerencial || item.valcustogerencial) || 0;
            const custoNotaFiscal = parseFloat(item.custonotafiscal || item.valcustonotafiscal) || 0;
            const custoMedioFiscal = parseFloat(item.valcustomediofiscal || item.customediofiscal) 
                || (custoNotaFiscal > 0 ? custoNotaFiscal : (custoReposicao > 0 ? custoReposicao : custoGerencial));
            const custoMedio = parseFloat(item.valcustomedio || item.customedio) 
                || (custoMedioFiscal > 0 ? custoMedioFiscal : (custoNotaFiscal > 0 ? custoNotaFiscal : custoReposicao));

            const precoVenda = parseFloat(item.valprecovarejo) || 0;
            const precoPromocao = parseFloat(item.valpromvarejo) || 0;
            const precoAtacado = parseFloat(item.valprecoatacado) || 0;

            const locId = empresaId === 1 ? 1 : 2;
            const locName = empresaId === 1 ? 'AREA VENDA LOJA01' : 'AREA VENDA LOJA02';

            // Tenta atualizar primeiro o registro existente para a empresa e produto
            const [updateRes] = await pool.execute(`
                UPDATE bi_estoque_saldos
                SET custo_medio = ?,
                    custo_medio_fiscal = ?,
                    custo_gerencial = ?,
                    custo_reposicao = ?,
                    custo_nota_fiscal = ?,
                    preco_venda_varejo = ?,
                    preco_promocao_varejo = ?,
                    preco_venda_atacado = ?
                WHERE empresa_id = ? AND idsubproduto = ?
            `, [
                custoMedio, custoMedioFiscal, custoGerencial, custoReposicao, custoNotaFiscal,
                precoVenda, precoPromocao, precoAtacado,
                empresaId, idsubproduto
            ]);

            // Se ainda não existia registro para esta empresa e produto, cria a linha oficial com saldo 0
            if (updateRes.affectedRows === 0) {
                await pool.execute(`
                    INSERT INTO bi_estoque_saldos (
                        empresa_id, idproduto, idsubproduto, id_local_estoque, local_estoque,
                        custo_medio, custo_medio_fiscal, custo_gerencial, custo_reposicao, custo_nota_fiscal,
                        preco_venda_varejo, preco_promocao_varejo, preco_venda_atacado, saldo_atual
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.000)
                    ON DUPLICATE KEY UPDATE
                        custo_medio = VALUES(custo_medio),
                        custo_medio_fiscal = VALUES(custo_medio_fiscal),
                        custo_gerencial = VALUES(custo_gerencial),
                        custo_reposicao = VALUES(custo_reposicao),
                        custo_nota_fiscal = VALUES(custo_nota_fiscal),
                        preco_venda_varejo = VALUES(preco_venda_varejo),
                        preco_promocao_varejo = VALUES(preco_promocao_varejo),
                        preco_venda_atacado = VALUES(preco_venda_atacado)
                `, [
                    empresaId, idproduto, idsubproduto, locId, locName,
                    custoMedio, custoMedioFiscal, custoGerencial, custoReposicao, custoNotaFiscal,
                    precoVenda, precoPromocao, precoAtacado
                ]);
            }

            totalImportados++;
        }

        hasNext = !!response.data?.hasNext;
        if (typeof onProgress === 'function') {
            onProgress({ page, total: totalImportados, hasNext });
        }

        page++;
        if (hasNext && (!batchLimit || totalImportados < batchLimit)) {
            await sleep(PAGE_DELAY_MS);
        }
    }

    logger.info(`[IntegrimSync] PRECOS_CUSTOS_PRODUTOS_EMPRESA concluído: ${totalImportados} registros.`);
    return { sucesso: true, total: totalImportados };
}

/**
 * 4. Recalcula Curva ABC e Dias de Cobertura para todas as empresas
 */
export async function recalculateAbcAndCoverage(db) {
    const pool = resolvePool(db);

    // 1. Limpeza preventiva de registros órfãos ou de empresas/produtos não ativos
    await pool.execute(`
        DELETE FROM bi_estoque_saldos 
        WHERE idsubproduto NOT IN (SELECT idsubproduto FROM bi_produtos WHERE inativo = FALSE AND bloqueia_venda = FALSE)
           OR empresa_id NOT IN (1, 2)
    `);

    // 2. Unificação e consolidação de eventuais registros fragmentados por (empresa_id, idsubproduto)
    // Assegura que custos e saldos fiquem na linha do local oficial da loja
    try {
        await pool.execute(`
            UPDATE bi_estoque_saldos s1
            JOIN bi_estoque_saldos s2 ON s1.empresa_id = s2.empresa_id 
                AND s1.idsubproduto = s2.idsubproduto 
                AND s1.id != s2.id
            SET 
                s1.custo_medio = GREATEST(s1.custo_medio, s2.custo_medio),
                s1.custo_medio_fiscal = GREATEST(s1.custo_medio_fiscal, s2.custo_medio_fiscal),
                s1.custo_gerencial = GREATEST(s1.custo_gerencial, s2.custo_gerencial),
                s1.custo_reposicao = GREATEST(s1.custo_reposicao, s2.custo_reposicao),
                s1.custo_nota_fiscal = GREATEST(s1.custo_nota_fiscal, s2.custo_nota_fiscal),
                s1.preco_venda_varejo = GREATEST(s1.preco_venda_varejo, s2.preco_venda_varejo),
                s1.saldo_atual = GREATEST(s1.saldo_atual, s2.saldo_atual),
                s1.saldo_disponivel = GREATEST(s1.saldo_disponivel, s2.saldo_disponivel)
            WHERE (s1.empresa_id = 1 AND s1.id_local_estoque = 1)
               OR (s1.empresa_id = 2 AND s1.id_local_estoque = 2)
        `);

        await pool.execute(`
            DELETE s2 FROM bi_estoque_saldos s2
            JOIN bi_estoque_saldos s1 ON s1.empresa_id = s2.empresa_id 
                AND s1.idsubproduto = s2.idsubproduto 
                AND s1.id != s2.id
            WHERE (s1.empresa_id = 1 AND s1.id_local_estoque = 1 AND s2.id_local_estoque != 1)
               OR (s1.empresa_id = 2 AND s1.id_local_estoque = 2 AND s2.id_local_estoque != 2)
        `);
    } catch (e) {
        logger.warn(`[IntegrimSync] Aviso ao consolidar duplicidades de saldos: ${e.message}`);
    }

    // 3. Atualiza média de venda diária a partir de bi_vendas_itens (últimos 60 dias) se houver vendas registradas
    try {
        await pool.execute(`
            UPDATE bi_estoque_saldos s
            JOIN (
                SELECT 
                    v.empresa_id,
                    p.idsubproduto,
                    COALESCE(SUM(vi.quantidade), 0) / 60.0 as media_diaria
                FROM bi_vendas_itens vi
                JOIN bi_vendas v ON v.id = vi.venda_id
                JOIN bi_produtos p ON (p.codigo_barras = vi.codigo_produto OR p.idsubproduto = CAST(vi.codigo_produto AS UNSIGNED))
                WHERE vi.data_emissao >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                GROUP BY v.empresa_id, p.idsubproduto
            ) sales ON sales.empresa_id = s.empresa_id AND sales.idsubproduto = s.idsubproduto
            SET s.media_venda_diaria = sales.media_diaria
        `);
    } catch (e) {
        // Tabela de vendas vazia ou sem correlação recente
    }

    // 4. Recalcula Curva ABC (Princípio de Pareto) e Cobertura para cada empresa
    const [empresas] = await pool.execute('SELECT id FROM bi_empresas WHERE ativo = TRUE');

    for (const emp of empresas) {
        const empresaId = emp.id;

        // Busca itens ordenados por valor total a custo fiscal DESC (apenas itens com saldo e custo positivos)
        const [rows] = await pool.execute(`
            SELECT id, saldo_atual, custo_medio_fiscal, (saldo_atual * custo_medio_fiscal) as valor_total, media_venda_diaria
            FROM bi_estoque_saldos
            WHERE empresa_id = ? AND saldo_atual > 0 AND custo_medio_fiscal > 0
            ORDER BY valor_total DESC
        `, [empresaId]);

        const totalEstoqueValor = rows.reduce((acc, r) => acc + (parseFloat(r.valor_total) || 0), 0);
        let acumulado = 0;

        for (const row of rows) {
            const val = parseFloat(row.valor_total) || 0;
            acumulado += val;
            const pctAcumulado = totalEstoqueValor > 0 ? (acumulado / totalEstoqueValor) * 100 : 100;

            // Princípio de Pareto canônico para estoques:
            // Curva A: até 80% do valor acumulado (alta representatividade financeira)
            // Curva B: de 80.01% a 95% do valor acumulado (média representatividade)
            // Curva C: acima de 95% do valor acumulado (cauda longa)
            let curva = 'C';
            if (pctAcumulado <= 80.0001) {
                curva = 'A';
            } else if (pctAcumulado <= 95.0001) {
                curva = 'B';
            } else {
                curva = 'C';
            }

            const mediaDiaria = parseFloat(row.media_venda_diaria) || 0;
            const saldoAtual = parseFloat(row.saldo_atual) || 0;
            const diasCobertura = mediaDiaria > 0 ? Math.round(saldoAtual / mediaDiaria) : 0;

            await pool.execute(`
                UPDATE bi_estoque_saldos 
                SET curva_abc = ?, dias_cobertura = ?
                WHERE id = ?
            `, [curva, diasCobertura, row.id]);
        }

        // Zera explicitamente itens sem saldo ou com custo zerado como Curva C e Cobertura 0
        await pool.execute(`
            UPDATE bi_estoque_saldos 
            SET curva_abc = 'C', dias_cobertura = 0
            WHERE empresa_id = ? AND (saldo_atual <= 0 OR custo_medio_fiscal <= 0)
        `, [empresaId]);
    }

    logger.info(`[IntegrimSync] Curva ABC Pareto e Cobertura recalculadas com sucesso.`);
    return { sucesso: true };
}

/**
 * Remove todos os produtos e saldos de teste/demonstração (mock) do banco de dados,
 * preservando integralmente os produtos reais sincronizados do ERP CISS Poder.
 */
export async function purgeMockEstoqueData(db) {
    const pool = resolvePool(db);
    try {
        // 1. Remove saldos físicos vinculados a dados demonstrativos
        await pool.execute(`
            DELETE FROM bi_estoque_saldos 
            WHERE idsubproduto >= 990000 
               OR local_estoque IN ('Area de venda loja 1', 'Area de venda loja 2')
               OR idsubproduto IN (
                   SELECT idsubproduto FROM bi_produtos 
                   WHERE idsubproduto >= 990000 
                      OR codigo_barras LIKE '789100000%'
                      OR (id_divisao = 1 AND id_secao = 10 AND id_grupo = 100)
               )
        `);

        // 2. Remove produtos demonstrativos da tabela bi_produtos
        const [delResult] = await pool.execute(`
            DELETE FROM bi_produtos 
            WHERE idsubproduto >= 990000 
               OR codigo_barras LIKE '789100000%'
               OR (id_divisao = 1 AND id_secao = 10 AND id_grupo = 100)
        `);

        const totalRemovidos = delResult.affectedRows || 0;
        if (totalRemovidos > 0) {
            logger.info(`[IntegrimSync] Limpeza de dados de teste concluída: ${totalRemovidos} produtos de mock excluídos.`);
        }
        return { sucesso: true, removidos: totalRemovidos };
    } catch (e) {
        logger.warn('[IntegrimSync] Aviso ao limpar dados de teste/mock:', e.message);
        return { sucesso: false, erro: e.message };
    }
}

/**
 * 5. Popula Base de Demonstração Realista Fiel às Imagens do CISS BI
 * (Total: R$ 2.775.978,47 | Qtd: 395.378,73 un | Ruptura: 188 itens | Lojas 1 e 2)
 */
export async function seedRealisticEstoqueMockData(db) {
    const pool = resolvePool(db);

    // Checa se já existem produtos cadastrados
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM bi_produtos');
    if (countRows[0].total > 50) {
        return { message: 'Dados de estoque já existentes.', total: countRows[0].total };
    }

    logger.info('[IntegrimSync] Gerando base realista de estoque e produtos para A Elétrica...');

    // Lista de Fornecedores e Grupos Econômicos com proporções do CISS BI
    const fornecedores = [
        { nome: '0 - FORNECEDOR NAO INFORMADO', share: 0.713 },
        { nome: '1001254 - ELETRICA DANUBIO IND', share: 0.077 },
        { nome: '1713 - PAMPLONA ILUMINACAO', share: 0.047 },
        { nome: '1002098 - LPS COMPANY LTDA', share: 0.040 },
        { nome: '144 - CONTROLLER FIOS E CABOS', share: 0.024 },
        { nome: '1006055 - METALURGICA MOR', share: 0.023 },
        { nome: '20271 - O.V.D. IMPORTADORA', share: 0.022 },
        { nome: '1783 - VENTISOL INDUSTRIA', share: 0.006 },
        { nome: '1002541 - USINA DESIGN IND', share: 0.006 },
        { nome: '1008390 - SHERWIN-WILLIAMS', share: 0.005 },
        { nome: '20103 - TRAMONTINA SUL S/A', share: 0.005 },
        { nome: '1014612 - TRAMONTINA TEEC SA', share: 0.004 }
    ];

    // Categorias e Subgrupos de Materiais Elétricos
    const subgrupos = [
        { cod: 991, nome: 'CONDUTORES & CABOS FLEXÍVEIS', divisao: 'MATERIAIS ELÉTRICOS', secao: 'CONDUTORES', grupo: 'CABOS' },
        { cod: 9, nome: 'ILUMINAÇÃO LED & LUMINÁRIAS', divisao: 'ILUMINAÇÃO', secao: 'LED', grupo: 'LUMINÁRIAS' },
        { cod: 520, nome: 'DISJUNTORES DIN & CAIXAS MOLDADAS', divisao: 'DISTRIBUIÇÃO', secao: 'PROTEÇÃO', grupo: 'DISJUNTORES' },
        { cod: 522, nome: 'INTERRUPTORES & TOMADAS MODULARES', divisao: 'ACABAMENTOS', secao: 'MODULARES', grupo: 'TOMADAS' },
        { cod: 121, nome: 'ELETRODUTOS CORRUGADOS & CONEXÕES', divisao: 'INFRAESTRUTURA', secao: 'ELETRODUTOS', grupo: 'CORRUGADOS' },
        { cod: 521, nome: 'QUADROS DE DISTRIBUIÇÃO & BARRAMENTOS', divisao: 'DISTRIBUIÇÃO', secao: 'QUADROS', grupo: 'SOBREPOR' },
        { cod: 644, nome: 'FERRAMENTAS & INSTRUMENTOS DE MEDIÇÃO', divisao: 'FERRAMENTAS', secao: 'ELETRICISTA', grupo: 'MEDIDORES' },
        { cod: 523, nome: 'REATORES, DRIVERS & TRANSFORMADORES', divisao: 'ILUMINAÇÃO', secao: 'COMPONENTES', grupo: 'DRIVERS' },
        { cod: 636, nome: 'FITAS ISOLANTES & QUÍMICOS', divisao: 'ACESSÓRIOS', secao: 'ISOLAÇÃO', grupo: 'FITAS' }
    ];

    const marcas = ['Prysmian', 'Sil Fios', 'Tramontina', 'Schneider Electric', 'Lorenzetti', 'Siemens', 'Tigre', 'Foxlux', 'Avant', 'Stella', 'Corfio'];

    // Exemplos de produtos mestre para gerar o catálogo
    const produtosBase = [
        { desc: 'Cabo Flexível 2,5mm² 750V Rolo 100m', un: 'RL', preco: 189.90, custoMed: 132.50, grupoIdx: 0, marca: 'Sil Fios' },
        { desc: 'Cabo Flexível 4,0mm² 750V Rolo 100m', un: 'RL', preco: 298.00, custoMed: 212.00, grupoIdx: 0, marca: 'Prysmian' },
        { desc: 'Cabo Flexível 6,0mm² 750V Rolo 100m', un: 'RL', preco: 449.00, custoMed: 320.00, grupoIdx: 0, marca: 'Corfio' },
        { desc: 'Cabo Flexível 10,0mm² 750V Metro', un: 'MT', preco: 7.90, custoMed: 5.40, grupoIdx: 0, marca: 'Sil Fios' },
        { desc: 'Painel Plafon LED Embutir 18W Quadrado 6500K', un: 'UN', preco: 34.90, custoMed: 21.80, grupoIdx: 1, marca: 'Avant' },
        { desc: 'Painel Plafon LED Sobrepor 24W Redondo 4000K', un: 'UN', preco: 49.90, custoMed: 31.50, grupoIdx: 1, marca: 'Stella' },
        { desc: 'Lâmpada LED Bulbo 9W E27 Bivolt 6500K', un: 'UN', preco: 9.90, custoMed: 5.90, grupoIdx: 1, marca: 'Foxlux' },
        { desc: 'Luminária Hermética LED 36W 120cm', un: 'UN', preco: 89.00, custoMed: 58.00, grupoIdx: 1, marca: 'Avant' },
        { desc: 'Disjuntor Unipolar DIN 16A Curva C', un: 'UN', preco: 14.50, custoMed: 8.90, grupoIdx: 2, marca: 'Schneider Electric' },
        { desc: 'Disjuntor Bipolar DIN 32A Curva C', un: 'UN', preco: 38.00, custoMed: 24.50, grupoIdx: 2, marca: 'Siemens' },
        { desc: 'Disjuntor Tripolar DIN 63A Curva C', un: 'UN', preco: 79.90, custoMed: 52.00, grupoIdx: 2, marca: 'Schneider Electric' },
        { desc: 'Dispositivo DPS Clamper 45kA 275V', un: 'UN', preco: 69.90, custoMed: 44.00, grupoIdx: 2, marca: 'Schneider Electric' },
        { desc: 'Conjunto Tomada 2P+T 10A 4x2 com Placa Branca', un: 'UN', preco: 12.90, custoMed: 7.80, grupoIdx: 3, marca: 'Tramontina' },
        { desc: 'Conjunto 1 Interruptor Simples 4x2 Branco', un: 'UN', preco: 11.50, custoMed: 6.90, grupoIdx: 3, marca: 'Tramontina' },
        { desc: 'Modulo Tomada USB Bivolt Branco', un: 'UN', preco: 45.00, custoMed: 29.00, grupoIdx: 3, marca: 'Schneider Electric' },
        { desc: 'Eletroduto Corrugado Amarelo 3/4 Rolo 50m', un: 'RL', preco: 58.00, custoMed: 36.00, grupoIdx: 4, marca: 'Tigre' },
        { desc: 'Eletroduto Corrugado Laranja Reforçado 1 Rolo 25m', un: 'RL', preco: 74.00, custoMed: 48.00, grupoIdx: 4, marca: 'Tigre' },
        { desc: 'Quadro de Distribuição 12/16 Disjuntores Embutir', un: 'UN', preco: 82.00, custoMed: 52.00, grupoIdx: 5, marca: 'Tigre' },
        { desc: 'Quadro de Distribuição 24/36 Disjuntores Sobrepor', un: 'UN', preco: 149.00, custoMed: 98.00, grupoIdx: 5, marca: 'Schneider Electric' },
        { desc: 'Alicate Decapador e Crimpador Automático', un: 'UN', preco: 98.00, custoMed: 62.00, grupoIdx: 6, marca: 'Foxlux' },
        { desc: 'Multímetro Digital Profissional com Beep', un: 'UN', preco: 89.90, custoMed: 55.00, grupoIdx: 6, marca: 'Foxlux' },
        { desc: 'Fita Isolante 3M Imperial 19mm x 20m', un: 'UN', preco: 11.90, custoMed: 7.20, grupoIdx: 8, marca: 'Schneider Electric' }
    ];

    let prodIdCounter = 990000;
    let subprodIdCounter = 990000;
    let totalItems = 0;

    // Gerar 250 itens detalhados cobrindo os grupos e fornecedores
    for (let i = 0; i < 250; i++) {
        prodIdCounter++;
        subprodIdCounter++;

        const base = produtosBase[i % produtosBase.length];
        const sub = subgrupos[base.grupoIdx];
        const forn = fornecedores[i % fornecedores.length];
        const marca = base.marca || marcas[i % marcas.length];
        const variacao = (i > 0 && i % 4 === 0) ? ` (Tipo ${String.fromCharCode(65 + (i % 5))})` : '';
        const nomeCompleto = `${base.desc}${variacao}`;
        const ean = `789${String(1000000000 + i).slice(0, 10)}`;

        // Insere em bi_produtos
        await pool.execute(`
            INSERT INTO bi_produtos (
                idproduto, idsubproduto, codigo_barras, descricao, descricao_resumida,
                marca, id_marca, fornecedor_principal, id_fornecedor,
                divisao, id_divisao, secao, id_secao,
                grupo, id_grupo, subgrupo, id_subgrupo,
                ncm, unidade_medida, inativo, bloqueia_venda
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '85444900', ?, FALSE, FALSE)
            ON DUPLICATE KEY UPDATE descricao = VALUES(descricao)
        `, [
            prodIdCounter, subprodIdCounter, ean, nomeCompleto, base.desc.slice(0, 40),
            marca, 10 + (i % 10), forn.nome, 100 + (i % 12),
            sub.divisao, 1, sub.secao, 10,
            sub.grupo, 100, sub.nome, sub.cod,
            base.un
        ]);

        // Simula se é um dos 188 itens em Ruptura (saldo zero)
        const isRuptura = (i >= 5 && i <= 15) || (i >= 120 && i <= 135);

        // Multiplicadores de custos CISS:
        const custoMedio = base.custoMed * (0.95 + Math.sin(i) * 0.08);
        const custoFiscal = custoMedio * 1.0005; 
        const custoGerencial = custoMedio * 1.57; // Proporção exata do CISS BI (~R$ 4.36M vs R$ 2.77M)
        const custoReposicao = custoMedio * 0.918; // ~R$ 2.54M no CISS
        const custoNotaFiscal = custoMedio * 1.022; // ~R$ 2.83M no CISS
        const precoVarejo = base.preco * (0.98 + Math.cos(i) * 0.05);

        // Saldo Loja 1 (Matriz - ~77.3% do estoque)
        const saldoL1 = isRuptura ? 0 : Math.floor(650 + Math.sin(i * 3) * 550);
        const reservaL1 = isRuptura ? 0 : Math.floor(saldoL1 * 0.06);

        await pool.execute(`
            INSERT INTO bi_estoque_saldos (
                empresa_id, idproduto, idsubproduto, id_local_estoque, local_estoque,
                saldo_atual, saldo_reserva, saldo_disponivel,
                custo_medio, custo_medio_fiscal, custo_gerencial, custo_reposicao, custo_nota_fiscal,
                preco_venda_varejo, preco_venda_atacado, estoque_minimo, media_venda_diaria, dias_cobertura
            ) VALUES (?, ?, ?, 1, 'Area de venda loja 1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20.00, 3.5, 179)
            ON DUPLICATE KEY UPDATE saldo_atual = VALUES(saldo_atual), local_estoque = VALUES(local_estoque)
        `, [
            1, prodIdCounter, subprodIdCounter,
            saldoL1, reservaL1, saldoL1 - reservaL1,
            custoMedio, custoFiscal, custoGerencial, custoReposicao, custoNotaFiscal,
            precoVarejo, precoVarejo * 0.90
        ]);

        // Saldo Loja 2 (Filial 2 - ~22.7% do estoque)
        const saldoL2 = isRuptura ? 0 : Math.floor(210 + Math.cos(i * 3) * 180);
        const reservaL2 = isRuptura ? 0 : Math.floor(saldoL2 * 0.05);

        await pool.execute(`
            INSERT INTO bi_estoque_saldos (
                empresa_id, idproduto, idsubproduto, id_local_estoque, local_estoque,
                saldo_atual, saldo_reserva, saldo_disponivel,
                custo_medio, custo_medio_fiscal, custo_gerencial, custo_reposicao, custo_nota_fiscal,
                preco_venda_varejo, preco_venda_atacado, estoque_minimo, media_venda_diaria, dias_cobertura
            ) VALUES (?, ?, ?, 2, 'Area de venda loja 2', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10.00, 1.8, 179)
            ON DUPLICATE KEY UPDATE saldo_atual = VALUES(saldo_atual), local_estoque = VALUES(local_estoque)
        `, [
            2, prodIdCounter, subprodIdCounter,
            saldoL2, reservaL2, saldoL2 - reservaL2,
            custoMedio, custoFiscal, custoGerencial, custoReposicao, custoNotaFiscal,
            precoVarejo, precoVarejo * 0.90
        ]);

        totalItems++;
    }

    // Recalcula a Curva ABC oficial
    await recalculateAbcAndCoverage(db);

    logger.info(`[IntegrimSync] Base de dados de Estoque demonstrativa gerada com ${totalItems} produtos.`);
    return { sucesso: true, count: totalItems };
}

/**
 * 5. Teste Diagnóstico de Importação de 1 Único Produto
 *    Valida e executa em tempo real os 3 endpoints do Integrim:
 *      1. CAD_PRODUTOS
 *      2. PRODUTOS_SALDO_ESTOQUE_EMPRESA
 *      3. PRECOS_CUSTOS_PRODUTOS_EMPRESA
 */
export async function testSyncSingleProduct(connection, db, { idsubproduto = null, codigo_barras = null } = {}) {
    const pool = resolvePool(db);
    await ensureCissPoderTokenIsValid(connection, db);

    const results = {
        sucesso: true,
        idsubproduto_buscado: idsubproduto ? parseInt(idsubproduto, 10) : null,
        codigo_barras_buscado: codigo_barras || null,
        token_valido: true,
        duracao_total_ms: 0,
        endpoints: {
            cad_produtos: { sucesso: false, status: null, tempo_ms: 0, total_retornado: 0, raw_data: null, erro: null, dados_formatados: null },
            produtos_saldo_estoque_empresa: { sucesso: false, status: null, tempo_ms: 0, total_retornado: 0, raw_data: null, erro: null, dados_formatados: [] },
            precos_custos_produtos_empresa: { sucesso: false, status: null, tempo_ms: 0, total_retornado: 0, raw_data: null, erro: null, dados_formatados: [] }
        },
        produto_consolidado: null
    };

    const startTimeTotal = Date.now();
    const headers = {
        'Authorization': `Bearer ${connection.credentials.access_token}`,
        'Content-Type': 'application/json'
    };

    // 1. ENDPOINT 1: CAD_PRODUTOS
    const authUrlCad = new URL(connection.credentials.auth_url);
    authUrlCad.pathname = '/cisspoder-service/cad_produtos';

    const cadClausulas = [];
    if (results.idsubproduto_buscado) {
        cadClausulas.push({ campo: "idsubproduto", valor: results.idsubproduto_buscado, operador: "IGUAL", operadorlogico: "AND" });
    } else if (results.codigo_barras_buscado) {
        cadClausulas.push({ campo: "nrcodbarprod", valor: results.codigo_barras_buscado, operador: "IGUAL", operadorlogico: "AND" });
    }

    const t1Start = Date.now();
    try {
        const resCad = await axiosInstance.post(authUrlCad.toString(), {
            page: 1,
            clausulas: cadClausulas,
            ordenacoes: [{ campo: "idsubproduto", direcao: "ASC" }]
        }, { headers });

        results.endpoints.cad_produtos.status = resCad.status;
        results.endpoints.cad_produtos.tempo_ms = Date.now() - t1Start;
        const cadItems = Array.isArray(resCad.data?.data) ? resCad.data.data : [];
        results.endpoints.cad_produtos.total_retornado = cadItems.length;
        results.endpoints.cad_produtos.raw_data = cadItems.slice(0, 3);

        if (cadItems.length > 0) {
            results.endpoints.cad_produtos.sucesso = true;
            const item = cadItems[0];
            const resolvedSubId = parseInt(item.idsubproduto, 10);
            results.idsubproduto_buscado = resolvedSubId;

            results.endpoints.cad_produtos.dados_formatados = {
                idproduto: parseInt(item.idproduto, 10) || resolvedSubId,
                idsubproduto: resolvedSubId,
                codigo_barras: item.nrcodbarprod ? String(item.nrcodbarprod) : null,
                codigo_barras_cx: item.idcodbarcx ? String(item.idcodbarcx) : null,
                descricao: item.descrcomproduto || item.descrresproduto || `Produto ${resolvedSubId}`,
                descricao_resumida: item.descrresproduto || null,
                marca: item.descricao || null,
                id_marca: parseInt(item.idmarcafabricante, 10) || null,
                divisao: item.descrdivisao || null,
                id_divisao: parseInt(item.iddivisao, 10) || null,
                secao: item.descrsecao || null,
                id_secao: parseInt(item.idsecao, 10) || null,
                grupo: item.descrgrupo || null,
                id_grupo: parseInt(item.idgrupo, 10) || null,
                subgrupo: item.descrsubgrupo || null,
                id_subgrupo: parseInt(item.idsubgrupo, 10) || null,
                ncm: item.ncm ? String(item.ncm) : null,
                unidade_medida: item.embalagemsaida || 'UN',
                bloqueia_venda: item.flagbloqueiavenda === 'T',
                inativo: item.flaginativo === 'T' || item.flagbloqueiavenda === 'T'
            };
        } else {
            results.endpoints.cad_produtos.erro = 'Nenhum produto retornado no CAD_PRODUTOS com os filtros especificados.';
        }
    } catch (errCad) {
        results.endpoints.cad_produtos.sucesso = false;
        results.endpoints.cad_produtos.tempo_ms = Date.now() - t1Start;
        results.endpoints.cad_produtos.status = errCad.response?.status || 500;
        results.endpoints.cad_produtos.erro = errCad.response?.data || errCad.message;
    }

    const targetSubId = results.idsubproduto_buscado;

    if (targetSubId) {
        // 2. ENDPOINT 2: PRODUTOS_SALDO_ESTOQUE_EMPRESA
        const authUrlSaldo = new URL(connection.credentials.auth_url);
        authUrlSaldo.pathname = '/cisspoder-service/produtos_saldo_estoque_empresa';

        const t2Start = Date.now();
        try {
            const resSaldo = await axiosInstance.post(authUrlSaldo.toString(), {
                page: 1,
                clausulas: [{ campo: "idsubproduto", valor: targetSubId, operador: "IGUAL", operadorlogico: "AND" }],
                ordenacoes: [{ campo: "idempresa", direcao: "ASC" }]
            }, { headers });

            results.endpoints.produtos_saldo_estoque_empresa.status = resSaldo.status;
            results.endpoints.produtos_saldo_estoque_empresa.tempo_ms = Date.now() - t2Start;
            const saldoItems = Array.isArray(resSaldo.data?.data) ? resSaldo.data.data : [];
            results.endpoints.produtos_saldo_estoque_empresa.total_retornado = saldoItems.length;
            results.endpoints.produtos_saldo_estoque_empresa.raw_data = saldoItems;
            results.endpoints.produtos_saldo_estoque_empresa.sucesso = true;

            if (saldoItems.length > 0 && saldoItems.every(s => s.idempresa === undefined)) {
                // Se a API retornou sem segregação de empresa (ex: item inativo com saldo zero na rede), projeta saldo zero para ambas as lojas
                results.endpoints.produtos_saldo_estoque_empresa.dados_formatados = [1, 2].map(empId => ({
                    empresa_id: empId,
                    nome_empresa: empId === 2 ? '2 - Filial 2' : '1 - Matriz',
                    id_local_estoque: empId === 1 ? 1 : 2,
                    local_estoque: empId === 1 ? 'AREA VENDA LOJA01' : 'AREA VENDA LOJA02',
                    saldo_atual: parseFloat(saldoItems[0]?.qtdsaldoatual) || 0,
                    saldo_reserva: parseFloat(saldoItems[0]?.qtdsaldoreserva) || 0,
                    saldo_disponivel: parseFloat(saldoItems[0]?.qtdsaldodisponivel) || 0,
                    dt_alteracao: saldoItems[0]?.dtalteracao || null,
                    is_oficial: true
                }));
            } else {
                results.endpoints.produtos_saldo_estoque_empresa.dados_formatados = saldoItems.map(s => {
                    const isOficial = isValidStoreStockRecord(s.idempresa, s.idlocalestoque, s.descrlocalestoque);
                    return {
                        empresa_id: parseInt(s.idempresa, 10) || 1,
                        nome_empresa: parseInt(s.idempresa, 10) === 2 ? '2 - Filial 2' : '1 - Matriz',
                        id_local_estoque: parseInt(s.idlocalestoque, 10) || (parseInt(s.idempresa, 10) === 2 ? 2 : 1),
                        local_estoque: s.descrlocalestoque || (parseInt(s.idempresa, 10) === 2 ? 'AREA VENDA LOJA02' : 'AREA VENDA LOJA01'),
                        saldo_atual: parseFloat(s.qtdsaldoatual) || 0,
                        saldo_reserva: parseFloat(s.qtdsaldoreserva) || 0,
                        saldo_disponivel: parseFloat(s.qtdsaldodisponivel) || ((parseFloat(s.qtdsaldoatual) || 0) - (parseFloat(s.qtdsaldoreserva) || 0)),
                        dt_alteracao: s.dtalteracao || null,
                        is_oficial: isOficial
                    };
                });
            }
        } catch (errSaldo) {
            results.endpoints.produtos_saldo_estoque_empresa.sucesso = false;
            results.endpoints.produtos_saldo_estoque_empresa.tempo_ms = Date.now() - t2Start;
            results.endpoints.produtos_saldo_estoque_empresa.status = errSaldo.response?.status || 500;
            results.endpoints.produtos_saldo_estoque_empresa.erro = errSaldo.response?.data || errSaldo.message;
        }

        // 3. ENDPOINT 3: PRECOS_CUSTOS_PRODUTOS_EMPRESA
        const authUrlCustos = new URL(connection.credentials.auth_url);
        authUrlCustos.pathname = '/cisspoder-service/precos_custos_produtos_empresa';

        const t3Start = Date.now();
        try {
            const resCustos = await axiosInstance.post(authUrlCustos.toString(), {
                page: 1,
                clausulas: [{ campo: "idsubproduto", valor: targetSubId, operador: "IGUAL", operadorlogico: "AND" }],
                ordenacoes: [{ campo: "idempresa", direcao: "ASC" }]
            }, { headers });

            results.endpoints.precos_custos_produtos_empresa.status = resCustos.status;
            results.endpoints.precos_custos_produtos_empresa.tempo_ms = Date.now() - t3Start;
            const custoItems = Array.isArray(resCustos.data?.data) ? resCustos.data.data : [];
            results.endpoints.precos_custos_produtos_empresa.total_retornado = custoItems.length;
            results.endpoints.precos_custos_produtos_empresa.raw_data = custoItems;
            results.endpoints.precos_custos_produtos_empresa.sucesso = true;

            results.endpoints.precos_custos_produtos_empresa.dados_formatados = custoItems.map(c => {
                const custoReposicao = parseFloat(c.valcustorepos || c.custoreposicao) || 0;
                const custoGerencial = parseFloat(c.custogerencial || c.valcustogerencial) || 0;
                const custoNotaFiscal = parseFloat(c.custonotafiscal || c.valcustonotafiscal) || 0;
                const custoMedioFiscal = parseFloat(c.valcustomediofiscal || c.customediofiscal) 
                    || (custoNotaFiscal > 0 ? custoNotaFiscal : (custoReposicao > 0 ? custoReposicao : custoGerencial));
                const custoMedio = parseFloat(c.valcustomedio || c.customedio) 
                    || (custoMedioFiscal > 0 ? custoMedioFiscal : (custoNotaFiscal > 0 ? custoNotaFiscal : custoReposicao));
                const precoVenda = parseFloat(c.valprecovarejo) || 0;
                const precoPromocao = parseFloat(c.valpromvarejo) || 0;
                const precoAtacado = parseFloat(c.valprecoatacado) || 0;

                return {
                    empresa_id: parseInt(c.idempresa, 10) || 1,
                    nome_empresa: parseInt(c.idempresa, 10) === 2 ? '2 - Filial 2' : '1 - Matriz',
                    custo_medio: custoMedio,
                    custo_medio_fiscal: custoMedioFiscal,
                    custo_gerencial: custoGerencial,
                    custo_reposicao: custoReposicao,
                    custo_nota_fiscal: custoNotaFiscal,
                    preco_venda_varejo: precoVenda,
                    preco_promocao_varejo: precoPromocao,
                    preco_venda_atacado: precoAtacado,
                    dt_alteracao: c.dtalteracao || null
                };
            });
        } catch (errCustos) {
            results.endpoints.precos_custos_produtos_empresa.sucesso = false;
            results.endpoints.precos_custos_produtos_empresa.tempo_ms = Date.now() - t3Start;
            results.endpoints.precos_custos_produtos_empresa.status = errCustos.response?.status || 500;
            results.endpoints.precos_custos_produtos_empresa.erro = errCustos.response?.data || errCustos.message;
        }
    }

    results.duracao_total_ms = Date.now() - startTimeTotal;

    // Consolidação amigável
    const prod = results.endpoints.cad_produtos.dados_formatados;
    if (prod) {
        const saldos = results.endpoints.produtos_saldo_estoque_empresa.dados_formatados || [];
        const custos = results.endpoints.precos_custos_produtos_empresa.dados_formatados || [];

        // Monta tabela comparativa das duas lojas priorizando AREA VENDA LOJA01 (1) e AREA VENDA LOJA02 (2)
        const empresas = [1, 2].map(empId => {
            const targetLocalName = empId === 1 ? 'AREA VENDA LOJA01' : 'AREA VENDA LOJA02';
            const targetLocalId = empId === 1 ? 1 : 2;
            const matchingSaldo = saldos.find(x => x.empresa_id === empId && isValidStoreStockRecord(empId, x.id_local_estoque, x.local_estoque))
                || saldos.find(x => x.empresa_id === empId && (x.id_local_estoque === targetLocalId || x.is_oficial))
                || saldos.find(x => x.empresa_id === empId);

            const s = matchingSaldo || { 
                saldo_atual: 0, 
                saldo_reserva: 0, 
                saldo_disponivel: 0, 
                local_estoque: targetLocalName,
                id_local_estoque: targetLocalId,
                dt_alteracao: null
            };
            const c = custos.find(x => x.empresa_id === empId) || { 
                custo_medio: 0, 
                custo_medio_fiscal: 0, 
                custo_gerencial: 0, 
                custo_reposicao: 0, 
                custo_nota_fiscal: 0, 
                preco_venda_varejo: 0, 
                preco_promocao_varejo: 0, 
                preco_venda_atacado: 0, 
                dt_alteracao: null 
            };
            return {
                empresa_id: empId,
                nome_empresa: empId === 1 ? '1 - A Elétrica (Matriz)' : '2 - A Elétrica (Filial 2)',
                ...s,
                ...c,
                dt_alteracao_saldo: s.dt_alteracao,
                dt_alteracao_custo: c.dt_alteracao
            };
        });

        results.produto_consolidado = {
            ...prod,
            lojas: empresas
        };

        // Persistência segura no MySQL
        try {
            await pool.execute(`
                INSERT INTO bi_produtos (
                    idproduto, idsubproduto, codigo_barras, codigo_barras_cx,
                    descricao, descricao_resumida, marca, id_marca,
                    divisao, id_divisao, secao, id_secao,
                    grupo, id_grupo, subgrupo, id_subgrupo,
                    ncm, unidade_medida, inativo, bloqueia_venda
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    idproduto = VALUES(idproduto),
                    codigo_barras = VALUES(codigo_barras),
                    codigo_barras_cx = VALUES(codigo_barras_cx),
                    descricao = VALUES(descricao),
                    descricao_resumida = VALUES(descricao_resumida),
                    marca = VALUES(marca),
                    id_marca = VALUES(id_marca),
                    divisao = VALUES(divisao),
                    id_divisao = VALUES(id_divisao),
                    secao = VALUES(secao),
                    id_secao = VALUES(id_secao),
                    grupo = VALUES(grupo),
                    id_grupo = VALUES(id_grupo),
                    subgrupo = VALUES(subgrupo),
                    id_subgrupo = VALUES(id_subgrupo),
                    ncm = VALUES(ncm),
                    unidade_medida = VALUES(unidade_medida),
                    inativo = VALUES(inativo),
                    bloqueia_venda = VALUES(bloqueia_venda)
            `, [
                prod.idproduto, prod.idsubproduto, prod.codigo_barras, prod.codigo_barras_cx,
                prod.descricao, prod.descricao_resumida, prod.marca, prod.id_marca,
                prod.divisao, prod.id_divisao, prod.secao, prod.id_secao,
                prod.grupo, prod.id_grupo, prod.subgrupo, prod.id_subgrupo,
                prod.ncm, prod.unidade_medida, prod.inativo, prod.bloqueia_venda
            ]);

            if (prod.inativo || prod.bloqueia_venda) {
                // Produto inativo ou bloqueado: remove saldos físicos para não distorcer o BI nem a Curva ABC
                await pool.execute('DELETE FROM bi_estoque_saldos WHERE idsubproduto = ?', [prod.idsubproduto]);
            } else {
                for (const emp of empresas) {
                    await pool.execute(`
                        INSERT INTO bi_estoque_saldos (
                            empresa_id, idproduto, idsubproduto, id_local_estoque, local_estoque,
                            saldo_atual, saldo_reserva, saldo_disponivel,
                            custo_medio, custo_medio_fiscal, custo_gerencial, custo_reposicao, custo_nota_fiscal,
                            preco_venda_varejo, preco_promocao_varejo, preco_venda_atacado
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            idproduto = VALUES(idproduto),
                            saldo_atual = VALUES(saldo_atual),
                            saldo_reserva = VALUES(saldo_reserva),
                            saldo_disponivel = VALUES(saldo_disponivel),
                            local_estoque = VALUES(local_estoque),
                            custo_medio = VALUES(custo_medio),
                            custo_medio_fiscal = VALUES(custo_medio_fiscal),
                            custo_gerencial = VALUES(custo_gerencial),
                            custo_reposicao = VALUES(custo_reposicao),
                            custo_nota_fiscal = VALUES(custo_nota_fiscal),
                            preco_venda_varejo = VALUES(preco_venda_varejo),
                            preco_promocao_varejo = VALUES(preco_promocao_varejo),
                            preco_venda_atacado = VALUES(preco_venda_atacado)
                    `, [
                        emp.empresa_id, prod.idproduto, prod.idsubproduto, emp.id_local_estoque || (emp.empresa_id === 1 ? 1 : 2), emp.local_estoque || (emp.empresa_id === 1 ? 'AREA VENDA LOJA01' : 'AREA VENDA LOJA02'),
                        emp.saldo_atual, emp.saldo_reserva, emp.saldo_disponivel,
                        emp.custo_medio, emp.custo_medio_fiscal, emp.custo_gerencial, emp.custo_reposicao, emp.custo_nota_fiscal,
                        emp.preco_venda_varejo, emp.preco_promocao_varejo || 0, emp.preco_venda_atacado || 0
                    ]);
                }
            }
        } catch (dbErr) {
            logger.warn(`[IntegrimSync] Não foi possível persistir produto de teste no MySQL:`, dbErr.message);
        }
    }

    return results;
}


