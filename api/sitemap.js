const admin = require("firebase-admin");

const SITE_URL = "https://strdustshop.vercel.app";

// Only include canonical, indexable landing pages here.
// Category filters currently live at /shop.html?category=... and the
// shop page canonicalizes those variants to /shop.html, so listing them
// separately would create duplicate canonical URLs.
// Order tracking is a utility page, not a search landing page.
const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop.html", changefreq: "daily", priority: "0.9" },
];

// Initialize Firebase Admin lazily so missing Vercel environment variables
// produce a controlled 500 response instead of a module-load crash.
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
        // Vercel env vars may store newline characters as literal \\n.
        privateKey: privateKey.replace(/\\\\n/g, "\\n"),
      }),
    });
  }

  return admin.firestore();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Keeps Bengali, English, and mixed product names URL-safe.
// The product id remains authoritative; the slug is descriptive only.
function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^\\p{L}\\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function urlEntry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

module.exports = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("products").get();

    // The storefront currently renders every document in the products
    // collection, so include every product document rather than guessing
    // at an unpublished/active field that the app does not consistently use.
    const productEntries = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const slug = slugify(data.name);
      const loc = `${SITE_URL}/product/${doc.id}${slug ? "/" + encodeURIComponent(slug) : ""}`;
      return urlEntry(loc, "weekly", "0.8");
    });

    const staticEntries = STATIC_PAGES.map((page) =>
      urlEntry(`${SITE_URL}${page.loc}`, page.changefreq, page.priority)
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries.concat(productEntries).join("\n")}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation failed:", err.message);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(500).send("Sitemap generation failed. Check the server configuration.");
  }
};
