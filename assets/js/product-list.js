/* Solua — Seguros e Consórcios: as fotos de produto levam ao simulador já
   com o tipo escolhido (evento solua:simular, ouvido por quote-flow.js) e o
   FAQ abre em acordeão. */
(function(){
"use strict";

document.addEventListener("click", e=>{
  const a = e.target.closest("[data-simular]"); if(!a) return;
  e.preventDefault();
  document.dispatchEvent(new CustomEvent("solua:simular", {detail:a.dataset.simular}));
});

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

window.SoluaProductList = { faq };
})();
