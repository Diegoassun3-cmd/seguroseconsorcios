/* Solua — catálogo de imóveis (imoveis.html): busca no topo (Comprar /
   Alugar + bairro ou código), barra de filtros, "Mais filtros", chips,
   ordenação e "ver mais". Os filtros vão pra URL, então dá pra mandar
   o link de uma busca pronta pra um cliente. */
(function(){
"use strict";
const DB = window.SoluaDB, MID = window.SoluaMidia, esc = DB.esc;
const STATUS_LABEL = {pronto:"Pronto",lancamento:"Lançamento",em_construcao:"Em construção",na_planta:"Na planta",reforma:"Precisa de reforma"};
const FIN_LABEL = {venda:"Venda", locacao:"Locação", venda_locacao:"Venda e locação"};
const FOTO_PADRAO = "https://picsum.photos/seed/solua-imovel-fallback/1200/800";
const SEM_COMODOS = new Set(["Terreno","Sala comercial","Loja","Galpão","Rural"]);
const POR_PAGINA = 12;
const n = v => Number(v)||0;

const VAZIO = {modo:"", q:"", bairro:"", tipos:[], quartos:0, vagas:0, banheiros:0, pmin:null, pmax:null, amin:null, amax:null, fases:[], comodidades:[], financiamento:false, destaque:false, video:false};
let F = lerUrl();
let ordem = new URLSearchParams(location.search).get("ord") || "relevancia";
let pagina = 1;
let pop = null;          // qual dropdown da barra está aberto
let maisAberto = false;

// ---------------------------------------------------------- URL <-> filtros
function lerUrl(){
  const p = new URLSearchParams(location.search), f = JSON.parse(JSON.stringify(VAZIO));
  const lista = k => (p.get(k)||"").split(",").map(s=>s.trim()).filter(Boolean);
  const num = k => p.get(k)!=null && p.get(k)!=="" ? Number(p.get(k)) : null;
  if(["venda","locacao"].includes(p.get("modo"))) f.modo = p.get("modo");
  f.q = p.get("q") || ""; f.bairro = p.get("bairro") || "";
  f.tipos = lista("tipo"); f.fases = lista("fase"); f.comodidades = lista("com");
  f.quartos = n(p.get("quartos")); f.vagas = n(p.get("vagas")); f.banheiros = n(p.get("banh"));
  f.pmin = num("pmin"); f.pmax = num("pmax"); f.amin = num("amin"); f.amax = num("amax");
  f.financiamento = p.get("fin")==="1"; f.destaque = p.get("dest")==="1"; f.video = p.get("video")==="1";
  return f;
}
function gravarUrl(){
  const p = new URLSearchParams();
  if(F.modo) p.set("modo", F.modo);
  if(F.q) p.set("q", F.q);
  if(F.bairro) p.set("bairro", F.bairro);
  if(F.tipos.length) p.set("tipo", F.tipos.join(","));
  if(F.quartos) p.set("quartos", F.quartos);
  if(F.vagas) p.set("vagas", F.vagas);
  if(F.banheiros) p.set("banh", F.banheiros);
  if(F.pmin!=null) p.set("pmin", F.pmin);
  if(F.pmax!=null) p.set("pmax", F.pmax);
  if(F.amin!=null) p.set("amin", F.amin);
  if(F.amax!=null) p.set("amax", F.amax);
  if(F.fases.length) p.set("fase", F.fases.join(","));
  if(F.comodidades.length) p.set("com", F.comodidades.join(","));
  if(F.financiamento) p.set("fin","1");
  if(F.destaque) p.set("dest","1");
  if(F.video) p.set("video","1");
  if(ordem!=="relevancia") p.set("ord", ordem);
  const qs = p.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
}

// ---------------------------------------------------------------- dados
const todos = ()=> DB.getImoveisPublicados();
function precoVenda(i){ return i.precoVenda!=null ? n(i.precoVenda) : (i.finalidade!=="locacao" ? n(i.valor) : 0); }
function precoLocacao(i){ return i.precoLocacao!=null ? n(i.precoLocacao) : (i.finalidade==="locacao" ? n(i.valor) : 0); }
function precoNoModo(i){ return F.modo==="locacao" ? precoLocacao(i) : F.modo==="venda" ? precoVenda(i) : (i.finalidade==="locacao" ? precoLocacao(i) : precoVenda(i)); }
function semAcento(s){ return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); }

function passa(i, f){
  if(f.modo && !(i.finalidade===f.modo || i.finalidade==="venda_locacao")) return false;
  if(f.bairro && i.bairro!==f.bairro) return false;
  if(f.q){
    const t = semAcento(f.q);
    const campos = [i.codigo, i.bairro, i.cidade, i.titulo, i.tipo, (i.endereco||{}).condominio];
    if(!campos.some(c=> semAcento(c).includes(t))) return false;
  }
  if(f.tipos.length && !f.tipos.includes(i.tipo)) return false;
  if(f.quartos && n(i.quartos) < f.quartos) return false;
  if(f.vagas && n(i.vagas) < f.vagas) return false;
  if(f.banheiros && n(i.banheiros) < f.banheiros) return false;
  const preco = precoNoModo(i);
  if(!i.ocultarPreco){
    if(f.pmin!=null && preco < f.pmin) return false;
    if(f.pmax!=null && preco > f.pmax) return false;
  } else if(f.pmin!=null || f.pmax!=null) return false;
  if(f.amin!=null && n(i.areaM2) < f.amin) return false;
  if(f.amax!=null && n(i.areaM2) > f.amax) return false;
  if(f.fases.length && !f.fases.includes(i.status)) return false;
  if(f.comodidades.length && !f.comodidades.every(c=> (i.comodidades||[]).includes(c))) return false;
  if(f.financiamento && !i.aceitaFinanciamento) return false;
  if(f.destaque && !i.destaque) return false;
  if(f.video && !(i.videoUrl || i.tourUrl)) return false;
  return true;
}
const ORDENS = {
  relevancia:(a,b)=> (b.destaque?1:0)-(a.destaque?1:0) || (b.criadoEm||"").localeCompare(a.criadoEm||""),
  recentes:(a,b)=> (b.criadoEm||"").localeCompare(a.criadoEm||"") || (b.codigo||"").localeCompare(a.codigo||""),
  menor:(a,b)=> (a.ocultarPreco?1e15:precoNoModo(a)) - (b.ocultarPreco?1e15:precoNoModo(b)),
  maior:(a,b)=> (b.ocultarPreco?-1:precoNoModo(b)) - (a.ocultarPreco?-1:precoNoModo(a)),
  area:(a,b)=> n(b.areaM2) - n(a.areaM2)
};
function resultado(){ return todos().filter(i=> passa(i, F)).sort(ORDENS[ordem] || ORDENS.relevancia); }
function contarCom(mud){ const f = Object.assign({}, F, mud); return todos().filter(i=> passa(i, f)).length; }

// ------------------------------------------------------------- formatos
function moedaCurta(v){
  if(v>=1e6) return "R$ " + (v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1}) + " mi";
  if(v>=1e3 && F.modo!=="locacao") return "R$ " + Math.round(v/1e3).toLocaleString("pt-BR") + " mil";
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}
const PRESETS = {
  venda:[[null,300000],[300000,500000],[500000,1000000],[1000000,2000000],[2000000,null]],
  locacao:[[null,1500],[1500,3000],[3000,5000],[5000,null]]
};
function faixaTexto(a,b){
  if(a!=null && b!=null) return `${moedaCurta(a)} a ${moedaCurta(b)}`;
  if(a!=null) return `a partir de ${moedaCurta(a)}`;
  if(b!=null) return `até ${moedaCurta(b)}`;
  return "";
}
const ICO = {
  chev:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  filtro:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>`,
  cama:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-8M21 18v-5a3 3 0 00-3-3h-8v5M3 15h18"/><circle cx="6.5" cy="11.5" r="1.5"/></svg>`,
  banho:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16v2a5 5 0 01-5 5H9a5 5 0 01-5-5v-2zM6 12V6a2 2 0 014 0"/></svg>`,
  carro:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 11h10"/></svg>`,
  area:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4"/></svg>`,
  pin:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.3-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  casa:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>`
};

// ---------------------------------------------------------- topo (hero)
function renderModo(){
  document.querySelectorAll("[data-modo]").forEach(b=>{
    const on = F.modo===b.dataset.modo;
    b.classList.toggle("on", on); b.setAttribute("aria-checked", on);
  });
}
const qInput = document.getElementById("imQ");
const sug = document.getElementById("imSug");
let sugItens = [], sugIx = -1;
function sugerir(){
  const t = semAcento(qInput.value.trim());
  if(t.length<2){ fecharSug(); return; }
  const lista = todos();
  const bairros = {};
  lista.forEach(i=>{ if(i.bairro && semAcento(i.bairro).includes(t)) bairros[i.bairro] = (bairros[i.bairro]||0) + 1; });
  const cidades = {};
  lista.forEach(i=>{ if(i.cidade && semAcento(i.cidade).includes(t)) cidades[i.cidade] = (cidades[i.cidade]||0) + 1; });
  const codigos = lista.filter(i=> semAcento(i.codigo).includes(t)).slice(0,4);
  sugItens = [
    ...Object.entries(bairros).slice(0,5).map(([b,q])=>({tipo:"bairro", valor:b, rot:b, sub:`Bairro · ${q} imóve${q===1?"l":"is"}`})),
    ...Object.entries(cidades).slice(0,2).map(([c,q])=>({tipo:"texto", valor:c, rot:c, sub:`Cidade · ${q} imóve${q===1?"l":"is"}`})),
    ...codigos.map(i=>({tipo:"codigo", valor:i.id, rot:i.codigo, sub:i.titulo}))
  ];
  if(!sugItens.length){ fecharSug(); return; }
  sugIx = -1;
  sug.innerHTML = sugItens.map((s,ix)=>`<button type="button" role="option" id="sug${ix}" data-sug="${ix}">
    <span class="ic">${s.tipo==="codigo" ? ICO.casa : ICO.pin}</span><span><b>${esc(s.rot)}</b><small>${esc(s.sub||"")}</small></span></button>`).join("");
  sug.hidden = false;
  qInput.setAttribute("aria-expanded","true");
}
function fecharSug(){ sug.hidden = true; sug.innerHTML = ""; sugItens = []; qInput.setAttribute("aria-expanded","false"); qInput.removeAttribute("aria-activedescendant"); }
function escolherSug(ix){
  const s = sugItens[ix]; if(!s) return;
  fecharSug();
  if(s.tipo==="codigo"){ location.href = "imovel.html?id=" + encodeURIComponent(s.valor); return; }
  if(s.tipo==="bairro"){ F.bairro = s.valor; F.q = ""; qInput.value = ""; }
  else { F.q = s.valor; qInput.value = s.valor; }
  aplicar(true);
}
qInput.addEventListener("input", sugerir);
qInput.addEventListener("keydown", e=>{
  if(sug.hidden) return;
  if(e.key==="ArrowDown" || e.key==="ArrowUp"){
    e.preventDefault();
    sugIx = (sugIx + (e.key==="ArrowDown"?1:-1) + sugItens.length) % sugItens.length;
    sug.querySelectorAll("[data-sug]").forEach((b,ix)=> b.classList.toggle("ativo", ix===sugIx));
    qInput.setAttribute("aria-activedescendant", "sug"+sugIx);
  }
  if(e.key==="Enter" && sugIx>=0){ e.preventDefault(); escolherSug(sugIx); }
  if(e.key==="Escape") fecharSug();
});
sug.addEventListener("click", e=>{ const b = e.target.closest("[data-sug]"); if(b) escolherSug(+b.dataset.sug); });
document.getElementById("imBusca").addEventListener("submit", e=>{
  e.preventDefault(); fecharSug();
  const v = qInput.value.trim();
  // código digitado inteiro (ex.: SOL-0008) leva direto ao imóvel
  const porCodigo = v && todos().find(i=> (i.codigo||"").toLowerCase()===v.toLowerCase());
  if(porCodigo){ location.href = "imovel.html?id=" + encodeURIComponent(porCodigo.id); return; }
  F.q = v; aplicar(true);
});
document.querySelectorAll("[data-modo]").forEach(b=> b.addEventListener("click", ()=>{
  const novo = F.modo===b.dataset.modo ? "" : b.dataset.modo;
  if(novo!==F.modo){ F.pmin = null; F.pmax = null; }   // faixa de compra não serve pra aluguel
  F.modo = novo; aplicar(false);
}));

// ------------------------------------------------------- barra de filtros
function btnFiltro(id, rotulo, valor){
  return `<div class="imf-item"><button type="button" class="imf-btn ${valor?"ativo":""} ${pop===id?"aberto":""}" data-pop="${id}" aria-expanded="${pop===id}" aria-haspopup="true">
    <span class="imf-rot">${rotulo}</span>${valor?`<b>${esc(valor)}</b>`:""}<span class="imf-chev">${ICO.chev}</span></button>
    ${pop===id ? `<div class="imf-pop" role="dialog" aria-label="${rotulo}">${conteudoPop(id)}</div>` : ""}</div>`;
}
function pills(chave, valores, sufixo){
  return `<div class="imf-pills">${valores.map(v=>`<button type="button" class="${F[chave]===v?"on":""}" data-pill="${chave}" data-v="${v}">${v ? v+"+" : "Qualquer"}</button>`).join("")}</div>${sufixo||""}`;
}
function conteudoPop(id){
  if(id==="tipo"){
    const tipos = [...new Set(todos().map(i=>i.tipo))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    return `<div class="imf-checks">${tipos.map(t=>{ const q = contarCom({tipos:[t]}); return `<label><input type="checkbox" data-tipo="${esc(t)}" ${F.tipos.includes(t)?"checked":""}> ${esc(t)}<em>${q}</em></label>`; }).join("")}</div>`;
  }
  if(id==="quartos") return `<p class="imf-pop-tit">Dormitórios</p>${pills("quartos",[0,1,2,3,4])}`;
  if(id==="preco"){
    const modo = F.modo || "venda";
    return `<p class="imf-pop-tit">${F.modo==="locacao" ? "Aluguel por mês" : F.modo==="venda" ? "Preço de venda" : "Preço (venda ou aluguel)"}</p>
      <div class="imf-faixa">
        <label><span>Mínimo</span><div class="imf-money"><i>R$</i><input data-money="pmin" inputmode="numeric" value="${F.pmin!=null?F.pmin.toLocaleString("pt-BR"):""}" placeholder="0"></div></label>
        <label><span>Máximo</span><div class="imf-money"><i>R$</i><input data-money="pmax" inputmode="numeric" value="${F.pmax!=null?F.pmax.toLocaleString("pt-BR"):""}" placeholder="Sem limite"></div></label>
      </div>
      <div class="imf-presets">${PRESETS[modo].map(([a,b])=>`<button type="button" data-faixa="${a??""}|${b??""}" class="${F.pmin===a&&F.pmax===b?"on":""}">${faixaTexto(a,b)}</button>`).join("")}</div>
      ${F.modo ? "" : `<p class="imf-dica">Escolha Comprar ou Alugar no topo para faixas mais certeiras.</p>`}`;
  }
  return "";
}
function renderBarra(){
  const tiposTxt = F.tipos.length===1 ? F.tipos[0] : F.tipos.length ? `${F.tipos.length} tipos` : "";
  const nMais = [F.vagas, F.banheiros, F.amin!=null, F.amax!=null, F.fases.length, F.comodidades.length, F.financiamento, F.destaque, F.video, F.bairro].filter(Boolean).length;
  document.getElementById("imFiltros").innerHTML = `
    <div class="imf-seg" role="radiogroup" aria-label="Venda ou locação">
      ${[["","Todos"],["venda","Comprar"],["locacao","Alugar"]].map(([v,l])=>`<button type="button" role="radio" aria-checked="${F.modo===v}" class="${F.modo===v?"on":""}" data-modo2="${v}">${l}</button>`).join("")}
    </div>
    ${btnFiltro("tipo","Tipo", tiposTxt)}
    ${btnFiltro("quartos","Quartos", F.quartos ? F.quartos+"+" : "")}
    ${btnFiltro("preco","Preço", faixaTexto(F.pmin, F.pmax))}
    <button type="button" class="imf-btn imf-maisbtn ${nMais?"ativo":""} ${maisAberto?"aberto":""}" id="imfMais" aria-expanded="${maisAberto}" aria-controls="imMais">${ICO.filtro}<span class="imf-rot">Mais filtros</span>${nMais?`<span class="imf-n">${nMais}</span>`:""}</button>`;
}
function renderMais(){
  const box = document.getElementById("imMais");
  box.hidden = !maisAberto;
  if(!maisAberto){ box.innerHTML = ""; return; }
  const base = todos();
  const bairros = [...new Set(base.map(i=>i.bairro).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const fases = [...new Set(base.map(i=>i.status).filter(Boolean))];
  // comodidades que existem de fato no catálogo publicado, das mais comuns pras menos
  const cont = {}; base.forEach(i=> (i.comodidades||[]).forEach(c=> cont[c] = (cont[c]||0) + 1));
  const coms = Object.entries(cont).sort((a,b)=> b[1]-a[1]).slice(0,14).map(([c])=>c);
  box.innerHTML = `
    <div class="imf-grid">
      <div><p class="imf-pop-tit">Vagas de garagem</p>${pills("vagas",[0,1,2,3])}</div>
      <div><p class="imf-pop-tit">Banheiros</p>${pills("banheiros",[0,1,2,3])}</div>
      <div><p class="imf-pop-tit">Área útil (m²)</p><div class="imf-faixa">
        <label><span>Mínima</span><input data-num="amin" inputmode="numeric" value="${F.amin??""}" placeholder="0"></label>
        <label><span>Máxima</span><input data-num="amax" inputmode="numeric" value="${F.amax??""}" placeholder="Sem limite"></label></div></div>
      <div><p class="imf-pop-tit">Bairro</p><select data-sel="bairro" aria-label="Bairro"><option value="">Todos os bairros</option>${bairros.map(b=>`<option ${F.bairro===b?"selected":""}>${esc(b)}</option>`).join("")}</select></div>
      ${fases.length>1 ? `<div><p class="imf-pop-tit">Fase</p><div class="imf-tags">${fases.map(f=>`<button type="button" class="${F.fases.includes(f)?"on":""}" data-fase="${f}">${STATUS_LABEL[f]||f}</button>`).join("")}</div></div>` : ""}
      <div><p class="imf-pop-tit">Outros</p><div class="imf-checks imf-checks-row">
        <label><input type="checkbox" data-bool="financiamento" ${F.financiamento?"checked":""}> Aceita financiamento</label>
        <label><input type="checkbox" data-bool="video" ${F.video?"checked":""}> Com vídeo ou tour</label>
        <label><input type="checkbox" data-bool="destaque" ${F.destaque?"checked":""}> Só destaques</label>
      </div></div>
      ${coms.length ? `<div class="imf-span"><p class="imf-pop-tit">Comodidades</p><div class="imf-tags">${coms.map(c=>`<button type="button" class="${F.comodidades.includes(c)?"on":""}" data-com="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>` : ""}
    </div>
    <div class="imf-mais-ft"><button type="button" class="link" data-limpar="mais">Limpar estes filtros</button><button type="button" class="btn" id="imfVer">Ver ${resultado().length} imóve${resultado().length===1?"l":"is"}</button></div>`;
}

// ------------------------------------------------------- chips e contagem
function renderChips(){
  const c = [];
  const add = (txt, k, v)=> c.push(`<button type="button" class="imf-chip" data-tira="${k}" ${v!=null?`data-v="${esc(v)}"`:""} aria-label="Remover filtro ${esc(txt)}">${esc(txt)}<span aria-hidden="true">×</span></button>`);
  if(F.q) add(`“${F.q}”`, "q");
  if(F.bairro) add(F.bairro, "bairro");
  F.tipos.forEach(t=> add(t, "tipos", t));
  if(F.quartos) add(F.quartos+"+ quartos", "quartos");
  if(F.pmin!=null || F.pmax!=null) add(faixaTexto(F.pmin, F.pmax), "preco");
  if(F.vagas) add(F.vagas+"+ vagas", "vagas");
  if(F.banheiros) add(F.banheiros+"+ banheiros", "banheiros");
  if(F.amin!=null || F.amax!=null) add(`${F.amin??0}–${F.amax??"∞"} m²`, "area");
  F.fases.forEach(f=> add(STATUS_LABEL[f]||f, "fases", f));
  F.comodidades.forEach(x=> add(x, "comodidades", x));
  if(F.financiamento) add("Aceita financiamento", "financiamento");
  if(F.video) add("Com vídeo/tour", "video");
  if(F.destaque) add("Destaques", "destaque");
  document.getElementById("imChips").innerHTML = c.length ? c.join("") + `<button type="button" class="link" data-limpar="tudo">Limpar tudo</button>` : "";
}
function titulo(qtd){
  const onde = F.bairro ? ` em ${F.bairro}` : F.q ? ` para “${F.q}”` : "";
  const modo = F.modo==="venda" ? " à venda" : F.modo==="locacao" ? " para alugar" : "";
  return `${qtd} imóve${qtd===1?"l":"is"}${modo}${onde}`;
}

// ------------------------------------------------------------- cards
function cardHtml(i){
  const capa = (i.fotos||[])[0];
  const specs = [];
  if(!SEM_COMODOS.has(i.tipo) && n(i.quartos)) specs.push([ICO.cama, `${n(i.quartos)} quarto${n(i.quartos)===1?"":"s"}`]);
  if(n(i.banheiros)) specs.push([ICO.banho, `${n(i.banheiros)} banh.`]);
  if(n(i.vagas)) specs.push([ICO.carro, `${n(i.vagas)} vaga${n(i.vagas)===1?"":"s"}`]);
  if(n(i.areaM2)) specs.push([ICO.area, `${n(i.areaM2)} m²`]);
  const etiqueta = i.destaque ? "Destaque" : (F.modo==="venda" ? "Venda" : F.modo==="locacao" ? "Locação" : (FIN_LABEL[i.finalidade]||"Venda"));
  let preco;
  if(i.ocultarPreco) preco = "Preço sob consulta";
  else if(F.modo==="locacao") preco = DB.formatBRL(precoLocacao(i)) + "/mês";
  else if(F.modo==="venda") preco = DB.formatBRL(precoVenda(i));
  else preco = DB.precoImovelTexto(i);
  return `
  <a class="prop-card" href="imovel.html?id=${encodeURIComponent(i.id)}">
    <div class="ph">
      <img ${capa?`data-midia="${esc(capa)}"`:""} src="${esc(capa ? MID.srcInicial(capa) : FOTO_PADRAO)}" alt="${esc(i.titulo)}" loading="lazy">
      <span class="tag${i.destaque?" destaque":""}">${etiqueta}</span>
      ${(i.fotos||[]).length>1 ? `<span class="nfotos">${i.fotos.length} fotos</span>` : ""}
    </div>
    <div class="bd">
      <div class="valor">${esc(preco)}</div>
      <h3>${esc(i.titulo)}</h3>
      <div class="loc">${esc(i.tipo)} · ${esc(i.bairro)}${i.cidade?", "+esc(i.cidade):""}</div>
      <div class="specs">${specs.map(([ic,t])=>`<span>${ic}${t}</span>`).join("")}</div>
      ${i.codigo ? `<div class="cod">${esc(i.codigo)}</div>` : ""}
    </div>
  </a>`;
}

// ------------------------------------------------------------- render
function renderLista(){
  const itens = resultado();
  const vis = itens.slice(0, pagina*POR_PAGINA);
  document.getElementById("imCount").textContent = titulo(itens.length);
  const grid = document.getElementById("propGrid");
  grid.innerHTML = vis.map(cardHtml).join("");
  MID.hidratar(grid);
  document.getElementById("propEmpty").style.display = itens.length ? "none" : "block";
  document.getElementById("imMaisWrap").hidden = vis.length >= itens.length;
  window.SoluaChrome.observeReveals();
}
function render(){
  renderModo(); renderBarra(); renderMais(); renderChips(); renderLista();
  document.getElementById("imOrdem").value = ordem;
  if(qInput.value!==F.q && document.activeElement!==qInput) qInput.value = F.q;
}
function aplicar(rolar){
  pagina = 1; gravarUrl(); render();
  if(rolar) document.getElementById("imResultados").scrollIntoView({behavior:"smooth", block:"start"});
}

// ------------------------------------------------------------ eventos
const barra = document.getElementById("imFiltros"), mais = document.getElementById("imMais");
barra.addEventListener("click", e=>{
  const t = e.target;
  const m2 = t.closest("[data-modo2]");
  if(m2){ if(m2.dataset.modo2!==F.modo){ F.pmin = null; F.pmax = null; } F.modo = m2.dataset.modo2; aplicar(false); return; }
  const pb = t.closest("[data-pop]");
  if(pb){ pop = pop===pb.dataset.pop ? null : pb.dataset.pop; renderBarra(); const foco = barra.querySelector(".imf-pop input, .imf-pop button"); if(foco && pop) foco.focus({preventScroll:true}); return; }
  if(t.closest("#imfMais")){ maisAberto = !maisAberto; pop = null; renderBarra(); renderMais(); return; }
  const fx = t.closest("[data-faixa]");
  if(fx){ const [a,b] = fx.dataset.faixa.split("|"); F.pmin = a ? Number(a) : null; F.pmax = b ? Number(b) : null; pop = null; aplicar(false); return; }
  const pl = t.closest("[data-pill]"); if(pl){ F[pl.dataset.pill] = Number(pl.dataset.v); pop = null; aplicar(false); }
});
barra.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.tipo!=null){ const v = t.dataset.tipo; F.tipos = t.checked ? [...F.tipos, v] : F.tipos.filter(x=>x!==v); pagina = 1; gravarUrl(); renderChips(); renderLista(); renderBarra(); const cb = barra.querySelector(`[data-tipo="${CSS.escape(v)}"]`); if(cb) cb.focus(); }
});
let tPreco;
// atualiza só o rótulo do botão "Preço" (redesenhar a barra tiraria o foco de quem está digitando)
function rotuloPreco(){
  const btn = barra.querySelector('[data-pop="preco"]'); if(!btn) return;
  const txt = faixaTexto(F.pmin, F.pmax);
  btn.classList.toggle("ativo", !!txt);
  let b = btn.querySelector("b");
  if(txt && !b){ b = document.createElement("b"); btn.insertBefore(b, btn.querySelector(".imf-chev")); }
  if(b){ if(txt) b.textContent = txt; else b.remove(); }
}
function lerMoeda(el){ const d = el.value.replace(/\D/g,""); const v = d ? Number(d) : null; el.value = v!=null ? v.toLocaleString("pt-BR") : ""; return v; }
barra.addEventListener("input", e=>{
  const t = e.target;
  if(t.dataset.money){ F[t.dataset.money] = lerMoeda(t); clearTimeout(tPreco); tPreco = setTimeout(()=>{ pagina = 1; gravarUrl(); renderChips(); renderLista(); rotuloPreco(); }, 300); }
});
mais.addEventListener("click", e=>{
  const t = e.target;
  const pl = t.closest("[data-pill]"); if(pl){ F[pl.dataset.pill] = Number(pl.dataset.v); aplicar(false); return; }
  const fa = t.closest("[data-fase]"); if(fa){ const v = fa.dataset.fase; F.fases = F.fases.includes(v) ? F.fases.filter(x=>x!==v) : [...F.fases, v]; aplicar(false); return; }
  const co = t.closest("[data-com]"); if(co){ const v = co.dataset.com; F.comodidades = F.comodidades.includes(v) ? F.comodidades.filter(x=>x!==v) : [...F.comodidades, v]; aplicar(false); return; }
  if(t.closest("#imfVer")){ maisAberto = false; render(); document.getElementById("imCount").scrollIntoView({behavior:"smooth", block:"center"}); }
});
mais.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.bool){ F[t.dataset.bool] = t.checked; aplicar(false); }
  if(t.dataset.sel){ F[t.dataset.sel] = t.value; aplicar(false); }
});
let tArea;
mais.addEventListener("input", e=>{
  const t = e.target;
  if(t.dataset.num){ const d = t.value.replace(/\D/g,""); t.value = d; F[t.dataset.num] = d ? Number(d) : null; clearTimeout(tArea); tArea = setTimeout(()=>{ pagina = 1; gravarUrl(); renderChips(); renderLista(); renderBarra(); const b = document.getElementById("imfVer"); if(b){ const q = resultado().length; b.textContent = `Ver ${q} imóve${q===1?"l":"is"}`; } }, 300); }
});
document.addEventListener("click", e=>{
  const t = e.target;
  const tira = t.closest("[data-tira]");
  if(tira){
    const k = tira.dataset.tira, v = tira.dataset.v;
    if(k==="preco"){ F.pmin = null; F.pmax = null; }
    else if(k==="area"){ F.amin = null; F.amax = null; }
    else if(Array.isArray(F[k])) F[k] = F[k].filter(x=>x!==v);
    else F[k] = JSON.parse(JSON.stringify(VAZIO[k]));
    if(k==="q") qInput.value = "";
    aplicar(false); return;
  }
  const lim = t.closest("[data-limpar]");
  if(lim){
    if(lim.dataset.limpar==="mais") Object.assign(F, {vagas:0, banheiros:0, amin:null, amax:null, fases:[], comodidades:[], financiamento:false, destaque:false, video:false, bairro:""});
    else { const modo = F.modo; F = JSON.parse(JSON.stringify(VAZIO)); F.modo = modo; qInput.value = ""; }
    aplicar(false); return;
  }
  if(pop && !t.closest(".imf-item")){ pop = null; renderBarra(); }
  if(!sug.hidden && !t.closest("#imBusca")) fecharSug();
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && pop){ const p = pop; pop = null; renderBarra(); const b = barra.querySelector(`[data-pop="${p}"]`); if(b) b.focus(); } });
document.getElementById("imOrdem").addEventListener("change", e=>{ ordem = e.target.value; aplicar(false); });
document.getElementById("imVerMais").addEventListener("click", ()=>{ pagina++; renderLista(); });
document.getElementById("imLimparVazio").addEventListener("click", ()=>{ F = JSON.parse(JSON.stringify(VAZIO)); qInput.value = ""; aplicar(false); });

const gapCard = document.getElementById("gapCard");
if(gapCard) gapCard.innerHTML = window.SoluaChrome.renderGapCard({
  align:"center", icone:"🔎", titulo:"Não achou?", texto:"Fale com um consultor — temos imóveis fora do site."
});

qInput.value = F.q;
render();
})();
