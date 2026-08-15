const admin = require("firebase-admin");

const SITE_URL = "https://strdustshop.vercel.app";

// Static pages that always exist, regardless of products
const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop.html", changefreq: "daily", priority: "0.9" },
  { loc: "/shop.html?category=tshirt", changefreq: "weekly", priority: "0.7" },
  { loc: "/shop.html?category=gadget", changefreq: "weekly", priority: "0.7" },
  { loc: "/shop.html?category=perfume", changefreq: "weekly", priority: "0.7" },
  { loc: "/shop.html?category=pant", changefreq: "weekly", priority: "0.7" },
  { loc: "/shop.html?category=watch", changefreq: "weekly", priority: "0.7" },
  { loc: "/shop.html?category=jewelry", changefreq: "weekly", priority: "0.7" },
  { loc: "/track-order.html", changefreq: "monthly", priority: "0.4" },
];

// Initialize Firebase Admin once (Vercel reuses the function instance across requests)
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

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

module.exports = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("products").get();

    const productEntries = snapshot.docs.map((doc) =>
      urlEntry(`${SITE_URL}/product.html?id=${doc.id}`, "weekly", "0.8")
    );

    const staticEntries = STATIC_PAGES.map((p) =>
      urlEntry(`${SITE_URL}${p.loc}`, p.changefreq, p.priority)
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries.join("\n")}\n${productEntries.join("\n")}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    // Cache for 1 hour at the edge, serve stale for a day while revalidating in background
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation failed:", err);
    res.status(500).send("Sitemap generation failed");
  }
};
