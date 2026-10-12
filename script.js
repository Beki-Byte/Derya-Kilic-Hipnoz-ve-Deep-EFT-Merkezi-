/* =========================================================
   Derya Kılıç · Hipnoz & Deep EFT – Hauptskript
   ---------------------------------------------------------
   0. Konfiguration, Firebase (dynamisch geladen)
   1. Sprache (TR / DE / EN)
   2. Helfer (Toast, Dialog, Formatierung, Geld)
   3. Seitenweite UI (Header, Scroll-Effekte, Cookies)
   4. Assistent (Chat)
   5. Startseite (Preisrechner, FAQ, Bewertungen)
   6. Termine: Logik, Kalender, öffentliche Buchung
   7. Zahlungen (Saldo, Verlauf, PayPal)
   8. Portal (Login, Admin, Klient)
   ========================================================= */
import { PAGE, UI } from "./i18n.js";

/* ---------------------------------------------------------
   0. KONFIGURATION & FIREBASE
   --------------------------------------------------------- */
const FIREBASE_VERSION = "10.8.0";
const FB = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

const firebaseConfig = {
    apiKey: "AIzaSyBYSifQ5m7G_sdyN0JAkkC8SV6x9gY0-Oo",
    authDomain: "derya-kilic-website.firebaseapp.com",
    projectId: "derya-kilic-website",
    storageBucket: "derya-kilic-website.firebasestorage.app",
    messagingSenderId: "493728541181",
    appId: "1:493728541181:web:d361a4ca1c8dff5ed65194",
    measurementId: "G-DE18012D63"
};

const MOTHER_WHATSAPP_NUMBER = "491708296913";
const SITE_URL = "https://beki-byte.github.io/Derya-Kilic-Hipnoz-ve-Deep-EFT-Merkezi-/";
const PORTAL_LINK = SITE_URL + "portal.html";
const PAYPAL_ME = "https://paypal.me/DeryaKilic2829";
const MIN_GAP_MINUTES = 120;
const CANCEL_FREE_HOURS = 24;

/* Automatische Benachrichtigung an Derya Hanım bei neuen Terminanfragen und Absagen.
   E-Mail über FormSubmit (formsubmit.co): Beim allerersten Mal kommt eine Bestätigungs-Mail
   an diese Adresse – einmal auf "Activate" klicken, danach kommen alle Nachrichten an.
   Optional zusätzlich Push aufs Handy über die kostenlose App "ntfy": Thema hier eintragen
   (z. B. "derya-randevu-x7k2") und dasselbe Thema in der ntfy-App abonnieren. */
const NOTIFY_EMAIL = "goldensunderya@hotmail.com";
const NTFY_TOPIC = "";

/* PayPal-Zahlung direkt im Portal (mit automatischer Verrechnung):
   Hier die "Client ID" aus developer.paypal.com eintragen (PayPal-Geschäftskonto nötig).
   Leer lassen = Klienten bekommen einen PayPal.me-Link, Derya Hanım trägt die Zahlung im Admin ein. */
const PAYPAL_CLIENT_ID = "";

/* ADMIN-ANMELDUNG (Firebase Authentication, E-Mail + Passwort)
   Hier die "User UID" von Derya Hanıms Konto eintragen (Firebase-Konsole → Authentication → Users).
   Dieselbe UID gehört auch in firestore.rules. */
const ADMIN_UID = "2cOJOB2Ojqg6UUtA3bc8IwCnc5r2";

/* Alter Admin-Code (nur noch, um bei Eingabe auf die neue Anmeldung hinzuweisen). */
const MASTER_CODE_HASH = "badfeae0d5a16cf9d241565473188c9b9175626b3fea39d472f085154342bfc9";

const HW_DEFAULT = "Henüz tanımlanmış ödeviniz bulunmuyor.";

let fbApp = null, db = null, fs = null;
const dbReady = (async () => {
    try {
        const [appMod, fsMod] = await Promise.all([import(`${FB}/firebase-app.js`), import(`${FB}/firebase-firestore.js`)]);
        fbApp = appMod.initializeApp(firebaseConfig);
        fs = fsMod;
        // Long-Polling: auf manchen Handy-Netzen hängt die Standard-Verbindung sonst sehr lange
        try { db = fsMod.initializeFirestore(fbApp, { experimentalForceLongPolling: true }); }
        catch { db = fsMod.getFirestore(fbApp); }
        return true;
    } catch (e) {
        console.warn("Firebase konnte nicht geladen werden:", e);
        return false;
    }
})();

async function loadAnalytics() {
    if (!(await dbReady) || !fbApp) return;
    try {
        const { getAnalytics, isSupported } = await import(`${FB}/firebase-analytics.js`);
        if (await isSupported()) getAnalytics(fbApp);
    } catch (e) { console.warn("Analytics nicht geladen:", e); }
}

/* ---------------------------------------------------------
   1. SPRACHE
   --------------------------------------------------------- */
const LANGS = ["tr", "de", "en"];
const LOCALES = { tr: "tr-TR", de: "de-DE", en: "en-GB" };
const langHooks = [];
let LANG = detectLang();

function detectLang() {
    let l = null;
    try { l = new URLSearchParams(location.search).get("lang") || localStorage.getItem("lang"); } catch { /* ignore */ }
    if (LANGS.includes(l)) return l;
    return "tr"; // Hauptsprache Türkisch – DE/EN über den Sprachumschalter
}

function t(key, vars = {}, lang = LANG) {
    let s = UI[key]?.[lang] ?? UI[key]?.tr ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
}

function applyUI(root = document) {
    root.querySelectorAll("[data-ui]").forEach((el) => (el.innerHTML = t(el.dataset.ui)));
    root.querySelectorAll("[data-ui-ph]").forEach((el) => (el.placeholder = t(el.dataset.uiPh)));
    root.querySelectorAll("[data-ui-al]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.uiAl)));
}

function applyLang(lang, { save = true } = {}) {
    if (!LANGS.includes(lang)) lang = "tr";
    LANG = lang;
    if (save) storage.set("lang", lang);
    document.documentElement.lang = lang;
    const pick = (k) => PAGE[k]?.[lang] ?? PAGE[k]?.tr;
    $$("[data-i18n]").forEach((el) => { const v = pick(el.dataset.i18n); if (v != null) el.innerHTML = v; });
    $$("[data-i18n-ph]").forEach((el) => { const v = pick(el.dataset.i18nPh); if (v != null) el.placeholder = v; });
    $$("[data-i18n-al]").forEach((el) => { const v = pick(el.dataset.i18nAl); if (v != null) el.setAttribute("aria-label", v); });
    $$("[data-i18n-content]").forEach((el) => { const v = pick(el.dataset.i18nContent); if (v != null) el.setAttribute("content", v); });
    $$("[data-i18n-label]").forEach((el) => { const v = pick(el.dataset.i18nLabel); if (v != null) el.label = v; });
    $$(".lang-switch [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    applyUI();
    langHooks.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    document.documentElement.classList.remove("i18n-wait");
}

function initLangSwitch() {
    $$(".lang-switch [data-lang]").forEach((b) => b.addEventListener("click", () => {
        if (b.dataset.lang !== LANG) applyLang(b.dataset.lang);
    }));
}

/* ---------------------------------------------------------
   2. HELFER
   --------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

const storage = {
    get(key, fallback = null) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch { /* ignore */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
    getJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
};
const session = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, v) { try { sessionStorage.setItem(key, v); } catch { /* ignore */ } },
    remove(key) { try { sessionStorage.removeItem(key); } catch { /* ignore */ } }
};

function toast(message, type = "success", ms = 4200) {
    let stack = $(".toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "toast-stack";
        stack.setAttribute("role", "status");
        stack.setAttribute("aria-live", "polite");
        document.body.appendChild(stack);
    }
    const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", warn: "fa-triangle-exclamation", info: "fa-circle-info" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span></span>`;
    el.querySelector("span").textContent = message;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add("out"); el.addEventListener("animationend", () => el.remove(), { once: true }); }, ms);
}

/* Dialog statt confirm() – Promise<boolean>. link = { href, text, icon, cls } */
function dialog({ title, text = "", okText = t("ok"), cancelText = t("cancel"), danger = false, link = null, showCancel = true, altText = "" } = {}) {
    return new Promise((resolve) => {
        const back = document.createElement("div");
        back.className = "dialog-backdrop";
        back.innerHTML = `
            <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
                <h3 id="dlgTitle"></h3>
                <p></p>
                <div class="dialog-actions">
                    ${showCancel ? `<button type="button" class="btn btn--ghost btn--sm" data-act="no"></button>` : ""}
                    ${link ? `<a class="btn btn--sm ${link.cls || "btn--whatsapp"}" target="_blank" rel="noopener noreferrer" data-act="link"><i class="${link.icon || "fab fa-whatsapp"}"></i> <span></span></a>` : ""}
                    ${altText ? `<button type="button" class="btn btn--ghost btn--sm" data-act="alt"></button>` : ""}
                    ${okText ? `<button type="button" class="btn btn--sm ${danger ? "btn--danger" : "btn--primary"}" data-act="yes"></button>` : ""}
                </div>
            </div>`;
        $("h3", back).textContent = title;
        $("p", back).textContent = text;
        const no = $('[data-act="no"]', back); if (no) no.textContent = cancelText;
        const yes = $('[data-act="yes"]', back); if (yes) yes.textContent = okText;
        const alt = $('[data-act="alt"]', back); if (alt) alt.textContent = altText;
        const lk = $('[data-act="link"]', back);
        if (lk) { lk.href = link.href; $("span", lk).textContent = link.text; }
        const lastFocus = document.activeElement;
        const close = (val) => {
            back.remove();
            document.removeEventListener("keydown", onKey);
            lastFocus?.focus?.();
            resolve(val);
        };
        const onKey = (e) => { if (e.key === "Escape") close(false); };
        back.addEventListener("click", (e) => {
            if (e.target === back) close(false);
            const act = e.target.closest("[data-act]")?.dataset.act;
            if (act === "yes") close(true);
            if (act === "no") close(false);
            if (act === "alt") close("alt");
            if (act === "link") setTimeout(() => close(true), 50);
        });
        document.addEventListener("keydown", onKey);
        document.body.appendChild(back);
        (yes || lk || no)?.focus();
    });
}

function formatDateForUser(dateStr) {
    if (!dateStr) return "";
    const p = String(dateStr).split("-");
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : dateStr;
}
function formatDateLong(dateStr, lang = LANG) {
    try {
        return new Date(`${dateStr}T12:00:00`).toLocaleDateString(LOCALES[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return formatDateForUser(dateStr); }
}
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function toMinutes(tm) {
    if (!tm || !tm.includes(":")) return null;
    const [h, m] = tm.split(":").map(Number);
    return h * 60 + m;
}
function formatWhatsAppNumber(phone) {
    if (!phone) return "";
    let n = String(phone).replace(/\D/g, "");
    if (n.startsWith("00")) n = n.slice(2);
    else if (n.startsWith("0")) n = "49" + n.slice(1);
    return n;
}
const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* Geld */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
function parseAmount(v) {
    if (typeof v === "number") return v;
    if (!v) return 0;
    let s = String(v).replace(/[^\d,.\-]/g, "");
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}
const getBalance = (c) => round2(typeof c?.balance === "number" ? c.balance : parseAmount(c?.payment));
/* Zahlungsfrist: nach Ablauf (und offenem Betrag) ist das Klienten-Portal gesperrt */
const isPortalLocked = (c) => !!c && Number(c.payDeadlineMs) > 0 && Date.now() > Number(c.payDeadlineMs) && getBalance(c) > 0;
const deadlineLocal = (c) => { const l = toLocal(new Date(Number(c.payDeadlineMs))); return `${formatDateLong(l.date)} · ${l.time}`; };
const deadlineTR = (c) => { const [d, tm] = String(c.payDeadline || "").split("T"); return d ? `${formatDateForUser(d)} ${tm || ""}`.trim() : ""; };
function money(n, lang = LANG) {
    n = round2(n);
    return new Intl.NumberFormat(lang === "en" ? "en-GB" : "de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
}

/* Anzeigename einer Leistung / Sitzungsart in der aktuellen Sprache */
function optionLabel(value) {
    const opt = $$("option").find((o) => o.value === value && o.textContent.trim());
    return opt ? opt.textContent.replace(/\s*\(.*\)\s*$/, "") : value;
}

/* ICS-Datei – Zeitzone Europe/Berlin inkl. Sommer-/Winterzeit */
function berlinToUTC(dateStr, timeStr) {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, mi] = (timeStr || "10:00").split(":").map(Number);
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date(guess)).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    const asBerlin = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    return new Date(guess - (asBerlin - guess));
}
/* Zeitzonen: Termine werden in deutscher Zeit (Europe/Berlin) gespeichert.
   Besucher sehen und wählen Zeiten in IHRER Zeitzone – umgerechnet wird automatisch. */
const BERLIN = "Europe/Berlin";
const USER_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || BERLIN; } catch { return BERLIN; } })();
function zoneParts(d, tz) {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}
const appInstant = (app) => berlinToUTC(app.date, app.time || "00:00");
const localInstant = (date, time) => new Date(`${date}T${time || "00:00"}:00`);
const toLocal = (d, tz = USER_TZ) => zoneParts(d, tz);
const toBerlin = (d) => zoneParts(d, BERLIN);
const differsFromBerlin = (d, tz = USER_TZ) => { const a = zoneParts(d, tz), b = zoneParts(d, BERLIN); return a.time !== b.time || a.date !== b.date; };
const tzCity = (tz) => (tz || "").split("/").pop().replace(/_/g, " ");

const icsStamp = (date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => "\\" + m);

function downloadICSFile(title, description, dateStr, timeStr, hours = 1) {
    const start = berlinToUTC(dateStr, timeStr);
    const end = new Date(start.getTime() + hours * 3600 * 1000);
    const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Derya Kilic Hipnoz//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT", `UID:${randomId()}@deryakilic`, `DTSTAMP:${icsStamp(new Date())}`,
        `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
        `SUMMARY:${icsEscape(title)}`, `DESCRIPTION:${icsEscape(description)}`,
        "LOCATION:Biberweg 53\\, 70806 Kornwestheim", "STATUS:TENTATIVE",
        "BEGIN:VALARM", "TRIGGER:-PT26H", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(title)}`, "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `Randevu_${dateStr}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------------------------------------------------------
   3. SEITENWEITE UI
   --------------------------------------------------------- */
function initHeader() {
    const header = $("#siteHeader");
    if (header) {
        const setH = () => document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
        setH();
        if ("ResizeObserver" in window) new ResizeObserver(setH).observe(header);
        else window.addEventListener("resize", setH);
    }
    const onScroll = () => {
        const y = window.scrollY;
        header?.classList.toggle("is-scrolled", y > 8);
        $("#toTop")?.classList.toggle("show", y > 700);
        document.documentElement.style.setProperty("--parallax", Math.min(y * 0.25, 200).toFixed(1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    $("#toTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    // Aktiven Menüpunkt beim Scrollen markieren (Startseite)
    const sections = ["about", "services", "pricing", "faq"].map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
        const links = $$(".main-nav a[data-nav]");
        const setActive = (key) => links.forEach((a) => a.classList.toggle("active", a.dataset.nav === key));
        const opts = { rootMargin: "-45% 0px -50% 0px" };
        const obs = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); }), opts);
        sections.forEach((s) => obs.observe(s));
        const hero = $("#home");
        if (hero) new IntersectionObserver(([en]) => { if (en.isIntersecting) setActive("home"); }, opts).observe(hero);
    }
}

