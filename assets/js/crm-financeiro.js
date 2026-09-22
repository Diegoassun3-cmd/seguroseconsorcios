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
// imovel usa --roxo-vivo (não o --roxo dos badges) pra ficar distinguível de
// --azul também para quem tem daltonismo — checado com o validador de
// paleta da skill de dataviz na ordem em que as barras são desenhadas
const PRODUTO_COR = { seguro:"var(--azul)", consorcio:"var(--amarelo)", imovel:"var(--roxo-vivo)" };

const leads = DB.getLeads();
const fechados = leads.filter(l=> DB.ESTAGIOS_GANHOS.has(l.estagio));
const emAberto = leads.filter(l=> l.estagio!=="perdido" && !DB.ESTAGIOS_GANHOS.has(l.estagio));

function comissao(l){ return (Number(l.valor)||0) * (COMISSAO_PCT[l.produto]||0); }

const ICO = {
  cifrao: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M16 7.5c0-1.9-1.8-3-4-3s-4 1.1-4 2.8c0 3.7 8 1.9 8 5.7 0 1.7-1.8 3-4 3s-4-1.1-4-3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>`,
  relogio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4z"/></svg>`
};

/* KPIs */
const totalVendido = fechados.reduce((s,l)=> s+(Number(l.valor)||0), 0);
const comissaoRealizada = fechados.reduce((s,l)=> s+comissao(l), 0);
const comissaoPrevista = emAberto.reduce((s,l)=> s+comissao(l), 0);
const ticketMedio = fechados.length ? totalVendido/fechados.length : 0;

document.getElementById("finKpis").innerHTML = `
  <div class="kpi accent"><span class="kpi-ico">${ICO.cifrao}</span><span class="lbl">Total vendido (fechados)</span><b>${DB.formatBRL(totalVendido)}</b><span class="delta">${fechados.length} negócio(s) fechado(s)</span></div>
  <div class="kpi"><span class="kpi-ico">${ICO.check}</span><span class="lbl">Comissão realizada</span><b>${DB.formatBRL(comissaoRealizada)}</b><span class="delta up">sobre negócios já fechados</span></div>
  <div class="kpi"><span class="kpi-ico">${ICO.relogio}</span><span class="lbl">Comissão prevista</span><b>${DB.formatBRL(comissaoPrevista)}</b><span class="delta">se todo o funil em aberto fechar</span></div>
  <div class="kpi"><span class="kpi-ico">${ICO.ticket}</span><span class="lbl">Ticket médio</span><b>${DB.formatBRL(ticketMedio)}</b><span class="delta">por negócio fechado</span></div>
`;

/* VENDAS POR PRODUTO */
const porProduto = {};
["imovel","seguro","consorcio"].forEach(p=> porProduto[p] = fechados.filter(l=>l.produto===p).reduce((s,l)=>s+(Number(l.valor)||0),0));
const maxProduto = Math.max(...Object.values(porProduto), 1);
const totalProduto = Object.values(porProduto).reduce((a,v)=>a+v,0);
document.getElementById("finProdutoBars").innerHTML = Object.entries(porProduto).map(([p,v])=>{
  const pct = totalProduto ? Math.round((v/totalProduto)*100) : 0;
  return `<div class="bc-row">
    <div class="bc-hd">
      <span class="bc-name">${PRODUTO_LABEL[p]}</span>
      <span class="bc-nums"><b>${DB.formatBRL(v)}</b><span class="bc-pct">${pct}%</span></span>
    </div>
    <div class="bc-track"><div class="bc-fill" style="width:${(v/maxProduto)*100}%;background:${PRODUTO_COR[p]}"></div></div>
  </div>`;
}).join("");

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
  <div class="bc-row">
    <div class="bc-hd"><span class="bc-name">${m.label}</span><b>${DB.formatBRL(m.total)}</b></div>
    <div class="bc-track"><div class="bc-fill" style="width:${(m.total/maxMes)*100}%;background:var(--tinta)"></div></div>
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
