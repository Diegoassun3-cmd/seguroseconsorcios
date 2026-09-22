/* ===========================================================
   Solua — schema do conteúdo editável do site público.
   Usado em dois lugares:
   1) crm/admin/design.html (crm-design.js) monta o formulário do
      editor a partir daqui — uma aba por página, um campo por item.
   2) assets/js/content-apply.js lê o mesmo conjunto de chaves para
      aplicar os valores salvos (vindos de /api/settings) no HTML.

   Tipos de campo:
     "texto"       → uma linha (título, rótulo curto, texto de botão)
     "textarea"    → parágrafo
     "midia"       → foto OU vídeo (upload de imagem pequena, ou link —
                     de imagem, vídeo .mp4/.webm ou embed do YouTube/Vimeo)
     "imagem"      → só foto (upload ou link)
     "toggle"      → mostrar/esconder uma seção ou bloco inteiro
     "alinhamento" → esquerda / centro / direita para o bloco de texto
     "icone"       → escolher entre os ícones de assets/js/icon-library.js

   Campo com tipo "midia" e label começando com "Fundo" é o PLANO DE
   FUNDO de uma seção inteira (não uma foto de coluna) — se deixado
   vazio, a seção mantém a cor sólida original; se preenchido, o site
   aplica a foto/vídeo por trás do conteúdo com uma camada escura para
   manter o texto legível (ver .has-cms-bg em site.css).

   A chave (key) é o valor gravado em data-cms="..." nas páginas
   públicas — mudar uma chave aqui exige mudar o HTML correspondente.
   A aba "Menu e Rodapé" é a única que não é uma página específica:
   os campos dela são aplicados pelo site-chrome.js (cabeçalho/rodapé
   são os mesmos em toda página pública).
   =========================================================== */
