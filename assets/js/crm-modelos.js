/* ===========================================================
   Solua CRM — biblioteca de modelos (e-mail e WhatsApp)
   Página: crm/admin/modelos.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
let abaCanal = "email";
let editId = null;

const VARS = [
  ["primeiro_nome","Nome do cliente"],["produto","Produto de interesse"],["tipo","Tipo (ex.: Auto, Imóvel)"],
  ["consultor","Nome do consultor"],["telefone_solua","Telefone da Solua"]
];
const SAMPLE = {primeiro_nome:"Maria", produto:"seguro auto", tipo:"Auto", consultor:(UI.currentUser&&UI.currentUser.nome)||"Consultor(a) Solua", telefone_solua:"(19) 99999-9999"};

function tabs(){
  document.getElementById("tabs").innerHTML = ["email","whatsapp"].map(c=>
    `<button class="tab ${abaCanal===c?"on":""}" data-tab="${c}">${c==="email"?"✉️ E-mail":"💬 WhatsApp"}</button>`).join("");
  document.querySelectorAll("[data-tab]").forEach(b=> b.onclick = ()=>{ abaCanal=b.dataset.tab; render(); });
}

function render(){
  tabs();
  const tpls = DB.getTemplates(abaCanal);
  document.getElementById("grid").innerHTML = tpls.map(t=>`
    <div class="card" data-tpl="${t.id}" style="cursor:pointer">
      <div class="card-hd"><h3 style="font-size:14px">${esc(t.nome)}</h3><span class="badge ${t.categoria==="seguro"?"seguro":t.categoria==="consorcio"?"consorcio":"neutro"}">${t.categoria==="seguro"?"Seguros":t.categoria==="consorcio"?"Consórcios":"Geral"}</span></div>
      <div class="card-bd">
        ${t.assunto?`<p style="font-size:12.5px;color:var(--tinta-45);margin-bottom:6px"><b>Assunto:</b> ${esc(t.assunto)}</p>`:""}
        <p style="font-size:12.5px;color:var(--tinta-60);max-height:54px;overflow:hidden">${esc(t.corpo.slice(0,140))}${t.corpo.length>140?"…":""}</p>
      </div>
    </div>`).join("") || `<div class="empty" style="grid-column:1/-1">${UI.emptyState(`Nenhum modelo de ${abaCanal==="email"?"e-mail":"WhatsApp"} ainda.`)}</div>`;
  document.querySelectorAll("[data-tpl]").forEach(c=> c.onclick = ()=> openEditor(c.dataset.tpl));
}
const esc = DB.esc;

function varsHtml(){
  return VARS.map(([k,label])=>`<button type="button" class="pill" data-var="${k}" title="${label}" style="font-size:11.5px">{{${k}}}</button>`).join(" ");
}

function preview(){
  const canal = document.getElementById("fCanal").value;
  const assunto = DB.fillTemplate(document.getElementById("fAssunto").value, SAMPLE);
  const corpo = DB.fillTemplate(document.getElementById("fCorpo").value, SAMPLE);
  const el = document.getElementById("livePreview");
  if(canal==="whatsapp"){
    el.innerHTML = `<div style="display:flex;justify-content:center"><div class="preview-phone"><div class="screen"><div class="bubble">${corpo||"(escreva a mensagem…)"}</div></div></div></div>`;
  } else {
    el.innerHTML = `<div class="preview-email"><div class="pe-hd"><b>Assunto:</b> ${assunto||"(defina um assunto)"}</div><div class="pe-bd">${corpo||"(escreva o conteúdo…)"}</div></div>`;
  }
}

function openEditor(id){
  editId = id || null;
  const t = id ? DB.getTemplate(id) : {canal:abaCanal, categoria:"geral", nome:"", assunto:"", corpo:""};
  document.getElementById("modalTitle").textContent = id ? "Editar modelo" : "Novo modelo";
  document.getElementById("editorBody").innerHTML = `
    <div class="grid2">
      <div class="field"><label>Nome do modelo</label><input id="fNome" value="${esc(t.nome)}" placeholder="Ex.: Boas-vindas — cotação recebida"></div>
      <div class="field"><label>Canal</label><select id="fCanal"><option value="email" ${t.canal==="email"?"selected":""}>E-mail</option><option value="whatsapp" ${t.canal==="whatsapp"?"selected":""}>WhatsApp</option></select></div>
      <div class="field full"><label>Categoria</label><select id="fCategoria">
        <option value="geral" ${t.categoria==="geral"?"selected":""}>Geral (ambos produtos)</option>
        <option value="seguro" ${t.categoria==="seguro"?"selected":""}>Seguros</option>
        <option value="consorcio" ${t.categoria==="consorcio"?"selected":""}>Consórcios</option>
      </select></div>
    </div>
    <div class="field" id="assuntoWrap" style="${t.canal==="whatsapp"?"display:none":""}"><label>Assunto (e-mail)</label><input id="fAssunto" value="${esc(t.assunto||"")}" placeholder="Assunto do e-mail"></div>
    <div class="field"><label>Mensagem</label><textarea id="fCorpo" rows="7" placeholder="Escreva aqui… use as variáveis abaixo para personalizar.">${esc(t.corpo||"")}</textarea></div>
    <div class="field"><label>Inserir variável</label><div style="display:flex;gap:6px;flex-wrap:wrap">${varsHtml()}</div></div>
    <div class="field"><label>Pré-visualização com dados de exemplo</label><div id="livePreview"></div></div>
  `;
  bindEditor();
  preview();
  document.getElementById("btnExcluirModelo").style.display = id ? "" : "none";
  UI.openOverlay("editorOverlay");
}

function bindEditor(){
  const canalSel = document.getElementById("fCanal");
  canalSel.onchange = ()=>{ document.getElementById("assuntoWrap").style.display = canalSel.value==="whatsapp"?"none":""; preview(); };
  ["fAssunto","fCorpo"].forEach(id=>{ const el=document.getElementById(id); if(el) el.oninput = preview; });
  document.querySelectorAll("[data-var]").forEach(btn=> btn.onclick = ()=>{
    const ta = document.getElementById("fCorpo");
    const token = `{{${btn.dataset.var}}}`;
    const pos = ta.selectionStart||ta.value.length;
    ta.value = ta.value.slice(0,pos)+token+ta.value.slice(pos);
    ta.focus();
    preview();
  });
}

document.getElementById("btnNovoModelo").onclick = ()=> openEditor(null);
document.getElementById("btnSalvarModelo").onclick = ()=>{
  const data = {
    nome: document.getElementById("fNome").value.trim(),
    canal: document.getElementById("fCanal").value,
    categoria: document.getElementById("fCategoria").value,
    assunto: document.getElementById("fAssunto") ? document.getElementById("fAssunto").value.trim() : "",
    corpo: document.getElementById("fCorpo").value.trim()
  };
  if(!data.nome){ UI.toast("Dê um nome ao modelo.","err"); return; }
  if(!data.corpo){ UI.toast("Escreva o conteúdo da mensagem.","err"); return; }
  if(editId) DB.updateTemplate(editId, data); else DB.addTemplate(data);
  UI.toast(editId?"Modelo atualizado.":"Modelo criado.","ok");
  UI.closeOverlay("editorOverlay");
  abaCanal = data.canal;
  render();
};
document.getElementById("btnExcluirModelo").onclick = ()=>{
  if(!editId) return;
  UI.confirmAction("Excluir este modelo? Campanhas que já usam este texto continuam com o conteúdo salvo.", ()=>{
    DB.deleteTemplate(editId); UI.closeOverlay("editorOverlay"); UI.toast("Modelo excluído.","err"); render();
  });
};

render();
})();
