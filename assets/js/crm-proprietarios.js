/* ===========================================================
   Solua CRM — cadastro de proprietários (donos dos imóveis)
   Página: crm/proprietarios.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB, UI = window.SoluaUI, IM = window.SoluaImovel, MID = window.SoluaMidia;
const esc = DB.esc;
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICO = {
  pessoa:svg(`<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5"/>`),
  casa:svg(`<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>`),
  chave:svg(`<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>`),
  alerta:svg(`<path d="M12 3l9.5 17h-19L12 3z"/><path d="M12 10v4M12 17v.5"/>`)
};

function iniciais(nome){ return DB.iniciais(nome||"?"); }
function lista(){
  const t = document.getElementById("prBusca").value.trim().toLowerCase();
  const f = document.getElementById("prFiltro").value;
  return DB.getProprietarios().filter(p=>{
    const ims = DB.imoveisDoProprietario(p.id);
    if(f==="com" && !ims.length) return false;
    if(f==="sem" && ims.length) return false;
    if(f==="anuncio" && !ims.some(i=> IM.situacao(i).id==="em_anuncio")) return false;
    if(!t) return true;
    const dig = t.replace(/\D/g,"");
    return [p.nome, p.email, p.documento, p.telefone].some(v=> (v||"").toLowerCase().includes(t))
      || (dig.length>=3 && [p.documento, p.telefone, p.telefone2].some(v=> (v||"").replace(/\D/g,"").includes(dig)));
  });
}

function renderKpis(){
  const props = DB.getProprietarios();
  const com = props.filter(p=> DB.imoveisDoProprietario(p.id).length).length;
  const anunc = props.filter(p=> DB.imoveisDoProprietario(p.id).some(i=> IM.situacao(i).id==="em_anuncio")).length;
  const semProp = DB.getImoveis().filter(i=> !i.proprietarioId).length;
  document.getElementById("prKpis").innerHTML = `
    <div class="kpi accent"><span class="kpi-ico">${ICO.pessoa}</span><span class="lbl">Proprietários</span><b>${props.length}</b><span class="delta"><span class="chip">${com}</span> com imóveis na carteira</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.casa}</span><span class="lbl">Com imóvel em anúncio</span><b>${anunc}</b><span class="delta"><span class="chip neutro">no site</span> agora</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.chave}</span><span class="lbl">Imóveis na carteira</span><b>${DB.getImoveis().length}</b><span class="delta"><span class="chip neutro">${DB.getImoveis().length - semProp}</span> com proprietário</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.alerta}</span><span class="lbl">Imóveis sem proprietário</span><b>${semProp}</b><span class="delta">${semProp ? `<a class="chip baixa" href="imoveis-cadastro.html" id="lnkSemProp">ver na gestão →</a>` : `<span class="chip">tudo vinculado</span>`}</span></div>`;
  const lnk = document.getElementById("lnkSemProp");
  if(lnk) lnk.onclick = ()=>{ try{ const f = JSON.parse(localStorage.getItem("solua_gi_filtros")||"{}"); f.proprietario = "__sem"; localStorage.setItem("solua_gi_filtros", JSON.stringify(f)); }catch(e){} };
}

function render(){
  renderKpis();
  const itens = lista(), total = DB.getProprietarios().length;
  document.getElementById("prSub").textContent = itens.length===total ? `${total} proprietário${total===1?"":"s"} cadastrado${total===1?"":"s"}` : `${itens.length} de ${total}`;
  const el = document.getElementById("prRows");
  if(!itens.length){
    el.innerHTML = `<tr><td colspan="5" style="cursor:default"><div class="empty" style="padding:30px 10px">${UI.emptyState(total ? "Ninguém encontrado com esse filtro." : "Nenhum proprietário cadastrado ainda. Cadastre aqui ou direto no cadastro do imóvel.")}</div></td></tr>`;
    return;
  }
  el.innerHTML = itens.map(p=>{
    const ims = DB.imoveisDoProprietario(p.id);
    const wa = IM.linkWhats(p.telefone);
    return `<tr data-prop="${p.id}">
      <td><div class="namecell"><span class="avatar" style="background:var(--azul)">${iniciais(p.nome)}</span>
        <div><b>${esc(p.nome)}</b><span>${p.tipoPessoa==="PJ"?"Pessoa jurídica":"Pessoa física"}${p.documento?` · ${esc(p.documento)}`:""}</span></div></div></td>
      <td><div style="line-height:1.4"><b style="font-weight:600;font-size:13px">${esc(p.telefone||"—")}</b>${wa?` <a href="${wa}" target="_blank" rel="noopener" class="lnk-wa" data-nao-abrir>WhatsApp</a>`:""}
        <div style="font-size:12px;color:var(--tinta-45)">${esc(p.email||"")}</div></div></td>
      <td>${ims.length ? `<div class="pr-ims">${ims.slice(0,3).map(i=>{ const s = IM.situacao(i); return `<span class="pr-im" style="--sit:${s.cor}" title="${esc(s.label)}">${esc(i.codigo)}</span>`; }).join("")}${ims.length>3?`<span class="pr-im">+${ims.length-3}</span>`:""}</div>` : `<span style="color:var(--tinta-35)">Nenhum</span>`}</td>
      <td>${p.criadoEm ? DB.formatDate(p.criadoEm) : "—"}</td>
      <td class="rowactions"><button class="btn icon soft sm" data-editar="${p.id}" title="Editar" aria-label="Editar ${esc(p.nome)}">${IM.ico("editar")}</button><button class="btn icon soft sm" data-excluir="${p.id}" title="Excluir" aria-label="Excluir ${esc(p.nome)}">${IM.ico("lixeira")}</button></td>
    </tr>`;
  }).join("");
}

function abrirDetalhe(id){
  const p = DB.getProprietario(id); if(!p) return;
  const ims = DB.imoveisDoProprietario(id);
  const wa = IM.linkWhats(p.telefone);
  const linha = (k,v)=> v ? `<div class="pr-linha"><span>${k}</span><b>${esc(v)}</b></div>` : "";
  document.getElementById("prDrawerBody").innerHTML = `
    <div class="drawer-hd">
      <div style="display:flex;gap:14px;align-items:center">
        <span class="avatar" style="width:52px;height:52px;font-size:17px;background:var(--azul)">${iniciais(p.nome)}</span>
        <div><span class="badge neutro">${p.tipoPessoa==="PJ"?"Pessoa jurídica":"Pessoa física"}</span><h2 style="margin-top:6px;font-size:22px">${esc(p.nome)}</h2></div>
      </div>
      <button class="x" data-close-overlay="prDrawer" aria-label="Fechar"></button>
    </div>
    <div class="drawer-bd">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${wa?`<a class="btn dark sm" href="${wa}" target="_blank" rel="noopener">Chamar no WhatsApp</a>`:""}
        ${p.email?`<a class="btn ghost sm" href="mailto:${esc(p.email)}">Enviar e-mail</a>`:""}
        <button type="button" class="btn ghost sm" data-editar="${p.id}">Editar dados</button>
      </div>
      <div class="card" style="padding:16px 18px;margin-bottom:16px">
        ${linha(p.tipoPessoa==="PJ"?"CNPJ":"CPF", p.documento)}${linha("Telefone", p.telefone)}${linha("Outro telefone", p.telefone2)}
        ${linha("E-mail", p.email)}${linha("Endereço", p.endereco)}${linha("PIX / repasse", p.pix)}
        ${p.observacoes?`<div class="pr-linha" style="display:block"><span>Observações</span><p style="font-size:13.5px;margin-top:4px;white-space:pre-line">${esc(p.observacoes)}</p></div>`:""}
        ${linha("Cadastrado em", p.criadoEm ? DB.formatDate(p.criadoEm) : "")}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
        <h3 style="font-size:16px">Imóveis (${ims.length})</h3>
        <a class="btn soft sm" href="imovel-editor.html?proprietario=${encodeURIComponent(p.id)}">+ Cadastrar imóvel</a>
      </div>
      ${ims.length ? `<div class="pr-cards">${ims.map(i=>{ const s = IM.situacao(i); const capa = (i.fotos||[])[0]; return `
        <a class="pr-card" href="imovel-editor.html?id=${encodeURIComponent(i.id)}">
          <span class="im-thumb" ${capa?`data-midia="${esc(capa)}" style="background-image:url('${esc(MID.srcInicial(capa))}')"`:""}></span>
          <span style="flex:1;min-width:0"><b>${esc(i.titulo||"Sem título")}</b><small>${esc(i.codigo)} · ${esc(IM.preco(i))}</small></span>
          <span class="sit-tag" style="color:${s.cor};background:${s.fundo}">${s.label}</span>
        </a>`; }).join("")}</div>` : `<div class="empty" style="padding:22px">${UI.emptyState("Nenhum imóvel vinculado ainda.")}</div>`}
    </div>`;
  MID.hidratar(document.getElementById("prDrawerBody"));
  UI.openOverlay("prDrawer");
}

function excluir(id){
  const p = DB.getProprietario(id); if(!p) return;
  const n = DB.imoveisDoProprietario(id).length;
  UI.confirmAction(`Excluir ${p.nome} do cadastro?${n?` Os ${n} imóvel(is) dele(a) continuam no catálogo, só ficam sem proprietário vinculado.`:""}`, ()=>{
    DB.deleteProprietario(id); UI.closeOverlay("prDrawer"); UI.toast("Proprietário excluído.","err"); render();
  });
}

document.getElementById("btnNovoProp").onclick = ()=> IM.editarProprietario(null, p=>{ render(); abrirDetalhe(p.id); });
document.getElementById("prBusca").addEventListener("input", render);
document.getElementById("prFiltro").addEventListener("change", render);
document.addEventListener("click", e=>{
  const t = e.target;
  if(t.closest("[data-nao-abrir]")) return;
  const ed = t.closest("[data-editar]"); if(ed){ e.stopPropagation(); IM.editarProprietario(ed.dataset.editar, p=>{ render(); if(document.getElementById("prDrawer").classList.contains("on")) abrirDetalhe(p.id); }); return; }
  const ex = t.closest("[data-excluir]"); if(ex){ e.stopPropagation(); excluir(ex.dataset.excluir); return; }
  const row = t.closest("tr[data-prop]"); if(row) abrirDetalhe(row.dataset.prop);
});
// abre direto um proprietário vindo de outra tela (?id=…)
const qid = new URLSearchParams(location.search).get("id");
render();
if(qid && DB.getProprietario(qid)) abrirDetalhe(qid);
})();
