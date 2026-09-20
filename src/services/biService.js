import { getLogger } from '../core/logger.js';

const logger = getLogger();

const resolvePool = (db) => typeof db?.getPool === 'function' ? db.getPool() : db;

/**
 * Retorna as empresas / filiais cadastradas no BI
 */
export async function getBiCompanies(db) {
    const pool = resolvePool(db);
    const [rows] = await pool.execute('SELECT * FROM bi_empresas WHERE ativo = TRUE ORDER BY codigo_erp ASC');
    return rows;
}

/**
 * Helper para calcular datas de comparação (Ano Anterior ou Mês Anterior)
 */
function getPriorPeriodDates(dataInicio, dataFim, comparativoTipo = 'ano_anterior') {
    const dInicio = new Date(dataInicio);
    const dFim = new Date(dataFim);

    if (comparativoTipo === 'mes_anterior') {
        const priorInicio = new Date(dInicio.getFullYear(), dInicio.getMonth() - 1, dInicio.getDate());
        const priorFim = new Date(dFim.getFullYear(), dFim.getMonth() - 1, dFim.getDate());
        return {
            dataInicioAnt: priorInicio.toISOString().split('T')[0],
            dataFimAnt: priorFim.toISOString().split('T')[0]
        };
    } else {
        // Padrão: Ano Anterior
        const priorInicio = new Date(dInicio.getFullYear() - 1, dInicio.getMonth(), dInicio.getDate());
        const priorFim = new Date(dFim.getFullYear() - 1, dFim.getMonth(), dFim.getDate());
        return {
            dataInicioAnt: priorInicio.toISOString().split('T')[0],
            dataFimAnt: priorFim.toISOString().split('T')[0]
        };
    }
}

/**
 * Consulta e agrega os KPIs principais de vendas do período atual e anterior
 */
