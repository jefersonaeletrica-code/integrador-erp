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

/**
 * =========================================================================
 * MÓDULO POWER BI - ESTOQUE & PRODUTOS ("A ELÉTRICA")
 * =========================================================================
 */

/**
 * Helper para validar o campo de custo
 */
function getValidCostColumn(tipoCusto = 'custo_medio_fiscal') {
    const valid = {
        'custo_medio_fiscal': 's.custo_medio_fiscal',
        'custo_gerencial': 's.custo_gerencial',
        'custo_medio': 's.custo_medio',
        'custo_reposicao': 's.custo_reposicao',
        'custo_nota_fiscal': 's.custo_nota_fiscal',
        'preco_venda_varejo': 's.preco_venda_varejo'
    };
    return valid[tipoCusto] || 's.custo_medio_fiscal';
}

/**
 * Helper para validar se o registro de estoque pertence à área de venda oficial da loja:
 * - Loja 1 / Matriz -> 'AREA VENDA LOJA01' (id_local_estoque = 1)
 * - Loja 2 / Filial -> 'AREA VENDA LOJA02' (id_local_estoque = 2)
 */
function getStockLocationCondition() {
    return `(
        (s.empresa_id = 1 AND (s.id_local_estoque = 1 OR s.local_estoque LIKE '%LOJA01%' OR s.local_estoque LIKE '%loja 1%' OR s.local_estoque LIKE '%Matriz%' OR s.local_estoque IS NULL))
        OR (s.empresa_id = 2 AND (s.id_local_estoque = 2 OR s.local_estoque LIKE '%LOJA02%' OR s.local_estoque LIKE '%loja 2%' OR s.local_estoque LIKE '%Filial%' OR s.local_estoque IS NULL))
        OR (s.empresa_id NOT IN (1, 2))
        OR (s.local_estoque IS NULL)
    )`;
}

/**
 * 1. Resumo Geral de Estoque (5 KPIs + Gráficos de Empresa, Estrutura e Marcas)
 */
