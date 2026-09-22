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
 "Residencial":[["tipoim","Tipo de imóvel","sel:Casa|Apartamento|Chácara / Sítio"],["valorim","Valor aproximado do imóvel","text"],["situacao","Situação","sel:Próprio|Alugado|Em construção"]],
 "Vida":[["nasc","Data de nascimento","date"],["capital","Capital desejado (aprox.)","text"],["prof","Profissão","text"]],
 "Empresarial":[["ramoemp","Ramo de atividade","text"],["func","Nº de funcionários","text"],["fat","Faturamento anual (aprox.)","text"]],
 "Saúde / Odonto":[["vidas","Quantas vidas","text"],["perfil","Perfil","sel:Individual|Familiar|Empresarial (PME)"],["idades","Idades","text"]],
 "Viagem":[["destino","Destino","text"],["dias","Período (dias)","text"],["pax","Nº de viajantes","text"]],
 "Garantia locatícia":[["papel","Você é","sel:Locatário|Proprietário|Imobiliária"],["aluguel","Valor do aluguel","text"]],
 "Condomínio":[["unid","Nº de unidades","text"],["end","Endereço do condomínio","text"]],
 "Outro":[["descr","Descreva o que precisa","text"]],
 "Imóvel":[["carta","Valor da carta de crédito","text"],["prazo","Prazo desejado","sel:Até 100 meses|100 a 150 meses|150 a 200 meses|Acima de 200 meses"],["lance","Tem recurso para lance?","sel:Sim|Não|Talvez"],["fgts","Pretende usar FGTS?","sel:Sim|Não|Não sei"]],
 "Automóvel":[["carta","Valor da carta de crédito","text"],["prazo","Prazo desejado","sel:Até 60 meses|60 a 80 meses|Acima de 80 meses"],["lance","Tem recurso para lance?","sel:Sim|Não|Talvez"]],
 "Pesados / Máquinas":[["carta","Valor da carta de crédito","text"],["bem","Que bem pretende adquirir","text"],["pj","Pessoa física ou jurídica","sel:Física|Jurídica"]],
 "Serviços":[["carta","Valor desejado","text"],["obj","Objetivo","text"]]
};

