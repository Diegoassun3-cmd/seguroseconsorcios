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

function produtoLabel(p){ return p==="ambos" ? "Seguros + Consórcios" : p==="seguro" ? "Seguros" : "Consórcios"; }

function render(){
  const eq = DB.getEquipe();
  document.getElementById("rows").innerHTML = eq.map(u=>`
    <tr data-id="${u.id}">
      <td><div class="namecell"><span class="avatar" style="background:${u.avatarBg}">${DB.iniciais(u.nome)}</span>
        <div><b>${u.nome}</b><span>${u.email}</span></div></div></td>
      <td>${u.papel}</td>
      <td>${produtoLabel(u.produto)}</td>
      <td>${u.ativo ? `<span class="badge ganho">Ativo</span>` : `<span class="badge perdido">Inativo</span>`}</td>
      <td>${DB.getLeads().filter(l=>l.consultorId===u.id).length}</td>
      <td class="rowactions">
        <button class="btn icon ghost sm" data-edit="${u.id}" title="Editar">✎</button>
        ${u.id!==UI.currentUser.id ? `<button class="btn icon ghost sm" data-del="${u.id}" title="Remover">✕</button>` : ""}
      </td>
    </tr>`).join("");
  document.querySelectorAll("[data-edit]").forEach(b=> b.onclick = ()=> openEditor(b.dataset.edit));
  document.querySelectorAll("tr[data-id]").forEach(tr=> tr.addEventListener("click", e=>{ if(!e.target.closest("button")) openEditor(tr.dataset.id); }));
  document.querySelectorAll("[data-del]").forEach(b=> b.onclick = e=>{
    e.stopPropagation();
    const u = DB.getUsuario(b.dataset.del);
    UI.confirmAction(`Remover ${u.nome} da equipe? Os leads atribuídos a ela(e) ficarão sem consultor.`, ()=>{
      DB.getLeads().filter(l=>l.consultorId===u.id).forEach(l=> DB.updateLead(l.id,{consultorId:null}));
      DB.deleteUsuario(u.id); UI.toast("Usuário removido.","err"); render();
    });
  });
}

function openEditor(id){
  editId = id || null;
  const u = id ? DB.getUsuario(id) : {nome:"",email:"",papel:"Consultor",produto:"seguro",ativo:true,avatarBg:CORES[Math.floor(Math.random()*CORES.length)]};
  document.getElementById("modalTitle").textContent = id ? "Editar usuário" : "Novo usuário";
  document.getElementById("editorBody").innerHTML = `
    <div class="grid2">
      <div class="field full"><label>Nome completo</label><input id="fNome" value="${u.nome}"></div>
      <div class="field full"><label>E-mail (login no CRM)</label><input id="fEmail" type="email" value="${u.email}"></div>
      <div class="field"><label>Papel</label><select id="fPapel">
        <option ${u.papel==="Administrador"?"selected":""}>Administrador</option>
        <option ${u.papel==="Consultor"?"selected":""}>Consultor</option>
        <option ${u.papel==="Consultora"?"selected":""}>Consultora</option>
      </select></div>
      <div class="field"><label>Atua em</label><select id="fProduto">
        <option value="seguro" ${u.produto==="seguro"?"selected":""}>Seguros</option>
        <option value="consorcio" ${u.produto==="consorcio"?"selected":""}>Consórcios</option>
        <option value="ambos" ${u.produto==="ambos"?"selected":""}>Ambos</option>
      </select></div>
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
  document.getElementById("btnSalvarUsuario").onclick = ()=>{
    const data = {
      nome: document.getElementById("fNome").value.trim(),
      email: document.getElementById("fEmail").value.trim(),
      papel: document.getElementById("fPapel").value,
      produto: document.getElementById("fProduto").value,
      ativo: document.getElementById("fAtivo").checked,
      avatarBg: corEscolhida
    };
    if(!data.nome || !data.email){ UI.toast("Preencha nome e e-mail.","err"); return; }
    if(editId) DB.updateUsuario(editId, data); else DB.addUsuario(data);
    UI.toast(editId?"Usuário atualizado.":"Usuário criado.","ok");
    UI.closeOverlay("editorOverlay");
    render();
  };
  UI.openOverlay("editorOverlay");
}

document.getElementById("btnNovoUsuario").onclick = ()=> openEditor(null);
render();
})();
