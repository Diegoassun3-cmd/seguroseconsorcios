/* ===========================================================
   Solua — chrome compartilhado do site público (header, menu
   mobile, rodapé, botão flutuante de WhatsApp) + utilitários de
   interação (reveal on scroll, contadores animados).

   Carregado por TODAS as páginas públicas, antes do script
   específico de cada página. Cada página só precisa ter os
   contêineres vazios <header id="hd"></header>, <div id="mob"></div>,
   <footer id="ft"></footer>, <div id="wppFloat"></div> e marcar
   document.body.dataset.page com a página ativa (home, imoveis,
   seguros, consorcios, sobre, contato).
   =========================================================== */
(function(){
"use strict";

let WPP = "5519999999999"; // valor padrão — Personalização (CRM) sobrescreve via /api/settings
const wppMsg = t => `https://wa.me/${WPP}?text=${encodeURIComponent(t||"Olá! Vim pelo site e gostaria de falar com um consultor.")}`;

const NAV_LINKS = [
  {href:"index.html",      page:"home",       label:"Início"},
  {href:"imoveis.html",    page:"imoveis",    label:"Imóveis"},
  {href:"seguros.html",    page:"seguros",    label:"Seguros"},
  {href:"consorcios.html", page:"consorcios", label:"Consórcios"},
  {href:"sobre.html",      page:"sobre",      label:"A Solua"},
  {href:"contato.html",    page:"contato",    label:"Contato"}
];

function page(){ return document.body.dataset.page || "home"; }

function temFotoTopo(){
  const primeira = document.body.querySelector(":scope > section");
  return !!(primeira && primeira.classList.contains("hero-photo"));
}

function refreshHeaderLogo(){
  const hd = document.getElementById("hd");
  if(!hd) return;
  const mark = hd.querySelector("[data-brand-logo]");
  if(!mark || !window.SoluaAplicarLogoContexto) return;
  const fundoEscuro = hd.classList.contains("on-photo") && !hd.classList.contains("solid");
  window.SoluaAplicarLogoContexto(mark, fundoEscuro);
}

function renderHeader(){
  const hd = document.getElementById("hd");
  if(!hd) return;
  const active = page();
  hd.innerHTML = `
  <div class="wrap nav">
    <a href="index.html" class="brand">
      <span class="mark" data-brand-logo>solua</span>
      <span class="desc">imóveis, seguros e consórcios.</span>
    </a>
    <nav class="menu">
      ${NAV_LINKS.map(l=>`<a href="${l.href}" class="${l.page===active?"on":""}">${l.label}</a>`).join("")}
    </nav>
    <button class="search-trigger" id="btnSiteSearch" aria-label="Buscar no site">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M17 17l-4-4" stroke-linecap="round"/></svg>
    </button>
    <a class="btn hdr" href="contato.html">Fale com um consultor</a>
    <button class="burger" id="bg" aria-label="Menu"><i></i><i></i></button>
  </div>`;
  hd.classList.toggle("on-photo", temFotoTopo());
  const atualizar = ()=>{ hd.classList.toggle("solid", scrollY>40); refreshHeaderLogo(); };
  addEventListener("scroll", atualizar);
  atualizar();
}

const MOB_GROUPS = [
  {titulo:"Produtos", itens:[
    {href:"imoveis.html", page:"imoveis", label:"Imóveis"},
    {href:"seguros.html", page:"seguros", label:"Seguros"},
    {href:"consorcios.html", page:"consorcios", label:"Consórcios"}
  ]},
  {titulo:"Institucional", itens:[
    {href:"sobre.html", page:"sobre", label:"A Solua"},
    {href:"sobre.html#equipe", page:null, label:"Equipe"},
    {href:"index.html#blog", page:null, label:"Blog"}
  ]},
  {titulo:"Contato", itens:[
    {href:"contato.html", page:"contato", label:"Fale conosco"}
  ]}
];

function renderMobile(){
  const mob = document.getElementById("mob");
  if(!mob) return;
  const active = page();
  mob.innerHTML = `
  <nav class="mob-nav">
    ${MOB_GROUPS.map(g=>`
      <div class="mob-group">
        <h4>${g.titulo}</h4>
        <div class="sub">
          ${g.itens.map(it=>`<a href="${it.href}" data-close class="${it.page===active?"on":""}">${it.label}</a>`).join("")}
        </div>
      </div>`).join("")}
  </nav>
  <div class="mob-rule"></div>
  <div class="mob-cta-block">
    <span class="lbl">/ Vamos conversar?</span>
    <a class="email" href="mailto:contato@solua.com.br" id="mobEmail">contato@solua.com.br</a>
    <a class="wpp-link" href="#" id="mobWpp" target="_blank" rel="noopener" data-close>Conversar no WhatsApp →</a>
  </div>
  <a class="btn lg" style="width:100%;text-align:center;margin-top:24px" href="contato.html" data-close>Fale com um consultor</a>`;
  const bg = document.getElementById("bg");
  const closeMob = ()=>{ mob.classList.remove("on"); bg.classList.remove("on"); document.body.style.overflow=""; };
  if(bg){
    bg.onclick = ()=>{ const o = mob.classList.toggle("on"); bg.classList.toggle("on", o); document.body.style.overflow = o?"hidden":""; };
    mob.querySelectorAll("[data-close]").forEach(a=> a.addEventListener("click", closeMob));
  }
}

function renderFooter(){
  const ft = document.getElementById("ft");
  if(!ft) return;
  const yr = new Date().getFullYear();
  ft.innerHTML = `
  <div class="wrap">
    <div class="foot-top">
      <div>
        <span class="mark" data-brand-logo>solua</span>
        <p>Corretora de seguros e consórcios e imobiliária em Campinas, desde 2001. Um consultor dedicado do primeiro contato ao pós-venda.</p>
      </div>
      <div class="fcol">
        <h5>Produtos</h5>
        <a href="imoveis.html">Imóveis</a>
        <a href="seguros.html">Seguros</a>
        <a href="consorcios.html">Consórcios</a>
      </div>
      <div class="fcol">
        <h5>Institucional</h5>
        <a href="sobre.html">A Solua</a>
        <a href="sobre.html#equipe">Nossa equipe</a>
        <a href="contato.html">Contato</a>
      </div>
      <div class="fcol">
        <h5>Contato</h5>
        <span id="footEmail">contato@solua.com.br</span>
        <span>Campinas — SP</span>
        <a href="#" id="wppFoot">Falar no WhatsApp</a>
      </div>
    </div>
    <div class="foot-bot">
      <span>© ${yr} Solua Corretora e Imobiliária — CRECI e SUSEP conforme legislação vigente.</span>
      <span class="staff"><a href="crm/login.html">Acesso da equipe</a></span>
    </div>
  </div>`;
}

function renderWppFloat(){
  const el = document.getElementById("wppFloat");
  if(!el) return;
  el.innerHTML = `<a class="wpp" id="wppFix" href="#" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
    <svg viewBox="0 0 32 32"><path d="M16 3C9 3 3.3 8.7 3.3 15.7c0 2.5.7 4.8 1.9 6.8L3 29l6.7-2.1c1.9 1 4 1.6 6.3 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.1c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1.2 1.2-3.9-.3-.4a10.2 10.2 0 01-1.6-5.5C5.3 9.9 10.1 5.1 16 5.1S26.7 9.9 26.7 15.7 21.9 26.1 16 26.1zm5.9-7.6c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 01-2.5-1.6 9.6 9.6 0 01-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.5c0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4a3.4 3.4 0 00-1 2.5c0 1.5 1 2.9 1.2 3.1.1.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
  </a>`;
  refreshWppLinks();
}

function refreshWppLinks(){
  ["wppFix","wppFoot","mobWpp"].forEach(id=>{ const el=document.getElementById(id); if(el) el.href = wppMsg(); });
}

window.SoluaSite = { setWhatsapp(numero){ if(numero){ WPP = numero; refreshWppLinks(); } }, wppLink: wppMsg };

// e-mail de contato exibido no rodapé e no menu mobile — Personalização sobrescreve via /api/settings
document.addEventListener("solua:branding", e=>{
  const email = e.detail && e.detail.emailRemetente;
  if(!email) return;
  ["footEmail","mobEmail"].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.textContent = email; if(el.tagName==="A") el.href = "mailto:"+email; }
  });
});

