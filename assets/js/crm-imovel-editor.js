/* ===========================================================
   Solua CRM — editor completo de um imóvel
   Página: crm/imovel-editor.html  (?id=… edita; sem id = novo)

   O rascunho (d) vive em memória até "Salvar". Campos usam
   data-k="caminho.no.objeto" + data-t (text|num|money|bool|date) e
   são lidos por delegação de eventos — não há um listener por campo.
   Fotos/plantas/arquivos vão pro IndexedDB (assets/js/midia-store.js);
   um arquivo removido só é apagado de verdade quando o imóvel é salvo.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB, UI = window.SoluaUI, IM = window.SoluaImovel, MID = window.SoluaMidia;
const ME = UI.currentUser;
const params = new URLSearchParams(location.search);
let id = params.get("id");
let original = id ? DB.getImovel(id) : null;

const MAX_FOTOS = 40, MAX_PLANTAS = 20, MAX_DESTAQUES = 6;
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const PORTAIS = ["ZAP Imóveis","Viva Real","OLX","Imovelweb","Chaves na Mão","Instagram","Facebook"];
const CAT_ARQ = ["Matrícula","IPTU","Contrato","Autorização","Planta aprovada","Laudo / vistoria","Fotos originais","Outro"];

const ICO = {
  casa:`<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>`,
  pin:`<path d="M12 21s-7-6.3-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>`,
  info:`<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>`,
  cifrao:`<path d="M12 3v18M16 7.5c0-1.9-1.8-3-4-3s-4 1.1-4 2.8c0 3.7 8 1.9 8 5.7 0 1.7-1.8 3-4 3s-4-1.1-4-3"/>`,
  cama:`<path d="M3 18v-8M21 18v-5a3 3 0 00-3-3h-8v5M3 15h18"/><circle cx="6.5" cy="11.5" r="1.5"/>`,
  regua:`<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4"/>`,
  cadeado:`<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>`,
  megafone:`<path d="M3 10v4h3l7 4V6L6 10H3z"/><path d="M16.5 8.5a5 5 0 010 7"/>`,
  globo:`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.4 3.8 5.6 3.8 9s-1.2 6.6-3.8 9c-2.6-2.4-3.8-5.6-3.8-9S9.4 5.4 12 3z"/>`,
  foto:`<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>`,
  planta:`<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h7v9M14 3v8h7M10 12v-3"/>`,
  estrela:`<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8z"/>`,
  pessoas:`<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c2.3.2 4 1.9 4.5 4.6"/>`,
  doc:`<path d="M7 3h7l4 4v14H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>`,
  lead:`<circle cx="10" cy="8" r="3.4"/><path d="M3.5 19.5c.7-3.6 3.4-5.8 6.5-5.8 1.2 0 2.3.3 3.3.9M18 14v6M15 17h6"/>`,
  upload:`<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>`
};
const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;

// ---------------------------------------------------------------- estado
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function normalizar(x){
  x.endereco = Object.assign({estado:"SP"}, x.endereco||{});
  x.proprietario = x.proprietario || {};
  x.confidencial = x.confidencial || {};
  x.publicacao = Object.assign({portais:[]}, x.publicacao||{});
  x.captacao = x.captacao || {};
  x.exclusividade = x.exclusividade || {};
  ["fotos","plantas","arquivos","comodidades","comodidadesDestaque","etiquetas","angariadores"].forEach(k=>{ if(!Array.isArray(x[k])) x[k] = []; });
  // catálogo antigo guardava só "valor": vira o preço certo pela finalidade
  if(x.precoVenda==null && x.finalidade!=="locacao" && x.valor) x.precoVenda = x.valor;
  if(x.precoLocacao==null && x.finalidade==="locacao" && x.valor) x.precoLocacao = x.valor;
  if(x.publicado==null) x.publicado = true;
  return x;
}
function novoRascunho(){
  return normalizar({finalidade:"venda", tipo:"Apartamento", status:"pronto", cidade:"Campinas", bairro:"",
    publicado:false, destaque:false, mostrarMapa:true,
    angariadores: ME ? [{usuarioId:ME.id, percentual:100}] : [],
    proprietarioId: DB.getProprietario(params.get("proprietario")||"") ? params.get("proprietario") : null,
    captacao:{data:new Date().toISOString().slice(0,10)}});
}

if(id && !original){
  document.getElementById("pageHd").innerHTML = `<div><a class="voltar" href="imoveis-cadastro.html">← Cadastro de imóveis</a><h1>Imóvel não encontrado</h1></div>`;
  document.querySelector(".ed-layout").innerHTML = `<div class="card"><div class="empty">${UI.emptyState("Ele pode ter sido excluído. Volte ao cadastro para ver o catálogo.")}</div></div>`;
  return;
}

let d = original ? normalizar(clone(original)) : novoRascunho();
const ABA_IDS = ["sobre","detalhes","anuncio","fotos","plantas","comodidades","angariadores","publicacao","arquivos","leads"];
let aba = ABA_IDS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "sobre";
let sujo = false, tentouPublicar = false;
const removidos = new Set(), adicionados = new Set();
let fotosSel = new Set();
let marcaDagua = false;
try{ marcaDagua = localStorage.getItem("solua_marca_dagua")==="1"; }catch(e){}

function getP(o, p){ return p.split(".").reduce((a,k)=> a==null ? undefined : a[k], o); }
function setP(o, p, v){
  const ks = p.split("."); let a = o;
  ks.slice(0,-1).forEach(k=>{ if(a[k]==null || typeof a[k]!=="object") a[k] = {}; a = a[k]; });
  a[ks[ks.length-1]] = v;
}
const n = v => Number(v)||0;
const fmtMoney = v => (v==null || v==="") ? "" : Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
const esc = DB.esc;

// ------------------------------------------------------ campos (HTML)
function rotulo(label, o){
  return `<label for="${o.idc}">${label}${o.req?`<span class="req" aria-hidden="true">*</span>`:""}${o.opc?`<span class="opc">(opcional)</span>`:""}</label>`;
}
let seqId = 0;
function campo(label, path, o){
  o = o || {}; o.idc = "f_"+(++seqId);
  const v = getP(d, path);
  const cls = ["field", o.span||"", pendentesVisiveis().has(path) ? "faltando" : ""].join(" ");
  const ph = o.ph ? ` placeholder="${esc(o.ph)}"` : "";
  const dis = o.disabled ? " disabled" : "";
  let input;
  if(o.tipo==="select"){
    input = `<select id="${o.idc}" data-k="${path}" data-t="text"${dis}><option value="">${o.vazio||"Selecione"}</option>${o.opcoes.map(op=>{
      const [val,lab] = Array.isArray(op) ? op : [op,op];
      return `<option value="${esc(val)}" ${String(v??"")===String(val)?"selected":""}>${esc(lab)}</option>`;}).join("")}</select>`;
  } else if(o.tipo==="textarea"){
    input = `<textarea id="${o.idc}" data-k="${path}" data-t="text" rows="${o.rows||3}"${o.max?` maxlength="${o.max}"`:""}${ph}${dis}>${esc(v||"")}</textarea>`;
  } else if(o.tipo==="money"){
    input = `<div class="money"><span>R$</span><input id="${o.idc}" data-k="${path}" data-t="money" inputmode="numeric" value="${fmtMoney(v)}" placeholder="0,00"${dis}></div>`;
  } else {
    const t = o.tipo==="num" ? "num" : o.tipo==="date" ? "date" : "text";
    const typ = o.tipo==="date" ? "date" : o.tipo==="email" ? "email" : o.tipo==="tel" ? "tel" : "text";
    const im = o.tipo==="num" ? ` inputmode="decimal"` : o.tipo==="tel" ? ` inputmode="tel"` : "";
    input = `<input id="${o.idc}" type="${typ}" data-k="${path}" data-t="${t}" value="${esc(v==null?"":String(v))}"${im}${ph}${o.max?` maxlength="${o.max}"`:""}${o.list?` list="${o.list}"`:""}${dis}>`;
    if(o.botao) input = `<div class="inline-btn">${input}${o.botao}</div>`;
  }
  return `<div class="${cls.trim()}" data-campo="${path}">${rotulo(label,o)}${input}${o.ajuda?`<span class="ajuda">${o.ajuda}</span>`:""}</div>`;
}
function toggle(label, path, o){
  o = o || {};
  return `<div class="toggle-field ${o.span||""}"><label>${label}${o.opc?`<span class="opc" style="font-weight:400;color:var(--tinta-35)"> (opcional)</span>`:""}</label>
    <label class="toggle"><input type="checkbox" data-k="${path}" data-t="bool" ${getP(d,path)?"checked":""}><span class="sw"></span><span>${o.texto || (getP(d,path)?"Sim":"Não")}</span></label></div>`;
}
function seg(label, path, opcoes, o){
  o = o || {};
  const v = getP(d, path);
  return `<div class="field ${o.span||""}"><label>${label}${o.req?`<span class="req">*</span>`:""}</label>
    <div class="seg" role="radiogroup" aria-label="${esc(label)}">${opcoes.map(([val,lab])=>`<button type="button" role="radio" aria-checked="${v===val}" data-seg="${path}" data-v="${esc(val)}" class="${v===val?"on":""}">${esc(lab)}</button>`).join("")}</div></div>`;
}
function secao(icone, titulo, sub, corpo){
  return `<section class="card ed-sec"><div class="ed-sec-hd"><span class="ico">${ico(icone)}</span><div><h3>${titulo}</h3>${sub?`<p>${sub}</p>`:""}</div></div>${corpo}</section>`;
}

// ------------------------------------------------ obrigatórios p/ publicar
const pendencias = ()=> IM.pendenciasPublicacao(d);
function pendentesVisiveis(){
  return (d.publicado || tentouPublicar) ? new Set(pendencias().map(x=>x.path)) : new Set();
}

// --------------------------------------------------------------- abas
const ABAS = [
  {id:"sobre", label:"Sobre o imóvel"},
  {id:"detalhes", label:"Detalhes"},
  {id:"anuncio", label:"Anúncio"},
  {id:"fotos", label:"Fotos", n:()=>d.fotos.length},
  {id:"plantas", label:"Plantas", n:()=>d.plantas.length},
  {id:"comodidades", label:"Comodidades", n:()=>d.comodidades.length},
  {id:"angariadores", label:"Angariadores"},
  {id:"publicacao", label:"Termos de publicação"},
  {id:"arquivos", label:"Arquivos", n:()=>d.arquivos.length},
  {id:"leads", label:"Leads", n:()=> id ? DB.leadsDoImovel(id).length : 0}
];
function renderAbas(){
  const comPend = (d.publicado || tentouPublicar) ? new Set(pendencias().map(x=>x.aba)) : new Set();
  document.getElementById("edTabs").innerHTML = ABAS.map(a=>{
    const cnt = a.n ? a.n() : null;
    return `<button type="button" role="tab" class="tab ${aba===a.id?"on":""}" data-aba="${a.id}" aria-selected="${aba===a.id}">
      ${a.label}${cnt!=null?`<span class="n">${cnt}</span>`:""}${comPend.has(a.id)?`<span class="pend" title="Campos obrigatórios pendentes"></span>`:""}</button>`;
  }).join("");
}

// ---------------------------------------------------------- aba: Sobre
function mapaUrl(){
  const e = d.endereco;
  const rua = [e.logradouro, e.numero].filter(Boolean).join(", ");
  const partes = [rua, d.bairro, d.cidade, e.estado].filter(Boolean);
  if(!partes.length) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(partes.join(" - "))}&t=&z=${rua?17:14}&output=embed`;
}
function mapaHtml(){
  const u = mapaUrl();
  return u ? `<iframe src="${u}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa do imóvel"></iframe>`
           : `<div class="vazio">Preencha o CEP ou o endereço para ver o imóvel no mapa.</div>`;
}
function abaSobre(){
  const fin = d.finalidade;
  const venda = fin!=="locacao", loc = fin!=="venda";
  return negocioHtml()
  + secao("casa","Dados do imóvel","As informações principais do cadastro.",`
    <div class="fgrid">
      ${campo("Tipo do imóvel","tipo",{tipo:"select", opcoes:DB.TIPOS.imovel, req:true, span:"s2"})}
      ${campo("Fase","status",{tipo:"select", opcoes:Object.entries(IM.FASE), req:true})}
      ${campo("Ano de construção","anoConstrucao",{tipo:"num", opc:true, ph:"Ex.: 2015"})}
      ${campo("Padrão do imóvel","padraoImovel",{tipo:"select", opc:true, opcoes:["Econômico","Médio","Alto","Luxo"]})}
      ${campo("Padrão da localização","padraoLocalizacao",{tipo:"select", opc:true, opcoes:["Popular","Médio","Nobre"]})}
      ${campo("Status comercial","statusComercial",{tipo:"select", opc:true, opcoes:["Disponível","Reservado","Em negociação"], ajuda:"Vendido ou locado? Use “Inativar imóvel” no topo."})}
    </div>`)
  + secao("pin","Localização","O mapa atualiza conforme você preenche o endereço.",`
    <div class="loc-grid">
      <div class="mapa-box" id="mapaBox">${mapaHtml()}</div>
      <div class="fgrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        ${campo("CEP","endereco.cep",{req:true, ph:"00000-000", max:9, botao:`<button type="button" class="btn soft" id="btnCep">Buscar</button>`,
          ajuda:`<a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener" style="text-decoration:underline">Não sabe o CEP?</a>`})}
        ${campo("Condomínio","endereco.condominio",{opc:true, ph:"Nome do condomínio"})}
        ${campo("Logradouro","endereco.logradouro",{req:true, span:"s2"})}
        ${campo("Número","endereco.numero",{req:true})}
        ${campo("Complemento","endereco.complemento",{opc:true, ph:"Apto, sala…"})}
        ${campo("Bloco","endereco.bloco",{opc:true})}
        ${campo("Bairro","bairro",{req:true})}
        ${campo("Cidade","cidade",{req:true})}
        ${campo("Estado","endereco.estado",{tipo:"select", opcoes:UFS, req:true})}
      </div>
    </div>`)
  + secao("info","Informações detalhadas","Proprietário, ocupação e chaves — uso interno.",`
    <div class="fgrid">
      ${proprietarioHtml()}
      ${campo("Ocupação","ocupacao",{tipo:"select", opcoes:["Desocupado","Ocupado pelo proprietário","Ocupado por inquilino"]})}
      ${campo("Local das chaves","localChaves",{list:"dlChaves", ph:"Ex.: na imobiliária"})}
      <datalist id="dlChaves"><option value="Na imobiliária"><option value="Com o proprietário"><option value="Com o porteiro/zelador"><option value="Cofre de chaves no imóvel"></datalist>
      <div class="field s2"><label>Etiquetas<span class="opc">(opcional)</span></label>
        <div class="chips-in" id="etiquetasBox">${d.etiquetas.map((t,ix)=>`<span class="chip-x">${esc(t)}<button type="button" data-rmtag="${ix}" aria-label="Remover ${esc(t)}">×</button></span>`).join("")}
          <input id="etiquetaIn" placeholder="Digite e tecle Enter (ex.: oportunidade, pet friendly)"></div></div>
    </div>`)
  + secao("cifrao","Condições de negociação","Faixas de negociação (só a equipe vê), IPTU e condições.",`
    <div class="fgrid">
      ${venda ? campo("Venda — mínimo aceito","precoVendaMin",{tipo:"money", opc:true}) : ""}
      ${venda ? campo("Venda — máximo","precoVendaMax",{tipo:"money", opc:true}) : ""}
      ${loc ? campo("Locação — mínimo aceito","precoLocacaoMin",{tipo:"money", opc:true}) : ""}
      ${loc ? campo("Locação — máximo","precoLocacaoMax",{tipo:"money", opc:true}) : ""}
      ${campo("Parcelamento do IPTU","parcelamentoIptu",{tipo:"select", opc:true, opcoes:["À vista","10x","12x"]})}
      ${campo("ITR","valorItr",{tipo:"money", opc:true})}
      ${venda ? toggle("Aceita financiamento","aceitaFinanciamento",{opc:true}) : ""}
      ${venda ? toggle("Aceita permuta","aceitaPermuta",{opc:true}) : ""}
      ${campo("Detalhes da negociação","detalhesNegociacao",{tipo:"textarea", opc:true, span:"s4", ph:"Condições, permuta aceita, documentação…"})}
    </div>`);
}

// primeira decisão do cadastro: o tipo de negócio define quais valores pedir
function negocioHtml(){
  const fin = d.finalidade, venda = fin!=="locacao", loc = fin!=="venda";
  const card = (v, icone, titulo, desc)=> `<button type="button" class="neg-card ${fin===v?"on":""}" data-seg="finalidade" data-v="${v}" role="radio" aria-checked="${fin===v}">
    <span class="neg-ico">${IM.ico(icone)}</span><span><b>${titulo}</b><small>${desc}</small></span></button>`;
  const m2 = (v)=> n(v) && n(d.areaM2) ? `≈ ${DB.formatBRL(n(v)/n(d.areaM2))}/m²` : "";
  return secao("cifrao","Negócio e valores","Escolha se o imóvel é para venda, locação ou os dois — os valores pedidos mudam conforme a escolha.",`
    <div class="neg-cards" role="radiogroup" aria-label="Tipo de negócio">
      ${card("venda","venda","Venda","Preço de venda")}
      ${card("locacao","locacao","Locação","Aluguel mensal")}
      ${card("venda_locacao","ambos","Venda e locação","Os dois valores")}
    </div>
    <div class="fgrid" style="margin-top:18px">
      ${venda ? campo("Preço de venda","precoVenda",{tipo:"money", req:true, span:"s2", ajuda:m2(d.precoVenda)}) : ""}
      ${loc ? campo("Aluguel (mês)","precoLocacao",{tipo:"money", req:true, span: venda ? "" : "s2", ajuda:m2(d.precoLocacao)}) : ""}
      ${loc ? campo("Tipo de locação","tipoLocacao",{tipo:"select", opcoes:["Residencial","Comercial","Temporada"]}) : ""}
      ${campo("Condomínio (mês)","valorCondominio",{tipo:"money", opc:true})}
      ${campo("IPTU (ano)","valorIptu",{tipo:"money", opc:true})}
      ${toggle("Ocultar preço no site","ocultarPreco",{opc:true, span:"s2", texto: d.ocultarPreco ? "Sim — mostra “preço sob consulta”" : "Não — mostra o valor"})}
    </div>`);
}

function proprietarioHtml(){
  const lista = DB.getProprietarios();
  const atual = d.proprietarioId ? DB.getProprietario(d.proprietarioId) : null;
  const wa = atual ? IM.linkWhats(atual.telefone) : "";
  return `<div class="field s2"><label for="selProp">Proprietário</label>
      <div class="inline-btn">
        <select id="selProp" data-k="proprietarioId" data-t="text"><option value="">${lista.length?"Selecione um proprietário":"Nenhum proprietário cadastrado"}</option>
          ${lista.map(p=>`<option value="${p.id}" ${p.id===d.proprietarioId?"selected":""}>${esc(p.nome)}${p.documento?` · ${esc(p.documento)}`:""}</option>`).join("")}</select>
        <button type="button" class="btn soft" id="btnNovoProp">+ Novo</button>
      </div></div>
    <div class="field s2"><label>Contato do proprietário</label>
      <div class="prop-contato">${atual ? `<b>${esc(atual.telefone||"—")}</b>${atual.email?` · ${esc(atual.email)}`:""}
        ${wa?`<a href="${wa}" target="_blank" rel="noopener">WhatsApp ↗</a>`:""}<button type="button" class="link" id="btnEditProp">Editar</button>`
        : `<span style="color:var(--tinta-45)">Selecione ou cadastre o proprietário.</span>`}</div></div>`;
}

// -------------------------------------------------------- aba: Detalhes
function abaDetalhes(){
  const semCom = IM.SEM_COMODOS.has(d.tipo);
  return secao("cama","Cômodos", semCom ? `Para ${d.tipo.toLowerCase()} os cômodos são opcionais.` : "",`
    <div class="fgrid">
      ${campo("Dormitórios","quartos",{tipo:"num", req:!semCom, opc:semCom})}
      ${campo("Sendo quantas suítes?","suites",{tipo:"num", opc:true})}
      ${campo("Banheiros","banheiros",{tipo:"num", req:!semCom, opc:semCom})}
      ${campo("Sendo quantos lavabos?","lavabos",{tipo:"num", opc:true})}
      ${campo("Salas","salas",{tipo:"num", opc:true})}
      ${campo("Pé-direito","peDireito",{tipo:"select", opc:true, opcoes:["Simples","Duplo","Alto (acima de 3 m)"]})}
      ${campo("Vagas de garagem","vagas",{tipo:"num", opc:true})}
      ${campo("Tipo de vaga","tipoVaga",{tipo:"select", opc:true, opcoes:["Própria / escriturada","Coberta","Descoberta","Rotativa","Presa"]})}
      ${campo("Identificador de vaga","identificadorVaga",{opc:true, ph:"Ex.: G2-15"})}
      ${campo("Hobby box","hobbyBox",{tipo:"num", opc:true})}
      ${campo("Identificador de hobby box","identificadorHobbyBox",{opc:true})}
      ${campo("Mobiliado?","mobiliado",{tipo:"select", opc:true, opcoes:["Não","Semimobiliado","Mobiliado"]})}
    </div>`)
  + secao("regua","Áreas e terreno","Em m², exceto hectares e alqueires.",`
    <div class="fgrid">
      ${campo("Área útil (m²)","areaM2",{tipo:"num", req:true})}
      ${campo("Área total (m²)","areaTotal",{tipo:"num", opc:true})}
      ${campo("Área do terreno (m²)","areaTerreno",{tipo:"num", opc:true})}
      ${campo("Área construída (m²)","areaConstruida",{tipo:"num", opc:true})}
      ${campo("Hectares","hectares",{tipo:"num", opc:true})}
      ${campo("Alqueires","alqueires",{tipo:"num", opc:true})}
      ${campo("Tipo de alqueire","tipoAlqueire",{tipo:"select", opc:true, opcoes:["Paulista (24.200 m²)","Mineiro/Goiano (48.400 m²)","Baiano (96.800 m²)","Do Norte (27.225 m²)"]})}
      ${campo("Topografia","topografia",{tipo:"select", opc:true, opcoes:["Plano","Aclive","Declive","Irregular"]})}
      ${campo("Posição solar","posicaoSolar",{tipo:"select", opc:true, opcoes:["Sol da manhã","Sol da tarde","Sol o dia todo","Norte","Sul","Leste","Oeste"]})}
      ${campo("Face","face",{tipo:"select", opc:true, opcoes:["Frente","Fundos","Lateral","Interna"]})}
    </div>`)
  + secao("cadeado","Informações confidenciais","Só a equipe vê — nada disso vai para o site.",`
    <div class="fgrid">
      ${campo("Número do IPTU","confidencial.iptu",{opc:true})}
      ${campo("Matrícula do imóvel","confidencial.matricula",{opc:true})}
      ${campo("Medidor de energia","confidencial.medidorEnergia",{opc:true})}
      ${campo("Hidrômetro","confidencial.hidrometro",{opc:true})}
      ${campo("Medidor de gás","confidencial.medidorGas",{opc:true})}
      ${campo("Situação da escritura","confidencial.situacaoEscritura",{tipo:"select", opc:true, opcoes:["Escriturado e registrado","Escriturado","Contrato de gaveta","Em inventário","Financiado / alienado","Usucapião em andamento"]})}
      ${campo("Cartório de registro","confidencial.cartorio",{opc:true, span:"s2"})}
      ${campo("Habite-se","confidencial.habitese",{tipo:"select", opc:true, opcoes:["Sim","Não","Em andamento"]})}
      ${campo("CIB","confidencial.cib",{opc:true, ajuda:"Cadastro Imobiliário Brasileiro."})}
      <div></div><div></div>
      ${campo("Comentário interno","confidencial.comentarioInterno",{tipo:"textarea", opc:true, span:"s4", rows:3, ph:"Visível apenas para a imobiliária."})}
    </div>`);
}

// --------------------------------------------------------- aba: Anúncio
// "gamificação" da descrição: palavras-chave por tema, como dica (não trava nada)
const TEMAS = [
  {nome:"Detalhes do imóvel", palavras:["dorm","suíte","suite","sala","cozinha","banheiro","varanda","sacada","garagem","vaga","quintal","piscina","churrasqueira","área","m²","armário","reformad"], meta:5},
  {nome:"Comércio e serviços próximos", palavras:["mercado","supermercado","farmácia","escola","colégio","padaria","shopping","hospital","banco","comércio","posto","academia","restaurante"], meta:3},
  {nome:"Transporte e lazer", palavras:["ônibus","terminal","metrô","rodovia","avenida","parque","praça","lagoa","ciclovia","teatro","clube","bosque","trilha"], meta:3}
];
function dicasDescricao(){
  const t = (d.descricao||"").toLowerCase();
  return TEMAS.map(tm=>{
    const achou = tm.palavras.filter(p=> t.includes(p)).length;
    return `<span class="${achou>=tm.meta?"ok":""}">${achou>=tm.meta?"✓":"○"} ${Math.min(achou,tm.meta)}/${tm.meta} — ${tm.nome}</span>`;
  }).join("");
}
function tituloSugerido(){
  const partes = [d.tipo || "Imóvel"];
  if(!IM.SEM_COMODOS.has(d.tipo) && n(d.quartos)) partes[0] += ` com ${n(d.quartos)} dormitório${n(d.quartos)===1?"":"s"}`;
  const negocio = d.finalidade==="locacao" ? "para alugar" : d.finalidade==="venda_locacao" ? "à venda ou para alugar" : "à venda";
  let t = `${partes[0]} ${negocio}`;
  if(n(d.areaM2)) t += `, ${n(d.areaM2)} m²`;
  if(!d.ocultarPreco){
    if(d.finalidade==="locacao" && n(d.precoLocacao)) t += ` por ${DB.formatBRL(n(d.precoLocacao))}/mês`;
    else if(d.finalidade!=="locacao" && n(d.precoVenda)) t += ` por ${DB.formatBRL(n(d.precoVenda))}`;
  }
  if(d.bairro) t += ` - ${d.bairro}`;
  return t;
}
function abaAnuncio(){
  const pub = !!d.publicado;
  return secao("megafone","Anúncio","Como o imóvel aparece no site.",`
    <div class="fgrid">
      <div class="s4">${campo("Título do anúncio","titulo",{req:true, max:120, ph:"Ex.: Casa com 3 dormitórios à venda, 120 m² - Taquaral",
        botao:`<button type="button" class="btn soft" id="btnGerarTitulo">Gerar título</button>`})}
        <div class="contador" id="ctTitulo">${(d.titulo||"").length}/120</div></div>
      <div class="s4">${campo("Descrição do imóvel","descricao",{tipo:"textarea", rows:9, ph:"Conte o que torna o imóvel especial: ambientes, acabamentos, vizinhança, comércio e transporte por perto…"})}
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:6px">
          <div class="dicas" id="dicasDesc" style="margin-top:0">${dicasDescricao()}</div>
          <div class="contador" id="ctDesc">${(d.descricao||"").length} caracteres${(d.descricao||"").length<300?" · recomendado 300+":""}</div>
        </div></div>
      ${campo("URL do vídeo","videoUrl",{opc:true, span:"s2", ph:"https://youtube.com/…"})}
      ${campo("URL do tour virtual","tourUrl",{opc:true, span:"s2", ph:"https://…"})}
      ${toggle("Possui placa no imóvel?","possuiPlaca",{opc:true})}
    </div>`)
  + secao("globo","Publicação no site","",`
    <div class="fgrid">
      ${IM.inativo(d) ? `<div class="demo-hint s4" style="margin:0">Este imóvel está <b>inativo</b> (${esc(IM.rotuloInativacao(d)||"inativado")}). Reative no topo da página para voltar a publicar.</div>` : ""}
      ${IM.inativo(d) ? "" : toggle("Publicado","publicado",{texto: pub ? "Sim — aparece no catálogo do site" : "Não — fica só no CRM"})}
      ${toggle("Destaque na home","destaque",{texto: d.destaque ? "Sim — entra na vitrine da página inicial" : "Não"})}
      ${toggle("Mostrar mapa no site","mostrarMapa",{texto: d.mostrarMapa ? "Sim" : "Não"})}
      ${toggle("Ocultar rua e número","ocultarEndereco",{texto: d.ocultarEndereco ? "Sim — mapa mostra só o bairro" : "Não"})}
      ${campo("Comentário da despublicação / inativação","motivoDespublicacao",{tipo:"textarea", span:"s4", disabled:pub, ph: pub ? "Disponível quando o imóvel não estiver publicado." : "Descreva o motivo (vendido, proprietário desistiu…)"})}
    </div>`);
}

// --------------------------------------------------- abas: Fotos / Plantas
function dropHtml(tipo, titulo, sub){
  return `<label class="drop" data-drop="${tipo}">
    ${ico("upload")}<b>${titulo}</b><small>${sub}</small>
    <input type="file" data-file="${tipo}" ${tipo==="arquivos"?"":`accept="image/*"`} multiple hidden>
  </label>`;
}
function abaFotos(){
  const total = d.fotos.length;
  return secao("foto","Fotos","Envie pelo menos 3 fotos e arraste para ordenar — a primeira é a capa.",`
    ${dropHtml("fotos","Clique ou arraste as fotos aqui", `JPG, PNG ou WEBP · até ${MAX_FOTOS} fotos · reduzimos o tamanho automaticamente, sem perder qualidade`)}
    <div class="foto-bar">
      <label class="toggle"><input type="checkbox" id="ckMarca" ${marcaDagua?"checked":""}><span class="sw"></span><span>Marca d’água “solua” nas próximas fotos</span></label>
      <span class="spacer" style="flex:1"></span>
      <span class="processando" id="procFotos" aria-live="polite"></span>
      ${total ? `<label style="display:flex;align-items:center;gap:8px;font-size:13px"><input type="checkbox" id="ckTodas" style="width:17px;height:17px;accent-color:var(--azul)" ${fotosSel.size===total?"checked":""}> ${fotosSel.size}/${total} selecionadas</label>
        <button type="button" class="btn soft sm" id="btnDelSel" ${fotosSel.size?"":"disabled"}>Excluir selecionadas</button>` : ""}
    </div>
    ${total ? `<div class="foto-grid" id="gradeFotos">${d.fotos.map((ref,i)=>`
      <div class="foto ${fotosSel.has(ref)?"sel":""}" draggable="true" data-ix="${i}" data-midia="${esc(ref)}" style="background-image:url('${esc(MID.srcInicial(ref))}')" aria-label="Foto ${i+1}${i===0?" (capa)":""}">
        ${i===0?`<span class="capa">Capa</span>`:""}<span class="num">${i+1}</span>
        <input type="checkbox" class="ck" data-selfoto="${esc(ref)}" ${fotosSel.has(ref)?"checked":""} aria-label="Selecionar foto ${i+1}">
        <div class="ops">
          ${i>0?`<button type="button" data-mv="-1" data-ix="${i}" title="Mover para trás" aria-label="Mover foto ${i+1} para trás">${IM.ico("esquerda")}</button>`:""}
          ${i<total-1?`<button type="button" data-mv="1" data-ix="${i}" title="Mover para frente" aria-label="Mover foto ${i+1} para frente">${IM.ico("direita")}</button>`:""}
          ${i>0?`<button type="button" data-capa="${i}" title="Tornar capa" aria-label="Tornar foto ${i+1} a capa">${IM.ico("estrela")}</button>`:""}
          <button type="button" class="del" data-delfoto="${i}" title="Excluir" aria-label="Excluir foto ${i+1}">${IM.ico("lixeira")}</button>
        </div>
      </div>`).join("")}</div>` : `<div class="empty" style="padding:26px">${UI.emptyState("Nenhuma foto ainda.")}</div>`}`);
}
function abaPlantas(){
  return secao("planta","Plantas","Plantas baixas ou humanizadas — aparecem numa seção própria no site.",`
    ${dropHtml("plantas","Clique ou arraste as plantas aqui", `Imagens · até ${MAX_PLANTAS} plantas`)}
    <div class="foto-bar"><span class="processando" id="procPlantas" aria-live="polite"></span></div>
    ${d.plantas.length ? `<div class="foto-grid">${d.plantas.map((p,i)=>`
      <div><div class="foto" style="cursor:default;background-size:contain;background-color:#fff;background-image:url('${esc(MID.srcInicial(p.ref))}')" data-midia="${esc(p.ref)}">
        <span class="num">${i+1}</span>
        <div class="ops" style="opacity:1"><button type="button" class="del" data-delplanta="${i}" title="Excluir" aria-label="Excluir planta ${i+1}">${IM.ico("lixeira")}</button></div>
      </div>
      <div class="foto-leg"><input data-k="plantas.${i}.legenda" data-t="text" value="${esc(p.legenda||"")}" placeholder="Legenda (ex.: Tipo 1 — 112 m²)" aria-label="Legenda da planta ${i+1}"></div></div>`).join("")}</div>`
      : `<div class="empty" style="padding:26px">${UI.emptyState("Nenhuma planta ainda.")}</div>`}`);
}

// ----------------------------------------------------- aba: Comodidades
let filtroCom = "";
function abaComodidades(){
  const sel = new Set(d.comodidades), dest = new Set(d.comodidadesDestaque);
  const catalogo = Object.values(DB.COMODIDADES).flat();
  const personalizadas = d.comodidades.filter(c=> !catalogo.includes(c));
  const grupos = Object.assign({}, DB.COMODIDADES, personalizadas.length ? {"Personalizadas":personalizadas} : {});
  const f = filtroCom.toLowerCase();
  const chip = c=> `<span class="com ${sel.has(c)?"on":""}" role="checkbox" tabindex="0" aria-checked="${sel.has(c)}" data-com="${esc(c)}">${esc(c)}
    <button type="button" class="est ${dest.has(c)?"on":""}" data-est="${esc(c)}" title="${dest.has(c)?"Tirar dos destaques":"Destacar no anúncio"}" aria-label="${dest.has(c)?"Tirar dos destaques":"Destacar"}: ${esc(c)}">★</button></span>`;
  return secao("estrela","Comodidades","Marque o que o imóvel tem. Toque na ★ para colocar até 6 comodidades em destaque no anúncio.",`
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px">
      <label class="card-search" style="flex:1;max-width:320px"><svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 17l-4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><input id="buscaCom" value="${esc(filtroCom)}" placeholder="Buscar comodidade"></label>
      <span class="badge neutro">${sel.size} selecionada${sel.size===1?"":"s"}</span>
      <span class="badge consorcio">★ ${dest.size}/${MAX_DESTAQUES} em destaque</span>
    </div>
    ${Object.entries(grupos).map(([g, itens])=>{
      const vis = itens.filter(c=> !f || c.toLowerCase().includes(f));
      return vis.length ? `<div class="com-grupo"><h5>${esc(g)}</h5><div class="com-lista">${vis.map(chip).join("")}</div></div>` : "";
    }).join("") || `<p style="color:var(--tinta-45);font-size:13px">Nenhuma comodidade com “${esc(filtroCom)}”.</p>`}
    <div class="inline-btn" style="max-width:420px;margin-top:22px">
      <input id="novaCom" placeholder="Adicionar outra comodidade" style="border:1px solid var(--linha-forte);border-radius:12px;padding:0 14px;height:44px">
      <button type="button" class="btn soft" id="btnAddCom">Adicionar</button>
    </div>`);
}

// ---------------------------------------------------- aba: Angariadores
function abaAngariadores(){
  const eq = DB.getEquipe().filter(u=> u.ativo || d.angariadores.some(a=>a.usuarioId===u.id));
  const soma = d.angariadores.reduce((s,a)=> s + n(a.percentual), 0);
  return secao("pessoas","Angariadores","Quem captou o imóvel e como a comissão de captação é dividida.",`
    ${eq.map(u=>{
      const a = d.angariadores.find(x=>x.usuarioId===u.id);
      return `<div class="ang-row">
        <input type="checkbox" data-ang="${u.id}" ${a?"checked":""} aria-label="Angariador: ${esc(u.nome)}">
        <div class="namecell"><span class="avatar" style="background:${u.avatarBg||"#004BA5"}">${DB.iniciais(u.nome)}</span><div><b>${esc(u.nome)}</b><span>${esc(u.papel)}</span></div></div>
        <div class="money" style="${a?"":"opacity:.4"}"><input data-angpct="${u.id}" inputmode="decimal" value="${a?n(a.percentual):""}" ${a?"":"disabled"} aria-label="Percentual de ${esc(u.nome)}" placeholder="0"><span style="padding:0 14px 0 0">%</span></div>
      </div>`;
    }).join("")}
    <p style="font-size:12.5px;margin-top:12px;color:${d.angariadores.length && soma!==100 ? "var(--vermelho)" : "var(--tinta-45)"}" id="somaAng">
      ${d.angariadores.length ? `Total: ${soma}%${soma!==100?" — o ideal é somar 100%":""}` : "Nenhum angariador marcado."}</p>`)
  + secao("doc","Captação e exclusividade","",`
    <div class="fgrid">
      ${campo("Data da captação","captacao.data",{tipo:"date"})}
      ${campo("Origem da captação","captacao.origem",{tipo:"select", opcoes:["Indicação","Placa","Portal","Prospecção ativa","Cliente da casa","Redes sociais","Outro"]})}
      ${toggle("Exclusividade","exclusividade.ativa",{texto: d.exclusividade.ativa ? "Sim — contrato de exclusividade" : "Não"})}
      ${d.exclusividade.ativa ? campo("Exclusividade válida até","exclusividade.validade",{tipo:"date"}) : "<div></div>"}
    </div>`);
}

// ------------------------------------------------ aba: Termos de publicação
function abaPublicacao(){
  const p = d.publicacao;
  const venc = p.validadeAutorizacao && new Date(p.validadeAutorizacao+"T23:59:59") < new Date();
  return secao("doc","Autorização do proprietário","Registro da autorização para anunciar o imóvel.",`
    <div class="fgrid">
      ${toggle("Proprietário autorizou a divulgação","publicacao.autorizacao",{span:"s2", texto: p.autorizacao ? "Sim" : "Não"})}
      ${campo("Data da autorização","publicacao.dataAutorizacao",{tipo:"date"})}
      ${campo("Válida até","publicacao.validadeAutorizacao",{tipo:"date", ajuda: venc ? `<span style="color:var(--vermelho)">Autorização vencida — renove com o proprietário.</span>` : ""})}
      ${campo("Observações","publicacao.observacoes",{tipo:"textarea", opc:true, span:"s4", ph:"Restrições de divulgação, horários de visita…"})}
    </div>`)
  + secao("globo","Onde está anunciado","Controle interno: marque os canais onde o imóvel foi anunciado. O CRM ainda não envia anúncios automaticamente para os portais.",`
    <div class="com-lista">
      <span class="com ${d.publicado?"on":""}" style="cursor:default;padding-right:14px" title="Controlado pela opção “Publicado” na aba Anúncio">Site Solua ${d.publicado?"· publicado":"· não publicado"}</span>
      ${PORTAIS.map(pt=>`<span class="com ${p.portais.includes(pt)?"on":""}" style="padding-right:14px" role="checkbox" tabindex="0" aria-checked="${p.portais.includes(pt)}" data-portal="${esc(pt)}">${esc(pt)}</span>`).join("")}
    </div>`);
}

// ---------------------------------------------------------- aba: Arquivos
function tamanho(b){ return b<1024*1024 ? Math.max(1,Math.round(b/1024))+" KB" : (b/1024/1024).toFixed(1)+" MB"; }
function abaArquivos(){
  return secao("doc","Arquivos","Matrícula, IPTU, contratos, laudos — só a equipe acessa.",`
    ${dropHtml("arquivos","Clique ou arraste arquivos aqui","PDF, imagens, planilhas… até 25MB cada")}
    <div class="foto-bar" style="margin-bottom:0"><span class="processando" id="procArq" aria-live="polite"></span></div>
    <div class="arq-lista">${d.arquivos.map((a,i)=>`
      <div class="arq">
        <span class="tipo">${esc((a.nome.split(".").pop()||"arq").slice(0,4))}</span>
        <div class="nm"><b>${esc(a.nome)}</b><small>${tamanho(a.tamanho||0)} · enviado ${a.enviadoEm?DB.formatDate(a.enviadoEm):""}</small></div>
        <select data-k="arquivos.${i}.categoria" data-t="text" aria-label="Categoria de ${esc(a.nome)}">${CAT_ARQ.map(c=>`<option ${a.categoria===c?"selected":""}>${c}</option>`).join("")}</select>
        <button type="button" class="btn soft sm" data-baixar="${i}">Baixar</button>
        <button type="button" class="btn icon soft sm" data-delarq="${i}" title="Remover" aria-label="Remover ${esc(a.nome)}">${IM.ico("lixeira")}</button>
      </div>`).join("") || `<div class="empty" style="padding:22px">${UI.emptyState("Nenhum arquivo anexado.")}</div>`}</div>`);
}

// ------------------------------------------------------------- aba: Leads
function abaLeads(){
  if(!id) return secao("lead","Leads interessados","",`<div class="empty" style="padding:26px">${UI.emptyState("Salve o imóvel primeiro — depois os leads interessados aparecem aqui.")}</div>`);
  const leads = DB.leadsDoImovel(id);
  const livres = DB.getLeadsByProduto("imovel").filter(l=> !l.imovelId);
  return secao("lead","Leads interessados","Quem pede informações deste imóvel no site entra aqui automaticamente. Clique para abrir o lead.",`
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <button type="button" class="btn dark sm" id="btnNovoLeadImovel">+ Novo lead para este imóvel</button>
      ${livres.length ? `<select class="card-select" id="selVincular" aria-label="Lead para vincular"><option value="">Vincular lead existente…</option>${livres.map(l=>`<option value="${l.id}">${esc(l.nome)}</option>`).join("")}</select>
        <button type="button" class="btn soft sm" id="btnVincular">Vincular</button>` : ""}
      <a class="btn soft sm" href="pipeline-imoveis.html" style="margin-left:auto">Ver funil de imóveis →</a>
    </div>
    ${leads.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Lead</th><th>Etapa</th><th>Consultor</th><th>Chegou</th><th></th></tr></thead><tbody>
      ${leads.map(l=>{ const c = l.consultorId && DB.getUsuario(l.consultorId); return `<tr data-lead="${l.id}">
        <td><div class="namecell"><div><b>${esc(l.nome)}</b><span>${esc(l.telefone||l.email||"")}</span></div></div></td>
        <td><span class="badge imovel">${esc(DB.labelEstagio("imovel", l.estagio))}</span></td>
        <td>${c?esc(c.nome.split(" ")[0]):"—"}</td>
        <td>${DB.timeAgo(l.criadoEm)}</td>
        <td class="rowactions"><button type="button" class="btn soft sm" data-desvincular="${l.id}">Desvincular</button></td>
      </tr>`; }).join("")}</tbody></table></div>`
      : `<div class="empty" style="padding:26px">${UI.emptyState("Nenhum lead vinculado a este imóvel ainda.")}</div>`}`);
}

// ------------------------------------------------------- painel lateral
function renderLateral(){
  const q = IM.qualidade(d);
  const capa = d.fotos[0];
  const specs = [];
  if(!IM.SEM_COMODOS.has(d.tipo) && n(d.quartos)) specs.push(`${n(d.quartos)} dorm.`);
  if(n(d.vagas)) specs.push(`${n(d.vagas)} vaga${n(d.vagas)===1?"":"s"}`);
  if(n(d.areaM2)) specs.push(`${n(d.areaM2)} m²`);
  const rot = q.pct>=80 ? "Ótimo anúncio" : q.pct>=50 ? "Bom, dá pra melhorar" : "Precisa de atenção";
  document.getElementById("edSide").innerHTML = `
    <div class="card" style="padding:14px">
      <div style="font-size:12.5px;color:var(--tinta-45);margin:2px 4px 10px">Prévia no catálogo do site</div>
      <div class="im-card prev-card" style="background:var(--app-bg)">
        <div class="im-ph" ${capa?`data-midia="${esc(capa)}" style="background-image:url('${esc(MID.srcInicial(capa))}')"`:""}>
          ${capa?"":`<div class="im-vazio">${ico("foto")}Sem foto de capa</div>`}
          <div class="im-tags"><span class="im-tag">${d.destaque?"Destaque":(IM.FINALIDADE[d.finalidade]||"")}</span></div>
        </div>
        <div class="im-bd">
          <div class="preco">${esc(DB.precoImovelTexto(Object.assign({}, d)))}</div>
          <h4>${esc(d.titulo || "Título do anúncio")}</h4>
          <div class="loc">${esc([d.bairro,d.cidade].filter(Boolean).join(", ") || "Bairro, cidade")}</div>
          <div class="im-specs">${specs.map(s=>`<span>${s}</span>`).join("")}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin:12px 4px 2px;font-size:12.5px">
        <span class="dotst ${d.publicado?"ok":"cinza"}"><span>${d.publicado?"Publicado no site":"Não publicado"}</span></span>
      </div>
    </div>
    <div class="card" style="padding:18px">
      <div class="qualidade">
        <div class="anel" style="--p:${q.pct};--cor:${q.cor}"><span>${q.pct}%</span></div>
        <div><b style="font-size:15px">${rot}</b><p style="font-size:12.5px;color:var(--tinta-45);margin-top:2px">Anúncios completos recebem mais contatos.</p></div>
      </div>
      <div class="qlista">${q.itens.map(it=>`<button type="button" class="${it.ok?"ok":"nao"}" data-ir="${it.aba}"><span class="ic">${it.ok?"✓":""}</span><span>${it.texto}</span></button>`).join("")}</div>
    </div>`;
  MID.hidratar(document.getElementById("edSide"));
}

// ---------------------------------------------------------- cabeçalho
function renderHd(){
  const titulo = original ? `${original.codigo} · ${original.titulo || "Sem título"}` : "Novo imóvel";
  document.title = (original ? original.codigo : "Novo imóvel") + " — CRM Solua";
  document.getElementById("pageHd").innerHTML = `
    <div>
      <a class="voltar" href="imoveis-cadastro.html">← Cadastro de imóveis</a>
      <h1>${esc(titulo)}</h1>
      <div class="meta">
        ${original ? (()=>{ const st = IM.situacao(original); return `<span class="sit-tag" style="color:${st.cor};background:${st.fundo}">${st.label}</span>`; })() : `<span class="badge neutro">Rascunho — ainda não salvo</span>`}
        ${original && original.destaque ? `<span class="badge consorcio">★ Destaque</span>` : ""}
        ${original && original.atualizadoEm ? `<span style="font-size:12.5px;color:var(--tinta-45)">Atualizado ${DB.timeAgo(original.atualizadoEm)}</span>` : ""}
      </div>
    </div>
    <div class="ed-acoes">
      ${original && DB.estaPublicado(original) ? `<a class="btn ghost" href="../imovel.html?id=${encodeURIComponent(original.id)}" target="_blank" rel="noopener">${IM.ico("abrir")}Ver no site</a>` : ""}
      ${original ? (IM.inativo(original)
        ? `<button type="button" class="btn ghost" id="btnReativar">${IM.ico("power")}Reativar imóvel</button>`
        : `<button type="button" class="btn ghost" id="btnInativar">${IM.ico("power")}Inativar imóvel</button>`) : ""}
      ${original ? `<button type="button" class="btn ghost btn-ico" id="btnMaisEd" aria-label="Mais ações" aria-haspopup="true">${IM.ico("mais")}</button>` : ""}
      <button type="button" class="btn dark" id="btnSalvar">Salvar imóvel</button>
    </div>
    ${original && IM.inativo(original) ? `<div class="inat-banner" role="status">
      <span class="inat-ico">${IM.ico("power")}</span>
      <div><b>Imóvel inativo${original.inativacao ? " — " + esc(IM.rotuloInativacao(original)) : ""}</b>
        <span>${original.inativacao && original.inativacao.valorFechado ? `Valor fechado: ${DB.formatBRL(original.inativacao.valorFechado)}${original.inativacao.motivo==="locado"?"/mês":""}. ` : ""}${original.inativacao && original.inativacao.obs ? esc(original.inativacao.obs) + ". " : ""}Fora do site; o cadastro e o histórico continuam aqui.</span></div>
      <button type="button" class="btn sm" id="btnReativar2">Reativar</button>
    </div>` : ""}`;
}

// ------------------------------------------------------------- render
const RENDER = {sobre:abaSobre, detalhes:abaDetalhes, anuncio:abaAnuncio, fotos:abaFotos, plantas:abaPlantas,
  comodidades:abaComodidades, angariadores:abaAngariadores, publicacao:abaPublicacao, arquivos:abaArquivos, leads:abaLeads};
function renderAba(){
  seqId = 0;
  const main = document.getElementById("edMain");
  main.innerHTML = RENDER[aba]();
  MID.hidratar(main);
}
function renderTudo(){ renderHd(); renderAbas(); renderAba(); renderLateral(); }
function irPara(nova, focar){
  if(!RENDER[nova]) return;
  aba = nova;
  history.replaceState(null, "", location.pathname + location.search + "#" + aba);
  renderAbas(); renderAba();
  window.scrollTo({top:0, behavior:"smooth"});
  if(focar){ const el = document.querySelector(`[data-campo="${focar}"] input, [data-campo="${focar}"] select, [data-campo="${focar}"] textarea`); if(el) setTimeout(()=> el.focus(), 250); }
}
function marcarSujo(){
  sujo = true;
  document.getElementById("salvarBar").classList.add("on");
}
let tLateral;
function atualizarLateralDepois(){ clearTimeout(tLateral); tLateral = setTimeout(()=>{ renderLateral(); renderAbas(); }, 180); }

// ----------------------------------------------------- leitura de campos
function lerValor(el){
  const t = el.dataset.t;
  if(t==="bool") return el.checked;
  if(t==="money"){
    const dig = el.value.replace(/\D/g,"");
    const v = dig ? Number(dig)/100 : null;
    el.value = v==null ? "" : fmtMoney(v);
    return v;
  }
  if(t==="num"){
    const s = el.value.replace(/[^\d,.-]/g,"").replace(",",".");
    return s==="" ? null : Number(s);
  }
  return el.value;
}
function mascaraCep(el){
  const v = el.value.replace(/\D/g,"").slice(0,8);
  el.value = v.length>5 ? v.slice(0,5)+"-"+v.slice(5) : v;
}
const RERENDER = new Set(["proprietarioId","finalidade","tipo","publicado","destaque","mostrarMapa","ocultarEndereco","ocultarPreco","exclusividade.ativa","publicacao.autorizacao","aceitaFinanciamento","aceitaPermuta","possuiPlaca"]);
const ENDERECO = new Set(["endereco.logradouro","endereco.numero","bairro","cidade","endereco.estado"]);
let tMapa;
function atualizarMapa(){ clearTimeout(tMapa); tMapa = setTimeout(()=>{ const box = document.getElementById("mapaBox"); if(box) box.innerHTML = mapaHtml(); }, 700); }

function aoMudar(el){
  const k = el.dataset.k; if(!k) return;
  if(k==="endereco.cep") mascaraCep(el);
  setP(d, k, lerValor(el));
  marcarSujo();
  if(el.closest(".faltando") && el.value) el.closest(".faltando").classList.remove("faltando");
  if(k==="titulo"){ const c = document.getElementById("ctTitulo"); if(c) c.textContent = `${(d.titulo||"").length}/120`; }
  if(k==="descricao"){
    const c = document.getElementById("ctDesc"); if(c) c.textContent = `${d.descricao.length} caracteres${d.descricao.length<300?" · recomendado 300+":""}`;
    const dc = document.getElementById("dicasDesc"); if(dc) dc.innerHTML = dicasDescricao();
  }
  if(k==="endereco.cep" && d.endereco.cep.replace(/\D/g,"").length===8 && el.dataset.buscado!==d.endereco.cep){ el.dataset.buscado = d.endereco.cep; buscarCep(); }
  if(ENDERECO.has(k)) atualizarMapa();
  if(RERENDER.has(k)){ renderAba(); }
  atualizarLateralDepois();
}

// ---------------------------------------------------------------- CEP
async function buscarCep(){
  const cep = (d.endereco.cep||"").replace(/\D/g,"");
  if(cep.length!==8){ UI.toast("Digite um CEP com 8 números.","err"); return; }
  const btn = document.getElementById("btnCep");
  if(btn){ btn.disabled = true; btn.textContent = "Buscando…"; }
  try{
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const j = await r.json();
    if(j.erro) throw new Error("CEP não encontrado.");
    if(j.logradouro) d.endereco.logradouro = j.logradouro;
    if(j.bairro) d.bairro = j.bairro;
    if(j.localidade) d.cidade = j.localidade;
    if(j.uf) d.endereco.estado = j.uf;
    if(j.complemento && !d.endereco.complemento) d.endereco.complemento = j.complemento;
    marcarSujo();
    ["endereco.logradouro","bairro","cidade","endereco.estado","endereco.complemento"].forEach(p=>{
      const el = document.querySelector(`[data-k="${p}"]`);
      if(el){ el.value = getP(d,p)||""; const f = el.closest(".faltando"); if(f && el.value) f.classList.remove("faltando"); }
    });
    atualizarMapa(); atualizarLateralDepois();
    const num = document.querySelector('[data-k="endereco.numero"]'); if(num && !num.value) num.focus();
    UI.toast("Endereço preenchido pelo CEP.","ok");
  }catch(e){
    UI.toast(e.message==="CEP não encontrado." ? e.message : "Não foi possível consultar o CEP agora — preencha o endereço manualmente.","err");
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = "Buscar"; }
  }
}

// ---------------------------------------------------------- uploads
async function enviar(tipo, files){
  files = Array.from(files||[]);
  if(!files.length) return;
  const procId = tipo==="fotos" ? "procFotos" : tipo==="plantas" ? "procPlantas" : "procArq";
  const lim = tipo==="fotos" ? MAX_FOTOS - d.fotos.length : tipo==="plantas" ? MAX_PLANTAS - d.plantas.length : Infinity;
  if(lim<=0){ UI.toast(`Limite de ${tipo==="fotos"?MAX_FOTOS+" fotos":MAX_PLANTAS+" plantas"} atingido.`,"err"); return; }
  if(files.length > lim){ UI.toast(`Só cabem mais ${lim}; as demais foram ignoradas.`,"err"); files = files.slice(0, lim); }
  let ok = 0, falhas = 0;
  for(let i=0;i<files.length;i++){
    const p = document.getElementById(procId); if(p) p.textContent = `Processando ${i+1} de ${files.length}…`;
    try{
      if(tipo==="arquivos"){
        const a = await MID.salvarArquivo(files[i]);
        d.arquivos.push(Object.assign(a, {categoria:"Outro", enviadoEm:new Date().toISOString()}));
        adicionados.add(a.ref);
      } else {
        const ref = await MID.salvarImagem(files[i], tipo==="fotos" && marcaDagua ? {marca:"solua"} : {max: tipo==="plantas" ? 2000 : 1600});
        if(tipo==="fotos") d.fotos.push(ref); else d.plantas.push({ref, legenda:""});
        adicionados.add(ref);
      }
      ok++;
    }catch(e){ falhas++; UI.toast(`${files[i].name}: ${e.message}`,"err"); }
  }
  if(ok) marcarSujo();
  renderAbas(); renderAba(); renderLateral();
  if(ok) UI.toast(`${ok} ${tipo==="fotos"?"foto":tipo==="plantas"?"planta":"arquivo"}${ok===1?"":"s"} adicionad${tipo==="plantas"||tipo==="fotos"?"a":"o"}${ok===1?"":"s"}${falhas?` · ${falhas} com erro`:""}.`,"ok");
}
function removerRef(ref){ if(adicionados.has(ref)){ adicionados.delete(ref); MID.remover(ref); } else removidos.add(ref); }
function moverFoto(de, para){
  if(para<0 || para>=d.fotos.length || de===para) return;
  const [f] = d.fotos.splice(de,1); d.fotos.splice(para,0,f);
  marcarSujo(); renderAba(); renderLateral();
}

// --------------------------------------------------------- eventos
const main = document.getElementById("edMain");
main.addEventListener("input", e=>{
  if(e.target.id==="buscaCom"){ filtroCom = e.target.value; const pos = e.target.selectionStart; renderAba(); const b = document.getElementById("buscaCom"); b.focus(); b.setSelectionRange(pos,pos); return; }
  if(e.target.dataset.angpct){
    const a = d.angariadores.find(x=>x.usuarioId===e.target.dataset.angpct);
    if(a){ a.percentual = Number(e.target.value.replace(",","."))||0; marcarSujo();
      const soma = d.angariadores.reduce((s,x)=>s+n(x.percentual),0);
      const el = document.getElementById("somaAng"); el.textContent = `Total: ${soma}%${soma!==100?" — o ideal é somar 100%":""}`; el.style.color = soma!==100 ? "var(--vermelho)" : "var(--tinta-45)"; }
    return;
  }
  if(e.target.dataset.t && e.target.dataset.t!=="bool" && e.target.tagName!=="SELECT") aoMudar(e.target);
});
main.addEventListener("change", e=>{
  const t = e.target;
  if(t.id==="ckMarca"){ marcaDagua = t.checked; try{ localStorage.setItem("solua_marca_dagua", marcaDagua?"1":"0"); }catch(x){} return; }
  if(t.id==="ckTodas"){ fotosSel = t.checked ? new Set(d.fotos) : new Set(); renderAba(); return; }
  if(t.dataset.selfoto){ t.checked ? fotosSel.add(t.dataset.selfoto) : fotosSel.delete(t.dataset.selfoto); renderAba(); return; }
  if(t.dataset.file){ enviar(t.dataset.file, t.files); t.value = ""; return; }
  if(t.dataset.ang){
    const uid = t.dataset.ang;
    if(t.checked){
      const resto = Math.max(0, 100 - d.angariadores.reduce((s,a)=>s+n(a.percentual),0));
      d.angariadores.push({usuarioId:uid, percentual: resto});
    } else d.angariadores = d.angariadores.filter(a=>a.usuarioId!==uid);
    marcarSujo(); renderAba(); atualizarLateralDepois(); return;
  }
  if(t.dataset.t==="bool" || t.tagName==="SELECT" || t.dataset.t==="date") aoMudar(t);
});
main.addEventListener("keydown", e=>{
  if(e.target.id==="etiquetaIn" && (e.key==="Enter" || e.key===",")){
    e.preventDefault();
    const v = e.target.value.trim().replace(/,$/,"");
    if(v && !d.etiquetas.includes(v)){ d.etiquetas.push(v); marcarSujo(); renderAba(); document.getElementById("etiquetaIn").focus(); }
    else e.target.value = "";
  }
  if(e.target.id==="novaCom" && e.key==="Enter"){ e.preventDefault(); document.getElementById("btnAddCom").click(); }
  if((e.key===" " || e.key==="Enter") && (e.target.dataset.com || e.target.dataset.portal) && e.target.classList.contains("com")){ e.preventDefault(); e.target.click(); }
});
main.addEventListener("click", e=>{
  const t = e.target;
  const segBtn = t.closest("[data-seg]");
  if(segBtn){
    setP(d, segBtn.dataset.seg, segBtn.dataset.v); marcarSujo(); renderAba(); atualizarLateralDepois(); return;
  }
  if(t.id==="btnCep"){ buscarCep(); return; }
  if(t.id==="btnNovoProp"){ IM.editarProprietario(null, p=>{ d.proprietarioId = p.id; marcarSujo(); renderAba(); atualizarLateralDepois(); }); return; }
  if(t.id==="btnEditProp"){ IM.editarProprietario(d.proprietarioId, ()=>{ renderAba(); }); return; }
  if(t.id==="btnGerarTitulo"){
    d.titulo = tituloSugerido().slice(0,120); marcarSujo();
    const inp = document.querySelector('[data-k="titulo"]'); if(inp){ inp.value = d.titulo; inp.closest(".field").classList.remove("faltando"); }
    const c = document.getElementById("ctTitulo"); if(c) c.textContent = `${d.titulo.length}/120`;
    atualizarLateralDepois(); return;
  }
  const rmTag = t.closest("[data-rmtag]");
  if(rmTag){ d.etiquetas.splice(+rmTag.dataset.rmtag,1); marcarSujo(); renderAba(); return; }
  // fotos
  const mv = t.closest("[data-mv]"); if(mv){ const i = +mv.dataset.ix; moverFoto(i, i + (+mv.dataset.mv)); return; }
  const capa = t.closest("[data-capa]"); if(capa){ moverFoto(+capa.dataset.capa, 0); UI.toast("Nova foto de capa definida.","ok"); return; }
  const delF = t.closest("[data-delfoto]");
  if(delF){ const ref = d.fotos.splice(+delF.dataset.delfoto,1)[0]; fotosSel.delete(ref); removerRef(ref); marcarSujo(); renderAbas(); renderAba(); renderLateral(); return; }
  if(t.id==="btnDelSel"){
    const qtd = fotosSel.size;
    UI.confirmAction(`Excluir ${qtd} foto${qtd===1?"":"s"} selecionada${qtd===1?"":"s"}?`, ()=>{
      d.fotos = d.fotos.filter(ref=>{ if(fotosSel.has(ref)){ removerRef(ref); return false; } return true; });
      fotosSel.clear(); marcarSujo(); renderAbas(); renderAba(); renderLateral();
    });
    return;
  }
  const delP = t.closest("[data-delplanta]");
  if(delP){ const p = d.plantas.splice(+delP.dataset.delplanta,1)[0]; removerRef(p.ref); marcarSujo(); renderAbas(); renderAba(); return; }
  // comodidades
  const est = t.closest("[data-est]");
  if(est){
    e.stopPropagation();
    const c = est.dataset.est, ix = d.comodidadesDestaque.indexOf(c);
    if(ix>=0) d.comodidadesDestaque.splice(ix,1);
    else if(d.comodidadesDestaque.length>=MAX_DESTAQUES){ UI.toast(`No máximo ${MAX_DESTAQUES} comodidades em destaque.`,"err"); return; }
    else d.comodidadesDestaque.push(c);
    marcarSujo(); renderAba(); return;
  }
  const com = t.closest("[data-com]");
  if(com){
    const c = com.dataset.com, ix = d.comodidades.indexOf(c);
    if(ix>=0){ d.comodidades.splice(ix,1); d.comodidadesDestaque = d.comodidadesDestaque.filter(x=>x!==c); }
    else d.comodidades.push(c);
    marcarSujo(); renderAba(); renderAbas(); atualizarLateralDepois();
    const volta = document.querySelector(`[data-com="${CSS.escape(c)}"]`); if(volta) volta.focus();
    return;
  }
  if(t.id==="btnAddCom"){
    const inp = document.getElementById("novaCom"); const v = inp.value.trim();
    if(v && !d.comodidades.includes(v)){ d.comodidades.push(v); marcarSujo(); renderAba(); renderAbas(); atualizarLateralDepois(); }
    return;
  }
  const portal = t.closest("[data-portal]");
  if(portal){
    const pt = portal.dataset.portal, arr = d.publicacao.portais, ix = arr.indexOf(pt);
    ix>=0 ? arr.splice(ix,1) : arr.push(pt); marcarSujo(); renderAba(); return;
  }
  // arquivos
  const baixar = t.closest("[data-baixar]");
  if(baixar){
    const a = d.arquivos[+baixar.dataset.baixar];
    MID.url(a.ref).then(u=>{
      if(!u){ UI.toast("Arquivo não encontrado neste navegador.","err"); return; }
      const link = document.createElement("a"); link.href = u; link.download = a.nome; document.body.appendChild(link); link.click(); link.remove();
    });
    return;
  }
  const delA = t.closest("[data-delarq]");
  if(delA){ const a = d.arquivos.splice(+delA.dataset.delarq,1)[0]; removerRef(a.ref); marcarSujo(); renderAbas(); renderAba(); return; }
  // leads
  if(t.id==="btnNovoLeadImovel"){
    window.SoluaNewLead.open({produto:"imovel", onCreated: lead=>{ DB.updateLead(lead.id, {imovelId:id, tipo: lead.tipo || d.tipo}); renderAbas(); renderAba(); }});
    return;
  }
  if(t.id==="btnVincular"){
    const lid = document.getElementById("selVincular").value; if(!lid) return;
    DB.updateLead(lid, {imovelId:id}); UI.toast("Lead vinculado ao imóvel.","ok"); renderAbas(); renderAba(); return;
  }
  const desv = t.closest("[data-desvincular]");
  if(desv){ e.stopPropagation(); DB.updateLead(desv.dataset.desvincular, {imovelId:null}); renderAbas(); renderAba(); return; }
  const lr = t.closest("[data-lead]");
  if(lr && window.SoluaLead){ window.SoluaLead.open(lr.dataset.lead, {onChange: ()=>{ renderAbas(); renderAba(); }}); }
});

// arrastar arquivos para as áreas de envio + reordenar fotos arrastando
main.addEventListener("dragover", e=>{
  const drop = e.target.closest("[data-drop]");
  if(drop && e.dataTransfer.types.includes("Files")){ e.preventDefault(); drop.classList.add("sobre"); }
  const foto = e.target.closest(".foto[draggable]");
  if(foto && arrastandoIx!=null){ e.preventDefault(); document.querySelectorAll(".foto.alvo").forEach(x=>x.classList.remove("alvo")); foto.classList.add("alvo"); }
});
main.addEventListener("dragleave", e=>{ const drop = e.target.closest("[data-drop]"); if(drop) drop.classList.remove("sobre"); });
main.addEventListener("drop", e=>{
  const drop = e.target.closest("[data-drop]");
  if(drop && e.dataTransfer.files.length){ e.preventDefault(); drop.classList.remove("sobre"); enviar(drop.dataset.drop, e.dataTransfer.files); return; }
  const foto = e.target.closest(".foto[draggable]");
  if(foto && arrastandoIx!=null){ e.preventDefault(); moverFoto(arrastandoIx, +foto.dataset.ix); }
});
let arrastandoIx = null;
main.addEventListener("dragstart", e=>{
  const foto = e.target.closest(".foto[draggable]"); if(!foto) return;
  arrastandoIx = +foto.dataset.ix; foto.classList.add("arrastando");
  e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(arrastandoIx));
});
main.addEventListener("dragend", ()=>{ arrastandoIx = null; document.querySelectorAll(".foto.arrastando,.foto.alvo").forEach(x=>x.classList.remove("arrastando","alvo")); });

document.getElementById("edTabs").addEventListener("click", e=>{ const b = e.target.closest("[data-aba]"); if(b) irPara(b.dataset.aba); });
document.getElementById("edTabs").addEventListener("keydown", e=>{
  if(e.key!=="ArrowRight" && e.key!=="ArrowLeft") return;
  const i = ABA_IDS.indexOf(aba), prox = ABA_IDS[(i + (e.key==="ArrowRight"?1:-1) + ABA_IDS.length) % ABA_IDS.length];
  irPara(prox); document.querySelector(`[data-aba="${prox}"]`).focus();
});
document.getElementById("edSide").addEventListener("click", e=>{ const b = e.target.closest("[data-ir]"); if(b) irPara(b.dataset.ir); });

// ----------------------------------------------------------- salvar
function salvar(){
  if(d.publicado){
    const pend = pendencias();
    if(pend.length){
      tentouPublicar = true;
      renderAbas(); renderAba();
      const nomes = pend.slice(0,6).map(p=>p.label).join(", ") + (pend.length>6 ? ` e mais ${pend.length-6}` : "");
      UI.confirmAction(`Para publicar no site ainda falta: ${nomes}. Quer salvar agora como NÃO publicado e completar depois?`, ()=>{
        d.publicado = false; gravar();
      });
      return;
    }
  }
  gravar();
}
function gravar(){
  d.valor = d.finalidade==="locacao" ? n(d.precoLocacao) : n(d.precoVenda);
  ["quartos","suites","vagas","areaM2","banheiros"].forEach(k=> d[k] = n(d[k]));
  d.comodidadesDestaque = d.comodidadesDestaque.filter(c=> d.comodidades.includes(c));
  d.angariadores = d.angariadores.filter(a=> a.usuarioId);
  if(d.publicado) d.despublicadoEm = null;
  else if(original && DB.estaPublicado(original)) d.despublicadoEm = new Date().toISOString();
  if(original){ DB.updateImovel(original.id, d); }
  else {
    const novo = DB.addImovel(d);
    id = novo.id;
    history.replaceState(null, "", `imovel-editor.html?id=${encodeURIComponent(id)}#${aba}`);
  }
  removidos.forEach(ref=> MID.remover(ref)); removidos.clear(); adicionados.clear();
  original = DB.getImovel(id);
  d = normalizar(clone(original));
  sujo = false; tentouPublicar = false;
  document.getElementById("salvarBar").classList.remove("on");
  UI.toast(`${original.codigo} salvo${DB.estaPublicado(original)?" e publicado no site":""}.`,"ok");
  renderTudo();
}
function descartar(){
  adicionados.forEach(ref=> MID.remover(ref)); adicionados.clear(); removidos.clear();
  d = original ? normalizar(clone(original)) : novoRascunho();
  sujo = false; tentouPublicar = false; fotosSel.clear();
  document.getElementById("salvarBar").classList.remove("on");
  renderTudo();
}
document.addEventListener("click", e=>{
  if(e.target.id==="btnSalvar" || e.target.id==="btnSalvarBar") salvar();
  if(e.target.id==="btnDescartar") UI.confirmAction("Descartar as alterações feitas desde o último salvamento?", descartar);
  const alvo = e.target.closest("button");
  if(!alvo) return;
  if(alvo.id==="btnInativar"){
    IM.abrirInativar(Object.assign({}, d, {codigo: original.codigo}), patch=>{ Object.assign(d, patch); gravar(); UI.toast("Imóvel inativado e retirado do site.","ok"); });
  }
  if(alvo.id==="btnReativar" || alvo.id==="btnReativar2"){
    Object.assign(d, IM.patchReativar()); gravar();
    UI.toast("Imóvel reativado. Ele está pausado — publique na aba Anúncio quando quiser.","ok");
  }
  if(alvo.id==="btnMaisEd"){
    e.stopPropagation();
    const velho = document.getElementById("menuMaisEd"); if(velho){ velho.remove(); return; }
    const menu = document.createElement("div");
    menu.className = "tb-menu"; menu.id = "menuMaisEd"; menu.setAttribute("role","menu");
    menu.innerHTML = `<a href="#" role="menuitem" data-acao="dup"><span class="mi-ico">${IM.ico("duplicar")}</span><span><b>Duplicar</b><small>Cria uma cópia como rascunho</small></span></a>
      <a href="#" role="menuitem" data-acao="del"><span class="mi-ico" style="color:var(--vermelho)">${IM.ico("lixeira")}</span><span><b>Excluir</b><small>Apaga o cadastro definitivamente</small></span></a>`;
    document.body.appendChild(menu);
    const r = alvo.getBoundingClientRect();
    menu.style.top = (r.bottom + 8) + "px";
    menu.style.left = Math.max(10, Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 10)) + "px";
    menu.addEventListener("click", async ev=>{
      const a = ev.target.closest("[data-acao]"); if(!a) return;
      ev.preventDefault(); menu.remove();
      if(a.dataset.acao==="dup"){
        if(sujo){ UI.toast("Salve ou descarte as alterações antes de duplicar.","err"); return; }
        const novo = await IM.duplicar(id); UI.toast(`Cópia criada como ${novo.codigo}.`,"ok");
        location.href = "imovel-editor.html?id=" + encodeURIComponent(novo.id);
      } else {
        IM.excluir(id, ()=>{ [...adicionados].forEach(MID.remover); sujo = false; location.href = "imoveis-cadastro.html"; });
      }
    });
  }
});
document.addEventListener("click", e=>{ const m = document.getElementById("menuMaisEd"); if(m && !m.contains(e.target) && !e.target.closest("#btnMaisEd")) m.remove(); });
document.addEventListener("keydown", e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="s"){ e.preventDefault(); salvar(); }
  if(e.key==="Escape"){ const m = document.getElementById("menuMaisEd"); if(m) m.remove(); }
});
addEventListener("beforeunload", e=>{ if(sujo){ e.preventDefault(); e.returnValue = ""; } });

renderTudo();
})();
