/* Solua — página de Contato: canais (WhatsApp, telefone, e-mail, rota)
   vindos da Personalização/Design e formulário que grava o lead no CRM. */
(function(){
"use strict";
const DB = window.SoluaDB;
const $ = id => document.getElementById(id);

// ------------------------------------------------------------- canais
function formatarFone(d){
  d = String(d||"").replace(/\D/g,"").replace(/^55(?=\d{10,11}$)/,"");
  if(d.length===11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return "";
}
function atualizarCanais(){
  const s = window.SoluaBranding || {};
  const wpp = $("ctWpp");
  wpp.href = window.SoluaSite.wppLink("Olá! Vim pelo site e gostaria de falar com um consultor.");
  const num = formatarFone(s.whatsappNumero);
  wpp.textContent = num || "Falar no WhatsApp";
  if(s.emailRemetente){ $("ciEmail").textContent = s.emailRemetente; $("ctEmailLink").href = "mailto:" + s.emailRemetente; }
  const tel = ($("ctTelTxt").textContent || "").trim();
  $("ctTelItem").hidden = !tel;
  if(tel) $("ctTel").href = "tel:+55" + tel.replace(/\D/g,"").replace(/^55/,"");
  const end = ($("enderecoContato").textContent || "").trim();
  if(end) $("ctRota").href = "https://maps.google.com/?q=" + encodeURIComponent(end);
}
atualizarCanais();
document.addEventListener("solua:branding", atualizarCanais);
setTimeout(atualizarCanais, 300); // cobre o caso de /api/settings já ter respondido antes deste script

// ---------------------------------------------------------- formulário
const form = $("ctForm"), btn = $("ctSend");
const REGRAS = {
  ctNome:   v=> v.trim().length>=2 || "Informe seu nome.",
  ctEmail:  v=> /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim()) || "Informe um e-mail válido.",
  ctFone:   v=> v.replace(/\D/g,"").length>=10 || "Informe um telefone com DDD.",
  ctAssunto:v=> !!v || "Escolha o assunto.",
  ctMsg:    v=> v.trim().length>=3 || "Escreva sua mensagem.",
  ctComo:   v=> !!v || "Conte como conheceu a Solua."
};
function valido(id){ return REGRAS[id]($(id).value)===true; }
function tudoOk(){ return Object.keys(REGRAS).every(valido) && $("ctLgpd").checked; }
function mostrarErro(id){
  const r = REGRAS[id]($(id).value);
  const campo = $(id).closest(".ct-campo");
  campo.classList.toggle("erro", r!==true);
  $(id+"Erro").textContent = r===true ? "" : r;
  $(id).setAttribute("aria-invalid", r===true ? "false" : "true");
  if(r!==true) $(id).setAttribute("aria-describedby", id+"Erro"); else $(id).removeAttribute("aria-describedby");
  return r===true;
}
function atualizarBotao(){ btn.disabled = !tudoOk(); }

$("ctFone").addEventListener("input", e=>{
  const v = e.target.value.replace(/\D/g,"").slice(0,11);
  e.target.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v;
});
Object.keys(REGRAS).forEach(id=>{
  const el = $(id);
  el.addEventListener("input", ()=>{ if(el.closest(".ct-campo").classList.contains("erro")) mostrarErro(id); atualizarBotao(); });
  el.addEventListener("change", ()=>{ atualizarBotao(); });
  el.addEventListener("blur", ()=>{ if(el.value) mostrarErro(id); });
});
$("ctLgpd").addEventListener("change", ()=>{ $("ctLgpdErro").textContent = ""; atualizarBotao(); });

// textarea cresce com o texto, sem barra de rolagem
$("ctMsg").addEventListener("input", e=>{ e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; });

const PRODUTO = {imovel_comprar:"imovel", imovel_alugar:"imovel", imovel_anunciar:"imovel", seguro:"seguro", consorcio:"consorcio"};
const ASSUNTO_TXT = {imovel_comprar:"Quer comprar um imóvel", imovel_alugar:"Quer alugar um imóvel", imovel_anunciar:"Quer anunciar o imóvel", seguro:"Seguros", consorcio:"Consórcios", outro:"Outro assunto"};

form.addEventListener("submit", e=>{
  e.preventDefault();
  const erros = Object.keys(REGRAS).filter(id=> !mostrarErro(id));
  if(!$("ctLgpd").checked){ $("ctLgpdErro").textContent = "Marque a autorização para podermos responder."; }
  if(erros.length || !$("ctLgpd").checked){ if(erros.length) $(erros[0]).focus(); return; }
  if($("ctEmpresa").value) return;   // campo invisível preenchido = robô

  const nome = $("ctNome").value.trim(), email = $("ctEmail").value.trim(), fone = $("ctFone").value.trim();
  const assunto = $("ctAssunto").value, msg = $("ctMsg").value.trim(), como = $("ctComo").value;
  btn.disabled = true; btn.textContent = "Enviando…";
  DB.addLead({
    nome, email, telefone: fone, produto: PRODUTO[assunto] || "seguro",
    tipo: assunto==="outro" ? "Outro" : "", origem:"Site", estagio:"novo", comoConheceu: como,
    notas:[{id:DB.uid("nota"), data:new Date().toISOString(), autor:"Sistema",
      texto:`Contato pelo site — ${ASSUNTO_TXT[assunto]}. Como conheceu: ${como}. Mensagem: ${msg}`}]
  });
  $("ctWppLink").href = window.SoluaSite.wppLink(`Olá! Sou ${nome} e enviei uma mensagem pelo site (${ASSUNTO_TXT[assunto]}).`);
  form.hidden = true;
  $("ctDone").hidden = false;
  $("ctDone").setAttribute("tabindex","-1"); $("ctDone").focus();
});

atualizarBotao();
window.SoluaChrome.observeReveals();
})();
