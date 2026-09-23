/* ===========================================================
   Solua — Blog (catálogo completo). Página: blog.html
   Filtro por categoria + grade de cards + leitor em tela cheia
   (peças compartilhadas com a Home em assets/js/blog-common.js).
   =========================================================== */
(function(){
"use strict";
const DB = window.SoluaDB;
const B = window.SoluaBlog;

const posts = DB.getPostsPublicados();
const cats = ["Todos", ...DB.getCategoriasPost().filter(c=> posts.some(p=>p.categoria===c))];
const filtersEl = document.getElementById("filters");
if(filtersEl) filtersEl.innerHTML = cats.map((c,i)=>`<button class="filt${i?"":" on"}" data-c="${c}">${c}</button>`).join("");

const gridEl = document.getElementById("blogGrid");
const emptyEl = document.getElementById("blogEmpty");
function draw(f){
  const lista = posts.filter(p=> f==="Todos" || p.categoria===f);
  if(gridEl) gridEl.innerHTML = lista.map(B.cardHtml).join("");
  if(emptyEl) emptyEl.style.display = lista.length ? "none" : "";
}
draw("Todos");

if(filtersEl) filtersEl.onclick = e=>{
  const b = e.target.closest(".filt"); if(!b) return;
  document.querySelectorAll(".filt").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
  draw(b.dataset.c);
};
if(gridEl) gridEl.onclick = e=>{
  const a = e.target.closest("[data-postid]"); if(!a) return;
  const post = posts.find(p=>p.id===a.dataset.postid);
  B.abrirPost(post);
};
B.initReader();

// abre um artigo direto quando chega pela busca (blog.html?post=ID)
const postParam = new URLSearchParams(location.search).get("post");
if(postParam){
  const post = DB.getPost(postParam);
  if(post && post.status==="publicado") B.abrirPost(post);
}

window.SoluaChrome.observeReveals();
})();
