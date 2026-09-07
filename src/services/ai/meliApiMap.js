/**
 * MAPA DE CAPACIDADES E ECOSSISTEMA DE DADOS DA API DO MERCADO LIVRE
 * 
 * Este catálogo detalha todos os recursos, dados, métricas e endpoints disponibilizados
 * pela API oficial do Mercado Livre (MLB), servindo como guia semântico para a IA saber
 * exatamente o que cada consulta entrega antes de executá-la.
 */

export const MELI_API_DOMAINS = {
  anuncios_catalogo: {
    dominio: 'Anúncios, Preços, Catálogo & Buy Box',
    descricao: 'Gestão completa do ciclo de vida dos anúncios, concorrência de catálogo (Buy Box), estoque, taxas e dimensões.',
    recursos: [
      {
        recurso: 'buscar_anuncios_ml',
        endpoint: 'GET /users/{user_id}/items/search + GET /items?ids={ids}',
        quando_usar: 'Para buscar anúncios por título, SKU, status (ativo/pausado), faixa de preço ou margem.',
        dados_retornados: [
          'item_id (MLB...)',
          'sku',
          'titulo',
          'preco (R$)',
          'estoque (quantidade)',
          'status (active, paused, closed)',
          'tipo_anuncio (gold_special=Clássico, gold_pro=Premium)',
          'catalogo (true/false se concorre na Buy Box)',
          'status_catalogo (winning, losing, share)',
          'preco_para_ganhar_buybox (preço do concorrente vencedor)',
          'taxa_ml (comissão cobrada pelo Mercado Livre)',
          'frete_vendedor (custo de envio subsidiado pelo vendedor)',
          'valor_liquido (R$ restante após taxas e frete)',
          'margem_liquida_percent (% de margem de lucro calculada)',
          'categoria (nome e ID)'
        ]
      },
      {
        recurso: 'obter_detalhes_anuncio_ml',
        endpoint: 'GET /items/{item_id}',
        quando_usar: 'Para inspecionar um anúncio específico em detalhes (fotos, atributos fiscais, variações de cor/tamanho, garantia).',
        dados_retornados: [
          'dados_completos_do_item',
          'atributos_tecnicos (marca, modelo, EAN/GTIN)',
          'dimensoes_e_peso (para cálculo de frete)',
          'fotos_e_galeria (URLs em alta resolução)',
          'variacoes (atributos por variação de SKU)'
        ]
      },
      {
        recurso: 'consultar_saude_e_visitas_anuncio_ml',
        endpoint: 'GET /items/{item_id}/health_details + GET /items/{item_id}/visits/time_window',
        quando_usar: 'Para diagnosticar a qualidade do anúncio (nota de 0 a 100%), pendências de SEO/ficha técnica e volume de visitas.',
        dados_retornados: [
          'saude_percentual (0% a 100%)',
          'nivel_qualidade (básico, padrão, profissional)',
          'acoes_recomendadas (fotos faltando, atributos pendentes, tempo de resposta)',
          'total_visitas (visualizações recebidas no período)',
          'estimativa_conversao (vendas / visitas)'
        ]
      }
    ]
  },

  vendas_pedidos: {
    dominio: 'Vendas, Pedidos & Faturamento (Orders)',
    descricao: 'Histórico de pedidos faturados, ticket médio, faturamento por período, status de pagamento e itens vendidos.',
    recursos: [
      {
        recurso: 'consultar_vendas_e_pedidos_ml',
        endpoint: 'GET /orders/search?seller={user_id}',
        quando_usar: 'Para auditar faturamento total, faturamento recente (hoje, 7 dias, 30 dias), ticket médio, pedidos recentes e produtos mais vendidos.',
        dados_retornados: [
          'total_pedidos',
          'faturamento_bruto_total (R$)',
          'ticket_medio (R$)',
          'pedidos_recentes (lista com order_id, data, comprador, valor_total, status_pagamento)',
          'itens_mais_vendidos (ranking de produtos com maior volume)',
          'taxas_ml_totais_pagas (total de comissões debitadas nos pedidos)'
        ]
      }
    ]
  },

  reputacao_qualidade: {
    dominio: 'Reputação do Vendedor & Saúde da Conta',
    descricao: 'Métricas de reputação do vendedor, nível de MercadoLíder, termômetro e índices de reclamação/atraso.',
    recursos: [
      {
        recurso: 'consultar_reputacao_e_metricas_ml',
        endpoint: 'GET /users/{user_id} + GET /users/{user_id}/reputation_metrics',
        quando_usar: 'Para checar o termômetro da conta (Verde, Amarelo, Laranja, Vermelho), status MercadoLíder (Gold/Platinum) e risco de penalizações.',
        dados_retornados: [
          'nivel_reputacao (5_green, 4_light_green, 3_yellow, 2_orange, 1_red)',
          'status_mercadolider (silver, gold, platinum, null)',
          'taxa_reclamacoes (% de pedidos com reclamação - limite tolerado < 3%)',
          'taxa_mediacoes (% de casos onde o ML teve que intervir - limite tolerado < 0.5%)',
          'taxa_despachos_atrasados (% de envios postados com atraso - limite tolerado < 15%)',
          'taxa_cancelamentos (% de vendas canceladas pelo vendedor - limite tolerado < 1%)',
          'total_vendas_completadas_historico',
          'diagnostico_geral (se a conta está segura ou sob risco)'
        ]
      }
    ]
  },

  marketing_promocoes: {
    dominio: 'Marketing, Promoções & Campanhas',
    descricao: 'Campanhas promocionais ativas no Mercado Livre, descontos relâmpago, co-funding e elegibilidade de itens.',
    recursos: [
      {
        recurso: 'consultar_promocoes_e_campanhas_ml',
        endpoint: 'GET /seller-promotions/promotions + GET /seller-promotions/promotions/{id}/items',
        quando_usar: 'Para identificar quais produtos podem entrar em campanhas promocionais do Mercado Livre e quais descontos são exigidos.',
        dados_retornados: [
          'campanhas_ativas (nome da campanha, tipo, data de início e fim)',
          'tipo_promocao (CAMPANHA_ML, DESCONTO_INDIVIDUAL, OFERTA_RELAMPAGO, CO_FUNDING_ML)',
          'itens_elegiveis (anúncios que podem participar)',
          'desconto_minimo_exigido (%)',
          'participacao_ml (% de desconto subsidiado pelo próprio Mercado Livre no co-funding)'
        ]
      }
    ]
  },

  publicidade_ads: {
    dominio: 'Publicidade & Product Ads (Mercado Ads)',
    descricao: 'Desempenho de campanhas patrocinadas, ACOS (custo publicitário sobre vendas), investimento e receita gerada por anúncios.',
    recursos: [
      {
        recurso: 'consultar_publicidade_ads_ml',
        endpoint: 'GET /advertising/product_ads/campaigns + GET /advertising/product_ads/ads',
        quando_usar: 'Para analisar a eficiência dos anúncios patrocinados, se o ACOS está dentro da margem saudável e quais anúncios geram mais vendas.',
        dados_retornados: [
          'campanhas_ads_ativas (nome, orçamento diário, status)',
          'investimento_total_ads (R$ gasto em publicidade)',
          'receita_gerada_ads (R$ faturado em vendas atribuídas a Ads)',
          'acos_geral_percent (% de custo de publicidade sobre vendas - ACOS)',
          'impressoes_e_cliques (total de visualizações e cliques nos anúncios patrocinados)',
          'cpc_medio (custo médio por clique)',
          'anuncios_com_melhor_retorno (maior ROAS / menor ACOS)',
          'anuncios_com_acos_critico (gastando sem converter)'
        ]
      }
    ]
  },

  atendimento_sac: {
    dominio: 'Atendimento ao Cliente, Pré-venda & Pós-venda',
    descricao: 'Perguntas pendentes de compradores na pré-venda, mensagens de pós-venda e reclamações abertas (Claims).',
    recursos: [
      {
        recurso: 'consultar_perguntas_e_atendimento_ml',
        endpoint: 'GET /questions/search?seller_id={user_id}&status=UNANSWERED + GET /claims/search',
        quando_usar: 'Para verificar se há dúvidas de clientes aguardando resposta (pré-venda) ou reclamações abertas que precisam de tratativa rápida.',
        dados_retornados: [
          'total_perguntas_sem_resposta',
          'perguntas_pendentes (id_pergunta, texto_pergunta, item_id, titulo_anuncio, data_pergunta)',
          'total_reclamacoes_abertas',
          'reclamacoes_criticas (claim_id, motivo, pedido_id, data_abertura, prazo_de_resposta)'
        ]
      }
    ]
  }
};

/**
 * Retorna o mapa formatado e resumido para consumo dinâmico pela IA
 * @param {string} [filtroDominio] - Filtra por um domínio específico
 * @returns {object} Resumo estruturado das capacidades da API
 */
export function getMeliApiCatalog(filtroDominio = '') {
  if (filtroDominio && MELI_API_DOMAINS[filtroDominio]) {
    return {
      dominio_selecionado: MELI_API_DOMAINS[filtroDominio]
    };
  }

  const catalogoResumido = {};
  for (const [chave, info] of Object.entries(MELI_API_DOMAINS)) {
    catalogoResumido[chave] = {
      titulo: info.dominio,
      descricao: info.descricao,
      ferramentas_disponiveis: info.recursos.map(r => ({
        ferramenta: r.recurso,
        quando_usar: r.quando_usar,
        principais_metricas: r.dados_retornados.slice(0, 5)
      }))
    };
  }

  return {
    ecossistema_mercado_livre: catalogoResumido,
    instrucao_ia: 'Consulte o mapa acima para escolher a ferramenta com maior assertividade antes de buscar dados da conta.'
  };
}
