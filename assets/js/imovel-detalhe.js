/* Solua — página de detalhe de um imóvel: galeria, ficha técnica,
   descrição, formulário de interesse (grava lead produto=imovel) e
   imóveis parecidos. */
(function(){
"use strict";
const DB = window.SoluaDB;
const STATUS_LABEL = {pronto:"Pronto",lancamento:"Lançamento",em_construcao:"Em construção"};
const id = new URLSearchParams(location.search).get("id");
const imovel = id ? DB.getImovel(id) : null;
const wrap = document.getElementById("propDetailWrap");
const body = document.getElementById("propDetailBody");

if(!imovel){
  document.getElementById("propRelatedWrap").style.display = "none";
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
  const fotos = imovel.fotos.length ? imovel.fotos : ["https://picsum.photos/seed/solua-imovel-fallback/1200/800"];
  const thumbs = fotos.slice(1,4);
  return `
  <div class="prop-gallery">
    <div class="main"><img src="${fotos[0]}" alt="${DB.esc(imovel.titulo)}"></div>
    ${thumbs.map(f=>`<div class="thumb" style="overflow:hidden;border-radius:2px"><img src="${f}" alt="${DB.esc(imovel.titulo)}" style="width:100%;height:100%;object-fit:cover"></div>`).join("")}
  </div>`;
}

function fichaHtml(){
  const rows = [
    ["Finalidade", imovel.finalidade==="locacao"?"Locação":"Venda"],
    ["Tipo", imovel.tipo],
    ["Área", imovel.areaM2+" m²"],
    ["Quartos", imovel.quartos],
    ["Suítes", imovel.suites],
    ["Vagas", imovel.vagas],
    ["Status", STATUS_LABEL[imovel.status]||imovel.status],
    ["Bairro", imovel.bairro+", "+imovel.cidade]
  ];
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

body.innerHTML = `
  <div class="lbl" style="margin-bottom:16px"><a href="imoveis.html" style="color:var(--tinta-35)">← Voltar ao catálogo</a></div>
  ${galleryHtml()}
  <div class="prop-detail-grid">
    <div>
      <span class="num">${imovel.tipo}</span>
      <h1 style="font-size:clamp(30px,4.4vw,50px);letter-spacing:-.03em;margin:10px 0 6px">${DB.esc(imovel.titulo)}</h1>
      <p style="color:var(--tinta-60);margin-bottom:22px">${DB.esc(imovel.bairro)}, ${DB.esc(imovel.cidade)}</p>
      <div style="font-family:var(--font-display);font-size:32px;color:var(--azul);margin-bottom:26px">${imovel.finalidade==="locacao"?DB.formatBRL(imovel.valor)+"/mês":DB.formatBRL(imovel.valor)}</div>
      <p style="font-size:15.5px;line-height:1.7;color:var(--tinta-60)">${DB.esc(imovel.descricao)}</p>
    </div>
    <div>
      ${fichaHtml()}
      ${formHtml()}
    </div>
  </div>`;

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
    nome, email, telefone: fone, produto:"imovel", tipo: imovel.tipo, origem:"Site", estagio:"novo",
    notas:[{id:DB.uid("nota"), data:new Date().toISOString(), autor:"Sistema",
      texto:`Interesse no imóvel "${imovel.titulo}" (${imovel.id}).${msg?" Mensagem: "+msg:""}`}]
  });
  document.getElementById("piWpp").href = window.SoluaSite.wppLink(`Olá! Tenho interesse no imóvel "${imovel.titulo}" (${location.href}).`);
  document.getElementById("propFormFields").style.display = "none";
  btn.style.display = "none";
  document.getElementById("piOk").style.display = "block";
};

/* RELACIONADOS */
const relacionados = DB.getImoveis().filter(i=>i.id!==imovel.id && i.tipo===imovel.tipo).slice(0,3);
const relFallback = relacionados.length ? relacionados : DB.getImoveis().filter(i=>i.id!==imovel.id).slice(0,3);
document.getElementById("propRelated").innerHTML = relFallback.map(i=>`
  <a class="prop-card" href="imovel.html?id=${i.id}">
    <div class="ph"><img src="${i.fotos[0]}" alt="${DB.esc(i.titulo)}" loading="lazy"></div>
    <div class="bd">
      <div class="valor">${i.finalidade==="locacao"?DB.formatBRL(i.valor)+"/mês":DB.formatBRL(i.valor)}</div>
      <h3>${DB.esc(i.titulo)}</h3>
      <div class="loc">${DB.esc(i.bairro)}, ${DB.esc(i.cidade)}</div>
    </div>
  </a>`).join("");

window.SoluaChrome.observeReveals();
})();
