/* ===========================================================
   Solua CRM — Painel de Design: editor de conteúdo do site público
   (qualquer texto, foto ou vídeo, por página), montado a partir de
   assets/js/content-schema.js. Lê/grava em /api/settings — a MESMA
   linha de configurações da Personalização — então sempre carregamos
   o estado atual inteiro antes de salvar, para nunca sobrescrever
   logo/cor/WhatsApp definidos em Personalização.
   =========================================================== */
(function(){
"use strict";
const UI = window.SoluaUI;
const DB = window.SoluaDB;
const SCHEMA = window.SoluaContentSchema;
const ADMIN_KEY_STORAGE = "solua_admin_key"; // mesma chave usada em Personalização
const MAX_ARQUIVO = 200000; // bytes — upload direto; arquivos maiores (e vídeos) devem ser um link

let atual = null;
let paginaAtiva = SCHEMA[0].id;
let gruposAbertos = {}; // "paginaId::índice" -> aberto/fechado (primeiro grupo de cada página começa aberto)

function grupoAberto(paginaId, idx){
  const k = paginaId+"::"+idx;
  if(!(k in gruposAbertos)) gruposAbertos[k] = idx===0;
  return gruposAbertos[k];
}

function getAdminKey(){ try{ return localStorage.getItem(ADMIN_KEY_STORAGE) || ""; }catch(e){ return ""; } }

function ehVideoUrl(u){ return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(u||""); }
function ehEmbedUrl(u){ return /youtube\.com|youtu\.be|vimeo\.com/i.test(u||""); }

function previewHtml(val){
  if(!val) return "sem mídia";
  if(ehVideoUrl(val)) return "🎬 vídeo";
  if(ehEmbedUrl(val)) return "▶ vídeo (embed)";
  return `<img src="${DB.esc(val)}" alt="">`;
}

function tamanhoStepperHtml(key, escala){
  return `<div class="fs-step" data-fsgroup="${key}">
    <button type="button" data-fsdelta="-10" aria-label="Diminuir texto">A−</button>
    <span class="fs-val" data-fsval>${escala}%</span>
    <button type="button" data-fsdelta="10" aria-label="Aumentar texto">A+</button>
  </div>
  <input type="hidden" data-key="${key}__tamanho" data-tipo="tamanho" value="${escala}">`;
}

function campoHtml(campo, val, tamanhoVal){
  const label = DB.esc(campo.label);
  if(campo.tipo === "toggle"){
    return `<label class="switch-field">
      <span class="switch"><input type="checkbox" data-key="${campo.key}" data-tipo="toggle" ${val!==false?"checked":""}><span class="switch-track"></span></span>
      <span>${label}</span>
    </label>`;
  }
  if(campo.tipo === "textarea"){
    const escala = parseInt(tamanhoVal,10) || 100;
    return `<div class="field" style="margin-bottom:14px">
      <div class="field-label-row"><label>${label}</label>${tamanhoStepperHtml(campo.key, escala)}</div>
      <textarea data-key="${campo.key}" data-tipo="textarea" rows="3" placeholder="${DB.esc(campo.placeholder||"")}" style="${escala!==100?`font-size:${escala/100}em`:""}">${DB.esc(val||"")}</textarea>
    </div>`;
  }
  if(campo.tipo === "imagem" || campo.tipo === "midia"){
    const aceitaVideo = campo.tipo === "midia";
    return `<div class="field" style="margin-bottom:14px">
      <label>${label}${aceitaVideo?` <span style="color:var(--tinta-45);font-weight:400">(foto ou vídeo)</span>`:""}</label>
      <div class="midia-row">
        <div class="midia-preview" id="prev__${campo.key}">${previewHtml(val)}</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px">
          <input data-key="${campo.key}" data-tipo="${campo.tipo}" placeholder="Cole uma URL de imagem${aceitaVideo?", vídeo (.mp4) ou link do YouTube/Vimeo":""}" value="${DB.esc(val||"")}">
          <input type="file" accept="${aceitaVideo?"image/*,video/*":"image/*"}" data-fileinput="${campo.key}">
        </div>
      </div>
    </div>`;
  }
  if(campo.tipo === "alinhamento"){
    const atualVal = val || "left";
    const opcoes = [["left","Esquerda"],["center","Centro"],["right","Direita"]];
    return `<div class="field" style="margin-bottom:14px">
      <label>${label}</label>
      <div class="align-row" data-aligngroup="${campo.key}">
        ${opcoes.map(([v,l])=>`<button type="button" data-alignval="${v}" class="${v===atualVal?"on":""}">${l}</button>`).join("")}
      </div>
      <input type="hidden" data-key="${campo.key}" data-tipo="alinhamento" value="${DB.esc(atualVal)}">
    </div>`;
  }
  if(campo.tipo === "icone"){
    const icones = window.SoluaIcons || {};
    const atualVal = val || Object.keys(icones)[0] || "";
    const svg = icones[atualVal] ? icones[atualVal].svg : "";
    return `<div class="field" style="margin-bottom:14px">
      <label>${label}</label>
      <div class="icon-row">
        <div class="icon-preview" id="iconprev__${campo.key}"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5">${svg}</svg></div>
        <select data-key="${campo.key}" data-tipo="icone" style="flex:1">
          ${Object.keys(icones).map(k=>`<option value="${k}" ${k===atualVal?"selected":""}>${DB.esc(icones[k].label)}</option>`).join("")}
        </select>
      </div>
    </div>`;
  }
  // texto
  const escala = parseInt(tamanhoVal,10) || 100;
  return `<div class="field" style="margin-bottom:14px">
    <div class="field-label-row"><label>${label}</label>${tamanhoStepperHtml(campo.key, escala)}</div>
    <input data-key="${campo.key}" data-tipo="texto" placeholder="${DB.esc(campo.placeholder||"")}" value="${DB.esc(val||"")}" style="${escala!==100?`font-size:${escala/100}em`:""}">
  </div>`;
}

function paginaHtml(pagina, conteudo){
  return pagina.grupos.map((g,idx)=>{
    const aberto = grupoAberto(pagina.id, idx);
    const n = g.campos.length;
    return `
    <div class="card design-grupo ${aberto?"open":""}">
      <div class="card-hd grupo-hd" data-grupotoggle="${pagina.id}::${idx}">
        <h3 style="font-size:14px">${DB.esc(g.titulo)}</h3>
        <span class="grupo-meta">
          <span class="grupo-count">${n} campo${n===1?"":"s"}</span>
          <svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6l4 4 4-4"/></svg>
        </span>
      </div>
      <div class="card-bd">${g.campos.map(c=> campoHtml(c, conteudo[c.key], conteudo[c.key+"__tamanho"])).join("")}</div>
    </div>`;
  }).join("");
}

function renderTabs(){
  document.getElementById("pageTabs").innerHTML = SCHEMA.map(p=>
    `<button class="tab ${p.id===paginaAtiva?"on":""}" data-pagetab="${p.id}">${DB.esc(p.label)}</button>`).join("");
  document.querySelectorAll("[data-pagetab]").forEach(b=> b.onclick = ()=>{
    paginaAtiva = b.dataset.pagetab;
    renderTabs();
    renderForms();
  });
  renderToolbar();
}

function renderToolbar(){
  const el = document.getElementById("pageToolbar");
  if(!el) return;
  const p = SCHEMA.find(x=> x.id===paginaAtiva);
  const total = p.grupos.reduce((a,g)=> a+g.campos.length, 0);
  el.innerHTML = `
    <span class="toolbar-count">${p.grupos.length} grupo${p.grupos.length===1?"":"s"} · ${total} campo${total===1?"":"s"} nesta página</span>
    <span class="spacer"></span>
    <button type="button" class="btn ghost sm" id="btnExpandirTudo">Expandir tudo</button>
    <button type="button" class="btn ghost sm" id="btnRecolherTudo">Recolher tudo</button>`;
  document.getElementById("btnExpandirTudo").onclick = ()=> alternarTodosGrupos(true);
  document.getElementById("btnRecolherTudo").onclick = ()=> alternarTodosGrupos(false);
}

function alternarTodosGrupos(abrir){
  const p = SCHEMA.find(x=> x.id===paginaAtiva);
  p.grupos.forEach((g,idx)=> gruposAbertos[paginaAtiva+"::"+idx] = abrir);
  document.querySelectorAll(`.pageform[data-page="${paginaAtiva}"] .design-grupo`).forEach(el=> el.classList.toggle("open", abrir));
}

function renderForms(){
  const conteudo = (atual && atual.conteudo) || {};
  document.getElementById("pageForms").innerHTML = SCHEMA.map(p=>
    `<div class="pageform" data-page="${p.id}" style="display:${p.id===paginaAtiva?"block":"none"}">${paginaHtml(p, conteudo)}</div>`
  ).join("");
  ligarCampos();
}

function ligarCampos(){
  document.querySelectorAll("[data-fileinput]").forEach(input=>{
    input.onchange = async ()=>{
      const file = input.files[0];
      if(!file) return;
      if(file.size > MAX_ARQUIVO){
        UI.toast("Arquivo grande demais (limite de ~200KB para upload direto). Cole um link em vez disso.","err");
        input.value = "";
        return;
      }
      const key = input.dataset.fileinput;
      const dataUrl = await new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload = ()=> resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const textInput = document.querySelector(`input[data-key="${CSS.escape(key)}"]`);
      if(textInput) textInput.value = dataUrl;
      const prev = document.getElementById("prev__"+key);
      if(prev) prev.innerHTML = previewHtml(dataUrl);
    };
  });
  document.querySelectorAll('input[data-tipo="imagem"], input[data-tipo="midia"]').forEach(input=>{
    input.oninput = ()=>{
      const prev = document.getElementById("prev__"+input.dataset.key);
      if(prev) prev.innerHTML = previewHtml(input.value.trim());
    };
  });
  document.querySelectorAll("[data-aligngroup]").forEach(grupo=>{
    const key = grupo.dataset.aligngroup;
    const hidden = document.querySelector(`input[type="hidden"][data-key="${CSS.escape(key)}"]`);
    grupo.querySelectorAll("[data-alignval]").forEach(btn=>{
      btn.onclick = ()=>{
        grupo.querySelectorAll("[data-alignval]").forEach(b=> b.classList.remove("on"));
        btn.classList.add("on");
        if(hidden) hidden.value = btn.dataset.alignval;
      };
    });
  });
  document.querySelectorAll('select[data-tipo="icone"]').forEach(select=>{
    select.onchange = ()=>{
      const icones = window.SoluaIcons || {};
      const icone = icones[select.value];
      const prev = document.getElementById("iconprev__"+select.dataset.key);
      if(prev && icone) prev.innerHTML = `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5">${icone.svg}</svg>`;
    };
  });
  document.querySelectorAll("[data-grupotoggle]").forEach(hd=>{
    hd.onclick = ()=>{
      const [pid, idxStr] = hd.dataset.grupotoggle.split("::");
      const idx = Number(idxStr);
      gruposAbertos[pid+"::"+idx] = !grupoAberto(pid, idx);
      hd.closest(".design-grupo").classList.toggle("open", gruposAbertos[pid+"::"+idx]);
    };
  });
  document.querySelectorAll("[data-fsgroup]").forEach(grupo=>{
    const key = grupo.dataset.fsgroup;
    const hidden = document.querySelector(`input[type="hidden"][data-key="${CSS.escape(key+"__tamanho")}"]`);
    const valEl = grupo.querySelector("[data-fsval]");
    const campoEl = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
    grupo.querySelectorAll("[data-fsdelta]").forEach(btn=>{
      btn.onclick = ()=>{
        let v = parseInt(hidden.value, 10) || 100;
        v = Math.min(150, Math.max(70, v + parseInt(btn.dataset.fsdelta, 10)));
        hidden.value = v;
        valEl.textContent = v + "%";
        if(campoEl) campoEl.style.fontSize = v===100 ? "" : (v/100)+"em";
      };
    });
  });
}

async function carregar(){
  try{
    const r = await fetch("/api/settings");
    if(!r.ok) throw new Error("offline");
    atual = await r.json();
    if(!atual.conteudo) atual.conteudo = {};
    document.getElementById("apiStatus").innerHTML = `<span class="badge ganho">Conectado ao banco real (D1)</span>`;
  }catch(e){
    atual = { corPrimaria:"#004BA5", whatsappNumero:"5519999999999", emailRemetente:"contato@solua.com.br", nomeRemetente:"Solua", conteudo:{} };
    document.getElementById("apiStatus").innerHTML = `<span class="badge perdido">API /api/settings não respondeu</span> <span style="font-size:12px;color:var(--tinta-45)">— isso é esperado antes do primeiro deploy do Worker com D1, ou testando localmente sem o Cloudflare.</span>`;
  }
  renderTabs();
  renderForms();
}

document.getElementById("btnSalvarConteudo").onclick = async ()=>{
  const key = getAdminKey();
  if(!key){ UI.toast("Configure a chave de administrador em Personalização antes de salvar aqui.","err"); return; }

  const conteudo = {};
  document.querySelectorAll("#pageForms [data-key]").forEach(el=>{
    conteudo[el.dataset.key] = el.dataset.tipo==="toggle" ? el.checked : el.value.trim();
  });
  const payload = Object.assign({}, atual, { conteudo });

  const btn = document.getElementById("btnSalvarConteudo");
  btn.textContent = "Salvando…"; btn.style.pointerEvents="none";
  try{
    const r = await fetch("/api/settings", {
      method:"PUT",
      headers:{"Content-Type":"application/json", "x-solua-admin-key": key},
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(()=>({}));
    if(r.ok && data.ok){
      UI.toast("Conteúdo salvo — já vale para o site inteiro.","ok");
      atual = data.settings; renderForms();
    } else {
      UI.toast(data.erro || `Não foi possível salvar (HTTP ${r.status}).`, "err");
    }
  }catch(e){
    UI.toast("Não deu pra falar com a API agora (Worker ainda não publicado?).","err");
  }
  btn.textContent = "Salvar conteúdo"; btn.style.pointerEvents="";
};

carregar();
})();
