# Solua — Site + CRM (Seguros & Consórcios)

Site institucional da Solua e um CRM completo para as duas frentes do
negócio — **Seguros** e **Consórcios** — com uma área administrativa que
inclui uma **Central de Disparos** de e-mail e WhatsApp.

É um projeto 100% estático (HTML/CSS/JS puro, sem build), pronto para
publicar em qualquer hospedagem de arquivos estáticos (Netlify, Vercel,
Cloudflare Pages, GitHub Pages, um servidor Apache/Nginx comum etc.) e
apontar o domínio **soluaseguroseconsorcios.com.br**.

## Estrutura

```
index.html                     → site público (institucional + cotação)
assets/css/site.css            → design do site público
assets/css/crm.css             → design do CRM (sidebar, kanban, tabelas, modais…)
assets/js/site.js              → interações do site público
assets/js/crm-data.js          → "banco de dados" do CRM (localStorage) + regras de negócio
assets/js/crm-ui.js            → sidebar/topbar/toasts/modais compartilhados do CRM
assets/js/crm-newlead.js       → modal "novo lead"
assets/js/crm-leaddrawer.js    → painel de detalhe do lead (notas, estágio, edição)
assets/js/crm-pipeline.js      → lógica do quadro Kanban (seguros/consórcios)
assets/js/crm-disparos.js      → lógica da Central de Disparos
assets/js/crm-modelos.js       → lógica da biblioteca de modelos de mensagem
assets/js/crm-equipe.js        → lógica de gestão de equipe/usuários

crm/login.html                 → tela de login do CRM
crm/dashboard.html             → visão geral (KPIs, atividade recente)
crm/pipeline-seguros.html      → funil Kanban de Seguros
crm/pipeline-consorcios.html   → funil Kanban de Consórcios
crm/contatos.html              → base unificada de leads/clientes (ambos produtos)
crm/admin/disparos.html        → Central de Disparos (e-mail + WhatsApp)
crm/admin/modelos.html         → modelos/templates de e-mail e WhatsApp
crm/admin/equipe.html          → gestão de usuários do CRM
```

## Rodando localmente

Não precisa de `npm install` nem de build. Basta servir a pasta como
arquivos estáticos, por exemplo:

```bash
cd seguroseconsorcios
python3 -m http.server 8080
# depois abra http://localhost:8080
```

(Abrir os arquivos com `file://` direto também funciona na maior parte dos
navegadores, exceto restrições de alguns navegadores para `localStorage`.)

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

## Como os dados funcionam hoje

Todo o CRM (leads, pipelines, contatos, modelos de mensagem, campanhas e
equipe) é guardado em `localStorage`, no arquivo `assets/js/crm-data.js`
(objeto global `window.SoluaDB`). Isso tem uma vantagem enorme para
demonstração: **tudo funciona de verdade** — criar lead, arrastar no
Kanban, mandar campanha, editar modelo — sem precisar de servidor.

A limitação: os dados ficam **no navegador de cada pessoa**, não são
compartilhados entre computadores/atendentes. Para virar uma ferramenta
de uso diário por várias pessoas ao mesmo tempo, o próximo passo é trocar
a camada de persistência por uma API de verdade.

Um detalhe já pensado para essa migração: **toda cotação enviada pelo
formulário do site público já entra automaticamente no CRM como lead**
(mesma função `SoluaDB.addLead`, chamada em `assets/js/site.js`). Ou seja,
o funil de vendas já nasce conectado à captação do site.

## Para produção (multiusuário e com envio de verdade)

O CRM foi estruturado para que trocar a "camada de dados" não exija
reescrever as telas. Três frentes, em ordem de prioridade:

### 1. Backend + autenticação real
Troque as funções de `assets/js/crm-data.js` (`getLeads`, `addLead`,
`login` etc.) por chamadas `fetch()` a uma API sua — Node/Express,
Laravel, Supabase, Firebase ou similar — mantendo a mesma assinatura de
função. Use autenticação de verdade (Supabase Auth, Firebase Auth,
NextAuth, Clerk...) no lugar do `login()` de demonstração.

### 2. Ligando os disparos de e-mail
A Central de Disparos (`crm/admin/disparos.html`) já resolve toda a parte
de produto: segmentar público, escolher modelo, pré-visualizar, agendar e
guardar histórico com métricas. Falta plugar um provedor de envio de
verdade no momento do "Enviar agora" (função `sendCampaignNow` em
`crm-data.js`):

- **Resend** ou **SendGrid**: enviam e-mail transacional/marketing via
  API REST simples. Você criaria uma função de servidor (serverless
  function, endpoint da sua API) que recebe `{destinatarios, assunto,
  corpo}` e chama a API do provedor com sua chave secreta (nunca exponha
  a chave no front-end).
- Troque a simulação de métricas por leitura real via webhook do provedor
  (aberturas, cliques, bounces).

### 3. Ligando os disparos de WhatsApp
Duas rotas comuns:

- **WhatsApp Cloud API (Meta oficial)** — indicada para volume e
  conformidade; exige conta comercial verificada e templates aprovados
  pela Meta para o primeiro contato.
- **Twilio para WhatsApp** ou provedores similares (Zenvia, Take Blip) —
  mais simples de integrar rapidamente, camada por cima da API da Meta.

Em ambos os casos, o fluxo é o mesmo: um endpoint de servidor recebe a
lista de destinatários + o texto já resolvido (`SoluaDB.fillTemplate`) e
chama a API do provedor com as credenciais guardadas em variáveis de
ambiente no servidor — nunca no código do site.

> Enquanto esses provedores não estão plugados, o botão "Falar no
> WhatsApp" no drawer de cada lead já funciona de verdade hoje, abrindo o
> `wa.me` com o número do cliente — ótimo para o dia a dia manual do
> consultor mesmo antes de automatizar os disparos em massa.

## Marca e tipografia

O site referência enviado usava fontes customizadas (Nyata/Satoshi)
incorporadas em base64. Para manter a mesma linguagem visual (editorial,
minimalista, com números grandes e muito respiro) sem inflar o peso de
cada página, o projeto usa duas fontes do Google Fonts com a mesma
personalidade: **Bricolage Grotesque** (títulos/destaques) e **Inter**
(texto). Trocar por fontes proprietárias da marca, se houver, é só
atualizar o `<link>` do Google Fonts e a variável `--font-display` /
`--font-body` em `assets/css/site.css` e `assets/css/crm.css`.

Antes de publicar, troque também:
- o número de WhatsApp em `assets/js/site.js` (constante `WPP`);
- o e-mail de contato no rodapé do site (`index.html`);
- os e-mails/telefones da equipe de demonstração em `crm-data.js`, pelos
  reais.
