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
blog.html                       → catálogo completo do blog (filtro por categoria)
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
assets/js/home.js               → carrossel do hero, destaques de imóveis e blog (Home)
assets/js/blog-common.js        → cartão e leitor de artigo compartilhados (Home + blog.html)
assets/js/blog.js               → filtro por categoria + grade do catálogo completo do blog
assets/js/imoveis-catalogo.js   → filtros + grade do catálogo de imóveis
assets/js/imovel-detalhe.js     → página de detalhe de um imóvel
assets/js/seguros.js            → dados e montagem da página de Seguros
assets/js/consorcios.js         → dados e montagem da página de Consórcios
assets/js/sobre.js              → equipe pública (a partir da mesma base do CRM)
assets/js/contato.js            → formulário geral de contato
assets/js/content-schema.js     → schema de tudo que é editável em Design (texto/foto/vídeo/seção, por página)
assets/js/content-apply.js      → aplica o conteúdo salvo (data-cms="...") nas páginas públicas
assets/js/search-index.js       → índice estático da busca do site (páginas, seguros, consórcios, dúvidas, artigos)
assets/js/site-search.js        → lógica + interface da busca (combina o índice com o catálogo de imóveis ao vivo)
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
assets/js/crm-blog.js           → lógica da tela de Blog (lista + editor em blocos)
assets/js/crm-calendario.js     → lógica da página de Calendário

crm/login.html                  → tela de login do CRM
crm/dashboard.html              → visão geral (KPIs, atividade recente, mural de avisos)
crm/calendario.html             → calendário de leads com "próximo contato" marcado
crm/pipeline-imoveis.html       → funil Kanban de Imóveis
crm/pipeline-seguros.html       → funil Kanban de Seguros
crm/pipeline-consorcios.html    → funil Kanban de Consórcios
crm/contatos.html               → base unificada de leads/clientes (todos os produtos)
crm/admin/disparos.html         → Central de Disparos + Automações
crm/admin/modelos.html          → modelos/templates de e-mail e WhatsApp
crm/admin/equipe.html           → gestão de usuários do CRM
crm/admin/design.html           → textos, fotos/cor de fundo e visibilidade de seções do site
crm/admin/blog.html             → escrever, editar e publicar os artigos do blog
crm/admin/documentos.html       → repositório de documentos internos
crm/admin/financeiro.html       → vendas, comissão, ranking por consultor e contas a pagar/receber
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

### Painel de Design (CMS de conteúdo: texto, foto, vídeo e fundo de seção)

