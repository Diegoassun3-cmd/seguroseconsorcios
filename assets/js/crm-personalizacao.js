/* ===========================================================
   Solua CRM — Personalização (marca, contato, automações)
   Página: crm/admin/personalizacao.html
   Lê/grava em /api/settings (Worker + D1) — afeta o site público
   de verdade, para qualquer visitante, não só quem está logado aqui.
   =========================================================== */
(function(){
"use strict";
const UI = window.SoluaUI;
const ADMIN_KEY_STORAGE = "solua_admin_key";
let atual = null;

function getAdminKey(){ try{ return localStorage.getItem(ADMIN_KEY_STORAGE) || ""; }catch(e){ return ""; } }
function setAdminKey(v){ try{ localStorage.setItem(ADMIN_KEY_STORAGE, v); }catch(e){} }

function fileParaDataUrl(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function carregar(){
  document.getElementById("fAdminKey").value = getAdminKey();
  try{
    const r = await fetch("/api/settings");
    if(!r.ok) throw new Error("offline");
    atual = await r.json();
    preencher(atual);
    document.getElementById("apiStatus").innerHTML = `<span class="badge ganho">Conectado ao banco real (D1)</span>`;
  }catch(e){
    atual = { corPrimaria:"#004BA5", whatsappNumero:"5519999999999", emailRemetente:"contato@solua.com.br", nomeRemetente:"Solua", automacaoEmailAtiva:false, automacaoWhatsappAtiva:false };
    preencher(atual);
    document.getElementById("apiStatus").innerHTML = `<span class="badge perdido">API /api/settings não respondeu</span> <span style="font-size:12px;color:var(--tinta-45)">— isso é esperado antes do primeiro deploy do Worker com D1, ou testando localmente sem o Cloudflare.</span>`;
  }
}

function preencher(s){
  document.getElementById("fCorPrimaria").value = s.corPrimaria || "#004BA5";
  document.getElementById("fCorPrimariaHex").value = s.corPrimaria || "#004BA5";
  document.getElementById("fWhats").value = s.whatsappNumero || "";
  document.getElementById("fEmailRem").value = s.emailRemetente || "";
  document.getElementById("fNomeRem").value = s.nomeRemetente || "";
  document.getElementById("fAutoEmail").checked = !!s.automacaoEmailAtiva;
  document.getElementById("fAutoWhats").checked = !!s.automacaoWhatsappAtiva;
  logoPreview(s.logoUrl);
  atualizarPreviewCor(s.corPrimaria || "#004BA5");
}

function logoPreview(url){
  const el = document.getElementById("logoPreview");
  el.innerHTML = url ? `<img src="${url}" alt="Logo" style="max-height:48px;max-width:200px">` : `<span style="color:var(--tinta-45);font-size:13px">Sem logo — o site usa o texto "solua"</span>`;
}

function atualizarPreviewCor(hex){
  document.getElementById("corPreviewBtn").style.background = hex;
  document.getElementById("corPreviewBtn").style.borderColor = hex;
  document.getElementById("fCorPrimaria").value = hex;
  document.getElementById("fCorPrimariaHex").value = hex;
}

document.getElementById("fCorPrimaria").oninput = e=> atualizarPreviewCor(e.target.value);
document.getElementById("fCorPrimariaHex").oninput = e=>{
  const v = e.target.value.trim();
  if(/^#([0-9a-f]{6})$/i.test(v)) atualizarPreviewCor(v);
};

document.getElementById("fLogoFile").onchange = async e=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 250*1024){ UI.toast("Escolha uma imagem menor que 250KB (de preferência um SVG ou PNG leve).","err"); e.target.value=""; return; }
  const dataUrl = await fileParaDataUrl(file);
  atual.logoUrl = dataUrl;
  logoPreview(dataUrl);
};
document.getElementById("btnRemoverLogo").onclick = ()=>{ atual.logoUrl = null; logoPreview(null); document.getElementById("fLogoFile").value=""; };

document.getElementById("btnSalvar").onclick = async ()=>{
  const key = document.getElementById("fAdminKey").value.trim();
  setAdminKey(key);
  const payload = {
    logoUrl: atual ? atual.logoUrl : null,
    corPrimaria: document.getElementById("fCorPrimariaHex").value.trim() || "#004BA5",
    whatsappNumero: document.getElementById("fWhats").value.replace(/\D/g,""),
    emailRemetente: document.getElementById("fEmailRem").value.trim(),
    nomeRemetente: document.getElementById("fNomeRem").value.trim(),
    automacaoEmailAtiva: document.getElementById("fAutoEmail").checked,
    automacaoWhatsappAtiva: document.getElementById("fAutoWhats").checked
  };
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
      UI.toast("Personalização salva — já vale para o site inteiro.","ok");
      atual = data.settings; preencher(atual);
    } else {
      UI.toast(data.erro || `Não foi possível salvar (HTTP ${r.status}).`, "err");
    }
  }catch(e){
    UI.toast("Não deu pra falar com a API agora (Worker ainda não publicado?).","err");
  }
  btn.textContent = "Salvar personalização"; btn.style.pointerEvents="";
};

carregar();
})();
