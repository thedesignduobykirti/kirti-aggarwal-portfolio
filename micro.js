// Oct 25: micro interactions (styles in css/micro.css).
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const g = window.gsap;

  // ---------- scroll line ----------
  const prog = document.createElement("div");
  prog.className = "mc-prog"; prog.setAttribute("aria-hidden", "true");
  document.body.appendChild(prog);
  let ticking = false;
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  if (reduce) return;

  // ---------- nav links roll ----------
  document.querySelectorAll(".nv-list a, .nav .name").forEach((a) => {
    if (a.querySelector(".mc-roll")) return;
    const t = a.textContent;
    a.innerHTML = `<span class="mc-roll"><span>${t}</span></span>`;
  });

  // ---------- ripples ----------
  const RIP = ".ig-btn, .bf-btn, .cl-follow, .bf-copy";
  document.querySelectorAll(RIP).forEach((b) => b.classList.add("mc-btn"));
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(RIP);
    if (!b) return;
    const r = b.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "mc-ripple";
    dot.style.left = e.clientX - r.left + "px";
    dot.style.top = e.clientY - r.top + "px";
    dot.style.setProperty("--s", Math.ceil(Math.hypot(r.width, r.height) / 5));
    b.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  });

  if (!g) return;

  // ---------- magnetic buttons ----------
  if (fine) {
    document.querySelectorAll(".ig-btn, .bf-btn, .cl-follow, .nav .hello, .mode-tg, .cl-top, .cl-rv-arrow").forEach((el) => {
      el.classList.add("mc-mag");
      const k = el.offsetWidth > 300 ? 0.08 : 0.32;
      const x = g.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const y = g.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * k);
        y((e.clientY - r.top - r.height / 2) * k);
      });
      el.addEventListener("pointerleave", () => {
        g.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .4)", overwrite: true });
      });
    });
  }

  // ---------- the mode switch gives a little spin ----------
  const tg = document.querySelector(".mode-tg");
  tg?.addEventListener("click", () => {
    tg.classList.remove("is-flip"); void tg.offsetWidth; tg.classList.add("is-flip");
  });

  // ---------- the footer name: a slow wave through the letters while it is on screen ----------
  const wm = document.querySelector(".cl-wm");
  const letters = wm ? [...wm.querySelectorAll("b")] : [];
  if (!letters.length) return;
  let inView = false, started = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(wm);
  const wave = () => {
    if (inView && !document.hidden) {
      g.to(letters, { keyframes: { yPercent: [0, -10, 0] }, duration: 1.1, ease: "sine.inOut", stagger: 0.06 });
    }
    setTimeout(wave, 4500);
  };
  const start = () => { if (!started) { started = true; setTimeout(wave, letters.length * 40 + 1000); } };
  new MutationObserver(() => wm.classList.contains("is-in") && start()).observe(wm, { attributes: true, attributeFilter: ["class"] });
  if (wm.classList.contains("is-in")) start();
})();
