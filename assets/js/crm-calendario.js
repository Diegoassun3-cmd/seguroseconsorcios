/* ===========================================================
   Solua CRM — Calendário (mês, com os leads que têm uma data de
   "Próximo contato" marcada). Página: crm/calendario.html

   Sobre Google Agenda: ver o comentário na própria tela e o README
   ("Calendário e Google Agenda") — sincronizar de verdade com o
   Google exige credenciais OAuth reais do Google, que este projeto
   não tem configuradas.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const UI = window.SoluaUI;

const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function ymdLocal(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseDataLocal(dateStr){ return new Date(dateStr+"T12:00:00"); }

let cursor = new Date(); cursor.setDate(1); cursor.setHours(0,0,0,0);
let diaSelecionado = ymdLocal(new Date());

function leadsPorDia(){
  const mapa = {};
  DB.getLeads().forEach(l=>{
    if(!l.proximoContato) return;
    if(l.estagio==="perdido" || DB.ESTAGIOS_GANHOS.has(l.estagio)) return; // só leads ainda em aberto
    (mapa[l.proximoContato] = mapa[l.proximoContato] || []).push(l);
  });
  return mapa;
}

function compromissosPorDia(){
  const mapa = {};
  DB.getCompromissos().forEach(c=>{
    if(!c.data) return;
    (mapa[c.data] = mapa[c.data] || []).push(c);
  });
  return mapa;
}

function diasDoMes(){
  const ano = cursor.getFullYear(), mes = cursor.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes+1, 0);
  const offsetInicio = primeiroDia.getDay();
  const dias = [];
  for(let i=offsetInicio;i>0;i--) dias.push({data:new Date(ano, mes, 1-i), outroMes:true});
  for(let dia=1; dia<=ultimoDia.getDate(); dia++) dias.push({data:new Date(ano, mes, dia), outroMes:false});
  while(dias.length % 7 !== 0){
    const d = new Date(dias[dias.length-1].data);
    d.setDate(d.getDate()+1);
    dias.push({data:d, outroMes:true});
  }
  return dias;
}

function render(){
  document.getElementById("calTitulo").textContent = `${MESES[cursor.getMonth()]} de ${cursor.getFullYear()}`;
  const hojeStr = ymdLocal(new Date());
  const porDia = leadsPorDia();
  const compPorDia = compromissosPorDia();

  document.getElementById("calGrid").innerHTML =
    DIAS_SEMANA.map(d=>`<div class="cal-dow">${d}</div>`).join("") +
    diasDoMes().map(({data,outroMes})=>{
      const key = ymdLocal(data);
      const itens = [
        ...(porDia[key]||[]).map(l=>({label:l.nome.split(" ")[0]})),
        ...(compPorDia[key]||[]).map(c=>({label:c.titulo.split(" ")[0]||"Compromisso", compromisso:true}))
      ];
      const classes = ["cal-day"];
      if(outroMes) classes.push("outro-mes");
      if(key===hojeStr) classes.push("hoje");
      if(key===diaSelecionado) classes.push("sel");
      return `<button type="button" class="${classes.join(" ")}" data-day="${key}">
        <span class="cal-daynum">${data.getDate()}</span>
        <span class="cal-chips">
          ${itens.slice(0,3).map(it=>`<span class="cal-chip${it.compromisso?" compromisso":""}">${DB.esc(it.label)}</span>`).join("")}
          ${itens.length>3 ? `<span class="cal-chip-more">+${itens.length-3}</span>` : ""}
        </span>
      </button>`;
    }).join("");

  document.querySelectorAll("[data-day]").forEach(cell=>{
    cell.onclick = ()=>{ diaSelecionado = cell.dataset.day; render(); };
  });
  renderDetalheDia();
}

function renderDetalheDia(){
  const titulo = document.getElementById("calDetalheTitulo");
  const el = document.getElementById("calDetalhe");
  if(!diaSelecionado){
    titulo.textContent = "Selecione um dia";
    el.innerHTML = `<div class="empty">${UI.emptyState("Clique num dia do calendário pra ver os contatos e compromissos.")}</div>`;
    return;
  }
  const d = parseDataLocal(diaSelecionado);
  titulo.textContent = d.toLocaleDateString("pt-BR",{weekday:"long", day:"2-digit", month:"long"});
  const leads = (leadsPorDia())[diaSelecionado] || [];
  const compromissos = (compromissosPorDia())[diaSelecionado] || [];
  compromissos.sort((a,b)=> (a.hora||"99:99").localeCompare(b.hora||"99:99"));

  if(!leads.length && !compromissos.length){
    el.innerHTML = `<div class="empty">${UI.emptyState("Nada agendado pra este dia ainda.")}</div>`;
    return;
  }

  const leadsHtml = leads.map(l=>{
    const cons = DB.getUsuario(l.consultorId);
    return `<div class="agenda-row" data-leadid="${l.id}">
      <span class="badge ${l.produto}">${l.produto}</span>
      <span class="ag-nome">${DB.esc(l.nome)}</span>
      ${cons ? `<span class="miniav" style="background:${cons.avatarBg}">${DB.iniciais(cons.nome)}</span>` : ""}
    </div>`;
  }).join("");

  const cpmHtml = compromissos.map(c=>`
    <div class="agenda-row cpm-row" data-cpmid="${c.id}">
      ${c.hora ? `<span class="badge neutro">${DB.esc(c.hora)}</span>` : ""}
      <span class="ag-nome">${DB.esc(c.titulo)}${c.nota?` <span style="color:var(--tinta-45);font-weight:400">— ${DB.esc(c.nota)}</span>`:""}</span>
      <button type="button" class="btn icon ghost sm" data-delcpm="${c.id}" title="Excluir" aria-label="Excluir compromisso">✕</button>
    </div>`).join("");

  el.innerHTML = `${leadsHtml}${cpmHtml}`;
  el.querySelectorAll("[data-leadid]").forEach(row=>{
    row.onclick = ()=> window.SoluaLead.open(row.dataset.leadid, {onChange: render});
  });
  el.querySelectorAll(".cpm-row").forEach(row=>{
    row.onclick = e=>{ if(e.target.closest("[data-delcpm]")) return; abrirCompromisso(row.dataset.cpmid); };
  });
  el.querySelectorAll("[data-delcpm]").forEach(btn=>{
    btn.onclick = e=>{
      e.stopPropagation();
      UI.confirmAction("Excluir este compromisso?", ()=>{ DB.deleteCompromisso(btn.dataset.delcpm); render(); });
    };
  });
}

// -------- criar/editar compromisso --------
let cpmEditId = null;
function abrirCompromisso(id){
  cpmEditId = id || null;
  const c = id ? DB.getCompromisso(id) : {data: diaSelecionado || ymdLocal(new Date()), titulo:"", hora:"", nota:""};
  document.getElementById("cpmModalTitle").textContent = id ? "Editar compromisso" : "Novo compromisso";
  document.getElementById("cpmData").value = c.data || "";
  document.getElementById("cpmTitulo").value = c.titulo || "";
  document.getElementById("cpmHora").value = c.hora || "";
  document.getElementById("cpmNota").value = c.nota || "";
  document.getElementById("btnExcluirCompromisso").style.display = id ? "" : "none";
  UI.openOverlay("compromissoOverlay");
}
document.getElementById("btnNovoCompromisso").onclick = ()=> abrirCompromisso(null);
document.getElementById("btnSalvarCompromisso").onclick = ()=>{
  const data = document.getElementById("cpmData").value;
  const titulo = document.getElementById("cpmTitulo").value.trim();
  if(!data){ UI.toast("Escolha uma data.","err"); return; }
  if(!titulo){ UI.toast("Dê um título ao compromisso.","err"); return; }
  const payload = { data, titulo, hora: document.getElementById("cpmHora").value, nota: document.getElementById("cpmNota").value.trim() };
  const me = DB.currentUser();
  if(cpmEditId) DB.updateCompromisso(cpmEditId, payload);
  else DB.addCompromisso(Object.assign({autorId: me?me.id:null}, payload));
  UI.toast(cpmEditId?"Compromisso atualizado.":"Compromisso criado.","ok");
  UI.closeOverlay("compromissoOverlay");
  diaSelecionado = data;
  render();
};
document.getElementById("btnExcluirCompromisso").onclick = ()=>{
  if(!cpmEditId) return;
  UI.confirmAction("Excluir este compromisso?", ()=>{
    DB.deleteCompromisso(cpmEditId); UI.closeOverlay("compromissoOverlay"); UI.toast("Compromisso excluído.","err"); render();
  });
};

document.getElementById("btnMesAnterior").onclick = ()=>{ cursor.setMonth(cursor.getMonth()-1); render(); };
document.getElementById("btnMesProximo").onclick = ()=>{ cursor.setMonth(cursor.getMonth()+1); render(); };
document.getElementById("btnHoje").onclick = ()=>{
  cursor = new Date(); cursor.setDate(1); cursor.setHours(0,0,0,0);
  diaSelecionado = ymdLocal(new Date());
  render();
};

render();
})();
