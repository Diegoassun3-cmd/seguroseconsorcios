/* Solua — página de detalhe de um imóvel: galeria, ficha técnica,
   descrição, formulário de interesse (grava lead produto=imovel) e
   imóveis parecidos. */
(function(){
"use strict";
const DB = window.SoluaDB;
const MID = window.SoluaMidia;
const STATUS_LABEL = {pronto:"Pronto",lancamento:"Lançamento",em_construcao:"Em construção",na_planta:"Na planta",reforma:"Precisa de reforma"};
const FIN_LABEL = {venda:"Venda", locacao:"Locação", venda_locacao:"Venda e locação"};
const FOTO_PADRAO = "https://picsum.photos/seed/solua-imovel-fallback/1200/800";
const id = new URLSearchParams(location.search).get("id");
const achado = id ? DB.getImovel(id) : null;
const imovel = achado && DB.estaPublicado(achado) ? achado : null;
const fotoAttr = ref => ref ? `data-midia="${DB.esc(ref)}"` : "";
const fotoSrc = ref => ref ? MID.srcInicial(ref) : FOTO_PADRAO;
const wrap = document.getElementById("propDetailWrap");
const body = document.getElementById("propDetailBody");

if(!imovel){
  document.getElementById("propRelatedWrap").style.display = "none";
  // comodidades em destaque viram "selos" logo abaixo do preço
function destaquesHtml(){
  const dest = (imovel.comodidadesDestaque||[]).filter(c=> (imovel.comodidades||[]).includes(c));
  if(!dest.length) return "";
  return `<div class="im-selos">${dest.map(c=>`<span>★ ${DB.esc(c)}</span>`).join("")}</div>`;
}
function comodidadesHtml(){
  const lista = imovel.comodidades||[];
  if(!lista.length) return "";
  return `<h3 class="im-sub">Comodidades</h3><ul class="im-comod">${lista.map(c=>`<li>${DB.esc(c)}</li>`).join("")}</ul>`;
}
function plantasHtml(){
  const pl = imovel.plantas||[];
  if(!pl.length) return "";
  return `<h3 class="im-sub">Plantas</h3><div class="im-plantas">${pl.map((p,i)=>`<figure>
    <img ${fotoAttr(p.ref)} src="${DB.esc(MID.srcInicial(p.ref))}" alt="${DB.esc(p.legenda || "Planta "+(i+1))}" loading="lazy">
    ${p.legenda?`<figcaption>${DB.esc(p.legenda)}</figcaption>`:""}</figure>`).join("")}</div>`;
}
function linkSeguro(u){ return /^https?:\/\//i.test(u||"") ? u : ""; }
function midiasExtrasHtml(){
  const v = linkSeguro(imovel.videoUrl), t = linkSeguro(imovel.tourUrl);
  if(!v && !t) return "";
  return `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px">
    ${v?`<a class="btn ghost" href="${DB.esc(v)}" target="_blank" rel="noopener">▶ Ver vídeo do imóvel</a>`:""}
    ${t?`<a class="btn ghost" href="${DB.esc(t)}" target="_blank" rel="noopener">Tour virtual 360°</a>`:""}
  </div>`;
}
function mapaHtml(){
  if(imovel.mostrarMapa===false) return "";
  const e = imovel.endereco||{};
  const rua = imovel.ocultarEndereco ? "" : [e.logradouro, e.numero].filter(Boolean).join(", ");
  const partes = [rua, imovel.bairro, imovel.cidade, e.estado].filter(Boolean);
  if(!partes.length) return "";
  const url = `https://maps.google.com/maps?q=${encodeURIComponent(partes.join(" - "))}&t=&z=${rua?16:14}&output=embed`;
  return `<h3 class="im-sub">Localização</h3>
    <div class="im-mapa"><iframe src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa — ${DB.esc(imovel.bairro||"localização")}"></iframe></div>
    ${rua?"":`<p style="font-size:13px;color:var(--tinta-45);margin-top:8px">Localização aproximada — o endereço exato é passado pelo consultor.</p>`}`;
}

body.innerHTML = `<div style="text-align:center;padding:60px 0">
    <h2 style="font-size:clamp(28px,4vw,44px);margin-bottom:14px">Imóvel não encontrado.</h2>
    <p style="color:var(--tinta-60);margin-bottom:26px">Ele pode ter sido vendido, alugado ou removido do catálogo.</p>
    <a class="btn lg" href="imoveis.html">Ver catálogo de imóveis</a>
  </div>`;
  window.SoluaChrome.observeReveals();
  return;
}

document.title = `${imovel.titulo} — Solua`;

// ---------------------------------------------------------- fotos
// Mosaico (1 grande + 2 empilhadas) → clicar abre a galeria completa
// (1 larga, 2 lado a lado, …) → clicar numa foto abre em tela cheia.
const FOTOS = (imovel.fotos||[]).length ? imovel.fotos.slice() : [""];
const temFotoReal = (imovel.fotos||[]).length > 0;
const esc = DB.esc;
const ICO_G = {
  galeria:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="M20 15.5l-4.5-4.5L6 20.5"/></svg>`,
  video:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3"/></svg>`,
  x:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  share:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/></svg>`
};
function urlVideo(){ return /^https?:\/\//i.test(imovel.videoUrl||"") ? imovel.videoUrl : ""; }
function embedVideo(u){
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if(yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if(vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return "";
}
function bgFoto(ref){ return `${ref?`data-midia="${esc(ref)}"`:""} style="background-image:url('${esc(fotoSrc(ref))}')"`; }

function breadcrumbHtml(){
  const itens = [["imoveis.html","Imóveis"]];
  if(imovel.cidade) itens.push([`imoveis.html?q=${encodeURIComponent(imovel.cidade)}`, imovel.cidade]);
  if(imovel.bairro) itens.push([`imoveis.html?bairro=${encodeURIComponent(imovel.bairro)}`, imovel.bairro]);
  if(imovel.tipo) itens.push([`imoveis.html?tipo=${encodeURIComponent(imovel.tipo)}${imovel.bairro?`&bairro=${encodeURIComponent(imovel.bairro)}`:""}`, imovel.tipo]);
  return `<nav class="pd-bread" aria-label="Você está em">${itens.map(([h,t])=>`<a href="${h}">${esc(t)}</a>`).join(`<span aria-hidden="true">›</span>`)}</nav>`;
}
function mosaicoHtml(){
  const n = FOTOS.length;
  const lado = n>=3 ? [1,2] : n===2 ? [1] : [];
  const video = urlVideo();
  return `<div class="pd-mosaico pd-n${Math.min(n,3)}">
    <div class="pd-m pd-m1" role="button" tabindex="0" data-abrir="0" aria-label="Abrir galeria de fotos" ${bgFoto(FOTOS[0])}>
      ${n>1 ? `<span class="pd-cont" id="pdCont">1 / ${n}</span>` : ""}
      ${video ? `<button type="button" class="pd-chip" data-video="1">Vídeo ${ICO_G.video}</button>` : ""}
      ${temFotoReal ? `<span class="pd-chip pd-chip-dir ${n>=3?"pd-so-cel":""}">Galeria${n>1?` (${n})`:""} ${ICO_G.galeria}</span>` : ""}
    </div>
    ${lado.map((ix,k)=>`<div class="pd-m pd-m${ix+1}" role="button" tabindex="0" data-abrir="${ix}" aria-label="Abrir foto ${ix+1} na galeria" ${bgFoto(FOTOS[ix])}>
      ${k===lado.length-1 ? `<span class="pd-chip">Galeria${n>3?` (${n})`:""} ${ICO_G.galeria}</span>` : ""}
    </div>`).join("")}
  </div>`;
}

function galeriaHtml(){
  const v = urlVideo(), emb = v ? embedVideo(v) : "";
  return `<div class="pd-gal-topo">
      <div><b>${esc(imovel.titulo)}</b><small>${FOTOS.length} foto${FOTOS.length===1?"":"s"}${imovel.codigo?` · ${esc(imovel.codigo)}`:""}</small></div>
      <button type="button" class="pd-gal-btn" id="pdShare">${ICO_G.share}<span>Compartilhar</span></button>
      <button type="button" class="pd-gal-btn pd-gal-x" id="pdFechar" aria-label="Fechar galeria">${ICO_G.x}</button>
    </div>
    <div class="pd-gal-grade">
      ${emb ? `<div class="pd-gal-video"><iframe src="${esc(emb)}" title="Vídeo do imóvel" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading="lazy"></iframe></div>`
        : v ? `<a class="pd-gal-video-link" href="${esc(v)}" target="_blank" rel="noopener">${ICO_G.video} Assistir ao vídeo do imóvel</a>` : ""}
      ${FOTOS.map((ref,i)=>`<button type="button" class="pd-gal-it ${i%3===0?"larga":""}" data-zoom="${i}" aria-label="Ver foto ${i+1} em tela cheia">
        <img ${ref?`data-midia="${esc(ref)}"`:""} src="${esc(fotoSrc(ref))}" alt="${esc(imovel.titulo)} — foto ${i+1}" loading="lazy"></button>`).join("")}
    </div>`;
}

let galEl = null, zoomEl = null, zoomIx = 0, focoAntes = null;
function abrirGaleria(ix, empilhar){
  if(!temFotoReal && !urlVideo()) return;
  focoAntes = document.activeElement;
  if(!galEl){
    galEl = document.createElement("div");
    galEl.className = "pd-gal"; galEl.id = "pdGaleria";
    galEl.setAttribute("role","dialog"); galEl.setAttribute("aria-modal","true"); galEl.setAttribute("aria-label","Galeria de fotos");
    galEl.innerHTML = galeriaHtml();
    document.body.appendChild(galEl);
    MID.hidratar(galEl);
    galEl.addEventListener("click", e=>{
      if(e.target.closest("#pdFechar")){ fecharGaleria(); return; }
      if(e.target.closest("#pdShare")){ compartilhar(); return; }
      const z = e.target.closest("[data-zoom]"); if(z) abrirZoom(+z.dataset.zoom);
    });
  }
  galEl.classList.add("on");
  document.documentElement.classList.add("pd-travado");
  if(empilhar!==false) history.pushState({pdGaleria:true}, "", "#galeria");
  const alvo = galEl.querySelector(`[data-zoom="${ix||0}"]`);
  requestAnimationFrame(()=>{
    if(ix && alvo) alvo.scrollIntoView({block:"center"}); else galEl.scrollTop = 0;
    galEl.querySelector("#pdFechar").focus({preventScroll:true});
  });
}
function fecharGaleria(viaHistorico){
  if(!galEl || !galEl.classList.contains("on")) return;
  fecharZoom(true);
  galEl.classList.remove("on");
  document.documentElement.classList.remove("pd-travado");
  const v = galEl.querySelector("iframe"); if(v) v.src = v.src;   // para o vídeo
  if(!viaHistorico && location.hash==="#galeria") history.back();
  if(focoAntes && focoAntes.focus) focoAntes.focus({preventScroll:true});
}
function abrirZoom(ix){
  if(!zoomEl){
    zoomEl = document.createElement("div");
    zoomEl.className = "pd-zoom"; zoomEl.setAttribute("role","dialog"); zoomEl.setAttribute("aria-modal","true"); zoomEl.setAttribute("aria-label","Foto em tela cheia");
    zoomEl.innerHTML = `<div class="pd-zoom-topo"><span id="pdZoomCont"></span><button type="button" class="pd-gal-btn pd-gal-x" id="pdZoomX" aria-label="Fechar foto">${ICO_G.x}</button></div>
      <div class="pd-zoom-palco" id="pdZoomPalco" tabindex="0"><img id="pdZoomImg" alt=""></div>`;
    document.body.appendChild(zoomEl);
    zoomEl.querySelector("#pdZoomX").onclick = ()=> fecharZoom();
    zoomEl.addEventListener("click", e=>{ if(e.target===zoomEl || e.target.id==="pdZoomPalco") fecharZoom(); });
    window.SoluaChrome.arrastar(zoomEl.querySelector("#pdZoomPalco"), {anterior:()=> mostrarZoom(zoomIx-1), proxima:()=> mostrarZoom(zoomIx+1)});
  }
  zoomEl.classList.add("on");
  mostrarZoom(ix);
  zoomEl.querySelector("#pdZoomPalco").focus({preventScroll:true});
}
function mostrarZoom(ix){
  zoomIx = (ix + FOTOS.length) % FOTOS.length;
  const img = zoomEl.querySelector("#pdZoomImg"), ref = FOTOS[zoomIx];
  img.alt = `${imovel.titulo} — foto ${zoomIx+1}`;
  img.src = fotoSrc(ref);
  if(ref && MID.ehRef(ref)) MID.url(ref).then(u=>{ if(u && FOTOS[zoomIx]===ref) img.src = u; });
  zoomEl.querySelector("#pdZoomCont").textContent = `${zoomIx+1} / ${FOTOS.length}`;
}
function fecharZoom(silencioso){
  if(!zoomEl || !zoomEl.classList.contains("on")) return;
  zoomEl.classList.remove("on");
  if(!silencioso && galEl){ const it = galEl.querySelector(`[data-zoom="${zoomIx}"]`); if(it){ it.scrollIntoView({block:"center"}); it.focus({preventScroll:true}); } }
}
function compartilhar(){
  const dados = {title: imovel.titulo, text: `${imovel.titulo} — ${DB.precoImovelTexto(imovel)}`, url: location.href.split("#")[0]};
  if(navigator.share) navigator.share(dados).catch(()=>{});
  else if(navigator.clipboard) navigator.clipboard.writeText(dados.url).then(()=>{
    const b = document.getElementById("pdShare"); const t = b.querySelector("span"); t.textContent = "Link copiado!"; setTimeout(()=> t.textContent = "Compartilhar", 1800);
  });
}

function ligarGaleria(){
  const mos = body.querySelector(".pd-mosaico");
  mos.addEventListener("click", e=>{
    if(e.target.closest("[data-video]")){
      e.stopPropagation();
      const v = urlVideo();
      if(embedVideo(v)) abrirGaleria(0); else window.open(v, "_blank", "noopener");
      return;
    }
    const t = e.target.closest("[data-abrir]");
    if(t) abrirGaleria(+t.dataset.abrir === 0 && celular() ? idxCel : +t.dataset.abrir);
  });
  mos.addEventListener("keydown", e=>{
    const t = e.target.closest(".pd-m[data-abrir]");
    if(t && (e.key==="Enter" || e.key===" ") && e.target===t){ e.preventDefault(); abrirGaleria(+t.dataset.abrir); }
  });
  // no celular a foto grande desliza por todas as fotos; tocar abre a galeria
  const m1 = mos.querySelector(".pd-m1");
  if(FOTOS.length>1) window.SoluaChrome.arrastar(m1, {anterior:()=> trocarCel(idxCel-1), proxima:()=> trocarCel(idxCel+1), ignorar:".pd-chip"});
}
const celular = ()=> matchMedia("(max-width: 760px)").matches;
let idxCel = 0;
function trocarCel(i){
  if(!celular()) return;
  idxCel = (i + FOTOS.length) % FOTOS.length;
  const m1 = body.querySelector(".pd-m1"), ref = FOTOS[idxCel];
  m1.style.backgroundImage = `url('${fotoSrc(ref)}')`;
  if(ref && MID.ehRef(ref)) MID.url(ref).then(u=>{ if(u && FOTOS[idxCel]===ref) m1.style.backgroundImage = `url('${u}')`; });
  const c = document.getElementById("pdCont"); if(c) c.textContent = `${idxCel+1} / ${FOTOS.length}`;
}
document.addEventListener("keydown", e=>{
  if(zoomEl && zoomEl.classList.contains("on")){
    if(e.key==="Escape"){ e.preventDefault(); fecharZoom(); }
    if(e.key==="ArrowRight" && e.target.id!=="pdZoomPalco") mostrarZoom(zoomIx+1);
    if(e.key==="ArrowLeft" && e.target.id!=="pdZoomPalco") mostrarZoom(zoomIx-1);
    return;
  }
  if(galEl && galEl.classList.contains("on") && e.key==="Escape"){ e.preventDefault(); fecharGaleria(); }
});
addEventListener("popstate", ()=>{
  if(location.hash==="#galeria") abrirGaleria(0, false);
  else fecharGaleria(true);
});

function fichaHtml(){
  const semComodos = ["Terreno","Sala comercial","Loja","Galpão","Rural"].includes(imovel.tipo);
  const sim = v => v ? "Sim" : "Não";
  const rows = [
    ["Código", imovel.codigo],
    ["Finalidade", FIN_LABEL[imovel.finalidade]||imovel.finalidade],
    ["Tipo", imovel.tipo],
    ["Área útil", imovel.areaM2 ? imovel.areaM2+" m²" : null],
    ["Área total", imovel.areaTotal ? imovel.areaTotal+" m²" : null],
    ["Terreno", imovel.areaTerreno ? imovel.areaTerreno+" m²" : null],
    ["Quartos", semComodos ? null : imovel.quartos],
    ["Suítes", semComodos ? null : imovel.suites],
    ["Banheiros", semComodos ? null : imovel.banheiros],
    ["Vagas", imovel.vagas],
    ["Condomínio", imovel.valorCondominio ? DB.formatBRL(imovel.valorCondominio)+"/mês" : null],
    ["IPTU", imovel.valorIptu ? DB.formatBRL(imovel.valorIptu)+"/ano" : null],
    ["Mobiliado", imovel.mobiliado && imovel.mobiliado!=="Não" ? imovel.mobiliado : null],
    ["Aceita financiamento", imovel.aceitaFinanciamento!=null && imovel.finalidade!=="locacao" ? sim(imovel.aceitaFinanciamento) : null],
    ["Aceita permuta", imovel.aceitaPermuta ? "Sim" : null],
    ["Status", STATUS_LABEL[imovel.status]||imovel.status],
    ["Bairro", imovel.bairro+", "+imovel.cidade]
  ].filter(([,v])=> v!=null && v!=="");
  return `<div class="prop-ficha">${rows.map(([k,v])=>`<div class="row"><span>${DB.esc(k)}</span><b>${DB.esc(String(v))}</b></div>`).join("")}</div>`;
}

function formHtml(){
  return `
  <div style="border:1px solid var(--linha);padding:24px;margin-top:20px">
    <h4 style="font-size:17px;margin-bottom:14px">Tenho interesse neste imóvel</h4>
    <div class="fields" id="propFormFields" style="grid-template-columns:1fr">
      <div class="f"><label>Nome completo *</label><input id="piNome" placeholder="Seu nome"></div>
      <div class="f"><label>WhatsApp *</label><input id="piFone" placeholder="(19) 90000-0000" inputmode="tel"></div>
      <div class="f"><label>E-mail</label><input id="piEmail" type="email" placeholder="voce@email.com"></div>
      <div class="f"><label>Mensagem (opcional)</label><textarea id="piMsg" rows="3" placeholder="Quero agendar uma visita, por exemplo."></textarea></div>
    </div>
    <button class="btn block" id="piSend" style="margin-top:16px">Quero visitar / saber mais</button>
    <p id="piOk" style="display:none;color:var(--azul);font-size:13.5px;margin-top:12px">Recebemos seu interesse! Um consultor entra em contato em até 1 dia útil. <a id="piWpp" target="_blank" rel="noopener" style="color:var(--azul);text-decoration:underline">Ou fale agora no WhatsApp.</a></p>
  </div>`;
}

// comodidades em destaque viram "selos" logo abaixo do preço
function destaquesHtml(){
  const dest = (imovel.comodidadesDestaque||[]).filter(c=> (imovel.comodidades||[]).includes(c));
  if(!dest.length) return "";
  return `<div class="im-selos">${dest.map(c=>`<span>★ ${DB.esc(c)}</span>`).join("")}</div>`;
}
function comodidadesHtml(){
  const lista = imovel.comodidades||[];
  if(!lista.length) return "";
  return `<h3 class="im-sub">Comodidades</h3><ul class="im-comod">${lista.map(c=>`<li>${DB.esc(c)}</li>`).join("")}</ul>`;
}
function plantasHtml(){
  const pl = imovel.plantas||[];
  if(!pl.length) return "";
  return `<h3 class="im-sub">Plantas</h3><div class="im-plantas">${pl.map((p,i)=>`<figure>
    <img ${fotoAttr(p.ref)} src="${DB.esc(MID.srcInicial(p.ref))}" alt="${DB.esc(p.legenda || "Planta "+(i+1))}" loading="lazy">
    ${p.legenda?`<figcaption>${DB.esc(p.legenda)}</figcaption>`:""}</figure>`).join("")}</div>`;
}
function linkSeguro(u){ return /^https?:\/\//i.test(u||"") ? u : ""; }
function midiasExtrasHtml(){
  const v = linkSeguro(imovel.videoUrl), t = linkSeguro(imovel.tourUrl);
  if(!v && !t) return "";
  return `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px">
    ${v?`<a class="btn ghost" href="${DB.esc(v)}" target="_blank" rel="noopener">▶ Ver vídeo do imóvel</a>`:""}
    ${t?`<a class="btn ghost" href="${DB.esc(t)}" target="_blank" rel="noopener">Tour virtual 360°</a>`:""}
  </div>`;
}
function mapaHtml(){
  if(imovel.mostrarMapa===false) return "";
  const e = imovel.endereco||{};
  const rua = imovel.ocultarEndereco ? "" : [e.logradouro, e.numero].filter(Boolean).join(", ");
  const partes = [rua, imovel.bairro, imovel.cidade, e.estado].filter(Boolean);
  if(!partes.length) return "";
  const url = `https://maps.google.com/maps?q=${encodeURIComponent(partes.join(" - "))}&t=&z=${rua?16:14}&output=embed`;
  return `<h3 class="im-sub">Localização</h3>
    <div class="im-mapa"><iframe src="${url}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa — ${DB.esc(imovel.bairro||"localização")}"></iframe></div>
    ${rua?"":`<p style="font-size:13px;color:var(--tinta-45);margin-top:8px">Localização aproximada — o endereço exato é passado pelo consultor.</p>`}`;
}

body.innerHTML = `
  ${breadcrumbHtml()}
  ${mosaicoHtml()}
  <div class="prop-detail-grid">
    <div>
      <span class="num">${DB.esc(imovel.tipo)}${imovel.codigo?` · ${DB.esc(imovel.codigo)}`:""}</span>
      <h1 style="font-size:clamp(30px,4.4vw,50px);letter-spacing:-.03em;margin:10px 0 6px">${DB.esc(imovel.titulo)}</h1>
      <p style="color:var(--tinta-60);margin-bottom:22px">${DB.esc(imovel.bairro)}, ${DB.esc(imovel.cidade)}</p>
      <div style="font-family:var(--font-display);font-size:32px;color:var(--azul);margin-bottom:26px">${DB.esc(DB.precoImovelTexto(imovel))}</div>
      ${destaquesHtml()}
      <p style="font-size:15.5px;line-height:1.7;color:var(--tinta-60);white-space:pre-line">${DB.esc(imovel.descricao||"")}</p>
      ${midiasExtrasHtml()}
      ${comodidadesHtml()}
      ${plantasHtml()}
      ${mapaHtml()}
    </div>
    <div>
      ${fichaHtml()}
      ${formHtml()}
    </div>
  </div>`;

ligarGaleria();
MID.hidratar(body);
if(location.hash==="#galeria") history.replaceState(null, "", location.pathname + location.search);

document.getElementById("piFone").oninput = e=>{ let v=e.target.value.replace(/\D/g,"").slice(0,11);
  e.target.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v; };

document.getElementById("piSend").onclick = ()=>{
  const nome = document.getElementById("piNome").value.trim();
  const fone = document.getElementById("piFone").value.trim();
  const email = document.getElementById("piEmail").value.trim();
  const msg = document.getElementById("piMsg").value.trim();
  if(nome.length<2){ document.getElementById("piNome").focus(); return; }
  if(fone.replace(/\D/g,"").length<10){ document.getElementById("piFone").focus(); return; }
  const btn = document.getElementById("piSend"); btn.textContent="Enviando…"; btn.disabled=true;
  DB.addLead({
    nome, email, telefone: fone, produto:"imovel", tipo: imovel.tipo, origem:"Site", estagio:"novo", imovelId: imovel.id,
    notas:[{id:DB.uid("nota"), data:new Date().toISOString(), autor:"Sistema",
      texto:`Interesse no imóvel "${imovel.titulo}" (${imovel.id}).${msg?" Mensagem: "+msg:""}`}]
  });
  document.getElementById("piWpp").href = window.SoluaSite.wppLink(`Olá! Tenho interesse no imóvel "${imovel.titulo}" (${location.href}).`);
  document.getElementById("propFormFields").style.display = "none";
  btn.style.display = "none";
  document.getElementById("piOk").style.display = "block";
};

/* RELACIONADOS */
const publicados = DB.getImoveisPublicados().filter(i=>i.id!==imovel.id);
const relacionados = publicados.filter(i=> i.tipo===imovel.tipo).slice(0,3);
const relFallback = relacionados.length ? relacionados : publicados.slice(0,3);
document.getElementById("propRelated").innerHTML = relFallback.map(i=>`
  <a class="prop-card" href="imovel.html?id=${i.id}">
    <div class="ph"><img ${fotoAttr((i.fotos||[])[0])} src="${DB.esc(fotoSrc((i.fotos||[])[0]))}" alt="${DB.esc(i.titulo)}" loading="lazy"></div>
    <div class="bd">
      <div class="valor">${DB.esc(DB.precoImovelTexto(i))}</div>
      <h3>${DB.esc(i.titulo)}</h3>
      <div class="loc">${DB.esc(i.bairro)}, ${DB.esc(i.cidade)}</div>
    </div>
  </a>`).join("");
MID.hidratar(document.getElementById("propRelated"));

window.SoluaChrome.observeReveals();
})();
