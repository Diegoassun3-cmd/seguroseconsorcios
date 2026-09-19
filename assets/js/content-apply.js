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
     (nenhum dos casos acima)                 → define o texto (textContent)
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

function aplicarConteudo(conteudo){
  if(!conteudo) return;
  document.querySelectorAll("[data-cms]").forEach(el=>{
    const key = el.dataset.cms;
    if(!Object.prototype.hasOwnProperty.call(conteudo, key)) return;
    const val = conteudo[key];
    if(el.dataset.cmsTipo === "toggle"){
      el.style.display = (val === false) ? "none" : "";
    } else if(el.dataset.cmsTipo === "selo"){
      const tp = el.querySelector("textPath");
      if(tp && val) tp.textContent = "• " + val + " ";
    } else if(el.dataset.cmsTipo === "banner"){
      el.textContent = val || "";
      el.style.display = val ? "block" : "none";
    } else if(el.dataset.cmsMedia === "bg"){
      aplicarMidiaFundo(el, val);
    } else if(el.tagName === "IMG"){
      if(val) el.src = val;
    } else if(val != null && val !== ""){
      el.textContent = val;
    }
  });
}

window.SoluaContentApply = { aplicarConteudo };
})();
