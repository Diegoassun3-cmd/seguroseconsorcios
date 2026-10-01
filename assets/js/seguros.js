/* Solua — dados e montagem da página de Seguros. */
(function(){
"use strict";
const P = window.SoluaProductList;

P.cards([
 {nome:"Auto", tipo:"Auto", texto:"Colisão, roubo, terceiros e assistência 24h, com carro reserva e vidros."},
 {nome:"Residencial", tipo:"Residencial", texto:"Incêndio, roubo e danos elétricos, com chaveiro, encanador e eletricista."},
 {nome:"Vida", tipo:"Vida", texto:"Proteção para quem fica e para você em caso de invalidez ou doença grave."},
 {nome:"Viagem", tipo:"Viagem", texto:"Despesas médicas, bagagem e cancelamento — inclusive para Schengen."},
 {nome:"Fiança locatícia", tipo:"Garantia locatícia", texto:"Alugue sem fiador e sem caução, com aprovação rápida."},
 {nome:"Empresarial", tipo:"Empresarial", texto:"Patrimônio, estoque, lucros cessantes e responsabilidade civil."},
 {nome:"Saúde e odonto", tipo:"Saúde / Odonto", texto:"Individual, familiar ou PME, comparando rede, coparticipação e reajuste."},
 {nome:"Condomínio e frota", tipo:"Condomínio", texto:"Apólices coletivas com gestão centralizada de sinistros e renovações."}
], "segCards", "Cotar");

P.passos([
 ["Você conta o que precisa","Pelo simulador abaixo ou pelo WhatsApp, em poucos minutos."],
 ["Cotamos no mercado","Levamos seu perfil às seguradoras parceiras."],
 ["Explicamos o comparativo","Cobertura, franquia e preço lado a lado, em português claro."],
 ["Seguimos com você","Contratação, sinistro e renovação com o mesmo consultor."]
], "segPassos");

P.faq([
 ["Vocês cobram alguma taxa pela cotação?","Não. A cotação e a consultoria são gratuitas. A corretora é remunerada pela seguradora quando você contrata — e isso não encarece sua apólice."],
 ["Por que cotar com uma corretora e não direto no site da seguradora?","Porque no site você vê uma proposta; com a gente você vê o mercado. Comparamos coberturas, franquias e condições entre várias companhias e explicamos as diferenças que a tabela não mostra — além de estarmos ao seu lado na hora do sinistro."],
 ["O que acontece se eu precisar acionar o seguro?","Você fala com o seu consultor Solua, não com um call center. Orientamos a documentação, abrimos o aviso de sinistro e acompanhamos a análise até o pagamento ou o reparo."],
 ["Quais documentos preciso ter em mãos para renovar minha apólice?","Geralmente CNH e documento do veículo (auto), matrícula ou contrato de locação (residencial) e comprovante de renda atualizado, quando aplicável. Seu consultor confirma a lista exata antes do vencimento."],
 ["Posso mudar de seguradora antes do fim da vigência?","Sim, mas normalmente há multa proporcional ao tempo restante. Fazemos essa conta com você para saber se a troca compensa financeiramente."],
 ["Vocês atendem fora de Campinas?","Sim. Atendemos toda a região metropolitana e, para seguros, todo o Brasil de forma remota — com o mesmo consultor do início ao fim."]
], "faqList");

window.SoluaQuote.mount("quoteMount", "seguro");
window.SoluaChrome.observeReveals();
})();
