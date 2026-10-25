(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rig = document.querySelector(".rig");
  const reelBtn = document.querySelector("[data-reel]");
  const eyes = [...document.querySelectorAll(".avatar .eye")].map((el) => ({
    el,
    iris: el.querySelector(".iris"),
    hls: el.querySelectorAll(".hl"),
    cx: 0, cy: 0, size: 0,
    x: 0, y: 0,
  }));

  // ---------- measure eye centres (cached, refreshed on resize) ----------
  function measure() {
    eyes.forEach((e) => {
      const r = e.el.getBoundingClientRect();
      e.cx = r.left + r.width / 2;
      e.cy = r.top + r.height / 2;
      // unzoomed size: a reading taken mid-dive must never throw the irises out of the eyes
      e.size = e.el.offsetWidth || e.size;
    });
  }
  addEventListener("resize", measure);

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ---------- where the eyes should look ----------
  const target = { x: innerWidth / 2, y: innerHeight * 0.25 }; // start on the headline
  let lastMove = 0;
  let pointerInside = false;
  let locked = null; // element both eyes are fixed on

  addEventListener("pointermove", (ev) => {
    lastMove = performance.now();
    pointerInside = true;
    if (locked) return;
    target.x = ev.clientX;
    target.y = ev.clientY;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointerInside = false; });

  // hovering the reel or "Say hello": eyes lock on it and the pupils widen
  const setPupil = (v, d) => eyes.forEach((e) => gsap.to(e.iris, { "--pupil": v, duration: d, ease: "power3.out" }));
  document.querySelectorAll("[data-look]").forEach((el) => {
    el.addEventListener("pointerenter", () => { locked = el; setPupil("78%", 0.5); });
    el.addEventListener("pointerleave", () => { locked = null; setPupil("68%", 0.7); });
    el.addEventListener("focus", () => { locked = el; });
    el.addEventListener("blur", () => { locked = null; });
  });

  // idle: she glances around, and keeps coming back to the reel (people look where a face looks)
  let nextGlance = 0;
  function idleLook(now) {
    if (reduce || locked) return;
    if (pointerInside && now - lastMove < 3000) return;
    if (now < nextGlance) return;
    if (reelBtn && Math.random() < 0.55) {
      const c = centerOf(reelBtn);
      target.x = c.x; target.y = c.y;
      nextGlance = now + 1800 + Math.random() * 1600;
    } else {
      target.x = innerWidth * (0.2 + Math.random() * 0.6);
      target.y = innerHeight * (0.08 + Math.random() * 0.4);
      nextGlance = now + 700 + Math.random() * 1400;
    }
  }

  // ---------- render loop ----------
  let headX = 0;
  const flick = { x: 0, y: 0 };
  let nextFlick = 0;
  function tick() {
    const now = performance.now();
    idleLook(now);
    if (locked) { const c = centerOf(locked); target.x = c.x; target.y = c.y; }

    // micro-saccades: tiny involuntary flicks so the gaze never looks painted on
    if (now > nextFlick) {
      flick.x = (Math.random() - 0.5) * 3;
      flick.y = (Math.random() - 0.5) * 2;
      nextFlick = now + 500 + Math.random() * 1100;
    }

    measure();
    eyes.forEach((e) => {
      const dx = target.x - e.cx;
      const dy = target.y - e.cy;
      const dist = Math.hypot(dx, dy) || 1;
      // reach full travel when the target is ~40% of the viewport away
      const reach = Math.min(1, dist / (Math.min(innerWidth, innerHeight) * 0.4));
      const maxX = e.size * 0.27, maxY = e.size * 0.24;
      // during the scroll dive she looks straight at you, so the zoom lands on the pupil
      const diving = window.KA && KA.diving;
      const tx = diving ? 0 : (dx / dist) * reach * maxX + flick.x;
      const ty = diving ? 0 : (dy / dist) * reach * maxY + flick.y;
      const k = locked ? 0.2 : 0.14; // a lock snaps a little faster, like a real saccade
      e.x += (tx - e.x) * k;
      e.y += (ty - e.y) * k;
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { e.x = 0; e.y = 0; }
      e.x = Math.max(-maxX * 1.08, Math.min(maxX * 1.08, e.x));
      e.y = Math.max(-maxY * 1.08, Math.min(maxY * 1.08, e.y));

      // the eyeball is a sphere: the iris flattens as it rolls toward the edge
      const off = Math.min(1, Math.hypot(e.x / maxX, e.y / maxY));
      const ang = Math.atan2(e.y, e.x);
      e.iris.style.transform =
        `translate3d(${e.x}px, ${e.y}px, 0) rotate(${ang}rad) scaleX(${1 - 0.16 * off * off}) rotate(${-ang}rad)`;
      // reflections belong to the light, not the iris: they barely move
      e.hls.forEach((h) => (h.style.transform = `translate3d(${-e.x * 0.5}px, ${-e.y * 0.5}px, 0)`));
    });

    // head drifts a touch toward what she's looking at
    const nx = (target.x / innerWidth - 0.5) * 2;
    headX += (nx - headX) * 0.05;
    // sideways only: lifting or tilting would expose the bottom edge of the head
    if (window.KA && KA.diving) headX += (0 - headX) * 0.2;
    if (!reduce) rig.style.transform = `translate3d(${headX * 14}px, 0, 0)`;

    requestAnimationFrame(tick);
  }

  // ---------- local time in India (agencies check time zones before they message) ----------
  const clock = document.querySelector(".clock");
  const fmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  function tickClock() { if (clock) clock.textContent = fmt.format(new Date()).replace(/\s?(am|pm)/i, " $1").toLowerCase() + " IST"; }
  tickClock();
  setInterval(tickClock, 15000);

  // ---------- intro ----------
  function intro() {
    measure();
    requestAnimationFrame(tick);
    if (reduce) return;

    gsap.set(".w", { yPercent: 115 });
    gsap.set([".nav", ".role", ".reel"], { autoAlpha: 0, y: 14 });
    gsap.set(".avatar", { yPercent: 45 });

    gsap.timeline({ defaults: { ease: "expo.out" } })
      .to(".w", { yPercent: 0, duration: 1.3, stagger: 0.07 }, 0.15)
      .to(".avatar", { yPercent: 0, duration: 1.6, ease: "power4.out", onUpdate: measure }, 0.35)
      .to(".role", { autoAlpha: 1, y: 0, duration: 1 }, 0.85)
      .to(".reel", { autoAlpha: 1, y: 0, duration: 1 }, 1.0)
      .to(".nav", { autoAlpha: 1, y: 0, duration: 1 }, 1.2)
      // her first look goes to the reel
      .call(() => { if (!pointerInside && reelBtn) { const c = centerOf(reelBtn); target.x = c.x; target.y = c.y; nextGlance = performance.now() + 2200; } }, null, 1.5);
  }

  if (document.readyState === "complete") intro();
  else addEventListener("load", intro);
})();
