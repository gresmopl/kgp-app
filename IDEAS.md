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
- [x] Onboarding z animacja
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
- [ ] **Tryb offline z mapami** - cache kafelkow w IndexedDB dla okolic kazdego szczytu. W gorach czesto brak zasiegu.
- [ ] **Wiele zdjec na szczyt** - galeria zamiast jednego zdjecia. Porownanie lato vs zima.

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
- [ ] **Accessibility** - wysoki kontrast, skalowalne fonty, aria labels, semantic HTML, obsługa czytnika ekranu. Nie feature, a wymóg.
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
- [ ] **Mockowanie offline/GPS w testach** - symulacja braku sieci i lokalizacji GPS w Playwright (bardziej zaawansowane, na pozniej)

### Bugfixy
- [ ] **Grupowanie parkingow** - jeden parking → wiele szczytow (np. Gorce)
- [x] **Drukowanie zdjec blokowane jako popup** - window.open zamienione na iframe z przyciskami Drukuj/Zamknij
- [x] **Bottom nav niewidoczny na tablecie Samsung** - flex-shrink:0 na nav, min-height:0 na screen, overflow:hidden na app
- [x] **Sync nadpisywal dane pustymi** - dataWeight() porownuje bogactwo danych, puste nie nadpisza bogatszych

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

*Ostatnia aktualizacja: 2026-04-05 (sesja 4)*
