/* ===========================================================
   Solua CRM — configurador completo de modelos (e-mail em blocos,
   com imagem/título/texto/botão, e WhatsApp estruturado, com
   cabeçalho/corpo/rodapé/botões).
   Página: crm/admin/modelos.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
const esc = DB.esc;
let abaCanal = "email";
let editId = null;
let editando = null;   // cópia de trabalho do modelo sendo editado
let campoFoco = null;  // último campo de texto focado (pra inserir variável)

const VARS = [
  ["primeiro_nome","Nome do cliente"],["produto","Produto de interesse"],["tipo","Tipo (ex.: Auto, Imóvel)"],
  ["consultor","Nome do consultor"],["nome_empresa","Nome da empresa"],
  ["telefone_solua","Telefone p/ exibir"],["telefone_solua_link","Telefone só números (pra links wa.me)"]
];
const SAMPLE = {
  primeiro_nome:"Maria", produto:"seguro auto", tipo:"Auto",
  consultor:(UI.currentUser&&UI.currentUser.nome)||"Consultor(a) Solua", nome_empresa:"Solua",
  telefone_solua:"(19) 99999-9999", telefone_solua_link:"5519999999999"
};

function registrarFoco(el){ el.addEventListener("focus", ()=> campoFoco = el); }
function insertAtCursor(el, text){
  const start = el.selectionStart!=null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd!=null ? el.selectionEnd : el.value.length;
  el.value = el.value.slice(0,start) + text + el.value.slice(end);
  const pos = start + text.length;
  el.selectionStart = el.selectionEnd = pos;
  el.dispatchEvent(new Event("input", {bubbles:true}));
}
function fileParaDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// impede que o clique no botão de variável tire o foco do campo de texto
document.addEventListener("mousedown", e=>{ if(e.target.closest("[data-var]")) e.preventDefault(); });
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-var]");
  if(!b) return;
  if(!campoFoco || !document.body.contains(campoFoco)){ UI.toast("Clique antes num campo de texto para inserir a variável ali.","err"); return; }
  insertAtCursor(campoFoco, `{{${b.dataset.var}}}`);
});

// ---------------- LISTAGEM ----------------
function tabs(){
  document.getElementById("tabs").innerHTML = ["email","whatsapp"].map(c=>
    `<button class="tab ${abaCanal===c?"on":""}" data-tab="${c}">${c==="email"?"✉️ E-mail":"💬 WhatsApp"}</button>`).join("");
  document.querySelectorAll("[data-tab]").forEach(b=> b.onclick = ()=>{ abaCanal=b.dataset.tab; render(); });
}

function cardHtml(t){
  const resumo = t.canal==="email" ? (t.assunto||"(sem assunto)") : (t.corpo||"");
  const badges = [];
  if(t.canal==="email"){
    if((t.blocks||[]).some(b=>b.tipo==="imagem"&&b.url)) badges.push("🖼️ imagem");
    if((t.blocks||[]).some(b=>b.tipo==="botao"&&b.texto)) badges.push("🔘 botão");
  } else {
    if(t.headerType==="imagem") badges.push("🖼️ cabeçalho");
    if((t.botoes||[]).length) badges.push(`🔘 ${t.botoes.length} botão(ões)`);
  }
  return `
    <div class="card" data-tpl="${t.id}" style="cursor:pointer">
      <div class="card-hd"><h3 style="font-size:14px">${esc(t.nome)}</h3><span class="badge ${t.categoria==="seguro"?"seguro":t.categoria==="consorcio"?"consorcio":"neutro"}">${t.categoria==="seguro"?"Seguros":t.categoria==="consorcio"?"Consórcios":"Geral"}</span></div>
      <div class="card-bd">
        <p style="font-size:12.5px;color:var(--tinta-60);margin-bottom:8px;min-height:32px">${esc(resumo.slice(0,120))}${resumo.length>120?"…":""}</p>
        ${badges.length?`<div style="display:flex;gap:6px;flex-wrap:wrap">${badges.map(b=>`<span class="tagchip">${b}</span>`).join("")}</div>`:""}
      </div>
    </div>`;
}

function render(){
  tabs();
  const tpls = DB.getTemplates(abaCanal);
  document.getElementById("grid").innerHTML = tpls.map(cardHtml).join("") ||
    `<div class="empty" style="grid-column:1/-1">${UI.emptyState(`Nenhum modelo de ${abaCanal==="email"?"e-mail":"WhatsApp"} ainda.`)}</div>`;
  document.querySelectorAll("[data-tpl]").forEach(c=> c.onclick = ()=> openEditor(c.dataset.tpl));
}

// ---------------- EDITOR ----------------
function novoModeloVazio(canal){
  return canal==="email"
    ? {canal:"email", categoria:"geral", nome:"", assunto:"", preheader:"", blocks:[DB.novoBloco("titulo"), DB.novoBloco("texto")]}
    : {canal:"whatsapp", categoria:"geral", nome:"", headerType:"nenhum", headerText:"", headerImageUrl:"", corpo:"", rodape:"", botoes:[]};
}

function openEditor(id){
  editId = id || null;
  const original = id ? DB.getTemplate(id) : novoModeloVazio(abaCanal);
  editando = JSON.parse(JSON.stringify(original)); // cópia de trabalho independente
  document.getElementById("modalTitle").textContent = id ? "Editar modelo" : "Novo modelo";
  desenharEditor();
  document.getElementById("btnExcluirModelo").style.display = id ? "" : "none";
  UI.openOverlay("editorOverlay");
}

function varsHtml(){
  return VARS.map(([k,label])=>`<button type="button" class="pill" data-var="${k}" title="${label}" style="font-size:11.5px">{{${k}}}</button>`).join(" ");
}

function desenharEditor(){
  document.getElementById("editorBody").innerHTML = `
    <div class="grid2">
      <div class="field"><label>Nome do modelo</label><input id="fNome" value="${esc(editando.nome)}" placeholder="Ex.: Boas-vindas — cotação recebida"></div>
      <div class="field"><label>Canal</label><select id="fCanal">
        <option value="email" ${editando.canal==="email"?"selected":""}>E-mail</option>
        <option value="whatsapp" ${editando.canal==="whatsapp"?"selected":""}>WhatsApp</option>
      </select></div>
      <div class="field full"><label>Categoria</label><select id="fCategoria">
        <option value="geral" ${editando.categoria==="geral"?"selected":""}>Geral (ambos produtos)</option>
        <option value="seguro" ${editando.categoria==="seguro"?"selected":""}>Seguros</option>
        <option value="consorcio" ${editando.categoria==="consorcio"?"selected":""}>Consórcios</option>
      </select></div>
    </div>
    <div id="corpoEditor"></div>
    <div class="field"><label>Inserir variável no campo selecionado</label><div style="display:flex;gap:6px;flex-wrap:wrap">${varsHtml()}</div></div>
    <div class="field"><label>Pré-visualização com dados de exemplo</label><div id="livePreview"></div></div>
  `;
  document.getElementById("fNome").oninput = e=>{ editando.nome = e.target.value; };
  registrarFoco(document.getElementById("fNome"));
  document.getElementById("fCategoria").onchange = e=>{ editando.categoria = e.target.value; };
  document.getElementById("fCanal").onchange = e=>{
    const nomeAtual = document.getElementById("fNome").value;
    const categoriaAtual = document.getElementById("fCategoria").value;
    editando = novoModeloVazio(e.target.value);
    editando.nome = nomeAtual; editando.categoria = categoriaAtual;
    desenharEditor();
  };
  if(editando.canal==="email") desenharEditorEmail(); else desenharEditorWhatsapp();
  preview();
}

// ---- E-mail: blocos ----
function desenharEditorEmail(){
  document.getElementById("corpoEditor").innerHTML = `
    <div class="field"><label>Assunto</label><input id="fAssunto" value="${esc(editando.assunto||"")}" placeholder="Assunto do e-mail"></div>
    <div class="field"><label>Texto de pré-visualização (preheader, opcional)</label><input id="fPreheader" value="${esc(editando.preheader||"")}" placeholder="Aparece ao lado do assunto na caixa de entrada"></div>
    <div class="field"><label>Conteúdo do e-mail</label>
      <div id="blocosLista"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${["imagem","titulo","texto","botao","divisor","espaco"].map(t=>`<button type="button" class="btn ghost sm" data-addbloco="${t}">+ ${DB.BLOCO_LABELS[t]}</button>`).join("")}
      </div>
    </div>`;
  document.getElementById("fAssunto").oninput = e=>{ editando.assunto = e.target.value; preview(); };
  registrarFoco(document.getElementById("fAssunto"));
  document.getElementById("fPreheader").oninput = e=>{ editando.preheader = e.target.value; preview(); };
  registrarFoco(document.getElementById("fPreheader"));
  document.querySelectorAll("[data-addbloco]").forEach(b=> b.onclick = ()=>{
    editando.blocks = editando.blocks||[];
    editando.blocks.push(DB.novoBloco(b.dataset.addbloco));
    desenharBlocos(); preview();
  });
  desenharBlocos();
}

function blocoCamposHtml(b){
  switch(b.tipo){
    case "imagem": return `
      <div class="grid2">
        <div class="field"><label>URL da imagem</label><input data-bf="url" value="${esc(b.url||"")}" placeholder="https://…"></div>
        <div class="field"><label>Ou enviar arquivo (até 250KB)</label><input type="file" data-bfile="1" accept="image/*"></div>
        <div class="field"><label>Texto alternativo</label><input data-bf="alt" value="${esc(b.alt||"")}"></div>
        <div class="field"><label>Link ao clicar (opcional)</label><input data-bf="link" value="${esc(b.link||"")}" placeholder="https://…"></div>
      </div>
      ${b.url?`<img src="${b.url}" style="max-height:70px;border-radius:6px;margin-top:8px">`:""}`;
    case "titulo": return `<div class="field"><label>Texto do título</label><input data-bf="texto" value="${esc(b.texto||"")}"></div>`;
    case "texto": return `<div class="field"><label>Texto</label><textarea data-bf="texto" rows="3">${esc(b.texto||"")}</textarea></div>`;
    case "botao": return `<div class="grid2">
        <div class="field"><label>Texto do botão</label><input data-bf="texto" value="${esc(b.texto||"")}"></div>
        <div class="field"><label>Link do botão</label><input data-bf="url" value="${esc(b.url||"")}" placeholder="https://… ou https://wa.me/{{telefone_solua_link}}"></div>
      </div>`;
    case "espaco": return `<div class="field"><label>Altura (px)</label><input data-bf="altura" type="number" value="${b.altura||20}" style="max-width:110px"></div>`;
    default: return `<p style="font-size:12px;color:var(--tinta-45)">Uma linha divisória — sem campos.</p>`;
  }
}

function desenharBlocos(){
  const lista = editando.blocks||[];
  document.getElementById("blocosLista").innerHTML = lista.map((b,i)=>`
    <div class="bloco-card" data-bloco="${i}">
      <div class="bloco-hd">
        <span class="bloco-tag">${DB.BLOCO_LABELS[b.tipo]}</span>
        <div class="bloco-actions">
          <button type="button" class="btn icon ghost sm" data-mv="up" ${i===0?"disabled":""} title="Subir">↑</button>
          <button type="button" class="btn icon ghost sm" data-mv="down" ${i===lista.length-1?"disabled":""} title="Descer">↓</button>
          <button type="button" class="btn icon ghost sm" data-mv="del" title="Remover">✕</button>
        </div>
      </div>
      <div class="bloco-campos">${blocoCamposHtml(b)}</div>
    </div>`).join("") || `<p style="font-size:12.5px;color:var(--tinta-45);padding:10px 0">Nenhum bloco ainda — adicione um abaixo.</p>`;

  lista.forEach((b,i)=>{
    const card = document.querySelector(`[data-bloco="${i}"]`);
    if(!card) return;
    card.querySelectorAll("[data-bf]").forEach(input=>{
      input.oninput = e=>{ b[e.target.dataset.bf] = e.target.type==="number" ? Number(e.target.value)||0 : e.target.value; preview(); };
      registrarFoco(input);
    });
    const fileInput = card.querySelector("[data-bfile]");
    if(fileInput) fileInput.onchange = async e=>{
      const file = e.target.files[0]; if(!file) return;
      if(file.size > 250*1024){ UI.toast("Escolha uma imagem menor que 250KB.","err"); e.target.value=""; return; }
      b.url = await fileParaDataUrl(file);
      desenharBlocos(); preview();
    };
    const up = card.querySelector('[data-mv="up"]'), down = card.querySelector('[data-mv="down"]'), del = card.querySelector('[data-mv="del"]');
    if(up) up.onclick = ()=>{ if(i>0){ [lista[i-1],lista[i]]=[lista[i],lista[i-1]]; desenharBlocos(); preview(); } };
    if(down) down.onclick = ()=>{ if(i<lista.length-1){ [lista[i+1],lista[i]]=[lista[i],lista[i+1]]; desenharBlocos(); preview(); } };
    if(del) del.onclick = ()=>{ lista.splice(i,1); desenharBlocos(); preview(); };
  });
}

// ---- WhatsApp: cabeçalho / corpo / rodapé / botões ----
function desenharEditorWhatsapp(){
  editando.botoes = editando.botoes || [];
  document.getElementById("corpoEditor").innerHTML = `
    <div class="field"><label>Cabeçalho (opcional)</label>
      <select id="fHeaderType">
        <option value="nenhum" ${(!editando.headerType||editando.headerType==="nenhum")?"selected":""}>Nenhum</option>
        <option value="texto" ${editando.headerType==="texto"?"selected":""}>Texto em negrito</option>
        <option value="imagem" ${editando.headerType==="imagem"?"selected":""}>Imagem</option>
      </select>
    </div>
    <div id="headerCampo"></div>
    <div class="field"><label>Corpo da mensagem</label><textarea id="fCorpoWpp" rows="5">${esc(editando.corpo||"")}</textarea></div>
    <div class="field"><label>Rodapé (opcional, texto curto)</label><input id="fRodape" value="${esc(editando.rodape||"")}" maxlength="60"></div>
    <div class="field"><label>Botões (até 3)</label><div id="botoesLista"></div>
      <button type="button" class="btn ghost sm" id="btnAddBotao" style="margin-top:8px">+ Adicionar botão</button>
    </div>
    <div class="demo-hint">A Meta exige que este mesmo conteúdo (cabeçalho, corpo, rodapé e botões) também seja cadastrado e aprovado no <b>WhatsApp Manager</b> antes de ser usado no disparo automático — este editor é a referência de design e conteúdo do template.</div>
  `;
  document.getElementById("fHeaderType").onchange = e=>{ editando.headerType = e.target.value; desenharHeaderCampo(); preview(); };
  document.getElementById("fCorpoWpp").oninput = e=>{ editando.corpo = e.target.value; preview(); };
  registrarFoco(document.getElementById("fCorpoWpp"));
  document.getElementById("fRodape").oninput = e=>{ editando.rodape = e.target.value; preview(); };
  registrarFoco(document.getElementById("fRodape"));
  document.getElementById("btnAddBotao").onclick = ()=>{
    if(editando.botoes.length>=3){ UI.toast("Máximo de 3 botões por mensagem.","err"); return; }
    editando.botoes.push({tipo:"resposta_rapida", texto:"", valor:""});
    desenharBotoes(); preview();
  };
  desenharHeaderCampo();
  desenharBotoes();
}

function desenharHeaderCampo(){
  const el = document.getElementById("headerCampo");
  if(editando.headerType==="texto"){
    el.innerHTML = `<div class="field"><label>Texto do cabeçalho</label><input id="fHeaderText" value="${esc(editando.headerText||"")}" maxlength="60"></div>`;
    document.getElementById("fHeaderText").oninput = e=>{ editando.headerText = e.target.value; preview(); };
    registrarFoco(document.getElementById("fHeaderText"));
  } else if(editando.headerType==="imagem"){
    el.innerHTML = `<div class="field"><label>URL da imagem de cabeçalho</label><input id="fHeaderImg" value="${esc(editando.headerImageUrl||"")}" placeholder="https://…"></div>`;
    document.getElementById("fHeaderImg").oninput = e=>{ editando.headerImageUrl = e.target.value; preview(); };
    registrarFoco(document.getElementById("fHeaderImg"));
  } else {
    el.innerHTML = "";
  }
}

function desenharBotoes(){
  const lista = editando.botoes||[];
  document.getElementById("botoesLista").innerHTML = lista.map((b,i)=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center" data-botao="${i}">
      <select data-btf="tipo" style="width:150px">
        <option value="resposta_rapida" ${b.tipo==="resposta_rapida"?"selected":""}>Resposta rápida</option>
        <option value="url" ${b.tipo==="url"?"selected":""}>Abrir link</option>
        <option value="telefone" ${b.tipo==="telefone"?"selected":""}>Ligar</option>
      </select>
      <input data-btf="texto" value="${esc(b.texto||"")}" placeholder="Texto do botão" style="flex:1">
      ${b.tipo!=="resposta_rapida" ? `<input data-btf="valor" value="${esc(b.valor||"")}" placeholder="${b.tipo==="url"?"https://…":"(19) 99999-9999"}" style="flex:1">` : ""}
      <button type="button" class="btn icon ghost sm" data-rmbotao="${i}" title="Remover">✕</button>
    </div>`).join("") || `<p style="font-size:12.5px;color:var(--tinta-45)">Nenhum botão — a mensagem fica só com texto.</p>`;

  lista.forEach((b,i)=>{
    const row = document.querySelector(`[data-botao="${i}"]`);
    if(!row) return;
    row.querySelectorAll("[data-btf]").forEach(inp=>{
      const handler = e=>{ b[e.target.dataset.btf] = e.target.value; preview(); if(e.target.dataset.btf==="tipo") desenharBotoes(); };
      inp.oninput = handler; inp.onchange = handler;
      registrarFoco(inp);
    });
    const rm = row.querySelector("[data-rmbotao]");
    if(rm) rm.onclick = ()=>{ lista.splice(i,1); desenharBotoes(); preview(); };
  });
}

// ---- pré-visualização ----
function preview(){
  const el = document.getElementById("livePreview");
  if(editando.canal==="whatsapp"){
    el.innerHTML = `<div style="display:flex;justify-content:center"><div class="preview-phone"><div class="screen"><div class="bubble">${DB.renderWhatsappBubble(editando, SAMPLE)}</div></div></div></div>`;
  } else {
    const assunto = DB.fillTemplate(editando.assunto||"", SAMPLE);
    el.innerHTML = `<div class="preview-email"><div class="pe-hd"><b>Assunto:</b> ${esc(assunto)||"(defina um assunto)"}</div><div class="pe-bd">${DB.renderEmailBlocks(editando.blocks, SAMPLE)}</div></div>`;
  }
}

// ---------------- SALVAR / EXCLUIR ----------------
document.getElementById("btnNovoModelo").onclick = ()=> openEditor(null);
document.getElementById("btnSalvarModelo").onclick = ()=>{
  if(!editando.nome || !editando.nome.trim()){ UI.toast("Dê um nome ao modelo.","err"); return; }
  if(editando.canal==="email"){
    if(!editando.assunto || !editando.assunto.trim()){ UI.toast("Defina um assunto para o e-mail.","err"); return; }
    if(!(editando.blocks||[]).length){ UI.toast("Adicione ao menos um bloco de conteúdo.","err"); return; }
    editando.corpo = DB.blocksParaTexto(editando.blocks); // mantém um texto simples de referência/compatibilidade
  } else {
    if(!editando.corpo || !editando.corpo.trim()){ UI.toast("Escreva o corpo da mensagem.","err"); return; }
  }
  if(editId) DB.updateTemplate(editId, editando); else DB.addTemplate(editando);
  UI.toast(editId?"Modelo atualizado.":"Modelo criado.","ok");
  UI.closeOverlay("editorOverlay");
  abaCanal = editando.canal;
  render();
};
document.getElementById("btnExcluirModelo").onclick = ()=>{
  if(!editId) return;
  UI.confirmAction("Excluir este modelo? Campanhas que já usam este texto mantêm uma cópia salva no histórico.", ()=>{
    DB.deleteTemplate(editId); UI.closeOverlay("editorOverlay"); UI.toast("Modelo excluído.","err"); render();
  });
};

render();
})();
