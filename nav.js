// Top bar: one underline slides to the link of the section in view, and links scroll smoothly.
// Section -> link: hero/dive = Home, the editor (#how) counts as Work, reviews and FAQ as About,
// the brief form, "Find me" and the footer as Say hello. Unmapped sections keep the previous link.
(() => {
  const header = document.querySelector(".nav");
  if (!header) return;
  const navEl = header.querySelector("nav");
  const links = [...navEl.querySelectorAll("a[data-nv]")];
  const bar = navEl.querySelector(".nv-bar");
  const menu = navEl.querySelector(".nv-menu");
  const curLabel = menu?.querySelector(".nv-cur");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 720px)");
  const hasGsap = !!window.gsap;

  const MAP = {
    services: "services", work: "work", how: "work",
    about: "about", reviews: "about", rates: "about", faq: "about",
    brief: "brief", find: "brief",
  };
  const LABEL = { top: "Home", services: "Services", work: "Work", about: "About", brief: "Say hello" };
  const zones = [...document.querySelectorAll("main.hero, section[id], footer")].map((el) => ({
    el, key: el.matches("main.hero") ? "top" : MAP[el.id],
  }));

  let active = null;
  function compute() {
    const line = innerHeight * 0.4;
    let key = "top";
    for (const z of zones) {
      if (z.el.getBoundingClientRect().top > line) break;
      if (z.key) key = z.key;
    }
    return key;
  }

  // where the bar should sit: under the link, or on phones under the menu label
  function targetFor(key) {
    if (phone.matches && key !== "brief") return curLabel;
    return links.find((a) => a.dataset.nv === key && a.offsetParent !== null) || null;
  }
  function place(instant) {
    const t = targetFor(active);
    if (!t) return;
    const n = navEl.getBoundingClientRect(), r = t.getBoundingClientRect();
    const x = r.left - n.left, w = r.width;
    if (hasGsap && !reduce && !instant) {
      gsap.to(bar, { x, width: w, duration: 0.75, ease: "expo.out", overwrite: true });
    } else if (hasGsap) {
      gsap.set(bar, { x, width: w });
    } else {
      bar.style.transform = `translateX(${x}px)`;
      bar.style.width = `${w}px`;
    }
  }

  function setActive(key, instant) {
    if (key === active) return;
    active = key;
    links.forEach((a) => {
      if (a.dataset.nv === key) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    if (curLabel) {
      const label = key === "brief" ? "Menu" : LABEL[key];
      if (curLabel.textContent !== label) {
        curLabel.textContent = label;
        if (hasGsap && !reduce && !instant && phone.matches) {
          gsap.fromTo(curLabel, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out", overwrite: true });
        }
      }
    }
    place(instant);
  }

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; setActive(compute()); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  const relayout = () => { setActive(compute(), true); place(true); };
  addEventListener("resize", relayout);
  phone.addEventListener?.("change", relayout);
  window.ScrollTrigger?.addEventListener("refresh", () => { setActive(compute(), true); place(true); });

  setActive(compute(), true);
  document.fonts?.ready.then(() => place(true));
  // the intro fades the bar in once it has a real position
  requestAnimationFrame(() => { place(true); header.classList.add("nv-ready"); });

  // ---------- phone menu ----------
  function setMenu(open) {
    if (!menu) return;
    header.classList.toggle("nv-open", open);
    menu.setAttribute("aria-expanded", String(open));
  }
  menu?.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("click", (e) => { if (!header.contains(e.target)) setMenu(false); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("nv-open")) { setMenu(false); menu.focus(); }
  });

  // ---------- smooth jumps ----------
  function offsetFor(el) {
    // pinned sections are built to sit right under the bar; others get room for it
    if (el.querySelector(".pin-spacer") || el.parentElement?.classList.contains("pin-spacer")) return 0;
    const pt = parseFloat(getComputedStyle(el).paddingTop) || 0;
    return Math.min(0, pt - header.offsetHeight - 12);
  }
  header.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = id && id !== "top" ? document.getElementById(id) : null;
    if (id && id !== "top" && !el) return;
    e.preventDefault();
    setMenu(false);
    const y = el ? el.getBoundingClientRect().top + scrollY + offsetFor(el) : 0;
    const lenis = window.KA && KA.lenis;
    if (lenis) {
      const d = Math.abs(y - scrollY);
      lenis.scrollTo(y, {
        duration: Math.min(2.4, 0.8 + d / 5000),
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
    } else {
      scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  });
})();

// light text whenever the bar sits over a dark part of the page
(() => {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const dark = []; // every section now follows the page theme, so none forces light text
  let raf = 0;
  const check = () => {
    raf = 0;
    const y = nav.offsetHeight / 2;
    const over = (document.body.classList.contains("is-dark") && !nav.classList.contains("solid")) ||
      dark.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    nav.classList.toggle("on-dark", over);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  new MutationObserver(queue).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(queue).observe(nav, { attributes: true, attributeFilter: ["class"] });
  check();
})();
