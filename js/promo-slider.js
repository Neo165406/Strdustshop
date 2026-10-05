// Hero carousel (CapCut-style): vertical label list on the left, stacked image
// cards on the right, auto-advancing with smooth vertical motion.
// Reads the existing .promo-slide markup (static or loaded from Firestore),
// then rebuilds it. window.initPromoSlider() stays the entry point.
(function () {
  const CSS = `
.promo-slider.hc{aspect-ratio:auto;height:clamp(380px,56vw,460px);max-height:none;min-height:0;background:linear-gradient(160deg,#0A0A0A 0%,#1b1b1b 55%,#2a2312 100%);color:var(--ivory);user-select:none}
.hc-labels{position:absolute;left:0;top:0;bottom:130px;width:46%;z-index:3;pointer-events:none;
  -webkit-mask-image:linear-gradient(transparent,#000 22%,#000 78%,transparent);mask-image:linear-gradient(transparent,#000 22%,#000 78%,transparent)}
.hc-label{position:absolute;left:28px;right:8px;top:50%;margin-top:-14px;line-height:28px;font-size:clamp(.82rem,2.2vw,1.05rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  color:rgba(250,246,239,.55);cursor:pointer;pointer-events:auto;transition:transform .7s cubic-bezier(.65,0,.35,1),opacity .7s,color .4s}
.hc-label.on{color:var(--gold-light);font-weight:500}
.hc-stage{position:absolute;right:5%;top:0;bottom:130px;width:50%;max-width:520px;z-index:2}
.hc-card{position:absolute;left:0;right:0;top:50%;height:46%;margin-top:-23%;border-radius:10px;overflow:hidden;cursor:pointer;display:block;
  background:var(--card-bg,linear-gradient(200deg,var(--gold),#161616 75%)) center/cover;box-shadow:0 14px 34px rgba(0,0,0,.45);
  transition:transform .8s cubic-bezier(.65,0,.35,1),opacity .8s,filter .8s;will-change:transform,opacity}
.hc-caption{position:absolute;left:28px;bottom:34px;right:28px;z-index:4;pointer-events:none}
.hc-cap{position:absolute;left:0;bottom:0;width:100%;opacity:0;transform:translateY(12px);transition:opacity .5s,transform .5s}
.hc-cap.on{opacity:1;transform:none;pointer-events:auto}
.hc-cap .eyebrow{font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;color:var(--gold-light);margin-bottom:6px}
.hc-cap h3{font-family:'Playfair Display',serif;font-size:clamp(1.3rem,3.4vw,2.1rem);color:var(--ivory);margin-bottom:4px;max-width:90%}
.hc-cap .price{color:var(--gold-light);margin-top:4px}
.hc-cap .price .old{color:rgba(250,246,239,.55);text-decoration:line-through;font-size:.85rem;margin-left:8px}
.hc-cap .btn{margin-top:12px;display:inline-block;padding:11px 28px}
.hc-dots{position:absolute;right:5%;bottom:16px;z-index:5;display:flex;gap:6px}
.hc-dots i{width:6px;height:6px;border-radius:50%;background:rgba(250,246,239,.3);transition:all .3s}
.hc-dots i.on{background:var(--gold);width:18px;border-radius:4px}
@media(max-width:620px){.hc-labels{width:42%}.hc-label{left:16px}.hc-stage{width:52%;right:4%}.hc-caption{left:16px;right:16px}}
`;

  function injectCss() {
    if (document.getElementById('hc-css')) return;
    const s = document.createElement('style');
    s.id = 'hc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function parse(wrap) {
    return [...wrap.querySelectorAll('.promo-slide')].map(el => {
      const m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
      const a = el.querySelector('a');
      return {
        eyebrow: (el.querySelector('.eyebrow') || {}).textContent || '',
        title: (el.querySelector('h3') || {}).textContent || '',
        price: (el.querySelector('.price') || {}).outerHTML || '',
        link: a ? a.getAttribute('href') : 'shop.html',
        image: m ? m[1] : ''
      };
    });
  }

  function initPromoSlider() {
    const wrap = document.querySelector('.promo-slider');
    if (!wrap) return;
    const items = parse(wrap);
    if (!items.length) return;
    if (window.__promoSliderTimer) clearInterval(window.__promoSliderTimer);
    injectCss();

    const n = items.length;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    wrap.classList.add('hc');
    wrap.innerHTML =
      `<div class="hc-labels">${items.map((s, i) => `<div class="hc-label" data-i="${i}">${esc(s.title)}</div>`).join('')}</div>` +
      `<div class="hc-stage">${items.map((s, i) => `<a class="hc-card" href="${esc(s.link)}" aria-label="${esc(s.title)}" ${s.image ? `style="--card-bg:url('${esc(s.image)}')"` : ''}></a>`).join('')}</div>` +
      `<div class="hc-caption">${items.map(s => `<div class="hc-cap"><div class="eyebrow">${esc(s.eyebrow)}</div><h3>${esc(s.title)}</h3>${s.price}<a href="${esc(s.link)}" class="btn btn-solid">Shop Now</a></div>`).join('')}</div>` +
      `<div class="hc-dots">${items.map(() => '<i></i>').join('')}</div>`;

    const labels = wrap.querySelectorAll('.hc-label');
    const cards = wrap.querySelectorAll('.hc-card');
    const caps = wrap.querySelectorAll('.hc-cap');
    const dots = wrap.querySelectorAll('.hc-dots i');
    const half = Math.floor(n / 2);
    let cur = 0;

    function render() {
      for (let i = 0; i < n; i++) {
        let d = ((i - cur + n + half) % n) - half; // shortest wrapped distance
        const ad = Math.abs(d);
        labels[i].style.transform = `translateY(${d * 44}px)`;
        labels[i].style.opacity = ad > 2 ? 0 : 1 - ad * 0.4;
        labels[i].classList.toggle('on', d === 0);
        cards[i].style.transform = `translateY(${d * 62}%) scale(${ad === 0 ? 1 : 0.88})`;
        cards[i].style.opacity = ad === 0 ? 1 : ad === 1 ? 0.45 : 0;
        cards[i].style.filter = ad === 0 ? 'none' : 'blur(1.5px) brightness(.8)';
        cards[i].style.zIndex = 10 - ad;
        cards[i].style.pointerEvents = ad === 0 ? 'auto' : 'none';
        caps[i].classList.toggle('on', d === 0);
        dots[i].classList.toggle('on', d === 0);
      }
    }

    function go(i) { cur = (i + n) % n; render(); }
    function start() {
      clearInterval(window.__promoSliderTimer);
      if (n > 1) window.__promoSliderTimer = setInterval(() => go(cur + 1), 3200);
    }

    labels.forEach(l => l.addEventListener('click', () => { go(Number(l.dataset.i)); start(); }));
    wrap.addEventListener('mouseenter', () => clearInterval(window.__promoSliderTimer));
    wrap.addEventListener('mouseleave', start);

    // swipe up/down or left/right on touch
    let y0 = null, x0 = null;
    wrap.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (y0 === null) return;
      const dy = e.changedTouches[0].clientY - y0, dx = e.changedTouches[0].clientX - x0;
      const v = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      if (Math.abs(v) > 40) { go(cur + (v < 0 ? 1 : -1)); start(); }
      y0 = x0 = null;
    }, { passive: true });

    render();
    start();
  }

  window.initPromoSlider = initPromoSlider;
  document.addEventListener('DOMContentLoaded', initPromoSlider);
})();
