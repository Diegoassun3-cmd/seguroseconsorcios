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

  const KEY = "solua_crm_v1";

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
    ]
  };

  const TIPOS = {
    seguro: ["Auto","Residencial","Vida","Empresarial","Saúde / Odonto","Viagem","Garantia locatícia","Condomínio","Outro"],
    consorcio: ["Imóvel","Automóvel","Pesados / Máquinas","Serviços"]
  };

  const ORIGENS = ["Site","Indicação","WhatsApp","Instagram","Anúncio","Telefone","Balcão"];

  const EQUIPE_SEED = [
    {id:"u1", nome:"Diego Assunção",     email:"diego.assun3@gmail.com", papel:"Administrador", produto:"ambos",     ativo:true, avatarBg:"#004BA5"},
    {id:"u2", nome:"Ana Beatriz Souza",  email:"ana.souza@solua.com.br", papel:"Consultora",     produto:"seguro",    ativo:true, avatarBg:"#118ECC"},
    {id:"u3", nome:"Rafael Lima",        email:"rafael.lima@solua.com.br", papel:"Consultor",    produto:"consorcio", ativo:true, avatarBg:"#B8862B"},
    {id:"u4", nome:"Camila Torres",      email:"camila.torres@solua.com.br", papel:"Consultora", produto:"seguro",    ativo:true, avatarBg:"#1E8E5A"}
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

  function uid(prefix){ return (prefix||"id")+"_"+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4); }
  function nowISO(){ return new Date().toISOString(); }
  function daysAgoISO(n, hour){
    const d = new Date();
    d.setDate(d.getDate()-n);
    if(hour!=null) d.setHours(hour, Math.floor(Math.random()*59), 0, 0);
    return d.toISOString();
  }

  // -------------------- SEED (dados de demonstração) --------------------
  function seedState(){
    const nomes = [
      ["Marcos Vinícius Pereira","Sumaré"],["Juliana Ferraz Bianchi","Campinas"],["Eduardo Castellani","Valinhos"],
      ["Patrícia Nogueira","Campinas"],["Thiago Bordin Camargo","Hortolândia"],["Renata Salomão","Indaiatuba"],
      ["Felipe Andrade Mesquita","Campinas"],["Luciana Prado Vieira","Vinhedo"],["Gustavo Henrique Rezende","Paulínia"],
      ["Bianca Otoni Franco","Campinas"],["André Kobayashi","Americana"],["Vanessa Lacerda Ramos","Campinas"],
      ["Rodrigo Sanches Melo","Sumaré"],["Fernanda Dutra Cintra","Campinas"],["Bruno Cavalcanti Alves","Valinhos"],
      ["Larissa Monteiro Bicudo","Hortolândia"],["Caio César Villela","Campinas"],["Débora Ramalho Prado","Indaiatuba"],
      ["Leandro Furtado Zanetti","Campinas"],["Priscila Andrade Godoy","Paulínia"],["Vitor Hugo Marchetti","Campinas"],
      ["Simone Aparecida Reis","Vinhedo"],["Diego Fagundes Barreto","Americana"],["Aline Bortolozzo","Campinas"],
      ["Marcelo Tadeu Grangeiro","Sumaré"],["Cristina Amaro Peixoto","Campinas"]
    ];
    const leads = nomes.map((n,i)=>{
      const produto = i % 5 === 0 ? "consorcio" : (i % 2 === 0 ? "seguro" : (i % 3 === 0 ? "consorcio" : "seguro"));
      const tiposP = TIPOS[produto];
      const tipo = tiposP[i % tiposP.length];
      const estagios = PIPELINES[produto];
      // distribui os estágios dando peso maior às fases iniciais (funil realista)
      const pesos = [26,22,20,16,10,6];
      let acc = 0, r = (i*37)%100, estagio = estagios[0].id;
      for(let k=0;k<estagios.length;k++){ acc += pesos[k]; if(r < acc){ estagio = estagios[k].id; break; } }
      const criadoHaDias = 2 + (i*3)%58;
      const consultor = produto === "seguro" ? (i%2===0?"u2":"u4") : "u3";
      const valor = produto === "seguro"
        ? [90,140,220,60,350,180,420,75][i%8] * (tipo==="Empresarial"||tipo==="Saúde / Odonto"?4:1)
        : [180000,65000,320000,45000,95000,250000][i%6];
      const notas = [];
      if(i%3===0) notas.push({id:uid("nota"), data:daysAgoISO(criadoHaDias-1), autor:"Sistema", texto:"Lead recebido pelo formulário do site."});
      if(estagio!=="novo") notas.push({id:uid("nota"), data:daysAgoISO(Math.max(0,criadoHaDias-2)), autor: produto==="seguro"?"Ana Beatriz Souza":"Rafael Lima", texto:"Primeiro contato realizado por WhatsApp, cliente confirmou interesse."});
      return {
        id: uid("lead"),
        nome: n[0],
        email: n[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z ]/g,"").trim().replace(/\s+/g,".")+"@exemplo.com",
        telefone: "19"+String(90000000+ (i*7919)%9999999).slice(0,9),
        cidade: n[1],
        produto, tipo, estagio,
        origem: ORIGENS[i % ORIGENS.length],
        consultorId: consultor,
        valor,
        tags: i%7===0 ? ["prioridade"] : (i%5===0 ? ["renovacao"] : []),
        criadoEm: daysAgoISO(criadoHaDias, 9),
        atualizadoEm: daysAgoISO(Math.max(0, criadoHaDias-1), 15),
        notas
      };
    });

    const templates = [
      {id:uid("tpl"), canal:"email", categoria:"seguro", nome:"Boas-vindas — cotação recebida", assunto:"Recebemos sua solicitação, {{primeiro_nome}}!",
        corpo:"Olá {{primeiro_nome}},\n\nRecebemos sua solicitação de cotação de {{produto}} e já estamos comparando as melhores opções do mercado para você.\n\nEm breve, {{consultor}} entra em contato pelo WhatsApp {{telefone_solua}} com o comparativo pronto.\n\nAtè já,\nEquipe Solua"},
      {id:uid("tpl"), canal:"email", categoria:"consorcio", nome:"Simulação de consórcio enviada", assunto:"Sua simulação de consórcio de {{tipo}} está pronta",
        corpo:"Olá {{primeiro_nome}},\n\nPreparamos sua simulação de consórcio de {{tipo}} com parcelas que cabem no seu planejamento, sem juros.\n\nQualquer dúvida, é só responder este e-mail ou chamar no WhatsApp.\n\nAbraço,\n{{consultor}} — Solua"},
      {id:uid("tpl"), canal:"email", categoria:"geral", nome:"Lembrete de renovação de apólice", assunto:"Sua apólice vence em breve — vamos revisar?",
        corpo:"Olá {{primeiro_nome}},\n\nSua apólice está próxima do vencimento. Antes de renovar automaticamente, que tal revisarmos coberturas e recotarmos no mercado? Pode valer a pena.\n\nFico à disposição,\n{{consultor}}"},
      {id:uid("tpl"), canal:"whatsapp", categoria:"seguro", nome:"Primeiro contato — seguro", assunto:"",
        corpo:"Olá {{primeiro_nome}}! Aqui é {{consultor}}, da Solua 👋 Recebi seu pedido de cotação de {{produto}} ({{tipo}}). Posso te chamar por aqui mesmo para fechar alguns detalhes e já te enviar o comparativo?"},
      {id:uid("tpl"), canal:"whatsapp", categoria:"consorcio", nome:"Primeiro contato — consórcio", assunto:"",
        corpo:"Oi {{primeiro_nome}}, tudo bem? Aqui é {{consultor}} da Solua. Vi seu interesse em consórcio de {{tipo}} 🙂 Consigo te mandar agora uma simulação com valor de carta e parcela. Prefere que eu já mande por aqui?"},
      {id:uid("tpl"), canal:"whatsapp", categoria:"geral", nome:"Reativação — sem resposta", assunto:"",
        corpo:"Oi {{primeiro_nome}}! Passando para saber se ainda faz sentido pra você aquela cotação que conversamos. Se quiser, atualizo os valores e te mando de novo 🙂"}
    ];

    const campaigns = [
      {id:uid("camp"), canal:"email", nome:"Aquecimento — leads de seguro auto (30 dias)", segmento:"seguro", templateId: templates[0].id,
        status:"enviado", criadoEm: daysAgoISO(9), enviadoEm: daysAgoISO(9,10),
        metrics:{enviados:118, entregues:114, abertos:71, cliques:22, respostas:9}},
      {id:uid("camp"), canal:"whatsapp", nome:"Reativação de simulações de consórcio", segmento:"consorcio", templateId: templates[4].id,
        status:"enviado", criadoEm: daysAgoISO(4), enviadoEm: daysAgoISO(4,16),
        metrics:{enviados:64, entregues:63, abertos:58, cliques:0, respostas:19}},
      {id:uid("camp"), canal:"email", nome:"Lembrete de renovação — apólices do mês", segmento:"clientes", templateId: templates[2].id,
        status:"agendado", criadoEm: daysAgoISO(1), agendadoPara: daysAgoISO(-2,9),
        metrics:{enviados:0, entregues:0, abertos:0, cliques:0, respostas:0}},
      {id:uid("camp"), canal:"whatsapp", nome:"Boas-vindas novos leads da semana", segmento:"todos", templateId: templates[3].id,
        status:"rascunho", criadoEm: daysAgoISO(0),
        metrics:{enviados:0, entregues:0, abertos:0, cliques:0, respostas:0}}
    ];

    const activity = [];
    leads.forEach(l=>{
      activity.push({id:uid("act"), data:l.criadoEm, tipo:"lead_criado", leadId:l.id, descricao:`Novo lead de ${l.produto==="seguro"?"seguro":"consórcio"}: ${l.nome}`});
      if(l.estagio!=="novo") activity.push({id:uid("act"), data:l.atualizadoEm, tipo:"estagio_alterado", leadId:l.id, descricao:`${l.nome} avançou para "${labelEstagio(l.produto,l.estagio)}"`});
    });
    campaigns.filter(c=>c.status==="enviado").forEach(c=>{
      activity.push({id:uid("act"), data:c.enviadoEm, tipo:"campanha_enviada", campanhaId:c.id, descricao:`Campanha "${c.nome}" enviada (${c.canal==="email"?"e-mail":"WhatsApp"})`});
    });
    activity.sort((a,b)=> new Date(b.data)-new Date(a.data));

    return { leads, templates, campaigns, equipe: EQUIPE_SEED, activity, session:null };
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
      origem:"Site", consultorId:null, valor:0, tags:[],
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
  function getEquipe(){ return STATE.equipe.slice(); }
  function getUsuario(id){ return STATE.equipe.find(u=>u.id===id) || null; }
  function addUsuario(data){
    const u = Object.assign({id:uid("u"), nome:"", email:"", papel:"Consultor", produto:"seguro", ativo:true, avatarBg:"#004BA5"}, data);
    STATE.equipe.push(u); save(STATE); return u;
  }
  function updateUsuario(id, patch){
    const u = getUsuario(id); if(!u) return null;
    Object.assign(u, patch); save(STATE); return u;
  }
  function deleteUsuario(id){
    STATE.equipe = STATE.equipe.filter(u=>u.id!==id); save(STATE);
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
    {id:"clientes",    label:"Clientes (apólice emitida / contemplados)"},
    {id:"sem_contato_7d", label:"Sem interação há 7+ dias"},
    {id:"prioridade",  label:"Marcados como prioridade"}
  ];
  function getAudience(segmentoId){
    const all = STATE.leads;
    switch(segmentoId){
      case "seguro": return all.filter(l=>l.produto==="seguro");
      case "consorcio": return all.filter(l=>l.produto==="consorcio");
      case "clientes": return all.filter(l=>l.estagio==="apolice"||l.estagio==="contemplado");
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
      templateSnapshot: tplOriginal ? {nome:tplOriginal.nome, assunto:tplOriginal.assunto, corpo:tplOriginal.corpo} : null,
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
  function dashboardStats(){
    const leads = STATE.leads;
    const abertos = leads.filter(l=>l.estagio!=="perdido" && l.estagio!=="apolice" && l.estagio!=="contemplado");
    const ganhos = leads.filter(l=>l.estagio==="apolice"||l.estagio==="contemplado");
    const perdidos = leads.filter(l=>l.estagio==="perdido");
    const seguro = leads.filter(l=>l.produto==="seguro");
    const consorcio = leads.filter(l=>l.produto==="consorcio");
    const novos7d = leads.filter(l=> (Date.now()-new Date(l.criadoEm).getTime()) < 7*24*3600*1000).length;
    const valorEmAberto = abertos.reduce((s,l)=>s+(Number(l.valor)||0),0);
    const taxaConversao = leads.length ? Math.round((ganhos.length/leads.length)*100) : 0;
    return { total:leads.length, abertos:abertos.length, ganhos:ganhos.length, perdidos:perdidos.length,
      seguro:seguro.length, consorcio:consorcio.length, novos7d, valorEmAberto, taxaConversao };
  }
  function getActivity(limit){ return STATE.activity.slice(0, limit||30); }

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

  // -------------------- RESET (útil em demonstrações) --------------------
  function resetDemoData(){
    STATE = seedState();
    save(STATE);
  }

  global.SoluaDB = {
    PIPELINES, TIPOS, ORIGENS, SEGMENTOS,
    getLeads, getLead, getLeadsByProduto, addLead, updateLead, deleteLead, addNota,
    getEquipe, getUsuario, addUsuario, updateUsuario, deleteUsuario,
    getTemplates, getTemplate, addTemplate, updateTemplate, deleteTemplate,
    getAudience, getCampaigns, getCampaign, addCampaign, updateCampaign, deleteCampaign, sendCampaignNow,
    login, logout, currentUser, requireAuth,
    dashboardStats, getActivity, labelEstagio,
    formatBRL, formatDate, formatDateTime, formatPhone, iniciais, timeAgo, fillTemplate,
    escapeHtml, esc: escapeHtml,
    resetDemoData, uid
  };

})(window);
