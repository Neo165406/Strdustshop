/* ==========================================================================
   Firebase config — StrDust
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCceSf_fLPQ6n2lVyY09d91_acgr2xZAfY",
  authDomain: "strdustshop.firebaseapp.com",
  projectId: "strdustshop",
  storageBucket: "strdustshop.firebasestorage.app",
  messagingSenderId: "790957548178",
  appId: "1:790957548178:web:a34dbab92be79d29fcfc4b",
  measurementId: "G-17XGSR1ZS5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* imgbb — used by the admin panel to host product photos.
   Get a free key at api.imgbb.com, paste it here. */
const IMGBB_API_KEY = "867905756e321b49b3863490c9714674";

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

