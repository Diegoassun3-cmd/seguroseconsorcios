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
  heroEl.insertAdjacentHTML("beforeend", window.SoluaChrome.renderSelo({cmsKey:"home.hero.selo", texto:"25 ANOS SOLUA DESDE 2001", pos:"br"}));
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

/* MARQUEE DE PARCEIROS */
const marcas = ["Porto Seguro","Bradesco Seguros","SulAmérica","Allianz","HDI","Tokio Marine","Azul Seguros","Porto Bank","Ademicon","Mapfre","Zurich","Liberty"];
const mq = document.getElementById("mq");
if(mq) mq.innerHTML = [...marcas,...marcas].map(m=>`<span>${m}</span>`).join("<span>·</span>");

/* BLOG */
const posts = [
 {c:"Seguros",t:"Franquia, cobertura e preço: o que realmente muda no seguro auto",d:"6 min",dt:"12 ago 2026",r:"Três apólices com o mesmo preço podem proteger de formas completamente diferentes. Entenda o que olhar antes de fechar.",b:`<p>Quando alguém pede uma cotação de seguro auto, quase sempre a primeira pergunta é: quanto custa? É uma pergunta legítima, mas incompleta. Duas apólices com valor parecido podem ter diferenças enormes na hora em que você precisa delas.</p><h2>1. A franquia não é um detalhe</h2><p>A franquia é o valor que você paga em caso de colisão parcial. Uma apólice mais barata frequentemente tem franquia mais alta — o que significa que o desconto de hoje vira despesa no dia do sinistro. Vale comparar o par preço e franquia, nunca só o preço.</p><h2>2. Cobertura de terceiros define o seu risco real</h2><p>Danos materiais e corporais a terceiros são a cobertura que protege seu patrimônio de uma ação judicial. Muita gente contrata o mínimo e descobre tarde que o limite não cobria o carro que atingiu.</p><h2>3. Assistência 24h e carro reserva mudam sua rotina</h2><p>Guincho com quilometragem curta ou carro reserva de sete dias parecem detalhes até você depender deles por duas semanas. Verifique os limites, não apenas se o item existe na apólice.</p><h2>4. Perfil e uso do veículo</h2><p>O cálculo considera CEP de pernoite, garagem, condutores e uso do carro. Informações imprecisas barateiam a cotação e podem gerar recusa de indenização depois. Melhor informar corretamente desde o início.</p><p>O papel da corretora é justamente colocar essas variáveis lado a lado. Você decide com informação — e não pelo primeiro número que apareceu.</p>`},
 {c:"Consórcio",t:"Consórcio ou financiamento? A conta que quase ninguém faz",d:"7 min",dt:"04 ago 2026",r:"Não existe resposta única. Existe a resposta certa para o seu prazo, sua pressa e seu bolso.",b:`<p>A comparação entre consórcio e financiamento costuma ser feita de forma rasa: um tem juros, o outro não. Verdade, mas insuficiente para decidir.</p><h2>O que você está comprando em cada um</h2><p>No financiamento, você compra tempo: leva o bem hoje e paga juros por isso. No consórcio, você compra poder de compra futuro: forma uma poupança coletiva, paga taxa de administração no lugar de juros e recebe a carta de crédito na contemplação — por sorteio ou por lance.</p><h2>O custo total costuma surpreender</h2><p>Em prazos longos, o custo efetivo de um financiamento imobiliário pode ultrapassar de forma significativa o valor do imóvel. No consórcio, o custo se concentra na taxa de administração e no fundo de reserva, diluídos ao longo do plano.</p><h2>Quando o consórcio faz mais sentido</h2><ul><li>Você tem um objetivo em 2, 3 ou 5 anos e consegue planejar.</li><li>Quer disciplina de poupança com destino definido.</li><li>Pretende usar o crédito como pagamento à vista e negociar desconto.</li><li>Tem recurso para lance — inclusive FGTS, no caso de imóvel.</li></ul><h2>Quando o financiamento faz mais sentido</h2><p>Se você precisa do bem agora — mudança de cidade, nascimento de um filho, fim de contrato de aluguel — pagar juros pode ser o preço justo pela imediatez.</p><p>A pergunta correta não é qual é melhor, e sim: qual é o seu prazo? A partir dessa resposta, a conta se resolve sozinha.</p>`},
 {c:"Imóveis",t:"Comprar na planta em Campinas: o que verificar antes de assinar",d:"5 min",dt:"20 ago 2026",r:"Registro de incorporação, memorial descritivo e prazo de tolerância — o que realmente protege quem compra na planta.",b:`<p>Comprar na planta pode significar preço melhor e prazo de pagamento mais longo, mas exige atenção a detalhes que não aparecem no material de venda.</p><h2>Registro de incorporação</h2><p>Verifique se a incorporação está registrada no cartório de imóveis. Sem esse registro, a incorporadora não pode nem comercializar as unidades legalmente.</p><h2>Memorial descritivo</h2><p>É o documento que detalha acabamentos, materiais e especificações técnicas prometidas. Guarde-o: é sua referência para conferir a entrega.</p><h2>Prazo de tolerância</h2><p>A lei permite um atraso de até 180 dias sem multa para a incorporadora, contado a partir da data prevista de entrega. Depois disso, cabe indenização.</p><p>Uma corretora que representa o comprador, não a incorporadora, ajuda a ler esse contrato com outros olhos antes da assinatura.</p>`},
 {c:"Seguros",t:"Seguro residencial custa menos do que você imagina",d:"4 min",dt:"27 jul 2026",r:"O produto mais subestimado do mercado brasileiro — e o mais barato por real protegido.",b:`<p>Existe um descompasso curioso no Brasil: seguramos o carro com naturalidade e deixamos a casa, que costuma valer muito mais, sem qualquer proteção.</p><h2>O que a apólice cobre de fato</h2><p>Incêndio, queda de raio e explosão são a base obrigatória. A partir daí, você monta: roubo e furto qualificado, danos elétricos — que resolvem geladeira, TV e ar-condicionado queimados por oscilação —, vendaval, impacto de veículos e responsabilidade civil familiar.</p><h2>A assistência que se usa o ano inteiro</h2><p>Chaveiro, encanador, eletricista, conserto de eletrodomésticos e até desentupimento entram no pacote. Muita gente paga o seguro do ano em uma única visita emergencial de chaveiro em um domingo.</p><h2>Imóvel alugado também precisa</h2><p>Contratos de locação costumam exigir apólice de incêndio. Mas o inquilino pode — e deve — proteger também o conteúdo: móveis, eletrônicos e bens pessoais não estão cobertos pela apólice do proprietário.</p><p>Comparado ao valor do que protege, é provavelmente o seguro com melhor relação custo-benefício do mercado brasileiro.</p>`},
 {c:"Planejamento",t:"Lance no consórcio: as estratégias que realmente antecipam a contemplação",d:"6 min",dt:"18 jul 2026",r:"Livre, fixo, embutido e com FGTS. Entenda cada modalidade antes de dar o seu.",b:`<p>Contemplação por sorteio é sorte. Lance é estratégia. E, na maioria dos grupos, é o lance que define quem antecipa o crédito.</p><h2>Lance livre</h2><p>Você oferece o percentual que quiser do valor da carta. Vence quem ofertar mais naquela assembleia. Exige acompanhar o histórico do grupo para calibrar a oferta.</p><h2>Lance fixo</h2><p>A administradora define um percentual único. Se mais de um consorciado ofertar, decide-se por sorteio entre eles. É mais previsível e costuma ser bom para quem tem exatamente aquele valor disponível.</p><h2>Lance embutido</h2><p>Parte do próprio crédito é usada como lance. Você não desembolsa dinheiro novo, mas recebe uma carta menor. Útil para quem tem pressa e flexibilidade no valor do bem.</p><h2>FGTS no consórcio de imóvel</h2><p>O saldo do FGTS pode compor lance, complementar a carta ou amortizar parcelas, dentro das regras aplicáveis. É o recurso mais subutilizado por quem está em consórcio imobiliário.</p><p>Antes de ofertar, peça à sua corretora o histórico de contemplações do grupo. Ofertar acima do necessário é dinheiro deixado na mesa.</p>`},
 {c:"Planejamento",t:"Checklist: o que revisar no seu seguro antes de renovar",d:"4 min",dt:"30 jun 2026",r:"Renovação automática é conforto — e também a forma mais comum de pagar caro por cobertura errada.",b:`<p>A renovação costuma chegar quando você está ocupado. Aceitar automaticamente é fácil, mas raramente é a melhor decisão financeira do ano.</p><h2>1. Mudou alguma coisa na sua vida?</h2><p>Casamento, filho, mudança de endereço, novo condutor no carro, home office, reforma. Cada um desses eventos altera o risco — e, portanto, o preço e a cobertura ideal.</p><h2>2. O valor segurado ainda corresponde à realidade?</h2><p>Imóveis e bens se valorizam; veículos desvalorizam. Segurar acima do valor de mercado é pagar a mais; abaixo, é receber menos do que precisa.</p><h2>3. Você usou a apólice?</h2><p>Histórico limpo é argumento de negociação. Vale pedir revisão de bônus e recotação no mercado antes de aceitar o reajuste proposto.</p><h2>4. As assistências fazem sentido?</h2><p>Serviços que você nunca usou podem sair; os que faltaram no ano devem entrar. É o ajuste mais barato de fazer e o mais esquecido.</p><p>Uma revisão de quinze minutos com seu corretor, trinta dias antes do vencimento, costuma valer mais do que qualquer cupom de desconto.</p>`}
];
const cats = ["Todos", ...new Set(posts.map(p=>p.c))];
const filtersEl = document.getElementById("filters");
if(filtersEl) filtersEl.innerHTML = cats.map((c,i)=>`<button class="filt${i?"":" on"}" data-c="${c}">${c}</button>`).join("");
const CAT_ICONS = {
  "Seguros": '<path d="M14 4l9 4v6c0 6.5-4 11-9 13-5-2-9-6.5-9-13V8l9-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  "Consórcio": '<circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 9v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  "Imóveis": '<path d="M5 12l9-8 9 8M7 11v10h14V11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  "Planejamento": '<rect x="5" y="6" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 11h18M9 4v4M19 4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9.5 16.5l2.5 2.5 5.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
};
const catIcon = c => `<svg class="post-ico" viewBox="0 0 28 28" aria-hidden="true">${CAT_ICONS[c]||CAT_ICONS["Planejamento"]}</svg>`;
const drawPosts = f => { const el = document.getElementById("posts"); if(!el) return; el.innerHTML = posts.filter(p=>f==="Todos"||p.c===f).map(p=>`
<article class="post" data-i="${posts.indexOf(p)}">
  ${catIcon(p.c)}
  <span class="cat">${p.c}</span><h3>${p.t}</h3><p>${p.r}</p>
  <div class="meta"><span>${p.dt}</span><span>${p.d} de leitura</span></div>
</article>`).join(""); };
drawPosts("Todos");
if(filtersEl) filtersEl.onclick = e=>{ const b=e.target.closest(".filt"); if(!b) return;
 document.querySelectorAll(".filt").forEach(x=>x.classList.remove("on")); b.classList.add("on"); drawPosts(b.dataset.c); };

const reader = document.getElementById("reader");
const postsEl = document.getElementById("posts");
if(postsEl) postsEl.onclick = e=>{ const a=e.target.closest(".post"); if(!a) return;
 const p = posts[a.dataset.i];
 document.getElementById("rbody").innerHTML = `<span class="cat">${p.c}</span><h1>${p.t}</h1>
 <div class="meta">${p.dt} · ${p.d} de leitura · por Solua</div>${p.b}
 <div class="reader-cta"><h3>Quer aplicar isso ao seu caso?</h3><p>Peça uma cotação sem compromisso e receba a análise de um consultor.</p><a class="btn lg" href="contato.html">Falar com um consultor</a></div>`;
 reader.classList.add("on"); reader.scrollTop = 0; document.body.style.overflow = "hidden"; };
window.closeReader = ()=>{ reader.classList.remove("on"); document.body.style.overflow=""; };
const closeRBtn = document.getElementById("closeR"); if(closeRBtn) closeRBtn.onclick = window.closeReader;
addEventListener("keydown", e=> e.key==="Escape" && window.closeReader());

window.SoluaChrome.observeReveals();
})();
