# Konzept: „Von der Oberfläche in die Tiefe“

Derya Kılıç arbeitet mit dem Unterbewusstsein. Die Seite erzählt das räumlich:
oben ist es hell wie das Bewusstsein, beim Scrollen geht es Schicht für Schicht
„unter die Erde“ – die Startseite wird von Abschnitt zu Abschnitt dunkler, bis man
bei Bewertungen, Fragen und dem Termin im warmen Erdton ankommt.
Den Einstieg macht das Baum-Video (Samen → Baum → Wurzeln).

## Stimmung
ruhig · warm · tief · vertrauensvoll · erwachsen

## Farben
| Rolle | Farbe |
|---|---|
| Papier (hell, dominant oben) | `#F2ECE3` |
| Erde (dunkel, dominant unten) | `#1E1612` |
| Ton (Akzent, aus dem Logo-Braun) | `#9C6B4E` |
| Bernstein (Lichtpunkte, Sterne, Fokus) | `#C9975B` |
| Moos (kleine Details) | `#6F7A57` |

## Schrift
- **Fraunces** (variabel, mit Kursiv) für Überschriften – riesig, leicht, warm
- **Manrope** (variabel) für Text – ruhig und gut lesbar
Beide lokal in `fonts/`, inkl. türkischer Sonderzeichen.

## Bewegung
Ein Tempo für alles: `power3.out`, 0,9–1,2 s. Überschriften steigen Wort für Wort
aus einer Maske, das Zitat färbt sich beim Lesen Wort für Wort ein, die
Leistungen laufen am Computer als gepinnte horizontale Scroll-Geschichte.
Weiches Scrollen (Lenis), eigener Mauszeiger, magnetische Buttons,
sanfte Seitenübergänge.

## Szenen der Startseite
| Abschnitt | Szene | Antrieb | Budget | Fallback |
|---|---|---|---|---|
| Intro (nur TR) | Baum-Video als Einzelbilder | Scroll | ~10 MB, schrittweise geladen | ausgeblendet bei „Bewegung reduzieren“ |
| Punkte-Reise (ganze Seite) | eine Punktwolke (WebGL, `flow.js`) begleitet beim Scrollen und formt je Abschnitt: Baum → Herz → TR·DE → Spirale → 1 2 3 → € → ? → leuchtender Baum (Termin) → Stern; dazwischen „regnet“ sie nach unten. Hintergrund wandert von Papier zu Erde | Scroll + Maus/Finger | 1 fester Canvas, 3,8–8 Tsd. Punkte | ohne WebGL: normale Abschnitte mit eigenen Farben |
| Über mich | Zitat wird live getippt (blinkender Cursor), Porträt öffnet sich wie ein Vorhang | Scroll startet, dann Zeit | Text-Spans | sofort vollständig |
| Muttersprache | riesiges „Türkçe & Deutsch“-Laufband | Scroll | transform | ausgeblendet |
| Leistungen | Karten werden festgehalten und fahren seitlich durch (alle Geräte) | Scroll (gepinnt) | transform | normales Raster |
| Ablauf | Schritte leuchten nacheinander auf, Linie füllt sich (gepinnt, wenn Platz) | Scroll | transform/opacity | alle sichtbar |
| Preise | Beträge zählen hoch | Scroll | Text | feste Zahl |
| Bewertungen | echte Bewertungen als zwei gegenläufige Endlosbänder | Zeit (Pause bei Hover) | CSS-Animation | Raster wie bisher |
| Termin | warmes Bernstein-Licht folgt Maus/Finger | Maus/Finger | CSS | statisch |

## Geräte-Stufen (motion.js)
- **high** (irgendeine Maus/Trackpad vorhanden – auch Tablet mit Maus): alles inkl. weichem Scrollen, eigenem Mauszeiger, Magnet-Buttons
- **mid** (nur Touch): alle Szenen und Pinning, aber natives Scrollen und kein Mauszeiger
- **low** („Bewegung reduzieren“): keine Animationen, alles sofort sichtbar

Buchung, Portal, Zahlung und Assistent nutzen dasselbe Design, aber ohne
weiches Scrollen (damit Kalender, Dialoge und Chat sich normal bedienen lassen).
