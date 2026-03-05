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
const BURGER_ICON = "\uD83C\uDF54";

const STORAGE_KEY = "bendito_state_inline_v1";

// Entrega (fixa e restrita)
const DELIVERY_CITY = "cerquilho";
const DELIVERY_STATE = "sp";
const DELIVERY_FEE = 6;
const DELIVERY_ETA = "30-50 min";

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
    desc: "Pão brioche, hambúrguer 120g, queijo muçarela, alface, tomate e molho especial.",
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
  {
    id: "coca350",
    name: "Coca-Cola 350ml",
    cat: "bebidas",
    price: 6.00,
    img: "./img/bebidas/coca-cola-350.png",
    desc: "Refrigerante em lata 350 ml, bem gelado.",
    tags: ["bebida", "lata", "350 ml"],
    customizable: false,
    removeOptions: [],
  },
  {
    id: "cocazero350",
    name: "Coca-Cola Zero 350ml",
    cat: "bebidas",
    price: 6.00,
    img: "./img/bebidas/coca-cola-zero-350.png",
    desc: "Refrigerante zero açúcar em lata 350 ml.",
    tags: ["bebida", "zero", "350 ml"],
    customizable: false,
    removeOptions: [],
  },
  {
    id: "fanta350",
    name: "Fanta Laranja 350ml",
    cat: "bebidas",
    price: 6.00,
    img: "./img/bebidas/fanta-laranja-350.png",
    desc: "Refrigerante sabor laranja em lata 350 ml.",
    tags: ["bebida", "laranja", "350 ml"],
    customizable: false,
    removeOptions: [],
  },
  {
    id: "sprite350",
    name: "Sprite 350ml",
    cat: "bebidas",
    price: 6.00,
    img: "./img/bebidas/sprite-350.png",
    desc: "Refrigerante sabor limão em lata 350 ml.",
    tags: ["bebida", "limão", "350 ml"],
    customizable: false,
    removeOptions: [],
  },
  {
    id: "guarana350",
    name: "Guaraná Antarctica 350ml",
    cat: "bebidas",
    price: 6.00,
    img: "./img/bebidas/guarana-antartica-350.png",
    desc: "Refrigerante de guaraná em lata 350 ml.",
    tags: ["bebida", "guaraná", "350 ml"],
    customizable: false,
    removeOptions: [],
  },
];

