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

function galleryHtml(){
  const fotos = (imovel.fotos||[]).length ? imovel.fotos : [""];
  return `
  <div class="prop-gallery">
    <div class="pg-main" id="pgMain">
      ${fotos.map((f,i)=>`<div class="pg-slide${i===0?" on":""}" ${fotoAttr(f)} style="background-image:url('${DB.esc(fotoSrc(f))}')" role="img" aria-label="${DB.esc(imovel.titulo)} — foto ${i+1}"></div>`).join("")}
    </div>
    ${fotos.length>1 ? `<div class="pg-dots" id="pgDots">${fotos.map((_,i)=>`<button type="button" class="${i===0?"on":""}" data-i="${i}" aria-label="Foto ${i+1}"></button>`).join("")}</div>` : ""}
  </div>`;
}

function ligarGaleria(){
  const main = document.getElementById("pgMain");
  const slides = main.querySelectorAll(".pg-slide");
  const dots = document.querySelectorAll("#pgDots button");
  if(slides.length<2) return;
  let idx = 0, auto = null, pausado = false;
  function ir(i){
    idx = (i + slides.length) % slides.length;
    slides.forEach((s,j)=> s.classList.toggle("on", j===idx));
    dots.forEach((d,j)=>{ d.classList.toggle("on", j===idx); d.setAttribute("aria-current", j===idx ? "true" : "false"); });
  }
  function reiniciar(){ clearInterval(auto); if(!pausado) auto = setInterval(()=> ir(idx+1), 6000); }
  dots.forEach(d=> d.onclick = ()=>{ ir(+d.dataset.i); reiniciar(); });
  // sem setas: arrastar/deslizar (ou setas do teclado) troca a foto
  main.classList.add("arrastavel");
  main.setAttribute("aria-roledescription","carrossel");
  main.setAttribute("aria-label", `Fotos do imóvel (${slides.length}) — arraste ou use as setas do teclado`);
  window.SoluaChrome.arrastar(main, {anterior:()=>{ ir(idx-1); reiniciar(); }, proxima:()=>{ ir(idx+1); reiniciar(); }});
  main.addEventListener("mouseenter", ()=>{ pausado = true; clearInterval(auto); });
  main.addEventListener("mouseleave", ()=>{ pausado = false; reiniciar(); });
  reiniciar();
}

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
  <div class="lbl" style="margin-bottom:16px"><a href="imoveis.html" style="color:var(--tinta-35)">← Voltar ao catálogo</a></div>
  ${galleryHtml()}
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
