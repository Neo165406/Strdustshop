/* ==========================================================================
   Firebase config — REPLACE WITH YOUR OWN PROJECT KEYS
   --------------------------------------------------------------------------
   1. Go to console.firebase.google.com → create a project (e.g. "strdust")
   2. Add a Web App inside that project → copy the config object it gives you
   3. Paste those values below, replacing every "YOUR_..." placeholder
   4. Enable Firestore Database (start in production mode)
   5. Enable Authentication → Sign-in method → Email/Password
      (this is how the admin panel logs in — no hardcoded password this time)
   6. Create one admin user under Authentication → Users, and use that
      email/password to log into /admin/login.html
   7. In Firestore → Rules, paste the ruleset from README.md before going live
   ========================================================================== */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* imgbb — used by the admin panel to host product photos.
   Get a free key at api.imgbb.com, paste it here. */
const IMGBB_API_KEY = "YOUR_IMGBB_KEY";

/* The 6 categories StrDust sells. Adding a 7th later? Add it here —
   every page (nav, filters, admin dropdown) reads from this one list. */
const CATEGORIES = [
  { id: "tshirt",   label: "T-Shirt",   bn: "টি-শার্ট",  icon: "👕" },
  { id: "gadget",   label: "Gadgets",   bn: "গ্যাজেট",   icon: "🎧" },
  { id: "perfume",  label: "Perfume",   bn: "পারফিউম",   icon: "🧴" },
  { id: "pant",     label: "Pants",     bn: "প্যান্ট",    icon: "👖" },
  { id: "watch",    label: "Watches",   bn: "ঘড়ি",      icon: "⌚" },
  { id: "jewelry",  label: "Jewelry",   bn: "জুয়েলারি",  icon: "💎" }
];

function categoryById(id) {
  return CATEGORIES.find(c => c.id === id) || { label: id, bn: id, icon: "🛍️" };
}