// ===== STATE =====
let address = null; // {street, district, city}
let cart = [];      // { uid, productId, qty, custom:{ remove:[], extras:{} }, ui:{ open:boolean } }
let orderNote = "";
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
function truncateText(s, max = 36){
  const txt = String(s || "").trim();
  if(txt.length <= max) return txt;
  return `${txt.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
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
function canCustomizeProduct(product){
  return !!product && product.customizable !== false;
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
  if(!canCustomizeProduct(p)) return p.price;
  return p.price + lineExtrasTotal(line);
}
function cartCount(){
  return cart.reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
}
function cartSubtotal(){
  return cart.reduce((sum, line) => sum + lineUnitPrice(line) * (Number(line.qty) || 0), 0);
}
function summarizeCustomization(line){
  const p = getProduct(line?.productId);
  if(!canCustomizeProduct(p)) return "";

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ address, cart: safeCart, note: orderNote }));
  }catch{}
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);

    address = data.address || null;
    orderNote = typeof data.note === "string" ? data.note.slice(0, 280) : "";

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

    if(orderNoteInput) orderNoteInput.value = orderNote;
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
const ctaOrderNow = $("ctaOrderNow");
const ctaMenu = $("ctaMenu");

const addrModal = $("addrModal");
const addrForm = $("addrForm");
const street = $("street");
const district = $("district");
const city = $("city");
const cancelAddrBtn = $("cancelAddr") || addrModal?.querySelector?.(".cart-options-btn") || null;

if(cancelAddrBtn && cancelAddrBtn.classList.contains("cart-options-btn")){
  cancelAddrBtn.type = "button";
  cancelAddrBtn.classList.remove("cart-options-btn");
  cancelAddrBtn.classList.add("btn", "ghost");
  cancelAddrBtn.textContent = "Cancelar";
}

const checkoutBtn = $("checkoutBtn");
const cartbar = document.querySelector(".cartbar");
const cartDrawer = $("cartDrawer");
const drawerOverlay = $("drawerOverlay");
const closeDrawer = $("closeDrawer");
const drawerItems = $("drawerItems");
const drawerSubtotalEl = $("drawerSubtotal");
const drawerFeeEl = $("drawerFee");
const drawerTotalEl = $("drawerTotal");
const drawerCheckout = $("drawerCheckout");
const orderNoteInput = $("orderNote");
const drawerContent = cartDrawer?.querySelector?.(".drawer-content") || null;

function goToMenuAndFocusSearch(){
  const menu = $("cardapio");
  menu?.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => q?.focus?.(), 420);
}
function scrollToMenu(){
  const menu = $("cardapio");
  menu?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
    addrLine.textContent = "Informar endereço de entrega:";
    addrMeta.textContent = "Entrega disponível somente em Cerquilho/SP";
    return;
  }

  const street = truncateText(address.street, 42);
  const location = truncateText([address.district, address.city].filter(Boolean).join(" • "), 34);

  addrLine.textContent = street || "Endereço informado";
  addrMeta.textContent = blocked
    ? "Entrega disponível somente em Cerquilho/SP"
    : `${location} • Taxa ${money(fee)} • ${eta}`;
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

  if(cartbar){
    const hide = items === 0;
    cartbar.classList.toggle("is-hidden", hide);
    cartbar.setAttribute("aria-hidden", hide ? "true" : "false");
  }
  document.body.classList.toggle("has-cart", items > 0);
}

function renderProducts(){
  if(!grid) return;

  const query = norm(q?.value || "");
  const c = cat?.value || "";
  const validCats = new Set(["trad","esp","bebidas"]);
  const selectedCat = validCats.has(c) ? c : "";

  grid.innerHTML = "";

  const byQuery = PRODUCTS.filter(p => {
    return !query || norm(p.name).includes(query) || norm(p.desc).includes(query);
  });

  function appendCard(p, extraClass = ""){
    const el = document.createElement("article");
    const classSuffix = extraClass ? ` ${extraClass}` : "";
    el.className = `card card--${p.cat || "item"}${classSuffix}`;
    const imgSrc = p.img || "./burger-placeholder.jpg";

    el.innerHTML = `
      <div class="card-head">
        <h3>${p.name}</h3>
      </div>

      <div class="thumb-wrap">
        <div class="thumb">
          <img src="${imgSrc}" alt="${p.name}">
        </div>
        <div class="price">${money(p.price)}</div>
      </div>

      <div class="card-body">
        <div class="desc">${p.desc}</div>

        <div class="card-bottom">
          <div class="tags">
            ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
          </div>

          <button class="addbtn" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name}">
            <span class="addbtn__label">Adicionar</span>
            <span class="addbtn__plus" aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(el);
  }

  function appendCategoryTitle(label){
    const title = document.createElement("div");
    title.className = "grid-group-title";
    title.textContent = label;
    grid.appendChild(title);
  }

  function appendEmpty(){
    const empty = document.createElement("p");
    empty.className = "grid-empty";
    empty.textContent = "Nenhum item encontrado para este filtro.";
    grid.appendChild(empty);
  }

  if(selectedCat === ""){
    const groups = [
      { id: "trad", label: "Burguers Tradicionais" },
      { id: "esp", label: "Burguers Especiais" },
      { id: "bebidas", label: "Bebidas" },
    ];

    let rendered = 0;
    groups.forEach(group => {
      const items = byQuery.filter(p => p.cat === group.id);
      if(items.length === 0) return;
      appendCategoryTitle(group.label);
      items.forEach((item, idx) => {
        const isLastOdd = items.length % 2 === 1 && idx === items.length - 1;
        appendCard(item, isLastOdd ? "card--last-odd" : "");
      });
      rendered += items.length;
    });

    if(rendered === 0) appendEmpty();
    return;
  }

  const list = byQuery.filter(p => p.cat === selectedCat);
  if(list.length === 0){
    appendEmpty();
    return;
  }

  list.forEach((item, idx) => {
    const isLastOdd = list.length % 2 === 1 && idx === list.length - 1;
    appendCard(item, isLastOdd ? "card--last-odd" : "");
  });
}

