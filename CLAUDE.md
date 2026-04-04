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
about.html          - strona informacyjna "O aplikacji"
panel.html          - panel administracyjny (PIN: 2137)
css/style.css       - wszystkie style (dark/light mode)
js/data.js          - PEAKS[28], klucze API, stałe
js/state.js         - state, save(), localStorage
js/utils.js         - esc(), dist(), GPS, toast, confetti, context detection
js/sync.js          - Supabase sync, login, upload zdjęć
js/ai.js            - Gemini AI wrapper, autoryzacja, tracking zużycia
js/weather.js       - prognoza pogody
js/map.js           - Leaflet mapa, routing Mapy.com
js/ui.js            - renderList, renderSummit, modal (renderPlan zachowany jako referencja)
js/planner.js       - planer wypraw: lista, edytor, map picker, GPS checkpoint
js/journal.js       - renderJournal, export/import backup
js/settings.js      - renderSettings
js/features.js      - SOS, streak, osiągnięcia, timeline, lightbox, dashboard, kalorie
js/features2.js     - wydruk, pakowanie, ciekawostki, parking, pogoda, restauracje, grupy, ostrzeżenia
js/router.js        - goto(), init, popstate, offline indicator, context badge
schema.sql          - schemat bazy Supabase
IDEAS.md            - pomysły i plan rozwoju (aktualizuj przy kazdej zmianie!)
DOCS.md             - dokumentacja projektowa analityczna (architektura, przeplywy, decyzje)
```

## Konwencje kodu
- Vanilla JS, bez TypeScript, bez modułów ES6 (skrypty ładowane przez `<script src>`)
- Kolejność ładowania JS ma znaczenie (zależności): data → state → utils → sync → ai → weather → map → ui → journal → settings → features → features2 → planner → router
- Funkcje renderujące strony zwracają string HTML (np. `renderMap()`, `renderList()`)
- Nawigacja SPA przez `goto('page')` — router w `router.js`
- Stan w obiekcie `state`, zapis do localStorage przez `save()`
- Sync do Supabase automatycznie po `save()` (chyba że `_skipSync = true`)
- Style inline w HTML renderowanym przez JS (nie dodawaj klas CSS dla jednorazowych stylów)
- Emoji jako ikony (nie używaj bibliotek ikon)
- Polski język w UI, komentarze w kodzie mogą być po polsku lub angielsku
- W tekstach UI używaj krótkiego myślnika `-`, NIE długiego `—`
- Zawsze polskie znaki diakrytyczne w UI (ą, ę, ć, ś, ź, ż, ó, ł, ń) — nigdy ASCII zamienniki
- Przy każdej zmianie aktualizuj README.md jeśli dodano nową funkcję lub plik
- Przy każdej zmianie aktualizuj IDEAS.md — oznacz zrobione [x], dodaj nowe pomysły, aktualizuj datę na dole
- Przy większych zmianach aktualizuj DOCS.md — nowe przepływy, decyzje, ograniczenia

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
- **Context detection**: 4 tryby (home/driving/trail/summit) wykrywane co 15s przez GPS + prędkość, z debounce 3 odczytów

## Znane pułapki (lessons learned)
- **Krytyczne ID DOM**: `#weather-content`, `#sun-content`, `#warnings-content`, `#timeline-section` — async operacje z router.js szukają tych ID po wyrenderowaniu strony. Zmiana = cicha awaria
- **Inline onclick + cudzysłowy**: nazwy parkingów w onclick handlerach wymagają `.replace(/'/g, backtick)`. Nazwy z cudzysłowami mogą zepsuć handlery
- **Mapy.com tile lang**: parametr `lang=pl` wymagany w URL kafelków, inaczej nazwy krajów po czesku (Polsko zamiast Polska)
- **GPS skacze w lesie**: dlatego context detection ma debounce 3 odczytów (~45s). Nie ufaj pojedynczemu odczytowi
- **Bateria**: GPS watchPosition z `enableHighAccuracy:true` + context detection co 15s. Na dłuższą metę rozważ rzadsze odczyty gdy kontekst = home
- **localStorage limit**: ~5MB. Zdjęcia w base64 potrafią to zapchać. Zdjęcia trzymaj w Supabase Storage, w localStorage tylko metadane
- **Overpass API rate limiting**: 429/504 przy wielu zapytaniach. Nie odpytuj masowo, rób cache
- **state.departTime i state.transport NIE SĄ persystowane** do localStorage — żyją tylko w sesji. Jeśli planer je potrzebuje trwale, dodaj do save()
- **state._homeGeo JEST persystowane** w localStorage (kgp_home_geo) — koordynaty zgeokodowanego adresu domowego. Ustawiany przez validateHomeAddr(), detectHomeAddr() i geokodowanie w tle. Czyszczony przy zmianie adresu
- **toggleSection()** jest w utils.js (nie settings.js) — używane globalnie w ustawieniach, dzienniku i planerze

