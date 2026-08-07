# StrDust — সেটআপ গাইড

৬টা ক্যাটাগরি (টি-শার্ট, গ্যাজেট, পারফিউম, প্যান্ট, ঘড়ি, জুয়েলারি) নিয়ে একটা মাল্টি-ক্যাটাগরি স্টোর। স্ট্যাক Velmora-র মতোই — Firebase/Firestore + vanilla HTML/CSS/JS, Netlify-তে ডিপ্লয়যোগ্য।

## ১. Firebase প্রজেক্ট বানান
1. console.firebase.google.com → নতুন প্রজেক্ট (যেমন "strdust")
2. প্রজেক্টের ভেতরে একটা Web App যোগ করুন → যে config অবজেক্ট দেবে সেটা কপি করুন
3. `js/firebase-config.js` ফাইলে `firebaseConfig` এর ভেতরে সেই ভ্যালুগুলো বসান

## ২. Firestore চালু করুন
Firestore Database → Create database → production mode-এ শুরু করুন। এরপর **Rules** ট্যাবে গিয়ে এটা বসান:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /slides/{slideId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

এতে যে কেউ প্রোডাক্ট দেখতে পারবে আর অর্ডার বসাতে পারবে, কিন্তু প্রোডাক্ট এডিট বা অর্ডার স্ট্যাটাস বদলাতে পারবে শুধু লগইন করা অ্যাডমিন।

## ৩. Authentication চালু করুন (অ্যাডমিন লগইন)
1. Authentication → Sign-in method → **Email/Password** চালু করুন
2. Authentication → Users → একটা ইউজার বানান (আপনার ইমেইল + একটা শক্ত পাসওয়ার্ড)
3. সেটা দিয়েই `/admin/login.html` থেকে লগইন করবেন

Velmora-তে যেভাবে `admin` / `velmora2026` হার্ডকোড করা ছিল, এখানে সেটা নেই — আসল Firebase Authentication ব্যবহার হচ্ছে, তাই পাসওয়ার্ড কোডে কোথাও লেখা নেই।

## ৪. imgbb (প্রোডাক্ট ছবি হোস্টিং)
1. api.imgbb.com থেকে ফ্রি API key নিন
2. `js/firebase-config.js` এ `IMGBB_API_KEY` বসান

## ৫. Netlify-তে ডিপ্লয়
পুরো `strdust` ফোল্ডারটা Netlify-তে drag-and-drop করুন, অথবা GitHub রিপোতে পুশ করে কানেক্ট করুন — Velmora যেভাবে করেছেন ঠিক সেভাবেই।

## ৬. প্রথমবার চালু করার সময়
1. `/admin/login.html` এ লগইন করুন
2. ওভারভিউ ট্যাবে **"🌱 ডেমো প্রোডাক্ট যোগ করুন"** চাপুন — ৬ ক্যাটাগরিতে ১২টা placeholder প্রোডাক্ট বসে যাবে যাতে সাইটটা খালি না দেখায়
3. প্রোডাক্ট ট্যাব থেকে একে একে Edit করে আসল ছবি (imgbb-তে আপলোড হবে), দাম আর বিবরণ বসান
4. ডেমো প্রোডাক্টগুলো না চাইলে Delete করে দিন

## ফাইল স্ট্রাকচার
```
strdust/
├── index.html            হোম — hero slider + constellation ক্যাটাগরি নেভ
├── shop.html              সব প্রোডাক্ট, ক্যাটাগরি ফিল্টার + সর্ট
├── product.html           প্রোডাক্ট ডিটেইল পেজ
├── cart.html              কার্ট
├── checkout.html          COD চেকআউট (Firestore-এ অর্ডার সেভ হয়, ইনভয়েস জেনারেট করে)
├── track-order.html       ইনভয়েস নাম্বার দিয়ে অর্ডার ট্র্যাক
├── admin/
│   ├── login.html          Firebase Auth লগইন
│   └── dashboard.html      প্রোডাক্ট CRUD + ছবি আপলোড + অর্ডার স্ট্যাটাস ম্যানেজমেন্ট
├── css/style.css           পুরো ডিজাইন সিস্টেম (aqua green / white / black)
└── js/
    ├── firebase-config.js  ← এখানে আপনার Firebase + imgbb key বসাতে হবে
    ├── cart.js              localStorage-ভিত্তিক কার্ট (পেজ পাল্টালেও থাকে)
    └── products.js          প্রোডাক্ট fetch/render, স্লাইডার, মোবাইল নেভ
```

## যা যোগ করা যায় পরে
- হোমপেজ স্লাইডারের জন্য কাস্টম স্লাইড — Firestore-এ `slides` কালেকশনে ডকুমেন্ট বানালেই (`image`, `eyebrow`, `title`, `order` ফিল্ড দিয়ে) ডিফল্ট স্লাইড বাদ দিয়ে সেগুলো দেখাবে
- bKash/Nagad-এর মতো অনলাইন পেমেন্ট — এখন শুধু COD আছে
- স্টক ০ হয়ে গেলে অটো "আউট অফ স্টক" — বেসিক স্ট্রাকচার আছে, চাইলে চেকআউটে স্টক ভ্যালিডেশন যোগ করা যায়
