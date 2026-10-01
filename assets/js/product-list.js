/* Solua — cards de produtos (Seguros e Consórcios), passos de "como funciona"
   e acordeão do FAQ. Cada card tem "Simular", que já escolhe o tipo no
   simulador (evento solua:simular, ouvido por quote-flow.js). */
(function(){
"use strict";
const SETA = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// itens: [{nome, texto, tipo}] — tipo é o nome usado no simulador (SoluaDB.TIPOS)
function cards(itens, elId, rotulo){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = itens.map(p=>`
  <article class="px-card">
    <h3>${p.nome}</h3>
    <p>${p.texto}</p>
    <a class="px-go" href="#simulador" data-simular="${p.tipo}">${rotulo} ${SETA}</a>
  </article>`).join("");
  el.addEventListener("click", e=>{
    const a = e.target.closest("[data-simular]"); if(!a) return;
    e.preventDefault();
    document.dispatchEvent(new CustomEvent("solua:simular", {detail:a.dataset.simular}));
  });
}

// passos: [[titulo, texto]]
function passos(lista, elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = lista.map((p,i)=>`
  <li><span class="px-n">${String(i+1).padStart(2,"0")}</span><h3>${p[0]}</h3><p>${p[1]}</p></li>`).join("");
}

// faqs: [[pergunta, resposta]]
function faq(lista, elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = lista.map(f=>`
<div class="item"><div class="item-hd"><h3>${f[0]}</h3><span class="plus"></span></div>
<div class="item-bd"><div class="in"><p>${f[1]}</p></div></div></div>`).join("");
}

document.addEventListener("click", e=>{
  const it = e.target.closest(".item"); if(!it) return;
  const bd = it.querySelector(".item-bd"), open = it.classList.contains("open");
  it.closest(".list").querySelectorAll(".item.open").forEach(o=>{ o.classList.remove("open"); o.querySelector(".item-bd").style.maxHeight = 0; });
  if(!open){ it.classList.add("open"); bd.style.maxHeight = bd.scrollHeight+"px"; }
});

window.SoluaProductList = { cards, passos, faq };
})();
