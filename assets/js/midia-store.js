/* ===========================================================
   Solua — armazenamento de fotos, plantas e arquivos dos imóveis.

   O resto do CRM mora no localStorage (limite de ~5MB, e um estouro ali
   impediria de salvar QUALQUER dado). Por isso as mídias vão pro
   IndexedDB do navegador (centenas de MB) e o imóvel guarda só uma
   referência curta "idb:<id>". Links comuns (https://…) continuam
   funcionando do mesmo jeito.

   Uso:
     SoluaMidia.salvarImagem(file, {marca:"solua"}) → Promise<"idb:…">
     SoluaMidia.salvarArquivo(file)                  → Promise<{ref,nome,tipo,tamanho}>
     SoluaMidia.url(ref)                             → Promise<string> (pra <img>/download)
     SoluaMidia.remover(ref)
     SoluaMidia.hidratar(raiz)  — preenche [data-midia="ref"]: <img> ganha src,
                                   o resto ganha background-image
   =========================================================== */
(function(){
"use strict";
const DB_NOME = "solua-midia", STORE = "arquivos";
let dbPromise = null;

function abrir(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((ok, erro)=>{
    if(!window.indexedDB){ erro(new Error("Este navegador não permite guardar arquivos localmente.")); return; }
    const req = indexedDB.open(DB_NOME, 1);
    req.onupgradeneeded = ()=> req.result.createObjectStore(STORE);
    req.onsuccess = ()=> ok(req.result);
    req.onerror = ()=> erro(req.error);
  });
  return dbPromise;
}
function tx(modo, fn){
  return abrir().then(db=> new Promise((ok, erro)=>{
    const t = db.transaction(STORE, modo);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = ()=> ok(r && r.result);
    t.onerror = ()=> erro(t.error);
    t.onabort = ()=> erro(t.error || new Error("Sem espaço para guardar o arquivo."));
  }));
}
function novoId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function ehRef(ref){ return typeof ref === "string" && ref.indexOf("idb:") === 0; }

// reduz pra no máximo 1600px no lado maior e JPEG ~82% — foto de celular de
// 4–8MB vira ~250KB sem perda visível no site; opcionalmente carimba a marca
function comprimir(file, opts){
  opts = opts || {};
  const max = opts.max || 1600, qualidade = opts.qualidade || .82;
  return new Promise((ok, erro)=>{
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(u);
      const esc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth*esc), h = Math.round(img.naturalHeight*esc);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img, 0, 0, w, h);
      if(opts.marca){
        const fs = Math.max(16, Math.round(w/28));
        ctx.font = `600 ${fs}px Satoshi, -apple-system, sans-serif`;
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = fs/3;
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillText(opts.marca, w - fs*.8, h - fs*.6);
      }
      c.toBlob(b=> b ? ok(b) : erro(new Error("Não foi possível processar a imagem.")), "image/jpeg", qualidade);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(u); erro(new Error("Arquivo de imagem inválido.")); };
    img.src = u;
  });
}

function guardar(blob){
  const id = novoId();
  return tx("readwrite", s=> s.put(blob, id)).then(()=> "idb:"+id);
}

function salvarImagem(file, opts){
  if(!file || !/^image\//.test(file.type)) return Promise.reject(new Error("Envie um arquivo de imagem (JPG, PNG ou WEBP)."));
  return comprimir(file, opts).then(guardar);
}
function salvarArquivo(file){
  if(!file) return Promise.reject(new Error("Nenhum arquivo."));
  if(file.size > 25*1024*1024) return Promise.reject(new Error("Arquivo maior que 25MB."));
  return guardar(file).then(ref=> ({ref, nome:file.name, tipo:file.type||"", tamanho:file.size}));
}

const cache = {};
function url(ref){
  if(!ref) return Promise.resolve("");
  if(!ehRef(ref)) return Promise.resolve(ref);
  if(cache[ref]) return Promise.resolve(cache[ref]);
  return tx("readonly", s=> s.get(ref.slice(4))).then(blob=>{
    if(!blob) return "";
    cache[ref] = URL.createObjectURL(blob);
    return cache[ref];
  }).catch(()=> "");
}
function remover(ref){
  if(!ehRef(ref)) return Promise.resolve();
  if(cache[ref]){ URL.revokeObjectURL(cache[ref]); delete cache[ref]; }
  return tx("readwrite", s=> s.delete(ref.slice(4))).catch(()=>{});
}
// cópia independente (usada ao duplicar um imóvel, pra excluir um não apagar a foto do outro)
function copiar(ref){
  if(!ehRef(ref)) return Promise.resolve(ref);
  return tx("readonly", s=> s.get(ref.slice(4))).then(blob=> blob ? guardar(blob) : "");
}

function hidratar(raiz){
  (raiz || document).querySelectorAll("[data-midia]").forEach(el=>{
    const ref = el.getAttribute("data-midia");
    url(ref).then(u=>{
      if(!u) return;
      if(el.tagName === "IMG") el.src = u;
      else el.style.backgroundImage = `url("${u}")`;
    });
  });
}
// src "síncrono" pra templates: link comum vai direto; ref do IndexedDB entra
// vazio e é preenchido por hidratar() logo em seguida
function srcInicial(ref){ return ehRef(ref) ? "" : (ref || ""); }

window.SoluaMidia = { salvarImagem, salvarArquivo, url, remover, copiar, hidratar, srcInicial, ehRef };
})();
