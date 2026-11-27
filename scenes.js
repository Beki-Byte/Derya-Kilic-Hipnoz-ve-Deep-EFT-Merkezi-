/* =========================================================
   Szenen der Startseite (TR / DE / EN) – siehe CONCEPT.md
   1. Hero: Mamas Logo-Baum aus leuchtenden Punkten (WebGL),
      weicht Maus/Finger aus und rieselt beim Scrollen nach unten
   2. Muttersprache: riesiges Laufband, das mit dem Scrollen fährt
   3. Ablauf: Schritte leuchten nacheinander auf (gepinnt, wenn Platz)
   4. Preise zählen hoch
   5. Bewertungen als endloses Band (echte Bewertungen aus Firestore)
   6. Termin-Bereich: warmes Licht folgt Maus/Finger
   Ohne WebGL / bei „Bewegung reduzieren“ bleibt die normale Seite.
   ========================================================= */
(function () {
    "use strict";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    const EASE = "power3.out";
    const fine = window.matchMedia("(any-pointer: fine)").matches;

    /* =====================================================
       1. Partikel-Baum im Hero
       ===================================================== */
    const hero = document.querySelector(".hero");
    function initTree() {
        if (!hero) return;
        const canvas = document.createElement("canvas");
        canvas.className = "hero-particles";
        canvas.setAttribute("aria-hidden", "true");
        const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
        if (!gl) return;
        hero.prepend(canvas);
        hero.classList.add("has-particles");

        const img = new Image();
        img.src = (document.querySelector('.brand img')?.getAttribute("src") || "logobaum.png");
        img.onload = () => build(img);

        function build(img) {
            // Logo abtasten: dunkle, deckende Pixel werden zu Punkten
            const W = 260, H = Math.round(260 * img.naturalHeight / img.naturalWidth);
            const c = document.createElement("canvas"); c.width = W; c.height = H;
            const cx = c.getContext("2d", { willReadFrequently: true });
            cx.drawImage(img, 0, 0, W, H);
            const data = cx.getImageData(0, 0, W, H).data;
            const pts = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                const k = (y * W + x) * 4, a = data[k + 3], lum = (data[k] + data[k + 1] + data[k + 2]) / 3;
                if (a > 120 && lum < 170) pts.push([x, y]);
            }
            if (!pts.length) return;
            const small = window.innerWidth < 760;
            const N = small ? 4200 : fine ? 9000 : 6000;
            const aspectImg = W / H;
            const target = new Float32Array(N * 2), rnd = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) {
                const p = pts[(Math.random() * pts.length) | 0];
                target[i * 2] = ((p[0] + Math.random()) / W - 0.5) * aspectImg;
                target[i * 2 + 1] = -((p[1] + Math.random()) / H - 0.5);
                rnd[i * 3] = Math.random(); rnd[i * 3 + 1] = Math.random(); rnd[i * 3 + 2] = Math.random();
            }

            const vs = `
                attribute vec2 aTarget; attribute vec3 aRand;
                uniform float uTime, uIntro, uScroll, uAspect, uScale, uSize, uPx;
                uniform vec2 uMouse;
                varying float vMix; varying float vAlpha;
                void main() {
                    vec2 p = aTarget;
                    // Zusammenfinden: Punkte schweben aus einer Wolke an ihren Platz
                    float t = clamp((uIntro * 1.6) - aRand.z * 0.6, 0.0, 1.0);
                    t = t * t * (3.0 - 2.0 * t);
                    vec2 cloud = (aRand.xy - 0.5) * vec2(2.4, 1.6) + vec2(0.0, 0.25);
                    p = mix(cloud, p, t);
                    // Atmen
                    p += 0.0045 * vec2(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0));
                    // Maus/Finger: Punkte weichen sanft aus
                    vec2 d = p - uMouse; float dist = length(d);
                    p += normalize(d + 1e-5) * 0.11 * exp(-dist * dist * 55.0);
                    // Scrollen: Punkte rieseln nach unten in die Wurzeln
                    float s = uScroll * uScroll;
                    p.y -= s * (0.9 + aRand.z * 1.6);
                    p.x += s * (aRand.x - 0.5) * 0.7;
                    gl_Position = vec4(p.x * uScale / uAspect, p.y * uScale - 0.04, 0.0, 1.0);
                    gl_PointSize = uSize * uPx * (0.55 + aRand.z * 0.9);
                    vMix = aRand.y;
                    vAlpha = (0.5 + 0.5 * aRand.x) * (1.0 - uScroll * 0.85) * t;
                }`;
            const fs = `
                precision mediump float;
                uniform vec3 uColA, uColB;
                varying float vMix; varying float vAlpha;
                void main() {
                    vec2 c = gl_PointCoord - 0.5; float r = length(c);
                    float a = smoothstep(0.5, 0.15, r) * vAlpha;
                    vec3 col = mix(uColA, uColB, vMix);
                    gl_FragColor = vec4(col * a, a);
                }`;
            const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
            const prog = gl.createProgram();
            gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
            gl.useProgram(prog);
            const buf = (arr, name, size) => {
                const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
                const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
            };
            buf(target, "aTarget", 2); buf(rnd, "aRand", 3);
            const U = {}; ["uTime", "uIntro", "uScroll", "uAspect", "uScale", "uSize", "uPx", "uMouse", "uColA", "uColB"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
            gl.uniform3f(U.uColA, 0.61, 0.42, 0.31);   // Ton
            gl.uniform3f(U.uColB, 0.79, 0.59, 0.36);   // Bernstein
            gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            const state = { intro: 0, scroll: 0, mx: 9, my: 9, tmx: 9, tmy: 9, scale: 1, aspect: 1 };
            let visible = true, raf = 0, t0 = performance.now();
            const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
            function resize() {
                const r = hero.getBoundingClientRect();
                canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
                gl.viewport(0, 0, canvas.width, canvas.height);
                state.aspect = r.width / r.height;
                // Baum füllt ~90 % der Höhe, passt aber immer in die Breite
                state.scale = Math.min(1.8, 1.85 * state.aspect / aspectImg);
                gl.uniform1f(U.uAspect, state.aspect); gl.uniform1f(U.uScale, state.scale);
                gl.uniform1f(U.uPx, dpr); gl.uniform1f(U.uSize, small ? 3.2 : 3.6);
            }
            resize(); window.addEventListener("resize", resize);

            // Maus / Finger
            const move = (e) => {
                const r = canvas.getBoundingClientRect();
                const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
                state.tmx = nx * state.aspect / state.scale; state.tmy = (ny + 0.04) / state.scale;
            };
            hero.addEventListener("pointermove", move);
            hero.addEventListener("pointerdown", move);
            hero.addEventListener("pointerleave", () => { state.tmx = 9; state.tmy = 9; });

            // Zusammenfinden, sobald der Hero zum ersten Mal sichtbar ist
            ScrollTrigger.create({ trigger: hero, start: "top 70%", once: true, onEnter: () => gsap.to(state, { intro: 1, duration: 2.6, ease: "power2.out" }) });
            // Rieseln beim Verlassen
            ScrollTrigger.create({ trigger: hero, start: "top top+=80", end: "bottom top", scrub: true, onUpdate: (st) => { state.scroll = st.progress; } });
            new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) loop(); }).observe(hero);

            function loop() {
                if (!visible) { raf = 0; return; }
                raf = requestAnimationFrame(loop);
                state.mx += (state.tmx - state.mx) * 0.12; state.my += (state.tmy - state.my) * 0.12;
                gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
                gl.uniform1f(U.uTime, (performance.now() - t0) / 1000);
                gl.uniform1f(U.uIntro, state.intro); gl.uniform1f(U.uScroll, state.scroll);
                gl.uniform2f(U.uMouse, state.mx, state.my);
                gl.drawArrays(gl.POINTS, 0, N);
            }
            loop();
        }
    }

    /* =====================================================
       2. Muttersprache: riesiges Laufband
       ===================================================== */
    function initLangMarquee() {
        const sec = document.getElementById("language");
        const word = document.querySelector(".trust-item strong")?.textContent.trim();
        if (!sec || !word) return;
        const band = document.createElement("div");
        band.className = "lang-band"; band.setAttribute("aria-hidden", "true");
        const row = document.createElement("div"); row.className = "lang-band-row";
        for (let i = 0; i < 6; i++) { const s = document.createElement("span"); s.textContent = word; row.appendChild(s); const d = document.createElement("i"); d.textContent = "✦"; row.appendChild(d); }
        band.appendChild(row);
        sec.prepend(band);
        gsap.fromTo(row, { xPercent: 0 }, { xPercent: -35, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 1 } });
    }

    /* =====================================================
       3. Ablauf: Schritte leuchten nacheinander auf
       ===================================================== */
    function initSteps() {
        const sec = document.getElementById("process");
        const wrap = sec?.querySelector(".steps");
        if (!wrap) return;
        const steps = [...wrap.querySelectorAll(".step")];
        steps.forEach((s) => s.classList.remove("reveal"));
        const line = document.createElement("div"); line.className = "steps-line"; line.innerHTML = "<span></span>";
        wrap.prepend(line);
        const canPin = sec.offsetHeight < window.innerHeight * 0.95;
        const tl = gsap.timeline({
            scrollTrigger: canPin
                ? { trigger: sec, start: "top top+=60", end: "+=" + Math.round(window.innerHeight * 1.3), pin: true, scrub: 1 }
                : { trigger: wrap, start: "top 80%", end: "bottom 45%", scrub: 1 }
        });
        tl.to(line.firstChild, { scaleX: 1, ease: "none", duration: 3 }, 0);
        steps.forEach((s, i) => {
            gsap.set(s, { opacity: 0.12, y: 40 });
            tl.to(s, { opacity: 1, y: 0, duration: 0.8, ease: EASE }, i * 1)
              .fromTo(s.querySelector(".step-num"), { scale: 0.6, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.8, ease: "back.out(2)" }, i * 1);
        });
    }

    /* =====================================================
       4. Preise zählen hoch
       ===================================================== */
    function initCounters() {
        document.querySelectorAll(".price-card .price").forEach((el) => {
            const node = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
            if (!node) return;
            const m = node.textContent.match(/(\d+)/); if (!m) return;
            const end = +m[1], before = node.textContent.slice(0, m.index), after = node.textContent.slice(m.index + m[1].length);
            const o = { v: 0 };
            node.textContent = before + "0" + after;
            gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%", once: true }, onUpdate: () => { node.textContent = before + Math.round(o.v) + after; } });
        });
    }

    /* =====================================================
       5. Bewertungen als endloses Band
       ===================================================== */
    function initReviewBand() {
        const grid = document.getElementById("comments-grid");
        if (!grid) return;
        let done = false;
        const build = () => {
            const all = (window.__allComments || []).filter((c) => (c.text || "").trim().length > 25);
            if (done || all.length < 3) return;
            done = true;
            const band = document.createElement("div"); band.className = "review-band"; band.setAttribute("aria-hidden", "true");
            const short = (s) => { s = s.replace(/\s+/g, " ").trim(); return s.length > 140 ? s.slice(0, s.lastIndexOf(" ", 140)) + "…" : s; };
            [all, [...all].reverse()].forEach((list, r) => {
                const row = document.createElement("div"); row.className = "review-band-row" + (r ? " is-rev" : "");
                const track = document.createElement("div"); track.className = "review-band-track";
                const items = list.slice(0, 10);
                [...items, ...items].forEach((c) => {
                    const it = document.createElement("figure"); it.className = "review-band-item";
                    const q = document.createElement("p"); q.textContent = "“" + short(c.text) + "”";
                    const f = document.createElement("figcaption");
                    const n = Math.max(1, Math.min(5, Math.round(Number(c.stars) || 5)));
                    f.textContent = (c.name || "") + "  " + "★".repeat(n);
                    it.append(q, f); track.appendChild(it);
                });
                track.style.setProperty("--dur", Math.max(40, items.length * 9) + "s");
                row.appendChild(track); band.appendChild(row);
            });
            const head = document.querySelector("#reviews .section-head");
            (head || grid).after(band);
            ScrollTrigger.refresh();
        };
        document.addEventListener("comments-loaded", build);
        build();
    }

    /* =====================================================
       6. Termin-Bereich: warmes Licht folgt Maus/Finger
       ===================================================== */
    function initCtaLight() {
        document.querySelectorAll(".cta-banner").forEach((b) => {
            const set = (e) => { const r = b.getBoundingClientRect(); b.style.setProperty("--lx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%"); b.style.setProperty("--ly", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"); b.classList.add("is-lit"); };
            b.addEventListener("pointermove", set); b.addEventListener("pointerdown", set);
            b.addEventListener("pointerleave", () => b.classList.remove("is-lit"));
        });
    }

    // Hero-Baum übernimmt jetzt flow.js (Punkte-Reise über die ganze Seite)
    initLangMarquee();
    initSteps();
    initCounters();
    initReviewBand();
    initCtaLight();
})();
