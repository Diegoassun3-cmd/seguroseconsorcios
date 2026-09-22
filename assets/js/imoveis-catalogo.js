/* Solua — catálogo de imóveis: filtros + grade de cards. */
(function(){
"use strict";
const DB = window.SoluaDB;
const STATUS_LABEL = {pronto:"Pronto",lancamento:"Lançamento",em_construcao:"Em construção"};
let filtro = {finalidade:"todos", tipo:"Todos", status:"todos", quartos:""};

function cardHtml(i){
  return `
  <a class="prop-card" href="imovel.html?id=${i.id}">
    <div class="ph">
      <img src="${i.fotos[0]}" alt="${DB.esc(i.titulo)}" loading="lazy">
      <span class="tag${i.destaque?" destaque":""}">${i.destaque?"Destaque":(i.finalidade==="locacao"?"Locação":"Venda")}</span>
    </div>
    <div class="bd">
      <div class="valor">${i.finalidade==="locacao" ? DB.formatBRL(i.valor)+"/mês" : DB.formatBRL(i.valor)}</div>
      <h3>${DB.esc(i.titulo)}</h3>
      <div class="loc">${DB.esc(i.bairro)}, ${DB.esc(i.cidade)}</div>
      <div class="specs"><span>${i.quartos} dorm.</span><span>${i.vagas} vaga(s)</span><span>${i.areaM2} m²</span><span>${STATUS_LABEL[i.status]||i.status}</span></div>
    </div>
  </a>`;
}

function renderGrid(){
  const itens = DB.filterImoveis(filtro);
  document.getElementById("propGrid").innerHTML = itens.map(cardHtml).join("");
  document.getElementById("propEmpty").style.display = itens.length ? "none" : "block";
  document.getElementById("propCountLbl").textContent = `${itens.length} imóve${itens.length===1?"l":"is"}`;
  window.SoluaChrome.observeReveals();
}

function renderToolbar(){
  const tipos = ["Todos", ...DB.TIPOS.imovel];
  const bar = document.getElementById("propToolbar");
  bar.innerHTML = `
    <select id="fFinalidade"><option value="todos">Venda e locação</option><option value="venda">Só venda</option><option value="locacao">Só locação</option></select>
    <select id="fTipo">${tipos.map(t=>`<option value="${t}">${t}</option>`).join("")}</select>
    <select id="fQuartos"><option value="">Qualquer nº de quartos</option><option value="1">1+ quartos</option><option value="2">2+ quartos</option><option value="3">3+ quartos</option><option value="4">4+ quartos</option></select>
    <select id="fStatus"><option value="todos">Qualquer status</option><option value="pronto">Pronto</option><option value="lancamento">Lançamento</option><option value="em_construcao">Em construção</option></select>
    <span class="spacer"></span>
    <span class="cnt" id="propCount"></span>`;
  bar.querySelector("#fFinalidade").onchange = e=>{ filtro.finalidade=e.target.value; renderGrid(); };
  bar.querySelector("#fTipo").onchange = e=>{ filtro.tipo=e.target.value; renderGrid(); };
  bar.querySelector("#fQuartos").onchange = e=>{ filtro.quartos=e.target.value; renderGrid(); };
  bar.querySelector("#fStatus").onchange = e=>{ filtro.status=e.target.value; renderGrid(); };
}

const gapCard = document.getElementById("gapCard");
if(gapCard) gapCard.innerHTML = window.SoluaChrome.renderGapCard({
  align:"center", icone:"🔎", titulo:"Não achou?", texto:"Fale com um consultor — temos imóveis fora do site."
});

renderToolbar();
renderGrid();
})();
