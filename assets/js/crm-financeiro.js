/* ===========================================================
   Solua CRM — Financeiro (visão de vendas e comissão)
   Página: crm/admin/financeiro.html

   Não existe ainda um sistema financeiro real por trás — os
   números aqui são calculados a partir dos negócios já marcados
   como fechados no CRM (campo "valor" de cada lead) e de um
   percentual de comissão ESTIMADO por produto. Ajuste os valores
   abaixo para refletir a política de comissionamento real da Solua.
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const COMISSAO_PCT = { seguro: 0.20, consorcio: 0.015, imovel: 0.05 };
const PRODUTO_LABEL = { seguro:"Seguros", consorcio:"Consórcios", imovel:"Imóveis" };
const PRODUTO_COR = { seguro:"var(--azul)", consorcio:"var(--amarelo)", imovel:"#7A4FB5" };

const leads = DB.getLeads();
const fechados = leads.filter(l=> DB.ESTAGIOS_GANHOS.has(l.estagio));
const emAberto = leads.filter(l=> l.estagio!=="perdido" && !DB.ESTAGIOS_GANHOS.has(l.estagio));

function comissao(l){ return (Number(l.valor)||0) * (COMISSAO_PCT[l.produto]||0); }

/* KPIs */
const totalVendido = fechados.reduce((s,l)=> s+(Number(l.valor)||0), 0);
const comissaoRealizada = fechados.reduce((s,l)=> s+comissao(l), 0);
const comissaoPrevista = emAberto.reduce((s,l)=> s+comissao(l), 0);
const ticketMedio = fechados.length ? totalVendido/fechados.length : 0;

document.getElementById("finKpis").innerHTML = `
  <div class="kpi"><span class="lbl">Total vendido (fechados)</span><b>${DB.formatBRL(totalVendido)}</b><span class="delta">${fechados.length} negócio(s) fechado(s)</span></div>
  <div class="kpi"><span class="lbl">Comissão realizada</span><b>${DB.formatBRL(comissaoRealizada)}</b><span class="delta up">sobre negócios já fechados</span></div>
  <div class="kpi"><span class="lbl">Comissão prevista</span><b>${DB.formatBRL(comissaoPrevista)}</b><span class="delta">se todo o funil em aberto fechar</span></div>
  <div class="kpi"><span class="lbl">Ticket médio</span><b>${DB.formatBRL(ticketMedio)}</b><span class="delta">por negócio fechado</span></div>
`;

/* VENDAS POR PRODUTO */
const porProduto = {};
["imovel","seguro","consorcio"].forEach(p=> porProduto[p] = fechados.filter(l=>l.produto===p).reduce((s,l)=>s+(Number(l.valor)||0),0));
const maxProduto = Math.max(...Object.values(porProduto), 1);
document.getElementById("finProdutoBars").innerHTML = Object.entries(porProduto).map(([p,v])=>`
  <div style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span>${PRODUTO_LABEL[p]}</span><b>${DB.formatBRL(v)}</b></div>
    <div style="height:8px;border-radius:100px;background:var(--creme-2)"><div style="height:100%;border-radius:100px;width:${(v/maxProduto)*100}%;background:${PRODUTO_COR[p]}"></div></div>
  </div>`).join("");

/* ÚLTIMOS 6 MESES */
const meses = [];
const hoje = new Date();
for(let i=5;i>=0;i--){
  const d = new Date(hoje.getFullYear(), hoje.getMonth()-i, 1);
  meses.push({key: d.getFullYear()+"-"+d.getMonth(), label: d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"})});
}
const porMes = meses.map(m=>{
  const total = fechados.filter(l=>{
    const d = new Date(l.atualizadoEm);
    return (d.getFullYear()+"-"+d.getMonth()) === m.key;
  }).reduce((s,l)=>s+(Number(l.valor)||0),0);
  return {label:m.label, total};
});
const maxMes = Math.max(...porMes.map(m=>m.total), 1);
document.getElementById("finMesesBars").innerHTML = porMes.map(m=>`
  <div style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span>${m.label}</span><b>${DB.formatBRL(m.total)}</b></div>
    <div style="height:8px;border-radius:100px;background:var(--creme-2)"><div style="height:100%;border-radius:100px;width:${(m.total/maxMes)*100}%;background:var(--tinta)"></div></div>
  </div>`).join("");

/* RANKING POR CONSULTOR */
const porConsultor = {};
fechados.forEach(l=>{
  const id = l.consultorId || "sem";
  if(!porConsultor[id]) porConsultor[id] = {nome: id==="sem" ? "Sem consultor" : (DB.getUsuario(id)||{}).nome || "—", produtos:new Set(), qtd:0, total:0, comissaoTotal:0};
  porConsultor[id].produtos.add(l.produto);
  porConsultor[id].qtd++;
  porConsultor[id].total += Number(l.valor)||0;
  porConsultor[id].comissaoTotal += comissao(l);
});
const rankingRows = Object.values(porConsultor).sort((a,b)=> b.total-a.total);
document.getElementById("finRanking").innerHTML = rankingRows.length ? rankingRows.map(r=>`
  <tr>
    <td><b>${DB.esc(r.nome)}</b></td>
    <td>${[...r.produtos].map(p=>PRODUTO_LABEL[p]||p).join(", ")}</td>
    <td>${r.qtd}</td>
    <td>${DB.formatBRL(r.total)}</td>
    <td>${DB.formatBRL(r.comissaoTotal)}</td>
  </tr>`).join("") : `<tr><td colspan="5" class="empty">${window.SoluaUI.emptyState("Nenhum negócio fechado ainda.")}</td></tr>`;

/* EXPORTAR CSV */
document.getElementById("btnExportarCsv").onclick = ()=>{
  const linhas = [["Nome","Produto","Tipo","Consultor","Valor","Comissão estimada","Fechado em"]];
  fechados.forEach(l=>{
    const cons = DB.getUsuario(l.consultorId);
    linhas.push([l.nome, PRODUTO_LABEL[l.produto]||l.produto, l.tipo||"", cons?cons.nome:"—", (Number(l.valor)||0).toFixed(2), comissao(l).toFixed(2), DB.formatDate(l.atualizadoEm)]);
  });
  const csv = linhas.map(row=> row.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "solua-financeiro.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
};
})();
