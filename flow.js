/* =========================================================
   Punkte-Reise über die ganze Startseite (TR / DE / EN)
   Eine einzige Punktwolke (WebGL) liegt fest hinter dem Inhalt und
   begleitet beim Scrollen. In jedem Abschnitt formt sie etwas
   Passendes, dazwischen „regnet“ sie nach unten und setzt sich neu
   zusammen:
     Hero → Baum · Über mich → Herz · Muttersprache → TR·DE ·
     Leistungen → Spirale · Ablauf → 1 2 3 · Preise → € ·
     Fragen → ? · Bewertungen → Stern · Termin → leuchtender Baum
   Dazu wandert die Hintergrundfarbe von Papier zu Erde.
   Ohne WebGL / bei „Bewegung reduzieren“: normale Seite.
   ========================================================= */
(function () {
    "use strict";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    const html = document.documentElement;
    const fine = window.matchMedia("(any-pointer: fine)").matches;

    const canvas = document.createElement("canvas");
    canvas.className = "flow-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return;

    /* ---------- Abschnitte & ihre Formen ---------- */
    const q = (s) => document.querySelector(s);
    const SCENES = [
        { el: q("#home"), shape: "tree", size: 1.0, bg: "#f2ece3" },
        { el: q("#about"), shape: "heart", size: 0.62, bg: "#f2ece3" },
        { el: q("#language"), shape: "text:TR · DE", size: 0.55, bg: "#e9e0d3" },
        { el: q("#services"), shape: "spiral", size: 0.8, bg: "#efe8de" },
        { el: q("#process"), shape: "text:1 2 3", size: 0.55, bg: "#e9e0d3" },
        { el: q("#pricing"), shape: "text:€", size: 0.75, bg: "#ddd0bf" },
        { el: q("#faq"), shape: "text:?", size: 0.8, bg: "#2a201a" },
        { el: q("#reviews"), shape: "star", size: 0.72, bg: "#1e1612" },
        { el: q(".cta-banner")?.closest("section"), shape: "tree", size: 0.85, bg: "#1e1612" }
    ].filter((s) => s.el);
    // Reihenfolge wie auf der Seite (z. B. steht „Termin“ vor den Bewertungen)
    SCENES.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (SCENES.length < 3) return;
    document.body.prepend(canvas);
    html.classList.add("has-flow");

    const small = window.innerWidth < 760;
    const N = small ? 3800 : fine ? 8000 : 5500;

    /* ---------- Formen als Punktlisten (normiert, Höhe = 1) ---------- */
    function sampleCanvas(draw, w, h) {
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const cx = c.getContext("2d", { willReadFrequently: true });
        draw(cx, w, h);
        const d = cx.getImageData(0, 0, w, h).data, pts = [];
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
            const k = (y * w + x) * 4;
            if (d[k + 3] > 120 && (d[k] + d[k + 1] + d[k + 2]) / 3 < 170) pts.push([x, y]);
        }
        return toShape(pts, w, h);
    }
    function toShape(pts, w, h) {
        // Auf echte Ausdehnung zuschneiden und auf Höhe 1 normieren
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        const sh = (y1 - y0) || 1, cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
        const out = new Float32Array(N * 2);
        for (let i = 0; i < N; i++) {
            const p = pts[(Math.random() * pts.length) | 0];
            out[i * 2] = (p[0] + Math.random() - cxm) / sh;
            out[i * 2 + 1] = -(p[1] + Math.random() - cym) / sh;
        }
        out.aspect = (x1 - x0) / sh;
        return out;
    }
    function glyph(text) {
        return sampleCanvas((cx, w, h) => {
            cx.fillStyle = "#000"; cx.textAlign = "center"; cx.textBaseline = "middle";
            cx.font = `400 ${Math.round(h * 0.78)}px Fraunces, Georgia, serif`;
            cx.fillText(text, w / 2, h / 2);
        }, Math.max(240, text.length * 150), 240);
    }
    function heart() {
        return sampleCanvas((cx, w, h) => {
            cx.fillStyle = "#000"; cx.beginPath();
            const s = w / 34;
            cx.moveTo(17 * s, 30 * s);
            cx.bezierCurveTo(17 * s, 30 * s, 2 * s, 20 * s, 2 * s, 11 * s);
            cx.bezierCurveTo(2 * s, 5 * s, 7 * s, 2 * s, 11 * s, 2 * s);
            cx.bezierCurveTo(14 * s, 2 * s, 16 * s, 4 * s, 17 * s, 6 * s);
            cx.bezierCurveTo(18 * s, 4 * s, 20 * s, 2 * s, 23 * s, 2 * s);
            cx.bezierCurveTo(27 * s, 2 * s, 32 * s, 5 * s, 32 * s, 11 * s);
            cx.bezierCurveTo(32 * s, 20 * s, 17 * s, 30 * s, 17 * s, 30 * s);
            cx.fill();
            // nur der Umriss als breites Band → wirkt luftiger
            cx.globalCompositeOperation = "destination-out"; cx.translate(w / 2, h * 0.47); cx.scale(0.7, 0.7); cx.translate(-w / 2, -h * 0.47);
            cx.beginPath();
            cx.moveTo(17 * s, 30 * s);
            cx.bezierCurveTo(17 * s, 30 * s, 2 * s, 20 * s, 2 * s, 11 * s);
            cx.bezierCurveTo(2 * s, 5 * s, 7 * s, 2 * s, 11 * s, 2 * s);
            cx.bezierCurveTo(14 * s, 2 * s, 16 * s, 4 * s, 17 * s, 6 * s);
            cx.bezierCurveTo(18 * s, 4 * s, 20 * s, 2 * s, 23 * s, 2 * s);
            cx.bezierCurveTo(27 * s, 2 * s, 32 * s, 5 * s, 32 * s, 11 * s);
            cx.bezierCurveTo(32 * s, 20 * s, 17 * s, 30 * s, 17 * s, 30 * s);
            cx.fill();
        }, 272, 248);
    }
    function star() {
        return sampleCanvas((cx, w, h) => {
            cx.fillStyle = "#000"; cx.beginPath();
            for (let i = 0; i < 10; i++) { const r = i % 2 ? h * 0.2 : h * 0.48, a = -Math.PI / 2 + i * Math.PI / 5; cx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
            cx.closePath(); cx.fill();
        }, 240, 240);
    }
    function spiral() {
        const pts = [];
        for (let i = 0; i < 6000; i++) {
            const t = Math.random(), a = t * Math.PI * 2 * 4.2, r = 6 + t * 110 + (Math.random() - 0.5) * 7;
            pts.push([120 + Math.cos(a) * r, 120 + Math.sin(a) * r]);
        }
        return toShape(pts, 240, 240);
    }
    function tree() {
        return new Promise((res) => {
            const img = new Image();
            img.onload = () => res(sampleCanvas((cx, w, h) => cx.drawImage(img, 0, 0, w, h), 260, Math.round(260 * img.naturalHeight / img.naturalWidth)));
            img.onerror = () => res(null);
            img.src = q(".brand img")?.getAttribute("src") || "logobaum.png";
        });
    }

    /* ---------- WebGL ---------- */
    const vs = `
        attribute vec2 aPos; attribute vec3 aRand;
        uniform float uTime, uAspect, uSize, uPx, uAlpha;
        uniform vec2 uMouse;
        varying float vMix; varying float vA;
        void main() {
            vec2 p = aPos;
            p += 0.0045 * vec2(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0));
            vec2 d = (p - uMouse) * vec2(uAspect, 1.0); float dist = length(d);
            p += normalize(d + 1e-5) / vec2(uAspect, 1.0) * 0.12 * exp(-dist * dist * 40.0);
            gl_Position = vec4(p, 0.0, 1.0);
            gl_PointSize = uSize * uPx * (0.55 + aRand.z * 0.9);
            vMix = aRand.y; vA = (0.45 + 0.55 * aRand.x) * uAlpha;
        }`;
    const fs = `
        precision mediump float;
        uniform vec3 uColA, uColB;
        varying float vMix; varying float vA;
        void main() {
            float r = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.12, r) * vA;
            gl_FragColor = vec4(mix(uColA, uColB, vMix) * a, a);
        }`;
    const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); html.classList.remove("has-flow"); return; }
    gl.useProgram(prog);
    const pos = new Float32Array(N * 2), rnd = new Float32Array(N * 3), cloud = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
        rnd[i * 3] = Math.random(); rnd[i * 3 + 1] = Math.random(); rnd[i * 3 + 2] = Math.random();
        cloud[i * 2] = (Math.random() - 0.5) * 2.4; cloud[i * 2 + 1] = (Math.random() - 0.5) * 2.2;
    }
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const rBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rBuf); gl.bufferData(gl.ARRAY_BUFFER, rnd, gl.STATIC_DRAW);
    const aRand = gl.getAttribLocation(prog, "aRand"); gl.enableVertexAttribArray(aRand); gl.vertexAttribPointer(aRand, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    const U = {}; ["uTime", "uAspect", "uSize", "uPx", "uAlpha", "uMouse", "uColA", "uColB"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* ---------- Größe & Platzierung ---------- */
    let W = 1, H = 1, aspect = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    const placed = [];   // je Szene: Punkte in Bildschirm-Koordinaten (-1…1)
    function place() {
        W = window.innerWidth; H = window.innerHeight; aspect = W / H;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(U.uAspect, aspect); gl.uniform1f(U.uPx, dpr); gl.uniform1f(U.uSize, small ? 3.2 : 3.8);
        SCENES.forEach((s, k) => {
            const src = s.points; if (!src) return;
            // Höhe in Bildschirm-Einheiten (2 = ganzer Bildschirm), passt immer in die Breite
            let hgt = 1.55 * s.size;
            const maxW = 1.85 * aspect;
            if (hgt * src.aspect > maxW) hgt = maxW / src.aspect;
            const out = placed[k] || (placed[k] = new Float32Array(N * 2));
            const oy = s.shape === "tree" && k === 0 ? -0.02 : 0;
            for (let i = 0; i < N; i++) { out[i * 2] = src[i * 2] * hgt / aspect; out[i * 2 + 1] = src[i * 2 + 1] * hgt + oy; }
        });
        measure(); dirty = true;
    }

    /* ---------- Scroll: zwischen welchen Abschnitten sind wir? ---------- */
    let centers = [], footerTop = 1e9, heroTop = 0;
    function measure() {
        const sy = window.scrollY;
        centers = SCENES.map((s) => { const r = s.el.getBoundingClientRect(); return r.top + sy + Math.min(r.height, H) / 2; });
        const f = q(".site-footer"); footerTop = f ? f.getBoundingClientRect().top + sy : 1e9;
        heroTop = SCENES[0].el.getBoundingClientRect().top + sy;
    }
    ScrollTrigger.addEventListener("refresh", () => { measure(); dirty = true; });

    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const BG = SCENES.map((s) => hex(s.bg));
    const lum = (c) => (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
    const ease = (t) => t * t * (3 - 2 * t);
    const HOLD = 0.26;
    let dirty = true, intro = 0, lastBg = "";

    function compute() {
        const y = window.scrollY + H * 0.5;
        let k = 0;
        while (k < centers.length - 1 && y >= centers[k + 1]) k++;
        const last = centers.length - 1;
        let A = placed[k], B = placed[Math.min(k + 1, last)], t = 0, mode = "between";
        if (y < centers[0]) { k = 0; A = B = placed[0]; t = 0; mode = "hold"; }
        else if (k === last) { mode = "end"; t = Math.min(1, Math.max(0, (y - centers[last]) / Math.max(1, footerTop - centers[last]))); }
        else t = (y - centers[k]) / Math.max(1, centers[k + 1] - centers[k]);
        if (!A || !B) return;

        // Hintergrundfarbe mitwandern lassen
        const c0 = BG[k], c1 = BG[Math.min(k + 1, last)], tc = mode === "between" ? ease(Math.min(1, Math.max(0, (t - 0.3) / 0.4))) : 0;
        const col = c0.map((v, i) => Math.round(v + (c1[i] - v) * tc));
        const bg = `rgb(${col[0]},${col[1]},${col[2]})`;
        if (bg !== lastBg) { document.body.style.backgroundColor = bg; lastBg = bg; }
        const dark = 1 - lum(col);
        // Farben: auf Hell Ton/Bernstein, auf Dunkel helles Bernstein
        gl.uniform3f(U.uColA, 0.61 + dark * 0.25, 0.42 + dark * 0.3, 0.31 + dark * 0.2);
        gl.uniform3f(U.uColB, 0.79 + dark * 0.15, 0.59 + dark * 0.2, 0.36 + dark * 0.15);

        // Sichtbarkeit: im Intro (TR) noch aus, am Seitenende ausblenden
        const vis = Math.min(1, Math.max(0, (window.scrollY + H - heroTop) / (H * 0.6)));
        let alpha = (0.85 + dark * 0.15) * vis;

        for (let i = 0; i < N; i++) {
            const r = rnd[i * 3 + 2], r2 = rnd[i * 3];
            let x, yv;
            if (mode === "hold" || (mode === "between" && t < HOLD)) { x = A[i * 2]; yv = A[i * 2 + 1]; }
            else if (mode === "between" && t < 0.5) {            // Form löst sich auf und regnet nach unten
                const u = (t - HOLD) / (0.5 - HOLD), f = u * u;
                x = A[i * 2] + (r2 - 0.5) * 0.5 * u; yv = A[i * 2 + 1] - f * (1.3 + r * 1.8);
            } else if (mode === "between" && t < 1 - HOLD) {     // neue Form regnet von oben herein
                const u = (1 - HOLD - t) / (0.5 - HOLD), f = u * u;
                x = B[i * 2] - (r2 - 0.5) * 0.5 * u; yv = B[i * 2 + 1] + f * (1.3 + r * 1.8);
            } else if (mode === "between") { x = B[i * 2]; yv = B[i * 2 + 1]; }
            else {                                               // Ende: letzter Regen
                const u = Math.max(0, (t - 0.35) / 0.65), f = u * u;
                x = A[i * 2] + (r2 - 0.5) * 0.4 * u; yv = A[i * 2 + 1] - f * (1.4 + r * 1.8);
            }
            // Erstes Erscheinen: aus einer Wolke zusammenfinden
            if (intro < 1) {
                const e = ease(Math.min(1, Math.max(0, intro * 1.6 - r * 0.6)));
                x = cloud[i * 2] + (x - cloud[i * 2]) * e; yv = cloud[i * 2 + 1] + (yv - cloud[i * 2 + 1]) * e;
            }
            pos[i * 2] = x; pos[i * 2 + 1] = yv;
        }
        if (mode === "end") alpha *= 1 - Math.max(0, (t - 0.6) / 0.4);
        gl.uniform1f(U.uAlpha, alpha * Math.min(1, 0.25 + intro));
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    }

    /* ---------- Maus / Finger ---------- */
    let mx = 9, my = 9, tmx = 9, tmy = 9;
    window.addEventListener("pointermove", (e) => { tmx = (e.clientX / W) * 2 - 1; tmy = -((e.clientY / H) * 2 - 1); }, { passive: true });
    window.addEventListener("pointerdown", (e) => { tmx = (e.clientX / W) * 2 - 1; tmy = -((e.clientY / H) * 2 - 1); }, { passive: true });
    document.addEventListener("pointerleave", () => { tmx = 9; tmy = 9; });

    /* ---------- Start ---------- */
    const t0 = performance.now();
    function loop() {
        requestAnimationFrame(loop);
        if (dirty) { compute(); dirty = false; }
        mx += (tmx - mx) * 0.12; my += (tmy - my) * 0.12;
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.uTime, (performance.now() - t0) / 1000);
        gl.uniform2f(U.uMouse, mx, my);
        gl.drawArrays(gl.POINTS, 0, N);
    }
    window.addEventListener("scroll", () => { dirty = true; }, { passive: true });
    window.addEventListener("resize", () => { place(); });

    (async () => {
        try { await document.fonts.load('400 180px "Fraunces"'); } catch (e) {}
        const treePts = await tree();
        const make = (s) => s === "tree" ? treePts : s === "heart" ? heart() : s === "star" ? star() : s === "spiral" ? spiral() : glyph(s.slice(5));
        SCENES.forEach((s) => { s.points = make(s.shape); });
        if (SCENES.some((s) => !s.points)) { canvas.remove(); html.classList.remove("has-flow"); return; }
        place();
        // Zusammenfinden, sobald der Hero zum ersten Mal sichtbar ist
        ScrollTrigger.create({ trigger: SCENES[0].el, start: "top 75%", once: true, onEnter: () => gsap.to({ v: 0 }, { v: 1, duration: 2.6, ease: "power2.out", onUpdate: function () { intro = this.targets()[0].v; dirty = true; } }) });
        loop();
    })();
})();
