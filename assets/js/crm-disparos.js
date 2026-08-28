/* ===========================================================
   Solua CRM — Central de Disparos (e-mail e WhatsApp)
   Página: crm/admin/disparos.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
let filtroCanal = "todos";
const wizard = {step:1, canal:"email", segmento:"todos", templateId:null, nome:"", quando:"agora", agendadoPara:""};

const SAMPLE_VARS = {
  primeiro_nome:"Maria", produto:"seguro auto", tipo:"Auto",
  consultor: (UI.currentUser&&UI.currentUser.nome) || "sua consultora Solua",
  telefone_solua:"(19) 99999-9999"
};

// ---------------- HISTÓRICO ----------------
function statusBadge(c){
  const map = {rascunho:["neutro","Rascunho"], agendado:["seguro","Agendado"], enviado:["ganho","Enviado"]};
  const [cls,label] = map[c.status]||["neutro",c.status];
  return `<span class="badge ${cls}">${label}</span>`;
}
function canalBadge(c){
  return c.canal==="email" ? `<span class="badge seguro">✉️ E-mail</span>` : `<span class="badge consorcio">💬 WhatsApp</span>`;
}
function renderHistorico(){
  const all = DB.getCampaigns().filter(c=> filtroCanal==="todos" || c.canal===filtroCanal);
  const tbody = document.getElementById("campRows");
  tbody.innerHTML = all.map(c=>{
    const publico = DB.getAudience(c.segmento).length;
    const seg = (DB.SEGMENTOS.find(s=>s.id===c.segmento)||{}).label || c.segmento;
    return `<tr data-id="${c.id}">
      <td><b>${DB.esc(c.nome)}</b><div style="font-size:11.5px;color:var(--tinta-45)">${seg}</div></td>
      <td>${canalBadge(c)}</td>
      <td>${publico} contato${publico===1?"":"s"}</td>
      <td>${statusBadge(c)}</td>
      <td>${c.status==="enviado" ? `${c.metrics.abertos} aberturas · ${c.metrics.respostas} respostas` : "—"}</td>
      <td>${c.status==="enviado" ? DB.formatDateTime(c.enviadoEm) : c.status==="agendado" ? "Agendado: "+DB.formatDateTime(c.agendadoPara) : DB.formatDate(c.criadoEm)}</td>
      <td class="rowactions">
        ${c.status!=="enviado" ? `<button class="btn sm" data-send="${c.id}">Enviar agora</button>`:""}
        <button class="btn icon ghost sm" data-del="${c.id}" title="Excluir">✕</button>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("campEmpty").style.display = all.length ? "none" : "block";

  tbody.querySelectorAll("tr").forEach(tr=> tr.addEventListener("click", e=>{
    if(e.target.closest("[data-send],[data-del]")) return;
    openDetail(tr.dataset.id);
  }));
  tbody.querySelectorAll("[data-send]").forEach(btn=> btn.addEventListener("click", e=>{
    e.stopPropagation();
    const c = DB.getCampaign(btn.dataset.send);
    UI.confirmAction(`Disparar "${c.nome}" agora para o público selecionado?`, ()=>{
      DB.sendCampaignNow(c.id);
      UI.toast("Campanha enviada com sucesso.","ok");
      renderHistorico(); renderKpis();
    });
  }));
  tbody.querySelectorAll("[data-del]").forEach(btn=> btn.addEventListener("click", e=>{
    e.stopPropagation();
    UI.confirmAction("Excluir esta campanha do histórico?", ()=>{
      DB.deleteCampaign(btn.dataset.del); UI.toast("Campanha excluída.","err"); renderHistorico(); renderKpis();
    });
  }));
}

function renderKpis(){
  const camps = DB.getCampaigns();
  const enviadas = camps.filter(c=>c.status==="enviado");
  const totalEnviados = enviadas.reduce((s,c)=>s+c.metrics.enviados,0);
  const totalAbertos = enviadas.reduce((s,c)=>s+c.metrics.abertos,0);
  const totalRespostas = enviadas.reduce((s,c)=>s+c.metrics.respostas,0);
  const taxa = totalEnviados ? Math.round((totalAbertos/totalEnviados)*100) : 0;
  document.getElementById("dispKpis").innerHTML = `
    <div class="kpi"><span class="lbl">Campanhas enviadas</span><b>${enviadas.length}</b><span class="delta">${camps.length-enviadas.length} em rascunho/agendadas</span></div>
    <div class="kpi"><span class="lbl">Contatos alcançados</span><b>${totalEnviados}</b><span class="delta">somando todos os envios</span></div>
    <div class="kpi"><span class="lbl">Taxa média de abertura</span><b>${taxa}%</b><span class="delta up">e-mail + WhatsApp</span></div>
    <div class="kpi"><span class="lbl">Respostas geradas</span><b>${totalRespostas}</b><span class="delta">leads reativados por disparo</span></div>`;
}

function openDetail(id){
  const c = DB.getCampaign(id); if(!c) return;
  // usa a cópia salva no envio (templateSnapshot); só cai para o modelo "ao vivo"
  // em campanhas antigas criadas antes dessa cópia existir.
  const t = c.templateSnapshot || DB.getTemplate(c.templateId);
  const body = document.getElementById("detailBody");
  body.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px">${canalBadge(c)}${statusBadge(c)}</div>
    <h3 style="font-size:19px;margin-bottom:4px">${DB.esc(c.nome)}</h3>
    <p style="font-size:13px;color:var(--tinta-45);margin-bottom:18px">Público: ${(DB.SEGMENTOS.find(s=>s.id===c.segmento)||{}).label} · ${DB.getAudience(c.segmento).length} contatos</p>
    ${c.status==="enviado" ? `<div class="metric-row" style="margin-bottom:20px">
      <div><b>${c.metrics.enviados}</b><span>Enviados</span></div>
      <div><b>${c.metrics.entregues}</b><span>Entregues</span></div>
      <div><b>${c.metrics.abertos}</b><span>Abertos</span></div>
      ${c.canal==="email"?`<div><b>${c.metrics.cliques}</b><span>Cliques</span></div>`:`<div><b>—</b><span>Cliques</span></div>`}
      <div><b>${c.metrics.respostas}</b><span>Respostas</span></div>
    </div>` : `<p style="font-size:13px;color:var(--tinta-45);margin-bottom:18px">Esta campanha ainda não foi enviada — as métricas aparecem aqui após o disparo.</p>`}
    ${t ? previewHtml(c.canal, t) : ""}
  `;
  UI.openOverlay("detailOverlay");
}

// ---------------- COMPOSER (nova campanha) ----------------
function previewHtml(canal, t){
  const assunto = DB.fillTemplate(t.assunto, SAMPLE_VARS);
  const corpo = DB.fillTemplate(t.corpo, SAMPLE_VARS);
  if(canal==="whatsapp"){
    return `<div style="display:flex;justify-content:center;margin-top:6px">
      <div class="preview-phone"><div class="screen"><div class="bubble">${corpo}</div></div></div>
    </div>`;
  }
  return `<div class="preview-email" style="margin-top:6px">
    <div class="pe-hd"><b>Assunto:</b> ${assunto}</div>
    <div class="pe-bd">${corpo}</div>
  </div>`;
}

function stepHtml(){
  if(wizard.step===1){
    return `<h3 style="font-size:17px;margin-bottom:14px">1. Escolha o canal</h3>
    <div class="choice-grid">
      <div class="choice ${wizard.canal==="email"?"sel":""}" data-canal="email"><b>✉️ E-mail</b><span>Ideal para comparativos, lembretes e conteúdo mais longo.</span></div>
      <div class="choice ${wizard.canal==="whatsapp"?"sel":""}" data-canal="whatsapp"><b>💬 WhatsApp</b><span>Alta taxa de abertura, ótimo para contato rápido e reativação.</span></div>
    </div>`;
  }
  if(wizard.step===2){
    return `<h3 style="font-size:17px;margin-bottom:14px">2. Escolha o público</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${DB.SEGMENTOS.map(s=>`<div class="choice ${wizard.segmento===s.id?"sel":""}" data-seg="${s.id}" style="display:flex;justify-content:space-between;align-items:center">
        <span><b style="font-size:13.5px">${s.label}</b></span><span class="badge neutro">${DB.getAudience(s.id).length} contatos</span>
      </div>`).join("")}
    </div>`;
  }
  if(wizard.step===3){
    const tpls = DB.getTemplates(wizard.canal);
    if(!wizard.templateId && tpls[0]) wizard.templateId = tpls[0].id;
    const t = DB.getTemplate(wizard.templateId);
    return `<h3 style="font-size:17px;margin-bottom:14px">3. Escolha o modelo</h3>
    <div class="grid2" style="align-items:start">
      <div>
        ${tpls.map(tp=>`<div class="tplcard ${tp.id===wizard.templateId?"sel":""}" data-tpl="${tp.id}"><b>${DB.esc(tp.nome)}</b><span>${tp.categoria==="seguro"?"Seguros":tp.categoria==="consorcio"?"Consórcios":"Geral"}</span></div>`).join("") || `<p style="font-size:13px;color:var(--tinta-45)">Nenhum modelo para este canal ainda.</p>`}
        <a class="btn ghost sm block" href="modelos.html" style="margin-top:8px">+ Criar novo modelo</a>
      </div>
      <div>${t ? previewHtml(wizard.canal, t) : `<p style="font-size:13px;color:var(--tinta-45)">Selecione um modelo para pré-visualizar.</p>`}</div>
    </div>`;
  }
  // step 4
  const t = DB.getTemplate(wizard.templateId);
  const seg = DB.SEGMENTOS.find(s=>s.id===wizard.segmento);
  return `<h3 style="font-size:17px;margin-bottom:14px">4. Revisar e enviar</h3>
  <div class="field"><label>Nome da campanha</label><input id="wNome" value="${DB.esc(wizard.nome||sugerirNome())}"></div>
  <div class="field">
    <label>Quando enviar</label>
    <div style="display:flex;gap:10px">
      <label class="pill ${wizard.quando==="agora"?"on":""}" data-quando="agora" style="cursor:pointer">Enviar agora</label>
      <label class="pill ${wizard.quando==="agendado"?"on":""}" data-quando="agendado" style="cursor:pointer">Agendar</label>
    </div>
  </div>
  ${wizard.quando==="agendado" ? `<div class="field"><label>Data e hora</label><input type="datetime-local" id="wQuando" value="${wizard.agendadoPara}"></div>` : ""}
  <div class="card" style="margin-top:6px"><div class="card-bd" style="font-size:13px;color:var(--tinta-60);display:flex;flex-direction:column;gap:6px">
    <div><b>Canal:</b> ${wizard.canal==="email"?"E-mail":"WhatsApp"}</div>
    <div><b>Público:</b> ${seg?seg.label:""} (${DB.getAudience(wizard.segmento).length} contatos)</div>
    <div><b>Modelo:</b> ${t?DB.esc(t.nome):"—"}</div>
  </div></div>`;
}
function sugerirNome(){
  const seg = DB.SEGMENTOS.find(s=>s.id===wizard.segmento);
  return `${wizard.canal==="email"?"E-mail":"WhatsApp"} — ${seg?seg.label:""}`;
}

function renderWizard(){
  document.getElementById("wizSteps").innerHTML = [1,2,3,4].map(n=>`<div class="${n<=wizard.step?"on":""}"></div>`).join("");
  document.getElementById("wizBody").innerHTML = stepHtml();
  document.getElementById("wizBack").style.visibility = wizard.step===1 ? "hidden":"visible";
  document.getElementById("wizNext").textContent = wizard.step===4 ? "Confirmar" : "Continuar";
  bindStep();
}
function bindStep(){
  document.querySelectorAll("[data-canal]").forEach(el=> el.onclick = ()=>{ wizard.canal=el.dataset.canal; wizard.templateId=null; renderWizard(); });
  document.querySelectorAll("[data-seg]").forEach(el=> el.onclick = ()=>{ wizard.segmento=el.dataset.seg; renderWizard(); });
  document.querySelectorAll("[data-tpl]").forEach(el=> el.onclick = ()=>{ wizard.templateId=el.dataset.tpl; renderWizard(); });
  document.querySelectorAll("[data-quando]").forEach(el=> el.onclick = ()=>{ wizard.quando=el.dataset.quando; renderWizard(); });
  const nomeInput = document.getElementById("wNome");
  if(nomeInput) nomeInput.oninput = e=> wizard.nome = e.target.value;
  const quandoInput = document.getElementById("wQuando");
  if(quandoInput) quandoInput.oninput = e=> wizard.agendadoPara = e.target.value;
}

function openComposer(){
  Object.assign(wizard, {step:1, canal:"email", segmento:"todos", templateId:null, nome:"", quando:"agora", agendadoPara:""});
  renderWizard();
  UI.openOverlay("composerOverlay");
}

document.getElementById("btnNovaCampanha").onclick = openComposer;
document.getElementById("wizNext").onclick = ()=>{
  if(wizard.step<4){ wizard.step++; renderWizard(); return; }
  // finalizar
  const nome = (document.getElementById("wNome")||{}).value || wizard.nome || sugerirNome();
  const quandoEl = document.getElementById("wQuando");
  if(wizard.quando==="agendado" && quandoEl && !quandoEl.value){ UI.toast("Escolha data e hora para agendar.","err"); return; }
  const camp = DB.addCampaign({
    canal: wizard.canal, nome, segmento: wizard.segmento, templateId: wizard.templateId,
    status: wizard.quando==="agora" ? "rascunho" : "agendado",
    agendadoPara: wizard.quando==="agendado" ? new Date(quandoEl.value).toISOString() : null
  });
  if(wizard.quando==="agora"){ DB.sendCampaignNow(camp.id); UI.toast("Campanha criada e enviada!","ok"); }
  else { UI.toast("Campanha agendada com sucesso.","ok"); }
  UI.closeOverlay("composerOverlay");
  renderHistorico(); renderKpis();
};
document.getElementById("wizBack").onclick = ()=>{ if(wizard.step>1){ wizard.step--; renderWizard(); } };

document.querySelectorAll("[data-canalfiltro]").forEach(p=> p.onclick = ()=>{
  filtroCanal = p.dataset.canalfiltro;
  document.querySelectorAll("[data-canalfiltro]").forEach(x=>x.classList.remove("on"));
  p.classList.add("on");
  renderHistorico();
});

// ---------------- AUTOMAÇÕES (histórico real, vindo do Worker/D1) ----------------
function statusAutomacaoBadge(status){
  const map = {enviado:["ganho","Enviado"], falhou:["perdido","Falhou"], pulado:["neutro","Pulado"]};
  const [cls,label] = map[status]||["neutro",status];
  return `<span class="badge ${cls}">${label}</span>`;
}
async function renderAutomacoes(){
  const el = document.getElementById("automacaoLista");
  try{
    const r = await fetch("/api/dispatch-log?limit=20");
    if(!r.ok) throw new Error("offline");
    const data = await r.json();
    const itens = data.itens || [];
    if(!itens.length){ el.innerHTML = `<div class="empty" style="padding:20px 0">${UI.emptyState("Nenhum disparo automático registrado ainda.")}</div>`; return; }
    el.innerHTML = `<div class="feed">${itens.map(i=>`
      <div class="feed-item"><span class="feed-dot"></span>
        <div><p>${i.canal==="email"?"✉️":"💬"} <b>${DB.esc(i.destinatario_nome||"—")}</b> — ${statusAutomacaoBadge(i.status)} ${i.detalhe?`<span style="color:var(--tinta-45);font-size:12px">(${DB.esc(i.detalhe)})</span>`:""}</p>
        <time>${DB.formatDateTime(i.criado_em)}</time></div>
      </div>`).join("")}</div>`;
  }catch(e){
    el.innerHTML = `<p class="empty" style="padding:20px 0">Sem conexão com a API (<code>/api/dispatch-log</code>) — normal antes do primeiro deploy do Worker com D1.</p>`;
  }
}

renderKpis();
renderHistorico();
renderAutomacoes();
})();
