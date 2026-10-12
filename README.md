# Derya Kılıç | Hipnoz & Deep EFT Danışmanlık Merkezi Kornwestheim

Derya Kılıç tarafından danışanlara özel sunulan profesyonel hipnoterapi, Deep EFT, BDT, şema terapisi ve manevi danışmanlık hizmetlerinin resmi web sitesidir.

## 🌿 Hakkımızda
Danışanlarımıza güven bağı içinde zihinsel hafiflik, içsel huzur ve yaşam dengesi sunuyoruz. Tüm seanslarımız **Türkçe** ve **Almanca (Deutsch)** dillerinde yürütülmektedir.

* **Adres:** Biberweg 53, 70806 Kornwestheim
* **Web Sitesi:** [Resmi Web Sitesi](https://beki-byte.github.io/Derya-Kilic-Hipnoz-ve-Deep-EFT-Merkezi-/index.html)

---

## 🛠 Entwickler-Notizen

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite (Hero, Über mich, Leistungen, Ablauf, Preise + Rechner, FAQ, Bewertungen) |
| `kalender.html` | Öffentliche Terminanfrage mit Kalender, Live-Verfügbarkeit und Mini-Anamnese |
| `portal.html` | Klienten-Portal und Admin-Bereich (Tabs: Anfragen, Kalender, Klienten, Kommentare) |
| `basari.html`, `odeme.html`, `asistent.html` | Erfolgsgeschichten, Zahlung, Assistent |
| `impressum.html`, `datenschutz.html` | Rechtliches |
| `style.css` | Ein gemeinsames Stylesheet (Farben als CSS-Variablen in `:root`) |
| `script.js` | Gesamte Logik; Firebase wird dynamisch geladen, die Seite funktioniert auch ohne |

* Der Admin-Code steht nur noch als SHA-256-Hash in `script.js` (`MASTER_CODE_HASH`).
  Neuen Code setzen: Hash z. B. mit `printf 'NEUERCODE' | sha256sum` erzeugen und eintragen.
* Analytics lädt nur nach „Tümünü kabul et“ im Cookie-Hinweis. Google Übersetzer lädt erst beim Klick auf das Sprach-Symbol.
* **Wichtig:** Die echte Absicherung der Daten muss über Firestore-Sicherheitsregeln + Firebase Authentication passieren – Code im Browser ist immer öffentlich.

*Geliştiren: Betül Erva Kılıç*
