/* ===========================================================
   Solua CRM — Cadastro de imóveis: lista do catálogo
   Página: crm/imoveis-cadastro.html (editor em imovel-editor.html)
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB, UI = window.SoluaUI, IM = window.SoluaImovel, MID = window.SoluaMidia;
let vista = "grade";
try{ vista = localStorage.getItem("solua_im_vista") || "grade"; }catch(e){}

const ICO = {
  casa:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
  olho:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  estrela:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8z"/></svg>`,
  pessoas:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c2.3.2 4 1.9 4.5 4.6"/></svg>`,
  foto:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`
};

function filtrar(){
  const termo = document.getElementById("imBusca").value.trim().toLowerCase();
  const fin = document.getElementById("imFinalidade").value;
  const pub = document.getElementById("imPub").value;
  return DB.getImoveis().filter(i=>{
    if(fin && !(i.finalidade===fin || i.finalidade==="venda_locacao")) return false;
    if(pub==="pub" && !DB.estaPublicado(i)) return false;
    if(pub==="nao" && DB.estaPublicado(i)) return false;
    if(pub==="dest" && !i.destaque) return false;
    if(!termo) return true;
    return [i.codigo, i.titulo, i.bairro, i.cidade, i.tipo].some(v=> (v||"").toLowerCase().includes(termo));
  });
}

function renderKpis(){
  const todos = DB.getImoveis();
  const pub = todos.filter(DB.estaPublicado).length;
  const dest = todos.filter(i=>i.destaque).length;
  const leads = todos.reduce((s,i)=> s + DB.leadsDoImovel(i.id).length, 0);
  const incompletos = todos.filter(i=> IM.qualidade(i).pct < 50).length;
  document.getElementById("imKpis").innerHTML = `
    <div class="kpi accent"><span class="kpi-ico">${ICO.casa}</span><span class="lbl">Imóveis no catálogo</span><b>${todos.length}</b><span class="delta"><span class="chip">${pub} no site</span> publicados</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.olho}</span><span class="lbl">Não publicados</span><b>${todos.length-pub}</b><span class="delta"><span class="chip neutro">rascunhos</span> fora do site</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.estrela}</span><span class="lbl">Em destaque</span><b>${dest}</b><span class="delta"><span class="chip neutro">home</span> vitrine do site</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.pessoas}</span><span class="lbl">Leads vinculados</span><b>${leads}</b><span class="delta"><span class="chip ${incompletos?"baixa":""}">${incompletos}</span> anúncio${incompletos===1?"":"s"} incompleto${incompletos===1?"":"s"}</span></div>`;
}

function tags(i){
  return `<div class="im-tags">
    <span class="im-tag escuro">${DB.esc(i.codigo||"")}</span>
    ${DB.estaPublicado(i) ? "" : `<span class="im-tag">Não publicado</span>`}
    ${i.destaque ? `<span class="im-tag azul">Destaque</span>` : ""}
  </div>`;
}
function fotoCapa(i){
  const capa = (i.fotos||[])[0];
  if(!capa) return `<div class="im-vazio">${ICO.foto}Sem fotos</div>`;
  return "";
}
function specs(i){
  const p = [];
  if(!IM.SEM_COMODOS.has(i.tipo)){
    if(i.quartos) p.push(`${i.quartos} dorm.`);
    if(i.banheiros) p.push(`${i.banheiros} banh.`);
  }
  if(i.vagas) p.push(`${i.vagas} vaga${i.vagas==1?"":"s"}`);
  if(i.areaM2) p.push(`${i.areaM2} m²`);
  return p.map(x=>`<span>${x}</span>`).join("");
}

function cardHtml(i){
  const q = IM.qualidade(i);
  const nLeads = DB.leadsDoImovel(i.id).length;
  const capa = (i.fotos||[])[0];
  return `<div class="im-card">
    <div class="im-ph" data-edit="${i.id}" ${capa?`data-midia="${DB.esc(capa)}" style="background-image:url('${DB.esc(MID.srcInicial(capa))}')"`:""}>
      ${fotoCapa(i)}${tags(i)}
    </div>
    <div class="im-bd">
      <div class="preco">${DB.esc(IM.preco(i))}</div>
      <h4>${DB.esc(i.titulo || "Sem título")}</h4>
      <div class="loc">${DB.esc(i.tipo)} · ${DB.esc([i.bairro,i.cidade].filter(Boolean).join(", ")||"endereço não informado")}</div>
      <div class="im-specs">${specs(i)}</div>
    </div>
    <div class="im-foot">
      <span class="qbar" title="Qualidade do anúncio: ${q.pct}%"><i style="width:${q.pct}%;background:${q.cor}"></i></span>
      <span class="qtxt">${q.pct}%</span>
      <span class="qtxt" title="Leads interessados">· ${nLeads} lead${nLeads===1?"":"s"}</span>
      <span class="spacer"></span>
      ${acoes(i)}
    </div>
  </div>`;
}
function acoes(i){
  return `<button class="btn icon soft sm" data-edit="${i.id}" title="Editar" aria-label="Editar ${DB.esc(i.codigo)}">✎</button>
    <button class="btn icon soft sm" data-dup="${i.id}" title="Duplicar" aria-label="Duplicar ${DB.esc(i.codigo)}">⧉</button>
    ${DB.estaPublicado(i) ? `<a class="btn icon soft sm" href="../imovel.html?id=${encodeURIComponent(i.id)}" target="_blank" rel="noopener" title="Ver no site" aria-label="Ver ${DB.esc(i.codigo)} no site">↗</a>` : ""}
    <button class="btn icon soft sm" data-del="${i.id}" title="Excluir" aria-label="Excluir ${DB.esc(i.codigo)}">✕</button>`;
}

function linhaHtml(i){
  const q = IM.qualidade(i);
  const capa = (i.fotos||[])[0];
  return `<tr data-edit="${i.id}">
    <td><div class="namecell"><span class="im-thumb" ${capa?`data-midia="${DB.esc(capa)}" style="background-image:url('${DB.esc(MID.srcInicial(capa))}')"`:""}></span>
      <div><b>${DB.esc(i.titulo||"Sem título")}</b><span>${DB.esc(i.codigo||"")} · ${DB.esc(i.bairro||"—")}</span></div></div></td>
    <td>${DB.esc(i.tipo)}</td>
    <td>${IM.FINALIDADE[i.finalidade]||i.finalidade}</td>
    <td style="white-space:nowrap">${DB.esc(IM.preco(i))}</td>
    <td>${DB.estaPublicado(i) ? `<span class="dotst ok"><span>Publicado</span></span>` : `<span class="dotst cinza"><span>Não publicado</span></span>`}</td>
    <td><span style="display:flex;align-items:center;gap:8px"><span class="qbar" style="width:60px"><i style="width:${q.pct}%;background:${q.cor}"></i></span><span class="qtxt">${q.pct}%</span></span></td>
    <td>${DB.leadsDoImovel(i.id).length}</td>
    <td class="rowactions">${acoes(i)}</td>
  </tr>`;
}

function render(){
  renderKpis();
  const itens = filtrar();
  const total = DB.getImoveis().length;
  document.getElementById("imSub").textContent = itens.length===total ? `${total} imóve${total===1?"l":"is"} cadastrado${total===1?"":"s"}` : `${itens.length} de ${total} imóveis`;
  const el = document.getElementById("imLista");
  if(!itens.length){
    el.innerHTML = `<div class="empty">${UI.emptyState(total ? "Nenhum imóvel com esse filtro." : "Nenhum imóvel cadastrado ainda.")}
      ${total?"":`<a class="btn dark" style="margin-top:16px" href="imovel-editor.html">+ Cadastrar o primeiro imóvel</a>`}</div>`;
    return;
  }
  el.innerHTML = vista==="lista"
    ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Imóvel</th><th>Tipo</th><th>Finalidade</th><th>Preço</th><th>Site</th><th>Qualidade</th><th>Leads</th><th></th></tr></thead><tbody>${itens.map(linhaHtml).join("")}</tbody></table></div>`
    : `<div class="im-grid">${itens.map(cardHtml).join("")}</div>`;
  MID.hidratar(el);
}

function abrir(id){ location.href = "imovel-editor.html?id="+encodeURIComponent(id); }

async function duplicar(id){
  const o = DB.getImovel(id); if(!o) return;
  const copia = JSON.parse(JSON.stringify(o));
  delete copia.id; delete copia.codigo; delete copia.criadoEm; delete copia.atualizadoEm;
  copia.titulo = (o.titulo||"Imóvel") + " (cópia)";
  copia.publicado = false; copia.destaque = false;
  copia.fotos = await Promise.all((o.fotos||[]).map(MID.copiar));
  copia.plantas = await Promise.all((o.plantas||[]).map(async p=> Object.assign({}, p, {ref: await MID.copiar(p.ref)})));
  copia.arquivos = [];
  const novo = DB.addImovel(copia);
  UI.toast(`Cópia criada como ${novo.codigo} (não publicada).`,"ok");
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

document.getElementById("imLista").addEventListener("click", e=>{
  const dup = e.target.closest("[data-dup]"); if(dup){ e.stopPropagation(); duplicar(dup.dataset.dup); return; }
  const del = e.target.closest("[data-del]"); if(del){ e.stopPropagation(); excluir(del.dataset.del); return; }
  if(e.target.closest("a")) return;
  const ed = e.target.closest("[data-edit]"); if(ed) abrir(ed.dataset.edit);
});
["imBusca","imFinalidade","imPub"].forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener(el.tagName==="INPUT"?"input":"change", render);
});
document.querySelectorAll("#imVista button").forEach(b=>{
  b.classList.toggle("on", b.dataset.v===vista);
  b.onclick = ()=>{
    vista = b.dataset.v;
    try{ localStorage.setItem("solua_im_vista", vista); }catch(e){}
    document.querySelectorAll("#imVista button").forEach(x=> x.classList.toggle("on", x===b));
    render();
  };
});
render();
})();
