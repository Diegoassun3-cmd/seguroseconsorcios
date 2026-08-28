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

  // v2: remove os leads/campanhas fictícios da demonstração inicial (o site
  // tinha "contatos falsos" pré-carregados) e passa os modelos para o novo
  // formato com blocos de e-mail (imagem, título, texto, botão) e estrutura
  // completa de WhatsApp (cabeçalho, corpo, rodapé, botões).
  const KEY = "solua_crm_v2";

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
      {id:uid("tpl"), canal:"whatsapp", categoria:"seguro", nome:"Primeiro contato — seguro",
        headerType:"nenhum", corpo:"Olá {{primeiro_nome}}! Aqui é {{consultor}}, da {{nome_empresa}} 👋 Recebi seu pedido de cotação de {{produto}} ({{tipo}}). Posso te chamar por aqui mesmo para fechar alguns detalhes e já te enviar o comparativo?",
        rodape:"Resposta em até 1 dia útil", botoes:[{tipo:"resposta_rapida", texto:"Pode continuar"}]},
      {id:uid("tpl"), canal:"whatsapp", categoria:"consorcio", nome:"Primeiro contato — consórcio",
        headerType:"nenhum", corpo:"Oi {{primeiro_nome}}, tudo bem? Aqui é {{consultor}} da {{nome_empresa}}. Vi seu interesse em consórcio de {{tipo}} 🙂 Consigo te mandar agora uma simulação com valor de carta e parcela. Prefere que eu já mande por aqui?",
        rodape:"Resposta em até 1 dia útil", botoes:[{tipo:"resposta_rapida", texto:"Pode mandar"}]}
    ];

    return { leads:[], templates, campaigns:[], equipe: EQUIPE_SEED, activity:[], session:null };
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
    PIPELINES, TIPOS, ORIGENS, SEGMENTOS,
    getLeads, getLead, getLeadsByProduto, addLead, updateLead, deleteLead, addNota,
    getEquipe, getUsuario, addUsuario, updateUsuario, deleteUsuario,
    getTemplates, getTemplate, addTemplate, updateTemplate, deleteTemplate,
    getAudience, getCampaigns, getCampaign, addCampaign, updateCampaign, deleteCampaign, sendCampaignNow,
    login, logout, currentUser, requireAuth,
    dashboardStats, getActivity, labelEstagio,
    formatBRL, formatDate, formatDateTime, formatPhone, iniciais, timeAgo, fillTemplate,
    escapeHtml, esc: escapeHtml,
    BLOCO_LABELS, novoBloco, blocksParaTexto, renderEmailBlocks, renderWhatsappBubble,
    resetDemoData, uid
  };

})(window);