export async function getBiEstoqueSummary(db, { empresa_id = null, tipo_custo = 'custo_medio_fiscal' }) {
    const pool = resolvePool(db);
    const costCol = getValidCostColumn(tipo_custo);

    const isSpecificCompany = !!(empresa_id && empresa_id !== 'all' && empresa_id !== '');
    const stockLocCond = getStockLocationCondition();

    // 1. Total Mix de Produtos do Catálogo Ativo
    const [mixRows] = await pool.execute(`
        SELECT COUNT(DISTINCT p.idsubproduto) as mix_produtos
        FROM bi_produtos p
        WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE
    `);
    const mixProdutos = parseInt(mixRows[0]?.mix_produtos, 10) || 0;

    // 2. Ruptura de Estoque:
    // - Para uma loja individual: conta produtos ativos sem saldo físico naquela loja
    // - Para a rede (Todas as Lojas): conta produtos ativos cujo saldo consolidado na rede seja <= 0
    let rupturaItens = 0;
    if (isSpecificCompany) {
        const [rupturaRows] = await pool.execute(`
            SELECT COUNT(DISTINCT p.idsubproduto) as ruptura_itens
            FROM bi_produtos p
            LEFT JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto 
                AND s.empresa_id = ? 
                AND ${stockLocCond}
            WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE
              AND (s.saldo_atual IS NULL OR s.saldo_atual <= 0)
        `, [empresa_id]);
        rupturaItens = parseInt(rupturaRows[0]?.ruptura_itens, 10) || 0;
    } else {
        const [rupturaRows] = await pool.execute(`
            SELECT COUNT(*) as ruptura_itens FROM (
                SELECT p.idsubproduto
                FROM bi_produtos p
                LEFT JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto AND ${stockLocCond}
                WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE
                GROUP BY p.idsubproduto
                HAVING COALESCE(SUM(s.saldo_atual), 0) <= 0
            ) as r
        `);
        rupturaItens = parseInt(rupturaRows[0]?.ruptura_itens, 10) || 0;
    }

    // 3. KPIs de Valor, Quantidade e Cobertura
    let kpiQuery = `
        SELECT 
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor_estoque,
            COALESCE(SUM(s.saldo_atual), 0) as qtd_estoque,
            COALESCE(
                ROUND(
                    SUM(CASE WHEN s.saldo_atual > 0 AND s.dias_cobertura > 0 THEN s.saldo_atual * ${costCol} * s.dias_cobertura ELSE 0 END)
                    / NULLIF(SUM(CASE WHEN s.saldo_atual > 0 AND s.dias_cobertura > 0 THEN s.saldo_atual * ${costCol} ELSE 0 END), 0)
                ),
                0
            ) as dias_cobertura
        FROM bi_produtos p
        JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto
        WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE AND ${stockLocCond}
    `;
    const kpiParams = [];
    if (isSpecificCompany) {
        kpiQuery += ' AND s.empresa_id = ?';
        kpiParams.push(empresa_id);
    }

    const [kpiRows] = await pool.execute(kpiQuery, kpiParams);
    const kpi = kpiRows[0] || {};
    const valorEstoque = parseFloat(kpi.valor_estoque) || 0;
    const qtdEstoque = parseFloat(kpi.qtd_estoque) || 0;
    const diasCobertura = Math.round(parseFloat(kpi.dias_cobertura) || 0);

    // 4. Gráfico: Valor de Estoque por Empresa (1 - Matriz vs 2 - Filial 2)
    // Alinhado estritamente com produtos ativos para garantir 100% de convergência com o card principal
    const [byCompanyRows] = await pool.execute(`
        SELECT 
            e.id as empresa_id,
            e.nome_fantasia as nome,
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor_estoque,
            COALESCE(SUM(s.saldo_atual), 0) as qtd_estoque
        FROM bi_empresas e
        LEFT JOIN bi_estoque_saldos s ON s.empresa_id = e.id AND ${stockLocCond}
        LEFT JOIN bi_produtos p ON p.idsubproduto = s.idsubproduto AND p.inativo = FALSE AND p.bloqueia_venda = FALSE
        WHERE e.ativo = TRUE AND (p.idsubproduto IS NOT NULL OR s.id IS NULL)
        GROUP BY e.id, e.nome_fantasia
        ORDER BY e.codigo_erp ASC
    `);

    const totalValorComp = byCompanyRows.reduce((acc, r) => acc + (parseFloat(r.valor_estoque) || 0), 0);
    const empresasData = byCompanyRows.map(r => {
        const val = parseFloat(r.valor_estoque) || 0;
        return {
            empresa_id: r.empresa_id,
            nome: r.nome,
            valor: val,
            qtd: parseFloat(r.qtd_estoque) || 0,
            share_pct: totalValorComp > 0 ? (val / totalValorComp) * 100 : 0
        };
    });

    // 5. Gráfico: Estrutura Mercadológica (Divisão / Grupo)
    let whereFiltered = `WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE AND ${stockLocCond}`;
    const filteredParams = [];
    if (isSpecificCompany) {
        whereFiltered += ' AND s.empresa_id = ?';
        filteredParams.push(empresa_id);
    }

    const [estruturaRows] = await pool.execute(`
        SELECT 
            COALESCE(p.grupo, '9999 - GERAL') as nome_grupo,
            COALESCE(p.divisao, 'MATERIAIS ELÉTRICOS') as nome_divisao,
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor,
            COALESCE(SUM(s.saldo_atual), 0) as qtd
        FROM bi_produtos p
        JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto
        ${whereFiltered}
        GROUP BY p.grupo, p.divisao
        ORDER BY valor DESC
        LIMIT 10
    `, filteredParams);

    // 6. Gráfico: Ranking por Marca / Fabricante
    const [marcaRows] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.marca), ''), '0 - SEM MARCA') as marca,
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor,
            COALESCE(SUM(s.saldo_atual), 0) as qtd
        FROM bi_produtos p
        JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto
        ${whereFiltered}
        GROUP BY COALESCE(NULLIF(TRIM(p.marca), ''), '0 - SEM MARCA')
        ORDER BY valor DESC
        LIMIT 12
    `, filteredParams);

    // 7. Gráfico: Ranking Real por Fornecedor Principal
    const [fornecedorRows] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.fornecedor_principal), ''), '0 - NÃO INFORMADO') as fornecedor,
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor,
            COALESCE(SUM(s.saldo_atual), 0) as qtd
        FROM bi_produtos p
        JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto
        ${whereFiltered}
        GROUP BY COALESCE(NULLIF(TRIM(p.fornecedor_principal), ''), '0 - NÃO INFORMADO')
        ORDER BY valor DESC
        LIMIT 12
    `, filteredParams);

    let lastSync = null;
    try {
        const [syncRows] = await pool.execute(`
            SELECT sync_type, produtos_count, saldos_count, custos_count, 
                   DATE_FORMAT(started_at, '%Y-%m-%d %H:%i:%s') as started_at,
                   DATE_FORMAT(finished_at, '%Y-%m-%d %H:%i:%s') as finished_at,
                   status
            FROM bi_sync_history
            WHERE status = 'success'
            ORDER BY started_at DESC
            LIMIT 1
        `);
        if (syncRows[0]) {
            const { formatCissDateTime } = await import('./integrimSyncService.js');
            lastSync = {
                ...syncRows[0],
                started_at: formatCissDateTime(syncRows[0].started_at),
                finished_at: formatCissDateTime(syncRows[0].finished_at)
            };
        }
    } catch (e) {
        // Silencioso caso tabela ainda não exista
    }

    return {
        last_sync: lastSync,
        kpis: {
            valor_estoque: valorEstoque,
            quantidade_estoque: qtdEstoque,
            dias_cobertura: diasCobertura,
            mix_produtos: mixProdutos,
            ruptura_itens: rupturaItens
        },
        grafico_empresas: empresasData,
        grafico_estrutura: estruturaRows.map(r => ({
            nome: r.nome_grupo,
            divisao: r.nome_divisao,
            valor: parseFloat(r.valor) || 0,
            qtd: parseFloat(r.qtd) || 0
        })),
        grafico_marcas: marcaRows.map(r => ({
            marca: r.marca,
            valor: parseFloat(r.valor) || 0,
            qtd: parseFloat(r.qtd) || 0
        })),
        grafico_fornecedores: fornecedorRows.map(r => ({
            fornecedor: r.fornecedor,
            valor: parseFloat(r.valor) || 0,
            qtd: parseFloat(r.qtd) || 0
        }))
    };
}

