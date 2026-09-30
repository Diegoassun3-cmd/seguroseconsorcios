/* ===========================================================
   Solua CRM — gestão de equipe (usuários do CRM)
   Página: crm/admin/equipe.html
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;
let editId = null;
const CORES = ["#004BA5","#118ECC","#B8862B","#1E8E5A","#B0453D","#6E56CF"];

const PRODUTO_LABEL = {ambos:"Todos os produtos", seguro:"Seguros", consorcio:"Consórcios", imovel:"Imóveis"};
function produtoLabel(p){ return PRODUTO_LABEL[p] || p; }

const ICO = {
  pessoas:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.6c2.3.2 4 1.9 4.5 4.6"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>`,
  escudo:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l8 3.5v5.5c0 5-3.4 8.4-8 9.8-4.6-1.4-8-4.8-8-9.8V6.5L12 3z"/></svg>`,
  funil:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 8v5l-4 2v-7z"/></svg>`
};

function acessoLabel(u){
  if(u.papel==="Administrador") return "Todas as telas";
  const n = (u.permissoes||[]).length;
  return n ? `${n} tela${n===1?"":"s"} admin.` : "Só o dia a dia";
}

function renderKpis(eq){
  const ativos = eq.filter(u=>u.ativo).length;
  const admins = eq.filter(u=>u.papel==="Administrador").length;
  const leads = DB.getLeads();
  const atribuidos = leads.filter(l=>l.consultorId).length;
  const pctAtrib = leads.length ? Math.round(atribuidos/leads.length*100) : 0;
  document.getElementById("eqKpis").innerHTML = `
    <div class="kpi accent"><span class="kpi-ico">${ICO.pessoas}</span><span class="lbl">Membros</span><b>${eq.length}</b><span class="delta"><span class="chip">${ativos} ativo${ativos===1?"":"s"}</span> na equipe</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.check}</span><span class="lbl">Ativos</span><b>${ativos}</b><span class="delta"><span class="chip">${eq.length?Math.round(ativos/eq.length*100):0}%</span> recebem leads</span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.escudo}</span><span class="lbl">Administradores</span><b>${admins}</b><span class="delta"><span class="chip neutro">acesso total</span></span></div>
    <div class="kpi"><span class="kpi-ico">${ICO.funil}</span><span class="lbl">Leads atribuídos</span><b>${atribuidos}</b><span class="delta"><span class="chip ${pctAtrib<100?"neutro":""}">${pctAtrib}%</span> da base</span></div>`;
}

function render(){
  const todos = DB.getEquipe();
  renderKpis(todos);
  const termo = (document.getElementById("eqBusca").value||"").trim().toLowerCase();
  const filtro = document.getElementById("eqFiltro").value;
  const eq = todos.filter(u=>{
    if(filtro==="Administrador" && u.papel!=="Administrador") return false;
    if(filtro==="consultor" && u.papel==="Administrador") return false;
    if(filtro==="inativo" && u.ativo) return false;
    return !termo || u.nome.toLowerCase().includes(termo) || (u.email||"").toLowerCase().includes(termo);
  });
  if(!eq.length){
    document.getElementById("rows").innerHTML = `<tr><td colspan="7" style="cursor:default"><div class="empty" style="padding:30px 10px">${UI.emptyState("Ninguém encontrado com esse filtro.")}</div></td></tr>`;
    return;
  }
  document.getElementById("rows").innerHTML = eq.map(u=>`
    <tr data-id="${u.id}">
      <td><div class="namecell"><span class="avatar" style="background:${u.avatarBg}">${DB.iniciais(u.nome)}</span>
        <div><b>${DB.esc(u.nome)}</b><span>${DB.esc(u.email)}</span></div></div></td>
      <td>${DB.esc(u.papel)}</td>
      <td>${produtoLabel(u.produto)}</td>
      <td><span class="badge ${u.papel==="Administrador"?"seguro":"neutro"}">${acessoLabel(u)}</span></td>
      <td>${u.ativo ? `<span class="dotst ok"><span>Ativo</span></span>` : `<span class="dotst off"><span>Inativo</span></span>`}</td>
      <td>${DB.getLeads().filter(l=>l.consultorId===u.id).length}</td>
      <td class="rowactions">
        <button class="btn icon soft sm" data-edit="${u.id}" title="Editar" aria-label="Editar ${DB.esc(u.nome)}">✎</button>
        ${u.id!==UI.currentUser.id ? `<button class="btn icon soft sm" data-del="${u.id}" title="Remover" aria-label="Remover ${DB.esc(u.nome)}">✕</button>` : ""}
      </td>
    </tr>`).join("");
  document.querySelectorAll("[data-edit]").forEach(b=> b.onclick = ()=> openEditor(b.dataset.edit));
  document.querySelectorAll("tr[data-id]").forEach(tr=> tr.addEventListener("click", e=>{ if(!e.target.closest("button")) openEditor(tr.dataset.id); }));
  document.querySelectorAll("[data-del]").forEach(b=> b.onclick = e=>{
    e.stopPropagation();
    const u = DB.getUsuario(b.dataset.del);
    if(u.papel==="Administrador" && DB.getEquipe().filter(x=>x.papel==="Administrador"&&x.ativo&&x.id!==u.id).length===0){
      UI.toast("Este é o único Administrador da equipe — não é possível removê-lo.","err");
      return;
    }
    UI.confirmAction(`Remover ${u.nome} da equipe? Os leads atribuídos a ela(e) ficarão sem consultor.`, ()=>{
      DB.getLeads().filter(l=>l.consultorId===u.id).forEach(l=> DB.updateLead(l.id,{consultorId:null}));
      DB.deleteUsuario(u.id); UI.toast("Usuário removido.","err"); render();
    });
  });
}

function permissoesHtml(u){
  const souAdmin = u.papel === "Administrador";
  return `
    <div class="field full" id="campoPermissoes" style="${souAdmin?"opacity:.5":""}">
      <label>Acesso às telas administrativas${souAdmin?" — Administrador já tem tudo":""}</label>
      <div class="perm-grid">
        ${DB.PERMISSOES_DISPONIVEIS.map(p=>`
          <label class="perm-item">
            <input type="checkbox" data-perm="${p.key}" ${souAdmin || (u.permissoes||[]).includes(p.key) ? "checked" : ""} ${souAdmin?"disabled":""}>
            ${DB.esc(p.label)}
          </label>`).join("")}
      </div>
    </div>`;
}

function openEditor(id){
  editId = id || null;
  const u = id ? DB.getUsuario(id) : {nome:"",email:"",papel:"Consultor",produto:"seguro",ativo:true,avatarBg:CORES[Math.floor(Math.random()*CORES.length)],permissoes:[]};
  document.getElementById("modalTitle").textContent = id ? "Editar usuário" : "Novo usuário";
  document.getElementById("editorBody").innerHTML = `
    <div class="grid2">
      <div class="field full"><label>Nome completo</label><input id="fNome" value="${DB.esc(u.nome)}"></div>
      <div class="field full"><label>E-mail (login no CRM)</label><input id="fEmail" type="email" value="${DB.esc(u.email)}"></div>
      <div class="field"><label>Papel</label><select id="fPapel">
        <option ${u.papel==="Administrador"?"selected":""}>Administrador</option>
        <option ${u.papel==="Consultor"?"selected":""}>Consultor</option>
        <option ${u.papel==="Consultora"?"selected":""}>Consultora</option>
      </select></div>
      <div class="field"><label>Atua em</label><select id="fProduto">
        <option value="imovel" ${u.produto==="imovel"?"selected":""}>Imóveis</option>
        <option value="seguro" ${u.produto==="seguro"?"selected":""}>Seguros</option>
        <option value="consorcio" ${u.produto==="consorcio"?"selected":""}>Consórcios</option>
        <option value="ambos" ${u.produto==="ambos"?"selected":""}>Todos os produtos</option>
      </select></div>
      ${permissoesHtml(u)}
    </div>
    <div class="field"><label>Cor do avatar</label><div style="display:flex;gap:8px">
      ${CORES.map(c=>`<button type="button" class="avatar" data-cor="${c}" style="background:${c};border:2px solid ${c===u.avatarBg?"var(--tinta)":"transparent"};width:28px;height:28px"></button>`).join("")}
    </div></div>
    <label style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:13.5px"><input type="checkbox" id="fAtivo" ${u.ativo?"checked":""} style="width:16px;height:16px;accent-color:var(--azul)"> Usuário ativo (recebe novos leads automaticamente)</label>
    <div class="demo-hint" style="margin-top:16px">Login de demonstração: qualquer e-mail cadastrado aqui entra no CRM com a senha <b>solua2026</b>.</div>
  `;
  let corEscolhida = u.avatarBg;
  document.querySelectorAll("[data-cor]").forEach(b=> b.onclick = ()=>{
    corEscolhida = b.dataset.cor;
    document.querySelectorAll("[data-cor]").forEach(x=> x.style.border = "2px solid transparent");
    b.style.border = "2px solid var(--tinta)";
  });
  document.getElementById("fPapel").onchange = e=>{
    document.getElementById("campoPermissoes").outerHTML = permissoesHtml({permissoes: permissoesMarcadas(), papel: e.target.value});
  };
  function permissoesMarcadas(){
    return Array.from(document.querySelectorAll("[data-perm]:checked")).map(c=>c.dataset.perm);
  }
  document.getElementById("btnSalvarUsuario").onclick = ()=>{
    const data = {
      nome: document.getElementById("fNome").value.trim(),
      email: document.getElementById("fEmail").value.trim(),
      papel: document.getElementById("fPapel").value,
      produto: document.getElementById("fProduto").value,
      ativo: document.getElementById("fAtivo").checked,
      permissoes: permissoesMarcadas(),
      avatarBg: corEscolhida
    };
    if(!data.nome || !data.email){ UI.toast("Preencha nome e e-mail.","err"); return; }
    // impede que o único Administrador ativo tire o próprio acesso de admin (ou se desative),
    // o que travaria a área administrativa para sempre nesta demonstração local
    if(editId===UI.currentUser.id && (data.papel!=="Administrador" || !data.ativo)){
      const outrosAdmins = DB.getEquipe().filter(x=> x.id!==editId && x.papel==="Administrador" && x.ativo);
      if(outrosAdmins.length===0){
        UI.toast("Você é o único Administrador ativo — não é possível remover seu próprio acesso de admin.","err");
        return;
      }
    }
    if(editId) DB.updateUsuario(editId, data); else DB.addUsuario(data);
    UI.toast(editId?"Usuário atualizado.":"Usuário criado.","ok");
    UI.closeOverlay("editorOverlay");
    render();
  };
  UI.openOverlay("editorOverlay");
}

document.getElementById("btnNovoUsuario").onclick = ()=> openEditor(null);
document.getElementById("eqBusca").addEventListener("input", render);
document.getElementById("eqFiltro").addEventListener("change", render);
render();
})();