export async function getBiVendasSummary(db, { empresa_id = null, data_inicio, data_fim, comparativo_tipo = 'ano_anterior' }) {
    const pool = resolvePool(db);

    const now = new Date();
    const defaultAno = now.getFullYear();
    const defaultMes = String(now.getMonth() + 1).padStart(2, '0');
    
    const dInicio = data_inicio || `${defaultAno}-${defaultMes}-01`;
    const dFim = data_fim || new Date(defaultAno, now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { dataInicioAnt, dataFimAnt } = getPriorPeriodDates(dInicio, dFim, comparativo_tipo);

    // Contagem geral para verificar se há registros
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM bi_vendas');
    const totalRegistrosBase = countRows[0]?.total || 0;

    // 1. Query Período Atual
    let currentQuery = `
        SELECT 
            COALESCE(SUM(valor_liquido), 0) as faturamento,
            COALESCE(SUM(custo_total), 0) as custo,
            COALESCE(SUM(lucro_bruto), 0) as lucro,
            COUNT(id) as tickets
        FROM bi_vendas
        WHERE data_emissao BETWEEN ? AND ?
    `;
    const currentParams = [dInicio, dFim];
    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        currentQuery += ' AND empresa_id = ?';
        currentParams.push(empresa_id);
    }

    const [currentRows] = await pool.execute(currentQuery, currentParams);
    const curr = currentRows[0] || { faturamento: 0, custo: 0, lucro: 0, tickets: 0 };

    const faturamentoCurr = parseFloat(curr.faturamento) || 0;
    const custoCurr = parseFloat(curr.custo) || 0;
    const lucroCurr = parseFloat(curr.lucro) || 0;
    const ticketsCurr = parseInt(curr.tickets, 10) || 0;
    const lucratividadeCurr = faturamentoCurr > 0 ? (lucroCurr / faturamentoCurr) * 100 : 0;
    const ticketMedioCurr = ticketsCurr > 0 ? (faturamentoCurr / ticketsCurr) : 0;

    // 2. Query Período Anterior
    let priorQuery = `
        SELECT 
            COALESCE(SUM(valor_liquido), 0) as faturamento,
            COALESCE(SUM(custo_total), 0) as custo,
            COALESCE(SUM(lucro_bruto), 0) as lucro,
            COUNT(id) as tickets
        FROM bi_vendas
        WHERE data_emissao BETWEEN ? AND ?
    `;
    const priorParams = [dataInicioAnt, dataFimAnt];
    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        priorQuery += ' AND empresa_id = ?';
        priorParams.push(empresa_id);
    }

    const [priorRows] = await pool.execute(priorQuery, priorParams);
    const prior = priorRows[0] || { faturamento: 0, custo: 0, lucro: 0, tickets: 0 };

    const faturamentoPrior = parseFloat(prior.faturamento) || 0;
    const custoPrior = parseFloat(prior.custo) || 0;
    const lucroPrior = parseFloat(prior.lucro) || 0;
    const ticketsPrior = parseInt(prior.tickets, 10) || 0;
    const lucratividadePrior = faturamentoPrior > 0 ? (lucroPrior / faturamentoPrior) * 100 : 0;
    const ticketMedioPrior = ticketsPrior > 0 ? (faturamentoPrior / ticketsPrior) : 0;

    // 3. Cálculos de Deltas
    const faturamentoDelta = faturamentoPrior > 0 ? ((faturamentoCurr - faturamentoPrior) / faturamentoPrior) * 100 : 0;
    const lucroDelta = lucroPrior > 0 ? ((lucroCurr - lucroPrior) / lucroPrior) * 100 : 0;
    const lucratividadeDelta = lucratividadeCurr - lucratividadePrior; // Variação em pontos percentuais (p.p.)
    const ticketMedioDelta = ticketMedioPrior > 0 ? ((ticketMedioCurr - ticketMedioPrior) / ticketMedioPrior) * 100 : 0;
    const ticketsDelta = ticketsPrior > 0 ? ((ticketsCurr - ticketsPrior) / ticketsPrior) * 100 : 0;

    // 4. Sparkline de Faturamento (Evolução dos pontos)
    let sparkQuery = `
        SELECT data_emissao, SUM(valor_liquido) as valor
        FROM bi_vendas
        WHERE data_emissao BETWEEN ? AND ?
    `;
    const sparkParams = [dInicio, dFim];
    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        sparkQuery += ' AND empresa_id = ?';
        sparkParams.push(empresa_id);
    }
    sparkQuery += ' GROUP BY data_emissao ORDER BY data_emissao ASC LIMIT 30';

    const [sparkRows] = await pool.execute(sparkQuery, sparkParams);
    const sparkline = sparkRows.map(r => ({
        data: r.data_emissao,
        faturamento: parseFloat(r.valor) || 0
    }));

    return {
        total_registros_base: totalRegistrosBase,
        atual: {
            faturamento_liquido: faturamentoCurr,
            custo_total: custoCurr,
            lucro_bruto: lucroCurr,
            margem_lucro_pct: lucratividadeCurr,
            ticket_medio: ticketMedioCurr,
            qtd_tickets: ticketsCurr,
            total_descontos: 0.00
        },
        comparativo: {
            faturamento_liquido: faturamentoPrior,
            custo_total: custoPrior,
            lucro_bruto: lucroPrior,
            margem_lucro_pct: lucratividadePrior,
            ticket_medio: ticketMedioPrior,
            qtd_tickets: ticketsPrior
        },
        deltas: {
            faturamento_pct: faturamentoDelta,
            lucro_pct: lucroDelta,
            lucratividade_pontos: lucratividadeDelta,
            ticket_medio_pct: ticketMedioDelta,
            qtd_tickets_pct: ticketsDelta
        },
        sparkline,
        periodo_selecionado: {
            data_inicio: dInicio,
            data_fim: dFim,
            data_inicio_formatada: dInicio.split('-').reverse().join('/'),
            data_fim_formatada: dFim.split('-').reverse().join('/')
        },
        periodo_anterior: {
            data_inicio: dataInicioAnt,
            data_fim: dataFimAnt,
            data_inicio_formatada: dataInicioAnt.split('-').reverse().join('/'),
            data_fim_formatada: dataFimAnt.split('-').reverse().join('/'),
            tipo: comparativo_tipo
        }
    };
}

/**
 * Retorna o Faturamento por Empresa / Filial para o gráfico de barras
 */
