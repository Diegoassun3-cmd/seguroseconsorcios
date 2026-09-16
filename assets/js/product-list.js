/* Solua — lista de produtos com sub-abas (Pessoa física / Empresas / Todos)
   e acordeão de detalhes. Reutilizado por seguros.html e consorcios.html. */
(function(){
"use strict";
function render(arr, listElId, tabsElId){
  const target = document.getElementById(listElId);
  const tabsEl = document.getElementById(tabsElId);
  if(!target || !tabsEl) return;
  const categorias = ["Todos", ...new Set(arr.map(p=>p[3]))];
  let ativa = "Todos";
  tabsEl.innerHTML = categorias.map((c,i)=>`<button class="filt${i?"":" on"}" data-subtab="${c}">${c}</button>`).join("");
  const desenhar = ()=>{
    const filtrados = arr.filter(p=> ativa==="Todos" || p[3]===ativa);
    target.innerHTML = filtrados.map((p,i)=>`
<div class="item">
  <div class="item-hd"><span class="n">${String(i+1).padStart(2,"0")}</span><h3>${p[0]}</h3><span class="plus"></span></div>
  <div class="item-bd"><div class="in"><span></span><p>${p[1]}</p><div class="chips">${p[2].map(c=>`<span class="chip">${c}</span>`).join("")}</div></div></div>
</div>`).join("");
  };
  tabsEl.querySelectorAll("[data-subtab]").forEach(b=> b.onclick = ()=>{
    tabsEl.querySelectorAll("[data-subtab]").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); ativa = b.dataset.subtab; desenhar();
  });
  desenhar();
}

document.addEventListener("click", e=>{
  const it = e.target.closest(".item"); if(!it) return;
  const bd = it.querySelector(".item-bd"), open = it.classList.contains("open");
  it.closest(".list").querySelectorAll(".item.open").forEach(o=>{ o.classList.remove("open"); o.querySelector(".item-bd").style.maxHeight = 0; });
  if(!open){ it.classList.add("open"); bd.style.maxHeight = bd.scrollHeight+"px"; }
});

window.SoluaProductList = { render };
})();
