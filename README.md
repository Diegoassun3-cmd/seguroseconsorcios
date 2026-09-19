# Solua — Site + CRM (Imóveis, Seguros & Consórcios)

Site institucional multi-página da Solua e um CRM completo para as três
frentes do negócio — **Imóveis**, **Seguros** e **Consórcios** — com uma
área administrativa que inclui **Central de Disparos** de e-mail e
WhatsApp com **configurador completo de modelos** (blocos de e-mail e
estrutura de WhatsApp), **automações** de boas-vindas de verdade (Resend
+ WhatsApp Cloud API), **Personalização** (logo, cor, WhatsApp,
remetente), **Painel de Design** (textos e visibilidade de seções da
Home), **Documentos** internos e **Financeiro** (vendas e comissão).

Roda como um **Cloudflare Worker**: os arquivos estáticos (site + CRM)
são servidos direto, e uma API mínima em `/api/*` (implementada em
`worker.js`, com banco **D1**, com auto-migração de esquema) guarda a
personalização, os documentos e dispara os e-mails/WhatsApps automáticos.
Não precisa de build (`npm run build`) — é HTML/CSS/JS puro mais um
único arquivo de Worker.

## Estrutura

```
index.html                      → Home (resumo das 3 frentes + destaques + blog)
imoveis.html                    → catálogo de imóveis (filtros)
imovel.html                     → detalhe de um imóvel (galeria, ficha, interesse)
seguros.html                    → linhas de seguro + simulador + FAQ
consorcios.html                 → linhas de consórcio + parceiras + simulador + FAQ
sobre.html                      → história (linha do tempo) + equipe pública
contato.html                    → formulário geral de contato
worker.js                       → Worker: API /api/* + serve os arquivos estáticos
wrangler.jsonc                  → config do Worker (D1, assets)

assets/css/fonts.css            → @font-face das fontes reais da marca
assets/fonts/                   → Nyata-Regular.woff2, Satoshi-Medium.woff2
assets/css/site.css             → design base do site público
assets/css/editorial.css        → componentes editoriais (hero, catálogo, timeline…)
assets/css/crm.css              → design do CRM (sidebar, kanban, tabelas, modais…)

assets/js/site-chrome.js        → header/menu mobile/rodapé/WhatsApp flutuante (todas as páginas públicas)
assets/js/quote-flow.js         → simulador de cotação reutilizável (Seguros e Consórcios)
assets/js/product-list.js       → lista de produtos com sub-abas (Seguros/Consórcios)
assets/js/home.js               → carrossel do hero, destaques, blog (Home)
assets/js/imoveis-catalogo.js   → filtros + grade do catálogo de imóveis
assets/js/imovel-detalhe.js     → página de detalhe de um imóvel
assets/js/seguros.js            → dados e montagem da página de Seguros
assets/js/consorcios.js         → dados e montagem da página de Consórcios
assets/js/sobre.js              → equipe pública (a partir da mesma base do CRM)
assets/js/contato.js            → formulário geral de contato
assets/js/content-schema.js     → schema de tudo que é editável em Design (texto/foto/vídeo/seção, por página)
assets/js/content-apply.js      → aplica o conteúdo salvo (data-cms="...") nas páginas públicas
assets/js/branding.js           → aplica a personalização (logo/cor) e chama content-apply, vindos de /api/settings

assets/js/crm-data.js           → "banco de dados" do CRM (localStorage) + regras de negócio
assets/js/crm-ui.js             → sidebar/topbar/toasts/modais compartilhados do CRM
assets/js/crm-newlead.js        → modal "novo lead"
assets/js/crm-leaddrawer.js     → painel de detalhe do lead (notas, estágio, edição)
assets/js/crm-pipeline.js       → lógica do quadro Kanban (imóveis/seguros/consórcios)
assets/js/crm-disparos.js       → Central de Disparos + painel de Automações (real, via API)
assets/js/crm-modelos.js        → configurador de modelos (blocos de e-mail + estrutura de WhatsApp)
assets/js/crm-equipe.js         → lógica de gestão de equipe/usuários
assets/js/crm-personalizacao.js → lógica da tela de Personalização
assets/js/crm-design.js         → lógica do Painel de Design
assets/js/crm-documentos.js     → lógica do repositório de Documentos
assets/js/crm-financeiro.js     → lógica do painel Financeiro

crm/login.html                  → tela de login do CRM
crm/dashboard.html              → visão geral (KPIs, atividade recente)
crm/pipeline-imoveis.html       → funil Kanban de Imóveis
crm/pipeline-seguros.html       → funil Kanban de Seguros
crm/pipeline-consorcios.html    → funil Kanban de Consórcios
crm/contatos.html               → base unificada de leads/clientes (todos os produtos)
crm/admin/disparos.html         → Central de Disparos + Automações
crm/admin/modelos.html          → modelos/templates de e-mail e WhatsApp
crm/admin/equipe.html           → gestão de usuários do CRM
crm/admin/design.html           → textos e visibilidade de seções da Home
crm/admin/documentos.html       → repositório de documentos internos
crm/admin/financeiro.html       → vendas, comissão e ranking por consultor
crm/admin/personalizacao.html   → logo, cor da marca, WhatsApp, remetente, automações
```

