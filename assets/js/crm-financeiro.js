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
const UI = window.SoluaUI;
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

/* ============================================================
   CONTAS A PAGAR E A RECEBER — lançamentos manuais, com anexo
   opcional (comprovante/boleto). Ver nota na tela sobre por que
   a extração automática de valores do arquivo não está aqui.
   ============================================================ */
const MAX_ANEXO = 300000; // bytes — cabe folgado num localStorage típico (5-10MB)
function fileParaDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function formatBytes(n){
  if(!n) return "—";
  if(n < 1024) return n+" B";
  if(n < 1024*1024) return (n/1024).toFixed(0)+" KB";
  return (n/1024/1024).toFixed(1)+" MB";
}
function parseDataLocalFin(dateStr){ return new Date(dateStr+"T12:00:00"); }
function contaRotulo(dateStr){
  if(!dateStr) return {texto:"Sem data", tom:"prox"};
  const hoje = new Date(); hoje.setHours(12,0,0,0);
  const d = parseDataLocalFin(dateStr);
  const diffDias = Math.round((d-hoje)/86400000);
  if(diffDias < 0) return {texto:`Atrasado · ${Math.abs(diffDias)}d`, tom:"atrasado"};
  if(diffDias === 0) return {texto:"Vence hoje", tom:"hoje"};
  if(diffDias === 1) return {texto:"Amanhã", tom:"prox"};
  return {texto: d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}), tom:"prox"};
}

function renderContaForm(){
  document.getElementById("contaForm").innerHTML = `
    <div class="grid3">
      <div class="field"><label>Tipo</label><select id="cfTipo"><option value="saida">Saída (a pagar)</option><option value="entrada">Entrada (a receber)</option></select></div>
      <div class="field" style="grid-column:span 2"><label>Descrição</label><input id="cfDescricao" placeholder="Ex.: Aluguel da sala, comissão da Ana, fornecedor X…"></div>
      <div class="field"><label>Valor (R$)</label><input id="cfValor" type="number" min="0" step="0.01" placeholder="0,00"></div>
      <div class="field"><label>Categoria</label><input id="cfCategoria" placeholder="Ex.: Aluguel, Salários, Impostos…"></div>
      <div class="field"><label>Vencimento</label><input id="cfVencimento" type="date"></div>
    </div>
    <div class="field">
      <label>Anexo (comprovante, boleto, nota fiscal — opcional)</label>
      <input type="file" id="cfAnexo" accept="image/*,.pdf">
      <span id="cfAnexoInfo" style="font-size:12px;color:var(--tinta-45)"></span>
    </div>
    <button class="btn sm" id="btnAddConta">Adicionar lançamento</button>
  `;
  let anexoData = null, anexoNome = null;
  document.getElementById("cfAnexo").onchange = async (e)=>{
    const f = e.target.files[0];
    const info = document.getElementById("cfAnexoInfo");
    if(!f){ anexoData = null; anexoNome = null; info.textContent = ""; return; }
    if(f.size > MAX_ANEXO){
      UI.toast("Arquivo grande demais (limite de ~300KB).","err");
      e.target.value = ""; anexoData = null; anexoNome = null; info.textContent = "";
      return;
    }
    anexoData = await fileParaDataUrl(f);
    anexoNome = f.name;
    info.textContent = `${f.name} — ${formatBytes(f.size)}`;
  };
  document.getElementById("btnAddConta").onclick = ()=>{
    const descricao = document.getElementById("cfDescricao").value.trim();
    const valor = Number(document.getElementById("cfValor").value)||0;
    if(!descricao || !valor){ UI.toast("Preencha ao menos a descrição e o valor.","err"); return; }
    DB.addConta({
      tipo: document.getElementById("cfTipo").value,
      descricao, valor,
      categoria: document.getElementById("cfCategoria").value.trim() || "Outros",
      vencimento: document.getElementById("cfVencimento").value || "",
      anexoUrl: anexoData, anexoNome: anexoNome
    });
    UI.toast("Lançamento adicionado.","ok");
    renderContas();
    renderContaForm();
  };
}

