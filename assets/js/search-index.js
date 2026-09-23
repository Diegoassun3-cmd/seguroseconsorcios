/* ===========================================================
   Solua — índice estático da busca do site (assets/js/site-search.js
   combina isto com o catálogo de imóveis, que já é dinâmico via
   SoluaDB). Site é multi-página e estático, então este índice é
   escrito à mão — mantenha em sincronia com o conteúdo real das
   páginas ao editar títulos/textos por lá.
   =========================================================== */
(function(global){
"use strict";

global.SoluaSearchIndex = [
  // -------- páginas --------
  {tipo:"Página", titulo:"Home", url:"index.html", texto:"Início — imóveis, seguros e consórcios."},
  {tipo:"Página", titulo:"Imóveis", url:"imoveis.html", texto:"Catálogo de imóveis para venda e locação em Campinas."},
  {tipo:"Página", titulo:"Seguros", url:"seguros.html", texto:"Linhas de seguro e simulador de cotação."},
  {tipo:"Página", titulo:"Consórcios", url:"consorcios.html", texto:"Linhas de consórcio, Porto Bank, Ademicon e simulador."},
  {tipo:"Página", titulo:"A Solua", url:"sobre.html", texto:"Nossa história, linha do tempo e equipe."},
  {tipo:"Página", titulo:"Contato", url:"contato.html", texto:"Fale com um consultor, endereço e WhatsApp."},
  {tipo:"Página", titulo:"Blog", url:"blog.html", texto:"Artigos sobre seguros, consórcios, imóveis e planejamento."},

  // -------- seguros --------
  {tipo:"Seguro", titulo:"Seguro Auto", url:"seguros.html", texto:"Cobertura para colisão, roubo, furto, incêndio e terceiros, com assistência 24h e carro reserva."},
  {tipo:"Seguro", titulo:"Seguro Residencial", url:"seguros.html", texto:"Protege sua casa contra incêndio, roubo, danos elétricos e vendaval."},
  {tipo:"Seguro", titulo:"Seguro de Vida", url:"seguros.html", texto:"Cobertura para invalidez, doenças graves e morte, com capital ajustável."},
  {tipo:"Seguro", titulo:"Seguro Viagem", url:"seguros.html", texto:"Cobertura médica, bagagem e cancelamento, inclusive para o Tratado de Schengen."},
  {tipo:"Seguro", titulo:"Garantia Locatícia e Fiança", url:"seguros.html", texto:"Alternativa ao fiador e ao depósito caução."},
  {tipo:"Seguro", titulo:"Seguro Empresarial", url:"seguros.html", texto:"Patrimônio, estoque, lucros cessantes e responsabilidade civil."},
  {tipo:"Seguro", titulo:"Plano de Saúde e Odonto", url:"seguros.html", texto:"Individual, familiar ou empresarial (PME)."},
  {tipo:"Seguro", titulo:"Condomínio e Frota", url:"seguros.html", texto:"Apólices coletivas para condomínios e gestão de frota."},

  // -------- consórcios --------
  {tipo:"Consórcio", titulo:"Consórcio de Imóvel", url:"consorcios.html", texto:"Para comprar, construir, reformar ou quitar financiamento, sem juros."},
  {tipo:"Consórcio", titulo:"Consórcio de Automóvel", url:"consorcios.html", texto:"Carro novo ou seminovo, nacional ou importado."},
  {tipo:"Consórcio", titulo:"Consórcio de Pesados", url:"consorcios.html", texto:"Caminhões, máquinas agrícolas e equipamentos."},
  {tipo:"Consórcio", titulo:"Consórcio de Serviços", url:"consorcios.html", texto:"Reforma, casamento, intercâmbio, cirurgias e estudos."},

  // -------- dúvidas frequentes --------
  {tipo:"Dúvida", titulo:"Vocês cobram alguma taxa pela cotação?", url:"seguros.html", texto:"Não. A cotação e a consultoria são gratuitas."},
  {tipo:"Dúvida", titulo:"Por que cotar com uma corretora?", url:"seguros.html", texto:"Comparamos coberturas, franquias e condições entre várias seguradoras."},
  {tipo:"Dúvida", titulo:"O que acontece se eu precisar acionar o seguro?", url:"seguros.html", texto:"Você fala com seu consultor Solua, não com um call center."},
  {tipo:"Dúvida", titulo:"Qual a diferença entre consórcio e financiamento?", url:"consorcios.html", texto:"No financiamento você paga juros; no consórcio, taxa de administração."},
  {tipo:"Dúvida", titulo:"Posso usar o FGTS no consórcio de imóvel?", url:"consorcios.html", texto:"Sim, em muitos casos — lance, complemento ou amortização."},
  {tipo:"Dúvida", titulo:"O que é lance e como funciona?", url:"consorcios.html", texto:"Livre, fixo ou embutido — antecipa a contemplação."}

  // -------- artigos do blog: indexados dinamicamente por site-search.js,
  // a partir de DB.getPostsPublicados() (ver assets/js/crm-data.js) --------
];
})(window);
