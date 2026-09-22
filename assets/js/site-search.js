/* ===========================================================
   Solua — busca do site: combina o índice estático
   (assets/js/search-index.js) com o catálogo de imóveis (dinâmico,
   via SoluaDB) e filtra tudo num só campo. Abre em tela cheia
   (funciona igual em desktop e mobile) pelo botão de lupa no cabeçalho.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;

const ICONES = {"Página":"📄","Seguro":"🛡️","Consórcio":"🔄","Imóvel":"🏠","Dúvida":"❓","Artigo":"📰"};

function indiceCompleto(){
  const imoveis = (DB ? DB.getImoveis() : []).map(i=>({
    tipo:"Imóvel", titulo:i.titulo, url:`imovel.html?id=${i.id}`,
    texto:`${i.bairro}, ${i.cidade} — ${i.finalidade==="locacao"?DB.formatBRL(i.valor)+"/mês":DB.formatBRL(i.valor)}`
  }));
  return [...(window.SoluaSearchIndex||[]), ...imoveis];
}

function buscar(q){
  q = q.trim().toLowerCase();
  if(!q) return [];
  const termos = q.split(/\s+/).filter(Boolean);
  return indiceCompleto().filter(it=>{
    const alvo = (it.titulo+" "+it.texto+" "+it.tipo).toLowerCase();
    return termos.every(t=> alvo.includes(t));
  }).slice(0,20);
}

function ensureOverlay(){
  if(document.getElementById("searchOverlay")) return;
  const ov = document.createElement("div");
  ov.className = "search-overlay";
  ov.id = "searchOverlay";
  ov.innerHTML = `
    <div class="search-box">
      <div class="search-top">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M17 17l-4-4" stroke-linecap="round"/></svg>
        <input id="searchInput" placeholder="Buscar imóveis, seguros, consórcios, dúvidas…" autocomplete="off">
        <button class="search-close" id="searchClose" aria-label="Fechar">✕</button>
      </div>
      <div class="search-results" id="searchResults">
        <div class="search-hint">Digite para buscar em todo o site — imóveis, seguros, consórcios, dúvidas e artigos.</div>
      </div>
    </div>`;
  document.body.appendChild(ov);

  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  let selIdx = -1;

  function itemHtml(r, i){
    return `<a class="search-item${i===selIdx?" sel":""}" href="${r.url}" data-i="${i}">
      <span class="ico">${ICONES[r.tipo]||"•"}</span>
      <span class="tx"><b>${DB.esc(r.titulo)}</b><span>${DB.esc(r.texto)}</span></span>
      <span class="tag">${DB.esc(r.tipo)}</span>
    </a>`;
  }

  let atuais = [];
  function render(){
    const q = input.value;
    atuais = buscar(q);
    selIdx = atuais.length ? 0 : -1;
    if(!q.trim()){
      results.innerHTML = `<div class="search-hint">Digite para buscar em todo o site — imóveis, seguros, consórcios, dúvidas e artigos.</div>`;
    } else if(!atuais.length){
      results.innerHTML = `<div class="search-empty">Nada encontrado para "${DB.esc(q)}". Tente outro termo, ou <a href="contato.html" style="color:var(--azul)">fale com um consultor</a>.</div>`;
    } else {
      results.innerHTML = atuais.map(itemHtml).join("");
    }
  }
  input.oninput = render;

  input.onkeydown = e=>{
    if(!atuais.length) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); selIdx = Math.min(selIdx+1, atuais.length-1); marcarSel(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); selIdx = Math.max(selIdx-1, 0); marcarSel(); }
    else if(e.key==="Enter"){ e.preventDefault(); if(atuais[selIdx]) location.href = atuais[selIdx].url; }
  };
  function marcarSel(){
    results.querySelectorAll(".search-item").forEach((el,i)=> el.classList.toggle("sel", i===selIdx));
    const sel = results.querySelector(".search-item.sel");
    if(sel) sel.scrollIntoView({block:"nearest"});
  }

  document.getElementById("searchClose").onclick = fechar;
  ov.addEventListener("click", e=>{ if(e.target===ov) fechar(); });
}

function abrir(){
  ensureOverlay();
  const ov = document.getElementById("searchOverlay");
  ov.classList.add("on");
  document.body.style.overflow = "hidden";
  const input = document.getElementById("searchInput");
  input.value = "";
  input.dispatchEvent(new Event("input"));
  setTimeout(()=> input.focus(), 50);
}
function fechar(){
  const ov = document.getElementById("searchOverlay");
  if(!ov) return;
  ov.classList.remove("on");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("btnSiteSearch");
  if(btn) btn.onclick = abrir;
});
document.addEventListener("keydown", e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); abrir(); }
  if(e.key==="Escape"){ fechar(); }
});

window.SoluaSearch = { open: abrir, close: fechar };
})();
