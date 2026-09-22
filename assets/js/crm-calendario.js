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

  document.getElementById("calGrid").innerHTML =
    DIAS_SEMANA.map(d=>`<div class="cal-dow">${d}</div>`).join("") +
    diasDoMes().map(({data,outroMes})=>{
      const key = ymdLocal(data);
      const itens = porDia[key] || [];
      const classes = ["cal-day"];
      if(outroMes) classes.push("outro-mes");
      if(key===hojeStr) classes.push("hoje");
      if(key===diaSelecionado) classes.push("sel");
      return `<button type="button" class="${classes.join(" ")}" data-day="${key}">
        <span class="cal-daynum">${data.getDate()}</span>
        <span class="cal-chips">
          ${itens.slice(0,3).map(l=>`<span class="cal-chip">${DB.esc(l.nome.split(" ")[0])}</span>`).join("")}
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
    el.innerHTML = `<div class="empty">${UI.emptyState("Clique num dia do calendário pra ver os contatos agendados.")}</div>`;
    return;
  }
  const d = parseDataLocal(diaSelecionado);
  titulo.textContent = d.toLocaleDateString("pt-BR",{weekday:"long", day:"2-digit", month:"long"});
  const itens = (leadsPorDia())[diaSelecionado] || [];
  if(!itens.length){
    el.innerHTML = `<div class="empty">${UI.emptyState("Nenhum contato agendado pra este dia.")}</div>`;
    return;
  }
  el.innerHTML = itens.map(l=>{
    const cons = DB.getUsuario(l.consultorId);
    return `<div class="agenda-row" data-leadid="${l.id}">
      <span class="badge ${l.produto}">${l.produto}</span>
      <span class="ag-nome">${DB.esc(l.nome)}</span>
      ${cons ? `<span class="miniav" style="background:${cons.avatarBg}">${DB.iniciais(cons.nome)}</span>` : ""}
    </div>`;
  }).join("");
  el.querySelectorAll("[data-leadid]").forEach(row=>{
    row.onclick = ()=> window.SoluaLead.open(row.dataset.leadid, {onChange: render});
  });
}

document.getElementById("btnMesAnterior").onclick = ()=>{ cursor.setMonth(cursor.getMonth()-1); render(); };
document.getElementById("btnMesProximo").onclick = ()=>{ cursor.setMonth(cursor.getMonth()+1); render(); };
document.getElementById("btnHoje").onclick = ()=>{
  cursor = new Date(); cursor.setDate(1); cursor.setHours(0,0,0,0);
  diaSelecionado = ymdLocal(new Date());
  render();
};

render();
})();
