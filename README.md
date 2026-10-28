# Derya Kılıç | Hipnoz & Deep EFT Danışmanlık Merkezi Kornwestheim

Derya Kılıç tarafından danışanlara özel sunulan profesyonel hipnoterapi, Deep EFT, BDT, şema terapisi ve manevi danışmanlık hizmetlerinin resmi web sitesidir.

## 🌿 Hakkımızda
Danışanlarımıza güven bağı içinde zihinsel hafiflik, içsel huzur ve yaşam dengesi sunuyoruz. Tüm seanslarımız **Türkçe** ve **Almanca (Deutsch)** dillerinde yürütülmektedir.

* **Adres:** Biberweg 53, 70806 Kornwestheim
* **Web Sitesi:** [Resmi Web Sitesi](https://deryasenkilic.de/index.html)

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

* **Admin-Anmeldung:** über Firebase Authentication (E-Mail + Passwort). Die UID von Derya Hanıms Konto steht in `script.js` (`ADMIN_UID`) **und** in `firestore.rules`.
* **Datenbank-Regeln:** stehen in `firestore.rules` – in der Firebase-Konsole unter Firestore → Regeln einfügen.
* **Datenaufbau:** `slots` (öffentlich, ohne Personendaten) · `appointments` (Gast-Anfragen, geheime ID) · `clients/{CODE}` mit `appointments` und `payments` · `adminNotes` · `privateSlots` · `comments`. Alte Daten werden bei der ersten Admin-Anmeldung automatisch umgezogen.
* **Benachrichtigung bei neuen Terminen/Absagen:** per E-Mail an `NOTIFY_EMAIL` (FormSubmit). Beim allerersten Termin kommt eine Bestätigungs-Mail von FormSubmit → einmal „Activate“ klicken. Optional Push aufs Handy: `NTFY_TOPIC` setzen und das Thema in der App „ntfy“ abonnieren.
* **Kalender-Regeln:** 2 Std. Abstand zwischen bestätigten Terminen · fremde Termine nur als „Dolu/Belegt/Booked“ ohne Daten · eigener Termin zeigt alle Daten und kann abgesagt werden · unter 24 Std. Hinweis auf Ausfallgebühr (Portal-Klienten: wird automatisch auf den offenen Betrag gebucht).
* **Sprachen:** Jede Seite gibt es fertig übersetzt: Türkisch im Hauptordner, Deutsch in `de/`, Englisch in `en/` (mit hreflang/canonical für Google). Der Umschalter TR/DE/EN wechselt zur Seite in der anderen Sprache. Texte stehen in `i18n.js`; der Admin-Bereich bleibt Türkisch. `sitemap.xml` enthält alle drei Sprachen.
* Analytics lädt nur nach „Tümünü kabul et“ im Cookie-Hinweis.
* **Schriften & Bibliotheken lokal:** Schriften (Cormorant Garamond, Nunito Sans), Icons (Font Awesome 6.5.2: `fontawesome.min.css` + `fa-*.woff2`) und Kalender (FullCalendar 5.11.3: `fullcalendar*.js/.css`) liegen direkt im Projekt – es wird nichts von Google Fonts, cdnjs oder jsDelivr geladen. Nur Firebase (Datenbank) kommt weiterhin von Google.
* **Gelmedi (nicht erschienen):** Im Admin-Kalender bei einem begonnenen Termin → immer 65 € auf den offenen Betrag (egal welche Therapie).

*Geliştiren: Betül Erva Kılıç*
