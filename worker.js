/* ===========================================================
   Solua — Worker (API + arquivos estáticos)
   -----------------------------------------------------------
   Este Worker faz duas coisas:
   1) Serve o site estático (index.html, /crm/*, /assets/*) através
      do binding ASSETS — igual a antes, sem custo de performance.
   2) Expõe uma API mínima em /api/* com um propósito bem específico:
      guardar a PERSONALIZAÇÃO da marca (logo, cores, imagem de capa,
      WhatsApp, remetente de e-mail) num banco D1 real — assim, ao
      contrário do resto do CRM (que ainda vive no localStorage do
      navegador de cada pessoa, ver assets/js/crm-data.js), essas
      configurações valem para QUALQUER visitante do site, e não só
      para quem mexeu no próprio navegador.

   A API também dispara o e-mail e o WhatsApp AUTOMÁTICOS de boas-vindas
   quando chega um lead pelo site (ver /api/lead-notify), usando Resend
   e a WhatsApp Cloud API — mas só de verdade quando os segredos abaixo
   estiverem configurados. Sem eles, tudo continua funcionando (a
   automação fica "registrada, mas não enviada"), sem quebrar nada.

   Segredos (configure em Settings → Variables and Secrets do Worker,
   no painel do Cloudflare — nunca no código):
     RESEND_API_KEY       → chave da API do Resend (resend.com)
     WHATSAPP_TOKEN        → token permanente da WhatsApp Cloud API (Meta)
     WHATSAPP_PHONE_ID     → Phone Number ID da WhatsApp Cloud API
     WHATSAPP_TEMPLATE     → nome do template aprovado p/ 1º contato
     ADMIN_KEY             → senha simples que protege o PUT /api/settings
                              (ver crm/admin/personalizacao.html)
   =========================================================== */

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: JSON_HEADERS });
}
function uid() {
  return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}
function rowToSettings(row) {
  if (!row) return null;
  return {
    logoUrl: row.logo_url || null,
    heroImageUrl: row.hero_image_url || null,
    corPrimaria: row.cor_primaria || "#004BA5",
    corTexto: row.cor_texto || "#15181C",
    whatsappNumero: row.whatsapp_numero || "5519999999999",
    emailRemetente: row.email_remetente || "contato@solua.com.br",
    nomeRemetente: row.nome_remetente || "Solua",
    automacaoEmailAtiva: !!row.automacao_email_ativa,
    automacaoWhatsappAtiva: !!row.automacao_whatsapp_ativa,
    atualizadoEm: row.atualizado_em || null
  };
}

async function handleGetSettings(env) {
  const row = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  return json(rowToSettings(row) || {});
}

async function handlePutSettings(request, env) {
  if (!env.ADMIN_KEY) {
    return json({ ok: false, erro: "PUT /api/settings desabilitado: configure o segredo ADMIN_KEY no Worker antes de usar a Personalização." }, 501);
  }
  const key = request.headers.get("x-solua-admin-key") || "";
  if (key !== env.ADMIN_KEY) {
    return json({ ok: false, erro: "Chave de administrador inválida." }, 401);
  }
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, erro: "JSON inválido." }, 400); }

  const fields = {
    logo_url: body.logoUrl ?? null,
    hero_image_url: body.heroImageUrl ?? null,
    cor_primaria: body.corPrimaria || "#004BA5",
    cor_texto: body.corTexto || "#15181C",
    whatsapp_numero: body.whatsappNumero || "5519999999999",
    email_remetente: body.emailRemetente || "contato@solua.com.br",
    nome_remetente: body.nomeRemetente || "Solua",
    automacao_email_ativa: body.automacaoEmailAtiva ? 1 : 0,
    automacao_whatsapp_ativa: body.automacaoWhatsappAtiva ? 1 : 0
  };
  // proteção simples contra logo/imagem gigante (D1 tem limite de linha ~1MB;
  // aqui limitamos bem mais baixo pra manter a resposta rápida em qualquer plano)
  for (const k of ["logo_url", "hero_image_url"]) {
    if (fields[k] && fields[k].length > 350000) {
      return json({ ok: false, erro: `Imagem em "${k}" está grande demais (>350KB em base64). Use uma imagem mais leve ou um link (URL) em vez de anexar o arquivo.` }, 413);
    }
  }

  await env.DB.prepare(`UPDATE settings SET
      logo_url=?, hero_image_url=?, cor_primaria=?, cor_texto=?, whatsapp_numero=?,
      email_remetente=?, nome_remetente=?, automacao_email_ativa=?, automacao_whatsapp_ativa=?,
      atualizado_em=datetime('now')
    WHERE id = 1`)
    .bind(fields.logo_url, fields.hero_image_url, fields.cor_primaria, fields.cor_texto,
      fields.whatsapp_numero, fields.email_remetente, fields.nome_remetente,
      fields.automacao_email_ativa, fields.automacao_whatsapp_ativa)
    .run();

  const row = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  return json({ ok: true, settings: rowToSettings(row) });
}

