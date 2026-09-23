/* ===========================================================
   Solua CRM — Blog: escrever, editar e publicar os artigos do site
   público (crm/admin/blog.html). Lista em cards + editor em modal,
   no mesmo espírito de crm-modelos.js (modelos de mensagem): corpo
   do artigo é uma lista de blocos (subtítulo/parágrafo/lista/imagem),
   nunca HTML solto — DB.renderPostCorpo() escapa tudo na hora de
   virar HTML de verdade no site.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
const esc = DB.esc;

let editId = null;
let editando = null;

function fileParaDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
const MAX_ARQUIVO = 250*1024;

// ---------------- LISTAGEM ----------------
function cardHtml(p){
  const thumb = p.capa
    ? `<div style="height:120px;border-radius:10px;margin-bottom:10px;background-size:cover;background-position:center;background-image:url('${esc(p.capa)}')"></div>`
    : `<div style="height:120px;border-radius:10px;margin-bottom:10px;background:var(--creme-2);display:flex;align-items:center;justify-content:center;color:var(--tinta-35);font-size:12px">sem capa</div>`;
  return `
    <div class="card" data-post="${p.id}" style="cursor:pointer">
      <div class="card-hd">
        <h3 style="font-size:14px">${esc(p.titulo)||"(sem título)"}</h3>
        <span class="badge ${p.status==="publicado"?"ganho":"neutro"}">${p.status==="publicado"?"Publicado":"Rascunho"}</span>
      </div>
      <div class="card-bd">
        ${thumb}
        <span class="tagchip">${esc(p.categoria)}</span>
        <p style="font-size:12.5px;color:var(--tinta-60);margin:8px 0 0;min-height:32px">${esc((p.resumo||"").slice(0,110))}${(p.resumo||"").length>110?"…":""}</p>
      </div>
    </div>`;
}

function render(){
  const posts = DB.getPosts();
  document.getElementById("grid").innerHTML = posts.map(cardHtml).join("") ||
    `<div class="empty" style="grid-column:1/-1">${UI.emptyState("Nenhum artigo ainda — clique em “+ Novo artigo”.")}</div>`;
  document.querySelectorAll("[data-post]").forEach(c=> c.onclick = ()=> openEditor(c.dataset.post));
}

// ---------------- EDITOR ----------------
function novoPostVazio(){
  return {categoria:"Planejamento", titulo:"", resumo:"", capa:null, status:"rascunho", blocos:[DB.novoBlocoPost("paragrafo")]};
}

function openEditor(id){
  editId = id || null;
  const original = id ? DB.getPost(id) : novoPostVazio();
  editando = JSON.parse(JSON.stringify(original));
  document.getElementById("modalTitle").textContent = id ? "Editar artigo" : "Novo artigo";
  desenharEditor();
  document.getElementById("btnExcluirPost").style.display = id ? "" : "none";
  UI.openOverlay("editorOverlay");
}

function categoriasDatalist(){
  return DB.getCategoriasPost().map(c=>`<option value="${esc(c)}">`).join("");
}

function capaHtml(){
  const val = editando.capa;
  return `<div class="midia-card">
    <div class="midia-preview" id="prevCapa">${val ? `<img src="${esc(val)}" alt="">` : "sem mídia"}</div>
    <div class="midia-actions">
      <div class="midia-actions-row">
        <label class="btn-file" for="fileCapa">Trocar foto</label>
        <input type="file" id="fileCapa" accept="image/*" style="display:none">
        <button type="button" class="midia-clear" id="btnClearCapa" style="${val?"":"display:none"}">Remover</button>
      </div>
      <label class="midia-link-label">ou cole um link (imagem)
        <input id="fCapaUrl" value="${esc(val||"")}" placeholder="https://…">
      </label>
    </div>
  </div>`;
}

function desenharEditor(){
  document.getElementById("editorBody").innerHTML = `
    <div class="grid2">
      <div class="field"><label>Categoria / tema</label>
        <input id="fCategoria" list="categoriasPost" value="${esc(editando.categoria)}" placeholder="Ex.: Seguros">
        <datalist id="categoriasPost">${categoriasDatalist()}</datalist>
      </div>
      <div class="field"><label>Status</label><select id="fStatus">
        <option value="rascunho" ${editando.status==="rascunho"?"selected":""}>Rascunho (não aparece no site)</option>
        <option value="publicado" ${editando.status==="publicado"?"selected":""}>Publicado</option>
      </select></div>
      <div class="field full"><label>Título</label><input id="fTitulo" value="${esc(editando.titulo)}" placeholder="Título do artigo"></div>
      <div class="field full"><label>Resumo (aparece no card e na busca do site)</label><textarea id="fResumo" rows="2" placeholder="Uma ou duas frases sobre o artigo">${esc(editando.resumo)}</textarea></div>
      <div class="field full"><label>Foto de capa</label>${capaHtml()}</div>
    </div>
    <div class="field"><label>Corpo do artigo</label>
      <div id="blocosLista"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${["titulo2","paragrafo","lista","imagem"].map(t=>`<button type="button" class="btn ghost sm" data-addbloco="${t}">+ ${DB.POST_BLOCO_LABELS[t]}</button>`).join("")}
      </div>
    </div>
    <div class="field"><label>Pré-visualização</label><div id="livePreview"></div></div>
  `;
  document.getElementById("fCategoria").oninput = e=>{ editando.categoria = e.target.value; preview(); };
  document.getElementById("fStatus").onchange = e=>{ editando.status = e.target.value; };
  document.getElementById("fTitulo").oninput = e=>{ editando.titulo = e.target.value; preview(); };
  document.getElementById("fResumo").oninput = e=>{ editando.resumo = e.target.value; };

  const fCapaUrl = document.getElementById("fCapaUrl");
  fCapaUrl.oninput = ()=>{
    editando.capa = fCapaUrl.value.trim() || null;
    document.getElementById("prevCapa").innerHTML = editando.capa ? `<img src="${esc(editando.capa)}" alt="">` : "sem mídia";
    document.getElementById("btnClearCapa").style.display = editando.capa ? "" : "none";
    preview();
  };
  document.getElementById("fileCapa").onchange = async e=>{
    const file = e.target.files[0]; if(!file) return;
    if(file.size > MAX_ARQUIVO){ UI.toast("Escolha uma imagem menor que 250KB, ou cole um link.","err"); e.target.value=""; return; }
    editando.capa = await fileParaDataUrl(file);
    fCapaUrl.value = editando.capa;
    document.getElementById("prevCapa").innerHTML = `<img src="${editando.capa}" alt="">`;
    document.getElementById("btnClearCapa").style.display = "";
    preview();
  };
  document.getElementById("btnClearCapa").onclick = ()=>{
    editando.capa = null;
    fCapaUrl.value = "";
    document.getElementById("prevCapa").innerHTML = "sem mídia";
    document.getElementById("btnClearCapa").style.display = "none";
    preview();
  };

  document.querySelectorAll("[data-addbloco]").forEach(b=> b.onclick = ()=>{
    editando.blocos = editando.blocos||[];
    editando.blocos.push(DB.novoBlocoPost(b.dataset.addbloco));
    desenharBlocos(); preview();
  });
  desenharBlocos();
  preview();
}

function blocoCamposHtml(b){
  switch(b.tipo){
    case "titulo2": return `<div class="field"><label>Texto do subtítulo</label><input data-bf="texto" value="${esc(b.texto||"")}"></div>`;
    case "lista": return `<div class="field"><label>Itens da lista (um por linha)</label><textarea data-bf="itensTexto" rows="4">${esc((b.itens||[]).join("\n"))}</textarea></div>`;
    case "imagem": return `
      <div class="grid2">
        <div class="field"><label>URL da imagem</label><input data-bf="url" value="${esc(b.url||"")}" placeholder="https://…"></div>
        <div class="field"><label>Ou enviar arquivo (até 250KB)</label><input type="file" data-bfile="1" accept="image/*"></div>
        <div class="field full"><label>Texto alternativo</label><input data-bf="alt" value="${esc(b.alt||"")}"></div>
      </div>
      ${b.url?`<img src="${b.url}" style="max-height:70px;border-radius:6px;margin-top:8px">`:""}`;
    default: return `<div class="field"><label>Texto do parágrafo</label><textarea data-bf="texto" rows="3">${esc(b.texto||"")}</textarea></div>`;
  }
}

function desenharBlocos(){
  const lista = editando.blocos||[];
  document.getElementById("blocosLista").innerHTML = lista.map((b,i)=>`
    <div class="bloco-card" data-bloco="${i}">
      <div class="bloco-hd">
        <span class="bloco-tag">${DB.POST_BLOCO_LABELS[b.tipo]}</span>
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
      input.oninput = e=>{
        const campo = e.target.dataset.bf;
        if(campo==="itensTexto") b.itens = e.target.value.split("\n").map(s=>s.trim()).filter(Boolean);
        else b[campo] = e.target.value;
        preview();
      };
    });
    const fileInput = card.querySelector("[data-bfile]");
    if(fileInput) fileInput.onchange = async e=>{
      const file = e.target.files[0]; if(!file) return;
      if(file.size > MAX_ARQUIVO){ UI.toast("Escolha uma imagem menor que 250KB.","err"); e.target.value=""; return; }
      b.url = await fileParaDataUrl(file);
      desenharBlocos(); preview();
    };
    const up = card.querySelector('[data-mv="up"]'), down = card.querySelector('[data-mv="down"]'), del = card.querySelector('[data-mv="del"]');
    if(up) up.onclick = ()=>{ if(i>0){ [lista[i-1],lista[i]]=[lista[i],lista[i-1]]; desenharBlocos(); preview(); } };
    if(down) down.onclick = ()=>{ if(i<lista.length-1){ [lista[i+1],lista[i]]=[lista[i],lista[i+1]]; desenharBlocos(); preview(); } };
    if(del) del.onclick = ()=>{ lista.splice(i,1); desenharBlocos(); preview(); };
  });
}

function preview(){
  const el = document.getElementById("livePreview");
  const capa = editando.capa ? `<img src="${esc(editando.capa)}" style="width:100%;border-radius:12px;margin-bottom:16px;display:block">` : "";
  el.innerHTML = `<div class="preview-email"><div class="pe-hd"><b>${esc(editando.categoria)||"(categoria)"}</b></div>
    <div class="pe-bd" style="white-space:normal">${capa}<h2 style="margin-top:0">${esc(editando.titulo)||"(sem título)"}</h2>${DB.renderPostCorpo(editando.blocos)}</div></div>`;
}

// ---------------- SALVAR / EXCLUIR ----------------
document.getElementById("btnNovoPost").onclick = ()=> openEditor(null);
document.getElementById("btnSalvarPost").onclick = ()=>{
  if(!editando.titulo || !editando.titulo.trim()){ UI.toast("Dê um título ao artigo.","err"); return; }
  if(!editando.categoria || !editando.categoria.trim()){ UI.toast("Escolha uma categoria/tema.","err"); return; }
  if(!(editando.blocos||[]).some(b=> (b.texto&&b.texto.trim()) || (b.itens&&b.itens.length) || b.url)){
    UI.toast("Escreva ao menos um bloco de conteúdo.","err"); return;
  }
  const me = DB.currentUser();
  if(!editId && me) editando.autorId = me.id;
  if(editId) DB.updatePost(editId, editando); else DB.addPost(editando);
  UI.toast(editId?"Artigo atualizado.":"Artigo criado.","ok");
  UI.closeOverlay("editorOverlay");
  render();
};
document.getElementById("btnExcluirPost").onclick = ()=>{
  if(!editId) return;
  UI.confirmAction("Excluir este artigo? Ele some do site imediatamente.", ()=>{
    DB.deletePost(editId); UI.closeOverlay("editorOverlay"); UI.toast("Artigo excluído.","err"); render();
  });
};

render();
})();
