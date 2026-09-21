import express from 'express';
import * as biService from '../services/biService.js';
import { getLogger } from '../core/logger.js';

const router = express.Router();

export default (db) => {
    const logger = getLogger();

    // 1. Listar Empresas do BI
    router.get('/bi/companies', async (req, res) => {
        try {
            const companies = await biService.getBiCompanies(db);
            res.json({ sucesso: true, companies });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar empresas do BI:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 2. Resumo de Vendas e KPIs (Faturamento, Lucratividade, Ticket Médio, Tickets e Comparativos)
    router.get('/bi/sales/summary', async (req, res) => {
        try {
            const { empresa_id, data_inicio, data_fim, comparativo_tipo } = req.query;
            const summary = await biService.getBiVendasSummary(db, {
                empresa_id,
                data_inicio,
                data_fim,
                comparativo_tipo: comparativo_tipo || 'ano_anterior'
            });
            res.json({ sucesso: true, ...summary });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar resumo de vendas do BI:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 3. Faturamento por Empresa / Filial (Gráfico de Barras)
    router.get('/bi/sales/by-company', async (req, res) => {
        try {
            const { data_inicio, data_fim } = req.query;
            const data = await biService.getBiVendasByCompany(db, { data_inicio, data_fim });
            res.json({ sucesso: true, data });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar faturamento por empresa:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 4. Faturamento Diarizado (Gráfico de Linha)
    router.get('/bi/sales/daily', async (req, res) => {
        try {
            const { empresa_id, data_inicio, data_fim } = req.query;
            const data = await biService.getBiVendasDaily(db, { empresa_id, data_inicio, data_fim });
            res.json({ sucesso: true, data });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar faturamento diarizado:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 5. Seed / Gerar Dados Realistas de Demonstração (Vendas)
    router.post('/bi/seed-mock', async (req, res) => {
        try {
            const result = await biService.seedRealisticBiMockData(db);
            res.json({ sucesso: true, ...result });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao gerar dados de mock para o BI:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // =========================================================================
    // ROTAS DO POWER BI - ESTOQUE & PRODUTOS
    // =========================================================================

    // 6. Resumo Geral de Estoque (5 KPIs + Gráficos Empresa, Estrutura e Fornecedores)
    router.get('/bi/stock/summary', async (req, res) => {
        try {
            const { empresa_id, tipo_custo } = req.query;
            const summary = await biService.getBiEstoqueSummary(db, {
                empresa_id,
                tipo_custo: tipo_custo || 'custo_medio_fiscal'
            });
            res.json({ sucesso: true, ...summary });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar resumo de estoque do BI:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 7. Curva ABC de Estoque (Pareto, Donuts e Tabela de 5 Custos)
    router.get('/bi/stock/curva-abc', async (req, res) => {
        try {
            const { empresa_id, tipo_custo, agrupador } = req.query;
            const data = await biService.getBiEstoqueCurvaABC(db, {
                empresa_id,
                tipo_custo: tipo_custo || 'custo_medio_fiscal',
                agrupador: agrupador || 'subgrupo'
            });
            res.json({ sucesso: true, ...data });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar curva ABC de estoque:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 8. Tabela de Produtos e Posição de Estoque Detalhada
    router.get('/bi/stock/products', async (req, res) => {
        try {
            const { empresa_id, busca, curva_abc, situacao, page, limit } = req.query;
            const data = await biService.getBiEstoqueProducts(db, {
                empresa_id,
                busca,
                curva_abc,
                situacao,
                page: page || 1,
                limit: limit || 50
            });
            res.json({ sucesso: true, ...data });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao buscar produtos de estoque:', { query: req.query, error: error.message, stack: error.stack });
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 9. Iniciar Sincronização em Segundo Plano com Integrim CISS Poder
    router.post('/bi/stock/sync-integrim', async (req, res) => {
        try {
            const { startIntegrimBackgroundSync } = await import('../services/integrimSyncService.js');
            const forceFull = req.body?.force_full === true;

            // Busca conexão ativa do CISS Poder
            const [erpConns] = await db.getPool().execute("SELECT * FROM erp_connections WHERE type = 'cisspoder' ORDER BY id DESC LIMIT 1");
            if (erpConns.length === 0) {
                return res.status(400).json({ sucesso: false, erro: 'Nenhuma conexão com CISS Poder cadastrada em Integrações > ERPs.' });
            }

            const connection = erpConns[0];
            if (typeof connection.credentials === 'string') {
                connection.credentials = JSON.parse(connection.credentials);
            }

            // Inicia a sincronização desacoplada em background (Incremental se houver sincronização prévia ou forçada completa)
            const result = await startIntegrimBackgroundSync(connection, db, { forceFull });
            res.json(result);
        } catch (error) {
            logger.error('[BiRoutes] Erro ao disparar sincronização com Integrim CISS Poder:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 9.1. Consultar Status da Sincronização em Segundo Plano (e Última Sincronização Concluída)
    router.get('/bi/stock/sync-status', async (req, res) => {
        try {
            const { getIntegrimSyncStatus } = await import('../services/integrimSyncService.js');
            const status = await getIntegrimSyncStatus(db);
            res.json({ sucesso: true, status });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao consultar status da sincronização:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    // 10. Teste Diagnóstico de 1 Produto no Integrim (Validação dos 3 Endpoints)
    router.post('/bi/stock/test-single-product', async (req, res) => {
        try {
            const { testSyncSingleProduct } = await import('../services/integrimSyncService.js');
            const { idsubproduto, codigo_barras } = req.body || {};

            // Busca conexão ativa do CISS Poder
            const [erpConns] = await db.getPool().execute("SELECT * FROM erp_connections WHERE type = 'cisspoder' ORDER BY id DESC LIMIT 1");
            if (erpConns.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Nenhuma conexão com CISS Poder cadastrada em Integrações > ERPs.',
                    ajuda: 'Por favor, vá em Integrações > ERPs e cadastre a URL da API (ex: https://api.ciss.com.br), Usuário e Senha de acesso.'
                });
            }

            const connection = erpConns[0];
            if (typeof connection.credentials === 'string') {
                connection.credentials = JSON.parse(connection.credentials);
            }

            const result = await testSyncSingleProduct(connection, db, { idsubproduto, codigo_barras });
            res.json({ sucesso: true, ...result });
        } catch (error) {
            logger.error('[BiRoutes] Erro no teste de 1 produto com Integrim CISS:', error);
            res.status(500).json({
                sucesso: false,
                erro: error.message,
                detalhes: error.response?.data || null
            });
        }
    });

    // 11. Seed de Demonstração Realista de Estoque
    router.post('/bi/stock/seed-mock', async (req, res) => {
        try {
            const { seedRealisticEstoqueMockData } = await import('../services/integrimSyncService.js');
            const result = await seedRealisticEstoqueMockData(db);
            res.json({ sucesso: true, ...result });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao gerar dados de mock de estoque:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    return router;
};

