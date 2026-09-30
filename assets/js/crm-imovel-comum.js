/* ===========================================================
   Solua CRM — peças compartilhadas da área de Imóveis (Gestão,
   editor e Proprietários): rótulos, nota de qualidade do anúncio,
   o que falta pra publicar, situação do anúncio e o formulário de
   proprietário (modal reaproveitado nas três telas).
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const n = v => Number(v)||0;

const FINALIDADE = {venda:"Venda", locacao:"Locação", venda_locacao:"Venda e locação"};
const FASE = {pronto:"Pronto para morar", lancamento:"Lançamento", em_construcao:"Em construção", na_planta:"Na planta", reforma:"Precisa de reforma"};
const SEM_COMODOS = new Set(["Terreno","Sala comercial","Loja","Galpão","Rural"]);

// Mínimo pra aparecer no site (path = campo no editor, aba = onde resolver)
function pendenciasPublicacao(d){
  const p = [];
  const falta = (cond, path, aba, label)=>{ if(cond) p.push({path, aba, label}); };
  const e = d.endereco || {};
  falta(!d.tipo, "tipo", "sobre", "Tipo do imóvel");
  falta(!d.status, "status", "sobre", "Fase");
  falta(!e.cep, "endereco.cep", "sobre", "CEP");
  falta(!e.logradouro, "endereco.logradouro", "sobre", "Logradouro");
  falta(!e.numero, "endereco.numero", "sobre", "Número");
  falta(!d.bairro, "bairro", "sobre", "Bairro");
  falta(!d.cidade, "cidade", "sobre", "Cidade");
  const pv = d.precoVenda!=null ? d.precoVenda : (d.finalidade!=="locacao" ? d.valor : 0);
  const pl = d.precoLocacao!=null ? d.precoLocacao : (d.finalidade==="locacao" ? d.valor : 0);
  falta(d.finalidade!=="locacao" && !n(pv), "precoVenda", "sobre", "Preço de venda");
  falta(d.finalidade!=="venda" && !n(pl), "precoLocacao", "sobre", "Preço de locação");
  if(!SEM_COMODOS.has(d.tipo)){
    falta(!n(d.quartos), "quartos", "detalhes", "Dormitórios");
    falta(!n(d.banheiros), "banheiros", "detalhes", "Banheiros");
  }
  falta(!n(d.areaM2), "areaM2", "detalhes", "Área útil");
  falta(!(d.titulo||"").trim(), "titulo", "anuncio", "Título do anúncio");
  falta(!(d.fotos||[]).length, "fotos", "fotos", "Pelo menos 1 foto");
  return p;
}

// "Nota" do anúncio: cada item vale o mesmo; "aba" diz onde resolver
function qualidade(i){
  const e = i.endereco || {};
  const precoOk = i.ocultarPreco ||
    (i.finalidade==="locacao" ? n(i.precoLocacao!=null?i.precoLocacao:i.valor)>0 : i.finalidade==="venda_locacao" ? n(i.precoVenda)>0 && n(i.precoLocacao)>0 : n(i.precoVenda!=null?i.precoVenda:i.valor)>0);
  const itens = [
    {ok:(i.fotos||[]).length>=3, texto:"Pelo menos 3 fotos", aba:"fotos"},
    {ok:(i.fotos||[]).length>=8, texto:"8 fotos ou mais", aba:"fotos"},
    {ok:!!(i.titulo||"").trim(), texto:"Título do anúncio", aba:"anuncio"},
    {ok:(i.descricao||"").trim().length>=300, texto:"Descrição com 300+ caracteres", aba:"anuncio"},
    {ok:precoOk, texto:"Preço informado", aba:"sobre"},
    {ok:!!(e.cep && e.logradouro && e.numero && i.bairro && i.cidade), texto:"Endereço completo", aba:"sobre"},
    {ok:n(i.areaM2)>0, texto:"Área útil", aba:"detalhes"},
    {ok:SEM_COMODOS.has(i.tipo) || (n(i.quartos)>0 && n(i.banheiros)>0), texto:"Dormitórios e banheiros", aba:"detalhes"},
    {ok:(i.comodidades||[]).length>=5, texto:"5 comodidades ou mais", aba:"comodidades"},
    {ok:(i.angariadores||[]).length>0, texto:"Angariador definido", aba:"angariadores"},
    {ok:!!(i.proprietarioId && DB.getProprietario(i.proprietarioId)), texto:"Proprietário vinculado", aba:"sobre"},
    {ok:!!(i.publicacao && i.publicacao.autorizacao), texto:"Autorização de publicação", aba:"publicacao"}
  ];
  const pct = Math.round(itens.filter(x=>x.ok).length / itens.length * 100);
  return {pct, itens, cor: pct>=80 ? "var(--verde)" : pct>=50 ? "var(--amarelo)" : "var(--vermelho)"};
}

// ------------------------------------------------ situação do anúncio
// Junta "está no site?" (publicado) com o status comercial num rótulo só,
// com cor — é o que aparece na faixa lateral e na pílula de cada imóvel.
const SITUACOES = [
  {id:"em_anuncio",    label:"Em anúncio",      cor:"#1E8E5A", fundo:"#E7F5EE"},
  {id:"pausado",       label:"Anúncio pausado", cor:"#B0453D", fundo:"#FBEAE8"},
  {id:"reservado",     label:"Reservado",       cor:"#B8862B", fundo:"#FBF1E1"},
  {id:"em_negociacao", label:"Em negociação",   cor:"#B8862B", fundo:"#FBF1E1"},
  {id:"vendido",       label:"Vendido",         cor:"#004BA5", fundo:"#E6EEF8"},
  {id:"alugado",       label:"Locado",          cor:"#004BA5", fundo:"#E6EEF8"},
  {id:"inativo",       label:"Inativo",         cor:"#5F6368", fundo:"#ECEBE8"},
  {id:"rascunho",      label:"Rascunho",        cor:"#8a8f98", fundo:"#EFEDEA"}
];
const SIT = Object.fromEntries(SITUACOES.map(s=>[s.id,s]));
function inativo(i){ return i.ativo===false || i.statusComercial==="Vendido" || i.statusComercial==="Alugado"; }
function situacao(i){
  const sc = i.statusComercial;
  const mot = i.inativacao && i.inativacao.motivo;
  if(mot==="vendido" || sc==="Vendido") return SIT.vendido;
  if(mot==="locado" || sc==="Alugado") return SIT.alugado;
  if(i.ativo===false) return SIT.inativo;
  if(sc==="Reservado") return SIT.reservado;
  if(sc==="Em negociação") return SIT.em_negociacao;
  if(DB.estaPublicado(i)) return SIT.em_anuncio;
  return i.despublicadoEm ? SIT.pausado : SIT.rascunho;
}
// devolve o patch pra aplicar, ou {erro:[…]} quando falta algo pra publicar
function patchSituacao(i, id){
  const agora = new Date().toISOString();
  if(id==="em_anuncio"){
    const pend = pendenciasPublicacao(i);
    if(pend.length) return {erro: pend.map(p=>p.label)};
    return {publicado:true, statusComercial:"Disponível", despublicadoEm:null};
  }
  if(id==="pausado") return {publicado:false, statusComercial:"Disponível", despublicadoEm:agora};
  if(id==="reservado") return {statusComercial:"Reservado"};
  if(id==="em_negociacao") return {statusComercial:"Em negociação"};
  return {};
}

// ------------------------------------------------- inativar / reativar
const MOTIVOS = [
  {id:"vendido",  label:"Vendido",                  desc:"Negócio de venda fechado", status:"Vendido"},
  {id:"locado",   label:"Locado",                   desc:"Contrato de locação assinado", status:"Alugado"},
  {id:"desistiu", label:"Proprietário desistiu",    desc:"Tirou o imóvel do mercado"},
  {id:"terceiros",label:"Negociado por terceiros",  desc:"Vendido/locado por outra imobiliária"},
  {id:"outro",    label:"Outro motivo",             desc:"Descreva na observação"}
];
function rotuloInativacao(i){
  const x = i.inativacao; if(!x) return "";
  const m = MOTIVOS.find(m=> m.id===x.motivo);
  return `${m ? m.label : "Inativo"}${x.data ? " em " + new Date(x.data+"T12:00:00").toLocaleDateString("pt-BR") : ""}`;
}
// abre o modal; aoConfirmar(patch) decide onde aplicar (direto no banco ou no rascunho do editor)
function abrirInativar(i, aoConfirmar){
  const UI = window.SoluaUI, esc = DB.esc;
  let ov = document.getElementById("inatOverlay");
  if(!ov){ ov = document.createElement("div"); ov.className = "overlay modal-center"; ov.id = "inatOverlay"; document.body.appendChild(ov); }
  const sugerido = i.finalidade==="locacao" ? "locado" : "vendido";
  const hoje = new Date().toISOString().slice(0,10);
  ov.innerHTML = `<div class="modal" style="width:min(560px,94vw)" role="dialog" aria-modal="true" aria-labelledby="inatTit">
    <div class="modal-hd"><div><h3 style="font-size:19px" id="inatTit">Inativar imóvel</h3><p style="font-size:13px;color:var(--tinta-45);margin-top:3px">${esc(i.codigo||"")} · ${esc(i.titulo||"Sem título")}</p></div><button class="x" data-close-overlay="inatOverlay" aria-label="Fechar"></button></div>
    <div class="modal-bd">
      <p style="font-size:13.5px;color:var(--tinta-60);margin-bottom:14px">O imóvel sai do site e da vitrine, mas continua no CRM com todo o histórico. Dá pra reativar quando quiser.</p>
      <div class="motivos" role="radiogroup" aria-label="Motivo">${MOTIVOS.map(m=>`
        <label class="motivo"><input type="radio" name="inatMot" value="${m.id}" ${m.id===sugerido?"checked":""}><span><b>${m.label}</b><small>${m.desc}</small></span></label>`).join("")}</div>
      <div class="grid2" style="margin-top:16px">
        <div class="field"><label for="inatData">Data</label><input type="date" id="inatData" value="${hoje}" max="${hoje}"></div>
        <div class="field" id="inatValorBox"><label for="inatValor" id="inatValorLbl">Valor fechado<span class="opc">(opcional)</span></label><div class="money"><span>R$</span><input id="inatValor" inputmode="numeric" placeholder="0,00"></div></div>
        <div class="field full"><label for="inatObs">Observação<span class="opc">(opcional)</span></label><textarea id="inatObs" rows="2" placeholder="Ex.: comprador indicado pelo João, escritura em 30 dias"></textarea></div>
      </div>
    </div>
    <div class="modal-ft"><button class="btn ghost sm" data-close-overlay="inatOverlay">Cancelar</button><button class="btn dark sm" id="inatOk">Inativar imóvel</button></div>
  </div>`;
  const valor = ov.querySelector("#inatValor");
  function ajustar(){
    const m = ov.querySelector('input[name="inatMot"]:checked').value;
    ov.querySelector("#inatValorBox").style.display = (m==="vendido" || m==="locado") ? "" : "none";
    ov.querySelector("#inatValorLbl").firstChild.textContent = m==="locado" ? "Aluguel fechado (mês)" : "Valor da venda";
  }
  ov.querySelectorAll('input[name="inatMot"]').forEach(r=> r.onchange = ajustar); ajustar();
  valor.oninput = ()=>{ const d = valor.value.replace(/\D/g,""); valor.value = d ? (Number(d)/100).toLocaleString("pt-BR",{minimumFractionDigits:2}) : ""; };
  ov.querySelector("#inatOk").onclick = ()=>{
    const motivo = ov.querySelector('input[name="inatMot"]:checked').value;
    const m = MOTIVOS.find(x=> x.id===motivo);
    const dig = valor.value.replace(/\D/g,"");
    const obs = ov.querySelector("#inatObs").value.trim();
    if(motivo==="outro" && !obs){ UI.toast("Descreva o motivo na observação.","err"); ov.querySelector("#inatObs").focus(); return; }
    const me = UI.currentUser;
    const patch = {ativo:false, publicado:false, destaque:false, despublicadoEm:new Date().toISOString(),
      statusComercial: m.status || (i.statusComercial==="Vendido"||i.statusComercial==="Alugado" ? "Disponível" : (i.statusComercial||"Disponível")),
      inativacao:{motivo, data: ov.querySelector("#inatData").value || hoje, valorFechado: dig ? Number(dig)/100 : null, obs, por: me ? me.id : null}};
    UI.closeOverlay("inatOverlay");
    aoConfirmar(patch);
  };
  UI.openOverlay("inatOverlay");
}
function patchReativar(){ return {ativo:true, statusComercial:"Disponível", inativacao:null}; }

// cópia nasce como rascunho, com cópias independentes das fotos/plantas
async function duplicar(id){
  const MID = window.SoluaMidia, o = DB.getImovel(id); if(!o) return null;
  const c = JSON.parse(JSON.stringify(o));
  ["id","codigo","criadoEm","atualizadoEm","despublicadoEm","inativacao"].forEach(k=> delete c[k]);
  Object.assign(c, {titulo:(o.titulo||"Imóvel")+" (cópia)", publicado:false, destaque:false, ativo:true, statusComercial:"Disponível", arquivos:[]});
  c.fotos = await Promise.all((o.fotos||[]).map(MID.copiar));
  c.plantas = await Promise.all((o.plantas||[]).map(async p=> Object.assign({}, p, {ref: await MID.copiar(p.ref)})));
  return DB.addImovel(c);
}
function excluir(id, aoExcluir){
  const UI = window.SoluaUI, MID = window.SoluaMidia, i = DB.getImovel(id); if(!i) return;
  const nLeads = DB.leadsDoImovel(id).length;
  UI.confirmAction(`Excluir ${i.codigo} — "${i.titulo||"sem título"}" definitivamente? Fotos, plantas e arquivos são apagados.${nLeads?` Os ${nLeads} lead(s) vinculados continuam no CRM.`:""} Se foi vendido ou locado, prefira “Inativar” — mantém o histórico.`, ()=>{
    [...(i.fotos||[]), ...(i.plantas||[]).map(p=>p.ref), ...(i.arquivos||[]).map(a=>a.ref)].forEach(MID.remover);
    DB.getLeads().filter(l=>l.imovelId===id).forEach(l=> DB.updateLead(l.id, {imovelId:null}));
    DB.deleteImovel(id);
    UI.toast("Imóvel excluído.","err");
    if(aoExcluir) aoExcluir();
  });
}

// ícones de traço (mesmo desenho dos outros ícones do CRM)
const ICONES = {
  editar:`<path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>`,
  duplicar:`<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>`,
  abrir:`<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>`,
  lixeira:`<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>`,
  mais:`<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>`,
  esquerda:`<path d="M15 5l-7 7 7 7"/>`,
  direita:`<path d="M9 5l7 7-7 7"/>`,
  estrela:`<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8z"/>`,
  x:`<path d="M6 6l12 12M18 6L6 18"/>`,
  pausa:`<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>`,
  power:`<path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1011.4 0"/>`,
  whats:`<path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1L4 20z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8A4 4 0 0110.7 11l.8-1-1-2L9 9.5z"/>`,
  venda:`<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M12 12v5M10 13.5c0-1 .9-1.5 2-1.5s2 .5 2 1.3c0 1.9-4 .9-4 2.9 0 .8.9 1.3 2 1.3s2-.5 2-1.5"/>`,
  locacao:`<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>`,
  ambos:`<path d="M7 7h11l-3-3M17 17H6l3 3"/>`
};
function ico(nome){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]||""}</svg>`; }

// --------------------------------------------------------- máscaras
function mascaraFone(el){
  const v = el.value.replace(/\D/g,"").slice(0,11);
  el.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v;
}
function mascaraDoc(el, pj){
  const v = el.value.replace(/\D/g,"").slice(0, pj?14:11);
  el.value = pj
    ? v.replace(/^(\d{2})(\d)/,"$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3").replace(/\.(\d{3})(\d)/,".$1/$2").replace(/(\d{4})(\d)/,"$1-$2")
    : v.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2");
}
function linkWhats(fone){ const d = String(fone||"").replace(/\D/g,""); return d.length>=10 ? `https://wa.me/55${d}` : ""; }

// ------------------------------------------- modal de proprietário
// editarProprietario(id|null, aoSalvar(proprietario), prefill)
function editarProprietario(id, aoSalvar, prefill){
  const UI = window.SoluaUI, esc = DB.esc;
  const p = id ? DB.getProprietario(id) : Object.assign({nome:"", tipoPessoa:"PF"}, prefill||{});
  let ov = document.getElementById("propOverlay");
  if(!ov){
    ov = document.createElement("div");
    ov.className = "overlay modal-center"; ov.id = "propOverlay";
    document.body.appendChild(ov);
  }
  const pj = p.tipoPessoa==="PJ";
  ov.innerHTML = `<div class="modal" style="width:min(620px,94vw)" role="dialog" aria-modal="true" aria-labelledby="propTitulo">
    <div class="modal-hd"><h3 style="font-size:18px" id="propTitulo">${id?"Editar proprietário":"Novo proprietário"}</h3><button class="x" data-close-overlay="propOverlay" aria-label="Fechar"></button></div>
    <div class="modal-bd">
      <div class="seg" id="pTipo" role="radiogroup" aria-label="Tipo de pessoa" style="margin-bottom:16px">
        <button type="button" data-v="PF" class="${pj?"":"on"}">Pessoa física</button><button type="button" data-v="PJ" class="${pj?"on":""}">Pessoa jurídica</button>
      </div>
      <div class="grid2">
        <div class="field full"><label for="pNome">${pj?"Razão social":"Nome completo"}<span class="req">*</span></label><input id="pNome" value="${esc(p.nome||"")}"></div>
        <div class="field"><label for="pDoc">${pj?"CNPJ":"CPF"}<span class="opc">(opcional)</span></label><input id="pDoc" inputmode="numeric" value="${esc(p.documento||"")}"></div>
        <div class="field"><label for="pTel">Telefone / WhatsApp<span class="req">*</span></label><input id="pTel" inputmode="tel" value="${esc(p.telefone||"")}" placeholder="(19) 90000-0000"></div>
        <div class="field"><label for="pTel2">Outro telefone<span class="opc">(opcional)</span></label><input id="pTel2" inputmode="tel" value="${esc(p.telefone2||"")}"></div>
        <div class="field"><label for="pEmail">E-mail<span class="opc">(opcional)</span></label><input id="pEmail" type="email" value="${esc(p.email||"")}"></div>
        <div class="field full"><label for="pEnd">Endereço para correspondência<span class="opc">(opcional)</span></label><input id="pEnd" value="${esc(p.endereco||"")}"></div>
        <div class="field full"><label for="pPix">Chave PIX / dados para repasse<span class="opc">(opcional)</span></label><input id="pPix" value="${esc(p.pix||"")}" placeholder="Usado nos repasses de aluguel"></div>
        <div class="field full"><label for="pObs">Observações<span class="opc">(opcional)</span></label><textarea id="pObs" rows="2">${esc(p.observacoes||"")}</textarea></div>
      </div>
    </div>
    <div class="modal-ft"><button class="btn ghost sm" data-close-overlay="propOverlay">Cancelar</button><button class="btn dark sm" id="pSalvar">${id?"Salvar":"Cadastrar proprietário"}</button></div>
  </div>`;
  let tipo = p.tipoPessoa || "PF";
  ov.querySelectorAll("#pTipo button").forEach(b=> b.onclick = ()=>{
    tipo = b.dataset.v;
    ov.querySelectorAll("#pTipo button").forEach(x=> x.classList.toggle("on", x===b));
    ov.querySelector('label[for="pNome"]').firstChild.textContent = tipo==="PJ" ? "Razão social" : "Nome completo";
    ov.querySelector('label[for="pDoc"]').firstChild.textContent = tipo==="PJ" ? "CNPJ" : "CPF";
    const doc = ov.querySelector("#pDoc"); doc.value = "";
  });
  ov.querySelector("#pDoc").oninput = e=> mascaraDoc(e.target, tipo==="PJ");
  ov.querySelector("#pTel").oninput = e=> mascaraFone(e.target);
  ov.querySelector("#pTel2").oninput = e=> mascaraFone(e.target);
  ov.querySelector("#pSalvar").onclick = ()=>{
    const dados = {
      tipoPessoa: tipo,
      nome: ov.querySelector("#pNome").value.trim(),
      documento: ov.querySelector("#pDoc").value.trim(),
      telefone: ov.querySelector("#pTel").value.trim(),
      telefone2: ov.querySelector("#pTel2").value.trim(),
      email: ov.querySelector("#pEmail").value.trim(),
      endereco: ov.querySelector("#pEnd").value.trim(),
      pix: ov.querySelector("#pPix").value.trim(),
      observacoes: ov.querySelector("#pObs").value.trim()
    };
    if(dados.nome.length<2){ UI.toast("Informe o nome do proprietário.","err"); ov.querySelector("#pNome").focus(); return; }
    if(dados.telefone.replace(/\D/g,"").length<10){ UI.toast("Informe um telefone com DDD.","err"); ov.querySelector("#pTel").focus(); return; }
    const salvo = id ? DB.updateProprietario(id, dados) : DB.addProprietario(dados);
    UI.closeOverlay("propOverlay");
    UI.toast(id ? "Proprietário atualizado." : "Proprietário cadastrado.","ok");
    if(aoSalvar) aoSalvar(salvo);
  };
  UI.openOverlay("propOverlay");
  setTimeout(()=> ov.querySelector("#pNome").focus(), 60);
}

window.SoluaImovel = { FINALIDADE, FASE, SEM_COMODOS, SITUACOES, MOTIVOS, qualidade, pendenciasPublicacao, situacao, patchSituacao,
  inativo, abrirInativar, patchReativar, rotuloInativacao, ico, duplicar, excluir,
  editarProprietario, mascaraFone, mascaraDoc, linkWhats, preco: i=> DB.precoImovelTexto(i) };
})();
