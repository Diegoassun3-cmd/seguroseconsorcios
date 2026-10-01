/* Solua — dados e montagem da página de Consórcios. */
(function(){
"use strict";
const P = window.SoluaProductList;

P.cards([
 {nome:"Imóvel", tipo:"Imóvel", texto:"Comprar, construir, reformar ou quitar financiamento, sem juros."},
 {nome:"Automóvel", tipo:"Automóvel", texto:"Novo ou seminovo, com crédito à vista para negociar melhor."},
 {nome:"Pesados e máquinas", tipo:"Pesados / Máquinas", texto:"Caminhões e equipamentos sem comprometer o capital de giro."},
 {nome:"Serviços", tipo:"Serviços", texto:"Reforma, viagem, estudos ou saúde, planejados em parcelas."}
], "conCards", "Simular");

P.passos([
 ["Simule a carta","Escolha o valor de crédito e o prazo que cabem no seu mês."],
 ["Entre no grupo","Indicamos o grupo com o melhor histórico de contemplação."],
 ["Seja contemplado","Por sorteio mensal ou por lance — explicamos cada modalidade."],
 ["Compre à vista","Use a carta como dinheiro na mão e negocie melhor."]
], "conPassos");

P.faq([
 ["Qual a diferença entre consórcio e financiamento?","No financiamento você paga juros ao banco e leva o bem na hora. No consórcio não há juros — apenas taxa de administração — e o bem vem na contemplação, por sorteio ou lance. Consórcio é para quem pode planejar; financiamento, para quem tem pressa."],
 ["Posso usar o FGTS no consórcio de imóvel?","Sim, em muitos casos. O FGTS pode ser usado para dar lance, complementar a carta de crédito ou amortizar parcelas, respeitando as regras da Caixa e da administradora. Analisamos seu caso antes de qualquer contratação."],
 ["O que é lance e como funciona?","É uma oferta para antecipar a contemplação, paga com recurso próprio (lance livre ou fixo) ou descontada do próprio crédito (lance embutido). Explicamos as modalidades e o histórico do grupo antes de você decidir ofertar."],
 ["Se eu não for sorteado, perco o dinheiro pago?","Não. Você segue no grupo até ser contemplado — por sorteio ou lance — ou pode desistir e entrar na fila de restituição, conforme as regras da administradora."],
 ["Consigo trocar de carta de crédito depois de contemplado?","Em geral sim, dentro de regras da administradora (categoria semelhante, por exemplo). Consulte seu consultor antes de qualquer decisão para não perder benefícios do plano."],
 ["Vocês atendem fora de Campinas?","Sim, atendemos todo o Brasil de forma remota para consórcios, com o mesmo consultor do início à contemplação."]
], "faqList");

window.SoluaQuote.mount("quoteMount", "consorcio");
window.SoluaChrome.observeReveals();
})();