Em `crm/admin/design.html`, uma aba por página pública (Home, Seguros,
Consórcios, Sobre, Contato) mais uma aba **"Menu e Rodapé"** para o
cabeçalho e o rodapé (que são os mesmos em toda página) — cerca de
**120 campos editáveis** ao todo: todo título, parágrafo, texto de botão,
rótulo pequeno, link do menu e coluna do rodapé é editável, sem depender
de código. É gerado a partir de `assets/js/content-schema.js` (a "lista
do que pode ser editado"), aplicado no site por `assets/js/content-apply.js`
e salvo como um único blob JSON (`conteudo`) na mesma linha de
configurações da Personalização — o Worker faz atualização **parcial**
de verdade (só sobrescreve os campos enviados por cada tela), então usar
Personalização e Design no mesmo projeto nunca apaga a configuração da
outra.

Cada campo de mídia tem um cartão com **preview grande, botão "Trocar
foto/mídia" e "Remover"** — bem mais claro do que a linha apertada com
um `<input type="file">` cru de antes. Aceita **upload direto** (imagens
pequenas, até ~200KB — vira base64 guardado no D1) **ou colar um link**,
num campo próprio e discreto abaixo do botão: para os fundos de hero e
para o **fundo de qualquer seção** (ver abaixo), o link pode ser uma
imagem, um vídeo (`.mp4`/`.webm`) ou um embed do YouTube/Vimeo — o site
detecta sozinho e troca `background-image` por `<video>` ou `<iframe>`
automaticamente. Para os demais blocos (imagens editoriais, linha do
tempo), só foto. "Remover" limpa o campo (some a foto/vídeo do preview e
do site ao salvar) sem precisar apagar o link manualmente.

Para adicionar um novo campo editável (ex.: mais um bloco de texto):
1. acrescente uma chave em `content-schema.js`;
2. marque o elemento correspondente no HTML da página pública com
   `data-cms="a.mesma.chave"` (e `data-cms-media="bg"` se for um fundo de
   foto/vídeo, ou `data-cms-tipo="toggle"` se for mostrar/esconder algo).
Não precisa mexer no Worker — o blob `conteudo` é livre.

Além de texto/foto/vídeo/visibilidade, dois tipos a mais de campo:
- **`alinhamento`** — três botões (Esquerda / Centro / Direita) que
  aplicam `text-align` no bloco correspondente do site (hero, blocos
  editoriais de Seguros/Consórcios/Institucional, CTA final) **e também
  o alinhamento do botão daquele bloco**, sempre — inclusive nos heros
  (Home, Seguros, Consórcios), onde a linha de botões é um `flex` que só
  responde a `text-align` se o `justify-content` for ajustado junto (bug
  corrigido nesta rodada: escolher "Direita" ali antes não movia o
  botão). O botão "Ver catálogo completo" da Home também ganhou esse
  controle, que não existia antes.
- **`icone`** — um seletor com pré-visualização que troca o ícone SVG de
  um elemento (hoje, os três ícones das "3 frentes de negócio" na Home)
  por um de um conjunto fixo em `assets/js/icon-library.js`
  (`window.SoluaIcons`) — por segurança, só esses ícones pré-aprovados
  podem ser injetados, nunca HTML arbitrário colado por alguém.

**Fundo de qualquer seção: foto/vídeo OU cor sólida** — Home ("3
frentes", Seguros/Consórcios/Institucional editoriais, chamada final),
Seguros ("Como funciona"), Consórcios ("Administradoras parceiras") e
Sobre (Equipe, chamada final) têm um campo "Fundo da seção" com dois
modos, escolhidos por dois botões: **Foto ou vídeo** (o cartão de mídia
de sempre) ou **Cor sólida** (um seletor de cor nativo do navegador).
Com uma foto/vídeo, o site aplica o fundo por trás do conteúdo com uma
camada escura automática para o texto continuar legível (classe
`.has-cms-bg` em `assets/css/site.css`); com uma cor sólida, o site
calcula a luminância da cor escolhida e só troca o texto para branco
quando a cor é escura o bastante para precisar — uma cor clara mantém o
texto escuro normal, sem o véu escuro pensado para foto. Cartões com
fundo próprio dentro da seção (como os cards de "Porto Bank"/"Ademicon")
ficam de fora dessa troca de cor de texto, já que continuam opacos por
cima de qualquer fundo.

**Todo campo de texto (título ou parágrafo) tem um controle "A− / A+"**
ao lado do rótulo, que diminui ou aumenta o tamanho daquele texto
especificamente no site público, de 70% a 150% em passos de 10 —
sem precisar de nenhuma marcação nova no HTML: é salvo como uma chave
`"a.mesma.chave__tamanho"` dentro do próprio blob `conteudo`, e
`content-apply.js` reescala o `font-size` do elemento correspondente
(medindo o tamanho natural dele a cada vez, então continua responsivo
depois de redimensionar a janela).

A tela em si usa um layout **mestre-detalhe**: dentro de cada aba de
página, uma barra lateral lista os grupos daquela página (com contador
de campos, um ícone quando o grupo tem "fundo de seção", e um campo de
filtro para achar um grupo rápido) — só o grupo selecionado aparece no
painel à direita, em vez de empilhar todos os campos de uma vez. Trocar
de aba ou de grupo nunca descarta o que você digitou e ainda não salvou
(cada página é montada uma única vez; só a visibilidade muda). Os campos
de mostrar/esconder viraram um **switch** em vez de checkbox simples.

A aba **"Menu e Rodapé"** cobre o que é igual em toda página pública:
os 6 links do menu (e o botão do cabeçalho), e o texto/colunas/direitos
autorais do rodapé — editar ali muda em todas as páginas de uma vez
(o menu mobile reaproveita os mesmos textos de Imóveis/Seguros/Consórcios/
A Solua automaticamente).

> **O que não está no Painel de Design:** os dados de cada imóvel
> individual (preço, endereço, fotos, especificações) são catálogo/produto,
> não texto de marketing — hoje vêm do `assets/js/crm-data.js`
> (`window.SoluaDB`), sem uma tela de cadastro dedicada no CRM ainda. Um
> gerenciador de catálogo de imóveis (criar/editar/remover cada imóvel
> pelo CRM) é um próximo passo natural, mas é um recurso à parte — não
> uma extensão do Design.

### Blog (site público + CRM)

O blog deixou de ser um bloco só de texto na Home e virou uma seção de
verdade, com dados reais (não hardcoded) em `STATE.posts`
(`assets/js/crm-data.js`, `window.SoluaDB`) e uma tela própria no CRM
para escrever os artigos — sem precisar mexer em código.

**No site:**
- A Home mostra os **3 artigos mais recentes** como cartões arredondados
  (foto, categoria, tempo de leitura calculado de verdade a partir do
  texto, e um botão "Ler mais" com seta circular), seguidos de um botão
  "Ver blog completo".
- `blog.html` é o catálogo completo: filtro por categoria + todos os
  artigos publicados, no mesmo estilo de cartão. "Blog" entrou no menu
  principal, no menu mobile, no rodapé e na busca do site (os artigos
  aparecem nos resultados e abrem direto no artigo certo via
  `blog.html?post=ID`).
- O cartão e o leitor em tela cheia são peças compartilhadas
  (`assets/js/blog-common.js`), usadas tanto pela Home quanto pelo
  catálogo — não há duas versões do mesmo componente por aí.
- Cor de cada categoria é automática (`DB.corPost`): as 4 categorias
  padrão (Seguros, Consórcio, Imóveis, Planejamento) usam a mesma
  paleta categórica já validada do Dashboard/Financeiro; uma categoria
  nova digitada na hora cai numa dessas 4 cores por hash, nunca fica
  sem cor.

**No CRM** (`crm/admin/blog.html`, item "Blog" no menu): uma grade com
todos os artigos (rascunho ou publicado), e um editor em modal para
criar ou editar um artigo:
- **Categoria/tema** — campo livre com sugestões das categorias já
  usadas (não trava numa lista fixa).
- **Capa** — mesmo cartão de mídia do Painel de Design (upload direto,
  colar link, ou remover).
- **Corpo do artigo em blocos** — Subtítulo, Parágrafo, Lista e Imagem,
  com adicionar/reordenar/remover, no mesmo formato dos blocos de
  e-mail dos Modelos. Isso significa que dá pra colocar quantas fotos
  quiser dentro do próprio texto do artigo, não só a capa.
- **Rascunho ou Publicado** — um artigo em rascunho fica só no CRM; só
  aparece no site (Home e blog.html) quando publicado.
- Pré-visualização ao vivo do artigo montado, e tempo de leitura
  recalculado sozinho (não é um campo manual que alguém esquece de
  atualizar).

### Identidade visual, manutenção e SEO básico (Personalização)

Em `crm/admin/personalizacao.html`, além de logo e cor:

- **Duas versões de logo ao mesmo tempo** — uma para fundo claro (usada
  quando o cabeçalho já rolou/está sólido) e outra para fundo escuro
  (usada no rodapé, que é sempre escuro, e no cabeçalho enquanto ele
  ainda está transparente sobre uma foto). O site troca sozinho, ao
  rolar a página, qual versão mostrar (`assets/js/site-chrome.js` decide
  se o cabeçalho está `.on-photo`/`.solid`; `assets/js/branding.js`
  aplica a logo certa via `window.SoluaAplicarLogoContexto`). Se só uma
  versão for cadastrada, ela é usada nos dois contextos.
- **Favicon customizado** — ícone da aba do navegador.
- **Título e descrição do site** — usados na Home (as páginas internas
  mantêm seus próprios títulos, já otimizados por página).
- **Modo manutenção** — um botão liga/desliga um aviso que substitui
  **o site inteiro** para os visitantes (checado no próprio Worker, em
  `worker.js`, antes de servir qualquer página pública). O **CRM nunca
  fica bloqueado**: `/crm/*`, `/assets/*` e `/api/*` continuam
  funcionando normalmente mesmo com o site em manutenção, então dá
  sempre pra entrar e desligar de novo.

### Página de erro 404

`404.html`, na raiz do projeto — usa o mesmo cabeçalho/rodapé/busca do
site público (não é uma página solta). O Cloudflare já está configurado
para servir ela sozinho (`not_found_handling: "404-page"` em
`wrangler.jsonc`) em qualquer URL que não exista.

### Cartões flutuantes ("pop-ups" que aparecem e ficam parados)

`assets/js/site-chrome.js` → `renderGapCard({icone, titulo, texto,
align})` gera um cartãozinho branco (ícone + título curto + texto) e o
posiciona num "vão" — um `<div>` vazio colocado entre duas `<section>`
no HTML (ex.: `<div id="gapCard1"></div>` entre a seção de imóveis em
destaque e a de Seguros), nunca por cima de uma foto ou texto. Ele
aparece com uma animação de "pop" (escala + opacidade, via
`IntersectionObserver`, mesma lista `.float-card` observada em
`observeReveals()`) quando o vão entra na tela, e depois **fica
parado** — sem nenhuma animação contínua. `align` controla o lado
(`left`, `center` ou `right`); no mobile o cartão sempre vira largura
cheia. Hoje aparece duas vezes na Home e uma no catálogo de imóveis;
para adicionar em outro lugar, marque um `<div id="meuGap"></div>`
entre duas seções no HTML e, no JS da página, faça
`document.getElementById("meuGap").innerHTML =
window.SoluaChrome.renderGapCard({...})`.

### Busca do site

Um botão de lupa no cabeçalho (funciona igual em desktop e mobile, ou
`Ctrl/Cmd+K`) abre uma busca em tela cheia que filtra **o site inteiro**:
páginas, linhas de seguro, linhas de consórcio, dúvidas frequentes,
artigos do blog (clicar num artigo abre o leitor direto, via
`index.html?post=N#blog`) e o catálogo de imóveis em tempo real (via
`SoluaDB.getImoveis()`). O índice estático fica em
`assets/js/search-index.js` — como o site é multi-página (não é uma
SPA), mantenha os títulos/textos de lá em sincronia manualmente quando
editar o conteúdo real das páginas (o catálogo de imóveis não precisa
disso, já é lido ao vivo). A lógica de busca e a interface ficam em
`assets/js/site-search.js`.

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

**Contas a pagar e a receber** (mesma tela): lançamentos manuais com
tipo (entrada/saída), descrição, valor, categoria livre, vencimento e
status (pendente/pago), com um resumo no topo — quanto vence hoje,
quanto está atrasado, total a pagar e a receber em aberto — sempre
calculado ao vivo a partir dos lançamentos reais. Cada lançamento aceita
um **anexo opcional** (comprovante, boleto, nota fiscal — até ~300KB,
guardado como os outros uploads do projeto). **O que isso não faz:**
preencher o valor/vencimento sozinho a partir do arquivo anexado. Isso
exigiria um serviço real de leitura de documentos (OCR ou um modelo com
visão, como a API da Claude) processando o anexo no servidor — não é
algo que dá pra simular sem inventar dados, e este projeto não tem hoje
esse serviço conectado. Se quiser essa extração automática de verdade,
é um passo natural a seguir (precisa de uma chave de API e de um
endpoint no Worker para processar o upload).

### Hierarquia visual do CRM (Dashboard, Financeiro, Disparos)

O Dashboard (`crm/dashboard.html`) ganhou uma saudação no topo, um
cartão de destaque com cor sólida (a métrica mais importante da tela) e
um ícone por indicador — mesmo padrão aplicado em Financeiro e Disparos
(classes `.kpi.accent` e `.kpi-ico` em `assets/css/crm.css`). O gráfico
de barras "Imóveis × Seguros × Consórcios" (e o equivalente em
Financeiro, "Vendas por produto") usa um componente novo (`.barchart`
/`.bc-row`) com rótulo direto, valor e participação percentual em cada
linha. As cores categóricas (Imóveis/Seguros/Consórcios) foram checadas
com o validador de paleta da skill de dataviz do Claude Code
(`validate_palette.js`) — a combinação antiga (roxo `--roxo` + azul da
marca) não passava no teste de daltonismo por ficarem próximas demais;
o gráfico usa `--roxo-vivo` (só ali, não nos badges) para resolver isso.
A atividade recente do Dashboard agora mostra o avatar de verdade do
consultor responsável pelo lead relacionado a cada evento (sem inventar
autor quando não há um consultor associado).

O Dashboard também ganhou um **gráfico de linha** ("Novos leads —
últimos 14 dias", em SVG, dados reais a partir da data de criação de
cada lead) e uma **agenda real** ("Próximos contatos"): qualquer lead
pode receber uma data de "Próximo contato" (novo campo no drawer do
lead), e o Dashboard lista os mais próximos, com destaque para os
atrasados e os que vencem hoje — clicar num item abre o lead direto.

**A barra lateral do CRM virou branca** (era escura) — mesma estrutura
e ícones, cores adaptadas para fundo claro, item ativo em azul sólido.
No quadro Kanban (`crm/pipeline-*.html`), o **arrastar-e-soltar entre
colunas já existia** (não era um bug faltando) — só não tinha nenhuma
pista visual; agora cada card mostra um ícone de "alça" ao passar o
mouse e a barra de filtros lembra que dá pra arrastar ou clicar no card
para mudar a etapa manualmente.

### Mural de avisos (Dashboard)

No topo do Dashboard (`crm/dashboard.html`) tem um mural compartilhado,
visível pra toda a equipe: qualquer pessoa loga e escreve um aviso ou
anotação (reunião, lembrete, recado geral), com opção de "fixar no
topo". Cada aviso mostra o avatar e nome de quem escreveu e há quanto
tempo, e pode ser apagado por quem escreveu ou por um Administrador.
Guardado em `STATE.avisos` (mesma camada de `localStorage` do resto do
CRM, funções `getAvisos/addAviso/updateAviso/deleteAviso` em
`assets/js/crm-data.js`) — como é local ao navegador, "visível pra toda
a equipe" hoje significa "visível pra quem usa o mesmo navegador/perfil
de demonstração"; num ambiente multiusuário de verdade (ver seção
"Para produção" abaixo, item 1), os avisos migram para D1 junto com o
resto e passam a aparecer de fato pra todo mundo, em qualquer
dispositivo.

### Calendário e Google Agenda

Nova página `crm/calendario.html` (item "Calendário" no menu lateral):
um calendário de mês normal, com o dia de hoje destacado, navegação por
mês anterior/próximo e um atalho "Hoje". Cada dia mostra um "chip" com
o nome dos leads que têm aquela data marcada como **"Próximo contato"**
(o mesmo campo usado na agenda do Dashboard, editável no drawer de
qualquer lead) — clicar num dia abre um painel de detalhe com os
contatos daquele dia, e clicar num contato abre o lead direto.

**Sobre "conectar com o Google"**: o calendário acima é 100% real,
construído em cima dos dados que já existem no CRM — não é uma
maquete. Uma sincronização de verdade com o Google Agenda (importar
eventos do Google, ou exportar os "Próximos contatos" pra lá) exigiria
configurar credenciais OAuth reais do Google Cloud (client ID/secret,
tela de consentimento, escopo `calendar`) e um fluxo de autorização por
usuário — isso depende de credenciais que só o dono do projeto pode
criar (não é algo que dá pra simular sem inventar uma integração que
não funciona de verdade). Não foi implementado por esse motivo; é um
passo natural a seguir se quiser essa integração de verdade.

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
