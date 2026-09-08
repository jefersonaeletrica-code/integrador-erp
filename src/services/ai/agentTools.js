import { getLogger } from '../../core/logger.js';
import * as meliService from '../mercadolivre.service.js';

const logger = getLogger();

/**
 * Definições de Schemas das Ferramentas para a API do Google Gemini (Function Declarations)
 */
export const toolDeclarations = [
  {
    name: 'buscar_anuncios_ml',
    description: 'Busca anúncios ativos/pausados no catálogo local da loja (preço atual, estoque, taxas ML, status Buy Box). ATENÇÃO: NÃO USE esta ferramenta para ranking de vendas, produtos mais vendidos, faturamento ou histórico de pedidos (para vendas e pedidos use SEMPRE consultar_vendas_e_pedidos_ml).',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Termo de busca por título ou SKU' },
        status: { type: 'STRING', description: 'Status do anúncio: "active", "paused", "closed"' },
        catalog_listing: { type: 'BOOLEAN', description: 'Se true, filtra apenas anúncios de catálogo (Buy Box)' },
        price_min: { type: 'NUMBER', description: 'Preço mínimo em R$' },
        price_max: { type: 'NUMBER', description: 'Preço máximo em R$' },
        max_margin_percent: { type: 'NUMBER', description: 'Filtra anúncios cuja margem líquida calculada seja menor ou igual a esta porcentagem (ex: 15)' },
        limit: { type: 'INTEGER', description: 'Quantidade máxima de resultados a retornar (padrão: 15, máximo: 50)' }
      }
    }
  },
  {
    name: 'obter_detalhes_anuncio_ml',
    description: 'Obtém todos os detalhes cadastrais e financeiros de um anúncio específico do Mercado Livre pelo item_id (MLB...).',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio no Mercado Livre (ex: "MLB5236177178")' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'simular_taxas_e_margem',
    description: 'Calcula e simula com exatidão as taxas oficiais do Mercado Livre (comissão percentual da categoria, taxa fixa unitária, custo de frete Mercado Envios e valor líquido restante) para um preço proposto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio caso exista (opcional)' },
        preco: { type: 'NUMBER', description: 'Preço de venda simulado em R$ (obrigatório)' },
        categoria_id: { type: 'STRING', description: 'ID da categoria do ML (ex: "MLB269929")' },
        tipo_anuncio: { type: 'STRING', description: '"gold_special" (Clássico) ou "gold_pro" (Premium)' },
        custo_produto: { type: 'NUMBER', description: 'Preço de custo do produto para calcular o lucro líquido em R$ e margem em %' }
      },
      required: ['preco']
    }
  },
  {
    name: 'atualizar_preco_anuncio_ml',
    description: 'Altera o preço de venda de um anúncio diretamente no Mercado Livre e sincroniza o banco de dados.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio no Mercado Livre (ex: "MLB5236177178")' },
        novo_preco: { type: 'NUMBER', description: 'Novo preço de venda em R$' },
        motivo: { type: 'STRING', description: 'Justificativa ou estratégia para a alteração do preço' }
      },
      required: ['item_id', 'novo_preco']
    }
  },
  {
    name: 'atualizar_estoque_anuncio_ml',
    description: 'Ajusta a quantidade de estoque disponível de um anúncio no Mercado Livre.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio no Mercado Livre (ex: "MLB5236177178")' },
        novo_estoque: { type: 'INTEGER', description: 'Nova quantidade em estoque' },
        motivo: { type: 'STRING', description: 'Motivo do ajuste' }
      },
      required: ['item_id', 'novo_estoque']
    }
  },
  {
    name: 'otimizar_titulo_descricao_ml',
    description: 'Atualiza o título (máx. 60 caracteres) e/ou a descrição em texto puro de um anúncio no Mercado Livre.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio no Mercado Livre' },
        novo_titulo: { type: 'STRING', description: 'Novo título otimizado para SEO (máximo de 60 caracteres)' },
        nova_descricao: { type: 'STRING', description: 'Nova descrição estruturada em texto puro' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'consultar_estoque_fornecedor',
    description: 'Consulta o catálogo de produtos importados dos fornecedores (Dismatal, Bling, etc.) para verificar preço de custo e estoque disponível.',
    parameters: {
      type: 'OBJECT',
      properties: {
        termo_busca: { type: 'STRING', description: 'Nome ou descrição do produto' },
        codigo: { type: 'STRING', description: 'Código ou SKU exato do produto no fornecedor' },
        limit: { type: 'INTEGER', description: 'Limite de registros (padrão: 10)' }
      }
    }
  },
  {
    name: 'analisar_oportunidades_buybox',
    description: 'Lista todos os anúncios de catálogo do Mercado Livre que estão perdendo a Buy Box ("losing" ou "share"), mostrando o preço atual vs o preço do concorrente vencedor.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'INTEGER', description: 'Limite de oportunidades a listar (padrão: 15)' }
      }
    }
  },
  {
    name: 'resumo_geral_loja',
    description: 'Gera um resumo consolidado das métricas de toda a loja (total de anúncios ativos, anúncios de catálogo, itens com baixa rentabilidade e status geral).',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'consultar_mapa_capacidades_ml',
    description: 'Consulta o catálogo e mapa completo de todas as capacidades, dados e métricas disponibilizados pela API do Mercado Livre (anúncios, vendas, reputação, promoções, publicidade Ads, SAC). Use antes de fazer buscas para saber qual ferramenta atende com máxima assertividade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dominio: {
          type: 'STRING',
          description: 'Opcional: filtrar por domínio específico ("anuncios_catalogo", "vendas_pedidos", "reputacao_qualidade", "marketing_promocoes", "publicidade_ads", "atendimento_sac")'
        }
      }
    }
  },
  {
    name: 'consultar_vendas_e_pedidos_ml',
    description: 'OBRIGATÓRIO para consultar histórico de vendas, faturamento bruto, ticket médio e RANKING EXATO DOS PRODUTOS MAIS VENDIDOS em qualquer período (hoje, 7 dias, 30 dias, 60 dias, 12 meses / 365 dias ou histórico completo). SEMPRE use esta ferramenta para perguntas sobre: "produto mais vendido", "campeão de vendas", "volume de vendas", "faturamento dos últimos X meses/dias" ou "pedidos". Retorna faturamento, unidades vendidas e margem líquida calculada por produto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dias: { type: 'INTEGER', description: 'Quantidade de dias retroativos para analisar vendas (ex: 365 para últimos 12 meses/1 ano, 180 para 6 meses, 90 para 3 meses, 30 para 30 dias). Deixe vazio para pegar todo o histórico disponível.' },
        max_pedidos: { type: 'INTEGER', description: 'Limite opcional de pedidos a coletar. Padrão: sem limite (busca todos os pedidos existentes via paginação completa).' },
        status: { type: 'STRING', description: 'Status dos pedidos: "paid" (pagos), "cancelled" (cancelados), "all" (todos). Padrão: "paid"' }
      }
    }
  },
  {
    name: 'consultar_reputacao_e_metricas_ml',
    description: 'Consulta o termômetro de reputação da conta no Mercado Livre, medalha MercadoLíder (Gold/Platinum), taxa de reclamações, mediações, atrasos no envio e cancelamentos com diagnóstico de saúde da conta.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'consultar_promocoes_e_campanhas_ml',
    description: 'Consulta as campanhas de marketing, promoções ativas e oportunidades de descontos co-financiados pelo Mercado Livre disponíveis para a conta.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'consultar_publicidade_ads_ml',
    description: 'Consulta o desempenho de campanhas de publicidade do Mercado Ads / Product Ads (orçamento diário, campanhas ativas e estratégias de ACOS).',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'consultar_perguntas_e_atendimento_ml',
    description: 'Consulta perguntas não respondidas de clientes na pré-venda e histórico de atendimento no Mercado Livre.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: '"UNANSWERED" (perguntas pendentes) ou "ANSWERED" (já respondidas)' }
      }
    }
  },
  {
    name: 'consultar_saude_e_visitas_anuncio_ml',
    description: 'Diagnostica a nota de saúde (qualidade do anúncio de 0 a 100%), pendências de SEO/ficha técnica e volume de visitas dos últimos 30 dias de um anúncio específico.',
    parameters: {
      type: 'OBJECT',
      properties: {
        item_id: { type: 'STRING', description: 'ID do anúncio no Mercado Livre (ex: "MLB5236177178")' }
      },
      required: ['item_id']
    }
  },
  {
    name: 'consultar_outro_agente',
    description: 'Permite consultar outro agente especialista caso o usuário solicite expressamente a opinião de outro colega ou caso falte dados de outra área. Não use de forma redundante em perguntas comuns para manter alta velocidade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        agent_slug: {
          type: 'STRING',
          description: 'Identificador único (slug) do agente especialista a ser consultado (ex: "auditor-taxas", "estrategista-buybox", "otimizador-seo", "guardiao-estoque")'
        },
        pergunta_ou_contexto: {
          type: 'STRING',
          description: 'Instrução clara, pergunta técnica ou contexto de dados que o agente especialista deve analisar'
        }
      },
      required: ['agent_slug', 'pergunta_ou_contexto']
    }
  }
];