function renderContas(){
  const contas = DB.getContas();
  const pendentes = contas.filter(c=>c.status!=="pago");
  const hojeStr = new Date().toISOString().slice(0,10);
  const venceHoje = pendentes.filter(c=>c.vencimento===hojeStr);
  const atrasadas = pendentes.filter(c=> c.vencimento && c.vencimento < hojeStr);
  const totalPagar = pendentes.filter(c=>c.tipo==="saida").reduce((s,c)=>s+Number(c.valor||0),0);
  const totalReceber = pendentes.filter(c=>c.tipo==="entrada").reduce((s,c)=>s+Number(c.valor||0),0);

  document.getElementById("contaResumo").innerHTML = `
    <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="kpi ${venceHoje.length?"accent":""}"><span class="lbl">Vence hoje</span><b>${venceHoje.length}</b><span class="delta">${DB.formatBRL(venceHoje.reduce((s,c)=>s+Number(c.valor||0),0))}</span></div>
      <div class="kpi"><span class="lbl">Atrasadas</span><b style="${atrasadas.length?"color:var(--vermelho)":""}">${atrasadas.length}</b><span class="delta">${DB.formatBRL(atrasadas.reduce((s,c)=>s+Number(c.valor||0),0))}</span></div>
      <div class="kpi"><span class="lbl">A pagar (pendente)</span><b>${DB.formatBRL(totalPagar)}</b><span class="delta">${pendentes.filter(c=>c.tipo==="saida").length} lançamento(s)</span></div>
      <div class="kpi"><span class="lbl">A receber (pendente)</span><b>${DB.formatBRL(totalReceber)}</b><span class="delta up">${pendentes.filter(c=>c.tipo==="entrada").length} lançamento(s)</span></div>
    </div>`;

  const ordenadas = contas.slice().sort((a,b)=> (a.vencimento||"9999").localeCompare(b.vencimento||"9999"));
  const el = document.getElementById("contaList");
  if(!ordenadas.length){
    el.innerHTML = `<div class="empty">${UI.emptyState("Nenhum lançamento ainda. Use o formulário acima para adicionar contas a pagar ou a receber.")}</div>`;
    return;
  }
  el.innerHTML = `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Vencimento</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th><th>Anexo</th><th></th></tr></thead>
    <tbody>
      ${ordenadas.map(c=>{
        const r = contaRotulo(c.vencimento);
        return `<tr style="${c.status==="pago"?"opacity:.5":""}">
          <td><span class="ag-tag ag-${c.status==="pago"?"prox":r.tom}">${c.status==="pago"?DB.formatDate(parseDataLocalFin(c.vencimento||hojeStr)):r.texto}</span></td>
          <td><span class="badge ${c.tipo==="entrada"?"ganho":"perdido"}">${c.tipo==="entrada"?"Entrada":"Saída"}</span></td>
          <td>${DB.esc(c.descricao)}</td>
          <td>${DB.esc(c.categoria||"—")}</td>
          <td><b>${DB.formatBRL(c.valor)}</b></td>
          <td><button class="btn ${c.status==="pago"?"ghost":""} sm" data-toggle="${c.id}">${c.status==="pago"?"Reabrir":"Marcar como pago"}</button></td>
          <td>${c.anexoUrl?`<a href="${c.anexoUrl}" download="${DB.esc(c.anexoNome||"anexo")}" style="color:var(--azul)">Ver anexo</a>`:"—"}</td>
          <td class="rowactions"><button class="btn danger ghost sm" data-delconta="${c.id}">Excluir</button></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table></div>`;

  el.querySelectorAll("[data-toggle]").forEach(btn=>{
    btn.onclick = ()=>{
      const c = DB.getConta(btn.dataset.toggle);
      DB.updateConta(c.id, {status: c.status==="pago" ? "pendente" : "pago"});
      renderContas();
    };
  });
  el.querySelectorAll("[data-delconta]").forEach(btn=>{
    btn.onclick = ()=>{
      UI.confirmAction("Excluir este lançamento definitivamente?", ()=>{
        DB.deleteConta(btn.dataset.delconta);
        renderContas();
        UI.toast("Lançamento excluído.","err");
      });
    };
  });
}

renderContaForm();
renderContas();
})();