function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((e) => obs.observe(e));
}

function initCookies() {
    if (storage.get("cookies_accepted") === "true" && !storage.get("cookie_consent")) {
        storage.set("cookie_consent", "all");
        storage.remove("cookies_accepted");
    }
    const consent = storage.get("cookie_consent");
    if (consent === "all") loadAnalytics();
    if (!consent) showCookieCard();
    $$("[data-cookie-settings]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); showCookieCard(); }));
}
function showCookieCard() {
    if ($("#cookieCard")) return;
    const card = document.createElement("div");
    card.className = "cookie-card";
    card.id = "cookieCard";
    card.setAttribute("role", "dialog");
    card.innerHTML = `
        <h3 data-ui="cookie_title"></h3>
        <p data-ui="cookie_text"></p>
        <div class="cookie-actions">
            <button type="button" class="btn btn--ghost" data-c="necessary" data-ui="cookie_necessary"></button>
            <button type="button" class="btn btn--primary" data-c="all" data-ui="cookie_all"></button>
        </div>`;
    applyUI(card);
    card.addEventListener("click", (e) => {
        const c = e.target.closest("[data-c]")?.dataset.c;
        if (!c) return;
        const before = storage.get("cookie_consent");
        storage.set("cookie_consent", c);
        card.remove();
        if (c === "all") loadAnalytics();
        if (before === "all" && c === "necessary") toast(t("cookie_saved"), "info");
    });
    document.body.appendChild(card);
}

function initCopyButtons() {
    $$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            const old = btn.innerHTML;
            btn.classList.add("copied");
            btn.innerHTML = `<i class="fas fa-check"></i> ${escapeHTML(t("copied"))}`;
            setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = old; }, 1800);
        } catch {
            toast(t("copy_fail"), "warn");
        }
    }));
}

/* ---------------------------------------------------------
   4. ASSISTENT
   --------------------------------------------------------- */
function normalize(s) {
    return " " + s.toLocaleLowerCase("tr").replace(/[ıİ]/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/[üÜ]/g, "u")
        .replace(/[öÖ]/g, "o").replace(/ç/g, "c").replace(/â/g, "a").replace(/ä/g, "a").replace(/ß/g, "ss").replace(/[?!.,;:]/g, " ") + " ";
}
const CHAT_RULES = [
    ["r_stuck", ["cikama", "kalir miyim", "takili", "stecken", "hangen", "stuck", "aufwach", "wake up"]],
    ["r_control", ["bilinc", "kontrol", "kayb", "control", "bewusst"]],
    ["r_secret", [" sir ", "sirlar", "istemedigim", "geheim", "secret", "nicht will", "dont want", "don't want"]],
    ["r_safe", ["zarar", "yan etki", "tehlike", "guvenli", "sicher", "gefahr", "nebenwirk", "safe", "danger", "side effect", "risk"]],
    ["r_forgot", ["unuttum", "kaybettim", "sifre", "hatirlamiyorum", "kodumu", "vergessen", "forgot", "lost my", "password", "passwort"]],
    ["r_cancel", ["iptal", "erteleme", "degistir", "absag", "stornier", "verschieb", "cancel", "reschedul"]],
    ["r_online", ["online", "uzaktan", "video", "zoom"]],
    ["r_lang", [" dil", "almanca", "turkce", "deutsch", "sprache", "englisch", "ingilizce", "english", "language", "turkish", "german", "turkisch"]],
    ["r_address", ["adres", "nerede", "konum", "kornwestheim", "yol tarifi", "address", " where ", "location", "praxis", " wo "]],
    ["r_hypno", ["hipnoz", "hypnose", "hipnoterapi", "hypnosis", "hypnotherap"]],
    ["r_eft", ["eft"]],
    ["r_price", ["ucret", "fiyat", "preis", "koste", "odeme", "paypal", "kac para", "euro", "€", "price", "cost", " fee", " pay", "zahl", "how much", "wie viel", "wieviel"]],
    ["r_code", [" kod", "giris", "portal", " code", "login", "anmeld"]],
    ["r_booking", ["randevu", "termin", "seans", "rezervasyon", "appointment", " book", "session", "sitzung"]],
    ["r_hello", ["merhaba", "selam", "hallo", "iyi gunler", "hello", " hi ", " hey ", "guten tag", "servus"]],
    ["r_thanks", ["tesekkur", "sagol", "danke", "eyvallah", "thank", "thx"]]
];
function generateAssistantReply(input) {
    const q = normalize(input);
    for (const [key, words] of CHAT_RULES) if (words.some((w) => q.includes(w))) return t(key);
    return t("r_fallback");
}

