/* ===========================================================
   Solua CRM — modal "novo lead", compartilhado entre os
   pipelines e a tela de contatos.
   Uso: SoluaNewLead.open({ produto:"seguro"|"consorcio"|null, onCreated:fn })
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
let onCreatedCb = null;

function ensureDom(){
  if(document.getElementById("newLeadOverlay")) return;
  const ov = document.createElement("div");
  ov.className = "overlay modal-center";
  ov.id = "newLeadOverlay";
  ov.innerHTML = `<div class="modal">
    <div class="modal-hd"><h3 style="font-size:16px">Novo lead</h3><button class="x" data-close-overlay="newLeadOverlay"></button></div>
    <div class="modal-bd" id="newLeadBody"></div>
    <div class="modal-ft"><button class="btn ghost sm" data-close-overlay="newLeadOverlay">Cancelar</button><button class="btn sm" id="btnCriarLead">Criar lead</button></div>
  </div>`;
  document.body.appendChild(ov);
}

function bodyHtml(produtoFixo){
  const produtoSelect = produtoFixo
    ? `<input type="hidden" data-f="produto" value="${produtoFixo}">`
    : `<div class="field"><label>Produto</label><select id="nlProduto" data-f="produto">
         <option value="seguro">Seguro</option><option value="consorcio">Consórcio</option>
       </select></div>`;
  return `
  <div class="grid2">
    <div class="field full"><label>Nome completo *</label><input data-f="nome" placeholder="Nome do cliente"></div>
    ${produtoSelect}
    <div class="field"><label>Tipo</label><select id="nlTipo" data-f="tipo"></select></div>
    <div class="field"><label>WhatsApp *</label><input data-f="telefone" placeholder="(19) 90000-0000"></div>
    <div class="field"><label>E-mail</label><input data-f="email" type="email" placeholder="cliente@email.com"></div>
    <div class="field"><label>Cidade</label><input data-f="cidade" placeholder="Campinas"></div>
    <div class="field"><label>Origem</label><select data-f="origem">${DB.ORIGENS.map(o=>`<option>${o}</option>`).join("")}</select></div>
  </div>
  <div class="field"><label>Observação inicial (opcional)</label><textarea id="nlObs" rows="2" placeholder="Contexto do contato…"></textarea></div>`;
}

function refreshTipos(produto){
  const sel = document.getElementById("nlTipo");
  if(!sel) return;
  sel.innerHTML = (DB.TIPOS[produto]||[]).map(t=>`<option>${t}</option>`).join("");
}

function open(opts){
  opts = opts || {};
  onCreatedCb = opts.onCreated || null;
  ensureDom();
  const body = document.getElementById("newLeadBody");
  body.innerHTML = bodyHtml(opts.produto || null);
  refreshTipos(opts.produto || "seguro");
  const prodSel = document.getElementById("nlProduto");
  if(prodSel) prodSel.onchange = ()=> refreshTipos(prodSel.value);
  document.getElementById("btnCriarLead").onclick = ()=>{
    const data = {};
    body.querySelectorAll("[data-f]").forEach(el=> data[el.dataset.f] = el.value);
    if(!data.nome || data.nome.trim().length<2){ window.SoluaUI.toast("Informe o nome do lead.","err"); return; }
    if(!data.telefone || data.telefone.replace(/\D/g,"").length<10){ window.SoluaUI.toast("Informe um WhatsApp válido.","err"); return; }
    data.produto = data.produto || opts.produto || "seguro";
    data.estagio = "novo";
    const obs = document.getElementById("nlObs").value.trim();
    if(obs) data.notas = [{id:DB.uid("nota"), data:new Date().toISOString(), autor:window.SoluaUI.currentUser.nome, texto:obs}];
    const lead = DB.addLead(data);
    window.SoluaUI.closeOverlay("newLeadOverlay");
    window.SoluaUI.toast("Lead criado com sucesso.","ok");
    onCreatedCb && onCreatedCb(lead);
  };
  window.SoluaUI.openOverlay("newLeadOverlay");
}

window.SoluaNewLead = { open };
})();
