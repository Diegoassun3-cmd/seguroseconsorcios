# Solua — Site + CRM (Seguros & Consórcios)

Site institucional da Solua e um CRM completo para as duas frentes do
negócio — **Seguros** e **Consórcios** — com uma área administrativa que
inclui uma **Central de Disparos** de e-mail e WhatsApp, **automações**
de boas-vindas de verdade (Resend + WhatsApp Cloud API) e uma tela de
**Personalização** (logo, cor da marca, WhatsApp, remetente).

Roda como um **Cloudflare Worker**: os arquivos estáticos (site + CRM)
são servidos direto, e uma API mínima em `/api/*` (implementada em
`worker.js`, com banco **D1**) guarda a personalização e dispara os
e-mails/WhatsApps automáticos. Não precisa de build (`npm run build`) —
é HTML/CSS/JS puro mais um único arquivo de Worker.

## Estrutura

```
index.html                     → site público (institucional + cotação)
worker.js                      → Worker: API /api/* + serve os arquivos estáticos
wrangler.jsonc                 → config do Worker (D1, assets)
assets/css/fonts.css           → @font-face das fontes reais da marca
assets/fonts/                  → Nyata-Regular.woff2, Satoshi-Medium.woff2
assets/css/site.css            → design do site público
assets/css/crm.css             → design do CRM (sidebar, kanban, tabelas, modais…)
assets/js/site.js              → interações do site público
assets/js/branding.js          → aplica a personalização (logo/cor) vinda de /api/settings
assets/js/crm-data.js          → "banco de dados" do CRM (localStorage) + regras de negócio
assets/js/crm-ui.js            → sidebar/topbar/toasts/modais compartilhados do CRM
assets/js/crm-newlead.js       → modal "novo lead"
assets/js/crm-leaddrawer.js    → painel de detalhe do lead (notas, estágio, edição)
assets/js/crm-pipeline.js      → lógica do quadro Kanban (seguros/consórcios)
assets/js/crm-disparos.js      → Central de Disparos + painel de Automações (real, via API)
assets/js/crm-modelos.js       → lógica da biblioteca de modelos de mensagem
assets/js/crm-equipe.js        → lógica de gestão de equipe/usuários
assets/js/crm-personalizacao.js→ lógica da tela de Personalização

crm/login.html                 → tela de login do CRM
crm/dashboard.html             → visão geral (KPIs, atividade recente)
crm/pipeline-seguros.html      → funil Kanban de Seguros
crm/pipeline-consorcios.html   → funil Kanban de Consórcios
crm/contatos.html              → base unificada de leads/clientes (ambos produtos)
crm/admin/disparos.html        → Central de Disparos + Automações
crm/admin/modelos.html         → modelos/templates de e-mail e WhatsApp
crm/admin/equipe.html          → gestão de usuários do CRM
crm/admin/personalizacao.html  → logo, cor da marca, WhatsApp, remetente, automações
```

## Rodando localmente

```bash
cd seguroseconsorcios
python3 -m http.server 8080
# depois abra http://localhost:8080
```

Assim (sem `wrangler dev`), a rota `/api/*` não existe — tudo que depende
dela (Personalização, Automações, o e-mail automático) degrada com
elegância: mostra "API não respondeu" e o site/CRM continuam funcionando
com os valores padrão. Para testar a API de verdade localmente, use
`npx wrangler dev` (exige Node) — nesta sandbox de desenvolvimento em
específico o `wrangler dev` local se mostrou instável; a lógica do
`worker.js` foi validada com um teste isolado em Node puro em vez disso.

## Publicando no Cloudflare

Este projeto já está publicado via **Workers Builds** (painel do
Cloudflare → conectar o repositório GitHub, sem build command). A cada
push na branch conectada, o Cloudflare publica sozinho.

O `wrangler.jsonc` já aponta para um banco D1 (`seguroseconsorcios-db`)
criado para este projeto. Se você recriar o projeto do zero:

```bash
npx wrangler d1 create seguroseconsorcios-db   # anote o database_id
# cole o database_id em wrangler.jsonc, em d1_databases
npx wrangler d1 execute seguroseconsorcios-db --remote --command "
  CREATE TABLE settings (...)   -- ver worker.js para o schema completo
"
```

### Segredos do Worker (Settings → Variables and Secrets, no painel)

| Segredo | Para quê | Onde conseguir |
|---|---|---|
| `ADMIN_KEY` | Protege o `PUT /api/settings` (tela de Personalização) | Você escolhe uma senha e cola na própria tela de Personalização |
| `RESEND_API_KEY` | Envia o e-mail automático de boas-vindas | resend.com → API Keys (exige domínio de envio verificado) |
| `WHATSAPP_TOKEN` | Envia o WhatsApp automático de boas-vindas | developers.facebook.com → WhatsApp → API Setup (token permanente) |
| `WHATSAPP_PHONE_ID` | Idem | Mesmo painel, "Phone Number ID" |
| `WHATSAPP_TEMPLATE` | Nome do template aprovado para o 1º contato | WhatsApp Manager → Message Templates (a Meta exige template aprovado para iniciar conversa) |

