/* ===========================================================
   Solua CRM — Painel de Design: editor de conteúdo do site público
   (qualquer texto, foto, vídeo ou fundo de seção, por página), montado
   a partir de assets/js/content-schema.js. Lê/grava em /api/settings —
   a MESMA linha de configurações da Personalização — então sempre
   carregamos o estado atual inteiro antes de salvar, para nunca
   sobrescrever logo/cor/WhatsApp definidos em Personalização.

   Layout "mestre-detalhe": uma aba por página (SCHEMA), e dentro de
   cada aba uma barra lateral com os grupos daquela página — só o grupo
   selecionado aparece no painel à direita. Cada página é montada em
   HTML só na primeira vez que é aberta e nunca mais reconstruída a
   partir do zero (só escondida/mostrada) — trocar de aba ou de grupo
   NUNCA descarta o que você digitou e ainda não salvou.
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
const grupoSelecionado = {}; // paginaId -> índice do grupo selecionado

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

// campo "fundo de seção" (tipo midia, label começa com "Fundo") tem seu
// próprio badge visual na navegação lateral — deixa claro que aquele
// grupo controla mais do que só texto
function grupoTemFundo(g){ return g.campos.some(c=> c.tipo==="midia" && /^Fundo/i.test(c.label)); }

function paginaHtml(pagina, conteudo){
  const nav = pagina.grupos.map((g,idx)=>{
    const n = g.campos.length;
    return `<button type="button" class="design-nav-item ${idx===0?"on":""}" data-groupidx="${idx}">
      <span class="dn-title">${DB.esc(g.titulo)}</span>
      <span class="dn-meta">${grupoTemFundo(g)?`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" title="Tem fundo de seção"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 11l3.5-3.5L9 11l2-2 3 3"/></svg>`:""}<span class="dn-count">${n}</span></span>
    </button>`;
  }).join("");
  const paineis = pagina.grupos.map((g,idx)=>`
    <div class="design-grupo-panel" data-groupidx="${idx}" style="display:${idx===0?"block":"none"}">
      <div class="dp-hd"><h3>${DB.esc(g.titulo)}</h3><span class="dp-count">${g.campos.length} campo${g.campos.length===1?"":"s"}</span></div>
      <div class="dp-bd">${g.campos.map(c=> campoHtml(c, conteudo[c.key], conteudo[c.key+"__tamanho"])).join("")}</div>
    </div>`).join("");
  return `<div class="design-layout">
    <nav class="design-nav" data-pagenav="${pagina.id}">
      <div class="design-nav-search"><input type="search" placeholder="Filtrar grupos…" data-navfiltro="${pagina.id}"></div>
      ${nav}
    </nav>
    <div class="design-panel" data-pagepanel="${pagina.id}">${paineis}</div>
  </div>`;
}

function selecionarGrupo(paginaId, idx){
  grupoSelecionado[paginaId] = idx;
  const escopo = document.querySelector(`.pageform[data-page="${paginaId}"]`);
  if(!escopo) return;
  escopo.querySelectorAll(".design-nav-item").forEach(b=> b.classList.toggle("on", Number(b.dataset.groupidx)===idx));
  escopo.querySelectorAll(".design-grupo-panel").forEach(p=> p.style.display = Number(p.dataset.groupidx)===idx ? "block" : "none");
}

function renderTabs(){
  document.getElementById("pageTabs").innerHTML = SCHEMA.map(p=>
    `<button class="tab ${p.id===paginaAtiva?"on":""}" data-pagetab="${p.id}">${DB.esc(p.label)}</button>`).join("");
  document.querySelectorAll("[data-pagetab]").forEach(b=> b.onclick = ()=>{
    paginaAtiva = b.dataset.pagetab;
    renderTabs();
    renderForms();
  });
}

// Monta o HTML de cada página só na primeira visita (nunca mais depois
// disso) — trocar de aba só troca qual .pageform está visível, então
// nenhum texto digitado (e ainda não salvo) se perde ao navegar.
function renderForms(){
  const conteudo = (atual && atual.conteudo) || {};
  const container = document.getElementById("pageForms");
  if(container.children.length === 0){
    container.innerHTML = SCHEMA.map(p=> `<div class="pageform" data-page="${p.id}" style="display:none"></div>`).join("");
  }
  container.querySelectorAll(".pageform").forEach(el=>{
    const pid = el.dataset.page;
    if(el.dataset.montada !== "1"){
      const pagina = SCHEMA.find(p=> p.id===pid);
      el.innerHTML = paginaHtml(pagina, conteudo);
      el.dataset.montada = "1";
    }
    el.style.display = pid===paginaAtiva ? "block" : "none";
  });
  ligarCampos();
}

function ligarCampos(){
  document.querySelectorAll("[data-fileinput]").forEach(input=>{
    if(input.dataset.ligado) return; input.dataset.ligado = "1";
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
    if(input.dataset.ligado) return; input.dataset.ligado = "1";
    input.oninput = ()=>{
      const prev = document.getElementById("prev__"+input.dataset.key);
      if(prev) prev.innerHTML = previewHtml(input.value.trim());
    };
  });
  document.querySelectorAll("[data-aligngroup]").forEach(grupo=>{
    if(grupo.dataset.ligado) return; grupo.dataset.ligado = "1";
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
    if(select.dataset.ligado) return; select.dataset.ligado = "1";
    select.onchange = ()=>{
      const icones = window.SoluaIcons || {};
      const icone = icones[select.value];
      const prev = document.getElementById("iconprev__"+select.dataset.key);
      if(prev && icone) prev.innerHTML = `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5">${icone.svg}</svg>`;
    };
  });
  document.querySelectorAll("[data-fsgroup]").forEach(grupo=>{
    if(grupo.dataset.ligado) return; grupo.dataset.ligado = "1";
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
  document.querySelectorAll(".design-nav-item").forEach(btn=>{
    if(btn.dataset.ligado) return; btn.dataset.ligado = "1";
    btn.onclick = ()=>{
      const pid = btn.closest("[data-pagenav]").dataset.pagenav;
      selecionarGrupo(pid, Number(btn.dataset.groupidx));
    };
  });
  document.querySelectorAll("[data-navfiltro]").forEach(input=>{
    if(input.dataset.ligado) return; input.dataset.ligado = "1";
    input.oninput = ()=>{
      const termo = input.value.trim().toLowerCase();
      const nav = input.closest(".design-nav");
      nav.querySelectorAll(".design-nav-item").forEach(btn=>{
        const titulo = btn.querySelector(".dn-title").textContent.toLowerCase();
        btn.style.display = !termo || titulo.includes(termo) ? "" : "none";
      });
    };
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
      atual = data.settings;
      // depois de salvar, remonta tudo do zero pra refletir o que veio do
      // servidor (ex.: upload de arquivo virou link definitivo) — aqui é
      // seguro perder o estado do formulário, pois acabamos de salvar
      document.querySelectorAll(".pageform").forEach(el=> el.dataset.montada = "");
      renderForms();
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