export async function getBiVendasByCompany(db, { data_inicio, data_fim, comparativo_tipo = 'ano_anterior' }) {
    const pool = resolvePool(db);

    const now = new Date();
    const dInicio = data_inicio || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const dFim = data_fim || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { dataInicioAnt, dataFimAnt } = getPriorPeriodDates(dInicio, dFim, comparativo_tipo);

    // Vendas Atuais por Empresa
    const [rowsAtual] = await pool.execute(`
        SELECT 
            e.id as empresa_id,
            e.codigo_erp,
            e.nome_fantasia,
            COALESCE(SUM(v.valor_liquido), 0) as faturamento,
            COALESCE(SUM(v.lucro_bruto), 0) as lucro,
            COUNT(v.id) as tickets
        FROM bi_empresas e
        LEFT JOIN bi_vendas v ON v.empresa_id = e.id AND v.data_emissao BETWEEN ? AND ?
        WHERE e.ativo = TRUE
        GROUP BY e.id, e.codigo_erp, e.nome_fantasia
        ORDER BY e.codigo_erp ASC
    `, [dInicio, dFim]);

    // Vendas Período Anterior por Empresa
    const [rowsComp] = await pool.execute(`
        SELECT 
            e.id as empresa_id,
            COALESCE(SUM(v.valor_liquido), 0) as faturamento
        FROM bi_empresas e
        LEFT JOIN bi_vendas v ON v.empresa_id = e.id AND v.data_emissao BETWEEN ? AND ?
        WHERE e.ativo = TRUE
        GROUP BY e.id
    `, [dataInicioAnt, dataFimAnt]);

    const compMap = {};
    rowsComp.forEach(r => { compMap[r.empresa_id] = parseFloat(r.faturamento) || 0; });

    const totalGeral = rowsAtual.reduce((acc, r) => acc + (parseFloat(r.faturamento) || 0), 0);

    return rowsAtual.map(r => {
        const fat = parseFloat(r.faturamento) || 0;
        const fatComp = compMap[r.empresa_id] || 0;
        return {
            empresa_id: r.empresa_id,
            codigo_erp: r.codigo_erp,
            nome: r.nome_fantasia,
            faturamento_atual: fat,
            faturamento_comp: fatComp,
            tickets: parseInt(r.tickets, 10) || 0,
            lucro: parseFloat(r.lucro) || 0,
            share_pct: totalGeral > 0 ? (fat / totalGeral) * 100 : 0
        };
    });
}

/**
 * Retorna o Faturamento Diarizado para o gráfico de linha/tendência
 */
export async function getBiVendasDaily(db, { empresa_id = null, data_inicio, data_fim, comparativo_tipo = 'ano_anterior' }) {
    const pool = resolvePool(db);

    const now = new Date();
    const dInicio = data_inicio || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const dFim = data_fim || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { dataInicioAnt, dataFimAnt } = getPriorPeriodDates(dInicio, dFim, comparativo_tipo);

    let queryAtual = `
        SELECT 
            data_emissao,
            dia_semana,
            COALESCE(SUM(valor_liquido), 0) as faturamento,
            COALESCE(SUM(lucro_bruto), 0) as lucro,
            COUNT(id) as tickets
        FROM bi_vendas
        WHERE data_emissao BETWEEN ? AND ?
    `;
    const paramsAtual = [dInicio, dFim];

    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        queryAtual += ' AND empresa_id = ?';
        paramsAtual.push(empresa_id);
    }
    queryAtual += ' GROUP BY data_emissao, dia_semana ORDER BY data_emissao ASC';

    const [rowsAtual] = await pool.execute(queryAtual, paramsAtual);

    // Período Comparativo
    let queryComp = `
        SELECT 
            data_emissao,
            dia_semana,
            COALESCE(SUM(valor_liquido), 0) as faturamento
        FROM bi_vendas
        WHERE data_emissao BETWEEN ? AND ?
    `;
    const paramsComp = [dataInicioAnt, dataFimAnt];
    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        queryComp += ' AND empresa_id = ?';
        paramsComp.push(empresa_id);
    }
    queryComp += ' GROUP BY data_emissao, dia_semana ORDER BY data_emissao ASC';

    const [rowsComp] = await pool.execute(queryComp, paramsComp);

    return {
        current_daily: rowsAtual.map(r => ({
            data: typeof r.data_emissao === 'string' ? r.data_emissao.split('T')[0] : r.data_emissao.toISOString().split('T')[0],
            dia_semana: r.dia_semana,
            faturamento: parseFloat(r.faturamento) || 0,
            lucro: parseFloat(r.lucro) || 0,
            tickets: parseInt(r.tickets, 10) || 0
        })),
        comparative_daily: rowsComp.map(r => ({
            data: typeof r.data_emissao === 'string' ? r.data_emissao.split('T')[0] : r.data_emissao.toISOString().split('T')[0],
            dia_semana: r.dia_semana,
            faturamento: parseFloat(r.faturamento) || 0
        }))
    };
}

