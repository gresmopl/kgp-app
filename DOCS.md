# Dokumentacja projektowa - Korona Gor Polski

> Zywy dokument opisujacy architekture, przeplywy danych i decyzje projektowe.
> Aktualizowany przy kazdej wiekszej zmianie.

---

## Spis tresci

1. [Architektura ogolna](#architektura-ogolna)
2. [Przeplywy danych](#przeplywy-danych)
3. [Nawigacja i routing SPA](#nawigacja-i-routing-spa)
4. [System stanu](#system-stanu)
5. [Synchronizacja danych](#synchronizacja-danych)
6. [System kontekstowy (Adaptive UI)](#system-kontekstowy)
7. [Mapa i nawigacja](#mapa-i-nawigacja)
8. [Planer wypraw (planowane)](#planer-wypraw)
9. [Baza danych](#baza-danych)
10. [API zewnetrzne](#api-zewnetrzne)
11. [Slownik pojec](#slownik-pojec)
12. [Decyzje projektowe](#decyzje-projektowe)
13. [Znane ograniczenia](#znane-ograniczenia)

---

## Architektura ogolna

```
┌─────────────────────────────────────────────────┐
│                  PRZEGLADARKA                    │
│                                                 │
│  index.html (SPA shell)                         │
│  ┌───────────────────────────────────────────┐  │
│  │ #screen (dynamiczna tresc)                │  │
│  │  renderMap / renderList / renderPlan /     │  │
│  │  renderSummit / renderJournal /            │  │
│  │  renderSettings                            │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ #nav (dolna nawigacja - 5 zakladek)       │  │
│  │ [ctx-badge] wskaznik kontekstu            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ localStorage │ Service  │  │  GPS API     │  │
│  │ (primary)    │ Worker   │  │  (watch)     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │ fetch / REST
     ┌────────────┼────────────────────┐
     │            │                    │
┌────▼────┐ ┌────▼─────┐  ┌──────────▼──────────┐
│ Supabase│ │ Mapy.com │  │ Open-Meteo /         │
│ DB +    │ │ Tiles +  │  │ Sunrise-Sunset API   │
│ Storage │ │ Routing +│  │                      │
│         │ │ Geocoding│  │                      │
└─────────┘ └──────────┘  └─────────────────────┘
```

### Kluczowa zasada: Offline-first

```
Uzytkownik dziala → zapis do localStorage → natychmiastowy efekt
                  → w tle: syncToCloud() → Supabase
                  
Brak internetu → localStorage dziala normalnie
              → syncToCloud() czeka w kolejce
              → po reconnect: auto-sync
```

Uzytkownik nigdy nie czeka na serwer. Dane lokalne sa zrodlem prawdy.

---

## Przeplywy danych

### Zapis stanu (kazda interakcja)

```
Uzytkownik zmienia cos (np. oznacza szczyt)
  → state.conquered.push(peakId)
  → save()
    → localStorage.setItem('kgp_conquered', JSON.stringify(...))
    → localStorage.setItem('kgp_journal', JSON.stringify(...))
    → ... (8 kluczy)
    → syncToCloud()  // chyba ze _skipSync = true
      → getStateForSync()  // zbiera dane do JSONB
      → supabase.upsert('user_data', { data: {...} })
```

### Ladowanie danych (start aplikacji)

```
DOMContentLoaded
  → state = { conquered: JSON.parse(localStorage...), ... }
  → startGPS()  // watchPosition
  → restoreTracking()
  → goto(lastPage)
  → sprawdz czy sync pending → syncToCloud()
  → sprawdz photo queue → processPhotoQueue()
```

### Ladowanie strony Plan (async flow)

```
goto('plan')
  → renderPlan() zwraca HTML string (synchronicznie)
  → screen.innerHTML = html
  → POTEM asynchronicznie:
    → loadWeather(peak)     → fetch Open-Meteo → wstawia do #weather-content
    → loadSunTimes(peak)    → fetch API         → wstawia do #sun-content
    → loadWarnings(peak.id) → fetch Supabase     → wstawia do #warnings-content
```

**UWAGA**: async operacje szukaja elementow po ID w DOM. Zmiana tych ID = cicha awaria.

### Upload zdjecia

```
Uzytkownik wybiera zdjecie (input[type=file])
  → compressImage() → canvas resize do max 1200px
  → online?
    → TAK: uploadPhoto() → Supabase Storage bucket "photos"
    → NIE: addToPhotoQueue() → localStorage kolejka
           → processPhotoQueue() przy reconnect
```

---

## Nawigacja i routing SPA

### Strony aplikacji

| Strona | Funkcja render | Plik | Opis |
|--------|---------------|------|------|
| map | renderMap() | ui.js | Mapa Leaflet z 28 markerami |
| list | renderList() | ui.js | Lista szczytow z filtrami |
| plan | renderPlan() | ui.js | Planowanie wyprawy na szczyt |
| summit | renderSummit() | ui.js | Tryb zdobywcy - zdjecie, formularz |
| journal | renderJournal() | journal.js | Dziennik wejsc |
| settings | renderSettings() | settings.js | Ustawienia |
| ~~sos~~ | ~~renderSOS()~~ | ~~features.js~~ | Przeniesione do ustawień jako sekcja "Numery alarmowe" |

### Przeplyw nawigacji

```
goto(page, skipHistory)
  → pushState (jesli nie skipHistory)
  → state.currentPage = page
  → localStorage('kgp_last_page', page)
  → aktualizuj active nav button
  → renderXxx() → HTML string
  → animacja opacity 0 → wstaw HTML → opacity 1
  → scroll top
  → updateScrollTopBtn()
  → post-render: specyficzne dla strony (initMap, loadWeather, itp.)
```

### Historia przegladarki

```
goto('list')        → pushState({page:'list'}, '#list')
przycisk wstecz     → popstate event → goto(e.state.page, true)
odswiez strone      → hash z URL → goto(page, true)
```

---

## System stanu

### Pola persystowane (localStorage → Supabase)

| Pole | Klucz localStorage | Typ | Opis |
|------|-------------------|-----|------|
| conquered | kgp_conquered | number[] | ID zdobytych szczytow |
| journal | kgp_journal | object[] | Wpisy dziennika |
| paceMultiplier | kgp_pace | float | Tempo chodzenia 0.7-1.5 |
| homeAddr | kgp_home | string | Adres startowy |
| selectedRoutes | kgp_routes | object | Wybrane warianty tras {peakId: idx} |
| userName | kgp_username | string | Imie / nick |
| savedRoutes | kgp_saved_routes | object | Zapisane trasy z geometria |

### Pola sesyjne (NIE persystowane)

| Pole | Opis | Uwaga |
|------|------|-------|
| userLat, userLon | Pozycja GPS | Z watchPosition, znika po zamknieciu |
| gpsActive | Czy GPS aktywny | boolean |
| selectedPeak | Wybrany szczyt w planie | Obiekt PEAK |
| nearbyPeak | Szczyt w zasiegu 500m | ID lub null |
| departTime | Godzina wyjazdu w planerze | Tylko w input field |
| transport | Samochod / PKS | Tylko w sesji |
| context | home/driving/trail/summit | Z context detection |
| _contextPeak | Najblizszy szczyt kontekstowy | Z context detection |
| _todaySunset | Cache zachodu slonca | Dla widoku szczytu |

### Pola per-device (localStorage, NIE syncowane do Supabase)

| Pole | Klucz | Opis |
|------|-------|------|
| _homeGeo | kgp_home_geo | Zgeokodowane koordynaty adresu domowego {lat, lon} |
| theme | kgp_theme | Motyw: light/dark/system |
| filter | kgp_filter | Aktywny filtr listy (all/done/todo/region) |
| currentPage | kgp_last_page | Ostatnia otwarta zakladka |

---

## Synchronizacja danych

### Mechanizm sync code

```
Nowy uzytkownik
  → initSync()
  → generuj sync_code: losowa_gora + 4 cyfry (np. "turbacz4821")
  → supabase.insert('profiles', { sync_code })
  → supabase.insert('user_data', { user_id, data: state })
  → zapisz ID do localStorage

Logowanie kodem na innym urzadzeniu
  → loginWithCode("turbacz4821")
  → supabase.select('profiles').eq('sync_code', code)
  → pobierz user_data → nadpisz localStorage
  → _skipSync = true (zapobiegaj petli)
```

### Co sie synchronizuje

```javascript
getStateForSync() → {
  conquered, journal, userName, homeAddr,
  paceMultiplier, transport, iceContact,
  selectedRoutes, savedRoutes
}
// Calosc jako JSONB w kolumnie user_data.data
```

### Kolejka offline

```
save() → syncToCloud() → brak internetu?
  → localStorage.setItem('kgp_sync_pending', '1')
  → przy reconnect (event 'online'): sprawdz pending → syncToCloud()
```

---

## System kontekstowy

### 4 tryby

| Tryb | Warunki detekcji | Badge |
|------|-----------------|-------|
| home (Planowanie) | brak GPS / predkosc <0.3 m/s + >5km od szczytu | 🏠 zloty |
| driving (W trasie) | predkosc >15 km/h (4.17 m/s) | 🚗 niebieski |
| trail (Na szlaku) | <5km od szczytu + predkosc 0.3-15 km/h | 🥾 zielony |
| summit (Na szczycie) | <200m od szczytu + predkosc <0.5 m/s | 🏔️ czerwony, pulsuje |

### Debounce

```
Odczyt GPS co ~15s (setInterval w router.js)
  → detectContext() oblicza surowy kontekst
  → zapisuje do _ctxHistory[]
  → zmiana kontekstu tylko gdy 3 kolejne odczyty zgadzaja sie (~45s)
  → zapobiega skakaniu przy niestabilnym GPS
```

### Przeplyw

```
setInterval(updateContext, 15000)
  → detectContext()
    → oblicz dystans do najblizszego szczytu
    → oblicz predkosc z _ctxGpsHistory (ostatnie 2 min)
    → reguly priorytetowe: summit > driving > trail > home
    → debounce 3 odczytow
  → jesli zmiana:
    → state.context = nowy
    → state._contextPeak = najblizszy szczyt
    → updateContextBadge() → DOM
    → showToast("Tryb: Na szlaku - Tarnica")
```

---

## Mapa i nawigacja

### Warstwa kafelkow

```
Mapy.com Outdoor tiles
URL: https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?lang=pl&apiKey=...
Wazne: parametr lang=pl - bez niego nazwy po czesku
```

### Markery szczytow

```
Kazdy z 28 szczytow → marker na mapie
  → kolor: zielony (zdobyty) / pomaranczowy (niezdobyty)
  → popup: nazwa, wysokosc, pasmo, przyciski [Szczegoly] [Planuj]
  → label: nazwa szczytu jako tekst obok markera
```

### Routing Mapy.com

```
getRoute_Mapy(startLon, startLat, endLon, endLat, type, waypoints)
  → POST https://api.mapy.com/v1/routing/route
  → body: { routeType: 'foot_hiking' | 'car_fast', waypoints, avoidToll }
  → response: GeoJSON z geometry, length (m), duration (s)
  → rysuj na mapie: niebieska linia (auto), zielona (pieszy)
```

### Deferred route rendering

```
navigateToPeak() → oblicza trase → drawRouteOnMap(geojson)
  → zapisuje do state.pendingRoute (NIE rysuje od razu)
  
goto('map') → initMap() → setTimeout(applyRouteToMap, 100)
  → teraz rysuje pendingRoute na mapie
  
Dlaczego: mapa moze nie byc zainicjalizowana gdy trasa jest gotowa.
```

### Geocoding

```
geocodeParking("Palenica Bialczanska")
  → GET https://api.mapy.com/v1/geocode?query=...
  → fallback: uproszczona nazwa → koordynaty GPS parkingu z PEAKS

geocodeNear("Schronisko pod Rysami", nearLat, nearLon)
  → geocode + filtruj wyniki w promieniu 1 stopnia od punktu
```

---

## Planer wypraw

> Status: W PLANOWANIU. Docelowo zastapi renderPlan().

### Model danych

```javascript
// state.trips = [trip, trip, ...]
trip = {
  id: "trip_1717200000",        // timestamp-based ID
  name: "Bieszczady weekend",
  created: "2026-06-01",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
  base: {                        // opcjonalna baza noclegowa
    name: "Cisna",
    lat: 49.22, lon: 22.33
  },
  shareCode: "trip-bieszczady-a3f2",  // do udostepniania
  days: [
    {
      date: "2026-06-13",
      stops: [stop, stop, ...]
    }
  ]
}

// Typy przystankow (stop)
stop = {
  id: "stop_1717200001",
  type: "start|drive|parking|hike_up|summit|hike_down|lodge|food|attraction|poi|end",
  name: "Parking Ustrzyki Gorne",
  lat: 49.06, lon: 22.65,       // koordynaty (reczne lub z GPS checkpoint)
  peakId: 5,                     // link do PEAKS (opcjonalny)
  routeIdx: 0,                   // wariant trasy (opcjonalny)
  time: "09:20",                 // szacowana godzina (auto-calc)
  duration: 200,                 // czas w minutach (auto lub reczny)
  distance: 280,                 // dystans w km (auto)
  notes: "",                     // notatki uzytkownika
  gpsCheckpoint: {               // potwierdzenie GPS (opcjonalne)
    lat: 49.0601, lon: 22.6512,
    timestamp: "2026-06-13T09:22:00Z",
    accuracy: 8                  // metry
  }
}
```

### Typy przystankow

| type | Ikona | Dane automatyczne | Dane reczne |
|------|-------|-------------------|-------------|
| start | 🏠 | - | adres (z state.homeAddr lub wpisany) |
| drive | 🚗 | czas + km z Mapy.com API | - |
| parking | 🅿️ | z PEAKS.parking | lub wybor z mapy |
| hike_up | 🥾 | czas + dystans z PEAKS.trail | korygowalne |
| summit | 🏔️ | z PEAKS (auto-link) | - |
| hike_down | 🥾 | czas z PEAKS.trail | korygowalne |
| lodge | 🛏️ | - | nazwa, adres |
| food | 🍽️ | link Google Maps | nazwa |
| attraction | 🏰 | - | nazwa, opis |
| poi | 📍 | reverse geocode z mapy | lub reczne |
| end | 🏁 | auto | - |

### GPS checkpoint

```
Uzytkownik jest przy przystanku → klika "Jestem tu!" (aktywny gdy GPS <500m)
  → zapisuje { lat, lon, timestamp, accuracy } do stop.gpsCheckpoint
  → potwierdzone przystanki → state.discoveredPlaces[]
  → discoveredPlaces sluzy jako baza zweryfikowanych parkingow/punktow
  → w przyszlosci: lepsze sugestie w planerze
```

### Udostepnianie wypraw

```
Tworca klika "Udostepnij"
  → generuj shareCode (np. "trip-bieszczady-a3f2")
  → zapisz trip JSON do Supabase tabela shared_trips
  → kopiuj link: kgp-app/#trip/trip-bieszczady-a3f2

Odbiorca otwiera link
  → router.js parsuje hash → pobierz z shared_trips
  → pokaz podglad → "Dodac do Twoich wypraw?"
  → TAK → kopia trip do state.trips (niezalezna edycja)
```

### Widoki planera

```
renderPlanner()
  ├── Widok A: Lista wypraw (domyslny)
  │   ├── karty wypraw z podsumowaniem (ile dni, ile szczytow, daty)
  │   └── [+ Nowa wyprawa]
  │
  ├── Widok B: Edytor wyprawy
  │   ├── nazwa, daty, baza noclegowa
  │   ├── zakladki dni [Dz 1 | Dz 2 | Dz 3 | +]
  │   ├── pionowy timeline przystankow ze strzalkami ↑↓
  │   ├── [+ Dodaj z listy] [📍 Dodaj z mapy]
  │   ├── GPS checkpoint przy kazdym stopie
  │   ├── pogoda/pakowanie/kalorie w kontekscie dnia
  │   └── [Udostepnij] [Przesun daty] [Usun dzien]
  │
  └── Widok C: Wybor punktu na mapie (fullscreen overlay)
      ├── mapa z istniejacymi markerami danego dnia
      ├── klik → marker + reverse geocode → nazwa
      ├── wybor typu przystanku
      └── [Dodaj do planu]
```

### Edycja dat

```
Przesun weekend → +7 dni do wszystkich dat w wyprawie
Wybierz inna date → kalendarz, przelicz na nowe daty
Usun dzien → szczyty z tego dnia wracaja do "wolnej puli" (niezaplanowane)
```

---

## Baza danych

### Schemat tabel Supabase

```
profiles
  ├── id (uuid, PK)
  ├── sync_code (text, unique) — np. "turbacz4821"
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

user_data
  ├── id (uuid, PK)
  ├── user_id (uuid, FK → profiles.id)
  ├── data (jsonb) — CALY STAN APLIKACJI
  ├── created_at (timestamptz)
  └── updated_at (timestamptz)

photos
  ├── id (uuid, PK)
  ├── user_id (uuid, FK → profiles.id)
  ├── peak_id (integer)
  ├── storage_path (text) — sciezka w bucket "photos"
  ├── photo_type (text) — summit/stamp/panorama/parking/other
  ├── gps_lat, gps_lon (float)
  ├── description (text)
  └── created_at (timestamptz)

warnings
  ├── id (uuid, PK)
  ├── peak_id (integer)
  ├── message (text)
  ├── author (text)
  └── created_at (timestamptz)

group_members
  ├── id (uuid, PK)
  ├── group_code (text)
  ├── profile_id (uuid, FK → profiles.id)
  ├── name (text)
  ├── conquered_count (integer)
  └── created_at (timestamptz)

shared_trips (PLANOWANE)
  ├── id (uuid, PK)
  ├── share_code (text, unique)
  ├── creator_id (uuid, FK → profiles.id)
  ├── trip_data (jsonb) — pelny JSON wyprawy
  ├── created_at (timestamptz)
  └── expires_at (timestamptz) — opcjonalne wygasniecie
```

### Storage

```
Bucket: "photos" (public)
Struktura: {user_id}/{peak_id}_{timestamp}.jpg
Max rozmiar: kompresja do 1200px przed uploadem
```

---

## API zewnetrzne

| API | Uzycie | Limit | Klucz |
|-----|--------|-------|-------|
| Mapy.com Tiles | Kafelki mapy outdoor | Domain-restricted | MAPY_API_KEY (data.js) |
| Mapy.com Routing | Trasy piesze/auto | Domain-restricted | MAPY_API_KEY |
| Mapy.com Geocode | Wyszukiwanie miejsc, reverse geocode | Domain-restricted | MAPY_API_KEY |
| Open-Meteo | Prognoza pogody 7 dni | Darmowe, bez klucza | - |
| Sunrise-Sunset.org | Wschod/zachod slonca | Darmowe, bez klucza | - |
| Supabase REST | CRUD na tabelach | RLS + anon key | SUPABASE_KEY (data.js) |
| Supabase Storage | Upload/download zdjec | 1GB free tier | SUPABASE_KEY |
| Google Maps (linki) | Restauracje, nawigacja | Tylko linki (bez API) | - |

---

## Slownik pojec

| Pojecie | Definicja |
|---------|-----------|
| **KGP** | Korona Gor Polski - zestaw 28 najwyzszych szczytow polskich pasm gorskich |
| **Peak / Szczyt** | Jeden z 28 szczytow KGP, obiekt w tablicy PEAKS[] |
| **Conquered / Zdobyty** | Szczyt oznaczony jako zdobyty przez uzytkownika |
| **Trip / Wyprawa** | Zaplanowany wyjazd na 1+ dni, kontener na dni i przystanki |
| **Day / Dzien** | Jeden dzien w wyprawie, kontener na przystanki |
| **Stop / Przystanek** | Punkt w planie dnia: parking, szczyt, schronisko, restauracja itp. |
| **Sync code / Kod dostepu** | Unikalny kod do logowania na innym urzadzeniu (np. "turbacz4821") |
| **Context / Kontekst** | Automatycznie wykryty tryb: home, driving, trail, summit |
| **GPS checkpoint** | Potwierdzenie obecnosci w punkcie za pomoca GPS |
| **Discovered place** | Miejsce zweryfikowane przez GPS checkpoint uzytkownika |
| **Route variant** | Alternatywny wariant trasy na szczyt (np. Rysy od polskiej vs slowackiej strony) |
| **Pace multiplier** | Mnoznik tempa chodzenia (1.0 = srednie, <1 = szybsze, >1 = wolniejsze) |
| **Geofence** | Wirtualna strefa wokol szczytu (500m) do wykrywania bliskosci |
| **Share code** | Kod do udostepnienia wyprawy innym uzytkownikom |
| **Free pool / Wolna pula** | Szczyty niezaplanowane w zadnej wyprawie |

---

## Migracja danych

### Problem

Struktura `state` ewoluuje - dodajemy nowe pola (trips, discoveredPlaces), zmieniamy format istniejacych. Uzytkownik moze miec w localStorage stara wersje danych bez nowych pol. Bez migracji → undefined errors, utrata danych.

### Rozwiazanie: wersjonowany schemat

```
localStorage['kgp_state_version'] = "2"   // aktualna wersja

STATE_VERSION = 2                          // w kodzie (state.js)
MIGRATIONS = [                             // tablica migracji
  function() {},                           // v0 → v1 (noop)
  function() { ... }                       // v1 → v2 (dodaj trips, discovered, transport)
]
```

### Przeplyw przy starcie

```
migrateState()
  → odczytaj kgp_state_version z localStorage (domyslnie "0")
  → jesli < STATE_VERSION:
    → wykonaj MIGRATIONS[currentVersion] → MIGRATIONS[currentVersion+1] → ...
    → zapisz nowa wersje do localStorage
  → gotowe, state ma poprawna strukture
```

### Zasady dodawania migracji

1. Inkrementuj STATE_VERSION
2. Dodaj nowa funkcje na koniec tablicy MIGRATIONS[]
3. Migracja MUSI byc idempotentna (bezpieczna do wielokrotnego uruchomienia)
4. Migracja NIE MOZE usuwac danych - tylko dodawac/transformowac
5. Nowe pola dodawaj z wartosciami domyslnymi (pusta tablica, null, itp.)
6. Testuj: wyczysc localStorage, zaladuj stara wersje, sprawdz czy migracja dziala

### Przyklady migracji

```javascript
// v1 → v2: dodanie trips i discoveredPlaces
function() {
  if (!localStorage.getItem('kgp_trips')) localStorage.setItem('kgp_trips', '[]');
  if (!localStorage.getItem('kgp_discovered')) localStorage.setItem('kgp_discovered', '[]');
}

// v2 → v3 (przyklad przyszly): zmiana formatu journal
function() {
  const journal = JSON.parse(localStorage.getItem('kgp_journal') || '[]');
  // dodaj nowe pole do kazdego wpisu
  journal.forEach(j => { if (!j.weather) j.weather = null; });
  localStorage.setItem('kgp_journal', JSON.stringify(journal));
}
```

---

## Obsluga bledow

### Strategia ogolna

Aplikacja jest offline-first - bledy sieciowe sa NORMALNE, nie krytyczne. Zasada: **dzialaj lokalnie, synchronizuj w tle, informuj uzytkownika tylko gdy musi cos zrobic**.

### Kategorie bledow

| Kategoria | Przyklad | Reakcja |
|-----------|---------|---------|
| Siec niedostepna | Brak WiFi/LTE | Cichy fallback na dane lokalne, pasek offline |
| API nie odpowiada | Supabase 500, Mapy.com timeout | Retry 1x po 3s, potem cichy fallback |
| API zwraca blad | 404, 429 rate limit | Log do console, toast tylko jesli uzytkownik czeka |
| GPS niedostepny | Brak uprawnien, wnetrze budynku | Kontekst = home, funkcje GPS wyszarzone |
| localStorage pelny | QuotaExceededError | Toast z instrukcja: eksportuj dane, wyczysc stare |
| Dane uszkodzone | JSON.parse rzuca blad | Fallback na wartosc domyslna, nie kasuj danych |

### Wzorce w kodzie

```javascript
// Cichy fallback - uzytkownik nie widzi bledu
try {
  const weather = await fetchWeather(peak);
  renderWeather(weather);
} catch(e) {
  console.error('Weather fetch failed:', e);
  document.getElementById('weather-content').innerHTML =
    '<div style="color:var(--text2)">Prognoza niedostepna offline</div>';
}

// Retry z fallback
async function fetchWithRetry(url, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (i < retries) await new Promise(r => setTimeout(r, 3000));
    } catch(e) {
      if (i < retries) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null;
}

// Bezpieczny JSON.parse
function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch(e) { return fallback; }
}
```

### Co NIGDY nie powinno sie zdarzyc

- Bialy ekran (uncaught exception w renderXxx)
- Utrata danych uzytkownika (nadpisanie localStorage blednym stanem)
- Nieskonczona petla retry (max 1-2 proby)
- Alert/confirm blokujacy UI (uzywaj toast zamiast alert)

---

## Strategia wersjonowania

### Format: MAJOR.MINOR.PATCH

| Typ | Kiedy | Przyklad |
|-----|-------|---------|
| MAJOR (X.0.0) | Duza zmiana UX, nowa architektura, breaking changes | 2.0.0 = planer wypraw zastepuje stary plan |
| MINOR (0.X.0) | Nowa funkcja, nowa strona, nowe API | 1.3.0 = panel admina + context detection |
| PATCH (0.0.X) | Bugfix, poprawka tekstu, drobna zmiana | 1.3.1 = fix wysokosci szczytow |

### Gdzie aktualizowac wersje

1. `js/settings.js` → napis "v1.3.0" w renderSettings()
2. `CHANGELOG.md` → nowa sekcja z opisem zmian
3. `manifest.json` → pole version (jesli istnieje)

### Obecna wersja: 1.2.0 (w settings.js)

### Planowana: 2.0.0 po wdrozeniu planera wypraw

---

## Prywatnosc i dane uzytkownikow

### Jakie dane zbieramy

| Dane | Gdzie przechowywane | Cel |
|------|---------------------|-----|
| Imie/nick | localStorage + Supabase JSONB | Personalizacja dziennika |
| Adres startowy | localStorage + Supabase JSONB | Obliczanie czasu dojazdu |
| Zdobyte szczyty + daty | localStorage + Supabase JSONB | Postep w KGP |
| Zdjecia ze szczytow | Supabase Storage (bucket publiczny) | Dziennik, karta zdobycia |
| Pozycja GPS | Tylko w pamieci (state), NIE zapisywana | Nawigacja, geofence, kontekst |
| GPS checkpoint (planowane) | localStorage + Supabase JSONB | Weryfikacja przystankow |
| Kontakt ICE | localStorage + Supabase JSONB | Tryb SOS |
| Sync code | localStorage + Supabase (profiles) | Synchronizacja miedzy urzadzeniami |

### Czego NIE zbieramy

- Email, telefon, haslo
- Historii lokalizacji (GPS jest tylko real-time, nie logujemy trasy*)
- Danych platniczych
- Ciasteczek sledzacych
- Analityki (brak Google Analytics, brak telemetrii)

*Wyjatki: GPS checkpoint zapisuje pojedyncze koordynaty za zgoda uzytkownika (klikniecie "Jestem tu!")

### Zasady RODO

- Sync code jest opcjonalny - aplikacja dziala w pelni bez niego (localStorage only)
- Brak identyfikacji osobowej - sync code to pseudonim (np. "turbacz4821")
- Uzytkownik moze usunac wszystkie dane lokalne (Ustawienia → Wyczysc dane lokalne)
- Zdjecia w Storage sa publiczne (bucket publiczny) - uzytkownik powinien byc swiadomy
- Brak profilowania, brak reklam, brak udostepniania danych stronom trzecim

### Do zrobienia

- [ ] Prosta strona "Polityka prywatnosci" (link w ustawieniach/about.html)
- [ ] Informacja przy pierwszym uzyciu sync: "Twoje dane beda przechowywane w chmurze"
- [ ] Mozliwosc usuniecia danych z Supabase (nie tylko lokalnych)

---

## Decyzje projektowe

### Dlaczego vanilla JS, nie framework?

- Aplikacja jest SPA ale prosta w strukturze - 7 stron, kazda to funkcja zwracajaca HTML string
- Zero build stepu = otwierasz plik i dziala
- GitHub Pages hosting za darmo, bez CI/CD
- Service Worker latwiejszy bez bundlera
- Unikamy dependency hell - zero node_modules
- Tradeoff: brak reaktywnosci, recznie zarzadzamy DOM. Akceptowalne przy tej skali

### Dlaczego JSONB w Supabase zamiast osobnych tabel?

- Caly stan uzytkownika w jednym rekordzie = jeden fetch, jeden upsert
- Schemat ewoluuje bez migracji (dodaj pole do JSON, nie ALTER TABLE)
- Offline-first: localStorage trzyma ten sam JSON
- Tradeoff: nie mozna queryowac po polach JSONB efektywnie. Akceptowalne - nie mamy takich potrzeb

### Dlaczego sync code zamiast email/haslo?

- Zero barier wejscia - nie trzeba podawac emaila
- Proste: zapamietaj 1 kod, wpisz na innym urzadzeniu
- Unikamy RODO/GDPR komplikacji - nie zbieramy danych osobowych
- Tradeoff: kod mozna zgubic, nie ma "zapomnialem hasla". Akceptowalne - dane sa lokalne, kod jest opcjonalny

### Dlaczego Mapy.com zamiast Google Maps?

- Darmowy tier wystarczajacy na nasza skale
- Kafelki outdoor z oznaczeniami szlakow (Google tego nie ma)
- Routing pieszy po szlakach (Google routuje po drogach)
- Polskie nazwy i dane
- Tradeoff: mniej znane API, gorsza dokumentacja. Akceptowalne - dziala dobrze

### Dlaczego context detection co 15s a nie w watchPosition callback?

- watchPosition odpala sie nieregularnie (od 1s do 30s)
- Regularne 15s daje przewidywalny debounce (3 odczyty = 45s)
- Nie obciaza baterii dodatkowymi obliczeniami przy kazdym GPS update
- Tradeoff: opoznienie wykrycia do 45s. Akceptowalne - uzytkownik nie potrzebuje natychmiastowej reakcji

---

## Znane ograniczenia

| Ograniczenie | Wplyw | Obejscie |
|-------------|-------|----------|
| localStorage ~5MB | Duzo zdjec base64 moze zapchac | Zdjecia w Supabase Storage, lokalnie tylko metadane |
| Brak offline map | Mapa nie dziala bez internetu | Planowane: cache kafelkow w IndexedDB |
| GPS dokladnosc w lesie | Skakanie pozycji, falszywe konteksty | Debounce 3 odczytow, geofence 200-500m |
| Brak reaktywnosci | Zmiana stanu wymaga goto() / re-render | Akceptowalne przy prostocie aplikacji |
| Inline onclick handlery | Trudne do debugowania, escaping nazw | Konwencja: .replace(/'/g, backtick) |
| Brak testow automatycznych | Regresje mozliwe przy duzych zmianach | Reczne testowanie, ostrozny refaktoring |
| Single-thread rendering | Dlugie renderowanie blokuje UI | Renderowanie jest szybkie (<50ms), nie problem |
| Open-Meteo bez klucza | Rate limit przy wielu zapytaniach | Cache pogody na 1h, jedno zapytanie na szczyt |

---

*Ostatnia aktualizacja: 2026-04-03*
