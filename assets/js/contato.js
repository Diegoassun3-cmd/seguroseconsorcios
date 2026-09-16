/* Solua — formulário geral de contato: grava lead no CRM (mesma
   base usada pelo simulador e pelo catálogo de imóveis). */
(function(){
"use strict";
const DB = window.SoluaDB;

document.addEventListener("solua:branding", e=>{
  if(e.detail && e.detail.emailRemetente) document.getElementById("ciEmail").textContent = e.detail.emailRemetente;
});

const wppEl = document.getElementById("wppContato");
function refreshWpp(){ if(wppEl) wppEl.href = window.SoluaSite.wppLink("Olá! Vim pelo site e gostaria de falar com um consultor."); }
refreshWpp();
document.addEventListener("solua:branding", refreshWpp);
setTimeout(refreshWpp, 300); // cobre o caso de /api/settings já ter respondido antes deste script rodar

document.getElementById("ctFone").oninput = e=>{ let v=e.target.value.replace(/\D/g,"").slice(0,11);
  e.target.value = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3") : v.length>6 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3") : v.length>2 ? v.replace(/(\d{2})(\d*)/,"($1) $2") : v; };

document.getElementById("ctSend").onclick = ()=>{
  const nome = document.getElementById("ctNome").value.trim();
  const fone = document.getElementById("ctFone").value.trim();
  const email = document.getElementById("ctEmail").value.trim();
  const assunto = document.getElementById("ctAssunto").value;
  const msg = document.getElementById("ctMsg").value.trim();
  if(nome.length<2){ document.getElementById("ctNome").focus(); return; }
  if(fone.replace(/\D/g,"").length<10){ document.getElementById("ctFone").focus(); return; }
  if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)){ document.getElementById("ctEmail").focus(); return; }
  if(!document.getElementById("ctLgpd").checked){ document.querySelector(".consent").animate([{opacity:.3},{opacity:1}],400); return; }

  const produto = assunto==="outro" ? "seguro" : assunto;
  const btn = document.getElementById("ctSend"); btn.textContent="Enviando…"; btn.disabled=true;
  DB.addLead({
    nome, email, telefone: fone, produto, tipo: assunto==="outro"?"Outro":"", origem:"Site", estagio:"novo",
    notas:[{id:DB.uid("nota"), data:new Date().toISOString(), autor:"Sistema",
      texto:`Contato geral pelo site (assunto: ${assunto}).${msg?" Mensagem: "+msg:""}`}]
  });
  document.getElementById("ctWppLink").href = window.SoluaSite.wppLink(`Olá! Enviei uma mensagem pelo site (${assunto}).${msg?" "+msg:""}`);
  document.getElementById("contatoFields").style.display = "none";
  document.querySelector(".consent").style.display = "none";
  btn.style.display = "none";
  document.getElementById("ctDone").classList.add("on");
};

window.SoluaChrome.observeReveals();
})();
