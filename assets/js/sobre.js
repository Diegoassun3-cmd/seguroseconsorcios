/* Solua — página Sobre: monta a equipe pública a partir da mesma
   base do CRM (SoluaDB.getEquipe), mostrando só campos seguros
   para exibição pública (nome, papel, área — nunca e-mail/senha). */
(function(){
"use strict";
const DB = window.SoluaDB;
const AREA_LABEL = {seguro:"Seguros", consorcio:"Consórcios", imovel:"Imóveis", ambos:"Atendimento geral"};

const equipe = DB.getEquipe().filter(u=>u.ativo);
document.getElementById("teamGrid").innerHTML = equipe.map(u=>`
  <div class="team-card">
    <div class="ph"><img src="https://picsum.photos/seed/solua-equipe-${u.id}/400/400" alt="${DB.esc(u.nome)}" loading="lazy"></div>
    <h4>${DB.esc(u.nome)}</h4>
    <span>${DB.esc(u.papel)} · ${AREA_LABEL[u.produto]||""}</span>
  </div>`).join("");

const heroSobre = document.getElementById("heroSobre");
if(heroSobre) heroSobre.insertAdjacentHTML("beforeend", window.SoluaChrome.renderSelo({cmsKey:"sobre.hero.selo", texto:"CAMPINAS DESDE 2001", pos:"br"}));

window.SoluaChrome.observeReveals();
})();
