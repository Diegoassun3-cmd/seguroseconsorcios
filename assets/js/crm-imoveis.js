/* ===========================================================
   Solua CRM — Gestão de imóveis
   Página: crm/imoveis-cadastro.html (editor em imovel-editor.html)

   Filtros na lateral (com filtros favoritos salvos por usuário),
   status no topo, cards com a faixa colorida da situação do anúncio
   e troca de situação direto no card. Os filtros ficam guardados no
   navegador, então voltar do editor mantém a busca.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB, UI = window.SoluaUI, IM = window.SoluaImovel, MID = window.SoluaMidia;
const esc = DB.esc;
const ME = UI.currentUser || {id:"anon"};
const K_FILTROS = "solua_gi_filtros", K_FAVS = "solua_gi_favs_" + ME.id, K_VISTA = "solua_im_vista", K_OUTROS = "solua_gi_outros";

const VAZIO = {q:"", status:[], finalidade:"", tipo:"", angariador:"", proprietario:"", bairro:"", chave:"",
  precoMin:null, precoMax:null, quartos:0, vagas:0, areaMin:null, comLeads:false, destaque:false, exclusividade:false, semFotos:false};
function ler(k, padrao){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; }catch(e){ return padrao; } }
function gravar(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
let F = Object.assign({}, VAZIO, ler(K_FILTROS, {}));
let vista = ler(K_VISTA, "cards"); if(vista!=="cards" && vista!=="tabela") vista = "cards";
let ordem = "recentes";
let outrosAbertos = ler(K_OUTROS, true);
let salvandoFav = false;

const n = v => Number(v)||0;
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICO = {
  casa:svg(`<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>`),
  olho:svg(`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`),
  pausa:svg(`<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>`),
  pessoas:svg(`<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c2.3.2 4 1.9 4.5 4.6"/>`),
  foto:svg(`<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>`),
  cal:svg(`<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>`),
  att:svg(`<path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4"/>`),
  cama:svg(`<path d="M3 18v-8M21 18v-5a3 3 0 00-3-3h-8v5M3 15h18"/><circle cx="6.5" cy="11.5" r="1.5"/>`),
  banho:svg(`<path d="M4 12h16v2a5 5 0 01-5 5H9a5 5 0 01-5-5v-2zM6 12V6a2 2 0 014 0M7 19l-1 2M17 19l1 2"/>`),
  carro:svg(`<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 11h10"/><circle cx="7.5" cy="14" r=".6"/><circle cx="16.5" cy="14" r=".6"/>`),
  regua:svg(`<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4"/>`),
  area:svg(`<path d="M4 20V4l16 16H4z"/><path d="M8 16v-4l4 4H8z"/>`),
  estrela:svg(`<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8z"/>`),
  chev:svg(`<path d="M6 9l6 6 6-6"/>`),
  x:svg(`<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>`),
  busca:`<svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M17 17l-4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
};

// ------------------------------------------------------------ dados
function precoVenda(i){ return i.precoVenda!=null ? n(i.precoVenda) : (i.finalidade!=="locacao" ? n(i.valor) : 0); }
function precoLocacao(i){ return i.precoLocacao!=null ? n(i.precoLocacao) : (i.finalidade==="locacao" ? n(i.valor) : 0); }
function angariadoresDe(i){ return (i.angariadores||[]).map(a=> DB.getUsuario(a.usuarioId)).filter(Boolean); }
function endereco(i){
  const e = i.endereco || {};
  const rua = [e.logradouro, e.numero].filter(Boolean).join(", ") + (e.complemento ? `, ${e.complemento}` : "");
  return [rua, i.bairro].filter(Boolean).join(" - ") || "Endereço não informado";
}
function dataCurta(iso){ return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; }
function dataHora(iso){ if(!iso) return "—"; const d = new Date(iso); return d.toLocaleDateString("pt-BR") + "-" + d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }

function passa(i, f, ignorarStatus){
  if(!ignorarStatus && f.status.length && !f.status.includes(IM.situacao(i).id)) return false;
  if(f.finalidade && !(i.finalidade===f.finalidade || i.finalidade==="venda_locacao")) return false;
  if(f.tipo && i.tipo!==f.tipo) return false;
  if(f.angariador && !(i.angariadores||[]).some(a=> a.usuarioId===f.angariador)) return false;
  if(f.proprietario==="__sem" ? !!i.proprietarioId : (f.proprietario && i.proprietarioId!==f.proprietario)) return false;
  if(f.bairro && i.bairro!==f.bairro) return false;
  if(f.chave && (i.localChaves||"")!==f.chave) return false;
  const preco = i.finalidade==="locacao" ? precoLocacao(i) : precoVenda(i);
  if(f.precoMin!=null && preco < f.precoMin) return false;
  if(f.precoMax!=null && preco > f.precoMax) return false;
  if(f.quartos && n(i.quartos) < f.quartos) return false;
  if(f.vagas && n(i.vagas) < f.vagas) return false;
  if(f.areaMin && n(i.areaM2) < f.areaMin) return false;
  if(f.comLeads && !DB.leadsDoImovel(i.id).length) return false;
  if(f.destaque && !i.destaque) return false;
  if(f.exclusividade && !(i.exclusividade && i.exclusividade.ativa)) return false;
  if(f.semFotos && (i.fotos||[]).length) return false;
  if(f.q){
    const t = f.q.toLowerCase();
    const prop = i.proprietarioId ? DB.getProprietario(i.proprietarioId) : null;
    const campos = [i.codigo, i.titulo, i.bairro, i.cidade, i.tipo, (i.endereco||{}).logradouro, (i.endereco||{}).condominio, prop && prop.nome, ...(i.etiquetas||[])];
    if(!campos.some(v=> (v||"").toLowerCase().includes(t))) return false;
  }
  return true;
}
const ORDENS = {
  recentes:   (a,b)=> (b.criadoEm||"").localeCompare(a.criadoEm||"") || (b.codigo||"").localeCompare(a.codigo||""),
  atualizados:(a,b)=> (b.atualizadoEm||"").localeCompare(a.atualizadoEm||""),
  menorPreco: (a,b)=> (a.valor||0) - (b.valor||0),
  maiorPreco: (a,b)=> (b.valor||0) - (a.valor||0),
  codigo:     (a,b)=> (a.codigo||"").localeCompare(b.codigo||"")
};
function resultado(){ return DB.getImoveis().filter(i=> passa(i, F)).sort(ORDENS[ordem]); }
function qtdFiltrosAtivos(f){
  return Object.keys(VAZIO).filter(k=> k!=="q" && k!=="status" && JSON.stringify(f[k])!==JSON.stringify(VAZIO[k])).length;
}

// ------------------------------------------------------------ KPIs
function renderKpis(){
  const todos = DB.getImoveis();
  const conta = id => todos.filter(i=> IM.situacao(i).id===id).length;
  const leads = todos.reduce((s,i)=> s + DB.leadsDoImovel(i.id).length, 0);
  const semProp = todos.filter(i=> !i.proprietarioId).length;
  document.getElementById("imKpis").innerHTML = `
    <div class="kpi accent"><span class="kpi-ico">${ICO.casa}</span><span class="lbl">Imóveis cadastrados</span><b>${todos.length}</b><span class="delta"><span class="chip">${conta("em_anuncio")}</span> em anúncio no site</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.pausa}</span><span class="lbl">Pausados e rascunhos</span><b>${conta("pausado")+conta("rascunho")}</b><span class="delta"><span class="chip neutro">${conta("rascunho")} rascunho${conta("rascunho")===1?"":"s"}</span> incompletos</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.pessoas}</span><span class="lbl">Leads vinculados</span><b>${leads}</b><span class="delta"><span class="chip neutro">${todos.filter(i=>DB.leadsDoImovel(i.id).length).length}</span> imóveis com interessados</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.olho}</span><span class="lbl">Sem proprietário</span><b>${semProp}</b><span class="delta"><span class="chip ${semProp?"baixa":""}">${DB.getProprietarios().length}</span> proprietários cadastrados</span></div>`;
}

// ------------------------------------------------------- filtros (lateral)
function opts(lista, atual, vazio){ return `<option value="">${vazio}</option>` + lista.map(([v,l])=>`<option value="${esc(v)}" ${String(atual)===String(v)?"selected":""}>${esc(l)}</option>`).join(""); }
function pills(chave, valores){
  return `<div class="gi-pills" role="radiogroup">${valores.map(v=>`<button type="button" role="radio" aria-checked="${F[chave]===v}" class="${F[chave]===v?"on":""}" data-pill="${chave}" data-v="${v}">${v? v+"+" : "Todos"}</button>`).join("")}</div>`;
}
const fmtMoney = v => v==null ? "" : Number(v).toLocaleString("pt-BR",{minimumFractionDigits:0, maximumFractionDigits:0});
function renderFiltros(){
  const todos = DB.getImoveis();
  const bairros = [...new Set(todos.map(i=>i.bairro).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const chaves = [...new Set(todos.map(i=>i.localChaves).filter(Boolean))].sort();
  const eq = DB.getEquipe();
  const favs = ler(K_FAVS, []);
  const ativos = qtdFiltrosAtivos(F);
  document.getElementById("giFiltros").innerHTML = `
    <div class="gi-f-hd"><h3>Filtros</h3>${ativos?`<span class="badge seguro">${ativos} ativo${ativos===1?"":"s"}</span>`:""}
      <button type="button" class="btn soft sm gi-f-toggle" id="giFecharFiltros" aria-label="Fechar filtros">Fechar</button></div>
    <label class="card-search gi-busca">${ICO.busca}<input id="giQ" value="${esc(F.q)}" placeholder="Busque por código, endereço, proprietário…" aria-label="Buscar imóveis"></label>

    <div class="gi-bloco">
      <div class="gi-bloco-hd"><span class="gi-est">${ICO.estrela}</span><b>Favoritos</b></div>
      ${favs.length ? `<div class="gi-favs">${favs.map((f,ix)=>`<span class="gi-fav"><button type="button" data-fav="${ix}" title="Aplicar este filtro">${esc(f.nome)}</button><button type="button" class="rm" data-rmfav="${ix}" aria-label="Remover favorito ${esc(f.nome)}">×</button></span>`).join("")}</div>`
        : `<p class="gi-vazio">Você não tem filtros favoritos. Salve os que usa mais para agilizar sua busca.</p>`}
      ${salvandoFav ? `<div class="inline-btn gi-favform"><input id="giFavNome" placeholder="Nome do filtro (ex.: Casas até 500 mil)" maxlength="40"><button type="button" class="btn dark sm" id="giFavSalvar">Salvar</button></div>`
        : `<button type="button" class="btn ghost sm" id="giFavAdd" style="margin-top:10px">+ Salvar filtro atual</button>`}
    </div>

    <div class="gi-bloco">
      <div class="gi-bloco-hd"><b>Outros filtros</b><button type="button" class="link" id="giOutros" aria-expanded="${outrosAbertos}">${outrosAbertos?"Ocultar":"Mostrar"}</button></div>
      ${outrosAbertos ? `
      <h5>Negócio</h5>
      <div class="seg gi-seg">${[["","Todos"],["venda","Venda"],["locacao","Locação"]].map(([v,l])=>`<button type="button" class="${F.finalidade===v?"on":""}" data-fin="${v}">${l}</button>`).join("")}</div>
      <div class="field"><label for="giTipo">Tipo do imóvel</label><select id="giTipo" data-f="tipo">${opts(DB.TIPOS.imovel.map(t=>[t,t]), F.tipo, "Todos os tipos")}</select></div>

      <h5>Responsáveis</h5>
      <p class="gi-ajuda">Quem está vinculado ao imóvel</p>
      <div class="field"><label for="giAng">Angariador</label><select id="giAng" data-f="angariador">${opts(eq.map(u=>[u.id,u.nome]), F.angariador, "Qualquer angariador")}</select></div>
      <div class="field"><label for="giProp">Proprietário</label><select id="giProp" data-f="proprietario">${opts([["__sem","— Sem proprietário vinculado —"], ...DB.getProprietarios().map(p=>[p.id,p.nome])], F.proprietario, "Qualquer proprietário")}</select></div>

      <h5>Localização</h5>
      <div class="field"><label for="giBairro">Bairro</label><select id="giBairro" data-f="bairro">${opts(bairros.map(b=>[b,b]), F.bairro, "Todos os bairros")}</select></div>

      <h5>Valores</h5>
      <div class="grid2" style="gap:10px">
        <div class="field"><label for="giPmin">Preço mín.</label><div class="money"><span>R$</span><input id="giPmin" data-money="precoMin" inputmode="numeric" value="${fmtMoney(F.precoMin)}" placeholder="0"></div></div>
        <div class="field"><label for="giPmax">Preço máx.</label><div class="money"><span>R$</span><input id="giPmax" data-money="precoMax" inputmode="numeric" value="${fmtMoney(F.precoMax)}" placeholder="sem limite"></div></div>
      </div>

      <h5>Características</h5>
      <div class="field"><label>Dormitórios</label>${pills("quartos",[0,1,2,3,4])}</div>
      <div class="field"><label>Vagas</label>${pills("vagas",[0,1,2,3])}</div>
      <div class="field"><label for="giArea">Área útil mínima (m²)</label><input id="giArea" data-num="areaMin" inputmode="numeric" value="${F.areaMin||""}" placeholder="Ex.: 80"></div>

      <h5>Mais</h5>
      ${chaves.length ? `<div class="field"><label for="giChave">Local das chaves</label><select id="giChave" data-f="chave">${opts(chaves.map(c=>[c,c]), F.chave, "Qualquer local")}</select></div>` : ""}
      <div class="gi-checks">
        ${[["comLeads","Com leads interessados"],["destaque","Em destaque na home"],["exclusividade","Com exclusividade"],["semFotos","Sem fotos"]].map(([k,l])=>
          `<label><input type="checkbox" data-bool="${k}" ${F[k]?"checked":""}> ${l}</label>`).join("")}
      </div>` : ""}
    </div>
    <div class="gi-f-ft"><button type="button" class="link" id="giLimpar">Limpar todos</button><span class="gi-total" id="giTotalF"></span></div>`;
}

// ------------------------------------------------------ topo dos resultados
let statusAberto = false;
function renderTopo(itens){
  const base = DB.getImoveis().filter(i=> passa(i, F, true));
  const chips = [];
  const add = (txt, limpar)=> chips.push(`<span class="gi-chip">${esc(txt)}<button type="button" data-limpa="${limpar}" aria-label="Remover filtro ${esc(txt)}">×</button></span>`);
  if(F.q) add(`“${F.q}”`, "q");
  if(F.finalidade) add(IM.FINALIDADE[F.finalidade], "finalidade");
  if(F.tipo) add(F.tipo, "tipo");
  if(F.angariador){ const u = DB.getUsuario(F.angariador); add("Angariador: "+(u?u.nome.split(" ")[0]:"?"), "angariador"); }
  if(F.proprietario){ const p = F.proprietario==="__sem" ? null : DB.getProprietario(F.proprietario); add(F.proprietario==="__sem" ? "Sem proprietário" : "Proprietário: "+(p?p.nome:"?"), "proprietario"); }
  if(F.bairro) add(F.bairro, "bairro");
  if(F.chave) add("Chaves: "+F.chave, "chave");
  if(F.precoMin!=null) add("A partir de R$ "+fmtMoney(F.precoMin), "precoMin");
  if(F.precoMax!=null) add("Até R$ "+fmtMoney(F.precoMax), "precoMax");
  if(F.quartos) add(F.quartos+"+ dorm.", "quartos");
  if(F.vagas) add(F.vagas+"+ vagas", "vagas");
  if(F.areaMin) add(F.areaMin+"+ m²", "areaMin");
  [["comLeads","Com leads"],["destaque","Destaque"],["exclusividade","Exclusividade"],["semFotos","Sem fotos"]].forEach(([k,l])=>{ if(F[k]) add(l, k); });

  document.getElementById("giTopo").innerHTML = `
    <div class="gi-barra">
      <button type="button" class="btn ghost gi-f-toggle" id="giAbrirFiltros">Filtros${qtdFiltrosAtivos(F)?` · ${qtdFiltrosAtivos(F)}`:""}</button>
      <div class="gi-status-wrap">
        <button type="button" class="gi-status ${F.status.length?"ativo":""}" id="giStatusBtn" aria-haspopup="true" aria-expanded="${statusAberto}">
          Status ${F.status.length?`<span class="gi-num">${F.status.length}</span>`:""}<span class="gi-chev">${ICO.chev}</span></button>
        ${F.status.length ? `<button type="button" class="gi-status-x" data-limpa="status" aria-label="Limpar filtro de status">${ICO.x}</button>` : ""}
        ${statusAberto ? `<div class="gi-pop" id="giStatusPop" role="menu">${IM.SITUACOES.map(s=>{
          const qtd = base.filter(i=> IM.situacao(i).id===s.id).length;
          return `<label class="gi-pop-it"><input type="checkbox" data-st="${s.id}" ${F.status.includes(s.id)?"checked":""}><i style="background:${s.cor}"></i>${s.label}<em>${qtd}</em></label>`;
        }).join("")}</div>` : ""}
      </div>
      ${chips.join("")}
      <span class="spacer"></span>
      <select class="card-select" id="giOrdem" aria-label="Ordenar">
        ${[["recentes","Mais recentes"],["atualizados","Atualizados recentemente"],["menorPreco","Menor preço"],["maiorPreco","Maior preço"],["codigo","Código"]].map(([v,l])=>`<option value="${v}" ${ordem===v?"selected":""}>${l}</option>`).join("")}
      </select>
      <div class="seg" role="group" aria-label="Modo de exibição">
        <button type="button" data-vista="cards" class="${vista==="cards"?"on":""}">Cards</button>
        <button type="button" data-vista="tabela" class="${vista==="tabela"?"on":""}">Tabela</button>
      </div>
    </div>
    <h2 class="gi-count">${itens.length} imóve${itens.length===1?"l":"is"} encontrado${itens.length===1?"":"s"}.</h2>`;
}

// ---------------------------------------------------------- cards
function sitPill(i){
  const s = IM.situacao(i);
  return `<button type="button" class="sit-pill" data-sit="${i.id}" style="color:${s.cor};background:${s.fundo}" aria-haspopup="true" title="Mudar situação">${s.label}<span>${ICO.chev}</span></button>`;
}
function specs(i){
  const it = [];
  if(!IM.SEM_COMODOS.has(i.tipo)){
    if(n(i.quartos)) it.push([ICO.cama, n(i.quartos), "dormitórios"]);
    if(n(i.banheiros)) it.push([ICO.banho, n(i.banheiros), "banheiros"]);
  }
  if(n(i.vagas)) it.push([ICO.carro, n(i.vagas), "vagas"]);
  if(n(i.areaM2)) it.push([ICO.regua, `${n(i.areaM2)} m²`, "área útil"]);
  if(n(i.areaTotal)) it.push([ICO.area, `${n(i.areaTotal)} m²`, "área total"]);
  return it.map(([ic,v,t])=>`<span title="${t}">${ic}${v}</span>`).join("");
}
function acoes(i){
  return `<button class="btn icon soft sm" data-edit="${i.id}" title="Editar" aria-label="Editar ${esc(i.codigo)}">✎</button>
    <button class="btn icon soft sm" data-dup="${i.id}" title="Duplicar" aria-label="Duplicar ${esc(i.codigo)}">⧉</button>
    ${DB.estaPublicado(i) ? `<a class="btn icon soft sm" href="../imovel.html?id=${encodeURIComponent(i.id)}" target="_blank" rel="noopener" title="Ver no site" aria-label="Ver ${esc(i.codigo)} no site">↗</a>` : ""}
    <button class="btn icon soft sm" data-del="${i.id}" title="Excluir" aria-label="Excluir ${esc(i.codigo)}">✕</button>`;
}
function cardHtml(i){
  const s = IM.situacao(i);
  const capa = (i.fotos||[])[0];
  const angs = angariadoresDe(i);
  const prop = i.proprietarioId ? DB.getProprietario(i.proprietarioId) : null;
  const nLeads = DB.leadsDoImovel(i.id).length;
  const q = IM.qualidade(i);
  const pv = precoVenda(i), pl = precoLocacao(i);
  return `<article class="gi-card" style="--sit:${s.cor}" data-card="${i.id}">
    <div class="gi-foto" ${capa?`data-midia="${esc(capa)}" style="background-image:url('${esc(MID.srcInicial(capa))}')"`:""}>
      ${capa?"":`<span class="gi-semfoto">${ICO.foto}</span>`}
      ${sitPill(i)}
      <span class="gi-nfotos">${ICO.foto}${(i.fotos||[]).length}</span>
    </div>
    <div class="gi-info">
      <div class="gi-datas"><span title="Cadastrado em">${ICO.cal}${dataCurta(i.criadoEm)}</span><span title="Última atualização">${ICO.att}${dataHora(i.atualizadoEm)}</span>${i.destaque?`<span class="gi-dest">★ Destaque</span>`:""}</div>
      <h3 class="gi-tit"><a href="imovel-editor.html?id=${encodeURIComponent(i.id)}">${esc(i.titulo || "Sem título")}</a></h3>
      <div class="gi-cod">${esc(i.codigo||"")} / SOLUA · ${esc(i.tipo)} · ${IM.FINALIDADE[i.finalidade]||""}</div>
      <div class="gi-end"><span>Endereço:</span> <b>${esc(endereco(i))}</b></div>
      <div class="gi-specs">${specs(i)}</div>
    </div>
    <div class="gi-lado">
      <div><small>Angariador</small><b>${angs.length ? esc(angs[0].nome) + (angs.length>1?` +${angs.length-1}`:"") : "—"}</b></div>
      <div><small>Venda:</small><b>${i.finalidade==="locacao" ? "—" : (pv ? DB.formatBRL(pv) : "Sem informação")}</b></div>
      <div><small>Proprietário</small><b>${prop ? esc(prop.nome) : `<span class="gi-falta">Não vinculado</span>`}</b></div>
      <div><small>Locação:</small><b>${i.finalidade==="venda" ? "—" : (pl ? DB.formatBRL(pl)+"/mês" : "Sem informação")}</b></div>
      <div><small>Chave:</small><b>${esc(i.localChaves || "—")}</b></div>
      <div><small>Leads:</small><b>${nLeads}</b></div>
      <div class="gi-rodape">
        <span class="gi-q" title="Qualidade do anúncio"><span class="qbar"><i style="width:${q.pct}%;background:${q.cor}"></i></span>${q.pct}%</span>
        <span class="gi-acoes">${acoes(i)}</span>
      </div>
    </div>
  </article>`;
}
function linhaHtml(i){
  const s = IM.situacao(i);
  const capa = (i.fotos||[])[0];
  const q = IM.qualidade(i);
  const prop = i.proprietarioId ? DB.getProprietario(i.proprietarioId) : null;
  return `<tr data-edit="${i.id}">
    <td><div class="namecell"><span class="im-thumb" ${capa?`data-midia="${esc(capa)}" style="background-image:url('${esc(MID.srcInicial(capa))}')"`:""}></span>
      <div><b>${esc(i.titulo||"Sem título")}</b><span>${esc(i.codigo||"")} · ${esc(i.bairro||"—")}</span></div></div></td>
    <td>${sitPill(i)}</td>
    <td>${esc(i.tipo)}</td>
    <td style="white-space:nowrap">${esc(IM.preco(i))}</td>
    <td>${prop?esc(prop.nome):"—"}</td>
    <td><span style="display:flex;align-items:center;gap:8px"><span class="qbar"><i style="width:${q.pct}%;background:${q.cor}"></i></span><span class="qtxt">${q.pct}%</span></span></td>
    <td>${DB.leadsDoImovel(i.id).length}</td>
    <td class="rowactions">${acoes(i)}</td>
  </tr>`;
}

function renderLista(itens){
  const el = document.getElementById("imLista");
  const total = DB.getImoveis().length;
  if(!itens.length){
    el.innerHTML = `<div class="card"><div class="empty">${UI.emptyState(total ? "Nenhum imóvel com esses filtros." : "Nenhum imóvel cadastrado ainda.")}
      ${total ? `<button type="button" class="btn ghost" style="margin-top:16px" data-limpa="tudo">Limpar filtros</button>` : `<a class="btn dark" style="margin-top:16px" href="imovel-editor.html">+ Cadastrar o primeiro imóvel</a>`}</div></div>`;
    return;
  }
  el.innerHTML = vista==="tabela"
    ? `<div class="card" style="padding:12px"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Imóvel</th><th>Situação</th><th>Tipo</th><th>Preço</th><th>Proprietário</th><th>Qualidade</th><th>Leads</th><th></th></tr></thead><tbody>${itens.map(linhaHtml).join("")}</tbody></table></div></div>`
    : `<div class="gi-lista">${itens.map(cardHtml).join("")}</div>`;
  MID.hidratar(el);
}

function render(foco){
  gravar(K_FILTROS, F);
  const itens = resultado();
  renderKpis();
  renderFiltros();
  renderTopo(itens);
  renderLista(itens);
  const t = document.getElementById("giTotalF"); if(t) t.textContent = `${itens.length} resultado${itens.length===1?"":"s"}`;
  if(foco){ const el = document.getElementById(foco); if(el){ el.focus(); if(el.setSelectionRange){ const L = el.value.length; el.setSelectionRange(L,L); } } }
}
// lista + topo, sem redesenhar o painel (não perde o foco de quem está digitando)
function renderResultados(){
  gravar(K_FILTROS, F);
  const itens = resultado();
  renderTopo(itens); renderLista(itens);
  const t = document.getElementById("giTotalF"); if(t) t.textContent = `${itens.length} resultado${itens.length===1?"":"s"}`;
}

// ------------------------------------------------------ situação no card
function abrirMenuSituacao(btn, id){
  fecharMenuSituacao();
  const i = DB.getImovel(id); if(!i) return;
  const atual = IM.situacao(i).id;
  const menu = document.createElement("div");
  menu.className = "tb-menu sit-menu"; menu.setAttribute("role","menu");
  menu.innerHTML = IM.SITUACOES.filter(s=> s.id!=="rascunho").map(s=>
    `<a href="#" role="menuitem" data-set-sit="${s.id}" class="${s.id===atual?"on":""}"><span class="sit-dot" style="background:${s.cor}"></span><span><b>${s.label}</b><small>${({em_anuncio:"Aparece no site", pausado:"Sai do site, continua no CRM", reservado:"Negócio encaminhado", em_negociacao:"Proposta em andamento", vendido:"Sai do site", alugado:"Sai do site"})[s.id]}</small></span></a>`).join("");
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = Math.min(r.bottom + 8, innerHeight - menu.offsetHeight - 10) + "px";
  menu.style.left = Math.max(10, Math.min(r.left, innerWidth - menu.offsetWidth - 10)) + "px";
  menu.addEventListener("click", e=>{
    const a = e.target.closest("[data-set-sit]"); if(!a) return;
    e.preventDefault();
    const patch = IM.patchSituacao(i, a.dataset.setSit);
    fecharMenuSituacao();
    if(patch.erro){
      UI.confirmAction(`Para colocar em anúncio ainda falta: ${patch.erro.slice(0,6).join(", ")}${patch.erro.length>6?"…":""}. Abrir o cadastro para completar?`,
        ()=>{ location.href = "imovel-editor.html?id="+encodeURIComponent(id); });
      return;
    }
    DB.updateImovel(id, patch);
    UI.toast(`${i.codigo}: ${IM.situacao(DB.getImovel(id)).label}.`,"ok");
    render();
  });
  menuSit = menu;
  const primeiro = menu.querySelector("a"); if(primeiro) primeiro.focus();
}
let menuSit = null;
function fecharMenuSituacao(){ if(menuSit){ menuSit.remove(); menuSit = null; } }

// -------------------------------------------------------- duplicar/excluir
function abrir(id){ location.href = "imovel-editor.html?id="+encodeURIComponent(id); }
async function duplicar(id){
  const o = DB.getImovel(id); if(!o) return;
  const copia = JSON.parse(JSON.stringify(o));
  ["id","codigo","criadoEm","atualizadoEm","despublicadoEm"].forEach(k=> delete copia[k]);
  copia.titulo = (o.titulo||"Imóvel") + " (cópia)";
  copia.publicado = false; copia.destaque = false; copia.statusComercial = "Disponível";
  copia.fotos = await Promise.all((o.fotos||[]).map(MID.copiar));
  copia.plantas = await Promise.all((o.plantas||[]).map(async p=> Object.assign({}, p, {ref: await MID.copiar(p.ref)})));
  copia.arquivos = [];
  const novo = DB.addImovel(copia);
  UI.toast(`Cópia criada como ${novo.codigo} (rascunho).`,"ok");
  abrir(novo.id);
}
function excluir(id){
  const i = DB.getImovel(id); if(!i) return;
  const nLeads = DB.leadsDoImovel(id).length;
  UI.confirmAction(`Excluir ${i.codigo} — "${i.titulo||"sem título"}"? Ele sai do site e as fotos, plantas e arquivos são apagados.${nLeads?` Os ${nLeads} lead(s) vinculados continuam no CRM.`:""}`, ()=>{
    [...(i.fotos||[]), ...(i.plantas||[]).map(p=>p.ref), ...(i.arquivos||[]).map(a=>a.ref)].forEach(MID.remover);
    DB.getLeads().filter(l=>l.imovelId===id).forEach(l=> DB.updateLead(l.id, {imovelId:null}));
    DB.deleteImovel(id);
    UI.toast("Imóvel excluído.","err");
    render();
  });
}

// ------------------------------------------------------ compartilhar
function compartilhar(){
  const lista = resultado().filter(DB.estaPublicado);
  let ov = document.getElementById("shareOverlay");
  if(!ov){ ov = document.createElement("div"); ov.className = "overlay modal-center"; ov.id = "shareOverlay"; document.body.appendChild(ov); }
  if(!lista.length){
    ov.innerHTML = `<div class="modal"><div class="modal-hd"><h3 style="font-size:18px">Compartilhar imóveis</h3><button class="x" data-close-overlay="shareOverlay" aria-label="Fechar"></button></div>
      <div class="modal-bd"><p style="font-size:14px;color:var(--tinta-60)">Nenhum imóvel em anúncio nos resultados atuais. Só imóveis publicados têm link no site para enviar ao cliente.</p></div></div>`;
    UI.openOverlay("shareOverlay"); return;
  }
  const marcados = new Set(lista.slice(0,5).map(i=>i.id));
  const url = i => new URL("../imovel.html?id="+encodeURIComponent(i.id), location.href).href;
  function texto(){
    const sel = lista.filter(i=> marcados.has(i.id));
    return "Olá! Separei alguns imóveis que podem te interessar:\n\n" + sel.map(i=>
      `🏠 ${i.titulo}\n${DB.precoImovelTexto(i)} · ${i.bairro||""}${i.cidade?", "+i.cidade:""}\n${url(i)}`).join("\n\n") + "\n\nQualquer dúvida, é só me chamar!";
  }
  function desenhar(){
    ov.innerHTML = `<div class="modal" style="width:min(620px,94vw)" role="dialog" aria-modal="true" aria-labelledby="shareTit">
      <div class="modal-hd"><h3 style="font-size:18px" id="shareTit">Compartilhar imóveis</h3><button class="x" data-close-overlay="shareOverlay" aria-label="Fechar"></button></div>
      <div class="modal-bd">
        <p style="font-size:13px;color:var(--tinta-45);margin-bottom:12px">Imóveis em anúncio dos resultados atuais. Marque os que quer enviar.</p>
        <div class="share-lista">${lista.map(i=>`<label><input type="checkbox" data-share="${i.id}" ${marcados.has(i.id)?"checked":""}><span><b>${esc(i.codigo)}</b> · ${esc(i.titulo||"Sem título")}</span><em>${esc(DB.precoImovelTexto(i))}</em></label>`).join("")}</div>
        <div class="field" style="margin:16px 0 0"><label for="shareTxt">Mensagem</label><textarea id="shareTxt" rows="7">${esc(texto())}</textarea></div>
      </div>
      <div class="modal-ft"><button class="btn ghost sm" id="shareCopiar">Copiar texto</button><a class="btn dark sm" id="shareWa" target="_blank" rel="noopener">Enviar no WhatsApp</a></div>
    </div>`;
    const atualizarLink = ()=> ov.querySelector("#shareWa").href = "https://wa.me/?text=" + encodeURIComponent(ov.querySelector("#shareTxt").value);
    atualizarLink();
    ov.querySelector("#shareTxt").oninput = atualizarLink;
    ov.querySelectorAll("[data-share]").forEach(c=> c.onchange = ()=>{ c.checked ? marcados.add(c.dataset.share) : marcados.delete(c.dataset.share); ov.querySelector("#shareTxt").value = texto(); atualizarLink(); });
    ov.querySelector("#shareCopiar").onclick = ()=>{
      const t = ov.querySelector("#shareTxt").value;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=> UI.toast("Texto copiado.","ok"),
        ()=>{ ov.querySelector("#shareTxt").select(); document.execCommand("copy"); UI.toast("Texto copiado.","ok"); });
    };
  }
  desenhar();
  UI.openOverlay("shareOverlay");
}

// ----------------------------------------------------------- eventos
const painel = document.getElementById("giFiltros");
painel.addEventListener("input", e=>{
  const t = e.target;
  if(t.id==="giQ"){ F.q = t.value; renderResultados(); return; }
  if(t.dataset.money){
    const dig = t.value.replace(/\D/g,"");
    F[t.dataset.money] = dig ? Number(dig) : null;
    t.value = dig ? fmtMoney(Number(dig)) : "";
    renderResultados(); return;
  }
  if(t.dataset.num){ const v = Number(t.value.replace(/\D/g,"")); F[t.dataset.num] = v || null; renderResultados(); }
});
painel.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.f){ F[t.dataset.f] = t.value; render(t.id); return; }
  if(t.dataset.bool){ F[t.dataset.bool] = t.checked; render(); }
});
painel.addEventListener("keydown", e=>{ if(e.target.id==="giFavNome" && e.key==="Enter"){ e.preventDefault(); document.getElementById("giFavSalvar").click(); } });
painel.addEventListener("click", e=>{
  const t = e.target;
  const pill = t.closest("[data-pill]"); if(pill){ F[pill.dataset.pill] = Number(pill.dataset.v); render(); return; }
  const fin = t.closest("[data-fin]"); if(fin){ F.finalidade = fin.dataset.fin; render(); return; }
  if(t.id==="giOutros"){ outrosAbertos = !outrosAbertos; gravar(K_OUTROS, outrosAbertos); render(); return; }
  if(t.id==="giLimpar"){ F = Object.assign({}, VAZIO); render(); UI.toast("Filtros limpos.","ok"); return; }
  if(t.id==="giFavAdd"){ salvandoFav = true; render("giFavNome"); return; }
  if(t.id==="giFavSalvar"){
    const nome = (document.getElementById("giFavNome").value||"").trim();
    if(!nome){ UI.toast("Dê um nome ao filtro.","err"); return; }
    const favs = ler(K_FAVS, []); favs.push({nome, filtros: Object.assign({}, F)}); gravar(K_FAVS, favs);
    salvandoFav = false; render(); UI.toast("Filtro salvo nos favoritos.","ok"); return;
  }
  const fav = t.closest("[data-fav]"); if(fav){ const f = ler(K_FAVS, [])[+fav.dataset.fav]; if(f){ F = Object.assign({}, VAZIO, f.filtros); render(); } return; }
  const rmf = t.closest("[data-rmfav]"); if(rmf){ const favs = ler(K_FAVS, []); favs.splice(+rmf.dataset.rmfav,1); gravar(K_FAVS, favs); render(); return; }
  if(t.id==="giFecharFiltros"){ painel.classList.remove("aberto"); return; }
});

document.getElementById("giTopo").addEventListener("change", e=>{
  const t = e.target;
  if(t.id==="giOrdem"){ ordem = t.value; renderResultados(); return; }
  if(t.dataset.st){
    const id = t.dataset.st;
    F.status = t.checked ? [...F.status, id] : F.status.filter(x=>x!==id);
    renderResultados();
    const cb = document.querySelector(`[data-st="${id}"]`); if(cb) cb.focus();
  }
});
document.getElementById("giTopo").addEventListener("click", e=>{
  const t = e.target;
  if(t.closest("#giStatusBtn")){ statusAberto = !statusAberto; renderResultados(); e.stopPropagation(); return; }
  const v = t.closest("[data-vista]"); if(v){ vista = v.dataset.vista; gravar(K_VISTA, vista); renderResultados(); return; }
  if(t.closest("#giAbrirFiltros")){ painel.classList.add("aberto"); painel.scrollIntoView({behavior:"smooth", block:"start"}); return; }
});
document.addEventListener("click", e=>{
  const lim = e.target.closest("[data-limpa]");
  if(lim){
    const k = lim.dataset.limpa;
    if(k==="tudo") F = Object.assign({}, VAZIO); else F[k] = JSON.parse(JSON.stringify(VAZIO[k]));
    statusAberto = false; render(); return;
  }
  if(statusAberto && !e.target.closest(".gi-status-wrap")){ statusAberto = false; renderResultados(); }
  if(menuSit && !e.target.closest(".sit-menu") && !e.target.closest("[data-sit]")) fecharMenuSituacao();
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ fecharMenuSituacao(); if(statusAberto){ statusAberto = false; renderResultados(); } } });
addEventListener("scroll", fecharMenuSituacao, {passive:true});

document.getElementById("imLista").addEventListener("click", e=>{
  const t = e.target;
  const sit = t.closest("[data-sit]"); if(sit){ e.stopPropagation(); menuSit && menuSit.dataset.para===sit.dataset.sit ? fecharMenuSituacao() : (abrirMenuSituacao(sit, sit.dataset.sit), menuSit && (menuSit.dataset.para = sit.dataset.sit)); return; }
  const dup = t.closest("[data-dup]"); if(dup){ duplicar(dup.dataset.dup); return; }
  const del = t.closest("[data-del]"); if(del){ excluir(del.dataset.del); return; }
  if(t.closest("a")) return;
  const ed = t.closest("[data-edit]"); if(ed){ abrir(ed.dataset.edit); return; }
  const card = t.closest("[data-card]"); if(card && !t.closest("button")) abrir(card.dataset.card);
});
document.getElementById("btnCompartilhar").onclick = compartilhar;

render();
})();
