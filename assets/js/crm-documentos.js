/* ===========================================================
   Solua CRM — Documentos internos (repositório real, via D1).
   Página: crm/admin/documentos.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
const ADMIN_KEY_STORAGE = "solua_admin_key"; // mesma chave da Personalização
const MAX_ARQUIVO = 525000; // bytes — compatível com o limite do Worker (~700KB em base64)

let docs = [];
let categoriaAtiva = "Todos";
let papeisSelecionados = new Set(["Todos"]);

function getAdminKey(){ try{ return localStorage.getItem(ADMIN_KEY_STORAGE) || ""; }catch(e){ return ""; } }

function fileParaBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(n){
  if(!n) return "—";
  if(n < 1024) return n+" B";
  if(n < 1024*1024) return (n/1024).toFixed(0)+" KB";
  return (n/1024/1024).toFixed(1)+" MB";
}

async function carregar(){
  try{
    const r = await fetch("/api/documentos");
    if(!r.ok) throw new Error("offline");
    const data = await r.json();
    docs = data.itens || [];
    document.getElementById("docApiStatus").innerHTML = `<span class="badge ganho">${docs.length} documento(s) no banco (D1)</span>`;
  }catch(e){
    docs = [];
    document.getElementById("docApiStatus").innerHTML = `<span class="badge perdido">API /api/documentos não respondeu</span> <span style="font-size:12px;color:var(--tinta-45)">— publique o Worker com D1 para usar este módulo de verdade.</span>`;
  }
  renderTabs();
  renderRows();
}

function renderTabs(){
  const categorias = ["Todos", ...new Set(docs.map(d=>d.categoria))];
  document.getElementById("catTabs").innerHTML = categorias.map(c=>`<button class="filt${c===categoriaAtiva?" on":""}" data-cat="${DB.esc(c)}">${DB.esc(c)}</button>`).join("");
  document.querySelectorAll("[data-cat]").forEach(b=> b.onclick = ()=>{ categoriaAtiva = b.dataset.cat; renderTabs(); renderRows(); });
}

function renderRows(){
  const filtrados = docs.filter(d=> categoriaAtiva==="Todos" || d.categoria===categoriaAtiva);
  document.getElementById("docRows").innerHTML = filtrados.map(d=>`
    <tr data-id="${d.id}">
      <td><b>${DB.esc(d.nome)}</b><br><span style="font-size:12px;color:var(--tinta-45)">${formatBytes(d.tamanho)}</span></td>
      <td>${DB.esc(d.categoria)}</td>
      <td>v${DB.esc(d.versao)}</td>
      <td>${(d.papeisPermitidos&&d.papeisPermitidos.length&&!d.papeisPermitidos.includes("Todos")) ? d.papeisPermitidos.map(p=>`<span class="badge neutro" style="margin-right:4px">${DB.esc(p)}</span>`).join("") : `<span class="badge neutro">Todos</span>`}</td>
      <td>${DB.esc(d.enviadoPor||"—")}</td>
      <td>${DB.formatDate(d.criadoEm)}</td>
      <td class="rowactions">
        <button class="btn icon ghost sm" data-baixar="${d.id}" title="Baixar">⬇</button>
        <button class="btn icon ghost sm" data-del="${d.id}" title="Excluir">✕</button>
      </td>
    </tr>`).join("");
  document.getElementById("docEmpty").style.display = filtrados.length ? "none" : "block";

  document.querySelectorAll("[data-baixar]").forEach(b=> b.onclick = ()=> baixar(b.dataset.baixar));
  document.querySelectorAll("[data-del]").forEach(b=> b.onclick = ()=>{
    const d = docs.find(x=>x.id===b.dataset.del);
    UI.confirmAction(`Excluir "${d.nome}" definitivamente?`, ()=> excluir(d.id));
  });
}

async function baixar(id){
  try{
    const r = await fetch("/api/documentos/download?id="+encodeURIComponent(id));
    const data = await r.json();
    if(!data.ok) throw new Error(data.erro||"falha");
    const doc = data.documento;
    const bin = atob(doc.conteudoBase64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], {type: doc.tipoArquivo||"application/octet-stream"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = doc.nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 4000);
  }catch(e){
    UI.toast("Não foi possível baixar o documento agora.","err");
  }
}

async function excluir(id){
  const key = getAdminKey();
  if(!key){ UI.toast("Configure a chave de administrador em Personalização antes de excluir.","err"); return; }
  try{
    const r = await fetch("/api/documentos?id="+encodeURIComponent(id), {method:"DELETE", headers:{"x-solua-admin-key":key}});
    const data = await r.json().catch(()=>({}));
    if(r.ok && data.ok){ UI.toast("Documento excluído.","err"); carregar(); }
    else UI.toast(data.erro || "Não foi possível excluir.","err");
  }catch(e){ UI.toast("Não deu pra falar com a API agora.","err"); }
}

/* MODAL DE ENVIO */
document.getElementById("btnNovoDoc").onclick = ()=>{
  document.getElementById("dNome").value = "";
  document.getElementById("dVersao").value = "1.0";
  document.getElementById("dArquivo").value = "";
  document.getElementById("dArquivoInfo").textContent = "";
  papeisSelecionados = new Set(["Todos"]);
  document.querySelectorAll("[data-papelpill]").forEach(p=> p.classList.toggle("on", p.dataset.papelpill==="Todos"));
  UI.openOverlay("docOverlay");
};

