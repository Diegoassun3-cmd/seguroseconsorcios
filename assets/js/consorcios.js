/* Solua — dados e montagem da página de Consórcios. */
(function(){
"use strict";
const consorcios = [
 ["Consórcio de Imóvel","Para comprar, construir, reformar ou quitar financiamento. Cartas de crédito flexíveis, sem juros e com parcelas que cabem no orçamento.",["Compra","Construção","Reforma","Quitação"],"Pessoa física"],
 ["Consórcio de Automóvel","Carro novo ou seminovo, nacional ou importado. Use o crédito como poder de compra à vista e negocie melhor na concessionária.",["Novo","Seminovo","Crédito à vista"],"Pessoa física"],
 ["Consórcio de Pesados","Caminhões, máquinas agrícolas e equipamentos — planejamento de frota sem comprometer o capital de giro da empresa.",["Caminhões","Máquinas","Frota","PJ"],"Empresas"],
 ["Consórcio de Serviços","Reforma, casamento, intercâmbio, cirurgias e estudos. Planejamento para o que não cabe em uma parcela de cartão.",["Reforma","Viagem","Estudos","Saúde"],"Pessoa física"]
];
window.SoluaProductList.render(consorcios, "conList", "conTabs");

const heroCon = document.getElementById("heroConsorcios");
if(heroCon) heroCon.insertAdjacentHTML("beforeend", window.SoluaChrome.renderSelo({cmsKey:"consorcios.hero.selo", texto:"SEM JUROS PORTO BANK ADEMICON", pos:"br"}));

const faqs = [
 ["Qual a diferença entre consórcio e financiamento?","No financiamento você paga juros ao banco e leva o bem na hora. No consórcio não há juros — apenas taxa de administração — e o bem vem na contemplação, por sorteio ou lance. Consórcio é para quem pode planejar; financiamento, para quem tem pressa."],
 ["Posso usar o FGTS no consórcio de imóvel?","Sim, em muitos casos. O FGTS pode ser usado para dar lance, complementar a carta de crédito ou amortizar parcelas, respeitando as regras da Caixa e da administradora. Analisamos seu caso antes de qualquer contratação."],
 ["O que é lance e como funciona?","É uma oferta para antecipar a contemplação, paga com recurso próprio (lance livre ou fixo) ou descontada do próprio crédito (lance embutido). Explicamos as modalidades e o histórico do grupo antes de você decidir ofertar."],
 ["Se eu não for sorteado, perco o dinheiro pago?","Não. Você segue no grupo até ser contemplado — por sorteio ou lance — ou pode desistir e entrar na fila de restituição, conforme as regras da administradora."],
 ["Consigo trocar de carta de crédito depois de contemplado?","Em geral sim, dentro de regras da administradora (categoria semelhante, por exemplo). Consulte seu consultor antes de qualquer decisão para não perder benefícios do plano."],
 ["Vocês atendem fora de Campinas?","Sim, atendemos todo o Brasil de forma remota para consórcios, com o mesmo consultor do início à contemplação."]
];
document.getElementById("faqList").innerHTML = faqs.map(f=>`
<div class="item"><div class="item-hd"><h3>${f[0]}</h3><span class="plus"></span></div>
<div class="item-bd"><div class="in"><p>${f[1]}</p></div></div></div>`).join("");

window.SoluaQuote.mount("quoteMount", "consorcio");
window.SoluaChrome.observeReveals();
})();
