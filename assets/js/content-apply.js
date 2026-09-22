/* ===========================================================
   Solua — aplica o conteúdo salvo (textos, fotos, vídeos, seções
   ligadas/desligadas) vindo de /api/settings (campo "conteudo",
   ver assets/js/content-schema.js) em qualquer elemento marcado
   com [data-cms="chave"] na página.

   Convenção nos elementos HTML:
     data-cms="chave"                         → aplica o valor
     data-cms-media="bg"                      → o elemento é um fundo
                                                 (imagem OU vídeo OU
                                                 embed do YouTube/Vimeo)
     (sem data-cms-media, tag <img>)          → define o "src"
     data-cms-tipo="toggle"                   → mostra/esconde o elemento
     data-cms-tipo="alinhamento"              → define text-align do elemento
     data-cms-tipo="icone"                    → troca o miolo de um <svg> por
                                                 um ícone de assets/js/icon-library.js
     (nenhum dos casos acima)                 → define o texto (textContent)

   Além da chave normal, qualquer campo de texto/textarea pode ter uma
   chave companheira "chave__tamanho" (70–150, % do tamanho original) —
   escrita pelo controle "A− / A+" do Painel de Design — que reescala o
   font-size do MESMO elemento [data-cms="chave"], sem precisar de
   nenhum atributo novo no HTML.
   =========================================================== */
(function(){
"use strict";

function ehVideoUrl(u){ return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(u); }
function paraEmbed(u){
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{6,})/);
  if(yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if(vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function aplicarMidiaFundo(el, url){
  if(!url) return;
  el.querySelectorAll(":scope > video, :scope > iframe.cms-embed").forEach(n=> n.remove());
  const embed = paraEmbed(url);
  if(ehVideoUrl(url)){
    el.style.backgroundImage = "none";
    const v = document.createElement("video");
    v.src = url; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0";
    el.insertBefore(v, el.firstChild);
  } else if(embed){
    el.style.backgroundImage = "none";
    const f = document.createElement("iframe");
    f.className = "cms-embed";
    f.src = embed + "?autoplay=1&mute=1&loop=1&controls=0&background=1&playsinline=1";
    f.allow = "autoplay; fullscreen";
    f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;pointer-events:none";
    el.insertBefore(f, el.firstChild);
  } else {
    el.style.backgroundImage = `url("${url}")`;
  }
}

// Reescala o font-size de um elemento de texto em torno do tamanho que
// ele já teria (respeitando clamp()/responsivo): mede o tamanho "natural"
// a cada aplicação (nunca guarda um px fixo), então funciona bem também
// depois de um resize de janela (ver listener de "resize" abaixo).
function aplicarTamanho(el, pct){
  const p = parseInt(pct, 10) || 100;
  el.dataset.cmsFsPct = String(p);
  el.style.fontSize = "";
  if(p === 100) return;
  const base = parseFloat(getComputedStyle(el).fontSize) || 16;
  el.style.fontSize = (base * p / 100) + "px";
}

let resizeTimer;
addEventListener("resize", ()=>{
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=>{
    document.querySelectorAll("[data-cms-fs-pct]").forEach(el=> aplicarTamanho(el, el.dataset.cmsFsPct));
  }, 200);
});

function aplicarConteudo(conteudo){
  if(!conteudo) return;
  document.querySelectorAll("[data-cms]").forEach(el=>{
    const key = el.dataset.cms;
    if(Object.prototype.hasOwnProperty.call(conteudo, key)){
      const val = conteudo[key];
      if(el.dataset.cmsTipo === "toggle"){
        el.style.display = (val === false) ? "none" : "";
      } else if(el.dataset.cmsTipo === "banner"){
        el.textContent = val || "";
        el.style.display = val ? "block" : "none";
      } else if(el.dataset.cmsTipo === "alinhamento"){
        if(val) el.style.textAlign = val;
      } else if(el.dataset.cmsTipo === "icone"){
        const icone = window.SoluaIcons && window.SoluaIcons[val];
        if(icone) el.innerHTML = icone.svg;
      } else if(el.dataset.cmsMedia === "bg"){
        aplicarMidiaFundo(el, val);
      } else if(el.tagName === "IMG"){
        if(val) el.src = val;
      } else if(val != null && val !== ""){
        el.textContent = val;
      }
    }
    const escalaKey = key + "__tamanho";
    if(Object.prototype.hasOwnProperty.call(conteudo, escalaKey)){
      aplicarTamanho(el, conteudo[escalaKey]);
    }
  });
}

window.SoluaContentApply = { aplicarConteudo };
})();
