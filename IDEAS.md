# KGP App - Pomysly i plan rozwoju

## Legenda statusow
- [ ] Do zrobienia
- [x] Zrobione

---

## Zrobione

### Podstawy
- [x] Integracja Supabase (sync code, zdjecia, profil)
- [x] Integracja Mapy.com (routing pieszy/auto, kafelki outdoor, geocoding)
- [x] Ekran Ustawienia (profil, adres, tempo, transport, sync, backup)
- [x] Modul AI (ai.js) - Gemini Flash, klucz z Supabase app_config, tracking zuzycia per user, autoryzacja przez login
- [x] Bezpieczny sync - ochrona przed nadpisaniem bogatszych danych pustymi (dataWeight), brak auto-tworzenia profilu na nowym urzadzeniu
- [x] Sync zdjec miedzy urzadzeniami - photoUrl z Supabase Storage, fallback przy braku base64
- [x] Manualne przyciski sync (Wyslij/Pobierz z chmury) + naprawa brakujacych URL zdjec
- [x] Zarzadzanie parkingami - dodawanie nowych przez map picker, lista overrides w ustawieniach, sync do Supabase

### Bezpieczenstwo
- [x] ~~Tryb SOS~~ → przeniesione do ustawień jako sekcja "Numery alarmowe" (GPS, GOPR/TOPR per region, 112, rekomendacja apki Ratunek)
- [x] Czas zachodu/wschodu slonca + ostrzezenie przed zmrokiem

### Planowanie
- [x] Kamery gorskie (link do Google search)
- [x] Restauracje w poblizu parkingu (Google Maps search)
- [x] "Okno pogodowe" - najlepszy dzien na wyjscie
- [x] Kalkulator kalorii na trasie

### Motywacja i grywalizacja
- [x] System osiagniec (12 odznak)
- [x] Karta zdobycia do udostepnienia (Canvas PNG)
- [x] Panorama postepu (kolorowe szczyty)
- [x] Timeline / os czasu w dzienniku
- [x] Porownanie z innymi (benchmarki)
- [x] Streak / passa zdobywcy
- [x] "Rok temu dzis..." - wspomnienie
- [x] Wyzwanie grupowe (Supabase)
- [x] Prognoza ukonczenia KGP
- [x] ~~Dedykacja zdobycia szczytu~~ (usunięta z UI)

### UX / Design
- [x] Onboarding 3-ekranowy (powitanie → adres domowy → sync/offline)
- [x] Gorski dark theme (gradient, blur, topograficzny styl)
- [x] Micro-interactions i animacje (fadeInUp, scale, confetti)
- [x] Lightbox zdjec (fullscreen, swipe)
- [x] Dashboard z wykresami (szczyty/miesiac, dzien tygodnia)

### Na szlaku
- [x] Live tracker "Ile jeszcze?" (GPS, postep, ETA)
- [x] Nawigacja powrotna "do auta" (zapis parkingu GPS)
- [x] "Pakuj sie!" - dynamiczna lista rzeczy
- [x] Ostrzezenia szlakowe od uzytkownikow (Supabase)

### Inne
- [x] Ciekawostki o KGP (losowe fakty)
- [x] Generator wydruku A4 (9x13cm)
- [x] Wpisywanie historycznych wejsc (batch + pojedyncze)

---

## Do zrobienia

