/* Solua — site institucional: interações da página + captura de leads.
   Cada cotação enviada aqui é gravada pelo SoluaDB (assets/js/crm-data.js)
   e passa a aparecer imediatamente no funil do CRM (/crm/). */
(function(){
"use strict";
const WPP = "5519999999999"; // TODO: trocar pelo número real de WhatsApp da Solua
const wppMsg = t => `https://wa.me/${WPP}?text=${encodeURIComponent(t||"Olá! Vim pelo site e gostaria de uma cotação.")}`;
["wppFix","wppFoot"].forEach(id=>{ const el=document.getElementById(id); if(el) el.href = wppMsg(); });
const yr = document.getElementById("yr"); if(yr) yr.textContent = new Date().getFullYear();

/* NAV */
const hd = document.getElementById("hd");
addEventListener("scroll", ()=> hd && hd.classList.toggle("solid", scrollY>40));
const bg = document.getElementById("bg"), mob = document.getElementById("mob");
const closeMob = ()=>{ mob.classList.remove("on"); bg.classList.remove("on"); document.body.style.overflow=""; };
if(bg){
  bg.onclick = ()=>{ const o = mob.classList.toggle("on"); bg.classList.toggle("on", o); document.body.style.overflow = o?"hidden":""; };
  document.querySelectorAll("[data-close]").forEach(a=> a.onclick = closeMob);
}

/* MARQUEE */
const marcas = ["Porto Seguro","Bradesco Seguros","SulAmérica","Allianz","HDI","Tokio Marine","Azul Seguros","Porto Bank","Ademicon","Mapfre","Zurich","Liberty"];
const mq = document.getElementById("mq");
if(mq) mq.innerHTML = [...marcas,...marcas].map(m=>`<span>${m}</span>`).join("<span>·</span>");

/* PRODUTOS */
const seguros = [
 ["Seguro Auto","Cobertura para colisão, roubo, furto, incêndio e terceiros — com assistência 24h, carro reserva e vidros. Comparamos franquia, cobertura e preço entre as principais seguradoras.",["Assistência 24h","Carro reserva","Vidros","Terceiros"]],
 ["Seguro Residencial","Protege sua casa contra incêndio, roubo, danos elétricos e vendaval, com assistência para chaveiro, encanador e eletricista. Custa menos do que a maioria imagina.",["Incêndio","Roubo","Danos elétricos","Assistência lar"]],
 ["Seguro de Vida","Tranquilidade para quem fica e cobertura para você em caso de invalidez ou doenças graves. Capital ajustável ao seu momento de vida.",["Morte","Invalidez","Doenças graves","Funeral"]],
 ["Seguro Empresarial","Patrimônio, estoque, lucros cessantes e responsabilidade civil. Montamos a apólice conforme o risco real da sua operação.",["Patrimônio","Lucros cessantes","RC","Equipamentos"]],
 ["Plano de Saúde e Odonto","Individual, familiar ou empresarial. Comparamos rede credenciada, coparticipação e reajuste antes de você assinar.",["Individual","Familiar","PME","Odonto"]],
 ["Seguro Viagem","Cobertura médica, bagagem, cancelamento e assistência internacional — incluindo apólices que atendem à exigência do Tratado de Schengen.",["Médico","Bagagem","Cancelamento","Schengen"]],
 ["Garantia Locatícia e Fiança","Alternativa ao fiador e ao depósito caução, para locatário e proprietário. Aprovação rápida e sem imobilizar capital.",["Sem fiador","Aprovação rápida","Proprietário","Locatário"]],
 ["Condomínio e Frota","Apólices coletivas para condomínios e gestão de frota para empresas, com controle centralizado de sinistros e renovações.",["Obrigatório por lei","Frota","Gestão de sinistros"]]
];
const consorcios = [
 ["Consórcio de Imóvel","Para comprar, construir, reformar ou quitar financiamento. Cartas de crédito flexíveis, sem juros e com parcelas que cabem no orçamento.",["Compra","Construção","Reforma","Quitação"]],
 ["Consórcio de Automóvel","Carro novo ou seminovo, nacional ou importado. Use o crédito como poder de compra à vista e negocie melhor na concessionária.",["Novo","Seminovo","Crédito à vista"]],
 ["Consórcio de Pesados","Caminhões, máquinas agrícolas e equipamentos — planejamento de frota sem comprometer o capital de giro da empresa.",["Caminhões","Máquinas","Frota","PJ"]],
 ["Consórcio de Serviços","Reforma, casamento, intercâmbio, cirurgias e estudos. Planejamento para o que não cabe em uma parcela de cartão.",["Reforma","Viagem","Estudos","Saúde"]]
];
const render = (arr, el) => { const target = document.getElementById(el); if(!target) return; target.innerHTML = arr.map((p,i)=>`
<div class="item">
  <div class="item-hd"><span class="n">${String(i+1).padStart(2,"0")}</span><h3>${p[0]}</h3><span class="plus"></span></div>
  <div class="item-bd"><div class="in"><span></span><p>${p[1]}</p><div class="chips">${p[2].map(c=>`<span class="chip">${c}</span>`).join("")}</div></div></div>
</div>`).join(""); };
render(seguros,"segList"); render(consorcios,"conList");

const faqs = [
 ["Vocês cobram alguma taxa pela cotação?","Não. A cotação e a consultoria são gratuitas. A corretora é remunerada pela seguradora ou administradora quando você contrata — e isso não encarece sua apólice."],
 ["Por que cotar com uma corretora e não direto no site da seguradora?","Porque no site você vê uma proposta; com a gente você vê o mercado. Comparamos coberturas, franquias e condições entre várias companhias e explicamos as diferenças que a tabela não mostra — além de estarmos ao seu lado na hora do sinistro."],
 ["Qual a diferença entre consórcio e financiamento?","No financiamento você paga juros ao banco e leva o bem na hora. No consórcio não há juros — apenas taxa de administração — e o bem vem na contemplação, por sorteio ou lance. Consórcio é para quem pode planejar; financiamento, para quem tem pressa."],
 ["Posso usar o FGTS no consórcio de imóvel?","Sim, em muitos casos. O FGTS pode ser usado para dar lance, complementar a carta de crédito ou amortizar parcelas, respeitando as regras da Caixa e da administradora. Analisamos seu caso antes de qualquer contratação."],
 ["O que acontece se eu precisar acionar o seguro?","Você fala com o seu consultor Solua, não com um call center. Orientamos a documentação, abrimos o aviso de sinistro e acompanhamos a análise até o pagamento ou o reparo."],
 ["Vocês atendem fora de Campinas?","Sim. Atendemos toda a região metropolitana e, para seguros e consórcios, todo o Brasil de forma remota — com o mesmo consultor do início ao fim."]
];
const faqList = document.getElementById("faqList");
if(faqList) faqList.innerHTML = faqs.map(f=>`
<div class="item"><div class="item-hd"><h3>${f[0]}</h3><span class="plus"></span></div>
<div class="item-bd"><div class="in"><p>${f[1]}</p></div></div></div>`).join("");

document.addEventListener("click", e=>{
  const it = e.target.closest(".item"); if(!it) return;
  const bd = it.querySelector(".item-bd"), open = it.classList.contains("open");
  it.closest(".list").querySelectorAll(".item.open").forEach(o=>{ o.classList.remove("open"); o.querySelector(".item-bd").style.maxHeight = 0; });
  if(!open){ it.classList.add("open"); bd.style.maxHeight = bd.scrollHeight+"px"; }
});

/* BLOG */
const posts = [
 {c:"Seguros",t:"Franquia, cobertura e preço: o que realmente muda no seguro auto",d:"6 min",dt:"12 ago 2026",r:"Três apólices com o mesmo preço podem proteger de formas completamente diferentes. Entenda o que olhar antes de fechar.",b:`<p>Quando alguém pede uma cotação de seguro auto, quase sempre a primeira pergunta é: quanto custa? É uma pergunta legítima, mas incompleta. Duas apólices com valor parecido podem ter diferenças enormes na hora em que você precisa delas.</p><h2>1. A franquia não é um detalhe</h2><p>A franquia é o valor que você paga em caso de colisão parcial. Uma apólice mais barata frequentemente tem franquia mais alta — o que significa que o desconto de hoje vira despesa no dia do sinistro. Vale comparar o par preço e franquia, nunca só o preço.</p><h2>2. Cobertura de terceiros define o seu risco real</h2><p>Danos materiais e corporais a terceiros são a cobertura que protege seu patrimônio de uma ação judicial. Muita gente contrata o mínimo e descobre tarde que o limite não cobria o carro que atingiu.</p><h2>3. Assistência 24h e carro reserva mudam sua rotina</h2><p>Guincho com quilometragem curta ou carro reserva de sete dias parecem detalhes até você depender deles por duas semanas. Verifique os limites, não apenas se o item existe na apólice.</p><h2>4. Perfil e uso do veículo</h2><p>O cálculo considera CEP de pernoite, garagem, condutores e uso do carro. Informações imprecisas barateiam a cotação e podem gerar recusa de indenização depois. Melhor informar corretamente desde o início.</p><p>O papel da corretora é justamente colocar essas variáveis lado a lado. Você decide com informação — e não pelo primeiro número que apareceu.</p>`},
 {c:"Consórcio",t:"Consórcio ou financiamento? A conta que quase ninguém faz",d:"7 min",dt:"04 ago 2026",r:"Não existe resposta única. Existe a resposta certa para o seu prazo, sua pressa e seu bolso.",b:`<p>A comparação entre consórcio e financiamento costuma ser feita de forma rasa: um tem juros, o outro não. Verdade, mas insuficiente para decidir.</p><h2>O que você está comprando em cada um</h2><p>No financiamento, você compra tempo: leva o bem hoje e paga juros por isso. No consórcio, você compra poder de compra futuro: forma uma poupança coletiva, paga taxa de administração no lugar de juros e recebe a carta de crédito na contemplação — por sorteio ou por lance.</p><h2>O custo total costuma surpreender</h2><p>Em prazos longos, o custo efetivo de um financiamento imobiliário pode ultrapassar de forma significativa o valor do imóvel. No consórcio, o custo se concentra na taxa de administração e no fundo de reserva, diluídos ao longo do plano.</p><h2>Quando o consórcio faz mais sentido</h2><ul><li>Você tem um objetivo em 2, 3 ou 5 anos e consegue planejar.</li><li>Quer disciplina de poupança com destino definido.</li><li>Pretende usar o crédito como pagamento à vista e negociar desconto.</li><li>Tem recurso para lance — inclusive FGTS, no caso de imóvel.</li></ul><h2>Quando o financiamento faz mais sentido</h2><p>Se você precisa do bem agora — mudança de cidade, nascimento de um filho, fim de contrato de aluguel — pagar juros pode ser o preço justo pela imediatez.</p><p>A pergunta correta não é qual é melhor, e sim: qual é o seu prazo? A partir dessa resposta, a conta se resolve sozinha.</p>`},
 {c:"Seguros",t:"Seguro residencial custa menos do que você imagina",d:"4 min",dt:"27 jul 2026",r:"O produto mais subestimado do mercado brasileiro — e o mais barato por real protegido.",b:`<p>Existe um descompasso curioso no Brasil: seguramos o carro com naturalidade e deixamos a casa, que costuma valer muito mais, sem qualquer proteção.</p><h2>O que a apólice cobre de fato</h2><p>Incêndio, queda de raio e explosão são a base obrigatória. A partir daí, você monta: roubo e furto qualificado, danos elétricos — que resolvem geladeira, TV e ar-condicionado queimados por oscilação —, vendaval, impacto de veículos e responsabilidade civil familiar.</p><h2>A assistência que se usa o ano inteiro</h2><p>Chaveiro, encanador, eletricista, conserto de eletrodomésticos e até desentupimento entram no pacote. Muita gente paga o seguro do ano em uma única visita emergencial de chaveiro em um domingo.</p><h2>Imóvel alugado também precisa</h2><p>Contratos de locação costumam exigir apólice de incêndio. Mas o inquilino pode — e deve — proteger também o conteúdo: móveis, eletrônicos e bens pessoais não estão cobertos pela apólice do proprietário.</p><p>Comparado ao valor do que protege, é provavelmente o seguro com melhor relação custo-benefício do mercado brasileiro.</p>`},
 {c:"Planejamento",t:"Lance no consórcio: as estratégias que realmente antecipam a contemplação",d:"6 min",dt:"18 jul 2026",r:"Livre, fixo, embutido e com FGTS. Entenda cada modalidade antes de dar o seu.",b:`<p>Contemplação por sorteio é sorte. Lance é estratégia. E, na maioria dos grupos, é o lance que define quem antecipa o crédito.</p><h2>Lance livre</h2><p>Você oferece o percentual que quiser do valor da carta. Vence quem ofertar mais naquela assembleia. Exige acompanhar o histórico do grupo para calibrar a oferta.</p><h2>Lance fixo</h2><p>A administradora define um percentual único. Se mais de um consorciado ofertar, decide-se por sorteio entre eles. É mais previsível e costuma ser bom para quem tem exatamente aquele valor disponível.</p><h2>Lance embutido</h2><p>Parte do próprio crédito é usada como lance. Você não desembolsa dinheiro novo, mas recebe uma carta menor. Útil para quem tem pressa e flexibilidade no valor do bem.</p><h2>FGTS no consórcio de imóvel</h2><p>O saldo do FGTS pode compor lance, complementar a carta ou amortizar parcelas, dentro das regras aplicáveis. É o recurso mais subutilizado por quem está em consórcio imobiliário.</p><p>Antes de ofertar, peça à sua corretora o histórico de contemplações do grupo. Ofertar acima do necessário é dinheiro deixado na mesa.</p>`},
 {c:"Seguros",t:"Seguro de vida não é sobre morte. É sobre continuidade",d:"5 min",dt:"09 jul 2026",r:"Invalidez, doenças graves e antecipação em vida: o produto mudou e quase ninguém percebeu.",b:`<p>O nome atrapalha. Seguro de vida soa como algo que só interessa a quem fica — e por isso é constantemente adiado.</p><h2>Coberturas que você usa em vida</h2><p>Invalidez permanente por acidente, diagnóstico de doenças graves com pagamento antecipado, diária por internação e assistência funeral familiar. Boa parte das indenizações pagas hoje acontece com o segurado vivo.</p><h2>Quanto contratar</h2><p>Uma referência prática: capital equivalente a três a cinco anos da sua renda anual, ajustado por dívidas em aberto — financiamento imobiliário, principalmente — e pela idade dos dependentes.</p><h2>Quanto antes, mais barato</h2><p>O prêmio é calculado por idade e condição de saúde no momento da contratação. Contratar aos trinta e poucos custa uma fração do valor de contratar aos cinquenta com o mesmo capital.</p><h2>Empresário: atenção ao seguro-chave</h2><p>Se a operação depende de uma pessoa, existe cobertura específica para dar fôlego financeiro à empresa durante a transição. É um produto pouco divulgado e muito útil em PMEs.</p>`},
 {c:"Planejamento",t:"Checklist: o que revisar no seu seguro antes de renovar",d:"4 min",dt:"30 jun 2026",r:"Renovação automática é conforto — e também a forma mais comum de pagar caro por cobertura errada.",b:`<p>A renovação costuma chegar quando você está ocupado. Aceitar automaticamente é fácil, mas raramente é a melhor decisão financeira do ano.</p><h2>1. Mudou alguma coisa na sua vida?</h2><p>Casamento, filho, mudança de endereço, novo condutor no carro, home office, reforma. Cada um desses eventos altera o risco — e, portanto, o preço e a cobertura ideal.</p><h2>2. O valor segurado ainda corresponde à realidade?</h2><p>Imóveis e bens se valorizam; veículos desvalorizam. Segurar acima do valor de mercado é pagar a mais; abaixo, é receber menos do que precisa.</p><h2>3. Você usou a apólice?</h2><p>Histórico limpo é argumento de negociação. Vale pedir revisão de bônus e recotação no mercado antes de aceitar o reajuste proposto.</p><h2>4. As assistências fazem sentido?</h2><p>Serviços que você nunca usou podem sair; os que faltaram no ano devem entrar. É o ajuste mais barato de fazer e o mais esquecido.</p><p>Uma revisão de quinze minutos com seu corretor, trinta dias antes do vencimento, costuma valer mais do que qualquer cupom de desconto.</p>`}
];
const cats = ["Todos", ...new Set(posts.map(p=>p.c))];
const filtersEl = document.getElementById("filters");
if(filtersEl) filtersEl.innerHTML = cats.map((c,i)=>`<button class="filt${i?"":" on"}" data-c="${c}">${c}</button>`).join("");
const drawPosts = f => { const el = document.getElementById("posts"); if(!el) return; el.innerHTML = posts.filter(p=>f==="Todos"||p.c===f).map(p=>`
<article class="post" data-i="${posts.indexOf(p)}">
  <span class="cat">${p.c}</span><h3>${p.t}</h3><p>${p.r}</p>
  <div class="meta"><span>${p.dt}</span><span>${p.d} de leitura</span></div>
</article>`).join(""); };
drawPosts("Todos");
if(filtersEl) filtersEl.onclick = e=>{ const b=e.target.closest(".filt"); if(!b) return;
 document.querySelectorAll(".filt").forEach(x=>x.classList.remove("on")); b.classList.add("on"); drawPosts(b.dataset.c); };

const reader = document.getElementById("reader");
const postsEl = document.getElementById("posts");
if(postsEl) postsEl.onclick = e=>{ const a=e.target.closest(".post"); if(!a) return;
 const p = posts[a.dataset.i];
 document.getElementById("rbody").innerHTML = `<span class="cat">${p.c}</span><h1>${p.t}</h1>
 <div class="meta">${p.dt} · ${p.d} de leitura · por Solua</div>${p.b}
 <div class="reader-cta"><h3>Quer aplicar isso ao seu caso?</h3><p>Peça uma cotação sem compromisso e receba a análise de um consultor.</p><button class="btn lg" onclick="closeReader();goQuote()">Solicitar cotação</button></div>`;
 reader.classList.add("on"); reader.scrollTop = 0; document.body.style.overflow = "hidden"; };
window.closeReader = ()=>{ reader.classList.remove("on"); document.body.style.overflow=""; };
const closeRBtn = document.getElementById("closeR"); if(closeRBtn) closeRBtn.onclick = window.closeReader;
addEventListener("keydown", e=> e.key==="Escape" && window.closeReader());

/* ================= COTAÇÃO ================= */
const D = {ramo:"", tipo:"", det:{}};
const tipos = { seguro: window.SoluaDB.TIPOS.seguro, consorcio: window.SoluaDB.TIPOS.consorcio };
const campos = {
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
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let step = 1;
const cotacaoSec = document.getElementById("cotacao");
if(cotacaoSec){
  const setStep = n=>{ step=n;
   $$(".stepv").forEach(v=> v.classList.toggle("on", +v.dataset.step===n));
   $$("#prog div").forEach(d=>{ const s=+d.dataset.s; d.classList.toggle("on", s===n); d.classList.toggle("done", s<n); });
   cotacaoSec.scrollIntoView({behavior:"smooth", block:"start"}); };
  window.goQuote = function(r){
    if(r){ D.ramo=r; $$("[data-ramo]").forEach(b=>b.classList.toggle("sel", b.dataset.ramo===r)); buildStep2(); setTimeout(()=>setStep(2),350); return; }
    cotacaoSec.scrollIntoView({behavior:"smooth"});
  };
  $$("[data-ramo]").forEach(b=> b.onclick = ()=>{
    $$("[data-ramo]").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); D.ramo=b.dataset.ramo;
    const n=$("#n1"); n.disabled=false; n.style.opacity=1; n.style.pointerEvents="auto"; });
  $("#n1").onclick = ()=>{ buildStep2(); setStep(2); };
  $$("[data-back]").forEach(b=> b.onclick = ()=> setStep(step-1));

  function buildStep2(){
   const seg = D.ramo==="seguro";
   $("#t2").textContent = seg ? "Que seguro você quer cotar?" : "Qual consórcio te interessa?";
   $("#s2").textContent = seg ? "Escolha o tipo e complete os detalhes — quanto mais preciso, melhor a cotação." : "Escolha a categoria e informe o valor pretendido.";
   $("#tipos").innerHTML = tipos[D.ramo].map(t=>`<button class="opt" data-tipo="${t}"><b>${t}</b></button>`).join("");
   $("#det").innerHTML = ""; D.tipo=""; D.det={};
   $$("[data-tipo]").forEach(b=> b.onclick = ()=>{
    $$("[data-tipo]").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); D.tipo=b.dataset.tipo; buildDet(); });
  }
  function buildDet(){
   const f = campos[D.tipo]||[];
   $("#det").innerHTML = f.map(c=>{
    if(c[2].startsWith("sel:")) return `<div class="f"><label>${c[1]}</label><select data-k="${c[0]}"><option value="">Selecione</option>${c[2].slice(4).split("|").map(o=>`<option>${o}</option>`).join("")}</select></div>`;
    return `<div class="f"><label>${c[1]}</label><input data-k="${c[0]}" type="${c[2]}" placeholder="—"></div>`; }).join("");
  }
  $("#n2").onclick = ()=>{
   if(!D.tipo){ $("#tipos").animate([{opacity:.3},{opacity:1}],300); return; }
   $$("#det [data-k]").forEach(i=>{ if(i.value) D.det[i.previousElementSibling.textContent]=i.value; });
   setStep(3);
  };

  const val = ()=>{ let ok=true;
   [["#nome",v=>v.trim().length>2],["#fone",v=>v.replace(/\D/g,"").length>=10],["#email",v=>/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)]].forEach(([s,fn])=>{
    const el=$(s), p=el.parentElement, good=fn(el.value); p.classList.toggle("err", !good); if(!good) ok=false; });
   return ok; };
  $("#n3").onclick = ()=>{ if(!val()) return;
   const esc = window.SoluaDB.esc;
   const d = Object.entries(D.det).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join("<br>");
   $("#resumo").innerHTML = `<b>Interesse:</b> ${D.ramo==="seguro"?"Seguro":"Consórcio"} — ${esc(D.tipo)}<br>${d?d+"<br>":""}<b>Nome:</b> ${esc($("#nome").value)}<br><b>WhatsApp:</b> ${esc($("#fone").value)}<br><b>E-mail:</b> ${esc($("#email").value)}${$("#cidade").value?"<br><b>Cidade:</b> "+esc($("#cidade").value):""}`;
   setStep(4);
  };

  $("#fone").oninput = e=>{ let v=e.target.value.replace(/\D/g,"").slice(0,11);
   e.target.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v; };

  $("#send").onclick = ()=>{
   if(!$("#lgpd").checked){ $(".consent").animate([{opacity:.3},{opacity:1}],400); return; }
   const btn=$("#send"); btn.textContent="Enviando…"; btn.style.pointerEvents="none";

   // grava o lead direto no CRM (mesma base usada em /crm/)
   const detalhesTxt = Object.entries(D.det).map(([k,v])=>`${k}: ${v}`).join(" | ");
   window.SoluaDB.addLead({
     nome: $("#nome").value.trim(), email: $("#email").value.trim(),
     telefone: $("#fone").value.trim(), cidade: $("#cidade").value.trim(),
     produto: D.ramo, tipo: D.tipo, origem:"Site", estagio:"novo",
     notas: [{id:"nota_"+Date.now(), data:new Date().toISOString(), autor:"Sistema",
       texto:`Lead recebido pelo formulário de cotação do site.${detalhesTxt?" Detalhes: "+detalhesTxt:""}${$("#obs").value.trim()?" Observação do cliente: "+$("#obs").value.trim():""}`}]
   });

   // monta a mensagem como texto puro e só codifica no final — nomes/valores com
   // acentos, "&", "#" etc. não podem ir soltos numa query string
   const linhasWpp = [
     "Olá! Solicitei uma cotação pelo site.", "",
     `Interesse: ${D.ramo==="seguro"?"Seguro":"Consórcio"} — ${D.tipo}`,
     `Nome: ${$("#nome").value}`,
     ...Object.entries(D.det).map(([k,v])=>`${k}: ${v}`)
   ].join("\n");
   $("#wppLink").href = `https://wa.me/${WPP}?text=${encodeURIComponent(linhasWpp)}`;
   $$(".stepv").forEach(v=>v.classList.remove("on"));
   $("#done").classList.add("on");
   $$("#prog div").forEach(d=>d.classList.add("done"));
   cotacaoSec.scrollIntoView({behavior:"smooth", block:"center"});
  };
} else {
  // páginas sem o formulário completo ainda usam o CTA "goQuote" apontando para a home
  window.goQuote = function(){ location.href = (location.pathname.endsWith("/")?"":"./")+"index.html#cotacao"; };
}

/* REVEAL */
const io = new IntersectionObserver(es=> es.forEach(e=> e.isIntersecting && e.target.classList.add("in")), {threshold:.08});
$$(".rev").forEach(e=> io.observe(e));
})();
