const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const SITE_URL = "https://strdustshop.vercel.app";
const CATEGORIES = {
  tshirt: { bn: "টি-শার্ট", en: "T-Shirts", titleBn: "টি-শার্ট অনলাইনে বাংলাদেশে | StrDust", titleEn: "T-Shirts Online in Bangladesh | StrDust", descBn: "StrDust-এর টি-শার্ট ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the T-shirts listed at StrDust. Check each product page for its details and current price." },
  gadget: { bn: "গ্যাজেট", en: "Gadgets", titleBn: "গ্যাজেট অনলাইনে বাংলাদেশে | StrDust", titleEn: "Gadgets Online in Bangladesh | StrDust", descBn: "StrDust-এর গ্যাজেট ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the gadgets listed at StrDust. Check each product page for its details and current price." },
  perfume: { bn: "পারফিউম", en: "Perfume", titleBn: "পারফিউম অনলাইনে বাংলাদেশে | StrDust", titleEn: "Perfume Online in Bangladesh | StrDust", descBn: "StrDust-এর পারফিউম ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the perfumes listed at StrDust. Check each product page for its details and current price." },
  pant: { bn: "প্যান্ট", en: "Pants", titleBn: "প্যান্ট অনলাইনে বাংলাদেশে | StrDust", titleEn: "Pants Online in Bangladesh | StrDust", descBn: "StrDust-এর প্যান্ট ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the pants listed at StrDust. Check each product page for its details and current price." },
  watch: { bn: "ঘড়ি", en: "Watches", titleBn: "ঘড়ি অনলাইনে বাংলাদেশে | StrDust", titleEn: "Watches Online in Bangladesh | StrDust", descBn: "StrDust-এর ঘড়ি ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the watches listed at StrDust. Check each product page for its details and current price." },
  jewelry: { bn: "জুয়েলারি", en: "Jewelry", titleBn: "জুয়েলারি অনলাইনে বাংলাদেশে | StrDust", titleEn: "Jewelry Online in Bangladesh | StrDust", descBn: "StrDust-এর জুয়েলারি ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the jewelry listed at StrDust. Check each product page for its details and current price." },
  footwear: { bn: "জুতা", en: "Footwear", titleBn: "জুতা অনলাইনে বাংলাদেশে | StrDust", titleEn: "Footwear Online in Bangladesh | StrDust", descBn: "StrDust-এর জুতা ক্যাটাগরির পণ্যগুলো দেখুন। প্রতিটি পণ্যের বিবরণ ও বর্তমান দাম পণ্যের পৃষ্ঠায় পাওয়া যাবে।", descEn: "Browse the footwear listed at StrDust. Check each product page for its details and current price." }
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
  return String(value || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function money(value) {
  return "৳" + Number(value || 0).toLocaleString("en-US");
}
module.exports = async (req, res) => {
  // Vercel rewrites can expose the route parameter either as a query value
  // or retain the original clean path. Support both forms so /category/watch
  // does not fail with "Category not found" when the query is omitted.
  let categoryValue = req.query && req.query.category;
  if (Array.isArray(categoryValue)) categoryValue = categoryValue[0];
  if (!categoryValue && req.url) {
    try {
      const parsedUrl = new URL(req.url, "https://strdustshop.vercel.app");
      categoryValue = parsedUrl.searchParams.get("category");
      if (!categoryValue) {
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
        if (pathParts[0] && pathParts[0].toLowerCase() === "category" && pathParts[1]) {
          categoryValue = decodeURIComponent(pathParts[1]);
        }
      }
    } catch (_) {}
  }
  const category = String(categoryValue || "").trim().toLowerCase();
  const config = CATEGORIES[category];
  if (!config) return res.status(404).send("Category not found");
  try {
    const template = fs.readFileSync(path.join(process.cwd(), "shop.html"), "utf8");
    const db = getFirestore();
    const snap = await db.collection("products").get();
    const matchingDocs = snap.docs.filter((doc) => String((doc.data() || {}).category || "").trim().toLowerCase() === category);
    if (!matchingDocs.length) {
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return res.status(404).send("This category currently has no products.");
    }
    const products = matchingDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    const cards = products.map(p => {
      const image = p.images && p.images[0] ? '<img src="' + escapeHtml(p.images[0]) + '" alt="' + escapeHtml(p.name + " - " + config.bn) + '" loading="lazy">' : "";
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
    let html = template.replace("<head>", '<head>\n<base href="/">').replace("<body>", '<body class="category-page">');
    const breadcrumbHtml = '<nav aria-label="Breadcrumb" style="font-size:12px;color:#647184;margin:0 0 16px;display:flex;gap:8px;flex-wrap:wrap;"><a href="/" style="color:inherit;text-decoration:none;">হোম</a><span aria-hidden="true">›</span><a href="/shop.html" style="color:inherit;text-decoration:none;">সব প্রোডাক্ট</a><span aria-hidden="true">›</span><span aria-current="page">' + escapeHtml(config.bn) + '</span></nav>';
    html = html.replace('<span class="eyebrow" id="pageEyebrow">', breadcrumbHtml + '<span class="eyebrow" id="pageEyebrow">');
    html = html.replace(/<title>.*?<\/title>/, "<title>" + escapeHtml(title) + "</title>");
    html = html.replace(/<meta name="description" content=".*?">/, '<meta name="description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<link rel="canonical" href=".*?">/, '<link rel="canonical" href="' + canonical + '">');
    html = html.replace(/<meta property="og:title" content=".*?">/, '<meta property="og:title" content="' + escapeHtml(title) + '">');
    html = html.replace(/<meta property="og:description" content=".*?">/, '<meta property="og:description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<meta property="og:url" content=".*?">/, '<meta property="og:url" content="' + canonical + '">');
    html = html.replace(/<meta name="twitter:title" content=".*?">/, '<meta name="twitter:title" content="' + escapeHtml(title) + '">');
    html = html.replace(/<meta name="twitter:description" content=".*?">/, '<meta name="twitter:description" content="' + escapeHtml(config.descBn) + '">');
    html = html.replace(/<h1[^>]*id="pageTitle"[^>]*>.*?<\/h1>/, '<h1 style="margin:6px 0 10px;font-size:clamp(24px,3.4vw,32px);" id="pageTitle">' + escapeHtml(config.bn) + '</h1>');
    html = html.replace(/<p id="pageIntro"[^>]*>.*?<\/p>/, '<p id="pageIntro" style="max-width:62ch;color:var(--gray-light,#6b7280);font-size:14.5px;line-height:1.6;margin:0 0 24px;">' + escapeHtml(intro) + '</p>');
    html = html.replace('<div class="product-grid" id="shopGrid" style="margin-bottom:64px;"></div>', '<div class="product-grid" id="shopGrid" style="margin-bottom:64px;">' + cards + '</div>');
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: title,
          url: canonical,
          description: config.descBn,
          isPartOf: { "@type": "WebSite", name: "StrDust", url: SITE_URL + "/" },
          breadcrumb: { "@id": canonical + "#breadcrumb" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "হোম", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: "সব প্রোডাক্ট", item: SITE_URL + "/shop.html" },
            { "@type": "ListItem", position: 3, name: config.bn, item: canonical }
          ]
        }
      ]
    };
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