function shellHtml(ramo){
  const seg = ramo==="seguro";
  return `
  <div class="form-shell">
    <aside class="form-aside">
      <div>
        <div class="prog" id="qProg">
          <div data-s="1"><i>01</i> ${seg?"Seu seguro":"Seu consórcio"}</div>
          <div data-s="2"><i>02</i> Seus dados</div>
          <div data-s="3"><i>03</i> Envio</div>
        </div>
      </div>
      <p style="font-size:12.5px;color:var(--tinta-35);line-height:1.5">Seus dados são usados apenas para elaborar a ${seg?"cotação":"simulação"} e o contato comercial. Nunca vendemos ou compartilhamos suas informações.</p>
    </aside>
    <div class="form-main">
      <div class="stepv on" data-step="1">
        <h3>${seg?"Que seguro você quer cotar?":"Qual consórcio te interessa?"}</h3>
        <p class="sub">${seg?"Escolha o tipo e complete os detalhes — quanto mais preciso, melhor a cotação.":"Escolha a categoria e informe o valor pretendido."}</p>
        <div class="opts tri" id="qTipos"></div>
        <div class="fields" id="qDet" style="margin-top:30px"></div>
        <div class="form-nav"><span></span><button class="btn" id="qN1">Continuar</button></div>
      </div>
      <div class="stepv" data-step="2">
        <h3>Como falamos com você?</h3>
        <p class="sub">Só usamos esses dados para enviar sua ${seg?"cotação":"simulação"}.</p>
        <div class="fields">
          <div class="f full"><label>Nome completo *</label><input id="qNome" placeholder="Seu nome"></div>
          <div class="f"><label>WhatsApp *</label><input id="qFone" placeholder="(19) 90000-0000" inputmode="tel"></div>
          <div class="f"><label>E-mail *</label><input id="qEmail" type="email" placeholder="voce@email.com"></div>
          <div class="f"><label>Cidade</label><input id="qCidade" placeholder="Campinas"></div>
          <div class="f full"><label>Quer adiantar algo? (opcional)</label><textarea id="qObs" placeholder="Conte o que for útil."></textarea></div>
        </div>
        <div class="form-nav"><button class="back" data-qback>← Voltar</button><button class="btn" id="qN2">Continuar</button></div>
      </div>
      <div class="stepv" data-step="3">
        <h3>Confirme e envie</h3>
        <p class="sub">Revise o resumo abaixo. Se estiver certo, é só enviar.</p>
        <div id="qResumo" style="border:1px solid var(--linha);padding:22px;font-size:14.5px;line-height:1.9;background:var(--papel)"></div>
        <label class="consent"><input type="checkbox" id="qLgpd"><span>Autorizo a Solua a entrar em contato pelos canais informados e tratar meus dados para elaboração da ${seg?"cotação":"simulação"}, conforme a Lei Geral de Proteção de Dados (LGPD).</span></label>
        <div class="form-nav"><button class="back" data-qback>← Voltar</button><button class="btn lg" id="qSend">Enviar ${seg?"cotação":"simulação"}</button></div>
      </div>
      <div class="done-v" id="qDone">
        <div class="ok"></div>
        <h3>Recebemos sua solicitação.</h3>
        <p>Um consultor Solua vai analisar e retornar em até 1 dia útil. Se preferir adiantar, chame no WhatsApp.</p>
        <a class="btn lg" id="qWppLink" target="_blank" rel="noopener">Falar no WhatsApp agora</a>
      </div>
    </div>
  </div>`;
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

  function setStep(n){
    step = n;
    $$(".stepv").forEach(v=> v.classList.toggle("on", +v.dataset.step===n));
    $$("#qProg div").forEach(d=>{ const s=+d.dataset.s; d.classList.toggle("on", s===n); d.classList.toggle("done", s<n); });
    root.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function buildTipos(){
    $("#qTipos").innerHTML = tipos.map(t=>`<button class="opt" data-tipo="${t}"><b>${t}</b></button>`).join("");
    $$("[data-tipo]").forEach(b=> b.onclick = ()=>{
      $$("[data-tipo]").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); D.tipo=b.dataset.tipo; buildDet();
    });
  }
  function buildDet(){
    const f = CAMPOS[D.tipo]||[];
    $("#qDet").innerHTML = f.map(c=>{
      if(c[2].startsWith("sel:")) return `<div class="f"><label>${c[1]}</label><select data-k="${c[0]}"><option value="">Selecione</option>${c[2].slice(4).split("|").map(o=>`<option>${o}</option>`).join("")}</select></div>`;
      return `<div class="f"><label>${c[1]}</label><input data-k="${c[0]}" type="${c[2]}" placeholder="—"></div>`;
    }).join("");
  }
  buildTipos();

  $("#qN1").onclick = ()=>{
    if(!D.tipo){ $("#qTipos").animate([{opacity:.3},{opacity:1}],300); return; }
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
    const d = Object.entries(D.det).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join("<br>");
    $("#qResumo").innerHTML = `<b>Interesse:</b> ${ramo==="seguro"?"Seguro":"Consórcio"} — ${esc(D.tipo)}<br>${d?d+"<br>":""}<b>Nome:</b> ${esc($("#qNome").value)}<br><b>WhatsApp:</b> ${esc($("#qFone").value)}<br><b>E-mail:</b> ${esc($("#qEmail").value)}${$("#qCidade").value?"<br><b>Cidade:</b> "+esc($("#qCidade").value):""}`;
    setStep(3);
  };

  $("#qSend").onclick = ()=>{
    if(!$("#qLgpd").checked){ $(".consent").animate([{opacity:.3},{opacity:1}],400); return; }
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
    $$("#qProg div").forEach(d=>d.classList.add("done"));
    root.scrollIntoView({behavior:"smooth", block:"center"});
  };
}

window.SoluaQuote = { mount };
})();