function buildChat(mount, { floating }) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
        ${floating ? `<button type="button" class="chat-fab" id="chatFab" aria-controls="chatPanel" aria-expanded="false"><span class="pulse"></span><i class="fas fa-comment-dots"></i><span class="label" data-ui="chat_fab"></span></button>` : ""}
        <section class="chat-panel" id="chatPanel" aria-label="Chat">
            <header class="chat-head">
                <span class="chat-avatar"><img src="logobaum.png" alt=""></span>
                <div><strong data-ui="chat_title"></strong><small data-ui="chat_status"></small></div>
                ${floating ? `<button type="button" class="chat-close" data-ui-al="close"><i class="fas fa-xmark"></i></button>` : ""}
            </header>
            <div class="chat-body" id="chatBody" aria-live="polite"></div>
            <div class="chat-chips">${[1, 2, 3, 4, 5, 6].map((i) => `<button type="button" data-ui="chip_${i}"></button>`).join("")}</div>
            <form class="chat-form" autocomplete="off">
                <label for="chatInput" class="sr-only">Chat</label>
                <input type="text" id="chatInput" data-ui-ph="chat_placeholder" maxlength="300">
                <button type="submit" aria-label="➤"><i class="fas fa-paper-plane"></i></button>
            </form>
            <p class="chat-note"><span data-ui="chat_note"></span> <a href="https://wa.me/${MOTHER_WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">WhatsApp</a></p>
        </section>`;
    mount.appendChild(wrap);
    applyUI(wrap);

    const body = $("#chatBody", wrap);
    const input = $("#chatInput", wrap);
    const addMsg = (text, who, uiKey = null) => {
        const m = document.createElement("div");
        m.className = `msg msg-${who}`;
        m.textContent = text;
        if (uiKey) m.dataset.ui = uiKey;
        body.appendChild(m);
        body.scrollTop = body.scrollHeight;
    };
    addMsg(t("chat_hello"), "bot", "chat_hello");

    const ask = (text) => {
        text = text.trim();
        if (!text) return;
        addMsg(text, "user");
        const typing = document.createElement("div");
        typing.className = "msg msg-bot typing";
        typing.innerHTML = "<span></span><span></span><span></span>";
        body.appendChild(typing);
        body.scrollTop = body.scrollHeight;
        setTimeout(() => { typing.remove(); addMsg(generateAssistantReply(text), "bot"); }, 550 + Math.random() * 400);
    };
    $(".chat-form", wrap).addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); input.value = ""; });
    $(".chat-chips", wrap).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent); });

    if (floating) {
        const fab = $("#chatFab", wrap);
        const setOpen = (open) => {
            document.body.classList.toggle("chat-open", open);
            fab.setAttribute("aria-expanded", String(open));
            if (open) setTimeout(() => input.focus(), 250);
        };
        fab.addEventListener("click", () => setOpen(true));
        $(".chat-close", wrap).addEventListener("click", () => { setOpen(false); fab.focus(); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("chat-open")) setOpen(false); });
    }
}
function initChat() {
    const widgetMount = $("#chatMount[data-chat-widget]");
    if (widgetMount) buildChat(widgetMount, { floating: true });
    const pageMount = $("#chatPageMount");
    if (pageMount) buildChat(pageMount, { floating: false });
}

/* ---------------------------------------------------------
   5. STARTSEITE
   --------------------------------------------------------- */
function initPriceCalc() {
    const box = $("#priceCalc");
    if (!box) return;
    let type = "diger", hours = 1, first = true;
    const out = $("#calcHours"), total = $("#calcTotal"), label = $("#calcLabel"), stepper = $("#calcStepper");
    const render = () => {
        const sum = type === "hipnoz" ? 170 : 65 * hours;
        const h = hours === 1 ? t("calc_hour_1") : t("calc_hours", { n: hours });
        out.textContent = h;
        stepper.classList.toggle("is-disabled", type === "hipnoz");
        label.textContent = type === "hipnoz" ? t("calc_label_hyp") : t("calc_label_other", { h });
        total.textContent = money(sum);
        if (!first) { total.classList.remove("bump"); void total.offsetWidth; total.classList.add("bump"); }
        first = false;
    };
    $$(".segmented button", box).forEach((b) => b.addEventListener("click", () => {
        type = b.dataset.type;
        $$(".segmented button", box).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        render();
    }));
    $$("[data-step]", box).forEach((b) => b.addEventListener("click", () => {
        hours = Math.min(6, Math.max(1, hours + Number(b.dataset.step)));
        render();
    }));
    langHooks.push(() => { first = true; render(); });
    render();
}

function initFAQ() {
    const list = $("#faqList");
    if (!list) return;
    list.addEventListener("click", (e) => {
        const summary = e.target.closest("summary");
        if (!summary) return;
        const current = summary.parentElement;
        if (!current.open) $$("details", list).forEach((d) => { if (d !== current) d.open = false; });
    });
}

/* --- Bewertungen --- */
const clampStars = (n) => Math.min(5, Math.max(1, Math.round(Number(n) || 5)));
const starString = (n) => "★".repeat(clampStars(n)) + "☆".repeat(5 - clampStars(n));
const AVATAR_COLORS = ["#bfa182", "#8c6a56", "#a88b68", "#7d8b6a", "#b48a6e", "#9a7b67"];
let commentsCache = null;
let reviewsExpanded = false;

async function getComments() {
    if (!(await dbReady)) return null;
    try {
        const snap = await fs.getDocs(fs.query(fs.collection(db, "comments"), fs.orderBy("createdAt", "desc")));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("getComments:", e);
        return null;
    }
}

function drawComments() {
    const grid = $("#comments-grid");
    if (!grid) return;
    const comments = commentsCache;
    if (comments === null) { grid.innerHTML = `<p class="reviews-empty">${escapeHTML(t("rev_load_fail"))}</p>`; return; }
    if (comments === undefined) return;
    if (!comments.length) { grid.innerHTML = `<p class="reviews-empty">${escapeHTML(t("rev_empty"))}</p>`; return; }
    const avg = comments.reduce((s, c) => s + clampStars(c.stars), 0) / comments.length;
    $("#reviewsSummary").hidden = false;
    $("#ratingAvg").textContent = avg.toLocaleString(LOCALES[LANG], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    $("#ratingStars").textContent = starString(avg);
    $("#ratingCount").textContent = t("rev_count", { n: comments.length });

    const LIMIT = 6;
    const shown = reviewsExpanded ? comments : comments.slice(0, LIMIT);
    grid.innerHTML = shown.map((c, i) => {
        const name = c.name || t("anon");
        const initial = escapeHTML(name.trim().charAt(0).toLocaleUpperCase("tr") || "?");
        const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString(LOCALES[LANG], { month: "long", year: "numeric" }) : "";
        const long = (c.text || "").length > 260;
        return `
            <article class="review-card ${long ? "is-clamped" : ""}">
                <div class="review-head">
                    <span class="avatar" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${initial}</span>
                    <div>
                        <strong>${escapeHTML(name)}</strong>
                        <span class="stars" aria-label="${escapeHTML(t("stars_aria", { n: clampStars(c.stars) }))}">${starString(c.stars)}</span>
                        ${date ? `<small class="review-date">${escapeHTML(date)}</small>` : ""}
                    </div>
                </div>
                <p>${escapeHTML(c.text)}</p>
                ${long ? `<button type="button" class="review-more">${escapeHTML(t("rev_more"))}</button>` : ""}
            </article>`;
    }).join("");
    $("#reviewsMore").hidden = reviewsExpanded || comments.length <= LIMIT;
}

async function renderComments() {
    commentsCache = await getComments();
    drawComments();
}

function initReviews() {
    if (!$("#comments-grid")) return;
    renderComments();
    langHooks.push(drawComments);

    $("#comments-grid").addEventListener("click", (e) => {
        const b = e.target.closest(".review-more");
        if (!b) return;
        const clamped = b.closest(".review-card").classList.toggle("is-clamped");
        b.textContent = clamped ? t("rev_more") : t("rev_less");
    });
    $("#reviewsMore")?.addEventListener("click", () => { reviewsExpanded = true; drawComments(); });

    const text = $("#commentText");
    text?.addEventListener("input", () => ($("#charCount").textContent = text.value.length));
    const caption = () => ($("#starCaption").textContent = t("star_" + ($('input[name="stars"]:checked')?.value || 5)));
    $$('input[name="stars"]').forEach((r) => r.addEventListener("change", caption));
    $$(".star-input label").forEach((l) => l.title = t("star_" + l.htmlFor.slice(1)));
    langHooks.push(() => { caption(); $$(".star-input label").forEach((l) => l.title = t("star_" + l.htmlFor.slice(1))); });
    caption();

    $("#commentForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const name = $("#commentName").value.trim();
        const body = text.value.trim();
        const stars = clampStars($('input[name="stars"]:checked')?.value);
        if (name.length < 2 || body.length < 5) {
            toast(t("rev_invalid"), "warn");
            (name.length < 2 ? $("#commentName") : text).focus();
            return;
        }
        if (!(await dbReady)) { toast(t("err_conn"), "error"); return; }
        const btn = $('button[type="submit"]', form);
        btn.disabled = true;
        try {
            await fs.addDoc(fs.collection(db, "comments"), { name, stars, text: body, lang: LANG, createdAt: new Date().toISOString() });
            form.reset();
            $("#charCount").textContent = "0";
            caption();
            await renderComments();
            toast(t("rev_thanks"), "success");
        } catch (err) {
            console.error("addComment:", err);
            toast(t("rev_error"), "error");
        } finally {
            btn.disabled = false;
        }
    });
}

/* ---------------------------------------------------------
   6. DATEN & TERMINE
   ---------------------------------------------------------
   Aufbau der Datenbank (passend zu firestore.rules):
   slots/{id}                        öffentlich: NUR Datum/Uhrzeit/Status – für den Kalender
   appointments/{id}                 Gast-Anfragen (ID ist geheim, nur im Browser des Gastes)
   clients/{CODE}                    Klient – der Code ist sein Passwort
   clients/{CODE}/appointments/{id}  Termine des Klienten
   clients/{CODE}/payments/{id}      Zahlungen & Honorare des Klienten
   adminNotes/{CODE}                 private Notizen (nur Derya Hanım)
   privateSlots/{id}                 Notiz zu Şahsi-Einträgen (nur Derya Hanım)
   comments/{id}                     Bewertungen
   --------------------------------------------------------- */
const snapList = (snap) => snap.docs.map((d) => ({ id: d.id, _path: d.ref.path, ...d.data() }));

/* Öffentlich: bestätigte, belegte Zeiten (ohne Personendaten) */
async function getSlots() {
    if (!(await dbReady)) return [];
    try { return snapList(await fs.getDocs(fs.collection(db, "slots"))).filter((s) => s.status === "approved"); }
    catch (e) { console.error("getSlots:", e); return []; }
}

/* Gast: eigene Anfragen über die im Browser gespeicherten IDs */
async function getGuestAppointments() {
    const ids = storage.getJSON("myAppointmentIds", []);
    if (!ids.length || !(await dbReady)) return [];
    const found = await Promise.all(ids.map(async (id) => {
        try {
            const s = await fs.getDoc(fs.doc(db, "appointments", id));
            return s.exists() ? { id: s.id, _path: s.ref.path, ...s.data() } : null;
        } catch { return null; } // z. B. abgesagt -> nicht mehr lesbar
    }));
    return found.filter(Boolean);
}

/* Klient: eigene Termine */
async function getClientAppointments(code) {
    if (!(await dbReady)) return [];
    try { return snapList(await fs.getDocs(fs.collection(db, "clients", code, "appointments"))); }
    catch (e) { console.error("getClientAppointments:", e); return []; }
}

/* Admin: alle Termine (Gäste + alle Klienten) */
async function getAllAppointmentsAdmin() {
    if (!(await dbReady)) return [];
    try { return snapList(await fs.getDocs(fs.collectionGroup(db, "appointments"))); }
    catch (e) { console.error("getAllAppointmentsAdmin:", e); return []; }
}
/* Admin: alles, was belegt ist – bestätigte Termine (mit Namen) + Şahsi-Einträge */
async function getAdminBusy(all = null) {
    const [apps, slots] = await Promise.all([all ? Promise.resolve(all) : getAllAppointmentsAdmin(), getSlots()]);
    return [...apps.filter((a) => a.status === "approved"), ...slots.filter((s) => s.personal)];
}

/* Prüft einen gewünschten Zeitpunkt (Date) gegen BESTÄTIGTE Termine.
   - Normale Termine: mindestens 2 Stunden Abstand (davor und danach).
   - Şahsi-Einträge: blockieren nur ihren eigenen Zeitraum (keine 2-Std.-Regel).
   Ergebnis: null = frei, sonst { key, app } */
const SESSION_MIN = 60;
function checkSlot(busyList, req, ignoreId = null) {
    if (!(req instanceof Date) || isNaN(req)) return null;
    const r = req.getTime();
    for (const app of busyList) {
        if (app.id === ignoreId || app.status !== "approved" || !app.date || !app.time) continue;
        const start = appInstant(app).getTime();
        if (app.personal) {
            const end = app.endTime && app.endTime > app.time ? berlinToUTC(app.date, app.endTime).getTime() : start + 60 * 60000;
            if (r < end && r + SESSION_MIN * 60000 > start) return { key: "slot_taken", app };
            continue;
        }
        const diff = Math.abs(r - start);
        if (diff === 0) return { key: "slot_taken", app };
        if (diff < MIN_GAP_MINUTES * 60000) return { key: "slot_gap", app };
    }
    return null;
}
const isPastInstant = (d) => d instanceof Date && d.getTime() < Date.now();
/* Sa/So keine Termine (maßgeblich ist der Tag in Deutschland) */
const isWeekendISO = (iso) => { const d = new Date(iso + "T12:00:00Z").getUTCDay(); return d === 0 || d === 6; };
const isWeekendInstant = (inst) => inst instanceof Date && !isNaN(inst) && isWeekendISO(toBerlin(inst).date);
function isPast(date, time) {
    if (!date) return false;
    return isPastInstant(berlinToUTC(date, time || "23:59"));
}
function localTimeLabel(app, lang = LANG) {
    const inst = appInstant(app);
    const loc = toLocal(inst);
    return differsFromBerlin(inst) ? `${loc.time} ${t("tz_de_short", { t: app.time }, lang)}` : app.time;
}

/* Kalenderdaten je nach Ansicht laden */
async function loadCalendarData(mode, clientCode) {
    if (mode === "master") {
        const [apps, slots] = await Promise.all([getAllAppointmentsAdmin(), getSlots()]);
        const personal = slots.filter((s) => s.personal);
        const notes = {};
        await Promise.all(personal.map(async (s) => {
            try { const n = await fs.getDoc(fs.doc(db, "privateSlots", s.id)); if (n.exists()) notes[s.id] = n.data().note || ""; } catch { /* ignore */ }
        }));
        personal.forEach((s) => (s.note = notes[s.id] || ""));
        const shown = [...apps.filter((a) => a.status === "approved"), ...personal];
        return { shown, busy: shown, own: [] };
    }
    const [slots, own] = await Promise.all([getSlots(), mode === "client" ? getClientAppointments(clientCode) : getGuestAppointments()]);
    const ownSlot = new Map(own.filter((a) => a.slotId).map((a) => [a.slotId, a]));
    // Belegt = alle bestätigten Zeiten, außer den eigenen bereits abgesagten
    const busy = slots.filter((s) => { const o = ownSlot.get(s.id); return !o || o.status === "approved"; });
    const ownActive = own.filter((a) => a.status === "pending" || a.status === "approved");
    return { shown: [...slots.filter((s) => !ownSlot.has(s.id)), ...ownActive.map((a) => ({ ...a, _mine: true }))], busy, own };
}

const calendars = {};
const calendarOpts = {};
let lastSelectedDate = null;

/* mode: "public" | "client" | "master" */
async function initCalendar(elementId, opts = {}) {
    const { mode, clientCode = null, onDateClick = null } = opts;
    calendarOpts[elementId] = opts;
    const el = document.getElementById(elementId);
    if (!el) return null;

    // Kalender sofort zeigen – Termine werden nachgeladen
    const calLang0 = mode === "master" ? "tr" : LANG;
    if (typeof FullCalendar !== "undefined" && !calendars[elementId]) {
        const small0 = window.matchMedia("(max-width: 640px)").matches;
        el.innerHTML = "";
        calendars[elementId] = new FullCalendar.Calendar(el, {
            initialView: "dayGridMonth", locale: calLang0 === "en" ? "en" : calLang0, firstDay: 1, height: "auto",
            headerToolbar: small0 ? { left: "prev,next", center: "title", right: "today" } : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" },
            buttonText: { today: t("cal_today", {}, calLang0), month: t("cal_month", {}, calLang0), week: t("cal_week", {}, calLang0), list: t("cal_list", {}, calLang0) }
        });
        calendars[elementId].render();
        el.dataset.loading = t("cal_loading", {}, calLang0);
        el.classList.add("is-loading");
    }
    let data;
    try { data = await loadCalendarData(mode, clientCode); }
    finally { el.classList.remove("is-loading"); }
    if (typeof FullCalendar === "undefined") {
        el.innerHTML = `<div class="calendar-fallback"><i class="fas fa-calendar-xmark"></i><br>${escapeHTML(t("cal_fallback"))}</div>`;
        return data;
    }
    const calLang = mode === "master" ? "tr" : LANG; // Admin bleibt Türkisch

    const events = data.shown.map((app) => {
        const mine = !!app._mine;
        let title = t("cal_busy", {}, calLang), color = "#c46b5d";
        if (mode === "master" && app.personal) { title = `🔒 Şahsi${app.note ? " · " + app.note : ""}`; color = "#9a8f86"; }
        else if (mode === "master") { title = `${app.name || "?"} · ${app.service || ""}`; color = "#8c6a56"; }
        else if (mine) { title = t("cal_yours") + (app.status === "approved" ? "" : t("cal_pending_suffix")); color = app.status === "approved" ? "#4f8a5b" : "#8fb497"; }
        // Fremde Termine: KEINE Daten an den Kalender
        const props = mode === "master" || mine ? { ...app, mine } : { mine: false };
        const start = mode === "master" ? `${app.date}T${app.time || "09:00"}` : appInstant(app).toISOString();
        const end = mode === "master" && app.personal && app.endTime ? `${app.date}T${app.endTime}` : undefined;
        return { id: String(app.id), title, start, end, color, extendedProps: props };
    });

    const prevDate = calendars[elementId]?.getDate();
    calendars[elementId]?.destroy();
    el.innerHTML = "";

    const small = window.matchMedia("(max-width: 640px)").matches;
    const cal = new FullCalendar.Calendar(el, {
        initialView: "dayGridMonth",
        initialDate: prevDate || undefined,
        locale: calLang === "en" ? "en" : calLang,
        firstDay: 1,
        height: "auto",
        headerToolbar: small
            ? { left: "prev,next", center: "title", right: "today" }
            : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" },
        buttonText: { today: t("cal_today", {}, calLang), month: t("cal_month", {}, calLang), week: t("cal_week", {}, calLang), list: t("cal_list", {}, calLang) },
        dayMaxEvents: 3,
        slotMinTime: "08:00:00",
        slotMaxTime: "22:00:00",
        allDaySlot: false,
        eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
        events,
        dayCellDidMount(info) {
            const iso = info.date.getFullYear() + "-" + String(info.date.getMonth() + 1).padStart(2, "0") + "-" + String(info.date.getDate()).padStart(2, "0");
            if (iso === lastSelectedDate) info.el.classList.add("is-selected");
            if (mode !== "master" && (info.date.getDay() === 0 || info.date.getDay() === 6)) info.el.classList.add("is-closed");
        },
        dateClick(info) {
            const d = info.dateStr.slice(0, 10);
            if (mode !== "master" && d < todayISO()) { toast(t("cal_past", {}, calLang), "warn", 2500); return; }
            if (mode !== "master" && isWeekendISO(d)) { toast(t("slot_weekend", {}, calLang), "warn", 3000); return; }
            $$(".fc-daygrid-day.is-selected", el).forEach((x) => x.classList.remove("is-selected"));
            info.dayEl?.classList.add("is-selected");
            lastSelectedDate = d;
            onDateClick?.(d, info.dateStr.length > 10 ? info.dateStr.slice(11, 16) : null);
        },
        async eventClick(info) {
            const app = info.event.extendedProps;
            if (mode === "master" && app.personal) {
                const ok = await dialog({
                    title: "🔒 Şahsi randevu",
                    text: `Tarih: ${formatDateForUser(app.date)} · ${app.time}${app.endTime ? " – " + app.endTime : ""}${app.note ? "\nNot: " + app.note : ""}`,
                    okText: "Sil", cancelText: "Kapat", danger: true
                });
                if (ok) {
                    try {
                        await fs.deleteDoc(fs.doc(db, "slots", app.id));
                        try { await fs.deleteDoc(fs.doc(db, "privateSlots", app.id)); } catch { /* ignore */ }
                        toast("Şahsi randevu silindi.", "success");
                    } catch (e) { console.error(e); toast("Silinemedi.", "error"); }
                    refreshMaster();
                }
            } else if (mode === "master") {
                const anam = app.anamnese ? `\n\nKonu: ${app.anamnese.reason || "-"}\nTedavi geçmişi: ${app.anamnese.medicalHistory || "-"}\nBeklenti: ${app.anamnese.expectation || "-"}` : "";
                const ok = await dialog({
                    title: "Randevu Detayları",
                    text: `Danışan: ${app.name}\nTelefon: ${app.phone || "-"}\nE-Posta: ${app.email || "-"}\nTarih: ${formatDateForUser(app.date)} · ${app.time}\nHizmet: ${app.service}${app.format ? " · " + app.format : ""}${app.lang ? "\nDil: " + app.lang.toUpperCase() : ""}${app.tz && differsFromBerlin(appInstant(app), app.tz) ? `\nDanışanın saati: ${toLocal(appInstant(app), app.tz).time} (${tzCity(app.tz)})` : ""}${anam}`,
                    okText: "Randevuyu iptal et", cancelText: "Kapat", danger: true,
                    link: app.phone ? { href: waLink(formatWhatsAppNumber(app.phone), ""), text: "WhatsApp" } : null
                });
                if (ok && (await dialog({ title: "Emin misiniz?", text: "Bu randevu iptal edilecek.", okText: "Evet, iptal et", cancelText: "Vazgeç", danger: true }))) {
                    await adminCancelAppointment(app);
                    refreshMaster();
                }
            } else if (app.mine) {
                await openOwnAppointment(app, elementId);
            } else {
                toast(t("cal_busy_toast"), "info", 2800);
            }
        }
    });
    cal.render();
    calendars[elementId] = cal;
    return data;
}
langHooks.push(() => {
    Object.keys(calendars).forEach((id) => { if (calendarOpts[id]?.mode !== "master") initCalendar(id, calendarOpts[id]); });
});

/* Eigener Termin: Daten anzeigen, absagen (24-Stunden-Regel), Kalender-Datei */
/* Ausfallgebühr bei Absage < 24 h: Hipnoterapi 50 €, alle anderen 30 € */
const lateFee = (service) => (service === "Hipnoterapi" ? 50 : 30);
const hoursUntil = (app) => (appInstant(app).getTime() - Date.now()) / 3600000;

async function openOwnAppointment(app, elementId) {
    const lines = [
        `📅 ${formatDateLong(toLocal(appInstant(app)).date)} · ${localTimeLabel(app)}`,
        `🩺 ${optionLabel(app.service)}${app.format ? " · " + optionLabel(app.format) : ""}`,
        "",
        app.name ? `👤 ${app.name}` : "",
        app.phone ? `📞 ${app.phone}` : "",
        app.email ? `✉️ ${app.email}` : "",
        "",
        `${t("status")}: ${app.status === "approved" ? t("approved") : t("pending")}`,
        "",
        t("cancel_note")
    ].filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0));
    const past = hoursUntil(app) <= 0;
    const choice = await dialog({
        title: t("my_appt"), text: lines.join("\n"),
        okText: past ? "" : t("cancel_appt"), danger: true,
        altText: t("add_to_cal"), cancelText: t("close")
    });
    if (choice === "alt") { downloadICSFile(`Derya Kılıç – ${optionLabel(app.service)}`, t("ics_appt"), app.date, app.time); return; }
    if (choice !== true) return;

    const late = hoursUntil(app) < CANCEL_FREE_HOURS && app.status === "approved";
    const fee = lateFee(app.service);
    const sure = await dialog({
        title: late ? t("late_cancel_title") : t("cancel_confirm_title"),
        text: late ? t("late_cancel_text", { fee: money(fee) }) : t("cancel_confirm_text"),
        okText: late ? t("cancel_anyway") : t("cancel_appt"), cancelText: t("keep_appt"), danger: true
    });
    if (!sure) return;
    try {
        const cancelData = { status: "cancelled", cancelledAt: new Date().toISOString(), lateCancel: late };
        const clientCode = app._path.startsWith("clients/") ? app._path.split("/")[1] : null;
        let charged = false;
        if (late && clientCode) {
            // Ausfallgebühr sofort auf den offenen Betrag buchen (in einem Schritt mit der Absage)
            try {
                const cref = fs.doc(db, "clients", clientCode);
                const before = getBalance((await fs.getDoc(cref)).data());
                const after = round2(before + fee);
                const batch = fs.writeBatch(db);
                batch.update(fs.doc(db, app._path), { ...cancelData, feeCharged: true });
                batch.update(cref, { balance: after, payment: money(after, "tr") });
                batch.set(fs.doc(fs.collection(db, "clients", clientCode, "payments")), {
                    type: "charge", amount: fee, method: "", source: "late-cancel", status: "confirmed",
                    balanceAfter: after, createdAt: new Date().toISOString()
                });
                await batch.commit();
                charged = true;
            } catch (err) { console.warn("Gebühr nicht sofort gebucht – Admin-Panel bucht nach:", err); }
        }
        // Sonst nur absagen; eine offene Gebühr bucht das Admin-Panel beim nächsten Öffnen automatisch
        if (!charged) await fs.updateDoc(fs.doc(db, app._path), cancelData);
        notifyMother(late ? "⚠️ GEÇ İPTAL (24 saatten az)" : "❌ Randevu iptal edildi", {
            "Danışan": app.name, "Telefon": app.phone, "Tarih": formatDateForUser(app.date), "Saat (Almanya)": app.time, "Hizmet": app.service,
            ...(app.clientCode && app.clientCode !== "GUEST" ? { "Kod": app.clientCode } : {}),
            ...(late ? { "Not": `24 saatten az kala iptal – ücret: ${money(fee, "tr")}` } : {})
        });
        toast(late ? t(clientCode ? "cancelled_late_bal" : "cancelled_late", { fee: money(fee) }) : t("cancelled_ok"), late ? "warn" : "success", 6000);
        if (clientState) loadClientDashboard(clientState.code);
        else await initCalendar(elementId, calendarOpts[elementId]);
    } catch (e) {
        console.error("cancel:", e);
        toast(t("generic_error"), "error");
    }
}

/* Benachrichtigung an Derya Hanım (E-Mail + optional Push). Läuft im Hintergrund. */
function notifyMother(subject, fields) {
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    const text = Object.entries(clean).map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nYönetim paneli: ${PORTAL_LINK}`;
    if (NOTIFY_EMAIL) {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ _subject: `${subject} – Derya Kılıç Web`, _template: "table", _captcha: "false", ...clean, "Yönetim paneli": PORTAL_LINK })
        }).catch((e) => console.warn("E-Mail-Benachrichtigung fehlgeschlagen:", e));
    }
    if (NTFY_TOPIC) {
        fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
            method: "POST", body: text, headers: { Title: subject.replace(/[^\x20-\x7E]/g, "").trim() || "Randevu", Tags: "calendar" }
        }).catch((e) => console.warn("Push-Benachrichtigung fehlgeschlagen:", e));
    }
}

