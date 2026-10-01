/* ===========================================================
   Solua — simulador de cotação reutilizável (Seguros e Consórcios).
   Cada página de produto chama SoluaQuote.mount("id-do-container","seguro"|"consorcio").
   O ramo já vem fixo pela página, então o fluxo tem 3 passos:
   tipo + detalhes → seus dados → confirmação e envio.
   Grava o lead pela mesma base do CRM (SoluaDB.addLead).
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;

const CAMPOS = {
 "Auto":[["marca","Marca e modelo","text"],["ano","Ano do veículo","text"],["cep","CEP de pernoite","text"],["atual","Tem seguro hoje?","sel:Sim|Não"]],
 "Residencial":[["tipoim","Tipo de imóvel","sel:Casa|Apartamento|Chácara / Sítio"],["valorim","Valor aproximado do imóvel","money"],["situacao","Situação","sel:Próprio|Alugado|Em construção"]],
 "Vida":[["nasc","Data de nascimento","date"],["capital","Capital desejado (aprox.)","money"],["prof","Profissão","text"]],
 "Empresarial":[["ramoemp","Ramo de atividade","text"],["func","Nº de funcionários","text"],["fat","Faturamento anual (aprox.)","money"]],
 "Saúde / Odonto":[["vidas","Quantas vidas","text"],["perfil","Perfil","sel:Individual|Familiar|Empresarial (PME)"],["idades","Idades","text"]],
 "Viagem":[["destino","Destino","text"],["dias","Período (dias)","text"],["pax","Nº de viajantes","text"]],
 "Garantia locatícia":[["papel","Você é","sel:Locatário|Proprietário|Imobiliária"],["aluguel","Valor do aluguel","money"]],
 "Condomínio":[["unid","Nº de unidades","text"],["end","Endereço do condomínio","text"]],
 "Outro":[["descr","Descreva o que precisa","text"]],
 "Imóvel":[["carta","Valor da carta de crédito","money"],["prazo","Prazo desejado","sel:Até 100 meses|100 a 150 meses|150 a 200 meses|Acima de 200 meses"],["lance","Tem recurso para lance?","sel:Sim|Não|Talvez"],["fgts","Pretende usar FGTS?","sel:Sim|Não|Não sei"]],
 "Automóvel":[["carta","Valor da carta de crédito","money"],["prazo","Prazo desejado","sel:Até 60 meses|60 a 80 meses|Acima de 80 meses"],["lance","Tem recurso para lance?","sel:Sim|Não|Talvez"]],
 "Pesados / Máquinas":[["carta","Valor da carta de crédito","money"],["bem","Que bem pretende adquirir","text"],["pj","Pessoa física ou jurídica","sel:Física|Jurídica"]],
 "Serviços":[["carta","Valor desejado","money"],["obj","Objetivo","text"]]
};

function shellHtml(ramo){
  const seg = ramo==="seguro";
  return `
  <div class="qf">
    <ol class="qf-etapas" id="qProg" aria-label="Etapas">
      <li data-s="1"><i>01</i> ${seg?"Seu seguro":"Seu consórcio"}</li>
      <li data-s="2"><i>02</i> Seus dados</li>
      <li data-s="3"><i>03</i> Envio</li>
    </ol>
    <div class="qf-barra"><span id="qBarra"></span></div>
    <div class="stepv on" data-step="1">
      <h3>${seg?"Que seguro você quer cotar?":"Qual consórcio te interessa?"}</h3>
      <div class="qf-tipos" id="qTipos" role="radiogroup"></div>
      <div class="qf-campos" id="qDet"></div>
      <div class="qf-nav"><span></span><button type="button" class="btn lg" id="qN1">Continuar</button></div>
    </div>
    <div class="stepv" data-step="2">
      <h3>Como falamos com você?</h3>
      <div class="qf-campos">
        <div class="f full"><label for="qNome">Nome completo</label><input id="qNome" placeholder="Seu nome" autocomplete="name"></div>
        <div class="f"><label for="qFone">WhatsApp</label><input id="qFone" placeholder="(19) 90000-0000" inputmode="tel" autocomplete="tel"></div>
        <div class="f"><label for="qEmail">E-mail</label><input id="qEmail" type="email" placeholder="voce@email.com" autocomplete="email"></div>
        <div class="f full"><label for="qCidade">Cidade</label><input id="qCidade" placeholder="Campinas" autocomplete="address-level2"></div>
        <div class="f full"><label for="qObs">Quer adiantar algo? <em>(opcional)</em></label><textarea id="qObs" rows="1" placeholder="Conte o que for útil."></textarea></div>
      </div>
      <div class="qf-nav"><button type="button" class="qf-voltar" data-qback>← Voltar</button><button type="button" class="btn lg" id="qN2">Continuar</button></div>
    </div>
    <div class="stepv" data-step="3">
      <h3>Confira e envie</h3>
      <dl class="qf-resumo" id="qResumo"></dl>
      <label class="qf-lgpd"><input type="checkbox" id="qLgpd"><span>Autorizo a Solua a entrar em contato e tratar meus dados para a ${seg?"cotação":"simulação"}, conforme a LGPD.</span></label>
      <div class="qf-nav"><button type="button" class="qf-voltar" data-qback>← Voltar</button><button type="button" class="btn lg" id="qSend">Enviar ${seg?"cotação":"simulação"}</button></div>
    </div>
    <div class="done-v qf-ok" id="qDone">
      <div class="ok"></div>
      <h3>Recebemos sua solicitação.</h3>
      <p>Um consultor Solua retorna em até 1 dia útil. Se preferir adiantar, chame no WhatsApp.</p>
      <a class="btn lg" id="qWppLink" target="_blank" rel="noopener">Falar no WhatsApp agora</a>
    </div>
  </div>`;
}

function moeda(v){
  const d = String(v).replace(/\D/g,"").replace(/^0+/,"").slice(0,12);
  return d ? "R$ " + d.replace(/\B(?=(\d{3})+(?!\d))/g,".") : "";
}

function mount(containerId, ramo){
  const root = document.getElementById(containerId);
  if(!root) return;
  root.innerHTML = shellHtml(ramo);
  const $ = s=> root.querySelector(s);
  const $$ = s=> [...root.querySelectorAll(s)];
  const D = {tipo:"", det:{}};
  const tipos = DB.TIPOS[ramo];
  let step = 1;

  function setStep(n, rolar=true){
    step = n;
    $$(".stepv").forEach(v=> v.classList.toggle("on", +v.dataset.step===n));
    $$("#qProg li").forEach(d=>{ const s=+d.dataset.s; d.classList.toggle("on", s===n); d.classList.toggle("done", s<n); });
    $("#qBarra").style.width = (n/3*100) + "%";
    if(rolar) root.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function buildTipos(){
    $("#qTipos").innerHTML = tipos.map(t=>`<button type="button" class="qf-tipo" role="radio" aria-checked="false" data-tipo="${t}">${t}</button>`).join("");
    $$("[data-tipo]").forEach(b=> b.onclick = ()=> escolher(b.dataset.tipo));
  }
  function escolher(t){
    if(!tipos.includes(t)) return;
    $$("[data-tipo]").forEach(x=>{ const on = x.dataset.tipo===t; x.classList.toggle("sel", on); x.setAttribute("aria-checked", on); });
    if(D.tipo!==t){ D.tipo = t; buildDet(); }
  }
  function buildDet(){
    const f = CAMPOS[D.tipo]||[];
    $("#qDet").innerHTML = f.map(c=>{
      const id = "q_" + c[0];
      if(c[2].startsWith("sel:")) return `<div class="f"><label for="${id}">${c[1]}</label><select id="${id}" data-k="${c[0]}"><option value="">Selecione</option>${c[2].slice(4).split("|").map(o=>`<option>${o}</option>`).join("")}</select></div>`;
      if(c[2]==="money") return `<div class="f"><label for="${id}">${c[1]}</label><input id="${id}" data-k="${c[0]}" data-moeda inputmode="numeric" placeholder="R$ 0"></div>`;
      return `<div class="f"><label for="${id}">${c[1]}</label><input id="${id}" data-k="${c[0]}" type="${c[2]}"></div>`;
    }).join("");
    $$("[data-moeda]").forEach(i=> i.oninput = ()=>{ i.value = moeda(i.value); });
  }
  buildTipos();
  setStep(1, false);

  // "Simular" num card da página: já escolhe o tipo e leva ao simulador
  document.addEventListener("solua:simular", e=>{
    if($("#qDone").classList.contains("on")) return;
    escolher(e.detail);
    setStep(1, false);
    document.getElementById("simulador").scrollIntoView({behavior:"smooth", block:"start"});
  });
  $("#qObs").addEventListener("input", e=>{ e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; });

  $("#qN1").onclick = ()=>{
    if(!D.tipo){ $("#qTipos").animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],260); return; }
    D.det = {};
    $$("#qDet [data-k]").forEach(i=>{ if(i.value) D.det[i.previousElementSibling.textContent]=i.value; });
    setStep(2);
  };
  $$("[data-qback]").forEach(b=> b.onclick = ()=> setStep(step-1));

  $("#qFone").oninput = e=>{ let v=e.target.value.replace(/\D/g,"").slice(0,11);
   e.target.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v; };

  function val(){ let ok=true;
    [["#qNome",v=>v.trim().length>2],["#qFone",v=>v.replace(/\D/g,"").length>=10],["#qEmail",v=>/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)]].forEach(([s,fn])=>{
      const el=$(s), p=el.parentElement, good=fn(el.value); p.classList.toggle("err", !good); if(!good) ok=false;
    });
    return ok;
  }
  $("#qN2").onclick = ()=>{
    if(!val()) return;
    const esc = DB.esc;
    const linhas = [["Interesse", (ramo==="seguro"?"Seguro ":"Consórcio ") + D.tipo], ...Object.entries(D.det),
      ["Nome", $("#qNome").value], ["WhatsApp", $("#qFone").value], ["E-mail", $("#qEmail").value]];
    if($("#qCidade").value) linhas.push(["Cidade", $("#qCidade").value]);
    $("#qResumo").innerHTML = linhas.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    setStep(3);
  };

  $("#qSend").onclick = ()=>{
    if(!$("#qLgpd").checked){ $(".qf-lgpd").animate([{opacity:.3},{opacity:1}],400); return; }
    const btn=$("#qSend"); btn.textContent="Enviando…"; btn.style.pointerEvents="none";

    const detalhesTxt = Object.entries(D.det).map(([k,v])=>`${k}: ${v}`).join(" | ");
    DB.addLead({
      nome: $("#qNome").value.trim(), email: $("#qEmail").value.trim(),
      telefone: $("#qFone").value.trim(), cidade: $("#qCidade").value.trim(),
      produto: ramo, tipo: D.tipo, origem:"Site", estagio:"novo",
      notas: [{id:"nota_"+Date.now(), data:new Date().toISOString(), autor:"Sistema",
        texto:`Lead recebido pelo simulador do site.${detalhesTxt?" Detalhes: "+detalhesTxt:""}${$("#qObs").value.trim()?" Observação do cliente: "+$("#qObs").value.trim():""}`}]
    });

    const linhas = [
      `Olá! Solicitei uma ${ramo==="seguro"?"cotação":"simulação"} pelo site.`, "",
      `Interesse: ${ramo==="seguro"?"Seguro":"Consórcio"} — ${D.tipo}`,
      `Nome: ${$("#qNome").value}`,
      ...Object.entries(D.det).map(([k,v])=>`${k}: ${v}`)
    ].join("\n");
    $("#qWppLink").href = window.SoluaSite.wppLink(linhas);
    $$(".stepv").forEach(v=>v.classList.remove("on"));
    $("#qDone").classList.add("on");
    $$("#qProg li").forEach(d=>{ d.classList.remove("on"); d.classList.add("done"); });
    $("#qBarra").style.width = "100%";
    root.scrollIntoView({behavior:"smooth", block:"center"});
  };
}

window.SoluaQuote = { mount };
})();
