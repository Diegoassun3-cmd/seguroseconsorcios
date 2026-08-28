/* ===========================================================
   Solua CRM — quadro Kanban (pipeline de Seguros ou Consórcios)
   Lido a partir de document.body.dataset.produto = "seguro"|"consorcio"
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const produto = document.body.dataset.produto;
const stages = DB.PIPELINES[produto];
let filtro = {q:"", consultor:"", tipo:""};

// liga o botão "+ Novo lead" da topbar a este produto específico
const bindNovoLeadBtn = ()=>{
  const btn = document.getElementById("btnNovoLead");
  if(btn) btn.onclick = ()=> window.SoluaNewLead.open({produto, onCreated: renderAll});
};

function leadsFiltrados(){
  return DB.getLeadsByProduto(produto).filter(l=>{
    if(filtro.q){
      const q = filtro.q.toLowerCase();
      if(!(l.nome.toLowerCase().includes(q) || (l.email||"").toLowerCase().includes(q) || (l.telefone||"").includes(q))) return false;
    }
    if(filtro.consultor && l.consultorId!==filtro.consultor) return false;
    if(filtro.tipo && l.tipo!==filtro.tipo) return false;
    return true;
  });
}

function cardHtml(l){
  const cons = DB.getUsuario(l.consultorId);
  const valorLabel = produto==="seguro" ? DB.formatBRL(l.valor)+"/ano" : DB.formatBRL(l.valor);
  return `
  <div class="kcard" draggable="true" data-id="${l.id}">
    <b>${DB.esc(l.nome)}</b>
    <div class="sub">${DB.esc(l.tipo)||"—"} · ${DB.esc(l.cidade)||"—"}</div>
    ${(l.tags||[]).length ? `<div style="margin-top:7px;display:flex;gap:5px">${(l.tags||[]).map(t=>`<span class="tagchip">${t==="prioridade"?"⭐ prioridade":"🔄 renovação"}</span>`).join("")}</div>` : ""}
    <div class="meta">
      <span class="val">${valorLabel}</span>
      ${cons ? `<span class="who"><span class="miniav" style="background:${cons.avatarBg}">${DB.iniciais(cons.nome)}</span>${DB.esc(cons.nome.split(" ")[0])}</span>` : `<span class="who">sem consultor</span>`}
    </div>
  </div>`;
}

function renderBoard(){
  const leads = leadsFiltrados();
  const board = document.getElementById("board");
  board.innerHTML = stages.map(s=>{
    const inStage = leads.filter(l=>l.estagio===s.id);
    return `
    <div class="kcol" data-col="${s.id}">
      <div class="kcol-hd"><span class="dot" style="background:${s.cor}"></span><b>${s.label}</b><span>${inStage.length}</span></div>
      <div class="kcol-bd" data-stagebd="${s.id}">
        ${inStage.map(cardHtml).join("") || `<div class="empty" style="padding:24px 6px"><span style="font-size:12.5px">Nenhum lead aqui</span></div>`}
      </div>
    </div>`;
  }).join("");
  bindCards();
  bindDrop();
}

function bindCards(){
  document.querySelectorAll(".kcard").forEach(card=>{
    card.addEventListener("click", ()=> window.SoluaLead.open(card.dataset.id, {onChange: renderAll}));
    card.addEventListener("dragstart", e=>{ card.classList.add("dragging"); e.dataTransfer.setData("text/plain", card.dataset.id); });
    card.addEventListener("dragend", ()=> card.classList.remove("dragging"));
  });
}

function bindDrop(){
  document.querySelectorAll(".kcol-bd").forEach(col=>{
    col.addEventListener("dragover", e=>{ e.preventDefault(); col.classList.add("dragover"); });
    col.addEventListener("dragleave", ()=> col.classList.remove("dragover"));
    col.addEventListener("drop", e=>{
      e.preventDefault(); col.classList.remove("dragover");
      const id = e.dataTransfer.getData("text/plain");
      const novoEstagio = col.dataset.stagebd;
      const lead = DB.getLead(id);
      if(lead && lead.estagio !== novoEstagio){
        DB.updateLead(id, {estagio: novoEstagio});
        window.SoluaUI.toast(`${lead.nome} movido para "${DB.labelEstagio(produto, novoEstagio)}".`, "ok");
      }
      renderAll();
    });
  });
}

function renderFilters(){
  const equipe = DB.getEquipe().filter(u=> u.produto===produto || u.produto==="ambos");
  const tipos = DB.TIPOS[produto];
  const bar = document.getElementById("filterbar");
  bar.innerHTML = `
    <label class="tb-search" style="min-width:220px"><span>${window.SoluaUI.svg("search")}</span><input id="fq" placeholder="Buscar por nome, e-mail, telefone…"></label>
    <select class="pill" id="fConsultor" style="border-radius:8px"><option value="">Todos os consultores</option>${equipe.map(u=>`<option value="${u.id}">${DB.esc(u.nome)}</option>`).join("")}</select>
    <select class="pill" id="fTipo" style="border-radius:8px"><option value="">Todos os tipos</option>${tipos.map(t=>`<option>${t}</option>`).join("")}</select>
    <span class="spacer"></span>
    <span id="fCount" style="font-size:12.5px;color:var(--tinta-45)"></span>`;
  document.getElementById("fq").oninput = e=>{ filtro.q = e.target.value; renderBoard(); updateCount(); };
  document.getElementById("fConsultor").onchange = e=>{ filtro.consultor = e.target.value; renderBoard(); updateCount(); };
  document.getElementById("fTipo").onchange = e=>{ filtro.tipo = e.target.value; renderBoard(); updateCount(); };
}
function updateCount(){
  const n = leadsFiltrados().length;
  const el = document.getElementById("fCount");
  if(el) el.textContent = `${n} lead${n===1?"":"s"}`;
}

function renderAll(){ renderBoard(); updateCount(); }

renderFilters();
renderAll();
bindNovoLeadBtn();
})();
