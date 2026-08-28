/* ===========================================================
   Solua CRM — chrome compartilhado (sidebar, topbar, auth guard,
   toasts, overlays). Incluído em toda página dentro de /crm/.
   Depende de assets/js/crm-data.js (window.SoluaDB) já carregado.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;

// ---------- proteção de rota ----------
if(!DB.requireAuth()) { /* requireAuth já redireciona para o login */ }
const ME = DB.currentUser();

// ---------- ícones (outline, 20x20) ----------
const ICO = {
  dash:'<path d="M3 13h6V3H3v10zm0 8h6v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  seguro:'<path d="M10 2l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V5l7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  consorcio:'<path d="M3 17V9l7-5 7 5v8M3 17h14M8 17v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  contatos:'<circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 18c.6-3.6 3.4-6 6.5-6s5.9 2.4 6.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  admin:'<path d="M10 2l1.6 3.3 3.6.5-2.6 2.6.6 3.6L10 10.3 6.8 12l.6-3.6L4.8 5.8l3.6-.5L10 2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  disparos:'<path d="M2 10l16-7-6 16-3-6-6-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  modelos:'<rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 7.5h7M6.5 10.5h7M6.5 13.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  equipe:'<circle cx="7" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="8" r="2.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 17c.5-3 2.5-5 4.5-5s4 2 4.5 5M12 17c.4-2.4 1.8-4 3.7-4s3.3 1.6 3.7 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  personalizar:'<path d="M10 2a8 8 0 100 16c1.1 0 1.7-.6 1.7-1.4 0-.4-.15-.7-.4-1-.25-.3-.4-.6-.4-1 0-.8.65-1.4 1.4-1.4h1.6a3.1 3.1 0 003.1-3.1C17 5.6 13.9 2 10 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6.3" cy="9" r=".9" fill="currentColor" stroke="none"/><circle cx="9" cy="6" r=".9" fill="currentColor" stroke="none"/><circle cx="12.5" cy="6.7" r=".9" fill="currentColor" stroke="none"/>',
  site:'<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 10h15M10 2.5c2.2 2 3.2 5 3.2 7.5s-1 5.5-3.2 7.5c-2.2-2-3.2-5-3.2-7.5S7.8 4.5 10 2.5z" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  logout:'<path d="M8 3H4.5A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17H8M13 14l4-4-4-4M7 10h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  search:'<circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 17l-4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  menu:'<path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  empty:'<path d="M3 8l2.5-4h9L17 8M3 8v8a1 1 0 001 1h12a1 1 0 001-1V8M3 8h4.2c.3 1.2 1.4 2 2.8 2s2.5-.8 2.8-2H17" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>'
};
function svg(name){ return `<svg viewBox="0 0 20 20">${ICO[name]||""}</svg>`; }

const isAdmin = ME && ME.papel === "Administrador";
const NAV = [
  {group:"Visão geral", items:[
    {href:"dashboard.html", key:"dashboard", label:"Dashboard", ico:"dash"}
  ]},
  {group:"Pipelines", items:[
    {href:"pipeline-seguros.html", key:"pipeline-seguros", label:"Seguros", ico:"seguro", count:()=>DB.getLeadsByProduto("seguro").filter(l=>l.estagio!=="perdido"&&l.estagio!=="apolice").length},
    {href:"pipeline-consorcios.html", key:"pipeline-consorcios", label:"Consórcios", ico:"consorcio", count:()=>DB.getLeadsByProduto("consorcio").filter(l=>l.estagio!=="perdido"&&l.estagio!=="contemplado").length}
  ]},
  {group:"Base", items:[
    {href:"contatos.html", key:"contatos", label:"Contatos", ico:"contatos"}
  ]}
];
const NAV_ADMIN = {group:"Administração", items:[
  {href:"admin/disparos.html", key:"admin-disparos", label:"Disparos", ico:"disparos"},
  {href:"admin/modelos.html", key:"admin-modelos", label:"Modelos", ico:"modelos"},
  {href:"admin/equipe.html", key:"admin-equipe", label:"Equipe", ico:"equipe"},
  {href:"admin/personalizacao.html", key:"admin-personalizacao", label:"Personalização", ico:"personalizar"}
]};
if(isAdmin) NAV.push(NAV_ADMIN);

function base(){ return document.body.dataset.base || "./"; }
function activeKey(){ return document.body.dataset.active || ""; }

