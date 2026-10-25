// "Plan it with me": pick what you need and see real dates for every step of a project,
// plus when each payment is due. Pins drop onto a calendar ribbon, the route draws itself,
// and her little head rides it to the files. "Send this plan" fills in the brief form.
(() => {
  const sec = document.querySelector(".pl");
  if (!sec) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const G = window.gsap;

  // ---------- PLAN: placeholders until Kirti confirms them ----------
  const ADV = 65;                                          // advance %, she said 60 to 70
  const DRAFT = { brand: 8, social: 2, motion: 4, pack: 6 }; // working days to a first draft, Mid size
  const REV = { brand: 2, social: 1, motion: 2, pack: 2 };   // working days per revision round
  const ROUNDS = 2;
  const SIZE = { Small: 0.6, Mid: 1, Large: 1.7 };
  const OPEN = 10, CLOSE = 19, QUOTE_HOURS = 4;            // IST working hours, quote turnaround
  const NAMES = { brand: "Brand identity", social: "Social creatives", motion: "Motion", pack: "Packaging & print" };

  const $ = (s) => sec.querySelector(s);
  const $$ = (s) => [...sec.querySelectorAll(s)];
  const chips = $$(".pl-chip");
  const sizeBtns = $$(".pl-size button");
  const sizePill = $(".pl-size-pill");
  const dlInput = $(".pl-dl-input");
  const dlText = $(".pl-dl-text");
  const track = $(".pl-track");
  const scroller = $(".pl-scroll");
  const daysEl = $(".pl-days");
  const pinsEl = $(".pl-pins");
  const svg = $(".pl-line");
  const lineBg = $(".pl-line-bg");
  const lineFg = $(".pl-line-fg");
  const me = $(".pl-me");
  const sr = $(".pl-sr");

  const state = { svcs: new Set(["motion"]), size: "Mid", deadline: null };
  $(".pl-adv").textContent = ADV;
  $(".pl-bal").textContent = 100 - ADV;
  $(".pl-pay-a").style.flexGrow = ADV;
  $(".pl-pay-b").style.flexGrow = 100 - ADV;

  // ---------- dates, all in IST calendar days (stored as UTC midnight) ----------
  const DAY = 864e5;
  function nowIST() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { day: Date.UTC(+p.year, +p.month - 1, +p.day), hour: +p.hour + +p.minute / 60 };
  }
  const dow = (d) => new Date(d).getUTCDay();
  const isWork = (d) => dow(d) >= 1 && dow(d) <= 5;
  const nextWork = (d) => { while (!isWork(d)) d += DAY; return d; };
  const addWork = (d, n) => { while (n > 0) { d += DAY; if (isWork(d)) n--; } return d; };
  const fmt = (d, o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(d));
  const short = (d) => `${fmt(d, { weekday: "short" })} ${fmt(d, { day: "numeric" })}`;
  const long = (d) => `${fmt(d, { weekday: "short" })} ${fmt(d, { day: "numeric", month: "short" })}`;
  const clock = (h) => { const hh = Math.floor(h), mm = h % 1 ? "30" : ""; const t = hh > 12 ? hh - 12 : hh; return `${t}${mm ? ":" + mm : ""} ${hh >= 12 ? "pm" : "am"}`; };

  function plan() {
    const { day: today, hour } = nowIST();
    // quote: four working hours from now
    let d = today, h = hour;
    if (!isWork(d) || h >= CLOSE) { d = nextWork(d + DAY); h = OPEN; }
    if (h < OPEN) h = OPEN;
    let qh = h + QUOTE_HOURS;
    if (qh > CLOSE) { d = addWork(d, 1); qh = OPEN + (qh - CLOSE); }
    qh = Math.min(CLOSE, Math.ceil(qh * 2) / 2);
    const quote = d;
    const advance = addWork(quote, 1);                      // you pay, your slot is booked
    const k = SIZE[state.size];
    const parts = [...state.svcs].map((s) => DRAFT[s] * k).sort((a, b) => b - a);
    const draftDays = Math.max(1, Math.ceil(parts[0] + 0.5 * parts.slice(1).reduce((a, b) => a + b, 0)));
    const draft = addWork(advance, draftDays);
    const rv = Math.max(...[...state.svcs].map((s) => REV[s])) * (state.size === "Large" ? 1.5 : state.size === "Small" ? 0.75 : 1);
    const revisions = addWork(draft, ROUNDS * Math.ceil(rv)); // feedback comes back the same day
    const files = addWork(revisions, 1);
    return { today, quote, quoteTime: qh, advance, draft, revisions, files };
  }

  // ---------- build the ribbon ----------
  let P = null, days = [], tileW = 60, first = true, dotY = 122;
  const ROW = 44; // height of one row of pin tags
  const KEYS = ["quote", "advance", "draft", "revisions", "files"];
  const pins = {};
  [...KEYS, "deadline"].forEach((key) => {
    const el = document.createElement("div");
    el.className = `pl-pin pl-pin-${key}`;
    el.innerHTML = `<span class="pl-tag"><b></b><span></span></span><span class="pl-str"></span><span class="pl-dot"></span>`;
    pinsEl.appendChild(el);
    pins[key] = el;
  });

  function label(key) {
    switch (key) {
      case "quote": return ["Quote", `${short(P.quote)}, by ${clock(P.quoteTime)}`];
      case "advance": return [`Advance ${ADV}%`, short(P.advance)];
      case "draft": return ["First draft", short(P.draft)];
      case "revisions": return [`${ROUNDS} revision rounds`, `done ${short(P.revisions)}`];
      case "files": return ["Final files", short(P.files)];
      case "deadline": {
        const gap = Math.round((state.deadline - P.files) / DAY);
        return gap >= 0 ? ["Your deadline", gap === 0 ? "right on time" : `${gap} day${gap > 1 ? "s" : ""} spare`] : ["Your deadline", `${-gap} day${gap < -1 ? "s" : ""} short`];
      }
    }
  }

  function buildDays() {
    const end = Math.max(P.files, state.deadline || 0) + 3 * DAY;
    const count = Math.min(56, Math.max(14, Math.round((end - P.today) / DAY) + 1));
    if (count === days.length && days[0] === P.today) return false;
    days = Array.from({ length: count }, (_, i) => P.today + i * DAY);
    daysEl.innerHTML = days.map((d, i) => {
      const cls = [isWork(d) ? "" : "we", i === 0 ? "today" : "", fmt(d, { day: "numeric" }) === "1" ? "m1" : ""].join(" ").trim();
      return `<li class="${cls}" style="--i:${i}"><span class="pl-wd">${fmt(d, { weekday: "narrow" })}</span><b>${fmt(d, { day: "numeric" })}</b><span class="pl-mo">${fmt(d, { month: "short" })}</span></li>`;
    }).join("");
    return true;
  }

  const xOf = (d) => (Math.round((d - P.today) / DAY) + 0.5) * tileW;

  // pick a row for every tag so none of them overlap
  function layoutPins(keys) {
    const rows = [];
    const W = track.clientWidth;
    keys.forEach((key) => {
      const el = pins[key], tag = el.querySelector(".pl-tag");
      const x = xOf(key === "deadline" ? state.deadline : P[key]);
      const w = tag.offsetWidth;
      const flip = x + w - 14 > W - 4;
      const l = flip ? x - w + 14 : x - 14, r = l + w;
      let lv = 0;
      while (rows[lv] != null && rows[lv] > l - 10) lv++;
      rows[lv] = r;
      el.classList.toggle("flip", flip);
      el.style.setProperty("--lv", lv);
      el._x = x;
    });
    dotY = Math.max(2, rows.length) * ROW + 34;
    sec.style.setProperty("--dot-y", `${dotY}px`);
  }

  function linePath() {
    const xs = KEYS.map((k) => xOf(P[k]));
    const y = dotY;
    let d = `M${xs[0]},${y}`;
    for (let i = 1; i < xs.length; i++) {
      const mx = (xs[i - 1] + xs[i]) / 2;
      d += ` Q${mx},${y - (i % 2 ? 22 : -10)} ${xs[i]},${y}`;
    }
    return d;
  }

  function texts() {
    const sayDraft = (() => {
      const n = Math.round((P.draft - P.today) / DAY);
      return n <= 6 ? fmt(P.draft, { weekday: "long" }) : `on ${long(P.draft)}`;
    })();
    let s2 = `Final files ${long(P.files)}.`;
    if (state.deadline) {
      const gap = Math.round((state.deadline - P.files) / DAY);
      s2 = gap >= 0 ? `Final files ${long(P.files)}, ${gap ? `${gap} day${gap > 1 ? "s" : ""} before your deadline` : "right on your deadline"}.` : `That's ${-gap} day${gap < -1 ? "s" : ""} past your deadline. Ask me about a rush slot.`;
    }
    return { s1: `Send it today, get the first draft ${sayDraft}.`, s2, adv: long(P.advance), bal: long(P.files) };
  }

  function setText(el, txt, d = 0) {
    if (el.textContent === txt) return;
    if (reduce || !G || first) { el.textContent = txt; return; }
    G.timeline({ delay: d }).to(el, { yPercent: -40, opacity: 0, duration: 0.18, ease: "power2.in" })
      .add(() => (el.textContent = txt))
      .fromTo(el, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "expo.out" });
  }

  // her little head rides the route from the quote to the files
  let ride = null;
  function rideAlong(delay = 0, instant = false) {
    const len = lineFg.getTotalLength();
    if (instant || !len || !G || reduce) { ride?.kill(); const p = lineFg.getPointAtLength(len || 0); me.style.transform = `translate(${p.x}px, ${p.y}px)`; return; }
    ride?.kill();
    const o = { t: 0 };
    ride = G.to(o, { t: 1, duration: 1.6, delay, ease: "power2.inOut", onUpdate: () => {
      const p = lineFg.getPointAtLength(o.t * len);
      const bob = Math.sin(o.t * Math.PI * 8) * 4;
      me.style.transform = `translate(${p.x}px, ${p.y + bob}px) rotate(${Math.sin(o.t * Math.PI * 6) * 10}deg)`;
      // on a phone the calendar is wider than the screen: it scrolls along with her
      if (scroller.scrollWidth > scroller.clientWidth + 4) scroller.scrollLeft = p.x - scroller.clientWidth * 0.55;
    }, onComplete: () => G.fromTo(me, { "--s": 1.3 }, { "--s": 1, duration: 0.7, ease: "elastic.out(1.2, 0.4)" }) });
  }

  function render(animate) {
    P = plan();
    const rebuilt = buildDays();
    const W = scroller.clientWidth;
    const minTile = innerWidth <= 720 ? 50 : 38;
    tileW = Math.max(minTile, W / days.length);
    track.style.width = `${tileW * days.length}px`;
    sec.style.setProperty("--tile", `${tileW}px`);

    // work span: the days she's working for you get an underline
    [...daysEl.children].forEach((li, i) => li.classList.toggle("on", days[i] >= P.advance && days[i] <= P.files));

    const keys = [...KEYS, ...(state.deadline ? ["deadline"] : [])];
    pins.deadline.style.display = state.deadline ? "" : "none";
    keys.forEach((k) => {
      const [b, s] = label(k);
      const tag = pins[k].querySelector(".pl-tag");
      tag.querySelector("b").textContent = b;
      tag.querySelector("span").textContent = s;
    });
    pins.deadline.classList.toggle("late", !!state.deadline && state.deadline < P.files);
    layoutPins(keys);

    const h = track.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${track.clientWidth} ${h}`);
    svg.setAttribute("width", track.clientWidth);
    svg.setAttribute("height", h);
    const d = linePath();
    lineBg.setAttribute("d", d);
    lineFg.setAttribute("d", d);
    const len = lineFg.getTotalLength();
    lineFg.style.strokeDasharray = `${len}`;

    const t = texts();
    setText($(".pl-say-1"), t.s1);
    setText($(".pl-say-2"), t.s2, 0.08);
    setText($(".pl-adv-d"), t.adv);
    setText($(".pl-bal-d"), t.bal, 0.05);
    sr.innerHTML = keys.map((k) => `<li>${label(k).join(": ")}</li>`).join("");

    if (!G || reduce || !animate) {
      keys.forEach((k) => (G ? G.set(pins[k], { x: pins[k]._x }) : (pins[k].style.transform = `translateX(${pins[k]._x}px)`)));
      lineFg.style.strokeDashoffset = "0";
      rideAlong(0, true);
      return;
    }
    if (rebuilt && !first) G.from(daysEl.children, { y: 16, opacity: 0, duration: 0.5, ease: "expo.out", stagger: 0.008 });
    keys.forEach((k, i) => {
      const el = pins[k];
      if (first || el._shown !== true) {
        G.set(el, { x: el._x });
        G.fromTo(el, { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.25 + i * 0.12, ease: "bounce.out" });
        G.fromTo(el.querySelector(".pl-str"), { scaleY: 0 }, { scaleY: 1, duration: 0.5, delay: 0.35 + i * 0.12, ease: "power2.out" });
        el._shown = true;
      } else {
        G.to(el, { x: el._x, duration: 0.8, ease: "expo.out", delay: i * 0.03 });
        G.fromTo(el.querySelector(".pl-dot"), { scale: 1.6 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", delay: 0.2 + i * 0.03 });
      }
    });
    if (!state.deadline) pins.deadline._shown = false;
    G.fromTo(lineFg, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: first ? 1.4 : 0.9, delay: first ? 0.3 : 0.1, ease: "power2.inOut" });
    rideAlong(first ? 0.5 : 0.15);
    first = false;
  }

  // ---------- controls ----------
  const bounce = (el) => G && !reduce && G.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.1, 0.45)" });
  chips.forEach((c) => c.addEventListener("click", () => {
    const s = c.dataset.svc;
    if (state.svcs.has(s) && state.svcs.size === 1) { bounce(c); return; } // keep at least one
    state.svcs.has(s) ? state.svcs.delete(s) : state.svcs.add(s);
    c.setAttribute("aria-pressed", String(state.svcs.has(s)));
    bounce(c);
    render(true);
  }));
  const placePill = () => {
    const b = sizeBtns.find((x) => x.getAttribute("aria-checked") === "true");
    sizePill.style.width = `${b.offsetWidth}px`;
    sizePill.style.transform = `translateX(${b.offsetLeft}px)`;
  };
  sizeBtns.forEach((b) => b.addEventListener("click", () => {
    sizeBtns.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    state.size = b.dataset.size;
    placePill();
    render(true);
  }));
  dlInput.min = new Date(nowIST().day).toISOString().slice(0, 10);
  dlInput.addEventListener("change", () => {
    if (!dlInput.value) { state.deadline = null; dlText.textContent = "Add a deadline"; }
    else {
      const [y, m, d] = dlInput.value.split("-").map(Number);
      state.deadline = Date.UTC(y, m - 1, d);
      dlText.textContent = `Deadline: ${long(state.deadline)}`;
    }
    sec.querySelector(".pl-dl").classList.toggle("set", !!state.deadline);
    render(true);
  });

  // ---------- send this plan: fill in the brief form and go there ----------
  $(".pl-send").addEventListener("click", () => {
    const form = document.querySelector(".bf-form");
    if (form) {
      form.querySelectorAll('input[name="need"]').forEach((i) => {
        const want = [...state.svcs].some((s) => NAMES[s] === i.value);
        if (i.checked !== want) { i.checked = want; i.dispatchEvent(new Event("change", { bubbles: true })); }
      });
      const r = form.querySelector(`input[name="budget"][value="${state.size}"]`);
      if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
      const dl = form.querySelector('input[name="deadline"]');
      if (dl) dl.value = new Date(state.deadline || P.files).toISOString().slice(0, 10);
      const br = form.querySelector('textarea[name="brief"]');
      if (br && !br.value.trim()) br.value = `Planned on your site: ${[...state.svcs].map((s) => NAMES[s]).join(" + ")} (${state.size}). First draft by ${long(P.draft)}, files by ${long(P.files)}.`;
    }
    const target = document.querySelector("#brief");
    if (window.KA?.lenis) KA.lenis.scrollTo(target, { offset: -40, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => form?.querySelector('input[name="name"]')?.focus({ preventScroll: true }), 1700);
  });

  // ---------- first reveal, then stay live ----------
  document.fonts?.ready.then(placePill);
  placePill();
  let started = false;
  const start = () => { if (started) return; started = true; render(true); };
  if (!G || reduce || !window.ScrollTrigger) { render(false); started = true; }
  else {
    G.registerPlugin(ScrollTrigger);
    render(false); // lay it out once so the page height is right
    first = true;
    KEYS.forEach((k) => { pins[k].style.opacity = 0; pins[k]._shown = false; });
    lineFg.style.strokeDashoffset = `${lineFg.getTotalLength()}`;
    G.from(sec.querySelectorAll(".w8"), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 75%" } });
    G.from([".pl-sub", ".pl-controls"].map((s) => $(s)), { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 70%" } });
    G.from(daysEl.children, { y: 40, rotateX: -70, opacity: 0, transformOrigin: "50% 100%", duration: 0.8, ease: "expo.out", stagger: 0.02, scrollTrigger: { trigger: track, start: "top 85%", onEnter: start } });
    G.from([".pl-pay-a", ".pl-pay-b"].map((s) => $(s)), { scaleX: 0, transformOrigin: "0 50%", duration: 1.1, ease: "expo.inOut", stagger: 0.15, scrollTrigger: { trigger: ".pl-pay", start: "top 88%" } });
    G.from($$(".pl-coins i"), { y: -40, opacity: 0, duration: 0.7, ease: "bounce.out", stagger: 0.08, scrollTrigger: { trigger: ".pl-pay", start: "top 85%" } });
    G.from($(".pl-foot"), { y: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".pl-foot", start: "top 92%" } });
  }

  let rw = innerWidth;
  addEventListener("resize", () => {
    if (Math.abs(innerWidth - rw) < 2) return;
    rw = innerWidth;
    placePill();
    if (started) { const f = first; first = true; render(false); first = f; }
  });
})();
