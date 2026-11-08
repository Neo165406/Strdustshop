const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const SITE_URL = "https://strdustshop.vercel.app";
const CATEGORIES = {
  tshirt: { bn: "টি-শার্ট", en: "T-Shirts", titleBn: "টি-শার্ট কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy T-Shirts Online in Bangladesh | StrDust", descBn: "StrDust থেকে অনলাইনে টি-শার্ট কিনুন। প্রিন্টেড ও ক্যাজুয়াল টি-শার্ট কালেকশন, সারা বাংলাদেশে ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা।", descEn: "Shop printed and casual t-shirts at StrDust. Browse the collection with delivery across Bangladesh and cash on delivery." },
  gadget: { bn: "গ্যাজেট", en: "Gadgets", titleBn: "গ্যাজেট কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Gadgets Online in Bangladesh | StrDust", descBn: "StrDust-এর গ্যাজেট ও টেক অ্যাক্সেসরিজ কালেকশন দেখুন। বাংলাদেশজুড়ে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।", descEn: "Explore gadgets and tech accessories at StrDust, with delivery across Bangladesh and cash on delivery." },
  perfume: { bn: "পারফিউম", en: "Perfume", titleBn: "পারফিউম কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Perfume Online in Bangladesh | StrDust", descBn: "StrDust-এর পারফিউম কালেকশন দেখুন। পছন্দের সুগন্ধি বেছে নিন, বাংলাদেশজুড়ে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধাসহ।", descEn: "Explore the perfume collection at StrDust. Choose your fragrance with delivery across Bangladesh and cash on delivery." },
  pant: { bn: "প্যান্ট", en: "Pants", titleBn: "প্যান্ট কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Pants Online in Bangladesh | StrDust", descBn: "StrDust থেকে অনলাইনে প্যান্ট কিনুন। কালেকশন দেখুন এবং সারা বাংলাদেশে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা নিন।", descEn: "Shop pants online at StrDust, with delivery across Bangladesh and cash on delivery." },
  watch: { bn: "ঘড়ি", en: "Watches", titleBn: "ঘড়ি কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Watches Online in Bangladesh | StrDust", descBn: "StrDust-এর ঘড়ির কালেকশন দেখুন। বাংলাদেশজুড়ে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।", descEn: "Explore watches at StrDust, with delivery across Bangladesh and cash on delivery." },
  jewelry: { bn: "জুয়েলারি", en: "Jewelry", titleBn: "জুয়েলারি কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Jewelry Online in Bangladesh | StrDust", descBn: "StrDust-এর জুয়েলারি কালেকশন দেখুন। পছন্দের ডিজাইন বেছে নিন, সারা বাংলাদেশে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধাসহ।", descEn: "Explore the jewelry collection at StrDust, with delivery across Bangladesh and cash on delivery." },
  footwear: { bn: "জুতা", en: "Footwear", titleBn: "জুতা কিনুন অনলাইনে বাংলাদেশে | StrDust", titleEn: "Buy Footwear Online in Bangladesh | StrDust", descBn: "StrDust-এর ফুটওয়্যার কালেকশন দেখুন। লোফার ও বুটসহ উপলভ্য জুতার ডিজাইন বেছে নিন, বাংলাদেশজুড়ে ডেলিভারিসহ।", descEn: "Explore footwear at StrDust, including available loafer and boot styles, with delivery across Bangladesh." }
};

function getFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin environment variables are not configured");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  return admin.firestore();
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function money(value) {
  return "৳" + Number(value || 0).toLocaleString("en-US");
}
module.exports = async (req, res) => {
  const category = String(req.query.category || "").toLowerCase();
  const config = CATEGORIES[category];
  if (!config) return res.status(404).send("Category not found");
  try {
    const template = fs.readFileSync(path.join(process.cwd(), "shop.html"), "utf8");
    const db = getFirestore();
    const snap = await db.collection("products").where("category", "==", category).get();
    if (snap.empty) {
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return res.status(404).send("This category currently has no products.");
    }
    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const cards = products.map(p => {
      const image = p.images && p.images[0] ? '<img src="' + escapeHtml(p.images[0]) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' : "";
      const url = SITE_URL + "/product/" + encodeURIComponent(p.id) + (slugify(p.name) ? "/" + encodeURIComponent(slugify(p.name)) : "");
      const out = p.stock !== undefined && p.stock <= 0;
      return '<a href="' + escapeHtml(url) + '" class="card"><div class="card-media">' + image +
        (out ? '<span class="badge badge-out">স্টক নেই</span>' : '') +
        '</div><div class="card-body"><span class="card-cat">' + escapeHtml(config.bn) +
        '</span><span class="card-title">' + escapeHtml(p.name) +
        '</span><div class="card-price-row"><span class="card-price">' + money(p.price) +
        '</span></div></div></a>';
    }).join("");
    const title = config.titleBn;
    const canonical = SITE_URL + "/category/" + category;
    const intro = config.descBn;
    let html = template;
    html = html.replace(/<title>.*?<\\/title>/, "<title>" + escapeHtml(title) + "</title>");
    html = html.replace(/<meta name="description" content=".*?">/, '<meta name="description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<link rel="canonical" href=".*?">/, '<link rel="canonical" href="' + canonical + '">');
    html = html.replace(/<meta property="og:title" content=".*?">/, '<meta property="og:title" content="' + escapeHtml(title) + '">');
    html = html.replace(/<meta property="og:description" content=".*?">/, '<meta property="og:description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<meta property="og:url" content=".*?">/, '<meta property="og:url" content="' + canonical + '">');
    html = html.replace(/<meta name="twitter:title" content=".*?">/, '<meta name="twitter:title" content="' + escapeHtml(title) + '">');
    html = html.replace(/<meta name="twitter:description" content=".*?">/, '<meta name="twitter:description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<h1[^>]*id="pageTitle"[^>]*>.*?<\\/h1>/, '<h1 style="margin:6px 0 10px;font-size:clamp(24px,3.4vw,32px);" id="pageTitle">' + escapeHtml(config.bn) + '</h1>');
    html = html.replace(/<p id="pageIntro"[^>]*>.*?<\\/p>/, '<p id="pageIntro" style="max-width:62ch;color:var(--gray-light,#6b7280);font-size:14.5px;line-height:1.6;margin:0 0 24px;">' + escapeHtml(intro) + '</p>');
    html = html.replace('<div class="product-grid" id="shopGrid" style="margin-bottom:64px;"></div>', '<div class="product-grid" id="shopGrid" style="margin-bottom:64px;">' + cards + '</div>');
    const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url: canonical, description: config.descBn, isPartOf: { "@type": "WebSite", name: "StrDust", url: SITE_URL + "/" } };
    html = html.replace("</head>", '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, "\\u003c") + '</script><script>window.__STRDUST_CATEGORY__=' + JSON.stringify(category) + ';</script></head>');
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Category page render failed:", error.message);
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Category page temporarily unavailable.");
  }
};
