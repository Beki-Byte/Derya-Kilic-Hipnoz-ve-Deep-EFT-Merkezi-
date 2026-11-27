/* =========================================================
   Bewegungs-Ebene für alle Seiten (siehe CONCEPT.md)
   Arbeitet nur mit dem vorhandenen HTML – Funktionen in script.js
   bleiben unberührt. Ohne GSAP oder bei „Bewegung reduzieren“
   bleibt alles einfach sichtbar.
   ========================================================= */
(function () {
    "use strict";
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // „Gibt es irgendeine Maus/ein Trackpad?“ – auch ein Tablet mit Maus zählt als Computer
    const fine = window.matchMedia("(any-pointer: fine)").matches || window.matchMedia("(any-hover: hover)").matches;
    const tier = reduced ? "low" : fine ? "high" : "mid";
    html.dataset.tier = tier;

    const page = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
    // Seiten mit Kalender, Dialogen oder Chat: natives Scrollen behalten
    const APP_PAGES = ["kalender", "portal", "odeme", "asistent"];
    const isApp = APP_PAGES.includes(page);
    const veil = document.querySelector(".page-veil");
    const hasGsap = !!(window.gsap && window.ScrollTrigger);
    const EASE = "power3.out";

    /* ---------- Ladebild öffnen ---------- */
    function openVeil() {
        if (!veil) return;
        const first = !sessionStorage.getItem("veilSeen");
        try { sessionStorage.setItem("veilSeen", "1"); } catch (e) {}
        const count = veil.querySelector(".veil-count");
        const done = () => requestAnimationFrame(() => { veil.classList.add("is-open"); html.classList.add("is-ready"); });
        if (!first || reduced || !count) { done(); return; }
        // Erster Besuch: kurzer Zähler bis 100 % (max. ~1,6 s, wartet nicht auf alle Bilder)
        const t0 = performance.now(), dur = 1100;
        (function tick(t) {
            const k = Math.min(1, (t - t0) / dur);
            count.textContent = String(Math.round(k * 100)).padStart(3, "0");
            if (k < 1) requestAnimationFrame(tick); else setTimeout(done, 120);
        })(t0);
    }

    /* ---------- Seitenübergang beim Verlassen ---------- */
    function initTransitions() {
        if (!veil || reduced) return;
        document.addEventListener("click", (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest("a[href]");
            if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin) return;
            if (!/\.html$|\/$/.test(url.pathname)) return;
            if (url.pathname === location.pathname && url.hash) return;   // Anker auf derselben Seite
            e.preventDefault();
            veil.classList.remove("is-open");
            veil.classList.add("is-enter-start");
            void veil.offsetWidth;
            veil.classList.remove("is-enter-start");
            veil.classList.add("is-leaving");
            setTimeout(() => { location.href = a.href; }, 520);
        });
        // Zurück-Taste (Seite aus dem Speicher): Vorhang wieder öffnen
        window.addEventListener("pageshow", (e) => { if (e.persisted) { veil.classList.remove("is-leaving"); veil.classList.add("is-open"); } });
    }

    if (!hasGsap) { openVeil(); initTransitions(); return; }
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    // CSS-„scroll-behavior: smooth“ stört GSAP beim Neuberechnen (misst dann an falscher Stelle) → aus.
    // Weiches Springen zu Ankern übernimmt Lenis bzw. der Klick-Handler unten.
    html.style.scrollBehavior = "auto";
    document.addEventListener("click", (e) => {
        if (window.__lenis || e.defaultPrevented) return;
        const a = e.target.closest('a[href*="#"]');
        if (!a) return;
        const url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname || !url.hash || url.hash === "#") return;
        const t = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        history.replaceState(null, "", url.hash);
    });

    /* ---------- Weiches Scrollen (Computer, Inhaltsseiten) ---------- */
    let lenis = null;
    if (tier === "high" && !isApp && window.Lenis) {
        lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -((parseFloat(getComputedStyle(html).getPropertyValue("--header-h")) || 76) + 12) } });
        window.__lenis = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        // Bereiche mit eigenem Scrollen nicht abfangen
        document.querySelectorAll(".chat-panel, .chat-body, .main-nav, .dialog, .fc").forEach((el) => el.setAttribute("data-lenis-prevent", ""));
        new MutationObserver(() => document.querySelectorAll(".dialog, .chat-body").forEach((el) => el.setAttribute("data-lenis-prevent", ""))).observe(document.body, { childList: true });
        // „Nach oben“ über Lenis statt nativ (sonst ruckeln beide gegeneinander)
        document.addEventListener("click", (e) => {
            if (e.target.closest("#toTop")) { e.stopPropagation(); lenis.scrollTo(0); }
        }, true);
        // Menü offen → Seite nicht scrollen
        const nav = document.getElementById("mainNav");
        if (nav) new MutationObserver(() => nav.classList.contains("open") ? lenis.stop() : lenis.start()).observe(nav, { attributes: true, attributeFilter: ["class"] });
    }

    if (reduced) { openVeil(); return; }

    /* ---------- Überschriften Wort für Wort ---------- */
    function splitWords(el) {
        if (el.dataset.split) return [];
        el.dataset.split = "1";
        const words = [];
        const walk = (node) => {
            [...node.childNodes].forEach((n) => {
                if (n.nodeType === 3) {
                    const parts = n.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach((p) => {
                        if (!p) return;
                        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
                        const line = document.createElement("span"); line.className = "split-line";
                        const w = document.createElement("span"); w.className = "split-word"; w.textContent = p;
                        line.appendChild(w); frag.appendChild(line); words.push(w);
                    });
                    n.replaceWith(frag);
                } else if (n.nodeType === 1 && !n.classList.contains("hero-sub")) walk(n);
            });
        };
        walk(el);
        return words;
    }
    const heads = document.querySelectorAll(".section-head h2, .page-hero h1, .about-text h2, .cta-banner h2, .hero h1, .dash-head h1, .login-card h1");
    heads.forEach((h) => {
        const words = splitWords(h);
        if (!words.length) return;
        gsap.set(words, { yPercent: 115, rotate: 3 });
        const inHero = h.closest(".hero, .page-hero");
        gsap.to(words, {
            yPercent: 0, rotate: 0, duration: 1.15, ease: EASE, stagger: 0.045, delay: inHero ? 0.35 : 0,
            scrollTrigger: inHero && !h.closest("#home") ? undefined : { trigger: h, start: "top 88%", once: true }
        });
    });
    // Unterzeile im Hero sanft hinterher
    document.querySelectorAll(".hero .hero-sub, .page-hero p").forEach((el) => gsap.from(el, { opacity: 0, y: 24, duration: 1.2, ease: EASE, delay: 0.7, scrollTrigger: el.closest("#home") ? { trigger: el, start: "top 90%", once: true } : undefined }));

    /* ---------- Zitat wird wie live getippt (mit blinkendem Cursor) ---------- */
    document.querySelectorAll(".about-quote").forEach((q) => {
        const text = q.textContent.trim();
        q.textContent = "";
        q.classList.add("is-typing");
        // Alle Zeichen stehen schon an ihrem Platz (unsichtbar) → nichts springt beim Tippen
        const chars = [...text].map((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; q.appendChild(s); return s; });
        const caret = document.createElement("span"); caret.className = "type-caret"; caret.setAttribute("aria-hidden", "true");
        q.setAttribute("aria-label", text);
        const sig = q.parentElement.querySelector(".signature");
        if (sig) gsap.set(sig, { opacity: 0, y: 12 });
        let i = 0, started = false;
        const step = () => {
            if (i >= chars.length) { caret.classList.add("is-done"); if (sig) gsap.to(sig, { opacity: 1, y: 0, duration: 1, ease: EASE }); return; }
            chars[i].classList.add("on");
            chars[i].after(caret);
            const c = chars[i].textContent; i++;
            // Menschlicher Rhythmus: kurze Pausen nach Satzzeichen, leichtes Zufallstempo
            const pause = /[.!?;]/.test(c) ? 260 : /[,:–]/.test(c) ? 120 : 0;
            setTimeout(step, 9 + Math.random() * 14 + pause * 0.7);
        };
        q.prepend(caret);
        ScrollTrigger.create({ trigger: q, start: "top 78%", once: true, onEnter: () => { if (!started) { started = true; step(); } } });
    });

    /* ---------- Porträt öffnet sich wie ein Vorhang ---------- */
    document.querySelectorAll(".portrait img").forEach((img) => {
        gsap.fromTo(img, { "--clip": "100%" }, { "--clip": "0%", ease: "none", scrollTrigger: { trigger: img, start: "top 95%", end: "top 35%", scrub: 1 } });
        gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* ---------- Leistungen: gepinnte horizontale Scroll-Geschichte (Computer) ---------- */
    const grid = document.querySelector("#services .services-grid");
    if (grid) {
        const pin = document.createElement("div");
        pin.className = "services-pin";
        grid.parentNode.insertBefore(pin, grid);
        pin.appendChild(grid);
        grid.classList.add("is-track");
        const bar = document.createElement("div"); bar.className = "services-progress"; bar.innerHTML = "<span></span>";
        pin.appendChild(bar);
        // Raster aus dem schmalen Container lösen: volle Breite.
        // Äußere Hülle = Bezugspunkt fürs Messen (das festgehaltene Element selbst misst beim Neuberechnen falsch)
        const section = pin.closest(".section");
        const stage = document.createElement("div"); stage.className = "services-stage";
        section.appendChild(stage); stage.appendChild(pin);
        const dist = () => Math.max(0, grid.scrollWidth - window.innerWidth);
        gsap.to(grid, {
            x: () => -dist(), ease: "none",
            scrollTrigger: {
                trigger: stage, pin: pin, start: () => { const hh = parseFloat(getComputedStyle(html).getPropertyValue("--header-h")) || 76; return "top " + Math.max(hh + 10, Math.round((window.innerHeight + hh) / 2 - pin.offsetHeight / 2)) + "px"; },
                end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true,
                onUpdate: (st) => bar.style.setProperty("--p", st.progress.toFixed(3))
            }
        });
        // Karten gleiten nacheinander herein (eigene CSS-Einblendung dafür abschalten)
        [...grid.children].forEach((c) => c.classList.remove("reveal"));
        gsap.fromTo(grid.children, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.06, scrollTrigger: { trigger: stage, start: "top 85%", once: true } });
    }

    /* ---------- Preise: leichtes Gleiten in der Tiefe ---------- */
    document.querySelectorAll(".price-card").forEach((el, i) => {
        gsap.fromTo(el, { y: 40 + (i % 2) * 30 }, { y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: 1 } });
    });

    /* ---------- Hero: Lichtkugeln folgen der Maus ---------- */
    const hero = document.querySelector(".hero");
    if (hero) {
        hero.addEventListener("pointermove", (e) => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
            hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
    }

    /* ---------- Eigener Mauszeiger & Magnet-Buttons (Computer) ---------- */
    if (tier === "high") {   // nur wenn eine Maus/ein Trackpad vorhanden ist (auch Tablet mit Maus)
        const dot = document.createElement("div"); dot.className = "cursor-dot is-hidden";
        const ring = document.createElement("div"); ring.className = "cursor-ring is-hidden";
        document.body.append(dot, ring);
        const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" }), dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
        const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: EASE }), ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: EASE });
        const LINK = "a, button, summary, label, [role='button'], .service-card, .story-card";
        const FIELD = "input, textarea, select, iframe, .fc";
        window.addEventListener("pointermove", (e) => {
            if (e.pointerType !== "mouse") { if (e.pointerType === "touch") { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); html.classList.remove("has-cursor"); } return; }
            html.classList.add("has-cursor");
            dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
            const t = e.target;
            const onField = !!t.closest?.(FIELD);
            dot.classList.toggle("is-hidden", onField); ring.classList.toggle("is-hidden", onField);
            ring.classList.toggle("is-link", !onField && !!t.closest?.(LINK));
        });
        document.addEventListener("pointerleave", () => { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); });

        document.querySelectorAll(".btn, .hbtn, .chat-fab, .footer-social a, .nav-toggle").forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" }), yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
            el.addEventListener("pointermove", (e) => {
                if (e.pointerType !== "mouse") return;
                const r = el.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35);
            });
            el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
        });
    }

    /* ---------- Positionen neu berechnen, wenn Inhalte nachladen ---------- */
    let rt = 0;
    const refresh = () => { clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 200); };
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    if ("ResizeObserver" in window) {
        let lastH = 0;
        new ResizeObserver(() => { const h = document.body.scrollHeight; if (Math.abs(h - lastH) > 40) { lastH = h; refresh(); } }).observe(document.body);
    }

    openVeil();
    initTransitions();
})();
