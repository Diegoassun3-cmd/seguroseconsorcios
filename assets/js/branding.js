/* ===========================================================
   Solua — aplica a personalização da marca (logo, cor, imagem de
   capa) vinda de /api/settings (banco real, compartilhado) em
   qualquer página que carregue este script — site público e CRM.

   Sem o Worker publicado (ex.: abrindo os arquivos localmente ou
   antes do primeiro deploy), a chamada falha e a página segue com
   a identidade visual padrão — nunca trava por causa disso.
   =========================================================== */
(function(){
"use strict";

async function carregar(){
  try{
    const r = await fetch("/api/settings", {headers:{accept:"application/json"}});
    if(!r.ok) return null;
    const s = await r.json();
    window.SoluaBranding = s;
    aplicar(s);
    document.dispatchEvent(new CustomEvent("solua:branding", {detail:s}));
    return s;
  }catch(e){
    return null; // API ainda não publicada / offline — segue com o padrão
  }
}

function aplicar(s){
  if(!s) return;
  const root = document.documentElement.style;
  if(s.corPrimaria) root.setProperty("--azul", s.corPrimaria);

  // logo: qualquer elemento com [data-brand-logo] vira <img>; sem logo
  // configurado, mantém o texto "solua" que já está em cada página.
  if(s.logoUrl){
    document.querySelectorAll("[data-brand-logo]").forEach(el=>{
      el.innerHTML = `<img src="${s.logoUrl}" alt="${s.nomeRemetente||"Logo"}" style="height:1.6em;width:auto;display:block">`;
    });
  }
  // imagem de capa (hero) do site público
  if(s.heroImageUrl){
    document.querySelectorAll("[data-brand-hero]").forEach(el=>{
      el.style.backgroundImage = `url("${s.heroImageUrl}")`;
      el.classList.add("has-hero-image");
    });
  }
  // número de WhatsApp usado nos links "Falar no WhatsApp" do site público
  if(s.whatsappNumero && window.SoluaSite && typeof window.SoluaSite.setWhatsapp === "function"){
    window.SoluaSite.setWhatsapp(s.whatsappNumero);
  }

  // Painel de Design: título/subtítulo do hero da Home, visibilidade de seções
  // e banner de campanha — tudo opcional, com o conteúdo padrão do HTML como fallback.
  if(s.heroTitulo){
    document.querySelectorAll("[data-brand-hero-titulo]").forEach(el=> el.textContent = s.heroTitulo);
  }
  if(s.heroSubtitulo){
    document.querySelectorAll("[data-brand-hero-subtitulo]").forEach(el=> el.textContent = s.heroSubtitulo);
  }
  if(s.mostrarBlogHome === false){
    document.querySelectorAll('[data-brand-toggle="blog"]').forEach(el=> el.style.display = "none");
  }
  if(s.mostrarImoveisHome === false){
    document.querySelectorAll('[data-brand-toggle="imoveis-home"]').forEach(el=> el.style.display = "none");
  }
  if(s.bannerConsorcioTexto){
    document.querySelectorAll("[data-brand-campanha]").forEach(el=>{ el.textContent = s.bannerConsorcioTexto; el.style.display = "block"; });
  }
}

window.SoluaBrandingReady = carregar();
})();
