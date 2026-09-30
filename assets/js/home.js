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
  const n = heroPhotos.length;
  function go(i){
    idx = (i + n) % n;
    heroEl.querySelectorAll(".slide").forEach((s,j)=> s.classList.toggle("on", j===idx));
    dots.querySelectorAll("button").forEach((b,j)=> b.classList.toggle("on", j===idx));
  }
  dots.querySelectorAll("button").forEach(b=> b.onclick = ()=> { go(+b.dataset.i); reiniciarAuto(); });

  let timer;
  function reiniciarAuto(){
    clearInterval(timer);
    timer = setInterval(()=> go(idx+1), 5500);
  }
  reiniciarAuto();

  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  if(prevBtn) prevBtn.onclick = ()=> { go(idx-1); reiniciarAuto(); };
  if(nextBtn) nextBtn.onclick = ()=> { go(idx+1); reiniciarAuto(); };

  // arrastar (mouse) ou passar o dedo (touch) também troca a foto/vídeo —
  // só conta como arraste acima de um limite mínimo, senão deixa o clique
  // normal (num botão/link do hero) acontecer sem interferência
  let dragStartX = null;
  heroEl.addEventListener("pointerdown", e=>{
    if(e.target.closest(".hero-arrow, .hero-dots, a, button")) return;
    dragStartX = e.clientX;
    heroEl.classList.add("dragging");
  });
  heroEl.addEventListener("pointerup", e=>{
    heroEl.classList.remove("dragging");
    if(dragStartX == null) return;
    const delta = e.clientX - dragStartX;
    dragStartX = null;
    if(Math.abs(delta) > 40){
      go(delta < 0 ? idx+1 : idx-1);
      reiniciarAuto();
    }
  });
  heroEl.addEventListener("pointerleave", ()=>{ dragStartX = null; heroEl.classList.remove("dragging"); });
}

/* IMÓVEIS EM DESTAQUE */
const propEl = document.getElementById("propDestaque");
if(propEl){
  const MID = window.SoluaMidia;
  const destaques = DB.getImoveisPublicados().filter(i=>i.destaque).slice(0,3);
  propEl.innerHTML = destaques.map(i=>`
    <a class="prop-card" href="imovel.html?id=${i.id}">
      <div class="ph">
        <img ${(i.fotos||[])[0]?`data-midia="${DB.esc(i.fotos[0])}"`:""} src="${DB.esc((i.fotos||[])[0] ? MID.srcInicial(i.fotos[0]) : "https://picsum.photos/seed/solua-imovel-fallback/1200/800")}" alt="${DB.esc(i.titulo)}" loading="lazy">
        <span class="tag destaque">Destaque</span>
      </div>
      <div class="bd">
        <div class="valor">${DB.esc(DB.precoImovelTexto(i))}</div>
        <h3>${DB.esc(i.titulo)}</h3>
        <div class="loc">${DB.esc(i.bairro)}, ${DB.esc(i.cidade)}</div>
        <div class="specs"><span>${i.quartos} dorm.</span><span>${i.vagas} vaga(s)</span><span>${i.areaM2} m²</span></div>
      </div>
    </a>`).join("");
  MID.hidratar(propEl);
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