function renderSidebar(){
  const b = base();
  const linksHtml = NAV.map(g=>`
    <div class="sb-group">
      <h6>${g.group}</h6>
      ${g.items.map(it=>`
        <a class="sb-link ${activeKey()===it.key?"on":""}" href="${b}${it.href}">
          ${svg(it.ico)}<span>${it.label}</span>${it.count?`<span class="badge-count badge" style="margin-left:auto;background:rgba(255,255,255,.14);color:#fff;padding:2px 8px">${it.count()}</span>`:""}
        </a>`).join("")}
    </div>`).join("");
  const initials = DB.iniciais(ME.nome);
  return `
  <div class="sb-brand">
    <span class="mark" style="color:#fff">solua</span>
    <span class="badge neutro" style="background:rgba(242,237,230,.14);color:#fff">CRM</span>
  </div>
  <nav class="sb-nav">${linksHtml}
    <div class="sb-group">
      <h6>Atalhos</h6>
      <a class="sb-link" href="${b}../index.html" target="_blank">${svg("site")}<span>Ver site público</span></a>
    </div>
  </nav>
  <div class="sb-foot">
    <div class="sb-user">
      <span class="avatar" style="background:${ME.avatarBg||"#004BA5"}">${initials}</span>
      <span class="who"><b>${DB.esc(ME.nome)}</b><span>${DB.esc(ME.papel)}</span></span>
    </div>
    <button class="sb-logout" id="btnLogout">${svg("logout")}Sair</button>
  </div>`;
}

function renderTopbar(){
  const title = document.body.dataset.title || "";
  const crumbs = document.body.dataset.crumbs || "";
  return `
  <div style="display:flex;align-items:center;gap:14px">
    <button class="mburger" id="btnMenu">${svg("menu")}</button>
    <div>
      ${crumbs?`<div class="crumbs">${crumbs}</div>`:""}
      <h1>${title}</h1>
    </div>
  </div>
  <div class="tb-actions">
    <label class="tb-search"><span>${svg("search")}</span><input id="tbSearch" placeholder="Buscar contatos, leads…"></label>
    <button class="btn sm" id="btnNovoLead">+ Novo lead</button>
  </div>`;
}

function mount(){
  const sb = document.getElementById("sidebar");
  const tb = document.getElementById("topbar");
  if(sb) sb.innerHTML = renderSidebar();
  if(tb) tb.innerHTML = renderTopbar();
  const logoutBtn = document.getElementById("btnLogout");
  if(logoutBtn) logoutBtn.onclick = ()=>{ DB.logout(); location.href = base()+"login.html"; };
  const menuBtn = document.getElementById("btnMenu");
  if(menuBtn) menuBtn.onclick = ()=> sb.classList.toggle("on");
  const novoBtn = document.getElementById("btnNovoLead");
  if(novoBtn) novoBtn.onclick = ()=>{
    if(window.SoluaNewLead) window.SoluaNewLead.open({});
    else location.href = base()+"contatos.html";
  };
  const search = document.getElementById("tbSearch");
  if(search) search.addEventListener("keydown", e=>{
    if(e.key==="Enter" && search.value.trim()){
      location.href = base()+"contatos.html?q="+encodeURIComponent(search.value.trim());
    }
  });
  document.addEventListener("click", e=>{
    if(sb && sb.classList.contains("on") && !sb.contains(e.target) && e.target!==menuBtn && !menuBtn.contains(e.target)){
      sb.classList.remove("on");
    }
  });
}
if(ME) mount();

// ---------- toasts ----------
function toast(msg, type){
  let wrap = document.querySelector(".toast-wrap");
  if(!wrap){ wrap = document.createElement("div"); wrap.className="toast-wrap"; document.body.appendChild(wrap); }
  const el = document.createElement("div");
  el.className = "toast"+(type?" "+type:"");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transition="opacity .3s"; setTimeout(()=>el.remove(),300); }, 3200);
}

// ---------- overlay helpers (modal / drawer) ----------
function openOverlay(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add("on");
  document.body.style.overflow = "hidden";
}
function closeOverlay(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove("on");
  document.body.style.overflow = "";
}
document.addEventListener("click", e=>{
  const ov = e.target.closest(".overlay");
  if(ov && e.target === ov) closeOverlay(ov.id);
  const xBtn = e.target.closest("[data-close-overlay]");
  if(xBtn) closeOverlay(xBtn.getAttribute("data-close-overlay") || xBtn.closest(".overlay").id);
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){ document.querySelectorAll(".overlay.on").forEach(o=>closeOverlay(o.id)); }
});

// ---------- confirmação simples ----------
function confirmAction(msg, onYes){
  let ov = document.getElementById("confirmOverlay");
  if(!ov){
    ov = document.createElement("div");
    ov.className = "overlay modal-center";
    ov.id = "confirmOverlay";
    ov.innerHTML = `<div class="modal" style="width:min(400px,92vw)">
      <div class="modal-bd"><p id="confirmMsg" style="font-size:14.5px"></p></div>
      <div class="modal-ft"><button class="btn ghost sm" data-close-overlay="confirmOverlay">Cancelar</button><button class="btn danger sm" id="confirmYes">Confirmar</button></div>
    </div>`;
    document.body.appendChild(ov);
  }
  document.getElementById("confirmMsg").textContent = msg;
  const yesBtn = document.getElementById("confirmYes");
  const newYes = yesBtn.cloneNode(true); yesBtn.replaceWith(newYes);
  newYes.onclick = ()=>{ closeOverlay("confirmOverlay"); onYes(); };
  openOverlay("confirmOverlay");
}

function emptyState(text){ return `${svg("empty")}<span>${text}</span>`; }

window.SoluaUI = { toast, openOverlay, closeOverlay, confirmAction, currentUser: ME, isAdmin, svg, emptyState };
})();