document.querySelectorAll("[data-papelpill]").forEach(pill=>{
  pill.onclick = ()=>{
    const papel = pill.dataset.papelpill;
    if(papel==="Todos"){ papeisSelecionados = new Set(["Todos"]); }
    else{
      papeisSelecionados.delete("Todos");
      papeisSelecionados.has(papel) ? papeisSelecionados.delete(papel) : papeisSelecionados.add(papel);
      if(!papeisSelecionados.size) papeisSelecionados.add("Todos");
    }
    document.querySelectorAll("[data-papelpill]").forEach(p=> p.classList.toggle("on", papeisSelecionados.has(p.dataset.papelpill)));
  };
});

document.getElementById("dArquivo").onchange = e=>{
  const f = e.target.files[0];
  document.getElementById("dArquivoInfo").textContent = f ? `${f.name} — ${formatBytes(f.size)}${f.size>MAX_ARQUIVO?" — arquivo grande demais!":""}` : "";
};

document.getElementById("btnEnviarDoc").onclick = async ()=>{
  const key = getAdminKey();
  if(!key){ UI.toast("Configure a chave de administrador em Personalização antes de enviar.","err"); return; }
  const nome = document.getElementById("dNome").value.trim();
  const file = document.getElementById("dArquivo").files[0];
  if(!nome){ UI.toast("Informe o nome do documento.","err"); return; }
  if(!file){ UI.toast("Selecione um arquivo.","err"); return; }
  if(file.size > MAX_ARQUIVO){ UI.toast("Arquivo grande demais (limite de ~500KB).","err"); return; }

  const btn = document.getElementById("btnEnviarDoc");
  btn.textContent = "Enviando…"; btn.style.pointerEvents = "none";
  try{
    const conteudoBase64 = await fileParaBase64(file);
    const r = await fetch("/api/documentos", {
      method:"POST",
      headers:{"Content-Type":"application/json", "x-solua-admin-key": key},
      body: JSON.stringify({
        nome, categoria: document.getElementById("dCategoria").value, versao: document.getElementById("dVersao").value.trim()||"1.0",
        papeisPermitidos: [...papeisSelecionados], tipoArquivo: file.type, conteudoBase64,
        enviadoPor: UI.currentUser.nome
      })
    });
    const data = await r.json().catch(()=>({}));
    if(r.ok && data.ok){ UI.toast("Documento enviado.","ok"); UI.closeOverlay("docOverlay"); carregar(); }
    else UI.toast(data.erro || "Não foi possível enviar.","err");
  }catch(e){ UI.toast("Não deu pra falar com a API agora.","err"); }
  btn.textContent = "Enviar"; btn.style.pointerEvents = "";
};

carregar();
})();