async function logDispatch(env, entry) {
  try {
    await env.DB.prepare(`INSERT INTO dispatch_log
      (id, criado_em, canal, destinatario_nome, destinatario_email, destinatario_telefone, produto, assunto, status, detalhe)
      VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(uid(), entry.canal, entry.nome || null, entry.email || null, entry.telefone || null,
        entry.produto || null, entry.assunto || null, entry.status, entry.detalhe || null)
      .run();
  } catch (e) { /* nunca deixa o log derrubar o fluxo principal */ }
}

const TIPOS_VALIDOS = new Set(["seguro", "consorcio"]);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

// Dispara (ou registra como pulado) o e-mail e o WhatsApp automáticos de
// boas-vindas para um lead recém-chegado do site. Nunca lança erro pra fora:
// se o e-mail/WhatsApp falhar, o lead já foi criado no CRM de qualquer jeito.
async function handleLeadNotify(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, erro: "JSON inválido." }, 400); }

  const nome = String(body.nome || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 200);
  const telefone = String(body.telefone || "").replace(/\D/g, "").slice(0, 15);
  const produto = TIPOS_VALIDOS.has(body.produto) ? body.produto : "seguro";
  const tipo = String(body.tipo || "").slice(0, 60);
  if (!nome || nome.length < 2) return json({ ok: false, erro: "Nome inválido." }, 400);

  const settingsRow = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").first();
  const settings = rowToSettings(settingsRow) || {};
  const primeiroNome = nome.split(" ")[0];
  const produtoLabel = produto === "seguro" ? "seguro" : "consórcio";
  const results = { email: null, whatsapp: null };

  // ---------- E-MAIL (Resend) ----------
  if (!settings.automacaoEmailAtiva) {
    results.email = "desativado nas configurações";
  } else if (!email || !EMAIL_RE.test(email)) {
    results.email = "sem e-mail válido no formulário";
  } else if (!env.RESEND_API_KEY) {
    await logDispatch(env, { canal: "email", nome, email, telefone, produto, assunto: "Boas-vindas — cotação recebida", status: "pulado", detalhe: "RESEND_API_KEY não configurada" });
    results.email = "pulado — configure RESEND_API_KEY no Worker";
  } else {
    const assunto = `Recebemos sua solicitação, ${primeiroNome}!`;
    const corpoTexto = `Olá ${primeiroNome},\n\nRecebemos sua solicitação de cotação de ${produtoLabel}${tipo ? " (" + tipo + ")" : ""} e já estamos comparando as melhores opções do mercado para você.\n\nEm breve um consultor da ${settings.nomeRemetente} entra em contato pelo WhatsApp com o comparativo pronto.\n\nAté já,\nEquipe ${settings.nomeRemetente}`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${settings.nomeRemetente} <${settings.emailRemetente}>`,
          to: [email],
          subject: assunto,
          text: corpoTexto
        })
      });
      if (r.ok) {
        await logDispatch(env, { canal: "email", nome, email, telefone, produto, assunto, status: "enviado" });
        results.email = "enviado";
      } else {
        const errTxt = await r.text().catch(() => "");
        await logDispatch(env, { canal: "email", nome, email, telefone, produto, assunto, status: "falhou", detalhe: `Resend ${r.status}: ${errTxt.slice(0, 300)}` });
        results.email = `falhou (Resend respondeu ${r.status})`;
      }
    } catch (e) {
      await logDispatch(env, { canal: "email", nome, email, telefone, produto, assunto, status: "falhou", detalhe: String(e).slice(0, 300) });
      results.email = "falhou (erro de rede ao chamar o Resend)";
    }
  }

  // ---------- WHATSAPP (Cloud API oficial da Meta) ----------
  if (!settings.automacaoWhatsappAtiva) {
    results.whatsapp = "desativado nas configurações";
  } else if (!telefone || telefone.length < 10) {
    results.whatsapp = "sem WhatsApp válido no formulário";
  } else if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_TEMPLATE) {
    await logDispatch(env, { canal: "whatsapp", nome, email, telefone, produto, status: "pulado", detalhe: "WHATSAPP_TOKEN/WHATSAPP_PHONE_ID/WHATSAPP_TEMPLATE não configurados" });
    results.whatsapp = "pulado — configure as credenciais da WhatsApp Cloud API no Worker";
  } else {
    // A Meta exige que o primeiro contato use um "message template" já aprovado
    // (não dá pra mandar texto livre direto) — é a forma certa e compatível
    // com a política deles. Ajuste o nome/variáveis do template conforme o
    // que você cadastrar no WhatsApp Manager.
    const numeroDestino = "55" + telefone.replace(/^55/, "");
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numeroDestino,
          type: "template",
          template: {
            name: env.WHATSAPP_TEMPLATE,
            language: { code: "pt_BR" },
            components: [{ type: "body", parameters: [{ type: "text", text: primeiroNome }, { type: "text", text: produtoLabel }] }]
          }
        })
      });
      if (r.ok) {
        await logDispatch(env, { canal: "whatsapp", nome, email, telefone, produto, status: "enviado" });
        results.whatsapp = "enviado";
      } else {
        const errTxt = await r.text().catch(() => "");
        await logDispatch(env, { canal: "whatsapp", nome, email, telefone, produto, status: "falhou", detalhe: `Meta ${r.status}: ${errTxt.slice(0, 300)}` });
        results.whatsapp = `falhou (Meta respondeu ${r.status})`;
      }
    } catch (e) {
      await logDispatch(env, { canal: "whatsapp", nome, email, telefone, produto, status: "falhou", detalhe: String(e).slice(0, 300) });
      results.whatsapp = "falhou (erro de rede ao chamar a Meta)";
    }
  }

  return json({ ok: true, resultados: results });
}

async function handleGetDispatchLog(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
  const { results } = await env.DB.prepare("SELECT * FROM dispatch_log ORDER BY criado_em DESC LIMIT ?").bind(limit).all();
  return json({ ok: true, itens: results || [] });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/settings" && request.method === "GET") return handleGetSettings(env);
    if (url.pathname === "/api/settings" && request.method === "PUT") return handlePutSettings(request, env);
    if (url.pathname === "/api/lead-notify" && request.method === "POST") return handleLeadNotify(request, env);
    if (url.pathname === "/api/dispatch-log" && request.method === "GET") return handleGetDispatchLog(request, env);

    if (url.pathname.startsWith("/api/")) return json({ ok: false, erro: "Rota não encontrada." }, 404);

    // qualquer outra rota: serve o site estático normalmente
    return env.ASSETS.fetch(request);
  }
};
