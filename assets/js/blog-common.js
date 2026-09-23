/* ===========================================================
   Solua — peças compartilhadas do Blog público: o cartão arredondado
   (Home mostra 3 em destaque, blog.html mostra o catálogo completo) e
   o leitor de artigo em tela cheia (mesmo overlay #reader/#rbody nas
   duas páginas). Dados vêm de window.SoluaDB (getPostsPublicados etc.,
   ver assets/js/crm-data.js) — nada aqui é hardcoded.
   =========================================================== */
(function(global){
"use strict";
const DB = global.SoluaDB;

const CAT_ICONS = {
  "Seguros": '<path d="M14 4l9 4v6c0 6.5-4 11-9 13-5-2-9-6.5-9-13V8l9-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  "Consórcio": '<circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 9v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  "Imóveis": '<path d="M5 12l9-8 9 8M7 11v10h14V11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  "Planejamento": '<rect x="5" y="6" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 11h18M9 4v4M19 4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9.5 16.5l2.5 2.5 5.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
};
function catIcon(categoria){
  return `<svg class="post-ico" viewBox="0 0 28 28" aria-hidden="true">${CAT_ICONS[categoria]||CAT_ICONS["Planejamento"]}</svg>`;
}

const ARROW_SVG = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 15L15 5M8 5h7v7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function cardHtml(post){
  // sem capa, a cor da categoria vira o fundo do card (nunca fica sem cor)
  const cor = DB.corPost(post.categoria);
  const min = DB.tempoLeituraMin(post.blocos);
  const foto = post.capa ? ` style="background-image:url('${DB.esc(post.capa)}')"` : "";
  return `<a class="blog-card c-${cor}"${foto} data-postid="${post.id}" href="javascript:void(0)">
    <div class="blog-card-top">
      <span class="blog-pill">${DB.esc(post.categoria)}</span>
      <span class="blog-pill">${min} min de leitura</span>
    </div>
    <h3>${DB.esc(post.titulo)}</h3>
    <div class="blog-more"><span>Ler mais</span><span class="arrow">${ARROW_SVG}</span></div>
  </a>`;
}

// -------- leitor em tela cheia (overlay #reader / corpo #rbody) --------
function abrirPost(post){
  const reader = document.getElementById("reader");
  const rbody = document.getElementById("rbody");
  if(!reader || !rbody || !post) return;
  const capa = post.capa ? `<div class="reader-capa" style="background-image:url('${DB.esc(post.capa)}')"></div>` : "";
  rbody.innerHTML = `${capa}<span class="cat">${DB.esc(post.categoria)}</span><h1>${DB.esc(post.titulo)}</h1>
    <div class="meta">${DB.formatDate(post.publicadoEm||post.criadoEm)} · ${DB.tempoLeituraMin(post.blocos)} min de leitura · por Solua</div>
    ${DB.renderPostCorpo(post.blocos)}
    <div class="reader-cta"><h3>Quer aplicar isso ao seu caso?</h3><p>Peça uma cotação sem compromisso e receba a análise de um consultor.</p><a class="btn lg" href="contato.html">Falar com um consultor</a></div>`;
  reader.classList.add("on");
  reader.scrollTop = 0;
  document.body.style.overflow = "hidden";
}
function fecharLeitor(){
  const reader = document.getElementById("reader");
  if(reader) reader.classList.remove("on");
  document.body.style.overflow = "";
}
// liga o "x" do leitor e a tecla Esc — chame uma vez por página
function initReader(){
  global.closeReader = fecharLeitor;
  const closeRBtn = document.getElementById("closeR");
  if(closeRBtn) closeRBtn.onclick = fecharLeitor;
  addEventListener("keydown", e=> e.key==="Escape" && fecharLeitor());
}

global.SoluaBlog = { catIcon, cardHtml, abrirPost, fecharLeitor, initReader };
})(window);
