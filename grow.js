/* =========================================================
   Intro "Wachstum" (Startseite)
   Das Video liegt als Einzelbilder vor: intro/ (Hochformat, Handy)
   und intro-wide/ (Querformat, Computer).
   Beim Scrollen wird das passende Bild auf ein <canvas> gemalt –
   so läuft es vorwärts und rückwärts, auch auf dem iPhone flüssig.
   Dazu: Texte zu den Stationen und Bewertungen in Sprechblasen.
   ========================================================= */
(function () {
    "use strict";
    const sec = document.getElementById("grow");
    if (!sec) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { sec.classList.add("is-off"); return; }

    /* ---------- Einstellungen ---------- */
    // Je Video: Ordner, Bildanzahl, Seitenverhältnis, Zeitpunkte der Texte (data-range / data-range-wide) und Bewertungen
    const SETS = {
        tall: { dir: "intro", v: 2, frames: 80, ratio: 9 / 16, capAttr: "range", reviews: [0.56, 1.2] },
        wide: { dir: "intro-wide", v: 2, frames: 90, ratio: 16 / 9, capAttr: "rangeWide", reviews: [0.45, 1.2] }
    };
    const VIDEO_END = 0.84;                               // bis hierhin läuft das Video, danach bleibt das letzte Bild stehen und der Hero schiebt sich darüber
    let SET = null, FRAMES = 0, REVIEWS_FROM = 0, REVIEWS_TO = 0;

    const stage = sec.querySelector(".grow-stage");
    const fg = sec.querySelector(".grow-fg");
    const fctx = fg.getContext("2d");

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const ease = (t) => t * t * (3 - 2 * t);
    const back = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const r2 = (n) => Math.round(n * 100) / 100;

    /* ---------- Bilder laden: erst das erste, dann der Reihe nach ---------- */
    let imgs = [], ready = [], loadId = 0;
    function load(i, id, tries = 0) {
        return new Promise((res) => {
            const im = new Image();
            im.onload = () => {
                if (id !== loadId) return res();
                imgs[i] = im; ready[i] = true; res();
                if (i === curFrame || drawn < 0 || Math.abs(i - curFrame) < Math.abs(drawn - curFrame)) draw(true);
            };
            // bei Netzwerkfehler bis zu 2x neu versuchen
            im.onerror = () => { if (tries < 2 && id === loadId) setTimeout(() => load(i, id, tries + 1).then(res), 800); else res(); };
            im.src = `${SET.dir}/f${String(i + 1).padStart(3, "0")}.webp?v=${SET.v}`;
        });
    }
    function useSet(key) {
        if (SET === SETS[key]) return;
        SET = SETS[key]; FRAMES = SET.frames; [REVIEWS_FROM, REVIEWS_TO] = SET.reviews;
        imgs = new Array(FRAMES); ready = new Array(FRAMES).fill(false);
        const id = ++loadId;
        // Zeiten im HTML sind für ein Videoende bei 0.9 angegeben → auf VIDEO_END umrechnen; der letzte Text bleibt bis zum Schluss
        caps.forEach((c, i) => {
            const [a, b] = (c.el.dataset[SET.capAttr] || c.el.dataset.range).split(" ").map(Number);
            c.a = a * VIDEO_END / 0.9; c.b = i === caps.length - 1 ? 2 : b * VIDEO_END / 0.9;
        });
        (async () => {
            await load(0, id);
            // in Paketen laden, damit es schnell vorangeht, ohne alles auf einmal anzufragen
            // erst jedes 4. Bild (grober Ablauf sofort möglich), dann die Lücken füllen
            const order = [];
            for (let i = 4; i < FRAMES; i += 4) order.push(i);
            for (let i = 1; i < FRAMES; i++) if (i % 4) order.push(i);
            for (let j = 0; j < order.length && id === loadId; j += 8) await Promise.all(order.slice(j, j + 8).map((i) => load(i, id)));
        })();
    }
    function nearest(i) {
        for (let d = 0; d < FRAMES; d++) {
            if (i - d >= 0 && ready[i - d]) return i - d;
            if (i + d < FRAMES && ready[i + d]) return i + d;
        }
        return -1;
    }

    /* ---------- Zeichnen ---------- */
    let SW = 1, SH = 1, DPR = 1, curFrame = 0, drawn = -1;
    function measure() {
        SW = stage.clientWidth || 1; SH = stage.clientHeight || 1;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        fg.width = Math.round(SW * DPR); fg.height = Math.round(SH * DPR);
        useSet(SW / SH >= 1.15 ? "wide" : "tall");
        drawn = -1;
        render(true);
    }
    function draw(force) {
        const k = nearest(curFrame);
        if (k < 0 || (!force && k === drawn)) return;
        drawn = k;
        const im = imgs[k], iw = im.naturalWidth, ih = im.naturalHeight;
        const W = fg.width, H = fg.height;
        // Bild füllt immer die ganze Fläche (an den Rändern minimal beschnitten), unten ausgerichtet wegen der Wurzeln
        const s = Math.max(W / iw, H / ih);
        const dw = iw * s, dh = ih * s, dx = (W - dw) / 2, dy = (H - dh) * 0.6;
        fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = "high";
        fctx.clearRect(0, 0, W, H);
        fctx.drawImage(im, dx, dy, dw, dh);
    }

    /* ---------- Texte & Bewertungen ---------- */
    const caps = [...sec.querySelectorAll(".grow-cap")].map((c) => ({ el: c, a: 0, b: 0 }));
    const reviewBox = sec.querySelector(".grow-reviews");
    let reviews = [];
    const POS = [
        { cls: "is-left", css: "left:5%;top:10%", origin: "80% 110%" },
        { cls: "is-right", css: "right:5%;top:15%", origin: "20% 110%" },
        // 3. und 4. erscheinen an derselben Stelle wie 1. und 2. (als zweites Paar) → nie über dem Text unten
        { cls: "is-left", css: "left:5%;top:10%", origin: "80% 110%" },
        { cls: "is-right", css: "right:5%;top:15%", origin: "20% 110%" }
    ];
    const short = (s, n) => { s = s.replace(/\s+/g, " ").trim(); if (s.length <= n) return s; const cut = s.slice(0, n), sp = cut.lastIndexOf(" "); return cut.slice(0, sp > n * 0.6 ? sp : n) + "…"; };
    // Bewertungen kommen aus Firestore (script.js gibt alle weiter) – die 4 längsten, keine erfundenen Texte
    function pullReviews() {
        const all = (window.__allComments || []).filter((c) => (c.text || "").trim());
        if (!all.length || reviews.length) return;
        const pick = [...all].sort((x, y) => (y.text || "").length - (x.text || "").length).slice(0, 4);
        reviews = pick.map((c, i) => {
            const pos = POS[i];
            const box = document.createElement("figure");
            box.className = "grow-review " + pos.cls;
            box.style.cssText = pos.css + `;--origin:${pos.origin}`;
            const p = document.createElement("p");
            p.textContent = "“" + short(c.text, 260) + "”";
            const f = document.createElement("footer");
            const nm = document.createElement("strong"); nm.textContent = c.name || "";
            const n = Math.max(1, Math.min(5, Math.round(Number(c.stars) || 5)));
            const st = document.createElement("span"); st.className = "stars"; st.textContent = "★".repeat(n) + "☆".repeat(5 - n);
            f.append(nm, st);
            box.append(p, f);
            reviewBox.appendChild(box);
            return box;
        });
        render(true);
    }
    document.addEventListener("comments-loaded", pullReviews);
    pullReviews();

    const hint = sec.querySelector(".grow-hint"), skip = sec.querySelector(".grow-skip");
    skip.addEventListener("click", () => { const h = document.getElementById("home"); if (!h) return; if (window.__lenis) window.__lenis.scrollTo(h); else h.scrollIntoView({ behavior: "smooth" }); });

    /* ---------- Ein Bild für Fortschritt p ---------- */
    let lastP = -1;
    function render(force) {
        const rect = sec.getBoundingClientRect();
        const headerH = parseFloat(getComputedStyle(stage).top) || 0;
        const p = clamp((headerH - rect.top) / (rect.height - stage.offsetHeight));
        // Während des Intros keine schwebenden Knöpfe über dem Text
        document.documentElement.classList.toggle("in-intro", rect.bottom > stage.offsetHeight * 0.6);
        if (!force && p === lastP) return;
        lastP = p;

        curFrame = Math.round(clamp(p / VIDEO_END) * (FRAMES - 1));
        draw(force);

        for (const c of caps) {
            const v = Math.min(seg(p, c.a - 0.01, c.a + 0.01), 1 - seg(p, c.b - 0.01, c.b + 0.01));
            c.el.style.opacity = r2(v);
            c.el.style.transform = `translateY(${r2((1 - v) * 10)}px)`;
        }

        // Bewertungen: breit = nacheinander dazu; schmal = eine nach der anderen
        if (reviews.length) {
            const n = reviews.length, wide = SW >= 900;
            reviews.forEach((el, i) => {
                let v;
                if (wide) {
                    // breit: erst Paar 1 (links+rechts), dann Paar 2 an derselben Stelle; das letzte Paar bleibt
                    const pairs = Math.ceil(n / 2), k = Math.floor(i / 2), len = (VIDEO_END + 0.06 - REVIEWS_FROM) / pairs;
                    const a = REVIEWS_FROM + k * len + (i % 2) * 0.02;
                    v = Math.min(seg(p, a, a + 0.02), k === pairs - 1 ? 1 : 1 - seg(p, REVIEWS_FROM + (k + 1) * len - 0.025, REVIEWS_FROM + (k + 1) * len - 0.005));
                }
                else { const len = (0.98 - REVIEWS_FROM) / n, a = REVIEWS_FROM + i * len; v = Math.min(seg(p, a, a + 0.015), i === n - 1 ? 1 : 1 - seg(p, a + len - 0.015, a + len)); }  // Handy: eine nach der anderen, die letzte bleibt
                el.style.opacity = r2(v);
                el.style.transform = `scale(${r2(0.85 + 0.15 * back(v))})`;
            });
        }

        hint.style.opacity = r2(1 - seg(p, 0, 0.025));
        skip.style.opacity = r2(1 - seg(p, VIDEO_END, VIDEO_END + 0.03));
        skip.style.visibility = p > VIDEO_END + 0.03 ? "hidden" : "visible";
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; render(false); });
    }, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    /* ---------- Einrasten: bleibt man kurz nach dem Intro stehen, rutscht der Hero genau unter den Header ---------- */
    const hero = document.getElementById("home");
    let stopTimer = 0, snapping = false;
    window.addEventListener("scroll", () => {
        clearTimeout(stopTimer);
        if (snapping) return;
        stopTimer = setTimeout(() => {
            if (!hero) return;
            const headerH = parseFloat(getComputedStyle(stage).top) || 0;
            const d = hero.getBoundingClientRect().top - headerH;      // >0: Intro schaut oben noch raus, <0: Hero schon etwas drüber
            const vh = window.innerHeight;
            if (Math.abs(d) < 3 || d > vh * 0.4 || d < -vh * 0.25) return;
            snapping = true;
            if (window.__lenis) window.__lenis.scrollTo(window.scrollY + d, { duration: 0.6 }); else window.scrollBy({ top: d, behavior: "smooth" });
            setTimeout(() => { snapping = false; }, 700);
        }, 160);
    }, { passive: true });
})();
