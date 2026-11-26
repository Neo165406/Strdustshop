/* Universal mobile navigation for every storefront page. */
(() => {
  function initUniversalMobileMenu() {
    const header = document.querySelector(".site-header");
    const nav = header?.querySelector(".main-nav");
    const actions = header?.querySelector(".header-actions");
    if (!header || !nav || !actions) return;

    let toggle = header.querySelector(".nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "nav-toggle";
      toggle.type = "button";
      toggle.textContent = "☰";
      toggle.setAttribute("aria-label", "Open menu");
      toggle.setAttribute("aria-expanded", "false");
      actions.appendChild(toggle);
    }

    // Reuse the homepage's existing menu if present; otherwise build the same
    // drawer from the page's real navigation links.
    let overlay = document.getElementById("mobileMenuOverlay");
    let menu = document.getElementById("mobileMenu");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "mobile-menu-overlay";
      overlay.id = "mobileMenuOverlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }
    if (!menu) {
      menu = document.createElement("aside");
      menu.className = "mobile-menu";
      menu.id = "mobileMenu";
      menu.setAttribute("aria-label", "Site navigation");
      menu.setAttribute("aria-hidden", "true");
      menu.innerHTML = `
        <div class="mm-top">
          <span class="mm-logo"><img src="/strdust-logo.webp" alt="StrDust"></span>
          <button class="mm-close" type="button" aria-label="Close menu">✕</button>
        </div>
        <nav class="mm-list"></nav>
        <div class="mm-footer">
          <a href="/track-order.html">Order Tracker</a>
          <a href="/cart.html">Your Cart</a>
        </div>`;
      const list = menu.querySelector(".mm-list");
      nav.querySelectorAll("a[href]").forEach(link => {
        const item = link.cloneNode(true);
        item.classList.remove("active");
        item.classList.add("mm-item");
        item.removeAttribute("aria-current");
        list.appendChild(item);
      });
      document.body.appendChild(menu);
    }

    if (toggle.dataset.menuReady === "true") return;
    toggle.dataset.menuReady = "true";
    const closeButton = menu.querySelector(".mm-close");

    function openMenu() {
      menu.classList.add("open");
      overlay.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("mobile-menu-open");
      closeButton?.focus();
    }
    function closeMenu() {
      menu.classList.remove("open");
      overlay.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-menu-open");
    }

    toggle.addEventListener("click", openMenu);
    closeButton?.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUniversalMobileMenu, { once: true });
  } else {
    initUniversalMobileMenu();
  }
})();
