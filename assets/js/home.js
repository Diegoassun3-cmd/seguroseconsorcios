/* Solua — interações específicas da Home: carrossel do hero,
   vitrine de imóveis em destaque, marquee de parceiros e blog. */
(function(){
"use strict";
const DB = window.SoluaDB;

/* HERO CAROUSEL */
const heroPhotos = [
  "https://picsum.photos/seed/solua-hero-1/1800/1100",
  "https://picsum.photos/seed/solua-hero-2/1800/1100",
  "https://picsum.photos/seed/solua-hero-3/1800/1100",
  "https://picsum.photos/seed/solua-hero-4/1800/1100"
];
const heroEl = document.getElementById("heroPhoto");
if(heroEl){
  const scrimEl = heroEl.querySelector(".scrim");
  // cada slide fica marcado com data-cms — admin pode trocar por foto ou vídeo
  // em Design; sem override, cai no picsum padrão já aplicado inline aqui.
  heroPhotos.forEach((url,i)=>{
    const s = document.createElement("div");
    s.className = "slide"+(i===0?" on":"");
    s.dataset.cms = `home.hero.midia${i+1}`;
    s.dataset.cmsMedia = "bg";
    s.style.backgroundImage = `url("${url}")`;
    heroEl.insertBefore(s, scrimEl);
  });
  const dots = document.getElementById("heroDots");
  dots.innerHTML = heroPhotos.map((_,i)=>`<button data-i="${i}" class="${i===0?"on":""}"></button>`).join("");
  let idx = 0;
  function go(n){
    idx = n;
    heroEl.querySelectorAll(".slide").forEach((s,i)=> s.classList.toggle("on", i===idx));
    dots.querySelectorAll("button").forEach((b,i)=> b.classList.toggle("on", i===idx));
  }
  dots.querySelectorAll("button").forEach(b=> b.onclick = ()=> go(+b.dataset.i));
  setInterval(()=> go((idx+1)%heroPhotos.length), 5500);
}

/* IMÓVEIS EM DESTAQUE */
const propEl = document.getElementById("propDestaque");
if(propEl){
  const destaques = DB.getImoveis().filter(i=>i.destaque).slice(0,3);
  propEl.innerHTML = destaques.map(i=>`
    <a class="prop-card" href="imovel.html?id=${i.id}">
      <div class="ph">
        <img src="${i.fotos[0]}" alt="${DB.esc(i.titulo)}" loading="lazy">
        <span class="tag destaque">Destaque</span>
      </div>
      <div class="bd">
        <div class="valor">${i.finalidade==="locacao" ? DB.formatBRL(i.valor)+"/mês" : DB.formatBRL(i.valor)}</div>
        <h3>${DB.esc(i.titulo)}</h3>
        <div class="loc">${DB.esc(i.bairro)}, ${DB.esc(i.cidade)}</div>
        <div class="specs"><span>${i.quartos} dorm.</span><span>${i.vagas} vaga(s)</span><span>${i.areaM2} m²</span></div>
      </div>
    </a>`).join("");
}

/* CARTÕES FLUTUANTES — nos vãos entre seções, nunca sobre foto/texto */
const gapCard1 = document.getElementById("gapCard1");
if(gapCard1) gapCard1.innerHTML = window.SoluaChrome.renderGapCard({
  align:"center", icone:"🏠", titulo:`${DB.getImoveis().length} imóveis`, texto:"no catálogo completo, com filtros por tipo e preço."
});
const gapCard2 = document.getElementById("gapCard2");
if(gapCard2) gapCard2.innerHTML = window.SoluaChrome.renderGapCard({
  align:"right", icone:"✓", titulo:"+15 seguradoras", texto:"comparadas antes de você decidir."
});

/* MARQUEE DE PARCEIROS */
const marcas = ["Porto Seguro","Bradesco Seguros","SulAmérica","Allianz","HDI","Tokio Marine","Azul Seguros","Porto Bank","Ademicon","Mapfre","Zurich","Liberty"];
const mq = document.getElementById("mq");
if(mq) mq.innerHTML = [...marcas,...marcas].map(m=>`<span>${m}</span>`).join("<span>·</span>");

/* BLOG — 3 destaques (os mais recentes); o catálogo completo é blog.html */
const postsEl = document.getElementById("posts");
if(postsEl){
  const destaques = DB.getPostsPublicados().slice(0,3);
  postsEl.innerHTML = destaques.map(window.SoluaBlog.cardHtml).join("");
  postsEl.onclick = e=>{
    const a = e.target.closest("[data-postid]"); if(!a) return;
    const post = destaques.find(p=>p.id===a.dataset.postid);
    window.SoluaBlog.abrirPost(post);
  };
}
window.SoluaBlog.initReader();

window.SoluaChrome.observeReveals();
})();