/**
 * 2. Curva ABC de Estoque (Pareto, Donuts de Qtd/Valor e Tabela de 5 Custos)
 */
export async function getBiEstoqueCurvaABC(db, { empresa_id = null, tipo_custo = 'custo_medio_fiscal', agrupador = 'subgrupo', curva_a = 20, curva_b = 30 }) {
    const pool = resolvePool(db);

    let whereClause = `WHERE p.inativo = FALSE AND p.bloqueia_venda = FALSE AND ${getStockLocationCondition()}`;
    const params = [];

    if (empresa_id && empresa_id !== 'all' && empresa_id !== '') {
        whereClause += ' AND s.empresa_id = ?';
        params.push(empresa_id);
    }

    // 1. Tabela Comparativa de 5 Custos por Curva ABC
    const [tabelaCustosRows] = await pool.execute(`
        SELECT 
            s.curva_abc,
            COUNT(DISTINCT s.idsubproduto) as contagem_itens,
            COALESCE(SUM(s.saldo_atual), 0) as qtd_atual_estoque,
            COALESCE(SUM(s.saldo_atual * s.custo_gerencial), 0) as valor_gerencial,
            COALESCE(SUM(s.saldo_atual * s.custo_medio), 0) as valor_medio,
            COALESCE(SUM(s.saldo_atual * s.custo_medio_fiscal), 0) as valor_fiscal,
            COALESCE(SUM(s.saldo_atual * s.custo_reposicao), 0) as valor_reposicao,
            COALESCE(SUM(s.saldo_atual * s.custo_nota_fiscal), 0) as valor_nota_fiscal
        FROM bi_estoque_saldos s
        JOIN bi_produtos p ON p.idsubproduto = s.idsubproduto
        ${whereClause}
        GROUP BY s.curva_abc
        ORDER BY FIELD(s.curva_abc, 'A', 'B', 'C')
    `, params);

    let totalContagem = 0;
    let totalQtd = 0;
    let totalGerencial = 0;
    let totalMedio = 0;
    let totalFiscal = 0;
    let totalReposicao = 0;
    let totalNF = 0;

    const tabelaCustos = tabelaCustosRows.map(r => {
        const cont = parseInt(r.contagem_itens, 10) || 0;
        const qtd = parseFloat(r.qtd_atual_estoque) || 0;
        const ger = parseFloat(r.valor_gerencial) || 0;
        const med = parseFloat(r.valor_medio) || 0;
        const fis = parseFloat(r.valor_fiscal) || 0;
        const rep = parseFloat(r.valor_reposicao) || 0;
        const nf = parseFloat(r.valor_nota_fiscal) || 0;

        totalContagem += cont;
        totalQtd += qtd;
        totalGerencial += ger;
        totalMedio += med;
        totalFiscal += fis;
        totalReposicao += rep;
        totalNF += nf;

        return {
            curva_abc: r.curva_abc,
            contagem_itens: cont,
            qtd_atual_estoque: qtd,
            valor_gerencial: ger,
            valor_medio: med,
            valor_fiscal: fis,
            valor_reposicao: rep,
            valor_nota_fiscal: nf
        };
    });

    const totais = {
        curva_abc: 'Total',
        contagem_itens: totalContagem,
        qtd_atual_estoque: totalQtd,
        valor_gerencial: totalGerencial,
        valor_medio: totalMedio,
        valor_fiscal: totalFiscal,
        valor_reposicao: totalReposicao,
        valor_nota_fiscal: totalNF
    };

    // Determina qual métrica de valor utilizar no donut de acordo com o tipo_custo selecionado
    let donutValorProp = 'valor_fiscal';
    let donutValorTotal = totalFiscal;
    if (tipo_custo === 'custo_medio') {
        donutValorProp = 'valor_medio';
        donutValorTotal = totalMedio;
    } else if (tipo_custo === 'custo_gerencial') {
        donutValorProp = 'valor_gerencial';
        donutValorTotal = totalGerencial;
    } else if (tipo_custo === 'custo_reposicao') {
        donutValorProp = 'valor_reposicao';
        donutValorTotal = totalReposicao;
    } else if (tipo_custo === 'custo_nota_fiscal') {
        donutValorProp = 'valor_nota_fiscal';
        donutValorTotal = totalNF;
    }

    // 2. Gráficos Donut (Qtd % e Valor %)
    const donuts = {
        qtd: tabelaCustos.map(t => ({
            curva: t.curva_abc,
            pct: totalQtd > 0 ? (t.qtd_atual_estoque / totalQtd) * 100 : 0
        })),
        valor: tabelaCustos.map(t => ({
            curva: t.curva_abc,
            pct: donutValorTotal > 0 ? (t[donutValorProp] / donutValorTotal) * 100 : 0
        }))
    };

    // 3. Gráfico de Pareto por Subgrupo (Barras ordenadas por valor financeiro + Linha de Pareto Acumulado %)
    const costCol = getValidCostColumn(tipo_custo);
    const [paretoRows] = await pool.execute(`
        SELECT 
            COALESCE(p.subgrupo, 'Geral') as nome,
            COALESCE(SUM(s.saldo_atual), 0) as qtd,
            COALESCE(SUM(s.saldo_atual * ${costCol}), 0) as valor
        FROM bi_produtos p
        JOIN bi_estoque_saldos s ON s.idsubproduto = p.idsubproduto
        ${whereClause}
        GROUP BY p.subgrupo
        ORDER BY valor DESC
        LIMIT 20
    `, params);

    let paretoAcumuladoValor = 0;
    const totalParetoValor = paretoRows.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
    const pareto = paretoRows.map(p => {
        const v = parseFloat(p.valor) || 0;
        paretoAcumuladoValor += v;
        const pctAcumulado = totalParetoValor > 0 ? (paretoAcumuladoValor / totalParetoValor) * 100 : 0;
        return {
            nome: p.nome,
            qtd: parseFloat(p.qtd) || 0,
            valor: v,
            pct_acumulado: Math.min(pctAcumulado, 100)
        };
    });

    return {
        tabela_custos: tabelaCustos,
        totais,
        donuts,
        pareto
    };
}

