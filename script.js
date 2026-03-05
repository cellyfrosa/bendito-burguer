// =========================
// BENDITO BURGUER — script.js (INLINE OPTIONS - SEM MODAL PERSONALIZAR)
// - Delivery only Cerquilho/SP (taxa fixa R$ 6)
// - Opções INLINE no item do carrinho (remove o botão "Personalizar")
// - localStorage + drawer acessível
// =========================

// ===== CONFIG =====
const WHATSAPP_NUMBER = "5515996273162";
const OPEN_HOUR = 19;
const CLOSE_HOUR = 23;

const STORAGE_KEY = "bendito_state_inline_v1";

// Entrega (fixa e restrita)
const DELIVERY_CITY = "cerquilho";
const DELIVERY_STATE = "sp";
const DELIVERY_FEE = 6;
const DELIVERY_ETA = "30–50min";

// ===== EXTRAS GLOBAIS =====
const GLOBAL_EXTRAS = [
  { id: "bacon",      name: "Bacon",      price: 4 },
  { id: "ovo",        name: "Ovo",        price: 2 },
  { id: "queijo",     name: "Queijo",     price: 2 },
  { id: "hamburguer", name: "Hambúrguer", price: 7 },
  { id: "milho",      name: "Milho",      price: 2 },
  { id: "catupiry",   name: "Catupiry",   price: 3 },
  { id: "cheddar",    name: "Cheddar",    price: 3 },
];

// ===== PRODUTOS =====
const PRODUCTS = [
  {
    id: "classic",
    name: "Clássico Bendito",
    cat: "trad",
    price: 28.90,
    img: "./img/classico.png",
    desc: "Pão brioche, hambúrguer 120g, queijo mussarela, alface, tomate e molho especial.",
    tags: ["120g", "brioche", "molho"],
    removeOptions: ["Alface", "Tomate", "Queijo", "Molho"],
  },
  {
    id: "xburger",
    name: "X-Burger",
    cat: "trad",
    price: 24.90,
    img: "./img/xburger.png",
    desc: "Pão brioche, hambúrguer 120g, queijo cheddar.",
    tags: ["120g", "cheddar"],
    removeOptions: ["Queijo"],
  },
  {
    id: "xsalada",
    name: "X-Salada",
    cat: "trad",
    price: 26.90,
    img: "./img/xsalada.png",
    desc: "Pão brioche, hambúrguer 120g, queijo, alface, tomate e maionese da casa.",
    tags: ["120g", "salada"],
    removeOptions: ["Alface", "Tomate", "Queijo", "Maionese"],
  },
  {
    id: "xbacon",
    name: "X-Bacon",
    cat: "trad",
    price: 29.90,
    img: "./img/xbacon.png",
    desc: "Pão brioche, hambúrguer 120g, queijo cheddar e bacon crocante.",
    tags: ["120g", "bacon"],
    removeOptions: ["Queijo", "Bacon"],
  },
  {
    id: "benditoDuplo",
    name: "Bendito Bacon Duplo",
    cat: "esp",
    price: 35.00,
    img: "./img/duplo.png",
    desc: "Pão brioche, 2 hambúrgueres 120g, cheddar, bacon, cebola caramelizada e molho especial.",
    tags: ["duplo", "bacon"],
    removeOptions: ["Cheddar", "Bacon", "Cebola caramelizada", "Molho"],
  },
  {
    id: "smash",
    name: "Smash Burguer",
    cat: "esp",
    price: 24.00,
    img: "./img/smash.png",
    desc: "Pão selado, 2 smash 90g, cheddar duplo e picles.",
    tags: ["smash"],
    removeOptions: ["Cheddar", "Picles"],
  },
  {
    id: "crispy",
    name: "Frango Crispy",
    cat: "esp",
    price: 28.00,
    img: "./img/frango.png",
    desc: "Pão brioche, frango empanado, queijo, alface e molho especial.",
    tags: ["frango"],
    removeOptions: ["Queijo", "Alface", "Molho"],
  },
];

