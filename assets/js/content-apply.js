/* ===========================================================
   Solua — aplica o conteúdo salvo (textos, fotos, vídeos, seções
   ligadas/desligadas) vindo de /api/settings (campo "conteudo",
   ver assets/js/content-schema.js) em qualquer elemento marcado
   com [data-cms="chave"] na página.

   Convenção nos elementos HTML:
     data-cms="chave"                         → aplica o valor
     data-cms-media="bg"                      → o elemento é um fundo
                                                 (imagem OU vídeo OU
                                                 embed do YouTube/Vimeo) —
                                                 numa <section class="sec">,
                                                 ganha a classe .has-cms-bg
                                                 (camada escura + texto
                                                 claro, ver site.css) e some
                                                 se o campo for esvaziado
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
  el.querySelectorAll(":scope > video, :scope > iframe.cms-embed").forEach(n=> n.remove());
  // "sec-bg" é um plano de fundo dedicado dentro de uma <section class="sec">
  // (não pode reaproveitar o data-cms da própria seção, que já é o toggle de
  // mostrar/esconder) — quando é o caso, a seção também ganha a classe, pra
  // forçar texto claro por cima da foto (ver .sec.has-cms-bg em site.css)
  const secao = el.classList.contains("sec-bg") ? el.closest(".sec") : null;
  el.style.background = "";
  if(!url){
    el.style.backgroundImage = "";
    el.classList.remove("has-cms-bg");
    if(secao) secao.classList.remove("has-cms-bg");
    return;
  }
  el.classList.add("has-cms-bg");
  if(secao) secao.classList.add("has-cms-bg");
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

// Luminância relativa (WCAG) — decide se uma cor de fundo sólida é escura o
// bastante pra precisar do texto claro/overlay que .has-cms-bg já dá pra foto
function luminanciaRelativa(hex){
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if(!m) return 1;
  const n = parseInt(m[1], 16);
  const canal = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); };
  const r = canal(n>>16 & 255), g = canal(n>>8 & 255), b = canal(n & 255);
  return .2126*r + .7152*g + .0722*b;
}

function aplicarFundoCor(el, cor){
  el.querySelectorAll(":scope > video, :scope > iframe.cms-embed").forEach(n=> n.remove());
  const secao = el.classList.contains("sec-bg") ? el.closest(".sec") : null;
  el.style.backgroundImage = "";
  el.style.background = cor || "#FAF8F5";
  // sem o véu escuro de .sec-bg.has-cms-bg::before (é pensado pra foto) —
  // uma cor sólida já é a cor exata escolhida, sem overlay por cima dela
  el.classList.remove("has-cms-bg");
  const escura = luminanciaRelativa(cor) < .5;
  if(secao) secao.classList.toggle("has-cms-bg", escura);
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
    // fundo de seção: o modo (foto/cor) decide sozinho, mesmo se a chave
    // normal (URL da foto) não estiver no payload — não faz sentido essa
    // checagem depender de um campo que o modo "cor" nem usa
    if(el.dataset.cmsMedia === "bg"){
      const modoKey = key + "__fundoModo";
      if(Object.prototype.hasOwnProperty.call(conteudo, modoKey) && conteudo[modoKey] === "cor"){
        aplicarFundoCor(el, conteudo[key+"__fundoCor"]);
      } else if(Object.prototype.hasOwnProperty.call(conteudo, key)){
        aplicarMidiaFundo(el, conteudo[key]);
      }
    } else if(Object.prototype.hasOwnProperty.call(conteudo, key)){
      const val = conteudo[key];
      if(el.dataset.cmsTipo === "toggle"){
        el.style.display = (val === false) ? "none" : "";
      } else if(el.dataset.cmsTipo === "banner"){
        el.textContent = val || "";
        el.style.display = val ? "block" : "none";
      } else if(el.dataset.cmsTipo === "alinhamento"){
        if(val){
          el.style.textAlign = val;
          // .hero-cta é flex — text-align sozinho não move a linha de
          // botões dentro dela, então o justify-content precisa ir junto
          const justify = val==="right" ? "flex-end" : val==="center" ? "center" : "flex-start";
          el.querySelectorAll(".hero-cta").forEach(cta=> cta.style.justifyContent = justify);
        }
      } else if(el.dataset.cmsTipo === "icone"){
        const icone = window.SoluaIcons && window.SoluaIcons[val];
        if(icone) el.innerHTML = icone.svg;
      } else if(el.dataset.cmsTipo === "endereco"){
        el.textContent = val || "";
        const alvo = el.dataset.mapaAlvo && document.getElementById(el.dataset.mapaAlvo);
        if(alvo && window.SoluaChrome && window.SoluaChrome.mapaUrl){
          alvo.src = window.SoluaChrome.mapaUrl(val || el.textContent);
        }
      } else if(el.dataset.cmsTipo === "social"){
        if(val){ el.href = val; el.style.display = ""; }
        else { el.style.display = "none"; }
      } else if(el.dataset.cmsTipo === "corfundo"){
        if(val) el.style.background = val;
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
