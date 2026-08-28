/* ===========================================================
   Solua CRM — drawer de detalhe do lead/contato (componente
   compartilhado entre pipeline-seguros, pipeline-consorcios e
   contatos). Depende de crm-data.js e crm-ui.js já carregados.
   Uso:  SoluaLead.open(leadId, { onChange: fn, onDelete: fn })
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
let onChangeCb = null, onDeleteCb = null, currentId = null;

function ensureDom(){
  if(document.getElementById("leadDrawerOverlay")) return;
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.id = "leadDrawerOverlay";
  ov.innerHTML = `<div class="drawer" id="leadDrawerBody"></div>`;
  document.body.appendChild(ov);
}

function fieldsHtml(l){
  // Mantém consultores inativos na lista (só marcados como "(inativo)") em vez de
  // escondê-los: se sumissem da lista, salvar o formulário sem mexer nesse campo
  // reatribuiria silenciosamente o lead para o primeiro nome da lista.
  const equipe = DB.getEquipe()
    .filter(u=> u.papel!=="Administrador" && (u.produto===l.produto || u.produto==="ambos"))
    .sort((a,b)=> (b.ativo?1:0)-(a.ativo?1:0));
  const tipos = DB.TIPOS[l.produto] || [];
  return `
  <div class="grid2">
    <div class="field"><label>Nome</label><input data-f="nome" value="${esc(l.nome)}"></div>
    <div class="field"><label>Cidade</label><input data-f="cidade" value="${esc(l.cidade||"")}"></div>
    <div class="field"><label>WhatsApp</label><input data-f="telefone" value="${esc(l.telefone||"")}"></div>
    <div class="field"><label>E-mail</label><input data-f="email" value="${esc(l.email||"")}"></div>
    <div class="field"><label>Tipo</label><select data-f="tipo">${tipos.map(t=>`<option ${t===l.tipo?"selected":""}>${t}</option>`).join("")}</select></div>
    <div class="field"><label>Origem</label><select data-f="origem">${DB.ORIGENS.map(o=>`<option ${o===l.origem?"selected":""}>${o}</option>`).join("")}</select></div>
    <div class="field"><label>Consultor</label><select data-f="consultorId"><option value="">— sem atribuição —</option>${equipe.map(u=>`<option value="${u.id}" ${u.id===l.consultorId?"selected":""}>${esc(u.nome)}${u.ativo?"":" (inativo)"}</option>`).join("")}</select></div>
    <div class="field"><label>${l.produto==="seguro"?"Prêmio estimado (R$/ano)":"Valor da carta (R$)"}</label><input data-f="valor" type="number" value="${Number(l.valor)||0}"></div>
  </div>
  <div class="field">
    <label>Etiquetas</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${["prioridade","renovacao"].map(tag=>`<label class="pill ${((l.tags||[]).includes(tag))?"on":""}" data-tagpill="${tag}" style="cursor:pointer">${tag==="prioridade"?"⭐ Prioridade":"🔄 Renovação"}</label>`).join("")}
    </div>
  </div>`;
}

function stagesHtml(l){
  const stages = DB.PIPELINES[l.produto];
  return `<div class="field"><label>Estágio no funil</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${stages.map(s=>`<button type="button" class="pill ${s.id===l.estagio?"on":""}" data-stage="${s.id}" style="${s.id===l.estagio?`background:${s.cor};border-color:${s.cor}`:""}">${s.label}</button>`).join("")}
    </div></div>`;
}

function notesHtml(l){
  const notas = l.notas||[];
  return `
  <div class="field">
    <label>Nova anotação</label>
    <textarea id="novaNota" rows="2" placeholder="Registre o combinado com o cliente…"></textarea>
    <button class="btn sm" id="btnAddNota" style="margin-top:8px;align-self:flex-start">Adicionar anotação</button>
  </div>
  <div class="feed" style="margin-top:6px">
    ${notas.length ? notas.map(n=>`
      <div class="feed-item"><span class="feed-dot"></span>
        <div><p><b>${esc(n.autor)}</b> — ${esc(n.texto)}</p><time>${DB.formatDateTime(n.data)}</time></div>
      </div>`).join("") : `<p style="color:var(--tinta-45);font-size:13px;padding:8px 0">Nenhuma anotação ainda.</p>`}
  </div>`;
}

const esc = DB.esc;

function render(l){
  const badgeClass = l.produto==="seguro" ? "seguro" : "consorcio";
  return `
  <div class="drawer-hd">
    <div>
      <span class="badge ${badgeClass}">${l.produto==="seguro"?"Seguro":"Consórcio"}</span>
      <h2 style="margin-top:8px;font-size:22px">${esc(l.nome)}</h2>
      <span style="font-size:12px;color:var(--tinta-45)">Lead desde ${DB.formatDate(l.criadoEm)} · atualizado ${DB.timeAgo(l.atualizadoEm)}</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn icon ghost sm" id="btnWpp" title="Abrir WhatsApp">${window.SoluaUI.svg("disparos")}</button>
      <button class="x" data-close-overlay="leadDrawerOverlay" aria-label="Fechar"></button>
    </div>
  </div>
  <div class="drawer-bd">
    ${stagesHtml(l)}
    <div class="rule" style="height:1px;background:var(--linha);margin:18px 0"></div>
    ${fieldsHtml(l)}
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn sm" id="btnSalvar">Salvar alterações</button>
      <button class="btn sm danger ghost" id="btnExcluir" style="margin-left:auto">Excluir lead</button>
    </div>
    <div class="rule" style="height:1px;background:var(--linha);margin:22px 0"></div>
    <h3 style="font-size:14px;margin-bottom:12px">Anotações e histórico</h3>
    ${notesHtml(l)}
  </div>`;
}

function open(leadId, opts){
  ensureDom();
  currentId = leadId;
  onChangeCb = (opts&&opts.onChange) || null;
  onDeleteCb = (opts&&opts.onDelete) || null;
  paint();
  window.SoluaUI.openOverlay("leadDrawerOverlay");
}

function paint(){
  const l = DB.getLead(currentId);
  if(!l) return;
  document.getElementById("leadDrawerBody").innerHTML = render(l);
  bind(l);
}

function bind(l){
  const root = document.getElementById("leadDrawerBody");
  root.querySelectorAll("[data-stage]").forEach(btn=>{
    btn.onclick = ()=>{
      DB.updateLead(l.id, {estagio: btn.dataset.stage});
      window.SoluaUI.toast("Estágio atualizado.", "ok");
      paint();
      onChangeCb && onChangeCb();
    };
  });
  root.querySelectorAll("[data-tagpill]").forEach(p=>{
    p.onclick = ()=>{
      const tag = p.dataset.tagpill;
      const tags = new Set(l.tags||[]);
      tags.has(tag) ? tags.delete(tag) : tags.add(tag);
      DB.updateLead(l.id, {tags:[...tags]});
      paint();
      onChangeCb && onChangeCb();
    };
  });
  const wppBtn = document.getElementById("btnWpp");
  if(wppBtn) wppBtn.onclick = ()=>{
    const fone = String(l.telefone||"").replace(/\D/g,"");
    const numero = fone.length>=10 ? "55"+fone : fone;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent("Olá "+l.nome.split(" ")[0]+", aqui é da Solua! 👋")}`,"_blank");
  };
  document.getElementById("btnSalvar").onclick = ()=>{
    const patch = {};
    root.querySelectorAll("[data-f]").forEach(el=>{ patch[el.dataset.f] = el.type==="number" ? Number(el.value)||0 : el.value; });
    DB.updateLead(l.id, patch);
    window.SoluaUI.toast("Lead atualizado com sucesso.", "ok");
    onChangeCb && onChangeCb();
    paint();
  };
  document.getElementById("btnExcluir").onclick = ()=>{
    window.SoluaUI.confirmAction(`Excluir "${l.nome}" definitivamente do CRM?`, ()=>{
      DB.deleteLead(l.id);
      window.SoluaUI.closeOverlay("leadDrawerOverlay");
      window.SoluaUI.toast("Lead excluído.", "err");
      onDeleteCb && onDeleteCb();
      onChangeCb && onChangeCb();
    });
  };
  document.getElementById("btnAddNota").onclick = ()=>{
    const ta = document.getElementById("novaNota");
    if(!ta.value.trim()) return;
    DB.addNota(l.id, ta.value.trim(), window.SoluaUI.currentUser.nome);
    paint();
    onChangeCb && onChangeCb();
  };
}

window.SoluaLead = { open };
})();
