/* ===========================================================
   Solua — schema do conteúdo editável do site público.
   Usado em dois lugares:
   1) crm/admin/design.html (crm-design.js) monta o formulário do
      editor a partir daqui — uma aba por página, um campo por item.
   2) assets/js/content-apply.js lê o mesmo conjunto de chaves para
      aplicar os valores salvos (vindos de /api/settings) no HTML.

   Tipos de campo:
     "texto"       → uma linha (título, rótulo curto)
     "textarea"    → parágrafo
     "midia"       → foto OU vídeo (upload de imagem pequena, ou link —
                     de imagem, vídeo .mp4/.webm ou embed do YouTube/Vimeo)
     "imagem"      → só foto (upload ou link)
     "toggle"      → mostrar/esconder uma seção ou bloco inteiro
     "alinhamento" → esquerda / centro / direita para o bloco de texto
     "icone"       → escolher entre os ícones de assets/js/icon-library.js

   A chave (key) é o valor gravado em data-cms="..." nas páginas
   públicas — mudar uma chave aqui exige mudar o HTML correspondente.
   =========================================================== */
(function(global){
"use strict";

const SCHEMA = [
  { id:"home", label:"Home", grupos:[
    { titulo:"Hero (topo)", campos:[
      {key:"home.hero.titulo", label:"Título principal", tipo:"texto", placeholder:"25 anos ao seu lado."},
      {key:"home.hero.subtitulo", label:"Subtítulo", tipo:"textarea", placeholder:"Imóveis, seguros e consórcios para cada etapa da sua vida…"},
      {key:"home.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.hero.midia1", label:"Foto ou vídeo de fundo 1", tipo:"midia"},
      {key:"home.hero.midia2", label:"Foto ou vídeo de fundo 2", tipo:"midia"},
      {key:"home.hero.midia3", label:"Foto ou vídeo de fundo 3", tipo:"midia"},
      {key:"home.hero.midia4", label:"Foto ou vídeo de fundo 4", tipo:"midia"}
    ]},
    { titulo:"As 3 frentes de negócio", campos:[
      {key:"home.bizlines.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.bizline.imoveis.icone", label:"Imóveis — ícone", tipo:"icone"},
      {key:"home.bizline.imoveis.titulo", label:"Imóveis — título", tipo:"texto"},
      {key:"home.bizline.imoveis.texto", label:"Imóveis — texto", tipo:"textarea"},
      {key:"home.bizline.seguros.icone", label:"Seguros — ícone", tipo:"icone"},
      {key:"home.bizline.seguros.titulo", label:"Seguros — título", tipo:"texto"},
      {key:"home.bizline.seguros.texto", label:"Seguros — texto", tipo:"textarea"},
      {key:"home.bizline.consorcios.icone", label:"Consórcios — ícone", tipo:"icone"},
      {key:"home.bizline.consorcios.titulo", label:"Consórcios — título", tipo:"texto"},
      {key:"home.bizline.consorcios.texto", label:"Consórcios — texto", tipo:"textarea"}
    ]},
    { titulo:"Seção Imóveis em destaque", campos:[
      {key:"home.imoveis.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"}
    ]},
    { titulo:"Bloco editorial — Seguros", campos:[
      {key:"home.seguros.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.seguros.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.seguros.midia", label:"Foto", tipo:"imagem"},
      {key:"home.seguros.titulo", label:"Título", tipo:"texto"},
      {key:"home.seguros.texto", label:"Texto", tipo:"textarea"}
    ]},
    { titulo:"Bloco editorial — Consórcios", campos:[
      {key:"home.consorcios.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.consorcios.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.consorcios.midia", label:"Foto", tipo:"imagem"},
      {key:"home.consorcios.titulo", label:"Título", tipo:"texto"},
      {key:"home.consorcios.texto", label:"Texto", tipo:"textarea"}
    ]},
    { titulo:"Bloco institucional (teaser)", campos:[
      {key:"home.institucional.visivel", label:"Mostrar este bloco na Home", tipo:"toggle"},
      {key:"home.institucional.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.institucional.midia", label:"Foto", tipo:"imagem"},
      {key:"home.institucional.titulo", label:"Título", tipo:"texto"},
      {key:"home.institucional.texto", label:"Texto", tipo:"textarea"}
    ]},
    { titulo:"Seção de Conteúdo (blog)", campos:[
      {key:"home.blog.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"}
    ]},
    { titulo:"Chamada final", campos:[
      {key:"home.ctafinal.visivel", label:"Mostrar esta seção na Home", tipo:"toggle"},
      {key:"home.ctafinal.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"home.ctafinal.titulo", label:"Título", tipo:"texto"},
      {key:"home.ctafinal.texto", label:"Texto", tipo:"textarea"}
    ]}
  ]},
  { id:"seguros", label:"Seguros", grupos:[
    { titulo:"Hero", campos:[
      {key:"seguros.hero.titulo", label:"Título", tipo:"texto"},
      {key:"seguros.hero.subtitulo", label:"Subtítulo", tipo:"textarea"},
      {key:"seguros.hero.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
      {key:"seguros.hero.midia", label:"Foto ou vídeo de fundo", tipo:"midia"}
    ]},
    { titulo:"Bloco \"Como funciona\"", campos:[
      {key:"seguros.processo.visivel", label:"Mostrar este bloco", tipo:"toggle"},
      {key:"seguros.processo.alinhamento", label:"Alinhamento do texto", tipo:"alinhamento"},
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
      {key:"consorcios.hero.midia", label:"Foto ou vídeo de fundo", tipo:"midia"}
    ]},
    { titulo:"Administradoras parceiras", campos:[
      {key:"consorcios.administradoras.visivel", label:"Mostrar este bloco", tipo:"toggle"}
    ]},
    { titulo:"Banner de campanha", campos:[
      {key:"consorcios.banner.texto", label:"Texto do banner (vazio = não mostrar)", tipo:"texto", placeholder:"Ex.: Condições especiais de parcela até o fim do mês."}
    ]}
  ]},
  { id:"sobre", label:"Sobre", grupos:[
    { titulo:"Hero", campos:[
      {key:"sobre.hero.titulo", label:"Título", tipo:"texto"},
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
      {key:"sobre.equipe.visivel", label:"Mostrar a seção de equipe", tipo:"toggle"}
    ]}
  ]},
  { id:"contato", label:"Contato", grupos:[
    { titulo:"Informações de contato", campos:[
      {key:"contato.info.endereco", label:"Endereço", tipo:"texto"},
      {key:"contato.info.horario", label:"Horário de atendimento", tipo:"texto"}
    ]}
  ]}
];

global.SoluaContentSchema = SCHEMA;
})(window);