## Docelowa grupa użytkowników
- Turyści górscy, często z ograniczonym zasięgiem w terenie
- Planują wyprawy z domu (desktop/mobile), realizują w terenie (mobile)
- Różny poziom doświadczenia — od początkujących po weteranów KGP
- Mogą jechać 500km na szczyt (np. Szczecin → Tarnica) — planer musi to uwzględniać
- Często chodzą w grupach — potrzebują dzielenia się planami
- Kluczowe: aplikacja ma pomagać, nie przeszkadzać. W terenie liczy się prostota i szybkość dostępu do informacji

## Testowanie
- Serwer lokalny: `python -m http.server 8080` lub `npx serve .`
- Testuj na mobile (Chrome DevTools device mode) — to główna platforma
- Sprawdzaj dark mode i light mode — obie muszą działać
- Testuj offline: DevTools → Network → Offline
- Panel admina: `panel.html`, PIN: 2137, easter egg: 5x tap na wersję w ustawieniach

## Filozofia tworzenia aplikacji
- **Użyteczność ponad szybkość** — nie chodzi o szybkie napisanie kodu, tylko o to żeby aplikacja była przydatna w praktyce
- **Intuicyjność** — użytkownik nie powinien się zastanawiać jak coś działa. Jeśli trzeba tłumaczyć = źle zaprojektowane
- **Odzwierciedlenie rzeczywistości** — planer/funkcje mają odpowiadać temu co użytkownik faktycznie robi w terenie. Plan wyprawy = to co będziesz robił krok po kroku, nie abstrakcyjny formularz
- **Prostota > kompletność** — lepiej 5 działających funkcji niż 15 niedokończonych. Każda funkcja musi mieć sens dla kogoś kto idzie w góry

## Zasady przy dużych zmianach
- **Widok z lotu ptaka** — przed kodowaniem przejrzyj cały powiązany kod, zrozum zależności, narysuj sobie mentalną mapę. Nie zaczynaj od pisania, zacznij od czytania
- **Sprawdzaj poprawność wielokrotnie** — po napisaniu kodu przejrzyj go 2-3 razy zanim uznasz za gotowy. Sprawdzaj: czy zachowałem istniejące ID DOM? Czy inline handlery nadal działają? Czy async operacje trafią we właściwe elementy?
- **Najlepsze praktyki** — stosuj sprawdzone wzorce. Nie wymyślaj koła na nowo. Sprawdź jak inni rozwiązali dany problem (inne aplikacje, artykuły, dokumentacja)
- **Zastanów się dwa razy** — przy każdej decyzji projektowej zadaj sobie pytanie: "Czy to pomoże użytkownikowi w terenie, czy to tylko wygląda fajnie w kodzie?"
- **Izoluj nowy kod** — duże funkcje w osobnym pliku (np. planner.js), nie w istniejącym rozrośniętym pliku. Łatwiej testować, łatwiej wycofać
- **Refaktoruj przy okazji** — przy większych zmianach w features.js lub features2.js proponuj wydzielenie zmienianego kodu do nowego pliku o logicznej nazwie (np. przerabiasz SOS → wydziel do sos.js). Nie rób całego refaktoru na raz, plik po pliku. Plan podziału w STORIES.md (REFAKTOR-1)
- **Nie psuj tego co działa** — nowy kod powinien działać równolegle ze starym aż do momentu świadomego przełączenia
- **Szukaj inspiracji w internecie** — przed implementacją nowej funkcji sprawdź jak robią to najlepsze aplikacje w branży (Komoot, Furkot, AllTrails). Nie kopiuj ślepo, ale ucz się z ich doświadczeń
- **Testuj scenariusze rzeczywiste** — czy plan na weekend w Bieszczadach ma sens? Czy ktoś jadący 500km z Szczecina dostanie sensowne sugestie? Myśl jak użytkownik, nie jak programista

## Czego NIE robić
- Nie dodawaj bundlera, nie konwertuj na React/Vue/Svelte
- Nie dodawaj TypeScript
- Nie twórz plików .env (klucze są publiczne z natury)
- Nie rób git push bez pytania
- Nie dodawaj komentarzy/docstringów do kodu którego nie zmieniasz
- Nie refaktoruj kodu który działa, chyba że user prosi
- Nie twórz abstrakcji na zapas — trzy podobne linie kodu lepsze niż przedwczesna abstrakcja
- Nie usuwaj kodu o nieznanym przeznaczeniu — najpierw zrozum dlaczego tam jest
- Nie ignoruj edge case'ów z życia (brak GPS, brak internetu, bardzo długie nazwy, polskie znaki)
- Nie zakładaj idealnych warunków — użytkownik może mieć słaby telefon, zimne palce, deszcz na ekranie