### Priorytet wysoki
- [x] **Planer wyprawy (multi-segment)** - planner.js: lista wypraw, edytor z dniami i przystankami, 11 typów stopów, auto-kalkulacja timeline, GPS checkpoint, map picker (reverse geocode), udostępnianie przez Supabase shared_trips, szybki plan z jednego szczytu, przesuwanie dat, duplikowanie.
- [ ] **Profil wysokosciowy trasy** - wykres przewyzszen (GUGiK NMT API + Canvas). Gdzie stromo, gdzie plask, gdzie odpoczac. NMT daje dokladnosc 1m - lepsza niz OpenElevation.
- [ ] **Tryb offline z mapami** - cache kafelkow w IndexedDB dla okolic kazdego szczytu. W gorach czesto brak zasiegu. (SW cache'uje zasoby statyczne od v1.5, ale nie kafelki map)
- [ ] **Wiele zdjec na szczyt** - galeria zamiast jednego zdjecia. Porownanie lato vs zima.
- [ ] **Odczyt EXIF ze zdjec** - przy dodawaniu zdjecia automatycznie odczytac metadane: DateTimeOriginal (data wykonania) i GPS (koordynaty). Zastosowania: auto-wypelnianie daty zdobycia, weryfikacja lokalizacji (porownanie GPS zdjecia z pozycja szczytu), odczyt daty z archiwalnych zdjec przy wpisywaniu historycznych wejsc. Parsowanie EXIF z ArrayBuffer (bez biblioteki, ~100-150 linii) lub mala biblioteka exif-js (~15KB). Ograniczenia: nie kazde zdjecie ma GPS (wylaczony w aparacie), zdjecia przeslane przez komunikatory (WhatsApp, Messenger) traca EXIF.
- [ ] **Zdjecia lokalnie w IndexedDB + eksport do chmury** - przeniesienie zdjec z Supabase Storage do IndexedDB na urzadzeniu (pojemnosc setki MB, nie 5MB jak localStorage). Zdjecia zostaja na telefonie - prywatnosc i szybkosc. Opcjonalny eksport/backup do Google Drive, OneDrive lub innego zdalnego nosnika (Google Drive API / OneDrive API / Web Share API). Szyfrowanie zdjec przez Web Crypto API (AES-GCM, klucz z sync code lub osobne haslo) - ochrona przed utrata/kradzieza telefonu. Mozliwosc pelnego backupu (dane + zdjecia) jako zaszyfrowana paczka.

### Priorytet sredni
- [ ] **AI Planner (Gemini)** - "weekend 18-19 kwietnia, jade z Krakowa" → AI generuje plan: ktore gory, kolejnosc, noclegi, pogoda
- [x] **AI Chatbot / Przewodnik** - przycisk 🤖 na mapie, bottom-sheet overlay, historia rozmowy (max 6 msg), kontekst uzytkownika (zdobyte, lokalizacja, transport, pora roku). Gemini Flash przez ai.js
- [x] **AI opisy szczytow** - przycisk 🤖 w popupie mapy i widoku szczyt. Modal z opisem AI (historia, ciekawostki, porady). Gemini generuje na podstawie danych szczytu
- [ ] **Ciekawostki z Wikipedii + AI** - Wikipedia API (pl.wikipedia.org) pobiera intro artykulu o szczycie, Gemini skraca do 2-3 zdan ciekawostki. Darmowe, bez limitu, pelne artykuly po polsku
- [ ] **AI-generowane obrazy gor (Pollinations.ai)** - darmowe API generujace artystyczne obrazy gor z promptu. URL: `image.pollinations.ai/prompt/{opis}?width=512&height=384&nologo=true`. Gemini generuje prompt na podstawie opisu z Wikipedii. Model nanobanana (enter.pollinations.ai) radzi sobie z polskim tekstem na obrazie. Mozliwosc nakladania tekstu (nazwa, data) przez Canvas. Rate limiting - trzeba cachowac. Do kart zdobycia, ciekawostek, tla profilowego
- [ ] **Porownaj trase z kolega** - import/export planow jako linki
- [ ] **Planowanie weekendu z noclegiem** - linki do booking.com / nocowanie.pl
- [ ] **Eksport do GPX / KML** - szlaki do nawigacji GPS
- [ ] **Wirtualny spacer po szlaku** - zdjecia z kluczowych punktow trasy

### Priorytet niski / eksperymentalne
- [ ] **AR widok na szczycie** - DeviceOrientation API + nazwy szczytow nalozone na obraz kamery
- [ ] **Widget na ekran glowny** - PWA Web App Manifest, "Najblizszy niezdobyty: Babia Gora, 127km"
- [ ] **Rozpoznawanie szczytow ze zdjecia** - Gemini Vision
- [ ] **Glosowy asystent szlakowy** - co 15 min mowi postep przez glosnik
- [ ] **"Heartbeat" puls wyprawy** - wibracja co 100m przewyzszenia
- [ ] **Powiadomienia push** - "W sobote idealna pogoda na Sniezke!"
- [ ] **Integracja z zegarkami** - Garmin, Apple Watch
- [ ] **Szlakowy geocaching** - wirtualne punkty na szlaku
- [ ] **"Wiadomosc w butelce"** - anonimowa wiadomosc na szczycie dla nastepnego zdobywcy
- [ ] **Live na szczycie** - inni widza kto jest na ktorym szczycie w real-time

### UX/UI trendy 2026
- [x] **Adaptive UI (etap 1)** - detekcja kontekstu (home/driving/trail/summit) z badge w nawigacji. Debounce 3 odczytow. Context switcher do testowania (klik w badge). Etap 2-3: zmiana layoutu per kontekst.
- [x] **Dark/light mode** - ręczny przełącznik w ustawieniach (Jasny/Ciemny/Systemowy), CSS class-based
- [x] **Reverse geocoding** - Mapy.com rgeocode API, przycisk GPS w ustawieniach adresu, walidacja z koordynatami
- [x] **Accessibility (WCAG 2.1 AA) - etap 1** - focus-visible indicators, kontrast text2/accent poprawiony (4.5:1+), touch targets 44px (chips, btn-sm, pl-btn-move), min fonty 10-11px, filter chips span→button, aria-label na ~30 inputach, role="dialog" aria-modal na 8 modalach, aria-hidden/aria-label na nav, inline error (sync code), input focus ring. Pozostaje: 58× div onclick→button (niskopriorytetowe)
- [ ] **Onboarding jako quest** - zamiast intro screena, pierwszy szczyt jako "misja treningowa": wybierz szczyt → sprawdź pogodę → zaplanuj → zdobądź → zrób zdjęcie. Grywalizacja od pierwszej minuty.

### Landing page
- [x] **Responsywna strona "O aplikacji"** - osobna strona prezentująca KGP App: czym jest, jakie ma funkcje, screenshoty, CTA do instalacji PWA. Styl inspirowany skillsandup.pl: czysty, nowoczesny layout, hero section z hasłem, karty funkcji w siatce, dużo białej przestrzeni, sans-serif fonty, przyciski CTA. Sekcje: hero → funkcje (karty z emoji/ikonami) → screenshoty → jak zacząć → footer.

### Tymczasowo wyłączone (do przywrócenia)
- [ ] **Śledzenie trasy (Live tracker)** - GPS tracker z postępem na szlaku, dystansem i ETA. Usunięty z zakładki Szczyt - kod w features2.js, do przywrócenia po redesignie.
- [ ] **Dedykacja zdobycia szczytu** - pole "Ten szczyt dedykuję..." w formularzu szczytu. Usunięte z UI, dane w journal obsługują pole dedication.

### Infrastruktura
- [x] **Panel administracyjny** - panel.html z PIN, dashboard, uzytkownicy, galeria, system, dane surowe
- [x] **System migracji danych** - wersjonowany schemat state z automatycznymi migracjami
- [x] **Dokumentacja projektowa** - DOCS.md z architektura, przepływami, decyzjami
- [x] **Changelog** - CHANGELOG.md z historia wersji
- [x] **Supabase app_config** - bezpieczne przechowywanie kluczy API (Gemini) w bazie, SELECT-only RLS
- [x] **Supabase ai_usage** - tracking zuzycia tokenow AI per user per miesiac (input/output/requests/model)
- [ ] **Zliczanie kredytow Mapy.cz API** - wewnetrzny licznik requestow per endpoint (tiles=1, geocoding=4, routing=4, suggest=4). Pokazywanie zuzycia w panelu admina. Limit 250k darmowych/mc. Alerty przy zbliżaniu do limitu.
- [ ] **Polityka prywatnosci** - prosta strona z informacja o zbieranych danych
- [ ] **Informacja o sync** - komunikat przy pierwszym uzyciu synchronizacji

### Testowanie i jakosc
- [ ] **Testy E2E (Playwright)** - automatyczne testy regresji w przegladarce. Playwright steruje Chrome/Firefox/Safari programowo - klika, wpisuje, sprawdza elementy. Idealne dla vanilla JS (testuje gotowa strone przez HTTP, zero konfiguracji bundlera). Scenariusze: nawigacja SPA, lista szczytow, oznaczanie zdobytych, planer, zapis/odczyt localStorage, dark/light mode. Odpala sie jednym `npx playwright test` i widac co przeszlo a co padlo. Laczy regresje - zmiana w ui.js od razu pokaze czy lista/mapa/planer nadal dzialaja.
- [ ] **QA-CHECKLIST.md** - manualna checklista krytycznych sciezek do sprawdzenia przed kazdym merge do main. Szybkie, bez konfiguracji, natychmiastowa wartosc.
- [x] **STORIES.md** - user stories z kryteriami akceptacji. 22 stories w 10 kategoriach + architektura blokow planera.
- [x] **QA-FEEDBACK.md** - centralny dokument z uwagami z testowania (bugi, UX, story tell planera)
- [x] **Smoke testy (test.html)** - 43 przegladarkowe testy: dist(), addMinutes(), fmtTime(), esc(), statCard(), getPeak(), diffDots(), adjTime(), PEAKS integrity, stale. Laduje data.js+state.js+utils.js, zero zewnetrznych zaleznosci
- [ ] **Mockowanie offline/GPS w testach** - symulacja braku sieci i lokalizacji GPS w Playwright (bardziej zaawansowane, na pozniej)

### Bugfixy
- [ ] **Grupowanie parkingow** - jeden parking → wiele szczytow (np. Gorce)
- [x] **Drukowanie zdjec blokowane jako popup** - window.open zamienione na iframe z przyciskami Drukuj/Zamknij
- [x] **Bottom nav niewidoczny na tablecie Samsung** - flex-shrink:0 na nav, min-height:0 na screen, overflow:hidden na app
- [x] **Sync nadpisywal dane pustymi** - dataWeight() porownuje bogactwo danych, puste nie nadpisza bogatszych

---

### Plan migracji infrastruktury (2026-04-22)

**Problem:** Obecna architektura (Supabase + Mapy.com) generuje koszty które rosną z liczbą użytkowników:
- Supabase: zdjęcia w chmurze, sync — storage i bandwidth kosztują
- Mapy.com: każdy kafelek mapy = 1 kredyt, routing = 4 kredyty (limit 250k free/mc)
- Konkurenci (Verdant, Korona Gór) zapisują lokalnie = zero kosztów serwera

**Decyzja:** Migracja na własny VPS + SQLite + open-source mapy.

**Etap 1: Backend (SQLite + VPS)**
- Zastąpić Supabase własnym API (Express/Fastify + SQLite)
- Endpointy: sync (push/pull user_data), upload zdjęć, auth (sync code)
- Storage zdjęć: katalog na VPS (+ osobny storage ~$5/mc jeśli potrzeba)
- Backup: SQLite → cron dump + kopia na zewnętrzny dysk
- Nakład: ~1-2 tygodnie na backend
- Korzyść: pełna kontrola, brak limitów, stały koszt niezależny od użytkowników

**Etap 2: Mapy (open-source tiles)**
- Kafelki: OpenTopoMap (darmowe, topograficzne) LUB self-hosted OSM tiles na VPS
- Szlaki PTTK: Waymarked Trails overlay (tile.waymarkedtrails.org/hiking/) — darmowy
- Geocoding: Nominatim (self-hosted lub publiczny, darmowy)
- Kompromis: routing ZOSTAWIĆ na Mapy.com — mało requestów (4 kredyty/req), mieści się w free tier
- Pułapka: Mapy.com mają najlepsze dane turystyczne PL (szlaki, schroniska, nazwy po polsku). OpenTopoMap + Waymarked Trails to przybliżenie, nie 1:1 zamiennik
- Alternatywnie: self-host tile server z danymi OSM + OpenMapTiles (cięższe, ale pełna kontrola)

**Etap 3: Optymalizacje**
- Cache kafelków w SW/IndexedDB (już częściowo: SW cache'uje statyczne zasoby)
- Kompresja zdjęć przed uploadem (zmniejszy storage)
- Lazy loading — nie ładuj wszystkiego na start

**Co zachować z Supabase (na razie):**
- Wyzwania grupowe (shared state) — do przeniesienia w etapie 1
- AI usage tracking — do przeniesienia
- App config (klucze API) — przenieść do env na VPS

**Kolejność:** Etap 2 (mapy) można zrobić niezależnie od etapu 1 (backend). Mapy to szybka zmiana (podmiana URL tile), backend to większy projekt.

---

### Porownanie API map (research)
- **Mapy.cz** - 250k darmowych kredytow/mc, 1.6 CZK/1000 kredytow. Najlepsze mapy turystyczne PL (szlaki PTTK, schroniska). Koszty: tiles=1, geocoding/routing/suggest=4 kredyty
- **Mapbox** - 50k loads/mc free, $0.75-5.00/1000 req. 10-75x drozszy niz Mapy.cz. Lepsze globalne pokrycie ale niepotrzebne dla KGP
- **mapa-turystyczna.pl** - brak API
- **UMP** - darmowy tile server (tiles.ump.waw.pl), bez routingu/geocodingu
- **Waymarked Trails** - darmowy overlay szlakow (tile.waymarkedtrails.org/hiking/)
- Wniosek: Mapy.cz optymalny wybor - jeden provider, wszystko w jednym, tani, dobre dane turystyczne

### GUGiK / Geoportal API (research)
- **Darmowe, bez klucza API, do uzytkow komercyjnych i niekomercyjnych** (wymog: podanie zrodla GUGiK)
- Brak udokumentowanych rate limitow (przy normalnym uzyciu nie powinno byc problemow)
- **NMT API** (`services.gugik.gov.pl/nmt/`) - Numeryczny Model Terenu:
  - `GetHByXY` - wysokosc pojedynczego punktu (dokladnosc 1m x 1m grid)
  - `GetHByPointList` - wysokosci listy punktow (idealny do profilu trasy)
  - `GetMinMaxByPolygon` - min/max wysokosc w obszarze
  - Uwaga: wspolrzedne w ukladzie PUWG92, wymaga konwersji z WGS84 (lat/lon)
- **CAPAP Search API** (`capap.gugik.gov.pl/api/fts/`) - geokodowanie i wyszukiwanie:
  - `/gc/prngof` - wyszukiwanie obiektow fizjograficznych (gory, szczyty, rzeki, jeziora)
  - `/gc/pkt` - geokodowanie adresow (alternatywa dla Mapy.com)
  - `/rgc/adr` - reverse geokodowanie (co jest w danym punkcie GPS)
  - `/rgc/prngof` - reverse geocoding obiektow fizjograficznych
  - Odpowiedzi w JSON z GeoJSON geometry
- **Potencjalne zastosowania w KGP**:
  - Profil wysokosciowy trasy (NMT GetHByPointList + routing z Mapy.com)
  - Dokładna wysokosc szczytu z NMT
  - "Jestes w poblizu: Rysy (2499 m)" - reverse geocoding PRNG w terenie
  - Fallback geokodowania parkingów
- Dokumentacja: https://www.geoportal.gov.pl/wp-media/2023/10/Dokumentacja-uslugi-API-wersja-1.06.pdf

### Analiza konkurencji i kierunek rozwoju (research, 2026-04-22)

**Konkurenci (Polska):**

| Aplikacja | Ocena | Pobrania | Siła | Słabość |
|---|---|---|---|---|
| Szlaki (W3media) | 4.7 | 100k+ | Kompleksowa mapa+szlaki+30 koron | Premium za offline mapy |
| Polskie Góry (Celiński) | 4.3 | 100k+ | AR rozpoznawanie szczytów | Archaiczny UI, kolekcja tylko premium |
| Korony Gór (Mosiejko) | 4.1 | 10k+ | 200+ gór PL/SK/CZ, web sync | Stary interfejs, brak iOS |
| Korona Polskich Gór (Verdant) | 4.8 | 10k+ | Prosta, lekka (2.5MB) | Crashe, brak synca, brak zdjęć |
| Korona Gór iOS (Zadorożny) | ~2.8 | mało | Jedyna na iOS | Minimalna, same poprawki GPS |

**Konkurenci (świat - peak bagging):**

| Aplikacja | Model | Wyróżnik |
|---|---|---|
| Peakbagger.com | Darmowy (donations) | 750+ list, 20+ lat, brzydki ale działa |
| Hory.app (CZ) | Freemium | Punkty=wysokość, 340k szczytów, wyzwania |
| Peakhunter (CH) | Freemium | GPS-only weryfikacja, globalny |
| Summit Bag | Darmowy (web) | Auto-detekcja szczytów ze Strava |
| Peaky Baggers (UK) | Darmowy? | XP, leaderboardy, Munros/Wainwrights |
| HikerNerd (USA) | Freemium $5/mc | AI warunki pogodowe (zielony/żółty/czerwony) |

---

**WNIOSKI STRATEGICZNE:**

**1. Rynek jest podzielony na dwie nisze, a nikt nie łączy ich dobrze:**
- Niszę A: "dziennik zdobywcy" (Verdant, Korony Gór) — prosty checkbox, GPS, gotowe
- Niszę B: "narzędzie planowania" (Szlaki, Komoot) — mapy, routing, pogoda
- KGP App próbuje być A+B jednocześnie. To siła (kompletność), ale i słabość (złożoność). Klucz: rozdzielić te tryby w UI, nie w kodzie.

**2. Prostota bije funkcje — ale tylko w terenie.**
- Verdant: 2.5 MB, crash przy oznaczaniu, zero synca — i 4.8★. Bo robi jedną rzecz jasno.
- Peakbagger.com: brzydki jak noc, działa 20+ lat, bo jest UŻYTECZNY.
- Wniosek: użytkownik w terenie nie szuka funkcji — szuka pewności że "to zadziała". 3 duże przyciski > 30 opcji.
- ALE w domu, przy planowaniu — bogactwo funkcji to zaleta. Nie kasować, schować kontekstowo.

**3. Trzy rzeczy których nikt nie robi dobrze, a my możemy:**
- **Sync bez konta** — nasz sync code (turbacz4821) to unikalna przewaga. Konkurenci albo nie mają synca (Verdant — utrata danych!), albo wymagają rejestracji email (Szlaki). Sync code = zero barier.
- **Offline-first bez sklepu** — PWA działa na Android+iOS+desktop z jednego URL. Żadna konkurencyjna apka KGP tego nie oferuje.
- **Planowanie + realizacja w jednym** — jedyna apka gdzie planujesz wyprawę Z DOMU (routing, pogoda, czas) i realizujesz W TERENIE (GPS, zdjęcie, oznacz). Inni robią albo jedno albo drugie.

**4. Czego NIE robić (pułapki):**
- Nie gonić za bazą 340k szczytów (Hory) — to nie nasz rynek. 28 szczytów KGP to siła, nie słabość. Ekspert od jednego tematu > generyk.
- Nie dodawać subskrypcji — hobby project. Donations model (jak Peakbagger.com) buduje lojalność, nie paywall.
- Nie kopiować grywalizacji Hory (punkty=wysokość, wyzwania miesięczne) — KGP ma 28 szczytów, nie 340k. Grywalizacja nie skaluje się przy małej bazie. Obecne osiągnięcia (12 odznak) wystarczą.
- Nie integrować ze Stravą na siłę — nasi użytkownicy to turyści, nie biegacze. GPS z telefonu > import GPX.

**5. Konkretny kierunek: "Prosty w górach, bogaty w domu"**
- Priorytet 1: Tryb terenowy (Adaptive UI etap 2) — na szlaku/szczycie widać TYLKO: zdobądź, zdjęcie, wróć do auta
- Priorytet 2: Dopracować core flow — oznacz szczyt → zdjęcie → karta do udostępnienia. Ten flow musi być BEZBŁĘDNY i szybki (3 tapy max)
- Priorytet 3: Nie dodawać NOWYCH funkcji — dopracować istniejące. 30 funkcji po 80% < 10 funkcji po 100%
- Opcjonalnie: Nowa KGP (38 szczytów) — nikt tego nie ma, daje buzz i powód do pobrania

**Propozycje do implementacji:**
- [ ] **Adaptive UI etap 2 - tryb terenowy** - gdy context=TRAIL/SUMMIT, strona Zdobywaj uproszczona: duży przycisk "Zdobywam!", zdjęcie, nawigacja do auta. Bez scrollowania. Pełny UI pod "Pokaż wszystko". Warunkowy render, zero usuwania kodu.
- [ ] **Core flow audit** - przetestować cały flow: wejście na szczyt → zdjęcie → oznaczenie → karta → udostępnienie. Policzyć tapy, usunąć zbędne kroki, naprawić edge case'y.
- [ ] **Nowa Korona Polskich Gór (38 szczytów)** - nowa regionalizacja 2025, nikt nie wspiera. Opcjonalny tryb "Nowa KGP" obok klasycznej 28.

*Ostatnia aktualizacja: 2026-04-30 (sesja 7 - tech debt phase 4, WCAG 2.1 AA accessibility, smoke testy)*