(function(global){
"use strict";

const SCHEMA = [
  { id:"home", label:"Home", grupos:[
    { titulo:"Hero (topo)", campos:[
      {key:"home.hero.titulo", label:"Título principal", tipo:"texto", placeholder:"25 anos ao seu lado."},
      {key:"home.hero.subtitulo", label:"Subtítulo", tipo:"textarea", placeholder:"Imóveis, seguros e consórcios para cada etapa da sua vida…"},
      {key:"home.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.hero.botao1", label:"Botão 1 — texto", tipo:"texto", placeholder:"Ver imóveis"},
      {key:"home.hero.botao2", label:"Botão 2 — texto", tipo:"texto", placeholder:"Fale com um consultor"},
      {key:"home.hero.midia1", label:"Foto ou vídeo de fundo 1", tipo:"midia"},
      {key:"home.hero.midia2", label:"Foto ou vídeo de fundo 2", tipo:"midia"},
      {key:"home.hero.midia3", label:"Foto ou vídeo de fundo 3", tipo:"midia"},
      {key:"home.hero.midia4", label:"Foto ou vídeo de fundo 4", tipo:"midia"}
    ]},
    { titulo:"As 3 frentes de negócio", campos:[
      {key:"home.bizlines.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.bizlines.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"home.bizline.imoveis.icone", label:"Imóveis — ícone", tipo:"icone"},
      {key:"home.bizline.imoveis.titulo", label:"Imóveis — título", tipo:"texto"},
      {key:"home.bizline.imoveis.texto", label:"Imóveis — texto", tipo:"textarea"},
      {key:"home.bizline.imoveis.link", label:"Imóveis — texto do link", tipo:"texto", placeholder:"Ver catálogo"},
      {key:"home.bizline.seguros.icone", label:"Seguros — ícone", tipo:"icone"},
      {key:"home.bizline.seguros.titulo", label:"Seguros — título", tipo:"texto"},
      {key:"home.bizline.seguros.texto", label:"Seguros — texto", tipo:"textarea"},
      {key:"home.bizline.seguros.link", label:"Seguros — texto do link", tipo:"texto", placeholder:"Simular agora"},
      {key:"home.bizline.consorcios.icone", label:"Consórcios — ícone", tipo:"icone"},
      {key:"home.bizline.consorcios.titulo", label:"Consórcios — título", tipo:"texto"},
      {key:"home.bizline.consorcios.texto", label:"Consórcios — texto", tipo:"textarea"},
      {key:"home.bizline.consorcios.link", label:"Consórcios — texto do link", tipo:"texto", placeholder:"Simular parcela"}
    ]},
    { titulo:"Seção Imóveis em destaque", campos:[
      {key:"home.imoveis.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"},
      {key:"home.imoveis.titulo", label:"Título", tipo:"texto", placeholder:"Selecionados para você."},
      {key:"home.imoveis.texto", label:"Texto", tipo:"textarea", placeholder:"Uma amostra do catálogo…"},
      {key:"home.imoveis.botao", label:"Botão — texto", tipo:"texto", placeholder:"Ver catálogo completo"}
    ]},
    { titulo:"Bloco editorial — Seguros", campos:[
      {key:"home.seguros.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.seguros.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.seguros.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"home.seguros.midia", label:"Foto", tipo:"imagem"},
      {key:"home.seguros.titulo", label:"Título", tipo:"texto"},
      {key:"home.seguros.texto", label:"Texto", tipo:"textarea"},
      {key:"home.seguros.botao", label:"Botão — texto", tipo:"texto", placeholder:"Conhecer os seguros"}
    ]},
    { titulo:"Bloco editorial — Consórcios", campos:[
      {key:"home.consorcios.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.consorcios.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.consorcios.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"home.consorcios.midia", label:"Foto", tipo:"imagem"},
      {key:"home.consorcios.titulo", label:"Título", tipo:"texto"},
      {key:"home.consorcios.texto", label:"Texto", tipo:"textarea"},
      {key:"home.consorcios.botao", label:"Botão — texto", tipo:"texto", placeholder:"Simular consórcio"}
    ]},
    { titulo:"Bloco institucional (teaser)", campos:[
      {key:"home.institucional.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.institucional.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.institucional.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"home.institucional.midia", label:"Foto", tipo:"imagem"},
      {key:"home.institucional.titulo", label:"Título", tipo:"texto"},
      {key:"home.institucional.texto", label:"Texto", tipo:"textarea"},
      {key:"home.institucional.botao", label:"Botão — texto", tipo:"texto", placeholder:"Conhecer nossa história"}
    ]},
    { titulo:"Seção de Conteúdo (blog)", campos:[
      {key:"home.blog.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"}
    ]},
    { titulo:"Chamada final", campos:[
      {key:"home.ctafinal.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"},
      {key:"home.ctafinal.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.ctafinal.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"home.ctafinal.titulo", label:"Título", tipo:"texto"},
      {key:"home.ctafinal.texto", label:"Texto", tipo:"textarea"},
      {key:"home.ctafinal.botao", label:"Botão — texto", tipo:"texto", placeholder:"Fale com um consultor"}
    ]}
  ]},
  { id:"seguros", label:"Seguros", grupos:[
    { titulo:"Hero", campos:[
      {key:"seguros.hero.titulo", label:"Título", tipo:"texto"},
      {key:"seguros.hero.subtitulo", label:"Subtítulo", tipo:"textarea"},
      {key:"seguros.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"seguros.hero.botao", label:"Botão — texto", tipo:"texto", placeholder:"Simular meu seguro"},
      {key:"seguros.hero.midia", label:"Foto ou vídeo de fundo", tipo:"midia"}
    ]},
    { titulo:"Bloco \"Como funciona\"", campos:[
      {key:"seguros.processo.visivel", label:"Mostrar este bloco", tipo:"toggle"},
      {key:"seguros.processo.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"seguros.processo.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"seguros.processo.midia", label:"Foto", tipo:"imagem"},
      {key:"seguros.processo.titulo", label:"Título", tipo:"texto"},
      {key:"seguros.processo.texto", label:"Texto", tipo:"textarea"}
    ]}
  ]},
  { id:"consorcios", label:"Consórcios", grupos:[
    { titulo:"Hero", campos:[
      {key:"consorcios.hero.titulo", label:"Título", tipo:"texto"},
      {key:"consorcios.hero.subtitulo", label:"Subtítulo", tipo:"textarea"},
      {key:"consorcios.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"consorcios.hero.botao", label:"Botão — texto", tipo:"texto", placeholder:"Simular minha parcela"},
      {key:"consorcios.hero.midia", label:"Foto ou vídeo de fundo", tipo:"midia"}
    ]},
    { titulo:"Administradoras parceiras", campos:[
      {key:"consorcios.administradoras.visivel", label:"Mostrar este bloco", tipo:"toggle"},
      {key:"consorcios.administradoras.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"consorcios.administradoras.titulo", label:"Título", tipo:"texto", placeholder:"Quem administra o seu grupo."},
      {key:"consorcios.administradoras.porto.titulo", label:"Porto Bank — título", tipo:"texto"},
      {key:"consorcios.administradoras.porto.texto", label:"Porto Bank — texto", tipo:"textarea"},
      {key:"consorcios.administradoras.ademicon.titulo", label:"Ademicon — título", tipo:"texto"},
      {key:"consorcios.administradoras.ademicon.texto", label:"Ademicon — texto", tipo:"textarea"}
    ]},
    { titulo:"Banner de campanha", campos:[
      {key:"consorcios.banner.texto", label:"Texto do banner (vazio = não mostrar)", tipo:"texto", placeholder:"Ex.: Condições especiais de parcela até o fim do mês."}
    ]}
  ]},
  { id:"sobre", label:"Sobre", grupos:[
    { titulo:"Hero", campos:[
      {key:"sobre.hero.titulo", label:"Título", tipo:"texto"},
      {key:"sobre.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"sobre.hero.midia", label:"Foto ou vídeo de fundo", tipo:"midia"}
    ]},
    { titulo:"Linha do tempo", campos:[
      {key:"sobre.timeline.visivel", label:"Mostrar a linha do tempo", tipo:"toggle"}
    ]},
    { titulo:"Linha do tempo — 2001", campos:[
      {key:"sobre.timeline.2001.texto", label:"Texto", tipo:"textarea"},
      {key:"sobre.timeline.2001.midia", label:"Foto", tipo:"imagem"}
    ]},
    { titulo:"Linha do tempo — 2010", campos:[
      {key:"sobre.timeline.2010.texto", label:"Texto", tipo:"textarea"},
      {key:"sobre.timeline.2010.midia", label:"Foto", tipo:"imagem"}
    ]},
    { titulo:"Linha do tempo — Hoje", campos:[
      {key:"sobre.timeline.hoje.texto", label:"Texto", tipo:"textarea"},
      {key:"sobre.timeline.hoje.midia", label:"Foto", tipo:"imagem"}
    ]},
    { titulo:"Linha do tempo — 25 anos", campos:[
      {key:"sobre.timeline.25anos.texto", label:"Texto", tipo:"textarea"},
      {key:"sobre.timeline.25anos.midia", label:"Foto", tipo:"imagem"}
    ]},
    { titulo:"Equipe", campos:[
      {key:"sobre.equipe.visivel", label:"Mostrar a seção de equipe", tipo:"toggle"},
      {key:"sobre.equipe.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"sobre.equipe.titulo", label:"Título", tipo:"texto", placeholder:"Quem cuida do seu atendimento."},
      {key:"sobre.equipe.texto", label:"Texto", tipo:"textarea", placeholder:"Um consultor dedicado por área…"}
    ]},
    { titulo:"Chamada final", campos:[
      {key:"sobre.ctafinal.visivel", label:"Mostrar esta seção", tipo:"toggle"},
      {key:"sobre.ctafinal.fundo", label:"Fundo da seção", tipo:"midia"},
      {key:"sobre.ctafinal.titulo", label:"Título", tipo:"texto", placeholder:"Vamos cuidar do seu próximo passo."},
      {key:"sobre.ctafinal.botao", label:"Botão — texto", tipo:"texto", placeholder:"Fale com um consultor"}
    ]}
  ]},
  { id:"contato", label:"Contato", grupos:[
    { titulo:"Hero", campos:[
      {key:"contato.hero.titulo", label:"Título", tipo:"texto", placeholder:"Vamos conversar."}
    ]},
    { titulo:"Informações de contato", campos:[
      {key:"contato.info.endereco", label:"Endereço", tipo:"texto"},
      {key:"contato.info.horario", label:"Horário de atendimento", tipo:"texto"}
    ]},
    { titulo:"Formulário", campos:[
      {key:"contato.form.botao", label:"Botão de envio — texto", tipo:"texto", placeholder:"Enviar mensagem"}
    ]}
  ]},
  { id:"global", label:"Menu e Rodapé", grupos:[
    { titulo:"Menu de navegação", campos:[
      {key:"nav.inicio", label:"Início", tipo:"texto"},
      {key:"nav.imoveis", label:"Imóveis", tipo:"texto"},
      {key:"nav.seguros", label:"Seguros", tipo:"texto"},
      {key:"nav.consorcios", label:"Consórcios", tipo:"texto"},
      {key:"nav.sobre", label:"A Solua", tipo:"texto"},
      {key:"nav.contato", label:"Contato", tipo:"texto"},
      {key:"nav.cta", label:"Botão do cabeçalho — texto", tipo:"texto", placeholder:"Fale com um consultor"}
    ]},
    { titulo:"Rodapé", campos:[
      {key:"footer.descricao", label:"Texto abaixo da marca", tipo:"textarea"},
      {key:"footer.col.produtos", label:"Coluna 1 — título", tipo:"texto", placeholder:"Produtos"},
      {key:"footer.col.institucional", label:"Coluna 2 — título", tipo:"texto", placeholder:"Institucional"},
      {key:"footer.col.contato", label:"Coluna 3 — título", tipo:"texto", placeholder:"Contato"},
      {key:"footer.copyright", label:"Linha de rodapé (depois do © e do ano)", tipo:"texto", placeholder:"Solua Corretora e Imobiliária — CRECI e SUSEP conforme legislação vigente."}
    ]}
  ]}
];

global.SoluaContentSchema = SCHEMA;
})(window);
