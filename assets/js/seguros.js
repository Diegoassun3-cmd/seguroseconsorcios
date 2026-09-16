/* Solua — dados e montagem da página de Seguros. */
(function(){
"use strict";
const seguros = [
 ["Seguro Auto","Cobertura para colisão, roubo, furto, incêndio e terceiros — com assistência 24h, carro reserva e vidros. Comparamos franquia, cobertura e preço entre as principais seguradoras.",["Assistência 24h","Carro reserva","Vidros","Terceiros"],"Pessoa física"],
 ["Seguro Residencial","Protege sua casa contra incêndio, roubo, danos elétricos e vendaval, com assistência para chaveiro, encanador e eletricista. Custa menos do que a maioria imagina.",["Incêndio","Roubo","Danos elétricos","Assistência lar"],"Pessoa física"],
 ["Seguro de Vida","Tranquilidade para quem fica e cobertura para você em caso de invalidez ou doenças graves. Capital ajustável ao seu momento de vida.",["Morte","Invalidez","Doenças graves","Funeral"],"Pessoa física"],
 ["Seguro Viagem","Cobertura médica, bagagem, cancelamento e assistência internacional — incluindo apólices que atendem à exigência do Tratado de Schengen.",["Médico","Bagagem","Cancelamento","Schengen"],"Pessoa física"],
 ["Garantia Locatícia e Fiança","Alternativa ao fiador e ao depósito caução, para locatário e proprietário. Aprovação rápida e sem imobilizar capital.",["Sem fiador","Aprovação rápida","Proprietário","Locatário"],"Pessoa física"],
 ["Seguro Empresarial","Patrimônio, estoque, lucros cessantes e responsabilidade civil. Montamos a apólice conforme o risco real da sua operação.",["Patrimônio","Lucros cessantes","RC","Equipamentos"],"Empresas"],
 ["Plano de Saúde e Odonto","Individual, familiar ou empresarial. Comparamos rede credenciada, coparticipação e reajuste antes de você assinar.",["Individual","Familiar","PME","Odonto"],"Empresas"],
 ["Condomínio e Frota","Apólices coletivas para condomínios e gestão de frota para empresas, com controle centralizado de sinistros e renovações.",["Obrigatório por lei","Frota","Gestão de sinistros"],"Empresas"]
];
window.SoluaProductList.render(seguros, "segList", "segTabs");

const faqs = [
 ["Vocês cobram alguma taxa pela cotação?","Não. A cotação e a consultoria são gratuitas. A corretora é remunerada pela seguradora quando você contrata — e isso não encarece sua apólice."],
 ["Por que cotar com uma corretora e não direto no site da seguradora?","Porque no site você vê uma proposta; com a gente você vê o mercado. Comparamos coberturas, franquias e condições entre várias companhias e explicamos as diferenças que a tabela não mostra — além de estarmos ao seu lado na hora do sinistro."],
 ["O que acontece se eu precisar acionar o seguro?","Você fala com o seu consultor Solua, não com um call center. Orientamos a documentação, abrimos o aviso de sinistro e acompanhamos a análise até o pagamento ou o reparo."],
 ["Quais documentos preciso ter em mãos para renovar minha apólice?","Geralmente CNH e documento do veículo (auto), matrícula ou contrato de locação (residencial) e comprovante de renda atualizado, quando aplicável. Seu consultor confirma a lista exata antes do vencimento."],
 ["Posso mudar de seguradora antes do fim da vigência?","Sim, mas normalmente há multa proporcional ao tempo restante. Fazemos essa conta com você para saber se a troca compensa financeiramente."],
 ["Vocês atendem fora de Campinas?","Sim. Atendemos toda a região metropolitana e, para seguros, todo o Brasil de forma remota — com o mesmo consultor do início ao fim."]
];
document.getElementById("faqList").innerHTML = faqs.map(f=>`
<div class="item"><div class="item-hd"><h3>${f[0]}</h3><span class="plus"></span></div>
<div class="item-bd"><div class="in"><p>${f[1]}</p></div></div></div>`).join("");

window.SoluaQuote.mount("quoteMount", "seguro");
window.SoluaChrome.observeReveals();
})();