// ---------- reveal on scroll ----------
const io = new IntersectionObserver(es=> es.forEach(e=> e.isIntersecting && e.target.classList.add("in")), {threshold:.08});
function observeReveals(){ document.querySelectorAll(".rev:not(.in), .float-card:not(.in)").forEach(e=> io.observe(e)); }

// ---------- contadores animados ----------
function animateCounters(root){
  const els = (root||document).querySelectorAll("[data-counter]");
  if(!els.length) return;
  const cio = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target;
      cio.unobserve(el);
      const to = Number(el.dataset.counter)||0;
      const suffix = el.dataset.suffix||"";
      const dur = 1100;
      const t0 = performance.now();
      function tick(t){
        const p = Math.min(1,(t-t0)/dur);
        const eased = 1-Math.pow(1-p,3);
        el.textContent = Math.round(to*eased)+suffix;
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, {threshold:.4});
  els.forEach(el=> cio.observe(el));
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderHeader(); renderMobile(); renderFooter(); renderWppFloat();
  const yrFoot = document.getElementById("yr"); if(yrFoot) yrFoot.textContent = new Date().getFullYear();
  observeReveals();
  animateCounters();
});

// ---------- cartão flutuante (pop-in, aparece conforme o scroll e fica parado) ----------
// Fica dentro de um "vão" (gap-band) entre duas seções — nunca sobre uma
// foto ou texto — para não sobrepor conteúdo em nenhuma largura de tela.
function renderFloatCard(opts){
  opts = opts || {};
  return `<div class="float-card">
    <span class="ico">${opts.icone||"★"}</span>
    <span><b>${opts.titulo||""}</b><span>${opts.texto||""}</span></span>
  </div>`;
}
function renderGapCard(opts){
  const align = (opts && opts.align) || "center";
  return `<div class="wrap"><div class="gap-band ${align}">${renderFloatCard(opts)}</div></div>`;
}

window.SoluaChrome = { observeReveals, animateCounters, page, renderFloatCard, renderGapCard, refreshHeaderLogo };
})();