/**
 * 3. Tabela de Produtos e Posição de Estoque Detalhada
 */
export async function getBiEstoqueProducts(db, { empresa_id = null, busca = '', curva_abc = '', situacao = '', page = 1, limit = 50 }) {
    const pool = resolvePool(db);

    const safeLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeOffset = (safePage - 1) * safeLimit;

    let whereClause = `WHERE (p.idsubproduto IS NULL OR (COALESCE(p.inativo, FALSE) = FALSE AND COALESCE(p.bloqueia_venda, FALSE) = FALSE)) AND ${getStockLocationCondition()}`;
    const params = [];

    if (empresa_id && empresa_id !== 'all' && empresa_id !== '' && empresa_id !== 'undefined' && empresa_id !== 'null') {
        whereClause += ' AND s.empresa_id = ?';
        params.push(parseInt(empresa_id, 10));
    }

    if (busca && typeof busca === 'string' && busca.trim() && busca.trim() !== 'undefined' && busca.trim() !== 'null') {
        whereClause += ' AND (COALESCE(p.descricao, \'\') LIKE ? OR COALESCE(p.codigo_barras, \'\') LIKE ? OR CAST(s.idsubproduto AS CHAR) LIKE ? OR COALESCE(p.marca, \'\') LIKE ?)';
        const b = `%${busca.trim()}%`;
        params.push(b, b, b, b);
    }

    if (curva_abc && curva_abc !== 'all' && curva_abc !== '' && curva_abc !== 'undefined' && curva_abc !== 'null') {
        whereClause += ' AND s.curva_abc = ?';
        params.push(curva_abc.trim().toUpperCase());
    }

    if (situacao && situacao !== 'all' && situacao !== '' && situacao !== 'undefined' && situacao !== 'null') {
        if (situacao === 'ruptura') {
            whereClause += ' AND (s.saldo_atual IS NULL OR s.saldo_atual <= 0)';
        } else if (situacao === 'disponivel') {
            whereClause += ' AND s.saldo_atual > 0';
        } else if (situacao === 'baixo') {
            whereClause += ' AND s.saldo_atual > 0 AND s.saldo_atual <= COALESCE(s.estoque_minimo, 0)';
        }
    }

    // Contagem total
    const [countRows] = await pool.execute(`
        SELECT COUNT(DISTINCT s.id) as total
        FROM bi_estoque_saldos s
        LEFT JOIN bi_produtos p ON p.idsubproduto = s.idsubproduto
        ${whereClause}
    `, params);

    const total = parseInt(countRows[0]?.total, 10) || 0;

    const [rows] = await pool.execute(`
        SELECT 
            s.id,
            s.empresa_id,
            s.idproduto,
            s.idsubproduto,
            COALESCE(p.descricao, CONCAT('Produto ', s.idsubproduto)) as descricao,
            COALESCE(p.marca, '-') as marca,
            COALESCE(p.fornecedor_principal, '-') as fornecedor_principal,
            COALESCE(p.grupo, '-') as grupo,
            COALESCE(p.subgrupo, '-') as subgrupo,
            COALESCE(p.unidade_medida, 'UN') as unidade_medida,
            COALESCE(p.codigo_barras, '') as codigo_barras,
            s.saldo_atual,
            s.saldo_reserva,
            s.saldo_disponivel,
            s.custo_medio_fiscal,
            s.custo_gerencial,
            s.custo_reposicao,
            s.preco_venda_varejo,
            s.estoque_minimo,
            s.dias_cobertura,
            COALESCE(s.curva_abc, 'C') as curva_abc
        FROM bi_estoque_saldos s
        LEFT JOIN bi_produtos p ON p.idsubproduto = s.idsubproduto
        ${whereClause}
        ORDER BY FIELD(COALESCE(s.curva_abc, 'C'), 'A', 'B', 'C') ASC, s.saldo_atual DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
    `, params);

    return {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
        products: rows.map(r => ({
            id: r.id,
            empresa_id: r.empresa_id,
            idsubproduto: r.idsubproduto,
            descricao: r.descricao,
            marca: r.marca,
            fornecedor: r.fornecedor_principal,
            grupo: r.grupo,
            subgrupo: r.subgrupo,
            unidade: r.unidade_medida,
            codigo_barras: r.codigo_barras,
            saldo_atual: parseFloat(r.saldo_atual) || 0,
            saldo_reserva: parseFloat(r.saldo_reserva) || 0,
            saldo_disponivel: parseFloat(r.saldo_disponivel) || 0,
            custo_fiscal: parseFloat(r.custo_medio_fiscal) || 0,
            custo_gerencial: parseFloat(r.custo_gerencial) || 0,
            custo_reposicao: parseFloat(r.custo_reposicao) || 0,
            preco_venda: parseFloat(r.preco_venda_varejo) || 0,
            estoque_minimo: parseFloat(r.estoque_minimo) || 0,
            dias_cobertura: parseInt(r.dias_cobertura, 10) || 0,
            curva_abc: r.curva_abc
        }))
    };
}

