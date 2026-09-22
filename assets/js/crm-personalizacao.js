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
    atual = { corPrimaria:"#004BA5", whatsappNumero:"5519999999999", emailRemetente:"contato@solua.com.br", nomeRemetente:"Solua", automacaoEmailAtiva:false, automacaoWhatsappAtiva:false, siteTitulo:"", siteDescricao:"", manutencaoAtiva:false, manutencaoMensagem:"" };
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
  document.getElementById("fSiteTitulo").value = s.siteTitulo || "";
  document.getElementById("fSiteDescricao").value = s.siteDescricao || "";
  document.getElementById("fManutencaoAtiva").checked = !!s.manutencaoAtiva;
  document.getElementById("fManutencaoMsg").value = s.manutencaoMensagem || "";
  logoPreview(s.logoUrl);
  logoEscuroPreview(s.logoUrlEscuro);
  faviconPreview(s.faviconUrl);
  atualizarPreviewCor(s.corPrimaria || "#004BA5");
}

function logoPreview(url){
  const el = document.getElementById("logoPreview");
  el.innerHTML = url ? `<img src="${url}" alt="Logo" style="max-height:48px;max-width:200px">` : `<span style="color:var(--tinta-45);font-size:13px">Sem logo — o site usa o texto "solua"</span>`;
}

function logoEscuroPreview(url){
  const el = document.getElementById("logoEscuroPreview");
  el.innerHTML = url ? `<img src="${url}" alt="Logo (fundo escuro)" style="max-height:48px;max-width:200px">` : `<span style="color:rgba(242,237,230,.6);font-size:13px">Sem versão escura — usa a mesma logo/texto</span>`;
}

function faviconPreview(url){
  const el = document.getElementById("faviconPreview");
  el.innerHTML = url ? `<img src="${url}" alt="Favicon" style="max-height:32px;max-width:32px">` : `<span style="color:var(--tinta-45);font-size:13px">Sem ícone customizado — usa o padrão da marca</span>`;
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

document.getElementById("fLogoEscuroFile").onchange = async e=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 250*1024){ UI.toast("Escolha uma imagem menor que 250KB (de preferência um SVG ou PNG leve).","err"); e.target.value=""; return; }
  const dataUrl = await fileParaDataUrl(file);
  atual.logoUrlEscuro = dataUrl;
  logoEscuroPreview(dataUrl);
};
document.getElementById("btnRemoverLogoEscuro").onclick = ()=>{ atual.logoUrlEscuro = null; logoEscuroPreview(null); document.getElementById("fLogoEscuroFile").value=""; };

document.getElementById("fFaviconFile").onchange = async e=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 100*1024){ UI.toast("Escolha um ícone menor que 100KB.","err"); e.target.value=""; return; }
  const dataUrl = await fileParaDataUrl(file);
  atual.faviconUrl = dataUrl;
  faviconPreview(dataUrl);
};
document.getElementById("btnRemoverFavicon").onclick = ()=>{ atual.faviconUrl = null; faviconPreview(null); document.getElementById("fFaviconFile").value=""; };

document.getElementById("btnSalvar").onclick = async ()=>{
  const key = document.getElementById("fAdminKey").value.trim();
  setAdminKey(key);
  const payload = {
    logoUrl: atual ? atual.logoUrl : null,
    logoUrlEscuro: atual ? atual.logoUrlEscuro : null,
    faviconUrl: atual ? atual.faviconUrl : null,
    corPrimaria: document.getElementById("fCorPrimariaHex").value.trim() || "#004BA5",
    whatsappNumero: document.getElementById("fWhats").value.replace(/\D/g,""),
    emailRemetente: document.getElementById("fEmailRem").value.trim(),
    nomeRemetente: document.getElementById("fNomeRem").value.trim(),
    automacaoEmailAtiva: document.getElementById("fAutoEmail").checked,
    automacaoWhatsappAtiva: document.getElementById("fAutoWhats").checked,
    siteTitulo: document.getElementById("fSiteTitulo").value.trim(),
    siteDescricao: document.getElementById("fSiteDescricao").value.trim(),
    manutencaoAtiva: document.getElementById("fManutencaoAtiva").checked,
    manutencaoMensagem: document.getElementById("fManutencaoMsg").value.trim()
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
