/* ==========================================================================
   Cart — persisted in localStorage so it survives navigation between
   pages (index → shop → product → cart → checkout).
   ========================================================================== */

const CART_KEY = "strdust_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: (product.images && product.images[0]) || "",
      category: product.category,
      qty: qty
    });
  }
  saveCart(cart);
  showToast(`${product.name} কার্টে যোগ হয়েছে`);
}

function updateQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(item => item.id !== productId);
  } else {
    const item = cart.find(i => i.id === productId);
    if (item) item.qty = qty;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.qty * item.price, 0);
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const count = getCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* Toast + invoice helpers used across pages */

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SD-${y}${m}${d}-${rand}`;
}

function formatTaka(amount) {
  return "৳" + Number(amount).toLocaleString("en-BD");
}

/* Site-wide theme — admin can override accent color + homepage hero text
   from Dashboard → থিম. Applies on every page load. */
async function applyTheme() {
  try {
    const doc = await db.collection("settings").doc("site").get();
    if (!doc.exists) return;
    const t = doc.data();
    if (t.accentColor) document.documentElement.style.setProperty("--aqua", t.accentColor);
    const badgeEl = document.getElementById("heroBadge");
    if (badgeEl && t.heroBadge) badgeEl.textContent = t.heroBadge;
    const subEl = document.getElementById("heroSubText");
    if (subEl && t.heroSub) subEl.textContent = t.heroSub;
  } catch (e) { /* firebase not configured yet, or no theme saved */ }
}

/* -------------------------------------------------------------------------
   Bengali / English toggle — shared across every page. Elements with
   data-bn + data-en attributes get swapped automatically; pages/sections
   that don't have those attributes yet simply stay as-is.
   ------------------------------------------------------------------------- */
function currentLang() {
  return localStorage.getItem("strdust_lang") || "bn";
}

function applyStaticTranslations(lang) {
  document.querySelectorAll("[data-bn]").forEach(el => {
    const val = lang === "en" ? (el.dataset.en ?? el.dataset.bn) : el.dataset.bn;
    el.innerHTML = val;
  });
  document.querySelectorAll("[data-bn-ph]").forEach(el => {
    el.placeholder = lang === "en" ? (el.dataset.enPh ?? el.dataset.bnPh) : el.dataset.bnPh;
  });
  document.documentElement.lang = lang === "en" ? "en" : "bn";
}

function setLanguage(lang) {
  localStorage.setItem("strdust_lang", lang);
  applyStaticTranslations(lang);
  const btn = document.getElementById("langToggle");
  if (btn) btn.textContent = lang === "en" ? "বাং" : "EN";
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

function toggleLanguage() {
  setLanguage(currentLang() === "bn" ? "en" : "bn");
}

document.addEventListener("DOMContentLoaded", () => {
  const lang = currentLang();
  applyStaticTranslations(lang);
  const btn = document.getElementById("langToggle");
  if (btn) {
    btn.textContent = lang === "en" ? "বাং" : "EN";
    btn.addEventListener("click", toggleLanguage);
  }
});

document.addEventListener("DOMContentLoaded", updateCartBadge);
document.addEventListener("DOMContentLoaded", applyTheme);
