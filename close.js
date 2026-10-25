// Web3Forms access key for the brief form (free at https://web3forms.com, the key is tied to Kirti's inbox).
// Paste it between the quotes. While it's empty, the form opens a pre-filled email draft instead.
const FORM_KEY = "";

// The last stretch: the FAQ, the brief form and her goodbye peek (eyes on the Send button).
// Reviews, "Find me" and the footer moved to ported.js (Oct 25).
(() => {
  if (!window.gsap) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);

  // page height changed (FAQ opened, form swapped for the thank-you card): let Lenis and ScrollTrigger re-measure
  let reflowT = 0;
  const reflow = () => {
    clearTimeout(reflowT);
    reflowT = setTimeout(() => { window.KA?.lenis?.resize?.(); ST?.refresh(); }, 120);
  };

  // (the review cards, the "Find me" cards and the footer logotype run in ported.js)

  // ---------- FAQ: one answer open at a time, height eases open ----------
  const fq = document.querySelector(".fq");
  if (fq) {
    fq.classList.add("is-ready");
    const qs = [...fq.querySelectorAll(".fq-q")];
    const setOpen = (btn, open) => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.setAttribute("aria-expanded", String(open));
      btn.closest(".fq-item")?.classList.toggle("is-open", open);
      gsap.killTweensOf(panel);
      if (open) {
        gsap.set(panel, { visibility: "visible" });
        gsap.to(panel, { height: "auto", duration: reduce ? 0 : 0.6, ease: "expo.out", onComplete: reflow });
      } else {
        gsap.to(panel, { height: 0, duration: reduce ? 0 : 0.45, ease: "power3.inOut",
          onComplete: () => { gsap.set(panel, { visibility: "hidden" }); reflow(); } });
      }
    };
    qs.forEach((b) => b.addEventListener("click", () => {
      const open = b.getAttribute("aria-expanded") !== "true";
      qs.forEach((o) => { if (o !== b && o.getAttribute("aria-expanded") === "true") setOpen(o, false); });
      setOpen(b, open);
    }));
  }

  // ---------- reveals ----------
  if (ST && !reduce) {
    const rise = (sel, trig) => document.querySelector(trig) && gsap.from(sel, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: trig, start: "top 80%" } });
    rise(".fq-w", ".fq");
    rise(".w7", ".bf");
    gsap.from(".fq-item", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".fq-list", start: "top 85%" } });
    gsap.from(".bf-form", { y: 50, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".bf-form", start: "top 85%" } });
    gsap.from(".bf-alt li", { y: 16, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".bf-alt", start: "top 90%" } });
    if (document.querySelector(".av2")) gsap.from(".av2", { yPercent: 40, duration: 1.4, ease: "power4.out", scrollTrigger: { trigger: ".av2", start: "top 98%" } });
  }

  // ---------- copy email ----------
  const copy = document.querySelector(".bf-copy");
  if (copy) copy.addEventListener("click", async () => {
    const s = copy.querySelector(".bf-copy-s");
    try { await navigator.clipboard.writeText(copy.dataset.email); s.textContent = "Copied"; copy.classList.add("ok"); }
    catch { s.textContent = "Select it"; }
    setTimeout(() => { s.textContent = "Copy"; copy.classList.remove("ok"); }, 2000);
  });

  // ---------- the brief form ----------
  const form = document.querySelector(".bf-form");
  const done = document.querySelector(".bf-done");
  if (form) {
    const msg = form.querySelector(".bf-msg");
    const btn = form.querySelector(".bf-btn");
    const hint = form.querySelector(".bf-hint");
    const hintDefault = hint?.textContent || "";
    const email = copy?.dataset.email || "";

    // budget chips: the line underneath explains the picked size in ₹
    form.querySelectorAll('input[name="budget"]').forEach((r) => r.addEventListener("change", () => {
      if (hint && r.checked) hint.textContent = r.dataset.hint || hintDefault;
    }));

    const fields = (data) => ({
      name: (data.get("name") || "").trim(),
      agency: (data.get("agency") || "").trim(),
      email: (data.get("email") || "").trim(),
      need: data.getAll("need").join(", "),
      deadline: data.get("deadline") || "",
      budget: data.get("budget") || "",
      brief: (data.get("brief") || "").trim(),
    });

    function openDraft(f) {
      const lines = [`Name: ${f.name}`, `Agency: ${f.agency || "-"}`, `Email: ${f.email}`,
        `Need: ${f.need || "-"}`, `Deadline: ${f.deadline || "-"}`, `Budget: ${f.budget || "-"}`, "", f.brief];
      location.href = `mailto:${email}?subject=${encodeURIComponent(`Brief from ${f.agency || f.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
    }

    // swap the form for the thank-you card
    function showDone(mode, name) {
      if (!done) return;
      const title = done.querySelector(".bf-done-title");
      const text = done.querySelector(".bf-done-text");
      const again = done.querySelector(".bf-again");
      const first = name.split(/\s+/)[0];
      done.dataset.mode = mode;
      if (mode === "sent") {
        title.textContent = `Thanks${first ? `, ${first}` : ""}. Your brief is in.`;
        text.textContent = "I'll reply within [4] working hours with a quote and a timeline.";
        again.textContent = "Send another brief";
      } else {
        title.textContent = "Your email app has the brief ready.";
        text.textContent = `Hit send there and I'll reply within [4] working hours. If nothing opened, write to ${email}.`;
        again.textContent = "Back to the form";
      }
      const h = innerWidth > 900 ? Math.min(form.offsetHeight, 560) : 0;
      const swap = () => {
        form.hidden = true;
        done.hidden = false;
        done.style.minHeight = h ? `${h}px` : "";
        const tick = done.querySelectorAll(".bf-done-tick circle, .bf-done-tick path");
        if (!reduce) {
          gsap.fromTo(done, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out" });
          gsap.fromTo(tick, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power3.out", stagger: 0.25, delay: 0.15 });
          gsap.from(done.querySelectorAll(".bf-done-title, .bf-done-text, .bf-again"), { y: 14, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.08, delay: 0.25 });
        } else gsap.set(tick, { strokeDashoffset: 0 });
        done.focus({ preventScroll: true });
        reflow();
      };
      if (reduce) swap();
      else gsap.to(form, { y: -16, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: swap });
      celebrate();
    }

    done?.querySelector(".bf-again")?.addEventListener("click", () => {
      done.hidden = true;
      done.style.minHeight = "";
      form.hidden = false;
      msg.className = "bf-msg";
      msg.textContent = "";
      gsap.killTweensOf(form);
      if (reduce) gsap.set(form, { y: 0, opacity: 1 });
      else gsap.fromTo(form, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
      form.elements.name.focus({ preventScroll: true });
      reflow();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.elements.name, mail = form.elements.email;
      [name, mail].forEach((f) => { f.classList.remove("bad"); f.removeAttribute("aria-invalid"); });
      const bad = [];
      if (!name.value.trim()) bad.push(name);
      if (!/^\S+@\S+\.\S+$/.test(mail.value.trim())) bad.push(mail);
      if (bad.length) {
        bad.forEach((f) => { f.classList.add("bad"); f.setAttribute("aria-invalid", "true"); });
        bad[0].focus();
        msg.className = "bf-msg err";
        msg.textContent = bad.includes(name) ? "Add your name so I know who to reply to." : "That email doesn't look right.";
        if (!reduce) gsap.fromTo(form, { x: 0 }, { keyframes: [{ x: -8, duration: 0.05 }, { x: 7, duration: 0.06 }, { x: -4, duration: 0.06 }, { x: 0, duration: 0.08 }] });
        return;
      }
      const f = fields(new FormData(form));
      // bots tick the hidden box; pretend it worked and send nothing
      if (form.elements.botcheck?.checked) { showDone("sent", f.name); return; }

      if (!FORM_KEY) { openDraft(f); showDone("draft", f.name); return; }

      btn.disabled = true;
      msg.className = "bf-msg";
      msg.textContent = "Sending…";
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: FORM_KEY,
            subject: `New brief from ${f.agency || f.name}`,
            from_name: "Kirti's portfolio",
            ...f,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || String(res.status));
        form.reset();
        if (hint) hint.textContent = hintDefault;
        msg.textContent = "";
        showDone("sent", f.name);
      } catch {
        // the send failed: hand the visitor an email draft so the brief isn't lost
        msg.className = "bf-msg err";
        msg.textContent = "That didn't go through, so I've opened an email draft instead.";
        openDraft(f);
        showDone("draft", f.name);
      } finally { btn.disabled = false; }
    });
  }

  // ---------- her goodbye peek: eyes follow you, lock onto the button, widen on hover ----------
  const av = document.querySelector(".av2");
  const sendBtn = document.querySelector(".bf-btn");
  // celebrate(): called when a brief goes out. Also fires "ka:brief-sent" so a new character rig can react.
  function celebrate() {
    document.dispatchEvent(new CustomEvent("ka:brief-sent"));
    if (reduce || !av || !eyes.length) return;
    pupil("80%");
    gsap.fromTo(av, { y: 0 }, { y: -26, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 3 });
    setTimeout(() => pupil("68%"), 1600);
  }
  let eyes = [];
  const pupil = (v) => eyes.forEach((e) => gsap.to(e.iris, { "--pupil": v, duration: 0.5, ease: "power3.out" }));
  if (!av) return;
  eyes = [...av.querySelectorAll(".eye")].map((el) => ({ el, iris: el.querySelector(".iris"), hls: el.querySelectorAll(".hl"), x: 0, y: 0 })).filter((e) => e.iris);
  const ptr = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
  let lock = false, avVisible = false;
  addEventListener("pointermove", (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); }, { passive: true });
  sendBtn?.addEventListener("pointerenter", () => { lock = true; pupil("78%"); });
  sendBtn?.addEventListener("pointerleave", () => { lock = false; pupil("68%"); });
  function tick() {
    if (!avVisible) return;
    // idle for a few seconds: she looks at the button
    const idle = performance.now() - ptr.t > 2500;
    let tx = ptr.x, ty = ptr.y;
    if ((lock || idle) && sendBtn && !sendBtn.closest("[hidden]")) { const r = sendBtn.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
    eyes.forEach((e) => {
      const r = e.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, size = r.width;
      const dx = tx - cx, dy = ty - cy, dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / (Math.min(innerWidth, innerHeight) * 0.4));
      const mx = size * 0.27, my = size * 0.24;
      e.x += ((dx / dist) * reach * mx - e.x) * (lock ? 0.2 : 0.14);
      e.y += ((dy / dist) * reach * my - e.y) * (lock ? 0.2 : 0.14);
      const off = Math.min(1, Math.hypot(e.x / mx, e.y / my)), ang = Math.atan2(e.y, e.x);
      e.iris.style.transform = `translate3d(${e.x}px, ${e.y}px, 0) rotate(${ang}rad) scaleX(${1 - 0.16 * off * off}) rotate(${-ang}rad)`;
      e.hls.forEach((h) => (h.style.transform = `translate3d(${-e.x * 0.5}px, ${-e.y * 0.5}px, 0)`));
    });
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(([en]) => {
    const was = avVisible;
    avVisible = en.isIntersecting;
    if (avVisible && !was) requestAnimationFrame(tick);
  }).observe(av);
})();