Sem `RESEND_API_KEY`/`WHATSAPP_*`, a automação liga normalmente na tela
de Personalização, mas cada tentativa fica registrada como "pulada" (não
falha, não trava o cadastro do lead) — dá pra ativar aos poucos.

## Acessando o CRM (ambiente de demonstração)

Vá em `/crm/login.html` (ou clique em **"Acesso da equipe"** no rodapé do
site público). Use um dos e-mails já cadastrados na equipe de demonstração
com a senha **`solua2026`**:

| E-mail                          | Papel          | Área              |
|----------------------------------|----------------|-------------------|
| diego.assun3@gmail.com           | Administrador  | Acesso total + Admin |
| ana.souza@solua.com.br           | Consultora     | Seguros           |
| rafael.lima@solua.com.br         | Consultor      | Consórcios        |
| camila.torres@solua.com.br       | Consultora     | Seguros           |

> **Isso é um login de demonstração**, feito só com JavaScript no
> navegador — não há verificação de senha em servidor. Está claramente
> sinalizado na própria tela de login. Antes de usar em produção com dados
> reais de clientes, troque por autenticação de verdade (ver seção
> "Para produção" abaixo).

## Como os dados funcionam hoje (duas camadas diferentes)

**Personalização (logo, cor, automações ligadas/desligadas)** já é real:
fica no banco **D1**, servido pela API do Worker. Isso vale para
**qualquer visitante do site**, não só para quem configurou.

**O resto do CRM** (leads, pipelines, contatos, modelos, campanhas
manuais, equipe) ainda vive em `localStorage`, no arquivo
`assets/js/crm-data.js` (objeto global `window.SoluaDB`). Isso tem uma
vantagem enorme para demonstração: **tudo funciona de verdade** — criar
lead, arrastar no Kanban, mandar campanha, editar modelo — sem precisar
de mais nenhum servidor. A limitação: esses dados ficam **no navegador
de cada pessoa**, não compartilhados entre atendentes. Migrar isso para
D1 também é o próximo passo natural (ver "Para produção" abaixo) — a API
já teria onde crescer, já que o Worker e o banco já existem.

Um detalhe já conectado nas duas pontas: **toda cotação enviada pelo
formulário do site** entra no CRM local (`SoluaDB.addLead`) **e** avisa a
API (`POST /api/lead-notify`), que decide — com base no que está ligado
em Personalização — se dispara e-mail/WhatsApp automático de verdade.

## Para produção (multiusuário completo)

### 1. Migrar leads/equipe/templates/campanhas para D1
Mesma ideia da Personalização: trocar as funções de `crm-data.js`
(`getLeads`, `addLead`, `login`...) por `fetch()` para novas rotas em
`worker.js`, mantendo a mesma assinatura de função — as telas não
precisam mudar. Nessa migração, troque também o login de demonstração
por sessão real (cookie assinado, verificado no Worker).

### 2. Campanhas manuais em massa de verdade
A Central de Disparos já resolve produto inteiro: segmentar público,
escolher modelo, pré-visualizar, agendar, histórico com métricas. Hoje só
o disparo **automático** de boas-vindas (1 lead por vez) chama o Resend
de verdade; falta estender `sendCampaignNow` para, no envio de uma
campanha manual, chamar `/api/lead-notify` (ou uma rota de lote nova) uma
vez por destinatário.

### 3. WhatsApp além do template de boas-vindas
A Cloud API exige template aprovado para qualquer 1º contato dentro da
janela de 24h; para conversas em massa continuadas, vale olhar filas
(evitar rate limit da Meta) e webhooks de status de entrega.

> Enquanto isso, o botão "Falar no WhatsApp" no drawer de cada lead já
> funciona de verdade hoje, abrindo o `wa.me` com o número do cliente —
> ótimo pro dia a dia manual do consultor.

## Marca e tipografia

As fontes reais da marca — **Nyata FTR Regular** (títulos/destaques) e
**Satoshi Medium** (texto/UI) — estão em `assets/fonts/*.woff2` e
carregadas via `assets/css/fonts.css` em todas as páginas. Como só há uma
variação de peso de cada uma, os títulos usam `font-weight:400`
(a Nyata não tem versão bold — negrito ali seria falsificado pelo
navegador e ficaria ruim).

A cor principal da marca (`--azul`) é customizável ao vivo pela tela
**Personalização** do CRM (grava em D1, aplica no site pra todo mundo via
`assets/js/branding.js`). As poucas variações de tom usam `color-mix()`
em cima dela, então tudo (botões, badges, hover) acompanha a cor nova
automaticamente.

Antes de publicar, troque também:
- o e-mail de contato no rodapé do site (`index.html`);
- os e-mails/telefones da equipe de demonstração em `crm-data.js`, pelos
  reais;
- o número de WhatsApp padrão (constante `WPP` em `assets/js/site.js`) —
  ou simplesmente configure o real na tela de Personalização, que
  sobrescreve isso para todo mundo sem precisar editar código.
