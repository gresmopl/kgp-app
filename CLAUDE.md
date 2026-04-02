# CLAUDE.md - Instrukcje dla Claude Code

## O projekcie
Korona Gór Polski (KGP) - progresywna aplikacja webowa (PWA) pomagająca zdobywcom 28 najwyższych szczytów polskich pasm górskich. Aplikacja działa offline-first, synchronizuje dane przez Supabase, używa Mapy.com do nawigacji i routingu.

## Stos technologiczny
- **Frontend**: vanilla HTML/CSS/JS (bez frameworków, bez bundlera)
- **Mapy**: Leaflet 1.9.4 + kafelki Mapy.com (outdoor)
- **Routing/geocoding**: Mapy.com REST API (foot_hiking, car_fast)
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI**: Gemini Flash API (planowane)
- **Pogoda**: Open-Meteo API
- **Hosting**: GitHub Pages (branch main)

## Struktura plików
```
index.html          - HTML + nawigacja (SPA shell)
css/style.css       - wszystkie style (dark/light mode)
js/data.js          - PEAKS[28], klucze API, stałe
js/state.js         - state, save(), localStorage
js/utils.js         - esc(), dist(), GPS, toast, confetti
js/sync.js          - Supabase sync, login, upload zdjęć
js/weather.js       - prognoza pogody
js/map.js           - Leaflet mapa, routing Mapy.com
js/ui.js            - renderList, renderPlan, renderSummit, modal
js/journal.js       - renderJournal, export/import backup
js/settings.js      - renderSettings
js/router.js        - goto(), init, popstate
schema.sql          - schemat bazy Supabase
IDEAS.md            - pomysły i plan rozwoju (48+ funkcji)
```

## Konwencje kodu
- Vanilla JS, bez TypeScript, bez modułów ES6 (skrypty ładowane przez `<script src>`)
- Kolejność ładowania JS ma znaczenie (zależności): data → state → utils → sync → weather → map → ui → journal → settings → router
- Funkcje renderujące strony zwracają string HTML (np. `renderMap()`, `renderList()`)
- Nawigacja SPA przez `goto('page')` — router w `router.js`
- Stan w obiekcie `state`, zapis do localStorage przez `save()`
- Sync do Supabase automatycznie po `save()` (chyba że `_skipSync = true`)
- Style inline w HTML renderowanym przez JS (nie dodawaj klas CSS dla jednorazowych stylów)
- Emoji jako ikony (nie używaj bibliotek ikon)
- Polski język w UI, komentarze w kodzie mogą być po polsku lub angielsku

## Klucze API (publiczne, domain-restricted)
- Klucze API są w `js/data.js` — to normalne dla frontendu (publishable keys)
- Supabase anon key + Mapy.com key + Gemini key — wszystkie publiczne z natury
- Zabezpieczenie: domain restriction na Mapy.com, RLS na Supabase

## Baza danych (Supabase)
- `profiles` — użytkownicy z sync_code (np. "turbacz4821")
- `user_data` — dane użytkownika jako JSONB (szczyty, dziennik, ustawienia)
- `photos` — metadane zdjęć (pliki w Supabase Storage bucket "photos")
- RLS włączone, polityki permisywne (na razie)

## Sync code system
- Format: nazwa_góry + 4 cyfry (np. "sniezka0042")
- 28 nazw × 10000 = 280,000 kombinacji
- Generowany automatycznie, użytkownik może zalogować się kodem na innym urządzeniu

## Git workflow
- `main` — produkcja (GitHub Pages, gresmopl/kgp-app)
- `dev` — branch roboczy
- Nie commituj automatycznie — czekaj na polecenie użytkownika

## Ważne wzorce
- **Deferred route rendering**: `drawRouteOnMap()` tylko ustawia `pendingRoute`, `applyRouteToMap()` aplikuje po `initMap()`
- **_skipSync flag**: zapobiega pętli pull → save → sync
- **Geocoding fallback**: pełna nazwa parkingu → uproszczona → GPS
- **Offline-first**: localStorage primary, sync queue, auto-sync on reconnect

## Czego NIE robić
- Nie dodawaj bundlera, nie konwertuj na React/Vue/Svelte
- Nie dodawaj TypeScript
- Nie twórz plików .env (klucze są publiczne z natury)
- Nie rób git push bez pytania
- Nie dodawaj komentarzy/docstringów do kodu którego nie zmieniasz
- Nie refaktoruj kodu który działa, chyba że user prosi
