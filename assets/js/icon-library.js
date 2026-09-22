/* ===========================================================
   Solua — biblioteca de ícones para o seletor de ícones do
   Painel de Design (crm-design.js) e para aplicá-los no site
   público (content-apply.js). Cada entrada é o CONTEÚDO interno
   de um <svg viewBox="0 0 28 28" fill="none" stroke="currentColor"
   stroke-width="1.5">...</svg> já existente na página — o ícone
   escolhido substitui só o miolo, mantendo cor/tamanho do lugar
   onde está.
   =========================================================== */
(function(global){
"use strict";

const ICONS = {
  home:     { label:"Casa",        svg:'<path d="M4 12l10-8 10 8M6 11v12h16V11" stroke-linejoin="round"/><path d="M11 23v-7h6v7" stroke-linejoin="round"/>' },
  building: { label:"Prédio",      svg:'<rect x="6" y="4" width="16" height="20" rx="1"/><path d="M10 9h2M16 9h2M10 14h2M16 14h2M10 19h2M16 19h2"/>' },
  shield:   { label:"Escudo",      svg:'<path d="M14 3l10 4.4v6.6c0 7-4.4 12-10 14-5.6-2-10-7-10-14V7.4L14 3z" stroke-linejoin="round"/>' },
  refresh:  { label:"Ciclo",       svg:'<circle cx="14" cy="14" r="10"/><path d="M14 8v6l4.5 2.6"/>' },
  star:     { label:"Estrela",     svg:'<path d="M14 3l3.2 6.9 7.4.9-5.5 5.2 1.5 7.4L14 19.8 7.4 23.4l1.5-7.4-5.5-5.2 7.4-.9L14 3z" stroke-linejoin="round"/>' },
  check:    { label:"Confirmação", svg:'<circle cx="14" cy="14" r="10.5"/><path d="M9.5 14.3l3 3 6-6.6" stroke-linecap="round" stroke-linejoin="round"/>' },
  heart:    { label:"Coração",     svg:'<path d="M14 23.5s-9.5-5.8-9.5-12.6A5.4 5.4 0 0114 7.3a5.4 5.4 0 019.5 3.6c0 6.8-9.5 12.6-9.5 12.6z" stroke-linejoin="round"/>' },
  phone:    { label:"Telefone",    svg:'<path d="M8 4h4l1.5 4-2 2a12 12 0 006 6l2-2 4 1.5v4a2 2 0 01-2 2C11.5 21.5 6.5 16.5 6.5 6.5A2 2 0 018 4z" stroke-linejoin="round"/>' },
  key:      { label:"Chave",       svg:'<circle cx="9" cy="9" r="4.5"/><path d="M12.2 11.8L23 22.5m-4-1.5l2.5 2.5m-6-6l2 2" stroke-linecap="round"/>' },
  document: { label:"Documento",   svg:'<path d="M8 3h9l5 5v17a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z" stroke-linejoin="round"/><path d="M17 3v5h5M10 15h8M10 19h8"/>' }
};

global.SoluaIcons = ICONS;
})(window);