## Rodando localmente

```bash
cd seguroseconsorcios
python3 -m http.server 8080
# depois abra http://localhost:8080
```

Assim (sem `wrangler dev`), a rota `/api/*` não existe — tudo que depende
dela (Personalização, Design, Documentos, Automações, o e-mail
automático) degrada com elegância: mostra "API não respondeu" e o
site/CRM continuam funcionando com os valores padrão. Para testar a API
de verdade localmente, use `npx wrangler dev` (exige Node) — nesta
sandbox de desenvolvimento em específico o `wrangler dev` local se
mostrou instável; a lógica do `worker.js` foi validada com testes
automatizados de ponta a ponta (Playwright) em vez disso.

## Publicando no Cloudflare

Este projeto já está publicado via **Workers Builds** (painel do
Cloudflare → conectar o repositório GitHub, sem build command). A cada
push na branch conectada, o Cloudflare publica sozinho.

O `wrangler.jsonc` já aponta para um banco D1 (`seguroseconsorcios-db`)
criado para este projeto. O próprio `worker.js` cria e atualiza o
esquema sozinho na primeira requisição de cada instância "quente"
(função `ensureSchema`/`migrate`) — tabelas com `CREATE TABLE IF NOT
EXISTS` e colunas novas com `ALTER TABLE` (ignorando o erro esperado
quando a coluna já existe). Isso significa que, se você recriar o banco
do zero, não precisa rodar SQL manual: basta apontar o `database_id`
certo em `wrangler.jsonc` e publicar.

```bash
npx wrangler d1 create seguroseconsorcios-db   # anote o database_id
# cole o database_id em wrangler.jsonc, em d1_databases
# publique — o Worker cria settings/dispatch_log/documentos sozinho na 1ª requisição
```

### Segredos do Worker (Settings → Variables and Secrets, no painel)

| Segredo | Para quê | Onde conseguir |
|---|---|---|
| `ADMIN_KEY` | Protege o `PUT /api/settings` e as escritas em `/api/documentos` | Você escolhe uma senha e cola na tela de Personalização |
| `RESEND_API_KEY` | Envia o e-mail automático de boas-vindas | resend.com → API Keys (exige domínio de envio verificado) |
| `WHATSAPP_TOKEN` | Envia o WhatsApp automático de boas-vindas | developers.facebook.com → WhatsApp → API Setup (token permanente) |
| `WHATSAPP_PHONE_ID` | Idem | Mesmo painel, "Phone Number ID" |
| `WHATSAPP_TEMPLATE` | Nome do template aprovado para o 1º contato | WhatsApp Manager → Message Templates (a Meta exige template aprovado para iniciar conversa) |

Sem `RESEND_API_KEY`/`WHATSAPP_*`, a automação liga normalmente na tela
de Personalização, mas cada tentativa fica registrada como "pulada" (não
falha, não trava o cadastro do lead) — dá pra ativar aos poucos. Isso
vale para lead de imóvel, seguro ou consórcio.

## Acessando o CRM (ambiente de demonstração)

Vá em `/crm/login.html` (ou clique em **"Acesso da equipe"** no rodapé do
site público). Use um dos e-mails já cadastrados na equipe de demonstração
com a senha **`solua2026`**:

| E-mail                          | Papel                  | Área              |
|----------------------------------|------------------------|-------------------|
| diego.assun3@gmail.com           | Administrador          | Acesso total + Admin |
| ana.souza@solua.com.br           | Consultora             | Seguros           |
| rafael.lima@solua.com.br         | Consultor              | Consórcios        |
| camila.torres@solua.com.br       | Consultora             | Seguros           |
| bruno.amaral@solua.com.br        | Consultor de Imóveis   | Imóveis           |

> **Isso é um login de demonstração**, feito só com JavaScript no
> navegador — não há verificação de senha em servidor. Está claramente
> sinalizado na própria tela de login. Antes de usar em produção com dados
> reais de clientes, troque por autenticação de verdade (ver seção
> "Para produção" abaixo).

## Como os dados funcionam hoje (duas camadas diferentes)

**Personalização, Design e Documentos** já são reais: ficam no banco
**D1**, servidos pela API do Worker. Isso vale para **qualquer visitante
do site**, não só para quem configurou.

**O resto do CRM** (leads, pipelines, contatos, catálogo de imóveis,
modelos, campanhas manuais, equipe) ainda vive em `localStorage`, no
arquivo `assets/js/crm-data.js` (objeto global `window.SoluaDB`). Isso
tem uma vantagem enorme para demonstração: **tudo funciona de verdade** —
criar lead, arrastar no Kanban, mandar campanha, editar modelo, cadastrar
imóvel — sem precisar de mais nenhum servidor. A limitação: esses dados
ficam **no navegador de cada pessoa**, não compartilhados entre
atendentes. Migrar isso para D1 também é o próximo passo natural (ver
"Para produção" abaixo) — a API já teria onde crescer, já que o Worker e
o banco já existem.

**A base de contatos começa vazia de propósito** — sem leads, campanhas
ou atividade fictícios. Ficam a equipe (necessária pro login), o
**catálogo de imóveis de exemplo** (8 imóveis — isso é produto/portfólio,
não dado de cliente) e alguns **modelos de mensagem de exemplo**, como
ponto de partida.

### Configurador de modelos (e-mail e WhatsApp completos)

Em `crm/admin/modelos.html`, cada modelo de e-mail é montado por **blocos**
reordenáveis — Imagem (upload ou URL, com link e texto alternativo),
Título, Texto, Botão (com link), Divisor e Espaço — renderizados como
HTML de e-mail de verdade (`DB.renderEmailBlocks`, com estilo inline,
compatível com a maioria dos clientes de e-mail). Os modelos de WhatsApp
têm cabeçalho (nenhum / texto em negrito / imagem), corpo, rodapé e até
3 botões (resposta rápida, link ou ligar) — a mesma estrutura que a
WhatsApp Cloud API exige para aprovar um template; a pré-visualização
(`DB.renderWhatsappBubble`) já mostra tudo isso na bolha do telefone. Um
mesmo grupo de variáveis (`{{primeiro_nome}}`, `{{produto}}`, `{{tipo}}`,
`{{consultor}}`, `{{nome_empresa}}`, `{{telefone_solua}}` e
`{{telefone_solua_link}}` — este último só com números, pronto pra virar
link `https://wa.me/...`) funciona nos dois canais, para os três produtos
(categorias `imovel`, `seguro`, `consorcio` ou `geral`).

> O cadastro do template de WhatsApp aqui é a referência de conteúdo —
> a Meta ainda exige que o mesmo texto seja submetido e aprovado no
> WhatsApp Manager antes de valer pra disparo automático de verdade
> (ver `WHATSAPP_TEMPLATE` mais abaixo).

Um detalhe já conectado nas duas pontas: **toda cotação, simulação ou
interesse em imóvel enviado pelo site** entra no CRM local
(`SoluaDB.addLead`) **e** avisa a API (`POST /api/lead-notify`), que
decide — com base no que está ligado em Personalização — se dispara
e-mail/WhatsApp automático de verdade.

### Painel de Design (CMS de conteúdo: texto, foto e vídeo)

