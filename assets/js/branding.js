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

// Devolve a URL de logo certa para o contexto (fundo escuro = foto/rodapé;
// fundo claro = header rolado/fundo branco), com fallback pra outra versão
// se só uma delas foi cadastrada.
window.SoluaAplicarLogoContexto = function(el, fundoEscuro){
  if(!el) return;
  const s = window.SoluaBranding;
  if(!s) return; // branding ainda não carregou — mantém o texto "solua" (cor via CSS)
  const url = fundoEscuro ? (s.logoUrlEscuro || s.logoUrl) : (s.logoUrl || s.logoUrlEscuro);
  el.innerHTML = url
    ? `<img src="${url}" alt="${s.nomeRemetente||"Logo"}" style="height:1.6em;width:auto;display:block">`
    : "solua";
};

function aplicar(s){
  if(!s) return;
  const root = document.documentElement.style;
  if(s.corPrimaria) root.setProperty("--azul", s.corPrimaria);

  // logo: rodapé sempre em fundo escuro; o header decide sozinho (foto x
  // rolado) via SoluaChrome.refreshHeaderLogo, chamado assim que a marca carrega.
  const footMark = document.querySelector("#ft [data-brand-logo]");
  if(footMark) window.SoluaAplicarLogoContexto(footMark, true);
  if(window.SoluaChrome && window.SoluaChrome.refreshHeaderLogo) window.SoluaChrome.refreshHeaderLogo();

  // favicon customizado
  if(s.faviconUrl){
    let link = document.querySelector('link[rel="icon"]');
    if(!link){ link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = s.faviconUrl;
  }
  // título e descrição do site — só na home, pra não sobrescrever o
  // título/descrição específico (e já otimizado) de cada página interna
  if(document.body && document.body.dataset.page === "home"){
    if(s.siteTitulo) document.title = s.siteTitulo;
    if(s.siteDescricao){
      let meta = document.querySelector('meta[name="description"]');
      if(!meta){ meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
      meta.content = s.siteDescricao;
    }
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

  // Painel de Design: todo texto/foto/vídeo/visibilidade de seção editável do
  // site público vem daqui — ver assets/js/content-schema.js e content-apply.js.
  if(window.SoluaContentApply) window.SoluaContentApply.aplicarConteudo(s.conteudo);
}

window.SoluaBrandingReady = carregar();
})();