// ===== STATE =====
let address = null; // {street, district, city}
let cart = [];      // { uid, productId, qty, custom:{ remove:[], extras:{} }, ui:{ open:boolean } }
let lastFocus = null;

// ===== HELPERS =====
const $ = (id) => document.getElementById(id);

function money(v){
  return (Number(v) || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function stripAccents(s){
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function norm(s){
  return stripAccents(String(s || "").trim().toLowerCase());
}
function isOpenNow(){
  const h = new Date().getHours();
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}
function isCerquilhoAddress(addr){
  if(!addr) return false;
  const c = norm(addr.city);
  const okCity = c.includes(DELIVERY_CITY);
  const okState = c.includes(DELIVERY_STATE) || c.includes("sao paulo") || c.includes("/sp") || c.includes("-sp");
  return okCity && (okState || c === DELIVERY_CITY || c.startsWith(`${DELIVERY_CITY} `));
}
function calcFeeAndEta(){
  if(!address) return { fee: 0, eta: "—", blocked: true };
  if(!isCerquilhoAddress(address)) return { fee: 0, eta: "—", blocked: true };
  return { fee: DELIVERY_FEE, eta: DELIVERY_ETA, blocked: false };
}
function genUid(){
  return `li_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function getProduct(id){
  return PRODUCTS.find(p => p.id === id) || null;
}
function getExtraById(id){
  return GLOBAL_EXTRAS.find(x => x.id === id) || null;
}
function lineExtrasTotal(line){
  const extras = line?.custom?.extras || {};
  let t = 0;
  for(const [exId, q] of Object.entries(extras)){
    const ex = getExtraById(exId);
    if(ex) t += ex.price * (Number(q) || 0);
  }
  return t;
}
function lineUnitPrice(line){
  const p = getProduct(line.productId);
  if(!p) return 0;
  return p.price + lineExtrasTotal(line);
}
function cartCount(){
  return cart.reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
}
function cartSubtotal(){
  return cart.reduce((sum, line) => sum + lineUnitPrice(line) * (Number(line.qty) || 0), 0);
}
function summarizeCustomization(line){
  const remove = line?.custom?.remove || [];
  const extras = line?.custom?.extras || {};
  const parts = [];

  if(remove.length) parts.push(`Sem: ${remove.join(", ")}`);

  const extrasParts = [];
  for(const [exId, q] of Object.entries(extras)){
    const qty = Number(q) || 0;
    if(qty <= 0) continue;
    const ex = getExtraById(exId);
    if(ex) extrasParts.push(`${qty}x ${ex.name}`);
  }
  if(extrasParts.length) parts.push(`Extras: ${extrasParts.join(", ")}`);

  return parts.join(" • ");
}

// ===== STORAGE =====
function saveState(){
  try{
    const safeCart = cart.map(l => ({
      uid: l.uid,
      productId: l.productId,
      qty: l.qty,
      custom: l.custom || { remove: [], extras: {} }
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ address, cart: safeCart }));
  }catch{}
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);

    address = data.address || null;

    const incoming = Array.isArray(data.cart) ? data.cart : [];
    cart = incoming
      .map(l => ({
        uid: l.uid || genUid(),
        productId: l.productId,
        qty: Math.max(1, Number(l.qty) || 1),
        custom: {
          remove: Array.isArray(l?.custom?.remove) ? l.custom.remove : [],
          extras: (l?.custom?.extras && typeof l.custom.extras === "object") ? l.custom.extras : {},
        },
        ui: { open: false }
      }))
      .filter(l => !!getProduct(l.productId));
  }catch{}
}

// ===== DOM =====
const statusDot = $("statusDot");
const statusText = $("statusText");
const addrLine = $("addrLine");
const addrMeta = $("addrMeta");

const subtotalEl = $("subtotal");
const feeEl = $("fee");
const totalEl = $("total");
const countEl = $("count");

const q = $("q");
const cat = $("cat");
const grid = $("grid");

const addrModal = $("addrModal");
const addrForm = $("addrForm");
const street = $("street");
const district = $("district");
const city = $("city");
const cancelAddrBtn = $("cancelAddr");

const checkoutBtn = $("checkoutBtn");
const cartDrawer = $("cartDrawer");
const drawerOverlay = $("drawerOverlay");
const closeDrawer = $("closeDrawer");
const drawerItems = $("drawerItems");
const drawerSubtotalEl = $("drawerSubtotal");
const drawerFeeEl = $("drawerFee");
const drawerTotalEl = $("drawerTotal");
const drawerCheckout = $("drawerCheckout");
const drawerContent = cartDrawer?.querySelector?.(".drawer-content") || null;

// ===== RENDER =====
function renderStatus(){
  if(!statusDot || !statusText) return;
  if(isOpenNow()){
    statusDot.style.background = "limegreen";
    statusText.textContent = "Aberto agora";
  }else{
    statusDot.style.background = "orange";
    statusText.textContent = `Fechado — abre às ${String(OPEN_HOUR).padStart(2,"0")}:00`;
  }
}

function renderAddress(){
  if(!addrLine || !addrMeta) return;

  const { fee, eta, blocked } = calcFeeAndEta();

  if(!address){
    addrLine.textContent = "Entregar em: selecione";
    addrMeta.textContent = "Entrega disponível somente em Cerquilho/SP";
    return;
  }

  addrLine.textContent = `${address.street} — ${address.district} (${address.city})`;
  addrMeta.textContent = blocked ? "Entrega disponível somente em Cerquilho/SP" : `Taxa ${money(fee)} • ${eta}`;
}

function renderCartTotals(){
  if(!subtotalEl || !feeEl || !totalEl || !countEl) return;

  const items = cartCount();
  const sub = cartSubtotal();
  const { fee, blocked } = calcFeeAndEta();
  const f = (items > 0 && !blocked) ? fee : 0;

  subtotalEl.textContent = money(sub);
  feeEl.textContent = money(f);
  totalEl.textContent = money(sub + f);
  countEl.textContent = String(items);
}

function renderProducts(){
  if(!grid) return;

  const query = norm(q?.value || "");
  const c = cat?.value || "todos";

  const list = PRODUCTS.filter(p => {
    const okCat = (c === "todos") || (p.cat === c);
    const okQuery = !query || norm(p.name).includes(query) || norm(p.desc).includes(query);
    return okCat && okQuery;
  });

  grid.innerHTML = "";
  list.forEach(p => {
    const el = document.createElement("article");
    el.className = "card";
    const imgSrc = p.img || "./burger-placeholder.jpg";

    el.innerHTML = `
      <div class="thumb" aria-hidden="true">
        <img src="${imgSrc}" alt="">
      </div>

      <div class="card-body">
        <div class="card-top">
          <h3>${p.name}</h3>
          <div class="price">${money(p.price)}</div>
        </div>

        <div class="desc">${p.desc}</div>

        <div class="card-bottom">
          <div class="tags">
            ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
          </div>

          <button class="addbtn" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name}">
            +
          </button>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function syncCatsFromSelect(){
  if(!cat) return;
  const v = cat.value || "todos";
  document.querySelectorAll(".cat").forEach(b => {
    b.classList.toggle("active", b.dataset.cat === v);
  });
}

// ===== DRAWER =====
function setPageScrollLocked(locked){
  document.body.style.overflow = locked ? "hidden" : "";
}

function openDrawer(){
  if(!cartDrawer || !drawerOverlay) return;
  lastFocus = document.activeElement;

  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden","false");
  cartDrawer.removeAttribute("inert");
  drawerOverlay.hidden = false;

  setPageScrollLocked(true);
  renderDrawer();

  setTimeout(() => drawerContent?.focus?.(), 0);
}

function closeDrawerFn(){
  if(!cartDrawer || !drawerOverlay) return;

  if(document.activeElement && cartDrawer.contains(document.activeElement)){
    checkoutBtn?.focus?.();
  }

  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden","true");
  cartDrawer.setAttribute("inert","");
  drawerOverlay.hidden = true;

  setPageScrollLocked(false);

  if(lastFocus && typeof lastFocus.focus === "function"){
    setTimeout(() => lastFocus.focus(), 0);
  }
}

function renderDrawer(){
  if(!drawerItems || !drawerSubtotalEl || !drawerFeeEl || !drawerTotalEl) return;

  drawerItems.innerHTML = "";

  if(cart.length === 0){
    drawerItems.innerHTML = `<p class="drawer-empty">Seu carrinho está vazio.</p>`;
  }else{
    cart.forEach(line => {
      const p = getProduct(line.productId);
      if(!p) return;

      const unit = lineUnitPrice(line);
      const customText = summarizeCustomization(line);
      const lineTotal = unit * (Number(line.qty) || 0);
      const open = !!line.ui?.open;

      const removeList = Array.isArray(p.removeOptions) && p.removeOptions.length
        ? p.removeOptions
        : ["Alface","Tomate","Cebola","Picles","Queijo","Molho"];

      const currentRemove = new Set(line.custom?.remove || []);
      const currentExtras = line.custom?.extras || {};

      const removeHtml = removeList.map(name => {
        const id = `rm_${line.uid}_${norm(name).replace(/\s+/g,"_")}`;
        const checked = currentRemove.has(name) ? "checked" : "";
        return `
          <label class="custom-item" for="${id}">
            <input type="checkbox" id="${id}" data-line="${line.uid}" data-rm="${name}" ${checked}>
            <span>${name}</span>
          </label>
        `;
      }).join("");

      const extrasHtml = GLOBAL_EXTRAS.map(ex => {
        const val = Math.max(0, Number(currentExtras[ex.id] || 0));
        return `
          <div class="custom-item custom-step" data-line="${line.uid}">
            <div class="custom-step__left">
              <div class="custom-step__name">${ex.name}</div>
              <div class="custom-step__price">${money(ex.price)}</div>
            </div>
            <div class="custom-step__right">
              <button type="button" class="custom-step__btn" data-ex-minus="${ex.id}" data-line="${line.uid}" aria-label="Diminuir ${ex.name}">-</button>
              <input class="custom-step__qty" inputmode="numeric" pattern="[0-9]*"
                     value="${val}" data-ex-qty="${ex.id}" data-line="${line.uid}" aria-label="Quantidade de ${ex.name}">
              <button type="button" class="custom-step__btn" data-ex-plus="${ex.id}" data-line="${line.uid}" aria-label="Aumentar ${ex.name}">+</button>
            </div>
          </div>
        `;
      }).join("");

      const item = document.createElement("div");
      item.className = "drawer-item";
      item.innerHTML = `
        <div class="drawer-item__top">
          <div class="drawer-item__info">
            <h4 class="drawer-item__name">${p.name}</h4>
            <div class="drawer-item__meta">
              <span class="drawer-item__meta-label">Preço unitário</span>
              <div class="drawer-item__meta-value">
                <strong>${money(unit)}</strong> <span class="drawer-item__unit">(un)</span>
              </div>
            </div>
            ${customText ? `<div class="drawer-item__custom">${customText}</div>` : ""}
          </div>

          <button class="iconbtn drawer-item__remove" type="button" data-remove-line="${line.uid}" aria-label="Remover item" title="Remover">
            ✕
          </button>
        </div>

        <div class="qty drawer-item__qty">
          <div class="drawer-item__qty-controls">
            <button data-minus="${line.uid}" type="button" aria-label="Diminuir ${p.name}">-</button>
            <span class="drawer-item__qty-value" aria-label="Quantidade de ${p.name}">${line.qty}</span>
            <button data-plus="${line.uid}" type="button" aria-label="Aumentar ${p.name}">+</button>
          </div>

          <div class="drawer-item__line-total">
            <small>Total item</small>
            <strong>${money(lineTotal)}</strong>
          </div>

          <button class="cart-options-btn" type="button" data-toggle-custom="${line.uid}" aria-expanded="${open ? "true":"false"}">
            <span>Opções</span>
            <span class="optchev">›</span>
          </button>
        </div>

        <div class="inline-custom" data-custom-panel="${line.uid}" ${open ? "" : "hidden"}>
          <div class="panel">
            <div class="panel-head">
              <strong class="panel-title">Opções do lanche</strong>
              <button type="button" class="iconbtn" data-close-custom="${line.uid}" aria-label="Fechar opções">✕</button>
            </div>

            <div class="inline-custom__sections">
              <div class="inline-custom__group">
                <div class="inline-custom__label">Remover</div>
                <div class="custom-list">${removeHtml}</div>
              </div>

              <div class="inline-custom__group">
                <div class="inline-custom__label">Adicionar (extras)</div>
                <div class="custom-list">${extrasHtml}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      drawerItems.appendChild(item);
    });
  }

  const items = cartCount();
  const sub = cartSubtotal();
  const { fee, blocked } = calcFeeAndEta();
  const f = (items > 0 && !blocked) ? fee : 0;

  drawerSubtotalEl.textContent = money(sub);
  drawerFeeEl.textContent = money(f);
  drawerTotalEl.textContent = money(sub + f);
}

// ===== CART OPS =====
function addProductToCart(productId){
  const p = getProduct(productId);
  if(!p) return;

  cart.unshift({
    uid: genUid(),
    productId,
    qty: 1,
    custom: { remove: [], extras: {} },
    ui: { open: true } // abre opções ao adicionar (pode trocar para false)
  });

  saveState();
  renderCartTotals();
  renderDrawer();
}

function findLine(uid){
  return cart.find(l => l.uid === uid) || null;
}

function incLine(uid){
  const line = findLine(uid);
  if(!line) return;
  line.qty = (Number(line.qty) || 1) + 1;
  saveState();
  renderCartTotals();
  renderDrawer();
}

function decLine(uid){
  const idx = cart.findIndex(l => l.uid === uid);
  if(idx < 0) return;
  cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 1) - 1);
  saveState();
  renderCartTotals();
  renderDrawer();
}

function removeLine(uid){
  cart = cart.filter(l => l.uid !== uid);
  saveState();
  renderCartTotals();
  renderDrawer();
}

function toggleCustomPanel(uid, open){
  const line = findLine(uid);
  if(!line) return;
  line.ui = line.ui || { open:false };
  line.ui.open = (typeof open === "boolean") ? open : !line.ui.open;
  renderDrawer();
}

function applyRemoveToggle(uid, name, checked){
  const line = findLine(uid);
  if(!line) return;

  const arr = Array.isArray(line.custom?.remove) ? line.custom.remove : [];
  const set = new Set(arr);

  if(checked) set.add(name);
  else set.delete(name);

  line.custom = line.custom || { remove: [], extras: {} };
  line.custom.remove = Array.from(set);

  saveState();
  renderCartTotals();
  renderDrawer();
}

function setExtraQty(uid, exId, qty){
  const line = findLine(uid);
  if(!line) return;

  line.custom = line.custom || { remove: [], extras: {} };
  line.custom.extras = (line.custom.extras && typeof line.custom.extras === "object") ? line.custom.extras : {};

  const q = Math.max(0, Math.min(9, Number(qty) || 0));
  if(q > 0) line.custom.extras[exId] = q;
  else delete line.custom.extras[exId];

  saveState();
  renderCartTotals();
  renderDrawer();
}

// ===== MODAL ENDEREÇO =====
function openAddrModal(){
  if(!addrModal) return;
  lastFocus = document.activeElement;

  if(typeof addrModal.showModal === "function"){
    addrModal.showModal();
  }else{
    alert("Seu navegador não suporta o modal de endereço. Atualize o navegador.");
    return;
  }

  setTimeout(() => street?.focus?.(), 0);
}

function closeAddrModal(){
  if(!addrModal) return;
  if(typeof addrModal.close === "function") addrModal.close();

  if(lastFocus && typeof lastFocus.focus === "function"){
    setTimeout(() => lastFocus.focus(), 0);
  }
}

// click fora do dialog fecha
function attachDialogBackdropClose(dialogEl, closeFn){
  if(!dialogEl) return;
  dialogEl.addEventListener("click", (e) => {
    if(e.target === dialogEl) closeFn();
  });
}

// ===== CHECKOUT WHATSAPP =====
function wpp(text){
  const msg = encodeURIComponent(String(text || ""));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function cartLines(){
  return cart.map(line => {
    const p = getProduct(line.productId);
    if(!p) return "";

    const unit = lineUnitPrice(line);
    const custom = summarizeCustomization(line);
    const base = `${line.qty}x ${p.name} — ${money(unit * line.qty)}`;
    return custom ? `${base}\n   ${custom}` : base;
  }).filter(Boolean);
}

function checkoutWhatsApp(){
  if(cartCount() === 0){
    alert("Carrinho vazio");
    return;
  }

  if(!address){
    alert("Informe o endereço para entrega.");
    openAddrModal();
    return;
  }
  if(!isCerquilhoAddress(address)){
    alert("No momento, a entrega é somente para Cerquilho/SP.");
    openAddrModal();
    return;
  }

  const { fee, eta, blocked } = calcFeeAndEta();
  const sub = cartSubtotal();
  const f = (!blocked && cartCount() > 0) ? fee : 0;
  const total = sub + f;

  const safe = (t) => String(t || "").replace(/\uFFFD/g, "");

  const msg = [
    "Olá! Quero pedir no Bendito Burguer 🍔",
    "",
    `Endereço: ${safe(address.street)} — ${safe(address.district)} (${safe(address.city)})`,
    "",
    "Pedido:",
    ...cartLines().map(safe),
    "",
    `Subtotal: ${money(sub)}`,
    `Taxa: ${money(f)}`,
    `Total: ${money(total)}`,
    `Tempo: ${eta}`
  ].filter(Boolean).join("\n");

  window.open(wpp(msg), "_blank");
}

// =========================
// EVENTS
// =========================

// abrir endereço
$("openAddress")?.addEventListener("click", openAddrModal);

// cancelar endereço
cancelAddrBtn?.addEventListener("click", (e)=>{
  e.preventDefault();
  closeAddrModal();
});

// fechar ao clicar fora
attachDialogBackdropClose(addrModal, closeAddrModal);

// salvar endereço
addrForm?.addEventListener("submit", (e)=>{
  e.preventDefault();

  const s = street?.value?.trim() || "";
  const d = district?.value?.trim() || "";
  const c = city?.value?.trim() || "";

  if(!s || !d || !c){
    alert("Preencha o endereço completo.");
    return;
  }

  address = { street: s, district: d, city: c };

  if(!isCerquilhoAddress(address)){
    alert("Entrega disponível somente em Cerquilho/SP. Corrija a cidade para Cerquilho - SP.");
  }

  closeAddrModal();
  renderAddress();
  renderCartTotals();
  renderDrawer();
  saveState();
});

// grid adicionar
grid?.addEventListener("click", (e)=>{
  const btn = e.target.closest?.("[data-add]");
  if(!btn) return;

  addProductToCart(btn.dataset.add);

  const cardEl = btn.closest?.(".card");
  if(cardEl){
    cardEl.classList.remove("bump");
    void cardEl.offsetWidth;
    cardEl.classList.add("bump");
  }
});

// drawer open/close
checkoutBtn?.addEventListener("click", openDrawer);
closeDrawer?.addEventListener("click", closeDrawerFn);
drawerOverlay?.addEventListener("click", closeDrawerFn);

// delegação do carrinho
drawerItems?.addEventListener("click", (e)=>{
  const plusBtn = e.target.closest?.("[data-plus]");
  const minusBtn = e.target.closest?.("[data-minus]");
  const rmBtn = e.target.closest?.("[data-remove-line]");
  const toggleBtn = e.target.closest?.("[data-toggle-custom]");
  const closeCustomBtn = e.target.closest?.("[data-close-custom]");
  const exPlus = e.target.closest?.("[data-ex-plus]");
  const exMinus = e.target.closest?.("[data-ex-minus]");

  if(plusBtn?.dataset?.plus){ incLine(plusBtn.dataset.plus); return; }
  if(minusBtn?.dataset?.minus){ decLine(minusBtn.dataset.minus); return; }
  if(rmBtn?.dataset?.removeLine){ removeLine(rmBtn.dataset.removeLine); return; }

  if(toggleBtn?.dataset?.toggleCustom){ toggleCustomPanel(toggleBtn.dataset.toggleCustom); return; }
  if(closeCustomBtn?.dataset?.closeCustom){ toggleCustomPanel(closeCustomBtn.dataset.closeCustom, false); return; }

  if(exPlus?.dataset?.exPlus && exPlus?.dataset?.line){
    const uid = exPlus.dataset.line;
    const exId = exPlus.dataset.exPlus;
    const input = drawerItems.querySelector(`input[data-line="${uid}"][data-ex-qty="${exId}"]`);
    const v = Math.max(0, Math.min(9, Number(String(input?.value || "0").replace(/\D/g,"")) || 0));
    setExtraQty(uid, exId, Math.min(9, v + 1));
    return;
  }

  if(exMinus?.dataset?.exMinus && exMinus?.dataset?.line){
    const uid = exMinus.dataset.line;
    const exId = exMinus.dataset.exMinus;
    const input = drawerItems.querySelector(`input[data-line="${uid}"][data-ex-qty="${exId}"]`);
    const v = Math.max(0, Math.min(9, Number(String(input?.value || "0").replace(/\D/g,"")) || 0));
    setExtraQty(uid, exId, Math.max(0, v - 1));
    return;
  }
});

// checkbox remover
drawerItems?.addEventListener("change", (e)=>{
  const inp = e.target;
  if(!(inp instanceof HTMLInputElement)) return;

  if(inp.hasAttribute("data-rm") && inp.hasAttribute("data-line")){
    applyRemoveToggle(inp.getAttribute("data-line"), inp.getAttribute("data-rm"), inp.checked);
  }
});

// input qty extras
drawerItems?.addEventListener("input", (e)=>{
  const inp = e.target;
  if(!(inp instanceof HTMLInputElement)) return;

  if(inp.hasAttribute("data-ex-qty") && inp.hasAttribute("data-line")){
    const uid = inp.getAttribute("data-line");
    const exId = inp.getAttribute("data-ex-qty");
    const n = Math.max(0, Math.min(9, Number(String(inp.value || "0").replace(/\D/g,"")) || 0));
    inp.value = String(n);
    setExtraQty(uid, exId, n);
  }
});

// checkout
drawerCheckout?.addEventListener("click", checkoutWhatsApp);

// busca/filtro
q?.addEventListener("input", renderProducts);
cat?.addEventListener("change", ()=>{
  syncCatsFromSelect();
  renderProducts();
});

// chips
document.querySelectorAll(".cat").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".cat").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    if(cat) cat.value = btn.dataset.cat || "todos";
    renderProducts();
  });
});

// ESC fecha drawer
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    if(drawerOverlay && !drawerOverlay.hidden) closeDrawerFn();
  }
});

// =========================
// INIT
// =========================
loadState();

renderStatus();
setInterval(renderStatus, 60000);

renderProducts();
renderAddress();
renderCartTotals();
renderDrawer();
syncCatsFromSelect();

// drawer fechado e inert
if(cartDrawer){
  cartDrawer.setAttribute("aria-hidden","true");
  cartDrawer.setAttribute("inert","");
}
if(drawerOverlay) drawerOverlay.hidden = true;