Em `crm/admin/design.html`, uma aba por página pública (Home, Seguros,
Consórcios, Sobre, Contato) com um campo para cada título, texto, foto,
vídeo ou seção ligável/desligável daquela página — cerca de 40 itens ao
todo. É gerado a partir de `assets/js/content-schema.js` (a "lista do
que pode ser editado"), aplicado no site por `assets/js/content-apply.js`
e salvo como um único blob JSON (`conteudo`) na mesma linha de
configurações da Personalização — o Worker faz atualização **parcial**
de verdade (só sobrescreve os campos enviados por cada tela), então usar
Personalização e Design no mesmo projeto nunca apaga a configuração da
outra.

Cada campo de mídia aceita **upload direto** (imagens pequenas, até
~200KB — vira base64 guardado no D1) **ou colar um link**: para os 4
fundos do hero da Home e os heros de Seguros/Consórcios/Sobre, o link
pode ser uma imagem, um vídeo (`.mp4`/`.webm`) ou um embed do
YouTube/Vimeo — o site detecta sozinho e troca `background-image` por
`<video>` ou `<iframe>` automaticamente. Para os demais blocos (imagens
editoriais, linha do tempo), só foto.

Para adicionar um novo campo editável (ex.: mais um bloco de texto):
1. acrescente uma chave em `content-schema.js`;
2. marque o elemento correspondente no HTML da página pública com
   `data-cms="a.mesma.chave"` (e `data-cms-media="bg"` se for um fundo de
   foto/vídeo, ou `data-cms-tipo="toggle"` se for mostrar/esconder algo).
Não precisa mexer no Worker — o blob `conteudo` é livre.

### Selo giratório (figurinha sobre as fotos)

Um selo circular animado (texto girando ao redor de um ícone fixo,
`assets/js/site-chrome.js` → `renderSelo()`) aparece sobre as fotos de
capa da Home, Seguros, Consórcios e Sobre — o mesmo efeito de "carimbo"
usado em sites de produto, adaptado à identidade mais sóbria da Solua. O
texto de cada selo é editável em Design (ex.: `home.hero.selo`).

### Documentos internos

Em `crm/admin/documentos.html`: repositório real (D1) com categoria,
versão e "quem pode ver" (Todos / Administrador / Consultores /
Consultor de Imóveis) por documento — pensado para contratos padrão,
propostas, manuais internos, materiais de treinamento e apólices modelo.
Arquivos pequenos (até ~500KB) são guardados como base64 direto na linha
do banco; para arquivos maiores, o próximo passo natural é um bucket R2
com apenas a URL guardada no D1.

### Financeiro

Em `crm/admin/financeiro.html`: total vendido, comissão realizada e
prevista (percentual estimado por produto — ajustável no topo de
`assets/js/crm-financeiro.js`), vendas por produto, evolução dos últimos
6 meses, ranking por consultor e exportação em CSV. Calculado 100% a
partir dos negócios já fechados no CRM — não existe ainda um sistema
financeiro/contábil por trás.

## Para produção (multiusuário completo)

### 1. Migrar leads/equipe/templates/campanhas/catálogo de imóveis para D1
Mesma ideia da Personalização: trocar as funções de `crm-data.js`
(`getLeads`, `addLead`, `login`, `getImoveis`...) por `fetch()` para
novas rotas em `worker.js`, mantendo a mesma assinatura de função — as
telas não precisam mudar. Nessa migração, troque também o login de
demonstração por sessão real (cookie assinado, verificado no Worker).

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

### 4. Documentos maiores que ~500KB
Trocar o `conteudo_base64` guardado no D1 por um objeto no **R2**
(bucket de arquivos do Cloudflare), guardando só a chave/URL no D1.

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

As fotos do site (hero, imóveis, equipe, timeline) são **placeholders**
de `picsum.photos` com seed fixa por elemento (mesma foto sempre no mesmo
lugar). Antes de publicar de verdade, troque por fotos reais da Solua —
os imóveis do catálogo têm um array `fotos` em `crm-data.js`, e as demais
imagens estão espalhadas pelos arquivos HTML das páginas públicas como
`<img src="https://picsum.photos/seed/...">`.

Antes de publicar, troque também:
- o e-mail de contato no rodapé do site e em `contato.html`;
- os e-mails/telefones/fotos da equipe de demonstração em `crm-data.js`
  e `sobre.html`, pelos reais;
- o número de WhatsApp padrão (constante `WPP` em
  `assets/js/site-chrome.js`) — ou simplesmente configure o real na tela
  de Personalização, que sobrescreve isso para todo mundo sem precisar
  editar código;
- os 8 imóveis de exemplo em `IMOVEIS_SEED` (`crm-data.js`), pelo
  catálogo real.
