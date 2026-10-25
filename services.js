// Services: four rows. Hovering a row lights it up, a clip of that kind of work
// follows the cursor, and Kirti (peeking in from the right) looks at the row.
// On touch screens the row nearest the middle of the screen becomes active instead.
(() => {
  if (!window.gsap) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;
  const section = document.querySelector(".services");
  if (!section) return;
  const rows = [...section.querySelectorAll(".svc")];
  const list = section.querySelector(".svc-list");
  const title = section.querySelector(".svc-title");
  const thumb = section.querySelector(".svc-thumb");
  const clips = [...thumb.querySelectorAll("video")];
  const peek = section.querySelector(".peek");
  const body = peek.querySelector(".peek-body");
  const blinkImg = peek.querySelector(".peek-blink");
  const noise = document.getElementById("hairnoise");
  const disp = document.getElementById("hairdisp");
  const hairFilter = document.getElementById("hairwave");
  const hairMap = document.getElementById("hairmap");
  const peekImg = peek.querySelector(".peek-img");
  // the filter works in pixels, so keep its box (and the hair map) matched to the image size
  let hairW = 400, hairH = 660;
  function sizeHair() {
    hairW = peekImg.offsetWidth; hairH = peekImg.offsetHeight;
    [hairFilter, hairMap].forEach((el) => { el.setAttribute("width", hairW); el.setAttribute("height", hairH); });
  }
  addEventListener("resize", sizeHair);
  sizeHair();
  const eyes = [...peek.querySelectorAll(".eye")].map((el) => ({
    el, iris: el.querySelector(".iris"), hls: el.querySelectorAll(".hl"), x: 0, y: 0,
  }));

  // ---------- state ----------
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, inside: false };
  const pos = { x: 0, y: 0, vx: 0, shown: 0 };
  let active = -1;
  let visible = false;

  addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  section.addEventListener("pointerenter", () => (pointer.inside = true));
  section.addEventListener("pointerleave", () => (pointer.inside = false));

  // ---------- life: blink, nod, breathe, sway ----------
  let nod = 0;          // short impulse when she switches rows
  let lean = 0;         // 0 = resting, 1 = leaning in toward the rows
  let blinking = false;
  function blink(double = false) {
    if (blinking || reduce) return;
    blinking = true;
    const tl = gsap.timeline({ onComplete: () => (blinking = false) });
    tl.to(blinkImg, { opacity: 1, duration: 0.05, ease: "none" })
      .to(blinkImg, { opacity: 0, duration: 0.11, ease: "power1.in" }, "+=0.06");
    if (double) tl.to(blinkImg, { opacity: 1, duration: 0.05, ease: "none" }, "+=0.09")
                  .to(blinkImg, { opacity: 0, duration: 0.11, ease: "power1.in" }, "+=0.05");
  }
  (function blinkLoop() {
    gsap.delayedCall(2.2 + Math.random() * 3.4, () => { if (visible) blink(Math.random() < 0.22); blinkLoop(); });
  })();

  const inView = () => { const r = section.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  function setActive(i) {
    if (i >= 0 && !inView()) i = -1;
    if (i === active) return;
    if (i >= 0 && active >= 0) { nod = 1; if (Math.random() < 0.35) blink(); }
    if (i >= 0 && active < 0) nod = 0.6;
    active = i;
    rows.forEach((r, k) => r.classList.toggle("on", k === i));
    clips.forEach((v, k) => {
      const on = k === Number(rows[i]?.dataset.clip);
      v.classList.toggle("on", on);
      if (on) v.play().catch(() => {}); else v.pause();
    });
    const show = i >= 0;
    gsap.to(thumb, { autoAlpha: show ? 1 : 0, scale: show ? 1 : 0.4, duration: show ? 0.5 : 0.3, ease: show ? "expo.out" : "power2.in" });
    eyes.forEach((e) => gsap.to(e.iris, { "--pupil": show ? "76%" : "68%", duration: 0.5, ease: "power3.out" }));
  }

  if (!touch) {
    rows.forEach((r, i) => r.addEventListener("pointerenter", () => setActive(i)));
    list.addEventListener("pointerleave", () => setActive(-1));
  }
  rows.forEach((r, i) => {
    r.addEventListener("focus", () => setActive(i));
    r.addEventListener("blur", () => setActive(-1));
  });

  // touch: the row closest to the middle of the screen is the active one
  function spy() {
    let best = -1, bestD = Infinity;
    rows.forEach((r, i) => {
      const b = r.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - innerHeight * 0.45);
      if (d < bestD && b.bottom > 0 && b.top < innerHeight) { bestD = d; best = i; }
    });
    setActive(bestD < innerHeight * 0.3 ? best : -1);
  }

  const center = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };

  // ---------- frame loop (only while the section is on screen) ----------
  function tick() {
    if (!visible) return;
    if (touch) spy();

    // the clip trails the cursor; on touch or keyboard it sits at the end of the row's name
    const w = thumb.offsetWidth, h = thumb.offsetHeight;
    let tx, ty;
    if (!touch && pointer.inside && document.activeElement?.classList?.contains("svc") !== true) {
      tx = pointer.x + 28; ty = pointer.y - h / 2;
      const meta = rows[Math.max(0, active)].querySelector(".svc-meta").getBoundingClientRect();
      if (tx + w > meta.left - 16) tx = Math.max(pointer.x - w - 28, 8);
    } else if (active >= 0) {
      const nb = rows[active].querySelector(".svc-name > span").getBoundingClientRect();
      // touch: pinned to the right end of the name line, so the description stays clear
      tx = touch ? innerWidth - w - 14 : Math.min(nb.right + 24, innerWidth - w - 12);
      ty = touch ? nb.bottom - h + 2 : nb.top + nb.height / 2 - h / 2;
    } else { tx = pos.x; ty = pos.y; }
    const k = reduce ? 1 : 0.16;
    const nx = pos.x + (tx - pos.x) * k;
    pos.vx = nx - pos.x;
    pos.x = nx;
    pos.y += (ty - pos.y) * k;
    const tilt = reduce ? 0 : Math.max(-8, Math.min(8, pos.vx * 0.35));
    gsap.set(thumb, { x: pos.x, y: pos.y, rotation: tilt });

    // her eyes go to the active row, else the cursor, else the heading
    let target;
    if (active >= 0) target = center(rows[active].querySelector(".svc-name > span"));
    else if (pointer.inside && !touch) target = pointer;
    else target = center(title);
    eyes.forEach((e) => {
      const c = center(e.el), size = e.el.offsetWidth;
      const dx = target.x - c.x, dy = target.y - c.y, dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / (Math.min(innerWidth, innerHeight) * 0.35));
      const maxX = size * 0.22, maxY = size * 0.14;
      e.x += ((dx / dist) * reach * maxX - e.x) * 0.15;
      e.y += ((dy / dist) * reach * maxY - e.y) * 0.15;
      const off = Math.min(1, Math.hypot(e.x / maxX, e.y / maxY));
      const ang = Math.atan2(e.y, e.x);
      e.iris.style.transform = `translate3d(${e.x}px, ${e.y}px, 0) rotate(${ang}rad) scaleX(${1 - 0.16 * off * off}) rotate(${-ang}rad)`;
      e.hls.forEach((hl) => (hl.style.transform = `translate3d(${-e.x * 0.5}px, ${-e.y * 0.5}px, 0)`));
    });

    if (!reduce) {
      const t = performance.now() / 1000;
      // lean in while you browse the rows, tilt toward the row she's looking at, nod on a switch
      lean += ((active >= 0 ? 1 : pointer.inside && !touch ? 0.35 : 0) - lean) * 0.06;
      nod *= 0.9;
      const face = center(eyes[0].el);
      const tilt = Math.max(-1.6, Math.min(1.2, ((target.y - face.y) / innerHeight) * -3.2));
      const breathe = Math.sin(t * 1.75);
      const rot = Math.max(-3, Math.min(1.5, -lean * 1.6 + tilt * (0.4 + 0.6 * lean) - nod * 1.8 * Math.sin((1 - nod) * Math.PI)));
      body.style.transform =
        `translate3d(${-lean * 7}px, ${breathe * 3.2}px, 0) rotate(${rot}deg) scale(${1 + breathe * 0.005 + lean * 0.012})`;
      // hair: the noise field drifts slowly; it swings harder for a moment when she moves
      // frequencies are per element-height, so the wave looks the same at any size
      noise.setAttribute("baseFrequency", `${((2.4 + 0.15 * Math.sin(t * 0.55)) / hairH).toFixed(5)} ${((4.6 + 0.3 * Math.sin(t * 0.42 + 1.3)) / hairH).toFixed(5)}`);
      disp.setAttribute("scale", ((0.016 + 0.006 * Math.sin(t * 0.9) + nod * 0.012) * hairH).toFixed(2));
    }

    requestAnimationFrame(tick);
  }
  new IntersectionObserver(([en]) => {
    const was = visible;
    visible = en.isIntersecting;
    if (visible && !was) requestAnimationFrame(tick);
    if (!visible) {
      setActive(-1);
      // the clip is position:fixed, so make sure it can never linger over other sections
      gsap.killTweensOf(thumb);
      gsap.set(thumb, { autoAlpha: 0, scale: 0.4 });
    }
  }).observe(section);

  // ---------- reveals ----------
  if (reduce || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(title.querySelectorAll(".w2"), {
    yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: title, start: "top 82%" },
  });
  gsap.from(section.querySelectorAll(".svc-name > span"), {
    yPercent: 105, duration: 1, ease: "expo.out", stagger: 0.09,
    scrollTrigger: { trigger: list, start: "top 78%" },
  });
  gsap.fromTo(rows, { "--line": 0 }, {
    "--line": 1, duration: 1.2, ease: "power3.inOut", stagger: 0.09,
    scrollTrigger: { trigger: list, start: "top 78%" },
  });
  gsap.from(section.querySelectorAll(".svc-meta, .svc-foot"), {
    autoAlpha: 0, y: 14, duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.25,
    scrollTrigger: { trigger: list, start: "top 78%" },
  });
  // she slides in from the edge once the rows arrive
  gsap.from(peek, {
    xPercent: 100, rotation: 8, transformOrigin: "100% 100%", duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: list, start: "top 70%" },
    onComplete: () => gsap.delayedCall(0.25, () => blink(true)),
  });
})();
