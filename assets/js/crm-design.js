/* ===========================================================
   Solua CRM — Painel de Design (textos e visibilidade de seções
   da Home, banner de campanha). Lê/grava em /api/settings — a
   MESMA linha de configurações da Personalização — então sempre
   carregamos o estado atual inteiro antes de salvar, para nunca
   sobrescrever logo/cor/WhatsApp com os valores padrão.
   =========================================================== */
(function(){
"use strict";
const UI = window.SoluaUI;
const ADMIN_KEY_STORAGE = "solua_admin_key"; // mesma chave usada em Personalização
let atual = null;

function getAdminKey(){ try{ return localStorage.getItem(ADMIN_KEY_STORAGE) || ""; }catch(e){ return ""; } }

async function carregar(){
  try{
    const r = await fetch("/api/settings");
    if(!r.ok) throw new Error("offline");
    atual = await r.json();
    preencher(atual);
    document.getElementById("apiStatus").innerHTML = `<span class="badge ganho">Conectado ao banco real (D1)</span>`;
  }catch(e){
    atual = { corPrimaria:"#004BA5", whatsappNumero:"5519999999999", emailRemetente:"contato@solua.com.br", nomeRemetente:"Solua",
      mostrarBlogHome:true, mostrarImoveisHome:true };
    preencher(atual);
    document.getElementById("apiStatus").innerHTML = `<span class="badge perdido">API /api/settings não respondeu</span> <span style="font-size:12px;color:var(--tinta-45)">— isso é esperado antes do primeiro deploy do Worker com D1, ou testando localmente sem o Cloudflare.</span>`;
  }
}

function preencher(s){
  document.getElementById("fHeroTitulo").value = s.heroTitulo || "";
  document.getElementById("fHeroSubtitulo").value = s.heroSubtitulo || "";
  document.getElementById("fMostrarImoveis").checked = s.mostrarImoveisHome !== false;
  document.getElementById("fMostrarBlog").checked = s.mostrarBlogHome !== false;
  document.getElementById("fBanner").value = s.bannerConsorcioTexto || "";
}

document.getElementById("btnSalvar").onclick = async ()=>{
  const key = getAdminKey();
  if(!key){ UI.toast("Configure a chave de administrador em Personalização antes de salvar aqui.","err"); return; }
  // manda o objeto de configurações inteiro (o que já estava + o que mudou aqui),
  // pra não apagar logo/cor/whatsapp definidos em Personalização.
  const payload = Object.assign({}, atual, {
    heroTitulo: document.getElementById("fHeroTitulo").value.trim(),
    heroSubtitulo: document.getElementById("fHeroSubtitulo").value.trim(),
    mostrarImoveisHome: document.getElementById("fMostrarImoveis").checked,
    mostrarBlogHome: document.getElementById("fMostrarBlog").checked,
    bannerConsorcioTexto: document.getElementById("fBanner").value.trim()
  });
  const btn = document.getElementById("btnSalvar");
  btn.textContent = "Salvando…"; btn.style.pointerEvents="none";
  try{
    const r = await fetch("/api/settings", {
      method:"PUT",
      headers:{"Content-Type":"application/json", "x-solua-admin-key": key},
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(()=>({}));
    if(r.ok && data.ok){
      UI.toast("Design salvo — já vale para a Home do site.","ok");
      atual = data.settings; preencher(atual);
    } else {
      UI.toast(data.erro || `Não foi possível salvar (HTTP ${r.status}).`, "err");
    }
  }catch(e){
    UI.toast("Não deu pra falar com a API agora (Worker ainda não publicado?).","err");
  }
  btn.textContent = "Salvar design"; btn.style.pointerEvents="";
};

carregar();
})();