/**
 * Executores das Ferramentas
 */
export const toolExecutors = {
  /**
   * Busca anúncios no banco local
   */
  async buscar_anuncios_ml(args, { db }) {
    const pool = db.getPool();
    let query = `
      SELECT item_id, sku, title, price, available_quantity, status, listing_type_id,
             catalog_listing, catalog_status, catalog_price_to_win,
             sale_fee_amount, shipping_cost, net_amount, category_id, category_name,
             ROUND((net_amount / price) * 100, 1) as net_percent
      FROM mercado_livre_anuncios
      WHERE 1=1
    `;
    const params = [];

    if (args.query) {
      query += ' AND (title LIKE ? OR sku LIKE ? OR item_id LIKE ?)';
      params.push(`%${args.query}%`, `%${args.query}%`, `%${args.query}%`);
    }
    if (args.status) {
      query += ' AND status = ?';
      params.push(args.status);
    }
    if (args.catalog_listing !== undefined) {
      query += ' AND catalog_listing = ?';
      params.push(args.catalog_listing ? 1 : 0);
    }
    if (args.price_min !== undefined) {
      query += ' AND price >= ?';
      params.push(parseFloat(args.price_min));
    }
    if (args.price_max !== undefined) {
      query += ' AND price <= ?';
      params.push(parseFloat(args.price_max));
    }
    if (args.max_margin_percent !== undefined) {
      query += ' AND (net_amount / price) * 100 <= ?';
      params.push(parseFloat(args.max_margin_percent));
    }

    const limit = Math.min(parseInt(args.limit || 15, 10), 50);
    query += ' ORDER BY price ASC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return {
      total_encontrados: rows.length,
      anuncios: rows.map(r => ({
        item_id: r.item_id,
        sku: r.sku,
        titulo: r.title,
        preco: parseFloat(r.price),
        estoque: r.available_quantity,
        status: r.status,
        tipo_anuncio: r.listing_type_id,
        catalogo: !!r.catalog_listing,
        status_catalogo: r.catalog_status,
        preco_para_ganhar_buybox: r.catalog_price_to_win ? parseFloat(r.catalog_price_to_win) : null,
        taxa_ml: r.sale_fee_amount ? parseFloat(r.sale_fee_amount) : null,
        frete_vendedor: r.shipping_cost ? parseFloat(r.shipping_cost) : 0,
        valor_liquido: r.net_amount ? parseFloat(r.net_amount) : null,
        margem_liquida_percent: r.net_percent ? parseFloat(r.net_percent) : null,
        categoria: r.category_name || r.category_id
      }))
    };
  },

  /**
   * Obtém detalhes de um anúncio
   */
  async obter_detalhes_anuncio_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ? LIMIT 1', [args.item_id]);
    if (rows.length === 0) {
      return { erro: `Anúncio com ID ${args.item_id} não foi encontrado no banco de dados local.` };
    }
    const item = rows[0];
    const safeJson = (d) => {
      if (!d) return null;
      if (typeof d === 'string') {
        try { return JSON.parse(d); } catch { return d; }
      }
      return d;
    };

    return {
      item_id: item.item_id,
      sku: item.sku,
      titulo: item.title,
      preco: parseFloat(item.price),
      estoque: item.available_quantity,
      status: item.status,
      tipo_anuncio: item.listing_type_id,
      link: item.permalink,
      thumbnail: item.thumbnail,
      video_url: item.video_url,
      catalogo: {
        is_catalog: !!item.catalog_listing,
        product_id: item.catalog_product_id,
        status: item.catalog_status,
        price_to_win: item.catalog_price_to_win ? parseFloat(item.catalog_price_to_win) : null,
        detalhes: safeJson(item.catalog_details)
      },
      financeiro: {
        taxa_ml_total: item.sale_fee_amount ? parseFloat(item.sale_fee_amount) : null,
        frete_vendedor: item.shipping_cost ? parseFloat(item.shipping_cost) : 0,
        valor_liquido: item.net_amount ? parseFloat(item.net_amount) : null,
        margem_percent: item.price > 0 && item.net_amount ? Math.round(((item.net_amount / item.price) * 100) * 10) / 10 : 0,
        detalhes_taxas: safeJson(item.fee_details)
      },
      categoria: {
        id: item.category_id,
        nome: item.category_name
      }
    };
  },

  /**
   * Simula taxas e rentabilidade
   */
  async simular_taxas_e_margem(args, { db }) {
    const pool = db.getPool();
    const [conns] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    const conn = conns[0] || { site_id: 'MLB', credentials: {} };
    if (typeof conn.credentials === 'string') {
      try { conn.credentials = JSON.parse(conn.credentials); } catch(e) {}
    }

    const calcResult = await meliService.calculateItemFeesAndNet(conn, {
      id: args.item_id,
      item_id: args.item_id,
      price: parseFloat(args.preco),
      listing_type_id: args.tipo_anuncio || 'gold_special',
      category_id: args.categoria_id || null
    }, db);

    const custo = args.custo_produto !== undefined ? parseFloat(args.custo_produto) : null;
    let lucroReal = null;
    let margemLucroRealPercent = null;

    if (custo !== null && !isNaN(custo)) {
      lucroReal = Math.round((calcResult.net_amount - custo) * 100) / 100;
      margemLucroRealPercent = args.preco > 0 ? Math.round(((lucroReal / args.preco) * 100) * 10) / 10 : 0;
    }

    return {
      preco_simulado: calcResult.price,
      tipo_anuncio: args.tipo_anuncio || 'gold_special',
      comissao_ml_total: calcResult.sale_fee_amount,
      detalhamento_taxas: {
        aliquota_categoria_percent: calcResult.fee_details?.percentage_fee || 14,
        comissao_percentual_reais: Math.round((calcResult.price * ((calcResult.fee_details?.percentage_fee || 14) / 100)) * 100) / 100,
        taxa_fixa_unitária: calcResult.fee_details?.fixed_fee || 0
      },
      frete_vendedor: calcResult.shipping_cost,
      frete_gratis_ativo: calcResult.fee_details?.free_shipping || false,
      valor_liquido_recebido: calcResult.net_amount,
      percentual_liquido_venda: calcResult.net_percent,
      analise_custo_lucro: custo !== null ? {
        custo_produto: custo,
        lucro_liquido_reais: lucroReal,
        margem_lucro_liquida_percent: margemLucroRealPercent,
        status_rentabilidade: lucroReal > 0 ? (margemLucroRealPercent >= 20 ? 'Excelente' : margemLucroRealPercent >= 10 ? 'Aceitável' : 'Baixa') : 'PREJUÍZO'
      } : null
    };
  },

  /**
   * Altera preço do anúncio no Mercado Livre
   */
  async atualizar_preco_anuncio_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ? LIMIT 1', [args.item_id]);
    if (rows.length === 0) {
      throw new Error(`Anúncio ${args.item_id} não encontrado no sistema.`);
    }
    const localItem = rows[0];
    const [conns] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ? LIMIT 1', [localItem.connection_id]);
    if (conns.length === 0) {
      throw new Error(`Conexão do Mercado Livre (ID ${localItem.connection_id}) não encontrada.`);
    }
    const conn = conns[0];
    if (typeof conn.credentials === 'string') conn.credentials = JSON.parse(conn.credentials);

    const novoPreco = parseFloat(args.novo_preco);
    const precoAnterior = parseFloat(localItem.price);

    // Executa a atualização na API do Mercado Livre
    await meliService.updateItem(conn, args.item_id, { price: novoPreco }, db);

    // Recalcula taxas e valor líquido com o novo preço
    const fin = await meliService.calculateItemFeesAndNet(conn, {
      ...localItem,
      price: novoPreco
    }, db);

    // Salva no banco local
    await pool.execute(`
      UPDATE mercado_livre_anuncios 
      SET price = ?, sale_fee_amount = ?, shipping_cost = ?, net_amount = ?, fee_details = ?
      WHERE item_id = ?
    `, [
      novoPreco,
      fin.sale_fee_amount,
      fin.shipping_cost,
      fin.net_amount,
      fin.fee_details ? JSON.stringify(fin.fee_details) : null,
      args.item_id
    ]);

    return {
      sucesso: true,
      item_id: args.item_id,
      preco_anterior: precoAnterior,
      novo_preco: novoPreco,
      novo_valor_liquido: fin.net_amount,
      nova_comissao_ml: fin.sale_fee_amount,
      novo_frete: fin.shipping_cost,
      mensagem: `Preço do anúncio ${args.item_id} alterado com sucesso de R$ ${precoAnterior.toFixed(2)} para R$ ${novoPreco.toFixed(2)}.`
    };
  },

  /**
   * Altera estoque do anúncio no Mercado Livre
   */
  async atualizar_estoque_anuncio_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ? LIMIT 1', [args.item_id]);
    if (rows.length === 0) {
      throw new Error(`Anúncio ${args.item_id} não encontrado no sistema.`);
    }
    const localItem = rows[0];
    const [conns] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ? LIMIT 1', [localItem.connection_id]);
    if (conns.length === 0) {
      throw new Error(`Conexão do Mercado Livre não encontrada.`);
    }
    const conn = conns[0];
    if (typeof conn.credentials === 'string') conn.credentials = JSON.parse(conn.credentials);

    const novoEstoque = parseInt(args.novo_estoque, 10);
    const estoqueAnterior = localItem.available_quantity;

    await meliService.updateItem(conn, args.item_id, { available_quantity: novoEstoque }, db);

    await pool.execute('UPDATE mercado_livre_anuncios SET available_quantity = ? WHERE item_id = ?', [novoEstoque, args.item_id]);

    return {
      sucesso: true,
      item_id: args.item_id,
      estoque_anterior: estoqueAnterior,
      novo_estoque: novoEstoque,
      mensagem: `Estoque do anúncio ${args.item_id} alterado com sucesso de ${estoqueAnterior} para ${novoEstoque} unidade(s).`
    };
  },

  /**
   * Otimiza título e descrição
   */
  async otimizar_titulo_descricao_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM mercado_livre_anuncios WHERE item_id = ? LIMIT 1', [args.item_id]);
    if (rows.length === 0) {
      throw new Error(`Anúncio ${args.item_id} não encontrado no sistema.`);
    }
    const localItem = rows[0];
    const [conns] = await pool.execute('SELECT * FROM marketplace_connections WHERE id = ? LIMIT 1', [localItem.connection_id]);
    if (conns.length === 0) {
      throw new Error(`Conexão do Mercado Livre não encontrada.`);
    }
    const conn = conns[0];
    if (typeof conn.credentials === 'string') conn.credentials = JSON.parse(conn.credentials);

    const updates = {};
    if (args.novo_titulo) {
      const formattedTitle = args.novo_titulo.trim().substring(0, 60);
      await meliService.updateItem(conn, args.item_id, { title: formattedTitle }, db);
      await pool.execute('UPDATE mercado_livre_anuncios SET title = ? WHERE item_id = ?', [formattedTitle, args.item_id]);
      updates.titulo = formattedTitle;
    }

    if (args.nova_descricao) {
      await meliService.updateItemDescription(conn, args.item_id, args.nova_descricao, db);
      updates.descricao_atualizada = true;
    }

    return {
      sucesso: true,
      item_id: args.item_id,
      alteracoes: updates,
      mensagem: `Anúncio ${args.item_id} otimizado com sucesso!`
    };
  },

  /**
   * Consulta estoque de fornecedores
   */
  async consultar_estoque_fornecedor(args, { db }) {
    const pool = db.getPool();
    let query = 'SELECT * FROM produtos_importados WHERE 1=1';
    const params = [];

    if (args.codigo) {
      query += ' AND codigo = ?';
      params.push(args.codigo);
    }
    if (args.termo_busca) {
      query += ' AND (nome LIKE ? OR codigo LIKE ?)';
      params.push(`%${args.termo_busca}%`, `%${args.termo_busca}%`);
    }

    const limit = Math.min(parseInt(args.limit || 10, 10), 30);
    query += ' LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return {
      total_encontrados: rows.length,
      produtos_fornecedor: rows.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        preco_custo: parseFloat(p.preco)
      }))
    };
  },

  /**
   * Analisa oportunidades de Buy Box
   */
  async analisar_oportunidades_buybox(args, { db }) {
    const pool = db.getPool();
    const limit = Math.min(parseInt(args.limit || 15, 10), 50);

    const query = `
      SELECT item_id, sku, title, price, catalog_status, catalog_price_to_win,
             sale_fee_amount, shipping_cost, net_amount,
             ROUND(price - catalog_price_to_win, 2) as diferenca_preco_para_ganhar,
             ROUND(((catalog_price_to_win - IFNULL(sale_fee_amount, 0) - IFNULL(shipping_cost, 0)) / catalog_price_to_win) * 100, 1) as margem_se_igualar_buybox
      FROM mercado_livre_anuncios
      WHERE catalog_listing = 1 AND catalog_status IN ('losing', 'share') AND catalog_price_to_win IS NOT NULL
      ORDER BY diferenca_preco_para_ganhar ASC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limit]);

    return {
      total_oportunidades: rows.length,
      oportunidades: rows.map(r => ({
        item_id: r.item_id,
        sku: r.sku,
        titulo: r.title,
        preco_atual: parseFloat(r.price),
        status_buybox: r.catalog_status,
        preco_vencedor_concorrente: parseFloat(r.catalog_price_to_win),
        desconto_necessario_reais: parseFloat(r.diferenca_preco_para_ganhar),
        margem_estimada_se_ganhar_percent: parseFloat(r.margem_se_igualar_buybox || 0),
        recomendacao: r.margem_se_igualar_buybox > 15 
          ? 'ALTA VIABILIDADE: Reajustar preço para ganhar a Buy Box mantendo excelente margem.' 
          : r.margem_se_igualar_buybox > 8 
            ? 'MÉDIA VIABILIDADE: Reajustar com cautela (margem moderada).' 
            : 'RISCO: Preço para ganhar deixa margem muito apertada ou negativa.'
      }))
    };
  },

  /**
   * Resumo geral da loja
   */
  async resumo_geral_loja(args, { db }) {
    const pool = db.getPool();
    const [totalRows] = await pool.execute('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as ativos FROM mercado_livre_anuncios');
    const [catalogRows] = await pool.execute('SELECT COUNT(*) as total_catalogo, SUM(CASE WHEN catalog_status = "winner" THEN 1 ELSE 0 END) as ganhando_buybox, SUM(CASE WHEN catalog_status = "losing" THEN 1 ELSE 0 END) as perdendo_buybox FROM mercado_livre_anuncios WHERE catalog_listing = 1');
    const [marginRows] = await pool.execute('SELECT COUNT(*) as baixa_margem FROM mercado_livre_anuncios WHERE (net_amount / price) * 100 < 15 AND price > 0');
    const [supplierRows] = await pool.execute('SELECT COUNT(*) as total_fornecedor FROM produtos_importados');

    return {
      metricas_anuncios: {
        total_anuncios_ml: totalRows[0]?.total || 0,
        anuncios_ativos: totalRows[0]?.ativos || 0,
        anuncios_com_margem_critica_menor_15_pct: marginRows[0]?.baixa_margem || 0
      },
      metricas_buybox: {
        total_anuncios_catalogo: catalogRows[0]?.total_catalogo || 0,
        ganhando_buybox: catalogRows[0]?.ganhando_buybox || 0,
        perdendo_buybox: catalogRows[0]?.perdendo_buybox || 0
      },
      fornecedor: {
        produtos_importados_cadastrados: supplierRows[0]?.total_fornecedor || 0
      }
    };
  },

  /**
   * Consulta o Mapa Semântico de Capacidades da API do Mercado Livre
   */
  async consultar_mapa_capacidades_ml(args) {
    const { getMeliApiCatalog } = await import('./meliApiMap.js');
    return getMeliApiCatalog(args.dominio);
  },

  /**
   * Consulta histórico de vendas, faturamento e pedidos
   */
  async consultar_vendas_e_pedidos_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getSellerOrders(connection, db, args);
  },

  /**
   * Consulta a reputação e saúde da conta no Mercado Livre
   */
  async consultar_reputacao_e_metricas_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getSellerReputation(connection, db);
  },

  /**
   * Consulta promoções e campanhas de marketing disponíveis
   */
  async consultar_promocoes_e_campanhas_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getSellerPromotions(connection, db);
  },

  /**
   * Consulta métricas de Product Ads e publicidade
   */
  async consultar_publicidade_ads_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getProductAdsMetrics(connection, db);
  },

  /**
   * Consulta perguntas e atendimento pré-venda
   */
  async consultar_perguntas_e_atendimento_ml(args, { db }) {
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getSellerQuestions(connection, db, args.status || 'UNANSWERED');
  },

  /**
   * Diagnóstico de qualidade e visitas do anúncio
   */
  async consultar_saude_e_visitas_anuncio_ml(args, { db }) {
    if (!args.item_id) {
      return { erro: 'Parâmetro item_id é obrigatório para diagnóstico de saúde e visitas.' };
    }
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT * FROM marketplace_connections WHERE type = "mercadolivre" LIMIT 1');
    if (rows.length === 0) {
      return { erro: 'Nenhuma conexão ativa com o Mercado Livre encontrada.' };
    }
    const connection = { ...rows[0], credentials: typeof rows[0].credentials === 'string' ? JSON.parse(rows[0].credentials) : rows[0].credentials };
    return await meliService.getItemHealthAndVisits(connection, db, args.item_id);
  },

  /**
   * Colaboração Inter-Agentes (Consulta técnica a outro agente especialista)
   */
  async consultar_outro_agente(args, context) {
    const { agent_slug, pergunta_ou_contexto } = args;
    if (!agent_slug || !pergunta_ou_contexto) {
      return { erro: 'Identificador do agente (agent_slug) e pergunta_ou_contexto são obrigatórios.' };
    }

    if (context?.consultationDepth && context.consultationDepth >= 2) {
      return { erro: 'Limite máximo de consultas entre agentes atingido para evitar ciclos.' };
    }

    const { delegateToAgent } = await import('./agentManager.js');
    return await delegateToAgent({
      targetSlug: agent_slug,
      prompt: pergunta_ou_contexto,
      callingAgentId: context?.agentId,
      db: context?.db,
      depth: (context?.consultationDepth || 0) + 1
    });
  }
};

