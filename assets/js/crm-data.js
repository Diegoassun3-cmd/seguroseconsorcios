/* ===========================================================
   Solua CRM — camada de dados
   -----------------------------------------------------------
   Camada única, compartilhada entre o site público (captura de
   leads pelo formulário de cotação) e a área de CRM (/crm/*).

   Persistência: localStorage, no domínio do site. Isso é
   suficiente para uma demonstração funcional completa (tudo
   funciona de verdade no navegador, sem servidor), mas é local
   a cada navegador/dispositivo — não é um banco compartilhado
   entre atendentes. Para produção multiusuário, troque as
   funções da seção "PERSISTÊNCIA" por chamadas fetch() a uma
   API (Node/PHP/Supabase/Firebase etc.) mantendo a mesma
   assinatura de funções — o resto do CRM não precisa mudar.

   Os disparos de e-mail e WhatsApp (crm/admin/disparos.html)
   são simulados: o histórico, as métricas e o status ficam
   reais dentro do CRM, mas o envio de fato depende de conectar
   um provedor (ver README.md, seção "Ligando os disparos").
   =========================================================== */
(function(global){
  "use strict";

  // v3: acrescenta a linha de negócio de Imóveis (pipeline, tipos, catálogo de
  // imóveis) junto de Seguros e Consórcios — mantém o mesmo desenho de dados.
  const KEY = "solua_crm_v3";

  const PIPELINES = {
    seguro: [
      {id:"novo",        label:"Novo lead",        cor:"#8a8f98"},
      {id:"qualificacao",label:"Qualificação",      cor:"#118ECC"},
      {id:"cotacao",     label:"Cotação enviada",   cor:"#004BA5"},
      {id:"negociacao",  label:"Em negociação",     cor:"#B8862B"},
      {id:"apolice",     label:"Apólice emitida",   cor:"#1E8E5A"},
      {id:"perdido",     label:"Perdido",           cor:"#B0453D"}
    ],
    consorcio: [
      {id:"novo",        label:"Novo lead",        cor:"#8a8f98"},
      {id:"qualificacao",label:"Qualificação",      cor:"#118ECC"},
      {id:"simulacao",   label:"Simulação enviada", cor:"#004BA5"},
      {id:"proposta",    label:"Proposta / Adesão", cor:"#B8862B"},
      {id:"contemplado", label:"Contemplado",       cor:"#1E8E5A"},
      {id:"perdido",     label:"Perdido",           cor:"#B0453D"}
    ],
    imovel: [
      {id:"novo",        label:"Novo lead",        cor:"#8a8f98"},
      {id:"qualificacao",label:"Qualificação",      cor:"#118ECC"},
      {id:"visita",      label:"Visita agendada",   cor:"#004BA5"},
      {id:"proposta",    label:"Proposta",          cor:"#B8862B"},
      {id:"fechado",     label:"Negócio fechado",   cor:"#1E8E5A"},
      {id:"perdido",     label:"Perdido",           cor:"#B0453D"}
    ]
  };

  const TIPOS = {
    seguro: ["Auto","Residencial","Vida","Empresarial","Saúde / Odonto","Viagem","Garantia locatícia","Condomínio","Outro"],
    consorcio: ["Imóvel","Automóvel","Pesados / Máquinas","Serviços"],
    imovel: ["Apartamento","Casa","Casa em condomínio","Cobertura","Terreno","Sala comercial","Rural"]
  };

  const ORIGENS = ["Site","Indicação","WhatsApp","Instagram","Anúncio","Telefone","Balcão"];

  const EQUIPE_SEED = [
    {id:"u1", nome:"Diego Assunção",     email:"diego.assun3@gmail.com", papel:"Administrador", produto:"ambos",     ativo:true, avatarBg:"#004BA5"},
    {id:"u2", nome:"Ana Beatriz Souza",  email:"ana.souza@solua.com.br", papel:"Consultora",     produto:"seguro",    ativo:true, avatarBg:"#118ECC"},
    {id:"u3", nome:"Rafael Lima",        email:"rafael.lima@solua.com.br", papel:"Consultor",    produto:"consorcio", ativo:true, avatarBg:"#B8862B"},
    {id:"u4", nome:"Camila Torres",      email:"camila.torres@solua.com.br", papel:"Consultora", produto:"seguro",    ativo:true, avatarBg:"#1E8E5A"},
    {id:"u5", nome:"Bruno Amaral",       email:"bruno.amaral@solua.com.br", papel:"Consultor de Imóveis", produto:"imovel", ativo:true, avatarBg:"#7A4FB5"}
  ];

  // -------------------- CATÁLOGO DE IMÓVEIS --------------------
  // Estes são produtos do portfólio (como um cardápio), não dados de cliente —
  // por isso entram no seed junto com equipe/modelos, e não como "contato falso".
  // Fotos são placeholders (picsum.photos, com seed fixa por imóvel) até a Solua
  // subir as fotos reais pela tela de Personalização/Design.
  function fotoImovel(seed, i){ return `https://picsum.photos/seed/solua-imovel-${seed}-${i}/1200/800`; }
  const IMOVEIS_SEED = [
    {id:"imv1", titulo:"Apartamento 3 dorm. no Cambuí", finalidade:"venda", tipo:"Apartamento",
      bairro:"Cambuí", cidade:"Campinas", valor:980000, quartos:3, suites:1, vagas:2, areaM2:112,
      status:"pronto", destaque:true,
      descricao:"Apartamento reformado a poucos quarteirões da Rua Coronel Quirino, com sacada gourmet, living amplo e vista aberta. Prédio com piscina, academia e portaria 24h.",
      fotos:[fotoImovel(1,1),fotoImovel(1,2),fotoImovel(1,3),fotoImovel(1,4)]},
    {id:"imv2", titulo:"Casa em condomínio no Swiss Park", finalidade:"venda", tipo:"Casa em condomínio",
      bairro:"Swiss Park", cidade:"Campinas", valor:1650000, quartos:4, suites:2, vagas:4, areaM2:280,
      status:"pronto", destaque:true,
      descricao:"Casa térrea em condomínio fechado com segurança 24h, quintal amplo, área gourmet completa e escritório. Condomínio com clube, quadras e trilha.",
      fotos:[fotoImovel(2,1),fotoImovel(2,2),fotoImovel(2,3),fotoImovel(2,4)]},
    {id:"imv3", titulo:"Cobertura duplex em Cambuí", finalidade:"venda", tipo:"Cobertura",
      bairro:"Cambuí", cidade:"Campinas", valor:2200000, quartos:3, suites:3, vagas:3, areaM2:230,
      status:"lancamento", destaque:true,
      descricao:"Cobertura duplex com terraço privativo, piscina própria e churrasqueira. Entrega prevista para 2027, com condições especiais para quem compra na planta.",
      fotos:[fotoImovel(3,1),fotoImovel(3,2),fotoImovel(3,3)]},
    {id:"imv4", titulo:"Apartamento 2 dorm. no Taquaral", finalidade:"locacao", tipo:"Apartamento",
      bairro:"Taquaral", cidade:"Campinas", valor:2800, quartos:2, suites:0, vagas:1, areaM2:68,
      status:"pronto", destaque:false,
      descricao:"Apartamento de frente para o Lagoa do Taquaral, andar alto, sol da manhã. Prédio com salão de festas e playground. Aceita pet.",
      fotos:[fotoImovel(4,1),fotoImovel(4,2),fotoImovel(4,3)]},
    {id:"imv5", titulo:"Casa térrea no Jardim Chapadão", finalidade:"venda", tipo:"Casa",
      bairro:"Jardim Chapadão", cidade:"Campinas", valor:620000, quartos:3, suites:1, vagas:2, areaM2:150,
      status:"pronto", destaque:false,
      descricao:"Casa térrea de rua, bem localizada, com quintal e edícula nos fundos que pode virar renda extra. Próxima a escolas e comércio.",
      fotos:[fotoImovel(5,1),fotoImovel(5,2),fotoImovel(5,3)]},
    {id:"imv6", titulo:"Sala comercial no centro", finalidade:"locacao", tipo:"Sala comercial",
      bairro:"Centro", cidade:"Campinas", valor:1900, quartos:0, suites:0, vagas:0, areaM2:45,
      status:"pronto", destaque:false,
      descricao:"Sala comercial em prédio com portaria, próxima ao terminal central. Ideal para escritório ou consultório.",
      fotos:[fotoImovel(6,1),fotoImovel(6,2)]},
    {id:"imv7", titulo:"Terreno em condomínio no Sousas", finalidade:"venda", tipo:"Terreno",
      bairro:"Sousas", cidade:"Campinas", valor:480000, quartos:0, suites:0, vagas:0, areaM2:500,
      status:"pronto", destaque:false,
      descricao:"Terreno plano de 500m² em condomínio fechado de alto padrão, pronto para construir. Infraestrutura completa e área verde preservada.",
      fotos:[fotoImovel(7,1),fotoImovel(7,2)]},
    {id:"imv8", titulo:"Apartamento 4 dorm. no Nova Campinas", finalidade:"venda", tipo:"Apartamento",
      bairro:"Nova Campinas", cidade:"Campinas", valor:1450000, quartos:4, suites:2, vagas:3, areaM2:165,
      status:"em_construcao", destaque:true,
      descricao:"Lançamento de alto padrão com plantas de 165m², varanda gourmet integrada e lazer completo. Previsão de entrega em 2027.",
      fotos:[fotoImovel(8,1),fotoImovel(8,2),fotoImovel(8,3),fotoImovel(8,4)]}
  ];

  // -------------------- BLOG (artigos do site público) --------------------
  // Assim como o catálogo de imóveis, são "produtos" (conteúdo editorial),
  // não contatos — por isso entram no seed. O corpo de cada artigo é uma
  // lista de blocos (parágrafo/subtítulo/lista/imagem), no mesmo espírito
  // dos blocos de e-mail dos modelos — renderPostCorpo() vira HTML escapado.
  function fotoPost(seed){ return `https://picsum.photos/seed/solua-blog-${seed}/900/700`; }
  const POSTS_SEED = [
    {id:"post1", categoria:"Seguros", titulo:"Franquia, cobertura e preço: o que realmente muda no seguro auto",
      resumo:"Três apólices com o mesmo preço podem proteger de formas completamente diferentes. Entenda o que olhar antes de fechar.",
      capa: fotoPost("auto"), status:"publicado", autorId:null, criadoEm:"2026-08-12T09:00:00.000Z", publicadoEm:"2026-08-12T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"Quando alguém pede uma cotação de seguro auto, quase sempre a primeira pergunta é: quanto custa? É uma pergunta legítima, mas incompleta. Duas apólices com valor parecido podem ter diferenças enormes na hora em que você precisa delas."},
        {tipo:"titulo2", texto:"1. A franquia não é um detalhe"},
        {tipo:"paragrafo", texto:"A franquia é o valor que você paga em caso de colisão parcial. Uma apólice mais barata frequentemente tem franquia mais alta — o que significa que o desconto de hoje vira despesa no dia do sinistro. Vale comparar o par preço e franquia, nunca só o preço."},
        {tipo:"titulo2", texto:"2. Cobertura de terceiros define o seu risco real"},
        {tipo:"paragrafo", texto:"Danos materiais e corporais a terceiros são a cobertura que protege seu patrimônio de uma ação judicial. Muita gente contrata o mínimo e descobre tarde que o limite não cobria o carro que atingiu."},
        {tipo:"titulo2", texto:"3. Assistência 24h e carro reserva mudam sua rotina"},
        {tipo:"paragrafo", texto:"Guincho com quilometragem curta ou carro reserva de sete dias parecem detalhes até você depender deles por duas semanas. Verifique os limites, não apenas se o item existe na apólice."},
        {tipo:"titulo2", texto:"4. Perfil e uso do veículo"},
        {tipo:"paragrafo", texto:"O cálculo considera CEP de pernoite, garagem, condutores e uso do carro. Informações imprecisas barateiam a cotação e podem gerar recusa de indenização depois. Melhor informar corretamente desde o início."},
        {tipo:"paragrafo", texto:"O papel da corretora é justamente colocar essas variáveis lado a lado. Você decide com informação — e não pelo primeiro número que apareceu."}
      ]},
    {id:"post2", categoria:"Consórcio", titulo:"Consórcio ou financiamento? A conta que quase ninguém faz",
      resumo:"Não existe resposta única. Existe a resposta certa para o seu prazo, sua pressa e seu bolso.",
      capa: fotoPost("consorcio"), status:"publicado", autorId:null, criadoEm:"2026-08-04T09:00:00.000Z", publicadoEm:"2026-08-04T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"A comparação entre consórcio e financiamento costuma ser feita de forma rasa: um tem juros, o outro não. Verdade, mas insuficiente para decidir."},
        {tipo:"titulo2", texto:"O que você está comprando em cada um"},
        {tipo:"paragrafo", texto:"No financiamento, você compra tempo: leva o bem hoje e paga juros por isso. No consórcio, você compra poder de compra futuro: forma uma poupança coletiva, paga taxa de administração no lugar de juros e recebe a carta de crédito na contemplação — por sorteio ou por lance."},
        {tipo:"titulo2", texto:"O custo total costuma surpreender"},
        {tipo:"paragrafo", texto:"Em prazos longos, o custo efetivo de um financiamento imobiliário pode ultrapassar de forma significativa o valor do imóvel. No consórcio, o custo se concentra na taxa de administração e no fundo de reserva, diluídos ao longo do plano."},
        {tipo:"titulo2", texto:"Quando o consórcio faz mais sentido"},
        {tipo:"lista", itens:["Você tem um objetivo em 2, 3 ou 5 anos e consegue planejar.","Quer disciplina de poupança com destino definido.","Pretende usar o crédito como pagamento à vista e negociar desconto.","Tem recurso para lance — inclusive FGTS, no caso de imóvel."]},
        {tipo:"titulo2", texto:"Quando o financiamento faz mais sentido"},
        {tipo:"paragrafo", texto:"Se você precisa do bem agora — mudança de cidade, nascimento de um filho, fim de contrato de aluguel — pagar juros pode ser o preço justo pela imediatez."},
        {tipo:"paragrafo", texto:"A pergunta correta não é qual é melhor, e sim: qual é o seu prazo? A partir dessa resposta, a conta se resolve sozinha."}
      ]},
    {id:"post3", categoria:"Imóveis", titulo:"Comprar na planta em Campinas: o que verificar antes de assinar",
      resumo:"Registro de incorporação, memorial descritivo e prazo de tolerância — o que realmente protege quem compra na planta.",
      capa: fotoPost("planta"), status:"publicado", autorId:null, criadoEm:"2026-08-20T09:00:00.000Z", publicadoEm:"2026-08-20T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"Comprar na planta pode significar preço melhor e prazo de pagamento mais longo, mas exige atenção a detalhes que não aparecem no material de venda."},
        {tipo:"titulo2", texto:"Registro de incorporação"},
        {tipo:"paragrafo", texto:"Verifique se a incorporação está registrada no cartório de imóveis. Sem esse registro, a incorporadora não pode nem comercializar as unidades legalmente."},
        {tipo:"titulo2", texto:"Memorial descritivo"},
        {tipo:"paragrafo", texto:"É o documento que detalha acabamentos, materiais e especificações técnicas prometidas. Guarde-o: é sua referência para conferir a entrega."},
        {tipo:"titulo2", texto:"Prazo de tolerância"},
        {tipo:"paragrafo", texto:"A lei permite um atraso de até 180 dias sem multa para a incorporadora, contado a partir da data prevista de entrega. Depois disso, cabe indenização."},
        {tipo:"paragrafo", texto:"Uma corretora que representa o comprador, não a incorporadora, ajuda a ler esse contrato com outros olhos antes da assinatura."}
      ]},
    {id:"post4", categoria:"Seguros", titulo:"Seguro residencial custa menos do que você imagina",
      resumo:"O produto mais subestimado do mercado brasileiro — e o mais barato por real protegido.",
      capa: fotoPost("residencial"), status:"publicado", autorId:null, criadoEm:"2026-07-27T09:00:00.000Z", publicadoEm:"2026-07-27T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"Existe um descompasso curioso no Brasil: seguramos o carro com naturalidade e deixamos a casa, que costuma valer muito mais, sem qualquer proteção."},
        {tipo:"titulo2", texto:"O que a apólice cobre de fato"},
        {tipo:"paragrafo", texto:"Incêndio, queda de raio e explosão são a base obrigatória. A partir daí, você monta: roubo e furto qualificado, danos elétricos — que resolvem geladeira, TV e ar-condicionado queimados por oscilação —, vendaval, impacto de veículos e responsabilidade civil familiar."},
        {tipo:"titulo2", texto:"A assistência que se usa o ano inteiro"},
        {tipo:"paragrafo", texto:"Chaveiro, encanador, eletricista, conserto de eletrodomésticos e até desentupimento entram no pacote. Muita gente paga o seguro do ano em uma única visita emergencial de chaveiro em um domingo."},
        {tipo:"titulo2", texto:"Imóvel alugado também precisa"},
        {tipo:"paragrafo", texto:"Contratos de locação costumam exigir apólice de incêndio. Mas o inquilino pode — e deve — proteger também o conteúdo: móveis, eletrônicos e bens pessoais não estão cobertos pela apólice do proprietário."},
        {tipo:"paragrafo", texto:"Comparado ao valor do que protege, é provavelmente o seguro com melhor relação custo-benefício do mercado brasileiro."}
      ]},
    {id:"post5", categoria:"Planejamento", titulo:"Lance no consórcio: as estratégias que realmente antecipam a contemplação",
      resumo:"Livre, fixo, embutido e com FGTS. Entenda cada modalidade antes de dar o seu.",
      capa: fotoPost("lance"), status:"publicado", autorId:null, criadoEm:"2026-07-18T09:00:00.000Z", publicadoEm:"2026-07-18T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"Contemplação por sorteio é sorte. Lance é estratégia. E, na maioria dos grupos, é o lance que define quem antecipa o crédito."},
        {tipo:"titulo2", texto:"Lance livre"},
        {tipo:"paragrafo", texto:"Você oferece o percentual que quiser do valor da carta. Vence quem ofertar mais naquela assembleia. Exige acompanhar o histórico do grupo para calibrar a oferta."},
        {tipo:"titulo2", texto:"Lance fixo"},
        {tipo:"paragrafo", texto:"A administradora define um percentual único. Se mais de um consorciado ofertar, decide-se por sorteio entre eles. É mais previsível e costuma ser bom para quem tem exatamente aquele valor disponível."},
        {tipo:"titulo2", texto:"Lance embutido"},
        {tipo:"paragrafo", texto:"Parte do próprio crédito é usada como lance. Você não desembolsa dinheiro novo, mas recebe uma carta menor. Útil para quem tem pressa e flexibilidade no valor do bem."},
        {tipo:"titulo2", texto:"FGTS no consórcio de imóvel"},
        {tipo:"paragrafo", texto:"O saldo do FGTS pode compor lance, complementar a carta ou amortizar parcelas, dentro das regras aplicáveis. É o recurso mais subutilizado por quem está em consórcio imobiliário."},
        {tipo:"paragrafo", texto:"Antes de ofertar, peça à sua corretora o histórico de contemplações do grupo. Ofertar acima do necessário é dinheiro deixado na mesa."}
      ]},
    {id:"post6", categoria:"Planejamento", titulo:"Checklist: o que revisar no seu seguro antes de renovar",
      resumo:"Renovação automática é conforto — e também a forma mais comum de pagar caro por cobertura errada.",
      capa: fotoPost("checklist"), status:"publicado", autorId:null, criadoEm:"2026-06-30T09:00:00.000Z", publicadoEm:"2026-06-30T09:00:00.000Z",
      blocos:[
        {tipo:"paragrafo", texto:"A renovação costuma chegar quando você está ocupado. Aceitar automaticamente é fácil, mas raramente é a melhor decisão financeira do ano."},
        {tipo:"titulo2", texto:"1. Mudou alguma coisa na sua vida?"},
        {tipo:"paragrafo", texto:"Casamento, filho, mudança de endereço, novo condutor no carro, home office, reforma. Cada um desses eventos altera o risco — e, portanto, o preço e a cobertura ideal."},
        {tipo:"titulo2", texto:"2. O valor segurado ainda corresponde à realidade?"},
        {tipo:"paragrafo", texto:"Imóveis e bens se valorizam; veículos desvalorizam. Segurar acima do valor de mercado é pagar a mais; abaixo, é receber menos do que precisa."},
        {tipo:"titulo2", texto:"3. Você usou a apólice?"},
        {tipo:"paragrafo", texto:"Histórico limpo é argumento de negociação. Vale pedir revisão de bônus e recotação no mercado antes de aceitar o reajuste proposto."},
        {tipo:"titulo2", texto:"4. As assistências fazem sentido?"},
        {tipo:"paragrafo", texto:"Serviços que você nunca usou podem sair; os que faltaram no ano devem entrar. É o ajuste mais barato de fazer e o mais esquecido."},
        {tipo:"paragrafo", texto:"Uma revisão de quinze minutos com seu corretor, trinta dias antes do vencimento, costuma valer mais do que qualquer cupom de desconto."}
      ]}
  ];

  // -------------------- PERSISTÊNCIA --------------------
  function load(){
    try{
      const raw = global.localStorage.getItem(KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){ /* localStorage indisponível (modo privado etc.) */ }
    return null;
  }
  function save(state){
    try{ global.localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
  }
  let STATE = load();
  if(!STATE){ STATE = seedState(); save(STATE); }
  // migração leve: quem já tinha um estado salvo (v2) antes da linha de Imóveis
  // existir ganha o catálogo de exemplo na primeira carga, sem perder leads/equipe/modelos reais.
  if(!Array.isArray(STATE.imoveis)){ STATE.imoveis = IMOVEIS_SEED.map(i=>Object.assign({},i)); save(STATE); }
  // migração leve: contas a pagar/receber é uma seção nova — começa vazia de
  // propósito (é dado financeiro real, nunca fictício), só garante o array.
  if(!Array.isArray(STATE.contasFinanceiras)){ STATE.contasFinanceiras = []; save(STATE); }
  // migração leve: mural de avisos é uma seção nova — começa vazia.
  if(!Array.isArray(STATE.avisos)){ STATE.avisos = []; save(STATE); }
  // migração leve: blog é uma seção nova — ganha os artigos de exemplo
  // (mesmo raciocínio do catálogo de imóveis: é conteúdo/produto, não contato).
  if(!Array.isArray(STATE.posts)){ STATE.posts = POSTS_SEED.map(p=>Object.assign({}, p, {blocos: p.blocos.map(b=>Object.assign({}, b))})); save(STATE); }
  // migração leve: compromissos do calendário são uma seção nova — começa vazia.
  if(!Array.isArray(STATE.compromissos)){ STATE.compromissos = []; save(STATE); }
  // migração leve: checklist de permissões é novo — quem já existia ganha a
  // lista vazia (Administrador não depende dela; os demais nada muda até
  // alguém marcar algo no editor de Equipe).
  if(STATE.equipe.some(u=>!Array.isArray(u.permissoes))){
    STATE.equipe.forEach(u=>{ if(!Array.isArray(u.permissoes)) u.permissoes = []; });
    save(STATE);
  }

  function uid(prefix){ return (prefix||"id")+"_"+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4); }
  function nowISO(){ return new Date().toISOString(); }
  function daysAgoISO(n, hour){
    const d = new Date();
    d.setDate(d.getDate()-n);
    if(hour!=null) d.setHours(hour, Math.floor(Math.random()*59), 0, 0);
    return d.toISOString();
  }

  // -------------------- SEED (estado inicial — sem contatos fictícios) --------------------
  // Nenhum lead, campanha ou atividade de demonstração: a base começa vazia
  // de verdade. Só a equipe (login) e alguns MODELOS de mensagem de exemplo
  // continuam aqui, como ponto de partida para o configurador — modelo de
  // mensagem não é dado de cliente, então não é "contato falso".
  function seedState(){
    const templates = [
      {id:uid("tpl"), canal:"email", categoria:"seguro", nome:"Boas-vindas — cotação recebida",
        assunto:"Recebemos sua solicitação, {{primeiro_nome}}!",
        preheader:"Já estamos comparando as melhores opções do mercado para você.",
        blocks:[
          {tipo:"titulo", texto:"Recebemos sua solicitação, {{primeiro_nome}}!"},
          {tipo:"texto", texto:"Já estamos comparando as melhores opções de {{produto}} do mercado para você.\n\nEm breve, {{consultor}} entra em contato pelo WhatsApp {{telefone_solua}} com o comparativo pronto."},
          {tipo:"botao", texto:"Falar agora no WhatsApp", url:"https://wa.me/{{telefone_solua_link}}"},
          {tipo:"divisor"},
          {tipo:"texto", texto:"Até já,\nEquipe {{nome_empresa}}"}
        ],
        corpo:"Recebemos sua solicitação, {{primeiro_nome}}!\n\nJá estamos comparando as melhores opções de {{produto}} do mercado para você.\n\nEm breve, {{consultor}} entra em contato pelo WhatsApp {{telefone_solua}} com o comparativo pronto.\n\nAté já,\nEquipe {{nome_empresa}}"},
      {id:uid("tpl"), canal:"email", categoria:"consorcio", nome:"Simulação de consórcio enviada",
        assunto:"Sua simulação de consórcio de {{tipo}} está pronta",
        preheader:"Parcelas que cabem no seu planejamento, sem juros.",
        blocks:[
          {tipo:"titulo", texto:"Sua simulação está pronta, {{primeiro_nome}}"},
          {tipo:"texto", texto:"Preparamos sua simulação de consórcio de {{tipo}} com parcelas que cabem no seu planejamento, sem juros."},
          {tipo:"botao", texto:"Ver simulação no WhatsApp", url:"https://wa.me/{{telefone_solua_link}}"},
          {tipo:"texto", texto:"Abraço,\n{{consultor}} — {{nome_empresa}}"}
        ],
        corpo:"Sua simulação está pronta, {{primeiro_nome}}\n\nPreparamos sua simulação de consórcio de {{tipo}} com parcelas que cabem no seu planejamento, sem juros.\n\nAbraço,\n{{consultor}} — {{nome_empresa}}"},
      {id:uid("tpl"), canal:"email", categoria:"imovel", nome:"Boas-vindas — interesse em imóvel",
        assunto:"Recebemos seu interesse, {{primeiro_nome}}!",
        preheader:"Vamos agendar uma visita ou tirar suas dúvidas sobre o imóvel.",
        blocks:[
          {tipo:"titulo", texto:"Recebemos seu interesse, {{primeiro_nome}}!"},
          {tipo:"texto", texto:"Obrigado pelo contato sobre o imóvel. Em breve {{consultor}} fala com você pelo WhatsApp {{telefone_solua}} para agendar uma visita ou tirar dúvidas."},
          {tipo:"botao", texto:"Falar agora no WhatsApp", url:"https://wa.me/{{telefone_solua_link}}"},
          {tipo:"divisor"},
          {tipo:"texto", texto:"Até já,\nEquipe {{nome_empresa}}"}
        ],
        corpo:"Recebemos seu interesse, {{primeiro_nome}}!\n\nEm breve {{consultor}} fala com você pelo WhatsApp {{telefone_solua}} para agendar uma visita ou tirar dúvidas.\n\nAté já,\nEquipe {{nome_empresa}}"},
      {id:uid("tpl"), canal:"whatsapp", categoria:"imovel", nome:"Primeiro contato — imóvel",
        headerType:"nenhum", corpo:"Olá {{primeiro_nome}}! Aqui é {{consultor}}, da {{nome_empresa}} 👋 Recebi seu interesse em um dos nossos imóveis ({{tipo}}). Posso te ajudar a agendar uma visita ou tirar alguma dúvida agora mesmo?",
        rodape:"Resposta em até 1 dia útil", botoes:[{tipo:"resposta_rapida", texto:"Quero agendar"}]},
      {id:uid("tpl"), canal:"whatsapp", categoria:"seguro", nome:"Primeiro contato — seguro",
        headerType:"nenhum", corpo:"Olá {{primeiro_nome}}! Aqui é {{consultor}}, da {{nome_empresa}} 👋 Recebi seu pedido de cotação de {{produto}} ({{tipo}}). Posso te chamar por aqui mesmo para fechar alguns detalhes e já te enviar o comparativo?",
        rodape:"Resposta em até 1 dia útil", botoes:[{tipo:"resposta_rapida", texto:"Pode continuar"}]},
      {id:uid("tpl"), canal:"whatsapp", categoria:"consorcio", nome:"Primeiro contato — consórcio",
        headerType:"nenhum", corpo:"Oi {{primeiro_nome}}, tudo bem? Aqui é {{consultor}} da {{nome_empresa}}. Vi seu interesse em consórcio de {{tipo}} 🙂 Consigo te mandar agora uma simulação com valor de carta e parcela. Prefere que eu já mande por aqui?",
        rodape:"Resposta em até 1 dia útil", botoes:[{tipo:"resposta_rapida", texto:"Pode mandar"}]}
    ];

    return { leads:[], templates, campaigns:[], equipe: EQUIPE_SEED, imoveis: IMOVEIS_SEED.map(i=>Object.assign({},i)),
      posts: POSTS_SEED.map(p=>Object.assign({}, p, {blocos: p.blocos.map(b=>Object.assign({}, b))})),
      contasFinanceiras:[], avisos:[], compromissos:[], activity:[], session:null };
  }

  function labelEstagio(produto, estagioId){
    const p = PIPELINES[produto]||[];
    const e = p.find(x=>x.id===estagioId);
    return e ? e.label : estagioId;
  }

  function logActivity(tipo, descricao, extra){
    STATE.activity.unshift(Object.assign({id:uid("act"), data:nowISO(), tipo, descricao}, extra||{}));
    STATE.activity = STATE.activity.slice(0,300);
  }

  // -------------------- LEADS --------------------
  function getLeads(){ return STATE.leads.slice(); }
  function getLead(id){ return STATE.leads.find(l=>l.id===id) || null; }
  function getLeadsByProduto(produto){ return STATE.leads.filter(l=>l.produto===produto); }

  function addLead(data){
    const lead = Object.assign({
      id: uid("lead"),
      nome:"", email:"", telefone:"", cidade:"",
      produto:"seguro", tipo:"", estagio:"novo",
      origem:"Site", consultorId:null, valor:0, tags:[], proximoContato:null,
      criadoEm: nowISO(), atualizadoEm: nowISO(), notas:[]
    }, data);
    // atribuição automática simples por produto (round-robin entre consultores ativos do produto)
    if(!lead.consultorId){
      const disponiveis = STATE.equipe.filter(u=>u.ativo && (u.produto===lead.produto || u.produto==="ambos") && u.papel!=="Administrador");
      if(disponiveis.length) lead.consultorId = disponiveis[STATE.leads.length % disponiveis.length].id;
    }
    STATE.leads.unshift(lead);
    logActivity("lead_criado", `Novo lead de ${lead.produto==="seguro"?"seguro":"consórcio"}: ${lead.nome}`, {leadId:lead.id});
    save(STATE);
    dispararAutomacaoBoasVindas(lead);
    return lead;
  }

  // Notifica o Worker (API real, D1) que um lead chegou, pra ele decidir — com
  // base nas automações ligadas em Personalização — se dispara e-mail (Resend)
  // e/ou WhatsApp (Cloud API) de boas-vindas de verdade. Nunca trava a criação
  // do lead: roda em segundo plano e só registra o resultado quando volta.
  function dispararAutomacaoBoasVindas(lead){
    if(typeof fetch !== "function") return;
    fetch("/api/lead-notify", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ nome: lead.nome, email: lead.email, telefone: lead.telefone, produto: lead.produto, tipo: lead.tipo })
    }).then(r => r.ok ? r.json() : null).then(data => {
      if(!data || !data.resultados) return;
      const { email, whatsapp } = data.resultados;
      const partes = [];
      if(email === "enviado") partes.push("e-mail de boas-vindas enviado");
      if(whatsapp === "enviado") partes.push("WhatsApp de boas-vindas enviado");
      if(partes.length){
        logActivity("automacao", `Automação para ${lead.nome}: ${partes.join(" e ")}.`, {leadId:lead.id});
        save(STATE);
      }
      // "pulado"/"desativado"/"falhou" não vira ruído no feed do dashboard —
      // fica só no log da API (GET /api/dispatch-log), consultado em Disparos.
    }).catch(()=>{ /* API ainda não publicada — captura silenciosa, não é um erro do lead */ });
  }

  function updateLead(id, patch){
    const lead = getLead(id); if(!lead) return null;
    const estagioAntes = lead.estagio;
    Object.assign(lead, patch, {atualizadoEm: nowISO()});
    if(patch.estagio && patch.estagio!==estagioAntes){
      logActivity("estagio_alterado", `${lead.nome} avançou para "${labelEstagio(lead.produto, lead.estagio)}"`, {leadId:lead.id});
    }
    save(STATE);
    return lead;
  }

  function deleteLead(id){
    STATE.leads = STATE.leads.filter(l=>l.id!==id);
    save(STATE);
  }

  function addNota(leadId, texto, autor){
    const lead = getLead(leadId); if(!lead) return null;
    const nota = {id:uid("nota"), data:nowISO(), autor: autor||"Você", texto};
    lead.notas.unshift(nota);
    lead.atualizadoEm = nowISO();
    logActivity("nota", `Nota adicionada em ${lead.nome}: “${texto.slice(0,60)}${texto.length>60?"…":""}”`, {leadId});
    save(STATE);
    return nota;
  }

  // -------------------- EQUIPE --------------------
  // Nível de acesso: um checklist de telas administrativas (não Administrador
  // "livre" nem "sem nada") — cada chave aqui é a mesma usada em NAV_ADMIN
  // (crm-ui.js), pra filtrar o menu lateral e travar a página certa.
  const PERMISSOES_DISPONIVEIS = [
    {key:"admin-disparos", label:"Disparos"},
    {key:"admin-modelos", label:"Modelos"},
    {key:"admin-equipe", label:"Equipe"},
    {key:"admin-design", label:"Design"},
    {key:"admin-blog", label:"Blog"},
    {key:"admin-documentos", label:"Documentos"},
    {key:"admin-financeiro", label:"Financeiro"},
    {key:"admin-personalizacao", label:"Personalização"}
  ];
  // Administrador sempre tem tudo (nunca fica de fora por checklist —
  // evita alguém travar o próprio acesso por engano); os demais papéis
  // seguem exatamente o que foi marcado em usuario.permissoes.
  function temPermissao(usuario, chave){
    if(!usuario) return false;
    if(usuario.papel === "Administrador") return true;
    return (usuario.permissoes||[]).includes(chave);
  }
  function getEquipe(){ return STATE.equipe.slice(); }
  function getUsuario(id){ return STATE.equipe.find(u=>u.id===id) || null; }
  function addUsuario(data){
    const u = Object.assign({id:uid("u"), nome:"", email:"", papel:"Consultor", produto:"seguro", ativo:true, avatarBg:"#004BA5", permissoes:[]}, data);
    STATE.equipe.push(u); save(STATE); return u;
  }
  function updateUsuario(id, patch){
    const u = getUsuario(id); if(!u) return null;
    Object.assign(u, patch); save(STATE); return u;
  }
  function deleteUsuario(id){
    STATE.equipe = STATE.equipe.filter(u=>u.id!==id); save(STATE);
  }

  // -------------------- CATÁLOGO DE IMÓVEIS (produto, não contato) --------------------
  function getImoveis(){ return STATE.imoveis.slice(); }
  function getImovel(id){ return STATE.imoveis.find(i=>i.id===id) || null; }
  function addImovel(data){
    const i = Object.assign({id:uid("imv"), titulo:"", finalidade:"venda", tipo:"Apartamento",
      bairro:"", cidade:"Campinas", valor:0, quartos:0, suites:0, vagas:0, areaM2:0,
      status:"pronto", destaque:false, descricao:"", fotos:[]}, data);
    STATE.imoveis.unshift(i); save(STATE); return i;
  }
  function updateImovel(id, patch){
    const i = getImovel(id); if(!i) return null;
    Object.assign(i, patch); save(STATE); return i;
  }
  function deleteImovel(id){
    STATE.imoveis = STATE.imoveis.filter(i=>i.id!==id); save(STATE);
  }
  // filtros do catálogo público: tipo, finalidade, faixa de preço, quartos mínimos, status
  function filterImoveis(f){
    f = f || {};
    return STATE.imoveis.filter(i=>{
      if(f.finalidade && f.finalidade!=="todos" && i.finalidade!==f.finalidade) return false;
      if(f.tipo && f.tipo!=="Todos" && i.tipo!==f.tipo) return false;
      if(f.status && f.status!=="todos" && i.status!==f.status) return false;
      if(f.quartos && i.quartos < Number(f.quartos)) return false;
      if(f.precoMin!=null && i.valor < Number(f.precoMin)) return false;
      if(f.precoMax!=null && i.valor > Number(f.precoMax)) return false;
      return true;
    });
  }

  // -------------------- CONTAS A PAGAR E A RECEBER --------------------
  // Lançamentos manuais (entrada/saída), com vencimento, categoria e um anexo
  // opcional (comprovante/boleto) guardado como o mesmo tipo de link/base64 já
  // usado em outras telas. Não existe extração automática de valor a partir do
  // arquivo anexado — isso exigiria um serviço real de OCR/IA de documentos,
  // que este projeto não tem hoje (ver comentário na tela de Financeiro).
  function getContas(){ return STATE.contasFinanceiras.slice(); }
  function getConta(id){ return STATE.contasFinanceiras.find(c=>c.id===id) || null; }
  function addConta(data){
    const c = Object.assign({
      id: uid("cta"), tipo:"saida", descricao:"", valor:0, categoria:"Outros",
      vencimento:"", status:"pendente", anexoUrl:null, anexoNome:null, criadoEm: nowISO()
    }, data);
    STATE.contasFinanceiras.unshift(c);
    save(STATE);
    return c;
  }
  function updateConta(id, patch){
    const c = getConta(id); if(!c) return null;
    Object.assign(c, patch); save(STATE); return c;
  }
  function deleteConta(id){
    STATE.contasFinanceiras = STATE.contasFinanceiras.filter(c=>c.id!==id); save(STATE);
  }

  // -------------------- MURAL DE AVISOS --------------------
  // Quadro compartilhado, visível pra toda a equipe — qualquer pessoa
  // logada pode postar um aviso ou anotação; fixado sobe pro topo.
  function getAvisos(){
    return STATE.avisos.slice().sort((a,b)=>{
      if(!!b.fixado !== !!a.fixado) return (b.fixado?1:0)-(a.fixado?1:0);
      return new Date(b.criadoEm) - new Date(a.criadoEm);
    });
  }
  function addAviso(data){
    const a = Object.assign({id:uid("aviso"), autorId:null, texto:"", fixado:false, criadoEm:nowISO()}, data);
    STATE.avisos.unshift(a); save(STATE); return a;
  }
  function updateAviso(id, patch){
    const a = STATE.avisos.find(x=>x.id===id); if(!a) return null;
    Object.assign(a, patch); save(STATE); return a;
  }
  function deleteAviso(id){
    STATE.avisos = STATE.avisos.filter(a=>a.id!==id); save(STATE);
  }

  // -------------------- BLOG (CRUD + blocos do corpo) --------------------
  const CATEGORIAS_POST_PADRAO = ["Seguros","Consórcio","Imóveis","Planejamento"];
  // mesma paleta categórica já validada (dashboard/financeiro): reaproveita
  // as cores em vez de inventar uma nova — uma categoria digitada na hora
  // (fora das 4 padrão) cai numa dessas 4 por hash, nunca sem cor nenhuma.
  const CATEGORIA_COR_MAP = {"Seguros":"azul", "Consórcio":"dourado", "Imóveis":"roxo", "Planejamento":"verde"};
  const CORES_POST_CICLO = ["azul","dourado","roxo","verde"];
  function corPost(categoria){
    if(CATEGORIA_COR_MAP[categoria]) return CATEGORIA_COR_MAP[categoria];
    let h = 0;
    const s = String(categoria||"");
    for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) % CORES_POST_CICLO.length;
    return CORES_POST_CICLO[Math.abs(h)];
  }
  function getCategoriasPost(){
    const doEstado = STATE.posts.map(p=>p.categoria).filter(Boolean);
    return [...new Set([...CATEGORIAS_POST_PADRAO, ...doEstado])];
  }

  const POST_BLOCO_LABELS = {titulo2:"Subtítulo", paragrafo:"Parágrafo", lista:"Lista", imagem:"Imagem"};
  function novoBlocoPost(tipo){
    switch(tipo){
      case "titulo2": return {tipo:"titulo2", texto:"Subtítulo"};
      case "lista": return {tipo:"lista", itens:["Item 1","Item 2"]};
      case "imagem": return {tipo:"imagem", url:"", alt:""};
      default: return {tipo:"paragrafo", texto:"Escreva aqui…"};
    }
  }
  // HTML de verdade a partir dos blocos — sempre escapado, porque um artigo
  // pode ser escrito por qualquer pessoa da equipe (não é código confiável).
  function renderPostCorpo(blocos){
    return (blocos||[]).map(b=>{
      switch(b.tipo){
        case "titulo2":
          return b.texto ? `<h2>${escapeHtml(b.texto)}</h2>` : "";
        case "lista":
          return (b.itens||[]).filter(Boolean).length ? `<ul>${b.itens.filter(Boolean).map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
        case "imagem":
          return b.url ? `<img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.alt||"")}" style="width:100%;border-radius:16px;margin:8px 0 22px;display:block">` : "";
        default:
          return b.texto ? `<p>${escapeHtml(b.texto)}</p>` : "";
      }
    }).join("");
  }
  function postBlocosParaTexto(blocos){
    return (blocos||[]).map(b=> b.tipo==="lista" ? (b.itens||[]).join(" ") : (b.texto||"")).filter(Boolean).join(" ");
  }
  // tempo de leitura calculado de verdade a partir do texto (≈200 palavras/min)
  // em vez de um campo manual que ninguém lembra de atualizar
  function tempoLeituraMin(blocos){
    const palavras = postBlocosParaTexto(blocos).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(palavras/200));
  }

  function getPosts(){ return STATE.posts.slice().sort((a,b)=> new Date(b.criadoEm)-new Date(a.criadoEm)); }
  function getPostsPublicados(){
    return STATE.posts.filter(p=>p.status==="publicado")
      .sort((a,b)=> new Date(b.publicadoEm||b.criadoEm) - new Date(a.publicadoEm||a.criadoEm));
  }
  function getPost(id){ return STATE.posts.find(p=>p.id===id) || null; }
  function addPost(data){
    const p = Object.assign({
      id: uid("post"), categoria:"Planejamento", titulo:"", resumo:"", capa:null,
      blocos:[novoBlocoPost("paragrafo")], status:"rascunho", autorId:null,
      criadoEm: nowISO(), publicadoEm: null
    }, data);
    if(p.status==="publicado" && !p.publicadoEm) p.publicadoEm = nowISO();
    STATE.posts.unshift(p);
    save(STATE);
    return p;
  }
  function updatePost(id, patch){
    const p = getPost(id); if(!p) return null;
    const eraPublicado = p.status==="publicado";
    Object.assign(p, patch);
    if(p.status==="publicado" && !eraPublicado && !p.publicadoEm) p.publicadoEm = nowISO();
    save(STATE);
    return p;
  }
  function deletePost(id){
    STATE.posts = STATE.posts.filter(p=>p.id!==id); save(STATE);
  }

  // -------------------- COMPROMISSOS (calendário) --------------------
  // Compromissos avulsos (reunião, ligação, lembrete) — diferente do
  // "próximo contato" de um lead, que já entra sozinho no calendário.
  function getCompromissos(){ return STATE.compromissos.slice(); }
  function getCompromisso(id){ return STATE.compromissos.find(c=>c.id===id) || null; }
  function addCompromisso(data){
    const c = Object.assign({id:uid("cpm"), titulo:"", data:"", hora:"", nota:"", autorId:null, criadoEm:nowISO()}, data);
    STATE.compromissos.unshift(c);
    save(STATE);
    return c;
  }
  function updateCompromisso(id, patch){
    const c = getCompromisso(id); if(!c) return null;
    Object.assign(c, patch); save(STATE); return c;
  }
  function deleteCompromisso(id){
    STATE.compromissos = STATE.compromissos.filter(c=>c.id!==id); save(STATE);
  }

  // -------------------- TEMPLATES --------------------
  function getTemplates(canal){
    return canal ? STATE.templates.filter(t=>t.canal===canal) : STATE.templates.slice();
  }
  function getTemplate(id){ return STATE.templates.find(t=>t.id===id) || null; }
  function addTemplate(data){
    const t = Object.assign({id:uid("tpl"), canal:"email", categoria:"geral", nome:"", assunto:"", corpo:""}, data);
    STATE.templates.unshift(t); save(STATE); return t;
  }
  function updateTemplate(id, patch){
    const t = getTemplate(id); if(!t) return null;
    Object.assign(t, patch); save(STATE); return t;
  }
  function deleteTemplate(id){
    STATE.templates = STATE.templates.filter(t=>t.id!==id); save(STATE);
  }

  // -------------------- SEGMENTAÇÃO / AUDIÊNCIA --------------------
  const SEGMENTOS = [
    {id:"todos",       label:"Todos os leads e clientes"},
    {id:"seguro",      label:"Interessados em seguro"},
    {id:"consorcio",   label:"Interessados em consórcio"},
    {id:"imovel",      label:"Interessados em imóvel"},
    {id:"clientes",    label:"Clientes (apólice / contemplados / negócio fechado)"},
    {id:"sem_contato_7d", label:"Sem interação há 7+ dias"},
    {id:"prioridade",  label:"Marcados como prioridade"}
  ];
  function getAudience(segmentoId){
    const all = STATE.leads;
    switch(segmentoId){
      case "seguro": return all.filter(l=>l.produto==="seguro");
      case "consorcio": return all.filter(l=>l.produto==="consorcio");
      case "imovel": return all.filter(l=>l.produto==="imovel");
      case "clientes": return all.filter(l=>ESTAGIOS_GANHOS.has(l.estagio));
      case "sem_contato_7d": {
        const limite = Date.now()-7*24*60*60*1000;
        return all.filter(l=> new Date(l.atualizadoEm).getTime() < limite && l.estagio!=="perdido");
      }
      case "prioridade": return all.filter(l=> (l.tags||[]).includes("prioridade"));
      default: return all.slice();
    }
  }

  // -------------------- CAMPANHAS (disparos) --------------------
  function getCampaigns(){ return STATE.campaigns.slice().sort((a,b)=> new Date(b.criadoEm)-new Date(a.criadoEm)); }
  function getCampaign(id){ return STATE.campaigns.find(c=>c.id===id) || null; }

  function addCampaign(data){
    // guarda uma cópia do modelo no momento da criação: se o modelo for editado
    // ou excluído depois, o histórico desta campanha continua íntegro.
    const tplOriginal = data.templateId ? getTemplate(data.templateId) : null;
    const c = Object.assign({
      id: uid("camp"), canal:"email", nome:"", segmento:"todos", templateId:null,
      status:"rascunho", criadoEm: nowISO(), agendadoPara:null, enviadoEm:null,
      // guarda tudo que o preview/renderização rica precisa (blocos de e-mail
      // ou estrutura de WhatsApp) — não só nome/assunto/corpo — pra excluir ou
      // editar o modelo depois não quebrar o histórico desta campanha.
      templateSnapshot: tplOriginal ? JSON.parse(JSON.stringify(tplOriginal)) : null,
      metrics:{enviados:0, entregues:0, abertos:0, cliques:0, respostas:0}
    }, data);
    STATE.campaigns.unshift(c); save(STATE); return c;
  }
  function updateCampaign(id, patch){
    const c = getCampaign(id); if(!c) return null;
    Object.assign(c, patch); save(STATE); return c;
  }
  function deleteCampaign(id){
    STATE.campaigns = STATE.campaigns.filter(c=>c.id!==id); save(STATE);
  }

  // Simula o disparo: calcula público, gera métricas plausíveis e registra no histórico.
  function sendCampaignNow(id){
    const c = getCampaign(id); if(!c) return null;
    const publico = getAudience(c.segmento);
    const taxaEntrega = c.canal==="whatsapp" ? 0.97 : 0.93;
    const taxaAbertura = c.canal==="whatsapp" ? 0.86 : (0.42+Math.random()*0.2);
    const taxaClique = c.canal==="whatsapp" ? 0 : (0.12+Math.random()*0.12);
    const taxaResposta = c.canal==="whatsapp" ? (0.18+Math.random()*0.14) : (0.03+Math.random()*0.05);
    const enviados = publico.length;
    const entregues = Math.round(enviados*taxaEntrega);
    const abertos = Math.round(entregues*taxaAbertura);
    const cliques = c.canal==="whatsapp" ? 0 : Math.round(abertos*taxaClique);
    const respostas = Math.round(entregues*taxaResposta);
    updateCampaign(id, {
      status:"enviado",
      enviadoEm: nowISO(),
      publicoAlvo: enviados,
      metrics: {enviados, entregues, abertos, cliques, respostas}
    });
    logActivity("campanha_enviada", `Campanha "${c.nome}" enviada para ${enviados} contato(s) (${c.canal==="email"?"e-mail":"WhatsApp"})`, {campanhaId:c.id});
    return getCampaign(id);
  }

  // -------------------- AUTENTICAÇÃO (demonstração) --------------------
  // Login simplificado no navegador: qualquer e-mail cadastrado na equipe entra
  // com a senha "solua2026" (ou qualquer senha, se DEMO_FREE=true). Sinalizado
  // claramente na tela de login. Para produção, substitua por autenticação real
  // (Supabase Auth, Firebase Auth, NextAuth, etc.).
  const DEMO_SENHA = "solua2026";
  function login(email, senha){
    const u = STATE.equipe.find(x=>x.email.toLowerCase()===String(email||"").toLowerCase().trim());
    if(!u) return {ok:false, erro:"E-mail não encontrado na equipe Solua."};
    if(!u.ativo) return {ok:false, erro:"Este usuário está inativo. Peça a um administrador para reativar seu acesso."};
    if(senha !== DEMO_SENHA) return {ok:false, erro:'Senha incorreta. (Ambiente de demonstração — senha: "'+DEMO_SENHA+'")'};
    STATE.session = {userId:u.id, entrouEm: nowISO()};
    logActivity("usuario_login", `${u.nome} entrou no CRM`, {usuarioId:u.id});
    save(STATE);
    return {ok:true, usuario:u};
  }
  function logout(){ STATE.session = null; save(STATE); }
  function currentUser(){
    if(!STATE.session) return null;
    const u = getUsuario(STATE.session.userId);
    // se o usuário foi desativado ou removido depois do login, a sessão cai na hora
    if(!u || !u.ativo){ STATE.session = null; save(STATE); return null; }
    return u;
  }
  function requireAuth(){
    if(!currentUser()){
      const dest = encodeURIComponent(global.location.pathname.replace(/^.*\/crm\//,""));
      global.location.href = rootCrm()+"login.html?next="+dest;
      return false;
    }
    return true;
  }
  function rootCrm(){
    // permite que as páginas dentro de /crm/admin/ resolvam o caminho relativo correto
    return global.location.pathname.includes("/crm/admin/") ? "../" : "./";
  }

  // -------------------- ESTATÍSTICAS --------------------
  const ESTAGIOS_GANHOS = new Set(["apolice","contemplado","fechado"]);
  function dashboardStats(){
    const leads = STATE.leads;
    const abertos = leads.filter(l=>l.estagio!=="perdido" && !ESTAGIOS_GANHOS.has(l.estagio));
    const ganhos = leads.filter(l=>ESTAGIOS_GANHOS.has(l.estagio));
    const perdidos = leads.filter(l=>l.estagio==="perdido");
    const seguro = leads.filter(l=>l.produto==="seguro");
    const consorcio = leads.filter(l=>l.produto==="consorcio");
    const imovel = leads.filter(l=>l.produto==="imovel");
    const novos7d = leads.filter(l=> (Date.now()-new Date(l.criadoEm).getTime()) < 7*24*3600*1000).length;
    const valorEmAberto = abertos.reduce((s,l)=>s+(Number(l.valor)||0),0);
    const taxaConversao = leads.length ? Math.round((ganhos.length/leads.length)*100) : 0;
    return { total:leads.length, abertos:abertos.length, ganhos:ganhos.length, perdidos:perdidos.length,
      seguro:seguro.length, consorcio:consorcio.length, imovel:imovel.length, novos7d, valorEmAberto, taxaConversao };
  }
  function getActivity(limit){ return STATE.activity.slice(0, limit||30); }

  // Agenda real (não decorativa): leads com uma data de "próximo contato"
  // marcada, ordenados por data — inclui os atrasados (data no passado, lead
  // ainda em aberto) primeiro, pra aparecerem em destaque no Dashboard.
  function getProximosContatos(limit){
    return STATE.leads
      .filter(l=> l.proximoContato && l.estagio!=="perdido" && !ESTAGIOS_GANHOS.has(l.estagio))
      .sort((a,b)=> new Date(a.proximoContato) - new Date(b.proximoContato))
      .slice(0, limit||8);
  }

  // -------------------- FORMATAÇÃO --------------------
  function formatBRL(v){
    return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
  }
  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
  }
  function formatDateTime(iso){
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})+" · "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  }
  function formatPhone(v){
    const n = String(v||"").replace(/\D/g,"");
    if(n.length<10) return v;
    return n.length>10 ? `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}` : `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6,10)}`;
  }
  function iniciais(nome){
    return String(nome||"").trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();
  }
  function timeAgo(iso){
    const diff = Date.now()-new Date(iso).getTime();
    const min = Math.floor(diff/60000);
    if(min<1) return "agora";
    if(min<60) return `há ${min} min`;
    const h = Math.floor(min/60);
    if(h<24) return `há ${h}h`;
    const d = Math.floor(h/24);
    if(d<30) return `há ${d}d`;
    return formatDate(iso);
  }
  function fillTemplate(str, vars){
    return String(str||"").replace(/\{\{\s*([\w]+)\s*\}\}/g, (m,k)=> (vars && vars[k]!=null) ? vars[k] : m);
  }
  // Escapa texto que veio de um formulário (nome, cidade, observações...) antes de
  // jogar em innerHTML — os leads podem ter sido cadastrados por qualquer visitante
  // do site público, então esse texto nunca é confiável.
  function escapeHtml(s){
    return String(s==null?"":s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }

  // -------------------- MODELOS RICOS (e-mail em blocos / WhatsApp estruturado) --------------------
  const BLOCO_LABELS = {imagem:"Imagem", titulo:"Título", texto:"Texto", botao:"Botão", divisor:"Divisor", espaco:"Espaço"};
  function novoBloco(tipo){
    switch(tipo){
      case "imagem": return {tipo:"imagem", url:"", alt:"", link:""};
      case "titulo": return {tipo:"titulo", texto:"Título"};
      case "botao": return {tipo:"botao", texto:"Saiba mais", url:""};
      case "divisor": return {tipo:"divisor"};
      case "espaco": return {tipo:"espaco", altura:20};
      default: return {tipo:"texto", texto:"Escreva aqui…"};
    }
  }
  // Texto plano derivado dos blocos — usado como fallback (busca, snapshot de
  // campanha antiga, clientes de e-mail que só leem texto).
  function blocksParaTexto(blocks){
    return (blocks||[]).map(b=>{
      if(b.tipo==="titulo" || b.tipo==="texto") return b.texto||"";
      if(b.tipo==="botao") return b.texto ? `${b.texto}${b.url?" → "+b.url:""}` : "";
      return "";
    }).filter(Boolean).join("\n\n");
  }
  // HTML de e-mail de verdade (estilo inline, compatível com a maioria dos
  // clientes) a partir dos blocos configurados no modelo.
  function renderEmailBlocks(blocks, vars, corPrimaria){
    const cor = corPrimaria || "#004BA5";
    const partes = (blocks||[]).map(b=>{
      switch(b.tipo){
        case "imagem": {
          if(!b.url) return "";
          const img = `<img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.alt||"")}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 20px">`;
          return b.link ? `<a href="${escapeHtml(fillTemplate(b.link,vars))}" style="text-decoration:none">${img}</a>` : img;
        }
        case "titulo":
          return `<h2 style="font-size:22px;line-height:1.3;color:#15181C;margin:0 0 14px;font-family:Helvetica,Arial,sans-serif">${escapeHtml(fillTemplate(b.texto,vars))}</h2>`;
        case "botao":
          return `<div style="text-align:center;margin:26px 0"><a href="${escapeHtml(fillTemplate(b.url||"#",vars))}" style="background:${cor};color:#fff;padding:13px 30px;border-radius:100px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;font-family:Helvetica,Arial,sans-serif">${escapeHtml(fillTemplate(b.texto,vars))}</a></div>`;
        case "divisor":
          return `<hr style="border:none;border-top:1px solid #e6e6e6;margin:22px 0">`;
        case "espaco":
          return `<div style="height:${Number(b.altura)||20}px;line-height:1px">&nbsp;</div>`;
        default: // "texto"
          return `<p style="font-size:15px;line-height:1.65;color:#3a3a3a;margin:0 0 18px;white-space:pre-wrap;font-family:Helvetica,Arial,sans-serif">${escapeHtml(fillTemplate(b.texto,vars))}</p>`;
      }
    });
    return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto">${partes.join("")}</div>`;
  }
  // "Bolha" de WhatsApp (cabeçalho + corpo + rodapé + botões) a partir da
  // estrutura do modelo — usada tanto na pré-visualização quanto, no futuro,
  // como referência pra cadastrar o template de verdade no WhatsApp Manager.
  function renderWhatsappBubble(t, vars){
    let header = "";
    if(t.headerType==="imagem" && t.headerImageUrl){
      header = `<img src="${escapeHtml(t.headerImageUrl)}" style="width:100%;border-radius:6px;display:block;margin-bottom:8px">`;
    } else if(t.headerType==="texto" && t.headerText){
      header = `<b style="display:block;margin-bottom:4px">${escapeHtml(fillTemplate(t.headerText,vars))}</b>`;
    }
    const corpo = escapeHtml(fillTemplate(t.corpo||"",vars)).replace(/\n/g,"<br>");
    const rodape = t.rodape ? `<div style="font-size:11px;color:#8a8f98;margin-top:6px">${escapeHtml(fillTemplate(t.rodape,vars))}</div>` : "";
    const botoes = (t.botoes||[]).filter(b=>b.texto).map(b=>
      `<div style="border-top:1px solid #e5ded3;margin-top:8px;padding-top:8px;text-align:center;color:#00a5f4;font-size:13px">${b.tipo==="resposta_rapida"?"↩ ":b.tipo==="telefone"?"📞 ":"🔗 "}${escapeHtml(b.texto)}</div>`
    ).join("");
    return `${header}${corpo}${rodape}${botoes}`;
  }

  // -------------------- RESET (útil em demonstrações) --------------------
  function resetDemoData(){
    STATE = seedState();
    save(STATE);
  }

  global.SoluaDB = {
    PIPELINES, TIPOS, ORIGENS, SEGMENTOS, ESTAGIOS_GANHOS,
    getLeads, getLead, getLeadsByProduto, addLead, updateLead, deleteLead, addNota,
    getEquipe, getUsuario, addUsuario, updateUsuario, deleteUsuario, PERMISSOES_DISPONIVEIS, temPermissao,
    getImoveis, getImovel, addImovel, updateImovel, deleteImovel, filterImoveis,
    getContas, getConta, addConta, updateConta, deleteConta,
    getAvisos, addAviso, updateAviso, deleteAviso,
    getCompromissos, getCompromisso, addCompromisso, updateCompromisso, deleteCompromisso,
    getPosts, getPostsPublicados, getPost, addPost, updatePost, deletePost,
    getCategoriasPost, corPost, POST_BLOCO_LABELS, novoBlocoPost, renderPostCorpo, tempoLeituraMin,
    getTemplates, getTemplate, addTemplate, updateTemplate, deleteTemplate,
    getAudience, getCampaigns, getCampaign, addCampaign, updateCampaign, deleteCampaign, sendCampaignNow,
    login, logout, currentUser, requireAuth,
    dashboardStats, getActivity, getProximosContatos, labelEstagio,
    formatBRL, formatDate, formatDateTime, formatPhone, iniciais, timeAgo, fillTemplate,
    escapeHtml, esc: escapeHtml,
    BLOCO_LABELS, novoBloco, blocksParaTexto, renderEmailBlocks, renderWhatsappBubble,
    resetDemoData, uid
  };

})(window);