/* Live-Prüfung Datum/Uhrzeit. Eingaben sind in der Ortszeit des Besuchers. */
function bindSlotChecker({ dateInput, timeInput, statusEl, chipsEl = null, getAppointments: getBusy }) {
    if (!dateInput || !timeInput) return null;
    dateInput.min = todayISO();
    const BERLIN_HOURS = ["10:00", "12:00", "14:00", "16:00", "18:00"];
    const update = () => {
        const busy = getBusy();
        const date = dateInput.value, time = timeInput.value;
        if (chipsEl) {
            const chips = !date ? BERLIN_HOURS.map((h) => ({ local: h, busy: false })) : BERLIN_HOURS.map((h) => {
                const inst = berlinToUTC(date, h);
                const loc = toLocal(inst);
                return loc.date === date ? { local: loc.time, busy: !!(checkSlot(busy, inst) || isPastInstant(inst) || isWeekendInstant(inst)) } : null;
            }).filter(Boolean);
            chipsEl.innerHTML = chips.map((c) => `<button type="button" data-t="${c.local}" aria-pressed="${c.local === time}" ${c.busy ? "disabled" : ""}>${c.local}</button>`).join("");
        }
        if (!statusEl) return;
        statusEl.className = "field-status";
        if (!date || !time) { statusEl.textContent = ""; return; }
        const inst = localInstant(date, time);
        if (isPastInstant(inst)) { statusEl.classList.add("warn"); statusEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${escapeHTML(t("slot_past"))}`; return; }
        if (isWeekendInstant(inst)) { statusEl.classList.add("warn"); statusEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${escapeHTML(t("slot_weekend"))}`; return; }
        const err = checkSlot(busy, inst);
        if (err) { statusEl.classList.add("warn"); statusEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${escapeHTML(t(err.key))}`; return; }
        let msg = t("slot_free", { d: formatDateLong(date), t: time });
        if (differsFromBerlin(inst)) msg += " " + t("tz_de_short", { t: toBerlin(inst).time });
        statusEl.classList.add("ok");
        statusEl.innerHTML = `<i class="fas fa-circle-check"></i> ${escapeHTML(msg)}`;
    };
    dateInput.addEventListener("change", update);
    dateInput.addEventListener("input", update);
    timeInput.addEventListener("input", update);
    chipsEl?.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-t]");
        if (!b || b.disabled) return;
        timeInput.value = b.dataset.t;
        timeInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    langHooks.push(update);
    update();
    return update;
}

function initTzNotes() {
    const notes = $$("[data-tz-note]");
    if (!notes.length) return;
    const render = () => {
        const now = new Date();
        const show = differsFromBerlin(now);
        notes.forEach((n) => {
            n.hidden = !show;
            if (show) n.innerHTML = `<i class="fas fa-globe"></i> ${escapeHTML(t("tz_note", { zone: tzCity(USER_TZ), here: toLocal(now).time, de: toBerlin(now).time }))}`;
        });
    };
    render();
    langHooks.push(render);
}

function scrollToCard(card, focusEl) {
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 80) - 12;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => focusEl?.focus({ preventScroll: true }), 450);
}

/* --- Öffentliche Buchung --- */
let successData = null;
async function initPublicBooking() {
    const form = $("#publicBookingForm");
    if (!form) return;

    const dateInput = $("#pubDate"), timeInput = $("#pubTime");
    let busy = [];
    const refreshStatus = bindSlotChecker({ dateInput, timeInput, statusEl: $("#slotStatus"), chipsEl: $("#timeChips"), getAppointments: () => busy });

    const params = new URLSearchParams(location.search);
    const hizmet = params.get("hizmet");
    if (hizmet && [...$("#pubService").options].some((o) => o.value === hizmet)) $("#pubService").value = hizmet;
    if (params.get("sekil") === "online") $("#pubFormat").value = "Online";

    const bars = $$(".form-steps span");
    const progress = () => {
        const done = [
            dateInput.value && timeInput.value,
            $("#pubName").value.trim() && $("#pubPhone").value.trim() && $("#pubEmail").value && $("#pubEmail").validity.valid,
            $("#pubReason").value.trim() && $("#pubConsent").checked
        ];
        bars.forEach((b, i) => b.classList.toggle("done", !!done[i]));
    };
    form.addEventListener("input", progress);
    form.addEventListener("change", progress);

    const result = await initCalendar("publicCalendar", {
        mode: "public",
        onDateClick: (d, tm) => {
            dateInput.value = d;
            if (tm) timeInput.value = tm;
            dateInput.dispatchEvent(new Event("change"));
            progress();
            scrollToCard($("#bookingCard"), tm ? $("#pubName") : timeInput);
        }
    });
    busy = result?.busy || [];
    refreshStatus?.();

    const submitBtn = $("#pubSubmit");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const inst = localInstant(dateInput.value, timeInput.value);
        const de = toBerlin(inst);
        const data = {
            name: $("#pubName").value.trim().slice(0, 100),
            email: $("#pubEmail").value.trim().slice(0, 120),
            phone: $("#pubPhone").value.trim().slice(0, 40),
            date: de.date, time: de.time,
            localDate: dateInput.value, localTime: timeInput.value,
            otherTz: differsFromBerlin(inst),
            service: $("#pubService").value,
            format: $("#pubFormat").value,
            reason: $("#pubReason").value.trim().slice(0, 2000),
            medicalHistory: ($("#pubMedicalHistory").value.trim() || "-").slice(0, 1000),
            expectation: ($("#pubExpectation").value.trim() || "-").slice(0, 1000)
        };
        if (isPastInstant(inst)) { toast(t("book_future"), "warn"); return; }
        if (isWeekendInstant(inst)) { toast(t("slot_weekend"), "warn"); return; }
        if (data.phone.replace(/\D/g, "").length < 6) { toast(t("book_phone"), "warn"); $("#pubPhone").focus(); return; }

        const oldHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${escapeHTML(t("sending"))}`;

        busy = (await loadCalendarData("public")).busy;
        const conflict = checkSlot(busy, inst);
        if (conflict) {
            toast(t(conflict.key), "warn");
            refreshStatus?.();
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldHTML;
            return;
        }

        let saved = false;
        if (await dbReady) {
            try {
                const ref = await fs.addDoc(fs.collection(db, "appointments"), {
                    clientCode: "GUEST",
                    name: data.name, email: data.email, phone: data.phone,
                    date: data.date, time: data.time, service: data.service, format: data.format,
                    tz: USER_TZ, startUTC: inst.toISOString(),
                    lang: LANG, isNewClient: true, source: "web",
                    anamnese: { reason: data.reason, medicalHistory: data.medicalHistory, expectation: data.expectation },
                    status: "pending", createdAt: new Date().toISOString()
                });
                // Die (geheime) Dokument-ID merkt sich nur dieser Browser
                const ids = storage.getJSON("myAppointmentIds", []);
                ids.push(ref.id);
                storage.set("myAppointmentIds", JSON.stringify(ids.slice(-20)));
                saved = true;
                notifyMother("🆕 Yeni randevu talebi", {
                    "Danışan": data.name, "Telefon": data.phone, "E-Posta": data.email,
                    "Tarih": formatDateForUser(data.date), "Saat (Almanya)": data.time,
                    ...(data.otherTz ? { "Danışanın saati": `${formatDateForUser(data.localDate)} ${data.localTime} (${tzCity(USER_TZ)})` } : {}),
                    "Hizmet": data.service, "Seans şekli": data.format, "Site dili": LANG.toUpperCase(), "Not": "Ön görüşme bilgileri yönetim panelinde"
                });
            } catch (err) { console.error("Speichern fehlgeschlagen:", err); }
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldHTML;

        const message =
`Merhaba Derya Hanım,

*Yeni Randevu & Ön Görüşme Talebi*

👤 *İsim:* ${data.name}
📞 *Tel:* ${data.phone}
✉️ *E-Posta:* ${data.email}
📅 *Tarih:* ${formatDateForUser(data.date)} - ⏰ *Saat (Almanya):* ${data.time}${data.otherTz ? `\n🌍 *Danışanın saati:* ${data.localTime} (${tzCity(USER_TZ)})` : ""}
🩺 *Hizmet:* ${data.service}
📍 *Seans şekli:* ${data.format}
🌐 *Site dili:* ${LANG.toUpperCase()}

📝 *Mini Ön Görüşme:*
• *Konu/Şikayet:* ${data.reason}
• *Geçmiş tedavi/ilaç:* ${data.medicalHistory}
• *Beklenti:* ${data.expectation}`;

        successData = { ...data, saved, wa: waLink(MOTHER_WHATSAPP_NUMBER, message) };
        showBookingSuccess();
        $("#bookingCard").scrollIntoView({ behavior: "smooth", block: "start" });
        if (saved) busy = (await initCalendar("publicCalendar", calendarOpts.publicCalendar))?.busy || busy;
    });
    langHooks.push(() => { if (successData && !$("#bookingSuccess").hidden) showBookingSuccess(); });
}

function showBookingSuccess() {
    const data = successData;
    $("#bookingFormWrap").hidden = true;
    const box = $("#bookingSuccess");
    box.hidden = false;
    box.innerHTML = `
        <div class="success-panel">
            <div class="success-icon"><i class="fas fa-check"></i></div>
            <h3></h3>
            <p class="success-text"></p>
            <ul class="summary-list">
                <li><span>${escapeHTML(t("sum_date"))}</span><strong></strong></li>
                <li><span>${escapeHTML(t("sum_time"))}</span><strong></strong></li>
                <li><span>${escapeHTML(t("sum_service"))}</span><strong></strong></li>
                <li><span>${escapeHTML(t("sum_format"))}</span><strong></strong></li>
            </ul>
            <div class="success-actions">
                <a class="btn btn--whatsapp" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> ${escapeHTML(t("wa_send"))}</a>
                <button type="button" class="btn btn--ghost" data-ics><i class="fas fa-calendar-plus"></i> ${escapeHTML(t("ics_add"))}</button>
                <button type="button" class="btn btn--ghost" data-again style="border-color:transparent"><i class="fas fa-rotate-left"></i> ${escapeHTML(t("new_req"))}</button>
            </div>
        </div>`;
    $("h3", box).textContent = t(data.saved ? "succ_saved_title" : "succ_unsaved_title");
    $(".success-text", box).textContent = t(data.saved ? "succ_saved_text" : "succ_unsaved_text");
    const vals = [formatDateLong(data.localDate), data.otherTz ? `${data.localTime} ${t("tz_de_short", { t: data.time })}` : data.localTime, optionLabel(data.service), optionLabel(data.format)];
    $$(".summary-list strong", box).forEach((s, i) => (s.textContent = vals[i]));
    $(".btn--whatsapp", box).href = data.wa;
    $("[data-ics]", box).addEventListener("click", () => downloadICSFile(`Derya Kılıç – ${optionLabel(data.service)}`, t("ics_pending"), data.date, data.time));
    $("[data-again]", box).addEventListener("click", () => {
        successData = null;
        box.hidden = true;
        $("#bookingFormWrap").hidden = false;
        $("#publicBookingForm").reset();
        $$(".form-steps span").forEach((b) => b.classList.remove("done"));
    });
}

/* ---------------------------------------------------------
   7. ZAHLUNGEN
   Saldo (balance) = offener Betrag. Nur Derya Hanım darf ihn ändern.
   PayPal-Zahlungen aus dem Portal kommen als "pending" an und werden im Admin bestätigt.
   --------------------------------------------------------- */
async function recordTransaction(code, { type, amount, method = "", source = "admin", paypalOrderId = null, note = "" }) {
    const ref = fs.doc(db, "clients", code);
    const snap = await fs.getDoc(ref);
    if (!snap.exists()) throw new Error("Client not found");
    const before = getBalance(snap.data());
    amount = round2(amount);
    const after = type === "payment" ? Math.max(0, round2(before - amount)) : round2(before + amount);
    await fs.updateDoc(ref, { balance: after, payment: money(after, "tr"), ...(after <= 0 ? { payDeadline: null, payDeadlineMs: 0 } : {}) });
    await fs.addDoc(fs.collection(db, "clients", code, "payments"), {
        type, amount, method, source, status: "confirmed", balanceAfter: after,
        paypalOrderId, note, createdAt: new Date().toISOString()
    });
    return { before, after };
}

async function getPayments(code) {
    if (!(await dbReady)) return [];
    try {
        return snapList(await fs.getDocs(fs.collection(db, "clients", code, "payments")))
            .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } catch (e) {
        console.error("getPayments:", e);
        return [];
    }
}

function renderPayHistory(el, payments, lang) {
    if (!el) return;
    if (!payments.length) { el.innerHTML = `<p class="hint">${escapeHTML(t("hist_empty", {}, lang))}</p>`; return; }
    el.innerHTML = payments.slice(0, 12).map((p) => {
        const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString(LOCALES[lang], { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
        const isPay = p.type === "payment";
        const pending = p.status === "pending";
        return `<div class="pay-row ${isPay ? "is-pay" : "is-charge"}${pending ? " is-pending" : ""}">
            <span class="pay-ico"><i class="fas ${pending ? "fa-hourglass-half" : isPay ? "fa-arrow-down" : "fa-plus"}"></i></span>
            <span class="pay-what">${escapeHTML(t(isPay ? "hist_payment" : (p.note === "late" || p.source === "late-cancel" ? "hist_late" : "hist_charge"), {}, lang))}${p.method ? ` · ${escapeHTML(UI["m_" + p.method] ? t("m_" + p.method, {}, lang) : p.method)}` : ""}${pending ? ` · ${escapeHTML(t("hist_pending", {}, lang))}` : ""}<small>${escapeHTML(date)}</small></span>
            <strong>${isPay ? "−" : "+"}${escapeHTML(money(p.amount, lang))}</strong>
        </div>`;
    }).join("");
}

let paypalLoading = null;
function loadPayPalSDK() {
    if (!PAYPAL_CLIENT_ID) return Promise.resolve(null);
    if (window.paypal) return Promise.resolve(window.paypal);
    if (!paypalLoading) {
        paypalLoading = new Promise((resolve) => {
            const s = document.createElement("script");
            s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=EUR&intent=capture`;
            s.onload = () => resolve(window.paypal || null);
            s.onerror = () => resolve(null);
            document.head.appendChild(s);
        });
    }
    return paypalLoading;
}

/* ---------------------------------------------------------
   8. PORTAL
   --------------------------------------------------------- */
async function isMasterCode(code) {
    try { return (await sha256(code.trim().toUpperCase())) === MASTER_CODE_HASH; } catch { return false; }
}

/* Firebase Authentication (nur für Derya Hanım) */
let authApi = null;
async function getAuthApi() {
    if (authApi) return authApi;
    if (!(await dbReady) || !fbApp) return null;
    try {
        const mod = await import(`${FB}/firebase-auth.js`);
        authApi = { mod, auth: mod.getAuth(fbApp) };
        return authApi;
    } catch (e) {
        console.error("Auth konnte nicht geladen werden:", e);
        return null;
    }
}
const isAdminUser = (user) => !!user && !!ADMIN_UID && user.uid === ADMIN_UID;

function showPortalView(view) {
    $("#loginSection").hidden = view !== "login";
    $("#masterDashboard").hidden = view !== "master";
    $("#clientDashboard").hidden = view !== "client";
    window.scrollTo({ top: 0 });
}

async function initPortal() {
    const form = $("#loginForm");
    if (!form) return;
    const input = $("#accessCode"), err = $("#loginError");
    let lastErrKey = null;
    langHooks.push(() => { if (lastErrKey) err.textContent = t(lastErrKey); });

    $("#toggleCode").addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        $("#toggleCode i").className = show ? "fas fa-eye-slash" : "fas fa-eye";
    });
    const fail = (key) => {
        lastErrKey = key;
        err.textContent = t(key);
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
    };

    /* Klienten-Login per Code */
    const login = async (code, silent = false) => {
        code = code.trim().toUpperCase();
        if (!code) { if (!silent) fail("login_empty"); return; }
        err.textContent = ""; lastErrKey = null;
        if (await isMasterCode(code)) {
            // Alter Admin-Code: Hinweis auf neue Anmeldung
            input.value = "";
            $("#adminLogin").open = true;
            $("#adminEmail").focus();
            toast("Yönetici girişi artık e-posta ve şifre ile yapılıyor.", "info", 6000);
            return;
        }
        const btn = $("#loginBtn");
        btn.disabled = true;
        try {
            if (!(await dbReady)) { fail("login_nodb"); return; }
            const snap = await fs.getDoc(fs.doc(db, "clients", code));
            if (snap.exists()) {
                session.set("portalCode", code);
                showPortalView("client");
                loadClientDashboard(code);
            } else {
                session.remove("portalCode");
                if (!silent) fail("login_invalid");
            }
        } catch (e) {
            console.error("login:", e);
            if (!silent) fail("login_error");
        } finally {
            btn.disabled = false;
        }
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); login(input.value); });

    /* Admin-Login per E-Mail + Passwort */
    $("#adminLoginForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = $("#adminLoginError");
        msg.textContent = "";
        const api = await getAuthApi();
        if (!api) { msg.textContent = "Bağlantı kurulamadı."; return; }
        const btn = $("#adminLoginBtn");
        btn.disabled = true;
        try {
            const cred = await api.mod.signInWithEmailAndPassword(api.auth, $("#adminEmail").value.trim(), $("#adminPassword").value);
            if (!isAdminUser(cred.user)) {
                msg.textContent = ADMIN_UID
                    ? "Bu hesabın yönetici yetkisi yok."
                    : `Kurulum: script.js içinde ADMIN_UID olarak şu değeri girin: ${cred.user.uid}`;
                await api.mod.signOut(api.auth);
            }
        } catch (er) {
            console.error("admin login:", er);
            msg.textContent = /invalid|wrong|user-not-found|credential/i.test(er.code || er.message) ? "E-posta veya şifre hatalı." : "Giriş yapılamadı.";
        } finally {
            btn.disabled = false;
        }
    });

    $$("[data-logout]").forEach((b) => b.addEventListener("click", logoutPortal));

    // Angemeldet bleiben: Admin über Firebase, Klient für diesen Tab
    const api = await getAuthApi();
    if (api) {
        api.mod.onAuthStateChanged(api.auth, (user) => {
            if (isAdminUser(user)) { showPortalView("master"); loadMasterDashboard(); }
        });
    }
    const saved = session.get("portalCode");
    if (saved) login(saved, true);
}

async function logoutPortal() {
    session.remove("portalCode");
    const api = authApi;
    if (api?.auth?.currentUser) { try { await api.mod.signOut(api.auth); } catch { /* ignore */ } }
    Object.values(calendars).forEach((c) => c?.destroy?.());
    Object.keys(calendars).forEach((k) => delete calendars[k]);
    $("#accessCode").value = "";
    clientState = null;
    showPortalView("login");
    toast(t("logged_out"), "info", 2500);
}

/* ====== Admin (Türkisch) ====== */

/* Einmalige Umstellung alter Daten auf die neue, sichere Struktur + laufende Pflege.
   Läuft bei jeder Admin-Anmeldung, ist mehrfach ausführbar ohne Schaden. */
async function syncAdmin() {
    let moved = 0;
    try {
        // 1) Alte Termine (alle lagen in "appointments") umziehen
        const top = snapList(await fs.getDocs(fs.collection(db, "appointments")));
        for (const a of top) {
            const { id, _path, ownerToken, ...data } = a;
            if (a.personal || a.clientCode === "SAHSI") {
                if (a.status === "approved") {
                    const s = await fs.addDoc(fs.collection(db, "slots"), { date: a.date, time: a.time, endTime: a.endTime || "", personal: true, status: "approved", createdAt: a.createdAt || new Date().toISOString() });
                    if (a.service) await fs.setDoc(fs.doc(db, "privateSlots", s.id), { note: a.service });
                }
                await fs.deleteDoc(fs.doc(db, _path)); moved++;
            } else if (a.clientCode && a.clientCode !== "GUEST") {
                const code = String(a.clientCode).toUpperCase();
                await fs.setDoc(fs.doc(db, "clients", code, "appointments", id), { ...data, clientCode: code });
                await fs.deleteDoc(fs.doc(db, _path)); moved++;
            }
        }
        // 2) Alte Zahlungen umziehen
        try {
            const pays = snapList(await fs.getDocs(fs.collection(db, "payments")));
            for (const p of pays) {
                const { id, _path, clientCode, ...data } = p;
                if (clientCode) await fs.setDoc(fs.doc(db, "clients", String(clientCode).toUpperCase(), "payments", id), { ...data, status: data.status || "confirmed" });
                await fs.deleteDoc(fs.doc(db, _path)); moved++;
            }
        } catch { /* keine alten Zahlungen */ }
        // 3) Private Notizen aus dem Klienten-Dokument herauslösen, Saldo als Zahl
        const clients = snapList(await fs.getDocs(fs.collection(db, "clients")));
        for (const c of clients) {
            const upd = {};
            if ("privateNotes" in c) {
                if (c.privateNotes) await fs.setDoc(fs.doc(db, "adminNotes", c.id), { notes: c.privateNotes }, { merge: true });
                upd.privateNotes = fs.deleteField(); moved++;
            }
            if (typeof c.balance !== "number") upd.balance = getBalance(c);
            if (Object.keys(upd).length) await fs.updateDoc(fs.doc(db, "clients", c.id), upd);
        }
        // 4) Kalender-Einträge (slots) für bestätigte Termine; Absagen nachziehen; Ausfallgebühren buchen
        const all = await getAllAppointmentsAdmin();
        for (const a of all) {
            if (a.status === "approved" && !a.slotId) {
                const s = await fs.addDoc(fs.collection(db, "slots"), { date: a.date, time: a.time, personal: false, status: "approved", createdAt: new Date().toISOString() });
                await fs.updateDoc(fs.doc(db, a._path), { slotId: s.id });
            }
            if (a.status === "cancelled" && a.slotId && !a.slotReleased) {
                try { await fs.deleteDoc(fs.doc(db, "slots", a.slotId)); } catch { /* schon weg */ }
                await fs.updateDoc(fs.doc(db, a._path), { slotReleased: true });
            }
            if (a.status === "cancelled" && a.lateCancel && !a.feeCharged && a._path.startsWith("clients/")) {
                const code = a._path.split("/")[1];
                try { await recordTransaction(code, { type: "charge", amount: lateFee(a.service), source: "late-cancel", note: "late" }); } catch (e) { console.error(e); }
                await fs.updateDoc(fs.doc(db, a._path), { feeCharged: true });
            }
        }
    } catch (e) {
        console.error("syncAdmin:", e);
    }
    if (moved) toast(`Veriler güvenli yapıya taşındı (${moved}).`, "info", 5000);
}

let masterInitialized = false;
async function loadMasterDashboard() {
    if (!masterInitialized) {
        masterInitialized = true;
        initTabs();
        $("#adminAddAppointmentForm").addEventListener("submit", addNewAppointment);
        $("#appClientSelect").addEventListener("change", toggleSahsiFields);
        $("#addClientForm").addEventListener("submit", addNewClient);
        $("#clientSelect").addEventListener("change", loadClientData);
        $("#saveClientBtn").addEventListener("click", saveClientData);
        $("#deleteClientBtn").addEventListener("click", deleteClientAccount);
        $("#payAddBtn").addEventListener("click", adminRecordPayment);
        $("#chargeBtn").addEventListener("click", () => adminCharge(parseAmount($("#chargeAmount").value)));
        $$("[data-charge]").forEach((b) => b.addEventListener("click", () => adminCharge(Number(b.dataset.charge))));
        $("#payAmount").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); adminRecordPayment(); } });
        $("#genCode").addEventListener("click", () => {
            const name = normalize($("#newClientName").value.trim().split(/\s+/)[0] || "DANISAN").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "DANISAN";
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const rnd = [...crypto.getRandomValues(new Uint8Array(5))].map((b) => chars[b % chars.length]).join("");
            $("#newClientCode").value = `${name}-${rnd}`;
        });
        $("#pendingAppointmentsList").addEventListener("click", (e) => {
            const ap = e.target.closest("[data-approve]"), rj = e.target.closest("[data-reject]");
            if (ap) approveAppointment(ap.dataset.approve);
            if (rj) rejectAppointment(rj.dataset.reject);
        });
        $("#pendingPayments")?.addEventListener("click", onPendingPaymentClick);
        $("#debtsList")?.addEventListener("click", onDebtClick);
        $("#remindersList")?.addEventListener("click", onReminderClick);
        setInterval(() => { if (!$("#masterDashboard").hidden) renderReminders(); }, 10 * 60 * 1000);
        $("#deadlineSaveBtn").addEventListener("click", adminSetDeadline);
        $("#deadlineClearBtn").addEventListener("click", adminClearDeadline);
        $("#masterCommentsList").addEventListener("click", onCommentAdminClick);
    }
    await syncAdmin();
    cleanExpiredHomework();
    refreshMaster();
    populateClientSelect();
    renderPendingPayments();
    renderMasterComments();
}

/* ---------- Hatırlatmalar: 26–30 Stunden vor dem Termin erinnern (Text immer Türkisch) ---------- */
const REMIND_FROM_H = 26, REMIND_TO_H = 30;
const fmtBerlinShort = (d) => { const b = toBerlin(d); return `${formatDateForUser(b.date)} ${b.time}`; };
function reminderText(a) {
    const inst = appInstant(a);
    const tomorrow = toBerlin(new Date(Date.now() + 86400000)).date === a.date;
    const local = a.tz && differsFromBerlin(inst, a.tz) ? toLocal(inst, a.tz) : null;
    return `Merhaba ${a.name || ""},

${tomorrow ? "Yarın randevunuz var" : "Yaklaşan randevunuzu hatırlatmak isteriz"} 🌿

📅 Tarih: ${formatDateForUser(a.date)}
⏰ Saat: ${a.time} (Almanya saati)${local ? `\n🌍 Sizin saatinizle: ${local.time} (${tzCity(a.tz)})` : ""}
🩺 Hizmet: ${a.service || "-"}${a.format ? `\n📍 Seans şekli: ${a.format}` : ""}

Randevunuzu iptal etmeniz gerekirse lütfen en geç randevudan 24 saat önce bildirin. Daha geç yapılan iptallerde ${money(lateFee(a.service), "tr")} iptal ücreti alınır.

Görüşmek üzere,
Derya Kılıç`;
}
async function renderReminders() {
    const box = $("#remindersList");
    if (!box) return;
    const all = await getAllAppointmentsAdmin();
    const now = Date.now();
    const items = all
        .filter((a) => a.status === "approved" && !a.personal && a.clientCode !== "SAHSI" && a.date && a.time)
        .map((a) => ({ ...a, h: (appInstant(a).getTime() - now) / 3600000 }))
        .filter((a) => a.h > 0 && a.h <= REMIND_TO_H + 18)
        .sort((x, y) => x.h - y.h);
    const open = items.filter((a) => !a.remindedAt && a.h <= REMIND_TO_H);
    const cnt = $("#reminderCount");
    if (cnt) { cnt.textContent = open.length ? `🔔 ${open.length}` : ""; cnt.dataset.n = open.length; }
    if (!items.length) { box.innerHTML = `<p class="empty-note">Önümüzdeki 2 gün için hatırlatılacak randevu yok.</p>`; return; }
    box.innerHTML = items.map((a) => {
        const hrs = Math.floor(a.h), mins = Math.round((a.h - hrs) * 60);
        const inH = `${hrs} saat${mins ? ` ${mins} dk` : ""} sonra`;
        let state, cls;
        if (a.remindedAt) { state = `✅ Hatırlatıldı: ${fmtBerlinShort(new Date(a.remindedAt))}${a.remindedVia ? ` (${a.remindedVia === "whatsapp" ? "WhatsApp" : a.remindedVia === "email" ? "E-posta" : "elle"})` : ""}`; cls = "done"; }
        else if (a.h > REMIND_TO_H) { const at = new Date(appInstant(a).getTime() - REMIND_TO_H * 3600000); state = `🕒 Hatırlatma zamanı: ${fmtBerlinShort(at)}'den itibaren`; cls = "later"; }
        else if (a.h >= REMIND_FROM_H) { state = "🔔 Şimdi hatırlatın – tam zamanı"; cls = "now"; }
        else if (a.h > 24) { state = "⚠️ Hemen hatırlatın – 24 saat sınırı yaklaşıyor"; cls = "late"; }
        else { state = "⚠️ 24 saatten az kaldı – yine de hatırlatabilirsiniz"; cls = "late"; }
        const wa = a.phone ? waLink(formatWhatsAppNumber(a.phone), reminderText(a)) : "";
        const mail = a.email ? `mailto:${encodeURIComponent(a.email)}?subject=${encodeURIComponent("Randevu hatırlatması – Derya Kılıç")}&body=${encodeURIComponent(reminderText(a))}` : "";
        const p = escapeHTML(a._path);
        return `
        <div class="list-item reminder-item reminder-item--${cls}">
            <div><strong>${escapeHTML(a.name || "?")}</strong> · ${escapeHTML(formatDateForUser(a.date))} ${escapeHTML(a.time)} · ${escapeHTML(a.service || "")}
                <div class="meta"><span><i class="fas fa-clock"></i>${escapeHTML(inH)}</span><span class="reminder-state">${escapeHTML(state)}</span>${!a.phone && !a.email ? `<span>Telefon / e-posta kayıtlı değil</span>` : ""}</div></div>
            <div class="list-actions">
                ${wa ? `<a class="btn btn--whatsapp btn--sm" href="${escapeHTML(wa)}" target="_blank" rel="noopener noreferrer" data-remind="${p}" data-via="whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ""}
                ${mail ? `<a class="btn btn--ghost btn--sm" href="${escapeHTML(mail)}" data-remind="${p}" data-via="email"><i class="fas fa-envelope"></i> E-posta</a>` : ""}
                ${a.remindedAt ? "" : `<button type="button" class="btn btn--ghost btn--sm" data-remind="${p}" data-via="manual" title="Başka yolla hatırlattıysanız"><i class="fas fa-check"></i> Hatırlatıldı</button>`}
            </div>
        </div>`;
    }).join("");
}
async function onReminderClick(e) {
    const el = e.target.closest("[data-remind]");
    if (!el) return;
    try {
        const snap = await fs.getDoc(fs.doc(db, el.dataset.remind));
        if (snap.exists() && snap.data().remindedAt && el.dataset.via !== "manual") return; // erster Nachweis bleibt
        await fs.updateDoc(fs.doc(db, el.dataset.remind), { remindedAt: new Date().toISOString(), remindedVia: el.dataset.via });
        if (el.dataset.via === "manual") toast("Hatırlatıldı olarak işaretlendi.", "success");
        setTimeout(renderReminders, 400);
    } catch (er) { console.error(er); toast("Kaydedilemedi.", "error"); }
}

async function cleanExpiredHomework() {
    try {
        const [clients, all] = await Promise.all([fs.getDocs(fs.collection(db, "clients")).then(snapList), getAllAppointmentsAdmin()]);
        const now = Date.now();
        for (const c of clients) {
            if (!c.homeworkDate) continue;
            const given = new Date(c.homeworkDate).getTime();
            const expired = now - given >= 7 * 24 * 3600 * 1000;
            const sessionSince = all.some((a) => a.status === "approved" && a._path.startsWith(`clients/${c.id}/`) && appInstant(a).getTime() > given && appInstant(a).getTime() <= now);
            if (expired || sessionSince) await fs.updateDoc(fs.doc(db, "clients", c.id), { homework: HW_DEFAULT, homeworkDate: null });
        }
    } catch (e) { console.error("cleanExpiredHomework:", e); }
}

function initTabs() {
    const tabs = $$("#masterDashboard .tab");
    tabs.forEach((tb) => tb.addEventListener("click", () => {
        tabs.forEach((x) => {
            const on = x === tb;
            x.setAttribute("aria-selected", String(on));
            document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
        });
        if (tb.id === "t-cal") calendars.masterCalendar?.updateSize?.();
    }));
}

async function refreshMaster() {
    await renderPendingAppointments();
    renderReminders();
    await initCalendar("masterCalendar", {
        mode: "master",
        onDateClick: (d, tm) => { $("#appDate").value = d; if (tm) $("#appTime").value = tm; scrollToCard($("#adminAddCard"), $("#appClientSelect")); }
    });
}

function toggleSahsiFields() {
    const personal = $("#appClientSelect")?.value === SAHSI;
    const endWrap = $("#appEndWrap");
    if (endWrap) endWrap.hidden = !personal;
    const svc = $("#appServiceType");
    if (svc) { svc.required = !personal; svc.placeholder = personal ? "Not (isteğe bağlı, sadece siz görürsünüz)" : "Örn: Hipnoterapi"; }
    const lbl = $('label[for="appServiceType"]');
    if (lbl) lbl.textContent = personal ? "Not" : "Terapi türü / not";
}

let pendingCache = [];
async function renderPendingAppointments() {
    const listEl = $("#pendingAppointmentsList");
    if (!listEl) return;
    const all = await getAllAppointmentsAdmin();
    const busy = await getAdminBusy(all);
    pendingCache = all.filter((a) => a.status === "pending").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const count = $("#pendingCount");
    count.textContent = pendingCache.length || "";
    count.dataset.n = pendingCache.length;
    if (!pendingCache.length) {
        listEl.innerHTML = `<div class="empty"><i class="fas fa-mug-hot"></i> Bekleyen randevu talebi bulunmuyor.</div>`;
        return;
    }
    listEl.innerHTML = pendingCache.map((app) => {
        const past = isPast(app.date, app.time);
        const a = app.anamnese;
        const clash = checkSlot(busy, appInstant(app), app.id);
        const tzInfo = app.tz && differsFromBerlin(appInstant(app), app.tz) ? ` <small>(danışan: ${escapeHTML(toLocal(appInstant(app), app.tz).time)} ${escapeHTML(tzCity(app.tz))})</small>` : "";
        const codeTag = app.clientCode && app.clientCode !== "GUEST" ? `<span class="tag-lang">${escapeHTML(app.clientCode)}</span>` : "";
        return `
        <div class="list-item">
            <div>
                <strong>${escapeHTML(app.name)}</strong> · ${escapeHTML(app.service)}${app.isNewClient ? '<span class="tag-new">YENİ DANIŞAN</span>' : ""}${codeTag}${app.lang && app.lang !== "tr" ? `<span class="tag-lang">${escapeHTML(app.lang.toUpperCase())}</span>` : ""}
                <div class="meta">
                    <span><i class="fas fa-calendar"></i>${escapeHTML(formatDateForUser(app.date))}${past ? " (geçmiş)" : ""}</span>
                    <span><i class="fas fa-clock"></i>${escapeHTML(app.time)}${tzInfo}</span>
                    ${app.format ? `<span><i class="fas fa-location-dot"></i>${escapeHTML(app.format)}</span>` : ""}
                    <span><i class="fas fa-phone"></i>${escapeHTML(app.phone || "-")}</span>
                    <span><i class="fas fa-envelope"></i>${escapeHTML(app.email || "-")}</span>
                </div>
                ${clash ? `<p class="clash"><i class="fas fa-triangle-exclamation"></i> ${escapeHTML(conflictText(clash))} Onaylanamaz.</p>` : ""}
                ${a ? `<details><summary>Ön görüşme bilgileri</summary>
                    <p><strong>Konu:</strong> ${escapeHTML(a.reason)}<br><strong>Tedavi geçmişi:</strong> ${escapeHTML(a.medicalHistory)}<br><strong>Beklenti:</strong> ${escapeHTML(a.expectation)}</p>
                </details>` : ""}
            </div>
            <div class="list-actions">
                <button type="button" class="btn btn--success btn--sm" data-approve="${escapeHTML(app._path)}" ${clash || past ? "disabled title=\"Onaylanamaz\"" : ""}><i class="fas fa-check"></i> Onayla</button>
                <button type="button" class="btn btn--danger btn--sm" data-reject="${escapeHTML(app._path)}"><i class="fas fa-xmark"></i> Reddet</button>
            </div>
        </div>`;
    }).join("");
}

/* Nachricht an den Klienten in SEINER Sprache */
function clientMessage(status, app) {
    const lang = LANGS.includes(app.lang) ? app.lang : "tr";
    const link = status === "approved" ? PORTAL_LINK + `?lang=${lang}` : SITE_URL + `kalender.html?lang=${lang}`;
    const inst = appInstant(app);
    const tzOther = app.tz && differsFromBerlin(inst, app.tz);
    const loc = tzOther ? toLocal(inst, app.tz) : null;
    // Vorgefertigte Nachrichten immer auf Türkisch
    const when = tzOther
        ? t("tz_both", { de: app.time, here: loc.time, zone: tzCity(app.tz) }, "tr")
        : t("tz_de_only", { t: app.time }, "tr");
    return t(status === "approved" ? "msg_approved" : "msg_rejected", { n: app.name, d: formatDateForUser(tzOther ? loc.date : app.date), t: when, link }, "tr");
}

async function approveAppointment(path) {
    const all = await getAllAppointmentsAdmin();
    const app = all.find((a) => a._path === path);
    if (!app) return;
    // Regel: Bestätigen ist NICHT möglich, wenn der Abstand zu einem bestätigten Termin < 2 Std. ist
    const conflict = checkSlot(await getAdminBusy(all), appInstant(app), app.id);
    if (conflict) {
        await dialog({
            title: "Onaylanamaz",
            text: `${app.name} · ${formatDateForUser(app.date)} ${app.time}\n\n${conflictText(conflict)}\n\nLütfen danışanla yeni bir saat belirleyin veya talebi reddedin.`,
            okText: "Tamam", showCancel: false
        });
        return;
    }
    try {
        const slot = await fs.addDoc(fs.collection(db, "slots"), { date: app.date, time: app.time, personal: false, status: "approved", createdAt: new Date().toISOString() });
        await fs.updateDoc(fs.doc(db, path), { status: "approved", slotId: slot.id });
        toast("Randevu onaylandı.", "success");
        await refreshMaster();
        if (app.phone) {
            await dialog({
                title: "Danışanı bilgilendir",
                text: `${app.name} kişisine onay mesajı göndermek ister misiniz?${app.lang && app.lang !== "tr" ? `\n(Mesaj danışanın dilinde: ${app.lang.toUpperCase()})` : ""}`,
                okText: "", cancelText: "Daha sonra",
                link: { href: waLink(formatWhatsAppNumber(app.phone), clientMessage("approved", app)), text: "WhatsApp ile bildir" }
            });
        }
    } catch (e) {
        console.error("approve:", e);
        toast("Onaylanamadı.", "error");
    }
}

async function rejectAppointment(path) {
    const app = pendingCache.find((a) => a._path === path);
    if (!app) return;
    if (!(await dialog({ title: "Talebi reddet", text: `${app.name} · ${formatDateForUser(app.date)} ${app.time}\n\nBu talep silinecek.`, okText: "Reddet", cancelText: "Vazgeç", danger: true }))) return;
    try {
        await fs.deleteDoc(fs.doc(db, path));
        toast("Talep silindi.", "success");
        await refreshMaster();
        if (app.phone) {
            await dialog({
                title: "Danışanı bilgilendir", text: "Danışana ret mesajı göndermek ister misiniz?",
                okText: "", cancelText: "Daha sonra",
                link: { href: waLink(formatWhatsAppNumber(app.phone), clientMessage("rejected", app)), text: "WhatsApp ile bildir" }
            });
        }
    } catch (e) { console.error(e); toast("Silinemedi.", "error"); }
}

async function adminCancelAppointment(app) {
    try {
        await fs.updateDoc(fs.doc(db, app._path), { status: "cancelled", cancelledAt: new Date().toISOString(), slotReleased: true, cancelledBy: "admin" });
        if (app.slotId) { try { await fs.deleteDoc(fs.doc(db, "slots", app.slotId)); } catch { /* ignore */ } }
        toast("Randevu iptal edildi.", "success");
    } catch (e) { console.error(e); toast("İptal edilemedi.", "error"); }
}

/* Kollisionstext für den Admin (Türkisch) */
function conflictText(conflict) {
    const other = conflict.app;
    const who = other.personal ? "🔒 Şahsi randevu" : (other.name || "Başka bir danışan");
    const otherWhen = `${formatDateForUser(other.date)} ${other.time}${other.personal && other.endTime ? "–" + other.endTime : ""}`;
    if (conflict.key === "slot_taken") return `Bu saatte zaten bir randevu var: ${who} (${otherWhen}).`;
    return `${who} (${otherWhen}) ile arada en az 2 saat olmalı.`;
}
function gapText(a, b) {
    const m = Math.round(Math.abs(a - b) / 60000);
    const h = Math.floor(m / 60), mm = m % 60;
    return h ? `${h} saat${mm ? " " + mm + " dk" : ""}` : `${mm} dk`;
}

const SAHSI = "__SAHSI__";
async function addNewAppointment(e) {
    e.preventDefault();
    const sel = $("#appClientSelect");
    const personal = sel.value === SAHSI;
    const date = $("#appDate").value, time = $("#appTime").value, service = $("#appServiceType").value.trim();
    const endTime = personal ? $("#appEndTime").value : "";
    if (!sel.value) { toast("Lütfen bir danışan veya “Şahsi” seçiniz.", "warn"); return; }
    if (!date || !time || (!personal && !service)) { toast("Lütfen tüm alanları doldurunuz.", "warn"); return; }
    if (personal && endTime && endTime <= time) { toast("Bitiş saati başlangıçtan sonra olmalı.", "warn"); return; }

    // Regel 3: Şahsi -> keine 2-Stunden-Regel. Klienten-Termine -> Warnung mit Wahl.
    if (!personal) {
        const inst = berlinToUTC(date, time);
        const conflict = checkSlot(await getAdminBusy(), inst);
        if (conflict) {
            const save = await dialog({
                title: "⚠️ Dikkat: 2 saat kuralı",
                text: `${conflictText(conflict)}\nAradaki süre: ${gapText(inst, appInstant(conflict.app))}.\n\n“Evet, farkındayım” → randevu yine de kaydedilir.\n“Tamam” → kaydetmeden çıkılır.`,
                okText: "Evet, farkındayım – kaydet", cancelText: "Tamam – kaydetme"
            });
            if (save !== true) { toast("Randevu kaydedilmedi.", "info"); return; }
        }
    }
    try {
        const now = new Date().toISOString();
        const slot = await fs.addDoc(fs.collection(db, "slots"), { date, time, endTime: personal ? (endTime || "") : "", personal, status: "approved", createdAt: now });
        if (personal) {
            if (service) await fs.setDoc(fs.doc(db, "privateSlots", slot.id), { note: service });
        } else {
            await fs.addDoc(fs.collection(db, "clients", sel.value, "appointments"), {
                clientCode: sel.value, name: sel.selectedOptions[0].dataset.name || sel.value,
                email: "", phone: "", date, time, service, status: "approved", slotId: slot.id, source: "admin", createdAt: now
            });
        }
        toast(personal ? "Şahsi randevu kaydedildi." : "Randevu oluşturuldu ve onaylandı.", "success");
        e.target.reset();
        toggleSahsiFields();
        refreshMaster();
    } catch (err) {
        console.error("addNewAppointment:", err);
        toast("Randevu eklenirken hata oluştu.", "error");
    }
}

async function addNewClient(e) {
    e.preventDefault();
    if (!(await dbReady)) { toast("Veritabanı bağlantısı kurulamadı.", "error"); return; }
    const code = $("#newClientCode").value.trim().toUpperCase().replace(/\s+/g, "");
    const name = $("#newClientName").value.trim();
    if (!code || !name) { toast("Lütfen isim ve kod giriniz.", "warn"); return; }
    if (!/^[A-Z0-9ÇĞİÖŞÜ_-]{6,30}$/.test(code)) { toast("Kod en az 6 karakter olmalı ve sadece harf/rakam içermeli. “Öner” butonunu kullanabilirsiniz.", "warn", 6000); return; }
    if ((await isMasterCode(code)) || ["SAHSI", "GUEST", "MASTER"].includes(code)) { toast("Bu kod kullanılamaz.", "warn"); return; }
    try {
        // Regel 1: Kein Code darf doppelt vergeben werden
        const ref = fs.doc(db, "clients", code);
        const snap = await fs.getDoc(ref);
        if (snap.exists()) { toast(`Bu kod zaten kullanılıyor (${snap.data().name}). Lütfen farklı bir kod seçin.`, "warn", 6000); return; }
        await fs.setDoc(ref, { code, name, homework: HW_DEFAULT, homeworkDate: null, balance: 0, payment: "0 €" });
        e.target.reset();
        await populateClientSelect(code);
        await dialog({ title: "Danışan eklendi ✓", text: `İsim: ${name}\nGiriş kodu: ${code}\n\nKodu danışanla paylaşmayı unutmayın.`, okText: "Tamam", showCancel: false });
    } catch (err) {
        console.error("addNewClient:", err);
        toast("Danışan eklenirken bir hata oluştu.", "error");
    }
}

async function populateClientSelect(selectCode = null) {
    const sel = $("#clientSelect"), appSel = $("#appClientSelect");
    if (!(await dbReady)) return;
    const sahsiOpt = `<option value="">Lütfen seçin</option><option value="${SAHSI}">🔒 Şahsi (kişisel – 2 saat kuralı yok)</option>`;
    try {
        const clients = snapList(await fs.getDocs(fs.collection(db, "clients"))).sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
        if (!clients.length) {
            renderDebts([]);
            sel.innerHTML = `<option value="">Kayıtlı danışan yok</option>`;
            appSel.innerHTML = sahsiOpt;
            return;
        }
        renderDebts(clients);
        const opts = clients.map((c) => `<option value="${escapeHTML(c.id)}" data-name="${escapeHTML(c.name)}">${escapeHTML(c.name)} (${escapeHTML(c.id)}) · ${escapeHTML(money(getBalance(c), "tr"))}</option>`).join("");
        const prev = selectCode || sel.value;
        const prevApp = appSel.value;
        sel.innerHTML = opts;
        if (prev && clients.some((c) => c.id === prev)) sel.value = prev;
        appSel.innerHTML = sahsiOpt + opts;
        if (prevApp) appSel.value = prevApp;
        loadClientData();
    } catch (e) { console.error("populateClientSelect:", e); }
}

let loadedHomework = "";
let adminBalance = 0;
async function loadClientData() {
    const code = $("#clientSelect").value;
    if (!code || !(await dbReady)) return;
    try {
        const [snap, notes] = await Promise.all([fs.getDoc(fs.doc(db, "clients", code)), fs.getDoc(fs.doc(db, "adminNotes", code)).catch(() => null)]);
        if (!snap.exists()) return;
        const c = snap.data();
        loadedHomework = c.homework || "";
        $("#clientHomework").value = c.homework === HW_DEFAULT ? "" : (c.homework || "");
        $("#clientPrivateNotes").value = notes?.exists() ? (notes.data().notes || "") : "";
        adminBalance = getBalance(c);
        $("#adminBalance").textContent = money(adminBalance, "tr");
        const st = $("#adminBalanceState");
        st.textContent = adminBalance > 0 ? "Açık" : "Ödendi ✓";
        st.className = "balance-state " + (adminBalance > 0 ? "open" : "paid");
        adminClient = c;
        $("#payDeadline").value = c.payDeadline && Number(c.payDeadlineMs) > 0 ? c.payDeadline : "";
        renderDeadlineState(c);
        renderPayHistory($("#adminPayHistory"), await getPayments(code), "tr");
    } catch (e) { console.error("loadClientData:", e); }
}

let adminClient = null;
function renderDeadlineState(c) {
    const el = $("#deadlineState");
    if (!el) return;
    el.className = "deadline-state";
    if (!(Number(c?.payDeadlineMs) > 0)) { el.textContent = "Süre tanımlı değil – portal açık."; return; }
    if (isPortalLocked(c)) { el.classList.add("locked"); el.textContent = `🔒 Portal kilitli – süre ${deadlineTR(c)} tarihinde doldu.`; return; }
    if (getBalance(c) <= 0) { el.textContent = `Süre: ${deadlineTR(c)} – borç yok, portal açık.`; return; }
    el.classList.add("waiting");
    el.textContent = `⏳ ${deadlineTR(c)} tarihine kadar ödeme bekleniyor (sonra portal kilitlenir).`;
}
async function adminSetDeadline() {
    const code = $("#clientSelect").value, v = $("#payDeadline").value;
    if (!code) return;
    if (!v) { toast("Lütfen tarih ve saat seçin.", "warn"); $("#payDeadline").focus(); return; }
    const [d, tm] = v.split("T");
    const ms = berlinToUTC(d, tm.slice(0, 5)).getTime();
    if (ms < Date.now() && !(await dialog({ title: "Tarih geçmişte", text: `Seçilen tarih geçmişte. Borç varsa portal hemen kilitlenir.

Devam edilsin mi?`, okText: "Evet, kilitle", cancelText: "Vazgeç", danger: true }))) return;
    try {
        await fs.updateDoc(fs.doc(db, "clients", code), { payDeadline: `${d}T${tm.slice(0, 5)}`, payDeadlineMs: ms });
        toast(`Son ödeme tarihi kaydedildi: ${formatDateForUser(d)} ${tm.slice(0, 5)}`, "success");
        await populateClientSelect(code);
    } catch (e) { console.error(e); toast("Kaydedilemedi.", "error"); }
}
async function adminClearDeadline() {
    const code = $("#clientSelect").value;
    if (!code) return;
    try {
        await fs.updateDoc(fs.doc(db, "clients", code), { payDeadline: null, payDeadlineMs: 0 });
        $("#payDeadline").value = "";
        toast("Süre kaldırıldı – portal açık.", "success");
        await populateClientSelect(code);
    } catch (e) { console.error(e); toast("Kaydedilemedi.", "error"); }
}

async function adminRecordPayment() {
    const code = $("#clientSelect").value;
    const amount = round2(parseAmount($("#payAmount").value));
    if (!code) return;
    if (!(amount > 0)) { toast("Lütfen alınan tutarı girin.", "warn"); $("#payAmount").focus(); return; }
    if (amount > adminBalance && !(await dialog({ title: "Tutar bakiyeden fazla", text: `Bakiye: ${money(adminBalance, "tr")}\nGirilen: ${money(amount, "tr")}\n\nBakiye 0 € olarak kaydedilecek. Devam edilsin mi?`, okText: "Devam", cancelText: "Vazgeç" }))) return;
    try {
        const { after } = await recordTransaction(code, { type: "payment", amount, method: $("#payMethod").value, source: "admin" });
        $("#payAmount").value = "";
        toast(`${money(amount, "tr")} düşüldü. Kalan: ${money(after, "tr")}`, "success");
        await populateClientSelect(code);
    } catch (e) {
        console.error("adminRecordPayment:", e);
        toast("Kaydedilemedi.", "error");
    }
}

async function adminCharge(amount) {
    const code = $("#clientSelect").value;
    amount = round2(amount);
    if (!code) return;
    if (!(amount > 0)) { toast("Lütfen bir tutar girin.", "warn"); $("#chargeAmount").focus(); return; }
    try {
        const { after } = await recordTransaction(code, { type: "charge", amount, method: "", source: "admin" });
        $("#chargeAmount").value = "";
        toast(`${money(amount, "tr")} eklendi. Yeni bakiye: ${money(after, "tr")}`, "success");
        await populateClientSelect(code);
    } catch (e) {
        console.error("adminCharge:", e);
        toast("Kaydedilemedi.", "error");
    }
}

/* Borçlar: Übersicht aller offenen Beträge + Gesamtsumme */
async function renderDebts(clients) {
    const list = $("#debtsList");
    if (!list) return;
    let pendingBy = {};
    try {
        snapList(await fs.getDocs(fs.collectionGroup(db, "payments")))
            .filter((p) => p.status === "pending")
            .forEach((p) => { const c = p._path.split("/")[1]; pendingBy[c] = round2((pendingBy[c] || 0) + (Number(p.amount) || 0)); });
    } catch (e) { pendingBy = {}; }
    const debtors = clients.map((c) => ({ ...c, bal: getBalance(c) })).filter((c) => c.bal > 0).sort((a, b) => b.bal - a.bal);
    const total = round2(debtors.reduce((s, c) => s + c.bal, 0));
    $("#debtsTotal").textContent = money(total, "tr");
    $("#debtsCount").textContent = debtors.length ? `${debtors.length} danışan` : "";
    if (!debtors.length) { list.innerHTML = `<p class="pay-ok"><i class="fas fa-circle-check"></i> Açık borç yok – herkes ödemiş.</p>`; return; }
    list.innerHTML = debtors.map((c) => `
        <button type="button" class="list-item debt-row" data-debt="${escapeHTML(c.id)}" title="Danışanı aç">
            <div><strong>${escapeHTML(c.name || c.id)}</strong>
                <div class="meta"><span>${escapeHTML(c.id)}</span>${isPortalLocked(c) ? `<span class="debt-lock">🔒 Portal kilitli</span>` : Number(c.payDeadlineMs) > 0 ? `<span class="debt-due">⏳ Son tarih: ${escapeHTML(deadlineTR(c))}</span>` : ""}${pendingBy[c.id] ? `<span class="debt-pending"><i class="fab fa-paypal"></i> ${escapeHTML(money(pendingBy[c.id], "tr"))} onay bekliyor</span>` : ""}</div></div>
            <span class="debt-amount">${escapeHTML(money(c.bal, "tr"))} <i class="fas fa-chevron-right"></i></span>
        </button>`).join("");
}
function onDebtClick(e) {
    const row = e.target.closest("[data-debt]");
    if (!row) return;
    $("#clientSelect").value = row.dataset.debt;
    loadClientData();
    scrollToCard($("#clientEditCard"), $("#payAmount"));
}

/* PayPal-Zahlungen aus dem Portal: erst nach Prüfung durch Derya Hanım verrechnen */
async function renderPendingPayments() {
    const box = $("#pendingPayments");
    if (!box) return;
    let pend = [];
    try { pend = snapList(await fs.getDocs(fs.collectionGroup(db, "payments"))).filter((p) => p.status === "pending"); }
    catch (e) { console.error(e); }
    const cnt = $("#payPendingCount");
    if (cnt) { cnt.textContent = pend.length || ""; cnt.dataset.n = pend.length; }
    box.hidden = !pend.length;
    if (!pend.length) { box.innerHTML = ""; return; }
    box.innerHTML = `<h3><i class="fab fa-paypal"></i> Onay bekleyen PayPal ödemeleri</h3>
        <p class="card-sub">PayPal hesabınızda ödemeyi kontrol edin, sonra onaylayın – tutar bakiyeden otomatik düşülür.</p>
        <div class="list">${pend.map((p) => `
        <div class="list-item">
            <div><strong>${escapeHTML(p._path.split("/")[1])}</strong> · ${escapeHTML(money(p.amount, "tr"))}
                <div class="meta"><span>${escapeHTML(new Date(p.createdAt).toLocaleString("tr-TR"))}</span>${p.paypalOrderId ? `<span>PayPal: ${escapeHTML(p.paypalOrderId)}</span>` : ""}</div></div>
            <div class="list-actions">
                <button type="button" class="btn btn--success btn--sm" data-pay-ok="${escapeHTML(p._path)}"><i class="fas fa-check"></i> Onayla</button>
                <button type="button" class="btn btn--danger btn--sm" data-pay-no="${escapeHTML(p._path)}"><i class="fas fa-xmark"></i> Reddet</button>
            </div>
        </div>`).join("")}</div>`;
}
async function onPendingPaymentClick(e) {
    const ok = e.target.closest("[data-pay-ok]"), no = e.target.closest("[data-pay-no]");
    const path = ok?.dataset.payOk || no?.dataset.payNo;
    if (!path) return;
    const code = path.split("/")[1];
    try {
        const snap = await fs.getDoc(fs.doc(db, path));
        if (!snap.exists() || snap.data().status !== "pending") return;
        if (ok) {
            const amount = round2(snap.data().amount);
            const cref = fs.doc(db, "clients", code);
            const before = getBalance((await fs.getDoc(cref)).data());
            const after = Math.max(0, round2(before - amount));
            await fs.updateDoc(cref, { balance: after, payment: money(after, "tr"), ...(after <= 0 ? { payDeadline: null, payDeadlineMs: 0 } : {}) });
            await fs.updateDoc(fs.doc(db, path), { status: "confirmed", balanceAfter: after, confirmedAt: new Date().toISOString() });
            toast(`${money(amount, "tr")} onaylandı. Kalan: ${money(after, "tr")}`, "success");
        } else {
            if (!(await dialog({ title: "Ödemeyi reddet", text: "Bu ödeme kaydı silinecek.", okText: "Reddet", cancelText: "Vazgeç", danger: true }))) return;
            await fs.deleteDoc(fs.doc(db, path));
            toast("Ödeme kaydı silindi.", "info");
        }
        renderPendingPayments();
        populateClientSelect();
    } catch (er) { console.error(er); toast("İşlem yapılamadı.", "error"); }
}

async function saveClientData() {
    const code = $("#clientSelect").value;
    if (!code || !(await dbReady)) return;
    const hw = $("#clientHomework").value.trim();
    const update = { homework: hw || HW_DEFAULT };
    if (hw && hw !== loadedHomework) update.homeworkDate = new Date().toISOString();
    if (!hw) update.homeworkDate = null;
    try {
        await fs.updateDoc(fs.doc(db, "clients", code), update);
        await fs.setDoc(fs.doc(db, "adminNotes", code), { notes: $("#clientPrivateNotes").value }, { merge: true });
        loadedHomework = update.homework;
        toast("Ödev ve notlar kaydedildi.", "success");
    } catch (e) {
        console.error("saveClientData:", e);
        toast("Kaydedilemedi.", "error");
    }
}

async function deleteClientAccount() {
    const sel = $("#clientSelect");
    const code = sel.value;
    if (!code) return;
    const name = sel.selectedOptions[0]?.dataset.name || code;
    if (!(await dialog({ title: "Hesabı sil", text: `${name} (${code}) hesabı kalıcı olarak silinecek.`, okText: "Evet, sil", cancelText: "Vazgeç", danger: true }))) return;
    try {
        await fs.deleteDoc(fs.doc(db, "clients", code));
        try { await fs.deleteDoc(fs.doc(db, "adminNotes", code)); } catch { /* ignore */ }
        toast("Danışan hesabı silindi.", "success");
        populateClientSelect();
    } catch (e) {
        console.error("deleteClientAccount:", e);
        toast("Silinemedi.", "error");
    }
}

async function renderMasterComments() {
    const list = $("#masterCommentsList");
    if (!list) return;
    const comments = await getComments();
    if (!comments || !comments.length) { list.innerHTML = `<div class="empty">Henüz yorum yok.</div>`; return; }
    list.innerHTML = comments.map((c) => `
        <div class="list-item">
            <div>
                <strong>${escapeHTML(c.name)}</strong> <span class="stars">${starString(c.stars)}</span>${c.lang && c.lang !== "tr" ? `<span class="tag-lang">${escapeHTML(c.lang.toUpperCase())}</span>` : ""}
                <div class="meta"><span>${escapeHTML(c.text)}</span></div>
            </div>
            <button type="button" class="btn btn--danger btn--sm" data-del-comment="${escapeHTML(c.id)}"><i class="fas fa-trash-can"></i> Sil</button>
        </div>`).join("");
}

async function onCommentAdminClick(e) {
    const b = e.target.closest("[data-del-comment]");
    if (!b) return;
    if (!(await dialog({ title: "Yorumu sil", text: "Bu yorum sitede artık görünmeyecek.", okText: "Sil", cancelText: "Vazgeç", danger: true }))) return;
    try {
        await fs.deleteDoc(fs.doc(db, "comments", b.dataset.delComment));
        toast("Yorum silindi.", "success");
        renderMasterComments();
    } catch (err) {
        console.error("deleteComment:", err);
        toast("Silinemedi.", "error");
    }
}

/* ====== Klient ====== */
let clientState = null;
let clientInitialized = false;

async function loadClientDashboard(code) {
    let client = null;
    try {
        const snap = await fs.getDoc(fs.doc(db, "clients", code));
        if (snap.exists()) client = snap.data();
    } catch (e) { console.error("loadClientDashboard:", e); }
    const payments = await getPayments(code);
    clientState = { code, client: client || {}, payments, own: [], busy: [] };
    if (client && !$("#clientName").value) $("#clientName").value = client.name || "";

    const result = await initCalendar("clientCalendar", {
        mode: "client", clientCode: code,
        onDateClick: (d, tm) => {
            $("#selectedDate").value = d;
            if (tm) $("#selectedTime").value = tm;
            $("#selectedDate").dispatchEvent(new Event("change"));
            scrollToCard($("#clientBookingCard"), $("#selectedTime"));
        }
    });
    const data = result || (await loadCalendarData("client", code));
    clientState.own = data.own;
    clientState.busy = data.busy;
    renderClientDashboard();

    if (!clientInitialized) {
        clientInitialized = true;
        bindSlotChecker({ dateInput: $("#selectedDate"), timeInput: $("#selectedTime"), statusEl: $("#clientSlotStatus"), getAppointments: () => clientState?.busy || [] });
        $("#appointmentForm").addEventListener("submit", handleClientBooking);
        langHooks.push(() => { if (clientState) renderClientDashboard(); });
    }
}

function homeworkActive(client, own) {
    if (!client.homework || client.homework === HW_DEFAULT || !client.homeworkDate) return !!client.homework && client.homework !== HW_DEFAULT;
    const given = new Date(client.homeworkDate).getTime(), now = Date.now();
    if (now - given >= 7 * 24 * 3600 * 1000) return false;
    return !own.some((a) => a.status === "approved" && appInstant(a).getTime() > given && appInstant(a).getTime() <= now);
}

function renderClientDashboard() {
    const { code, client, payments, own } = clientState;
    $("#clientWelcomeTitle").textContent = t("welcome", { n: client.name || code });
    $("#displayHomework").textContent = homeworkActive(client, own) ? client.homework : t("hw_none");

    const mine = own
        .filter((a) => (a.status === "approved" || a.status === "pending") && !isPast(a.date, a.time))
        .sort((a, b) => appInstant(a) - appInstant(b))[0];
    const cn = $("#nextCancelNote");
    if (cn) {
        cn.hidden = !(mine && mine.status === "approved");
        if (!cn.hidden) {
            const until = new Date(appInstant(mine).getTime() - CANCEL_FREE_HOURS * 3600000);
            const l = toLocal(until);
            cn.innerHTML = until.getTime() > Date.now()
                ? `<i class="fas fa-circle-info"></i> ${escapeHTML(t("cancel_until", { d: `${formatDateLong(l.date)} · ${l.time}` }))}`
                : `<i class="fas fa-circle-exclamation"></i> ${escapeHTML(t("cancel_window_over"))}`;
        }
    }
    $("#displayNext").textContent = mine
        ? `${formatDateLong(toLocal(appInstant(mine)).date)} · ${localTimeLabel(mine)}\n${optionLabel(mine.service)}${mine.status === "approved" ? "" : t("cal_pending_suffix")}`
        : t("next_none");

    const balance = getBalance(client);
    const locked = isPortalLocked(client);
    const banner = $("#clientLockBanner");
    banner.hidden = !locked;
    if (locked) banner.innerHTML = `<i class="fas fa-lock"></i><div><strong>${escapeHTML(t("lock_title"))}</strong><p>${escapeHTML(t("lock_text", { d: deadlineLocal(client), a: money(balance) }))}</p></div>`;
    ["#tileHomework", "#tileNext", "#clientBookingStack"].forEach((sel) => { const el = $(sel); if (el) el.hidden = locked; });
    const dn = $("#clientDeadlineNote");
    dn.hidden = locked || !(Number(client.payDeadlineMs) > 0) || balance <= 0;
    if (!dn.hidden) dn.innerHTML = `<i class="fas fa-hourglass-half"></i> ${escapeHTML(t("deadline_note", { d: deadlineLocal(client) }))}`;
    $("#displayPayment").textContent = money(balance);
    $("#displayPayment").classList.toggle("is-zero", balance <= 0);
    renderClientPayArea(balance);

    $("#clientHistoryCard").hidden = !payments.length;
    renderPayHistory($("#clientPayHistory"), payments, LANG);
}

async function renderClientPayArea(balance) {
    const area = $("#payArea");
    const pendingSum = round2(clientState.payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0));
    const open = Math.max(0, round2(balance - pendingSum));
    if (balance <= 0) { area.innerHTML = `<p class="pay-ok">${escapeHTML(t("pay_none"))}</p>`; return; }
    if (open <= 0) { area.innerHTML = `<p class="pay-note">${escapeHTML(t("pay_in_review"))}</p>`; return; }
    area.innerHTML = `
        <label class="field-label" for="payNow">${escapeHTML(t("pay_amount_label"))}</label>
        <div class="pay-now">
            <input type="number" id="payNow" class="input" min="1" step="0.01" max="${open}" value="${open}" inputmode="decimal">
        </div>
        <p class="hint" style="margin:4px 0 10px">${escapeHTML(t("pay_amount_hint", { max: money(open) }))}</p>
        <div id="paypalButtons"></div>
        <a id="paypalMe" class="btn btn--paypal btn--sm btn--block" target="_blank" rel="noopener noreferrer"><i class="fab fa-paypal"></i> ${escapeHTML(t("pay_paypal"))}</a>
        <p class="hint pay-note"></p>`;
    const input = $("#payNow"), me = $("#paypalMe"), note = $(".pay-note", area);
    const amountOK = () => {
        const v = round2(parseAmount(input.value));
        return v > 0 && v <= open ? v : null;
    };
    const syncMe = () => { const v = amountOK() || open; me.href = `${PAYPAL_ME}/${v.toFixed(2)}EUR`; };
    // Nur Beträge zwischen 1 € und dem offenen Betrag zulassen
    const clamp = () => {
        const v = round2(parseAmount(input.value));
        if (!(v > 0)) input.value = open;
        else if (v > open) { input.value = open; toast(t("pay_invalid", { max: money(open) }), "warn", 3500); }
        syncMe();
    };
    input.addEventListener("input", () => { if (round2(parseAmount(input.value)) > open) clamp(); else syncMe(); });
    input.addEventListener("blur", clamp);
    syncMe();

    const pp = await loadPayPalSDK();
    if (!pp || !$("#paypalButtons")) { note.textContent = t("pay_manual_note"); return; }

    me.hidden = true;
    note.textContent = t("pay_auto_note");
    const code = clientState.code;
    pp.Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "pay", height: 40 },
        onClick: (data, actions) => {
            if (!amountOK()) { toast(t("pay_invalid", { max: money(open) }), "warn"); return actions.reject(); }
            return actions.resolve();
        },
        createOrder: (data, actions) => actions.order.create({
            purchase_units: [{ amount: { currency_code: "EUR", value: amountOK().toFixed(2) }, description: `Derya Kılıç – ${code}`, custom_id: code }]
        }),
        onApprove: async (data, actions) => {
            try {
                const details = await actions.order.capture();
                const cap = details?.purchase_units?.[0]?.payments?.captures?.[0];
                if (!cap || cap.status !== "COMPLETED") throw new Error("not completed");
                const paid = round2(parseFloat(cap.amount.value));
                // Klient darf den Saldo nicht selbst ändern -> Zahlung wird zur Prüfung gemeldet
                await fs.addDoc(fs.collection(db, "clients", code, "payments"), {
                    type: "payment", amount: paid, method: "PayPal", source: "paypal", status: "pending",
                    paypalOrderId: details.id, createdAt: new Date().toISOString()
                });
                notifyMother("💳 PayPal ödemesi (onay bekliyor)", { "Kod": code, "Danışan": clientState.client.name, "Tutar": money(paid, "tr"), "PayPal": details.id });
                toast(t("pay_success_pending", { a: money(paid) }), "success", 7000);
                clientState.payments = await getPayments(code);
                renderClientDashboard();
            } catch (e) {
                console.error("PayPal:", e);
                toast(t("pay_error"), "error");
            }
        },
        onCancel: () => toast(t("pay_cancelled"), "info"),
        onError: (e) => { console.error(e); toast(t("pay_error"), "error"); }
    }).render("#paypalButtons");
}

async function handleClientBooking(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const code = clientState.code;
    const inst = localInstant($("#selectedDate").value, $("#selectedTime").value);
    const de = toBerlin(inst);
    const data = {
        name: $("#clientName").value.trim().slice(0, 100), email: $("#clientEmail").value.trim().slice(0, 120), phone: $("#clientPhone").value.trim().slice(0, 40),
        date: de.date, time: de.time, service: $("#serviceType").value
    };
    if (isPastInstant(inst)) { toast(t("book_future"), "warn"); return; }
    if (isWeekendInstant(inst)) { toast(t("slot_weekend"), "warn"); return; }
    if (isPortalLocked(clientState.client)) { toast(t("lock_book"), "error"); return; }
    clientState.busy = (await loadCalendarData("client", code)).busy;
    const conflict = checkSlot(clientState.busy, inst);
    if (conflict) { toast(t(conflict.key), "warn"); return; }
    try {
        await fs.addDoc(fs.collection(db, "clients", code, "appointments"), { clientCode: code, ...data, tz: USER_TZ, startUTC: inst.toISOString(), lang: LANG, status: "pending", createdAt: new Date().toISOString() });
        form.reset();
        $("#clientName").value = data.name;
        $("#clientSlotStatus").textContent = "";
        loadClientDashboard(code);
        notifyMother("🆕 Yeni randevu talebi (Portal)", {
            "Danışan": data.name, "Kod": code, "Telefon": data.phone, "E-Posta": data.email,
            "Tarih": formatDateForUser(data.date), "Saat (Almanya)": data.time,
            ...(differsFromBerlin(inst) ? { "Danışanın saati": `${toLocal(inst).time} (${tzCity(USER_TZ)})` } : {}),
            "Hizmet": data.service, "Site dili": LANG.toUpperCase()
        });
        const msg = `Yeni Randevu Talebi (Portal)\n\nİsim: ${data.name}\nKod: ${code}\nTelefon: ${data.phone}\nTarih: ${formatDateForUser(data.date)}\nSaat (Almanya): ${data.time}\nHizmet: ${data.service}\nSite dili: ${LANG.toUpperCase()}\n\nYönetim paneli: ${PORTAL_LINK}`;
        await dialog({
            title: t("req_received_title"), text: t("req_received_text"),
            okText: "", cancelText: t("close"),
            link: { href: waLink(MOTHER_WHATSAPP_NUMBER, msg), text: t("wa_notify") }
        });
    } catch (err) {
        console.error("handleClientBooking:", err);
        toast(t("generic_error"), "error");
    }
}

/* ---------------------------------------------------------
   START
   --------------------------------------------------------- */
function start() {
    window.__siteReady = true;
    document.documentElement.classList.remove("no-js");
    initLangSwitch();
    initHeader();
    initReveal();
    initChat();
    initPriceCalc();
    initFAQ();
    initReviews();
    applyLang(LANG, { save: false });
    initCookies();
    initCopyButtons();
    initTzNotes();
    initPublicBooking();
    initPortal();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
