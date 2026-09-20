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

    // 5. Seed / Gerar Dados Realistas de Demonstração
    router.post('/bi/seed-mock', async (req, res) => {
        try {
            const result = await biService.seedRealisticBiMockData(db);
            res.json({ sucesso: true, ...result });
        } catch (error) {
            logger.error('[BiRoutes] Erro ao gerar dados de mock para o BI:', error);
            res.status(500).json({ sucesso: false, erro: error.message });
        }
    });

    return router;
};
