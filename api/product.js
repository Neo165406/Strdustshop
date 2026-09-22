const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const SITE_URL = "https://strdustshop.vercel.app";

// Fallback Bengali category labels — used only if a product's category
// isn't recognized. Mirrors the labels in products.js.
const CATEGORY_LABELS = {
  tshirt: "টি-শার্ট",
  gadget: "গ্যাজেট",
  perfume: "পারফিউম",
  pant: "প্যান্ট",
  watch: "ঘড়ি",
  jewelry: "জুয়েলারি",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel env vars store \n as literal characters, so convert back to real newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTaka(n) {
  return `৳${Number(n || 0).toLocaleString("en-US")}`;
}

// Swap the value of one specific tag in the static template for the real,
// per-product value. Each replace targets a tag by its unique id attribute
// so this can't accidentally touch an unrelated tag with similar content.
function setTagContent(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

module.exports = async (req, res) => {
  const id = req.query.id;
  const templatePath = path.join(process.cwd(), "product.html");
  let html;

  try {
    html = fs.readFileSync(templatePath, "utf8");
  } catch (err) {
    console.error("Could not read product.html template:", err);
    res.status(500).send("Template not found");
    return;
  }

  // No id in the query string — just serve the static template as-is,
  // client-side JS will show its own "product not found" state.
  if (!id) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
    return;
  }

  try {
    const db = admin.firestore();
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      // Unknown product id — serve the fallback template with a 404 status
      // so crawlers know not to index this URL. Client JS still renders
      // the "not found" UI for human visitors.
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(html);
      return;
    }

    const p = { id: doc.id, ...doc.data() };
    const catLabel = CATEGORY_LABELS[p.category] || p.category || "";
    const pageUrl = `${SITE_URL}/product.html?id=${p.id}`;
    const image = (p.images && p.images[0]) ? p.images[0] : `${SITE_URL}/og-image.jpg`;

    const title = `${p.name} — ${catLabel} | StrDust`;
    const rawDesc = p.description
      ? String(p.description).replace(/\s+/g, " ").trim()
      : `${p.name} কিনুন StrDust থেকে, দাম ${formatTaka(p.price)}। ঢাকায় ১-৩ দিনে ডেলিভারি, ক্যাশ অন ডেলিভারি সুবিধাসহ।`;
    const desc = rawDesc.length > 155 ? rawDesc.slice(0, 152) + "..." : rawDesc;

    const inStock = p.stock === undefined || p.stock > 0;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: desc,
      image: (p.images && p.images.length) ? p.images : [image],
      sku: p.id,
      category: catLabel,
      offers: {
        "@type": "Offer",
        url: pageUrl,
        priceCurrency: "BDT",
        price: p.price,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };

    const eTitle = escapeHtml(title);
    const eDesc = escapeHtml(desc);
    const eImage = escapeHtml(image);
    const eUrl = escapeHtml(pageUrl);

    html = setTagContent(html, /<title id="pageTitleTag">.*?<\/title>/, `<title id="pageTitleTag">${eTitle}</title>`);
    html = setTagContent(html, /<meta name="description" id="metaDescTag" content=".*?">/, `<meta name="description" id="metaDescTag" content="${eDesc}">`);
    html = setTagContent(html, /<link rel="canonical" id="canonicalTag" href=".*?">/, `<link rel="canonical" id="canonicalTag" href="${eUrl}">`);
    html = setTagContent(html, /<meta property="og:title" id="ogTitleTag" content=".*?">/, `<meta property="og:title" id="ogTitleTag" content="${eTitle}">`);
    html = setTagContent(html, /<meta property="og:description" id="ogDescTag" content=".*?">/, `<meta property="og:description" id="ogDescTag" content="${eDesc}">`);
    html = setTagContent(html, /<meta property="og:image" id="ogImageTag" content=".*?">/, `<meta property="og:image" id="ogImageTag" content="${eImage}">`);
    html = setTagContent(html, /<meta property="og:url" id="ogUrlTag" content=".*?">/, `<meta property="og:url" id="ogUrlTag" content="${eUrl}">`);
    html = setTagContent(html, /<meta name="twitter:title" id="twTitleTag" content=".*?">/, `<meta name="twitter:title" id="twTitleTag" content="${eTitle}">`);
    html = setTagContent(html, /<meta name="twitter:description" id="twDescTag" content=".*?">/, `<meta name="twitter:description" id="twDescTag" content="${eDesc}">`);
    html = setTagContent(html, /<meta name="twitter:image" id="twImageTag" content=".*?">/, `<meta name="twitter:image" id="twImageTag" content="${eImage}">`);
    html = setTagContent(
      html,
      /<script type="application\/ld\+json" id="productSchema"><\/script>/,
      `<script type="application/ld+json" id="productSchema">${JSON.stringify(schema)}</script>`
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Cache at the edge for 30 min, serve stale for a day while revalidating —
    // same pattern as api/sitemap.js
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (err) {
    console.error("Product meta render failed:", err);
    // Fail open: serve the static template so the page still works.
    // Client-side updateSeoTags() will still fill in the real tags for
    // human visitors even if this server-side step failed.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  }
};
