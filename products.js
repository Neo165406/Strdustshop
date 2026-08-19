/* ==========================================================================
   Product fetch + render helpers shared by index / shop / product pages
   ========================================================================== */
 
async function fetchProducts({ category = null, sort = "new", max = 60 } = {}) {
  let ref = db.collection("products");
  if (category) ref = ref.where("category", "==", category);
  const snap = await ref.get();
  let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (sort === "price-low") items.sort((a, b) => a.price - b.price);
  else if (sort === "price-high") items.sort((a, b) => b.price - a.price);
  else items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return items.slice(0, max);
}

async function fetchProductById(id) {
  const doc = await db.collection("products").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

function productCardHTML(p) {
  const img = (p.images && p.images[0]) || "";
  const cat = categoryById(p.category);
  const lang = currentLang();
  const catLabel = lang === "en" ? cat.label : cat.bn;
  const hasDiscount = p.originalPrice && p.originalPrice > p.price;
  const out = p.stock !== undefined && p.stock <= 0;
  const outLabel = lang === "en" ? "Out of Stock" : "স্টক নেই";
  const saleLabel = lang === "en" ? "Sale" : "সেল";
  const addLabel = lang === "en" ? "Add to cart" : "কার্টে যোগ করুন";
  return `
    <a href="product.html?id=${p.id}" class="card">
      <div class="card-media">
        ${img ? `<img src="${img}" alt="${p.name}" loading="lazy">` : `<div class="skeleton" style="position:absolute;inset:0;"></div>`}
        ${out ? `<span class="badge badge-out">${outLabel}</span>` : hasDiscount ? `<span class="badge badge-aqua">${saleLabel}</span>` : ""}
        <span class="card-quickadd" onclick="event.preventDefault(); event.stopPropagation(); quickAdd('${p.id}')" aria-label="${addLabel}">+</span>
      </div>
      <div class="card-body">
        <span class="card-cat">${catLabel}</span>
        <span class="card-title">${p.name}</span>
        <div class="card-price-row">
          <span class="card-price">${formatTaka(p.price)}</span>
          ${hasDiscount ? `<span class="card-price-old">${formatTaka(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </a>`;
}

async function quickAdd(productId) {
  const p = await fetchProductById(productId);
  if (p) addToCart(p, 1);
}

function renderGrid(container, items, emptyMsg = "এখানে এখনো কোনো প্রোডাক্ট নেই") {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><h3>কিছু পাওয়া যায়নি</h3><p>${emptyMsg}</p></div>`;
    return;
  }
  container.innerHTML = items.map(productCardHTML).join("");
}

function renderSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="card"><div class="skeleton" style="aspect-ratio:1;"></div><div style="padding:14px;"><div class="skeleton" style="height:12px;width:60%;margin-bottom:8px;"></div><div class="skeleton" style="height:14px;width:85%;"></div></div></div>`)
    .join("");
}

/* -------------------------------------------------------------------------
   Mobile nav toggle — shared across every storefront page
   ------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
}
document.addEventListener("DOMContentLoaded", initNav);

/* -------------------------------------------------------------------------
   Hero slider — homepage only. Reads slides from Firestore "slides"
   collection if present, otherwise falls back to defaults below.
   ------------------------------------------------------------------------- */
async function initHeroSlider() {
  const track = document.getElementById("sliderTrack");
  const dotsWrap = document.getElementById("sliderDots");
  if (!track) return;

  let slides = [];
  try {
    const snap = await db.collection("slides").orderBy("order").get();
    slides = snap.docs.map(d => d.data());
  } catch (e) { /* collection may not exist yet — fall back below */ }

  if (!slides.length) {
    slides = [
      { image: "", eyebrow: "নতুন এসেছে", title: "নতুন কালেকশনে সব ক্যাটাগরি এক জায়গায়" },
      { image: "", eyebrow: "ফ্রি হোম ডেলিভারি", title: "ঢাকার ভেতরে ১-৩ দিনে ডেলিভারি" },
      { image: "", eyebrow: "COD সুবিধা", title: "হাতে পেয়ে টাকা দিন, ঝুঁকি নেই" }
    ];
  }

  track.innerHTML = slides.map((s, i) => `
    <div class="slide ${i === 0 ? "active" : ""}" style="${s.image ? `background-image:url('${s.image}')` : `background:linear-gradient(135deg,#0A8F76,#0B1210)`}">
      <div class="slide-content">
        <span class="eyebrow">${s.eyebrow || ""}</span>
        <h3>${s.title || ""}</h3>
      </div>
    </div>`).join("");

  dotsWrap.innerHTML = slides.map((_, i) => `<button class="${i === 0 ? "active" : ""}" data-i="${i}"></button>`).join("");

  let current = 0;
  const slideEls = track.querySelectorAll(".slide");
  const dotEls = dotsWrap.querySelectorAll("button");

  function goTo(i) {
    const priorIndex = current;
    slideEls.forEach((el, idx) => {
      el.classList.remove("active", "prev");
      if (idx === priorIndex) el.classList.add("prev");
    });
    dotEls[current].classList.remove("active");
    current = i;
    slideEls[current].classList.add("active");
    dotEls[current].classList.add("active");
  }

  dotEls.forEach(dot => dot.addEventListener("click", () => goTo(Number(dot.dataset.i))));

  if (slides.length > 1) {
    setInterval(() => goTo((current + 1) % slides.length), 5000);
  }
}
function buildCategoryGrid() {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;
  const lang = currentLang();
  grid.innerHTML = CATEGORIES.map(cat => {
    const label = lang === "en" ? cat.label : cat.bn;
    return `<a href="shop.html?category=${cat.id}" class="cat-grid-item">
      <img src="${cat.thumb || ''}" alt="${label}" onerror="this.style.display='none'">
      <span>${label}</span>
    </a>`;
  }).join("");
}