function syncCatsFromSelect(){
  if(!cat) return;
  const validCats = new Set(["trad","esp","bebidas"]);
  const v = validCats.has(cat.value) ? cat.value : "";
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
  if(cartCount() === 0) return;
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
      const customizable = canCustomizeProduct(p);
      const removeList = customizable
        ? (Array.isArray(p.removeOptions) ? p.removeOptions : [])
        : [];
      const extrasSource = customizable ? GLOBAL_EXTRAS : [];

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

      const extrasHtml = extrasSource.map(ex => {
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

      const hasCustomization = customizable && (removeHtml.length > 0 || extrasHtml.length > 0);
      const open = hasCustomization && !!line.ui?.open;

      const optionsButtonHtml = hasCustomization ? `
          <button class="cart-options-btn" type="button" data-toggle-custom="${line.uid}" aria-expanded="${open ? "true":"false"}">
            <span>Opções</span>
            <span class="optchev">›</span>
          </button>
      ` : "";

      const removeGroupHtml = removeHtml ? `
              <div class="inline-custom__group">
                <div class="inline-custom__label">Remover</div>
                <div class="custom-list">${removeHtml}</div>
              </div>
      ` : "";

      const extrasGroupHtml = extrasHtml ? `
              <div class="inline-custom__group">
                <div class="inline-custom__label">Adicionar (extras)</div>
                <div class="custom-list">${extrasHtml}</div>
              </div>
      ` : "";

      const customPanelHtml = hasCustomization ? `
        <div class="inline-custom" data-custom-panel="${line.uid}" ${open ? "" : "hidden"}>
          <div class="panel">
            <div class="panel-head">
              <strong class="panel-title">Opções do lanche</strong>
              <button type="button" class="iconbtn" data-close-custom="${line.uid}" aria-label="Fechar opções">✕</button>
            </div>

            <div class="inline-custom__sections">
              ${removeGroupHtml}
              ${extrasGroupHtml}
            </div>
          </div>
        </div>
      ` : "";

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

          ${optionsButtonHtml}
        </div>

        ${customPanelHtml}
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
  const canCustomize = canCustomizeProduct(p);

  cart.unshift({
    uid: genUid(),
    productId,
    qty: 1,
    custom: { remove: [], extras: {} },
    ui: { open: canCustomize } // abre opções ao adicionar (pode trocar para false)
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
  const p = getProduct(line.productId);
  if(!canCustomizeProduct(p)) return;

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
  const p = getProduct(line.productId);
  if(!canCustomizeProduct(p)) return;

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
  const note = String(orderNote || "").trim();
  const orderLines = cartLines().map(safe);

  const msg = [
    `Olá! Quero pedir no Bendito Burguer: ${BURGER_ICON}`,
    "",
    `• *Endereço:* ${safe(address.street)} — ${safe(address.district)} (${safe(address.city)})`,
    "",
    "• *Pedido:*",
    ...orderLines,
    "",
    ...(note ? [`• *Observação:* ${safe(note)}`, ""] : []),
    `• *Subtotal:* ${money(sub)}`,
    "",
    `• *Taxa:* ${money(f)}`,
    "",
    `• *Total:* ${money(total)}`,
    "",
    `• *Tempo:* ${eta}`,
    ""
  ].join("\n");

  window.open(wpp(msg), "_blank");
}

// =========================
// EVENTS
// =========================

// abrir endereço
$("openAddress")?.addEventListener("click", openAddrModal);

// CTAs do header (evita redundância entre "Pedir agora" e "Ver cardápio")
ctaOrderNow?.addEventListener("click", (e)=>{
  e.preventDefault();

  // Primeiro passo importante do delivery: confirmar endereço
  if(!address){
    openAddrModal();
    setTimeout(() => street?.focus?.(), 0);
    return;
  }

  // Se já houver itens, levar direto para finalização
  if(cartCount() > 0){
    openDrawer();
    return;
  }

  // Sem itens ainda: levar ao cardápio e focar a busca
  goToMenuAndFocusSearch();
});

ctaMenu?.addEventListener("click", (e)=>{
  e.preventDefault();
  goToMenuAndFocusSearch();
});

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

orderNoteInput?.addEventListener("input", ()=>{
  orderNote = String(orderNoteInput.value || "").slice(0, 280);
  if(orderNoteInput.value !== orderNote) orderNoteInput.value = orderNote;
  saveState();
});

// busca/filtro
q?.addEventListener("input", renderProducts);
cat?.addEventListener("change", ()=>{
  syncCatsFromSelect();
  renderProducts();
  scrollToMenu();
});

// chips
document.querySelectorAll(".cat").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    if(cat) cat.value = btn.dataset.cat || "";
    syncCatsFromSelect();
    renderProducts();
    scrollToMenu();
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