/**
 * Popula dados de demonstração representativos para validação visual imediata do Power BI
 */
export async function seedRealisticBiMockData(db) {
    const pool = resolvePool(db);

    // Verifica se já existem vendas
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM bi_vendas');
    if (countRows[0].total > 0) {
        return { message: 'Dados de BI já existentes no banco.', count: countRows[0].total };
    }

    logger.info('[BiService] Gerando dados de demonstração realistas para o Power BI de A Elétrica...');

    // Dias da semana em português
    const diasSemana = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

    // Gerar vendas diárias para 2024, 2025 e 2026
    const anos = [2024, 2025, 2026];
    let insertedCount = 0;

    for (const ano of anos) {
        for (let mes = 1; mes <= 12; mes++) {
            const diasNoMes = new Date(ano, mes, 0).getDate();

            for (let dia = 1; dia <= diasNoMes; dia++) {
                const dateObj = new Date(ano, mes - 1, dia);
                const diaSemanaNum = dateObj.getDay();
                if (diaSemanaNum === 0) continue; // Domingo fechado

                const diaSemanaNome = diasSemana[diaSemanaNum];
                const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

                // Vendas da Empresa 1 (Matriz - Maior volume: ~R$ 308k/mês)
                const ticketsE1 = Math.floor(65 + Math.sin(dia) * 15); 
                const ticketMedioE1 = 145 + Math.cos(dia) * 12; 
                const fatE1 = ticketsE1 * ticketMedioE1;
                const margemE1 = 0.118 + (Math.sin(dia * 2) * 0.012); 
                const lucroE1 = fatE1 * margemE1;
                const custoE1 = fatE1 - lucroE1;

                // Vendas da Empresa 2 (Filial 2: ~R$ 231k/mês)
                const ticketsE2 = Math.floor(48 + Math.cos(dia) * 12);
                const ticketMedioE2 = 136 + Math.sin(dia) * 10;
                const fatE2 = ticketsE2 * ticketMedioE2;
                const margemE2 = 0.115 + (Math.cos(dia * 2) * 0.01);
                const lucroE2 = fatE2 * margemE2;
                const custoE2 = fatE2 - lucroE2;

                // Insere registro diário da Empresa 1
                await pool.execute(`
                    INSERT INTO bi_vendas 
                    (empresa_id, numero_documento, tipo_documento, data_emissao, data_hora, dia_semana, valor_bruto, valor_desconto, valor_liquido, custo_total, lucro_bruto, margem_lucratividade_pct, canal_venda, status)
                    VALUES (?, ?, 'NFCE', ?, ?, ?, ?, 0.00, ?, ?, ?, ?, 'Loja Física', 'concluida')
                `, [
                    1,
                    `NC1-${ano}${mes}${dia}`,
                    dateStr,
                    `${dateStr} 14:00:00`,
                    diaSemanaNome,
                    fatE1,
                    fatE1,
                    custoE1,
                    lucroE1,
                    margemE1 * 100
                ]);
                insertedCount++;

                // Insere registro diário da Empresa 2
                await pool.execute(`
                    INSERT INTO bi_vendas 
                    (empresa_id, numero_documento, tipo_documento, data_emissao, data_hora, dia_semana, valor_bruto, valor_desconto, valor_liquido, custo_total, lucro_bruto, margem_lucratividade_pct, canal_venda, status)
                    VALUES (?, ?, 'NFCE', ?, ?, ?, ?, 0.00, ?, ?, ?, ?, 'Loja Física', 'concluida')
                `, [
                    2,
                    `NC2-${ano}${mes}${dia}`,
                    dateStr,
                    `${dateStr} 15:30:00`,
                    diaSemanaNome,
                    fatE2,
                    fatE2,
                    custoE2,
                    lucroE2,
                    margemE2 * 100
                ]);
                insertedCount++;
            }
        }
    }

    logger.info(`[BiService] ${insertedCount} registros de vendas gerados com sucesso.`);
    return { sucesso: true, count: insertedCount };
}
