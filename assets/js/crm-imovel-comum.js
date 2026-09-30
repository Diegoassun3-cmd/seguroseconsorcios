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
  {id:"alugado",       label:"Alugado",         cor:"#004BA5", fundo:"#E6EEF8"},
  {id:"rascunho",      label:"Rascunho",        cor:"#8a8f98", fundo:"#EFEDEA"}
];
const SIT = Object.fromEntries(SITUACOES.map(s=>[s.id,s]));
function situacao(i){
  const sc = i.statusComercial;
  if(sc==="Vendido") return SIT.vendido;
  if(sc==="Alugado") return SIT.alugado;
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
  if(id==="vendido") return {statusComercial:"Vendido", publicado:false, destaque:false, despublicadoEm:agora};
  if(id==="alugado") return {statusComercial:"Alugado", publicado:false, destaque:false, despublicadoEm:agora};
  return {};
}

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

window.SoluaImovel = { FINALIDADE, FASE, SEM_COMODOS, SITUACOES, qualidade, pendenciasPublicacao, situacao, patchSituacao,
  editarProprietario, mascaraFone, mascaraDoc, linkWhats, preco: i=> DB.precoImovelTexto(i) };
})();
