/* ===========================================================
   Solua CRM — peças compartilhadas entre a lista de imóveis
   (crm/imoveis-cadastro.html) e o editor (crm/imovel-editor.html):
   rótulos e a nota de qualidade do anúncio.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;

const FINALIDADE = {venda:"Venda", locacao:"Locação", venda_locacao:"Venda e locação"};
const FASE = {pronto:"Pronto para morar", lancamento:"Lançamento", em_construcao:"Em construção", na_planta:"Na planta", reforma:"Precisa de reforma"};
const SEM_COMODOS = new Set(["Terreno","Sala comercial","Loja","Galpão","Rural"]);

// "Nota" do anúncio: cada item vale o mesmo; "aba" diz onde resolver
function qualidade(i){
  const e = i.endereco || {};
  const n = v => Number(v)||0;
  const precoOk = i.ocultarPreco ||
    (i.finalidade==="locacao" ? n(i.precoLocacao)>0 : i.finalidade==="venda_locacao" ? n(i.precoVenda)>0 && n(i.precoLocacao)>0 : n(i.precoVenda!=null?i.precoVenda:i.valor)>0);
  const itens = [
    {ok:(i.fotos||[]).length>=3, texto:"Pelo menos 3 fotos", aba:"fotos"},
    {ok:(i.fotos||[]).length>=8, texto:"8 fotos ou mais", aba:"fotos"},
    {ok:!!(i.titulo||"").trim(), texto:"Título do anúncio", aba:"anuncio"},
    {ok:(i.descricao||"").trim().length>=300, texto:"Descrição com 300+ caracteres", aba:"anuncio"},
    {ok:precoOk, texto:"Preço informado", aba:"sobre"},
    {ok:!!(e.cep && e.logradouro && e.numero && i.bairro && i.cidade), texto:"Endereço completo", aba:"sobre"},
    {ok:n(i.areaM2)>0, texto:"Área útil", aba:"detalhes"},
    {ok:SEM_COMODOS.has(i.tipo) || (n(i.quartos)>0 && n(i.banheiros)>0), texto:"Dormitórios e banheiros", aba:"detalhes"},
    {ok:(i.comodidades||[]).length>=5, texto:"5 comodidades ou mais", aba:"comodidades"},
    {ok:(i.angariadores||[]).length>0, texto:"Angariador definido", aba:"angariadores"},
    {ok:!!(i.proprietario && i.proprietario.nome), texto:"Proprietário informado", aba:"sobre"},
    {ok:!!(i.publicacao && i.publicacao.autorizacao), texto:"Autorização de publicação", aba:"publicacao"}
  ];
  const pct = Math.round(itens.filter(x=>x.ok).length / itens.length * 100);
  return {pct, itens, cor: pct>=80 ? "var(--verde)" : pct>=50 ? "var(--amarelo)" : "var(--vermelho)"};
}

window.SoluaImovel = { FINALIDADE, FASE, SEM_COMODOS, qualidade, preco: i=> DB.precoImovelTexto(i) };
})();
