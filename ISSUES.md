# ISSUES.md - Audyt i znalezione problemy KGP-App

> Ostatnia aktualizacja: 2026-04-12
> Audyt przeprowadzony automatycznie przez Claude Code na podstawie analizy wszystkich plików projektu.

---

## Legenda

- 🔴 **KRYTYCZNE** - psuje działanie, ryzyko bezpieczeństwa lub utrata danych
- 🟠 **WYSOKIE** - widoczne dla użytkownika, obniża użyteczność
- 🟡 **ŚREDNIE** - błąd który wystąpi w edge case'ach
- 🟢 **NISKIE** - drobne usprawnienia, nice-to-have
- ✅ **NAPRAWIONE** - zamknięte

---

## 1. KRYTYCZNE

### ISS-001 - Service Worker w trybie network-only (brak offline)
**Plik:** `sw.js:9`
**Problem:**
```js
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
```
Service worker jest zainstalowany ale nic nie cachuje. Przy braku połączenia aplikacja się nie załaduje - biały ekran. Sprzeczne z założeniem "offline-first".

**Fix:**
```js
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') { e.respondWith(fetch(e.request)); return; }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      return caches.open('kgp-v1').then(cache => {
        cache.put(e.request, res.clone());
        return res;
      });
    }))
  );
});
```
Ponadto przy `install` dodać pre-cache dla `index.html`, `css/style.css`, pliki JS, Leaflet CDN.

---

### ISS-002 - Race condition: async operacje piszą do usuniętego DOM
**Plik:** `router.js:57-61`
**Problem:**
```js
if (planPeak) {
  loadWeather(planPeak);    // fire & forget
  loadSunTimes(planPeak);   // fire & forget
  loadWarnings(planPeak.id);// fire & forget
}
```
Jeśli użytkownik przejdzie na inną stronę zanim te funkcje skończą fetch (1-5s), będą próbowały wpisać wyniki do elementów DOM które już nie istnieją. Aktualnie `loadWeather`/`loadSunTimes` mają `if (!el) return` na początku, ale operacje wewnętrzne (np. wstawianie wyników do sub-elementów) już nie.

**Fix:** Dodać AbortController lub przed każdym `el.innerHTML =` sprawdzać `if (!document.contains(el)) return;`

---

### ISS-003 - Brak sanitizacji danych przy importBackup
**Plik:** `journal.js:200-207`
**Problem:**
```js
const data = JSON.parse(e.target.result);
if (!data.conquered || !Array.isArray(data.conquered)) throw new Error('...');
state.conquered = data.conquered; // brak walidacji pól
state.journal = data.journal || []; // notatki mogą zawierać HTML
```
Pola `journal[].note` są później renderowane przez `innerHTML` w różnych miejscach aplikacji. Złośliwy plik backup może zawierać `<script>` lub `<img onerror=...>` w polach tekstowych.

**Fix:**
```js
state.journal = (data.journal || []).map(j => ({
  ...j,
  note: typeof j.note === 'string' ? j.note.substring(0, 2000) : '',
  name: typeof j.name === 'string' ? j.name.substring(0, 100) : '',
}));
```
Dodatkowo sprawdzić czy wszystkie miejsca renderujące `note` używają `esc()`.

---

## 2. WYSOKIE

### ISS-004 - Nieskończona kolejka retry dla zdjęć
**Plik:** `sync.js:246-259`
**Problem:**
```js
for (const item of queue) {
  const url = await uploadPhoto(...);
  if (!url) remaining.push(item); // wraca bez limitu prób
}
```
Jeśli upload Supabase Storage stale padnie (np. usunięty bucket, wygasłe uprawnienia), `item` będzie w kolejce **wiecznie**. Przy każdym starcie aplikacji powtarza nieudany upload.

**Fix:**
```js
if (!url) {
  item.retryCount = (item.retryCount || 0) + 1;
  if (item.retryCount < 5) remaining.push(item);
  else console.warn('Porzucono upload po 5 próbach:', item.peakId);
}
```

---

### ISS-005 - Brak debounce na wyznaczanie trasy
**Plik:** `map.js` (funkcja `navigateToPeak`)
**Problem:** Szybkie wielokrotne kliknięcie "Wyznacz trasę" uruchamia wiele równoległych requestów do Mapy.com API (geocoding + routing). Wyniki mogą przyjść w losowej kolejności, ostatni race winner nadpisze mapę.

**Fix:**
```js
let _routeCalculating = false;
async function navigateToPeak(peakId) {
  if (_routeCalculating) return;
  _routeCalculating = true;
  try { /* ... istniejący kod ... */ }
  finally { _routeCalculating = false; }
}
```

---

### ISS-006 - Brak loading state na operacjach sync
**Plik:** `settings.js`
**Problem:** Przyciski "Wyślij do chmury" / "Pobierz z chmury" nie blokują się podczas operacji. User może kliknąć wielokrotnie. Nie ma też feedbacku czy operacja trwa 0.5s czy 10s.

**Fix:** Wyłączać button na czas operacji + dodać spinner lub zmianę tekstu przycisku (`"Wysyłam..."` → `"Wysłano ✅"`).

---

### ISS-007 - Szczyt zamknięty (Wysoka Kopa) bez wyraźnego ostrzeżenia w UI
**Plik:** `data.js:83-86`
**Problem:** Wysoka Kopa (id:13) ma notatkę o zamknięciu szczytu od 2021 tylko w polu `stamps[0].note` i `photo`. UI listy szczytów nie pokazuje tego żadnym wizualnym wyróżnikiem - szczyt wygląda jak każdy inny do zdobycia.

**Fix:** Dodać pole `status: 'closed'` lub `warning` w obiekcie PEAKS. W `renderList()` i `renderSummit()` renderować czerwony baner gdy status === 'closed'.

---

## 3. ŚREDNIE

### ISS-008 - Toast - nakładające się powiadomienia
**Plik:** `utils.js:46-50`
**Problem:**
```js
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000); // nowy toast kasuje poprzedni timer
}
```
Jeśli wywołasz toast dwa razy w ciągu 3s, pierwszy timer usunie drugi toast za wcześnie.

**Fix:**
```js
let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
```

---

### ISS-009 - Brak cleanup mapy Leaflet przy ponownym wejściu
**Plik:** `router.js:44-45`
**Problem:**
```js
if (page === 'map') {
  setTimeout(() => { initMap(); setTimeout(applyRouteToMap, 100); }, 50);
}
```
Każde wejście na stronę `map` wywołuje `initMap()`. Jeśli `initMap()` nie niszczy poprzedniej instancji Leaflet, po kilku przejściach mogą być zduplikowane instancje mapy i memory leaki. Leaflet ostrzega o tym w konsoli: *"Map container is already initialized"*.

**Fix:** W `initMap()` sprawdzić czy mapa już istnieje:
```js
if (_map) { _map.remove(); _map = null; }
```

---

### ISS-010 - Brakujące null check w `updateContext()` gdy PEAKS pusty
**Plik:** `utils.js:178-185`
**Problem:** `best` może być `null` jeśli `PEAKS` jest puste (np. błąd ładowania `data.js`). `state._contextPeak = null` zostaje ustawiony poprawnie, ale funkcje downstream zakładają że `state._contextPeak` jest obiektem gdy kontekst != HOME.

**Obecny stan:** Mało prawdopodobne w praktyce (PEAKS to hardcoded constant), ale warto zabezpieczyć.

---

### ISS-011 - `state.savedRoutes` - dane orphan bez UI
**Plik:** `state.js:23`, `sync.js:72`
**Problem:** Pole `savedRoutes` jest persystowane i synchronizowane do chmury, ale nie ma żadnego UI do zapisu/odczytu trasy. Zajmuje miejsce w localStorage i pasmie sieciowym.

**Fix:** Albo dodać feature "zapisz trasę", albo usunąć pole ze state i sync.

---

### ISS-012 - Feature `dedication` w połowie usunięta
**Plik:** `features2.js:561`, `journal.js:127`
**Problem:** Pole `dedication` w danych dziennika jest zapisywane i renderowane w timeline, ale nie ma UI do jego wprowadzenia. User nie może dodać dedykacji, ale stare dane z dedykacją są wyświetlane.

**Fix:** Albo przywrócić UI (pole w formularzu zdobycia szczytu), albo całkowicie usunąć z danych i renderowania.

---

### ISS-013 - `transport` w `getStateForSync()` a brak persystencji
**Plik:** `sync.js:73`, `CLAUDE.md`
**Problem:** `state.transport` jest wysyłany do chmury w `getStateForSync()`, ale CLAUDE.md mówi wprost: *"state.transport NIE JEST persystowany do localStorage"*. Przy pull z chmury `transport` może nadpisać sesyjną wartość.

**Fix:** Usunąć `transport` z `getStateForSync()` lub zdecydować o persystencji.

---

## 4. NISKIE

### ISS-014 - viewport `user-scalable=no` blokuje accessibility
**Plik:** `index.html:5`
**Problem:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```
Blokuje pinch-zoom. Osoby niedowidzące nie mogą powiększyć treści. Niezgodne z WCAG 2.1 (Success Criterion 1.4.4).

**Fix:** Zmienić na `user-scalable=yes` (Leaflet i tak obsługuje gesty mapy niezależnie).

---

### ISS-015 - Brak timeout na fetch w `loadWeather`
**Plik:** `weather.js`
**Problem:** Fetch do Open-Meteo nie ma timeout. Jeśli serwer wisie, spinner "Ładowanie prognozy..." będzie widoczny w nieskończoność.

**Fix:**
```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 8000);
const res = await fetch(url, { signal: controller.signal });
```

---

### ISS-016 - Brak pre-cache w Service Worker dla CDN Leaflet
**Plik:** `sw.js`, `index.html`
**Problem:** Leaflet jest ładowany z CDN (`unpkg.com`). Jeśli użytkownik wejdzie offline bez wcześniejszego odwiedzenia strony, Leaflet się nie załaduje i mapa nie ruszy.

**Fix:** Dodać Leaflet JS/CSS do pliku lokalnego (`/js/leaflet.min.js`) lub uwzględnić w pre-cache Service Workera.

---

### ISS-017 - Zdjęcia w base64 mogą przepełnić localStorage
**Plik:** `js/state.js`, `js/sync.js`
**Problem:** Zdjęcia w `state.journal[].photo` są przechowywane jako base64 w localStorage (limit ~5MB). Jedno zdjęcie w pełnej rozdzielczości to ~2-4MB. Dwa zdjęcia = limit przekroczony.

**Obecny stan:** `getStateForSync()` w sync.js poprawnie wycina `photo: undefined` przy sync. Ale lokalne localStorage może się przepełnić.

**Fix:** Przy zapisywaniu zdjęcia kompresować do max 800px i ~100KB (canvas resize przed base64).

---

### ISS-018 - Retry kolejki sync bez exponential backoff
**Plik:** `sync.js`
**Problem:** `processPhotoQueue()` jest wywoływany raz przy starcie. Przy błędzie sieciowym nie ma automatycznego retry z opóźnieniem - czeka do następnego uruchomienia aplikacji.

**Fix:** Dodać retry po 30s/60s przy błędzie sieciowym.

---

## 5. BRAKUJĄCE FUNKCJE (z IDEAS.md, bez implementacji)

| # | Funkcja | Status w IDEAS.md | Impact |
|---|---------|-------------------|--------|
| F-01 | Cache kafelków mapy offline | Zaplanowane | Wysoki - bez tego offline useless |
| F-02 | Wiele zdjęć na szczyt (galeria) | Zaplanowane | Średni |
| F-03 | Profil wysokościowy trasy | Zaplanowane | Średni |
| F-04 | AI Planner (Gemini) | Zaplanowane | Wysoki |
| F-05 | Powiadomienia push (przypomnienia o wyprawie) | Zaplanowane | Niski |

---

## 6. DOBRE PRAKTYKI - co działa poprawnie

Dla równowagi - rzeczy zrobione dobrze:

- ✅ `esc()` używany konsekwentnie przy wstawianiu danych użytkownika do innerHTML
- ✅ Kolejność ładowania skryptów jest prawidłowa (data → state → utils → ... → router)
- ✅ `_skipSync` flag zapobiega pętlom sync
- ✅ Context detection ma debounce (3 odczyty ~45s) - chroni przed GPS jitter
- ✅ `dataWeight()` chroni przed nadpisaniem bogatszych danych pustymi przy sync
- ✅ `if (!el) return` w większości async funkcji DOM
- ✅ Geocoding ma fallback (pełna nazwa → uproszczona → GPS)
- ✅ Supabase publishable key - poprawne podejście dla frontendu

---

## Proponowana kolejność napraw

1. **ISS-001** - Service Worker cache (offline-first to core feature)
2. **ISS-008** - Toast fix (1 linia, warto zrobić od razu)
3. **ISS-004** - Photo queue retry limit (zapobiega nieskończonej pętli)
4. **ISS-002** - Race condition async DOM (stabilność)
5. **ISS-003** - Import sanitizacja (bezpieczeństwo)
6. **ISS-009** - Leaflet cleanup (stabilność przy długim użytkowaniu)
7. **ISS-005** - Debounce na routing (API quota)
8. **ISS-007** - Wysoka Kopa warning (UX)
9. **ISS-014** - Viewport accessibility (1 linia)
10. **ISS-015** - Fetch timeout (UX przy słabym zasięgu)

---

---

## 7. ERGONOMIA I UX - AUDYT MOBILNY

> Kontekst oceny: użytkownik w terenie górskim, zimne palce, słońce na ekranie, zmęczenie, słaby zasięg.
> Ocena ogólna: **6.5/10** - solidna baza, ale kilka poważnych luk dla scenariuszy terenowych.

---

### UX-001 - Przyciski przenoszenia w plannerze są za małe
**Plik:** `css/style.css` (`.pl-btn-move`)
**Problem:** `width: 24px; height: 24px` - standard mobilny to min. 44px. W rękawicach lub przy zmęczeniu prawie nie do kliknięcia.
**Fix:**
```css
.pl-btn-move { width: 40px; height: 40px; }
```

---

### UX-002 - Font w prognozie pogody nieczytelny na słońcu
**Plik:** `css/style.css` (`.weather-date`, `.weather-score`)
**Problem:** `.weather-score { font-size: 8px; }` i `.weather-date { font-size: 9px; }` - praktycznie niewidoczne w terenie.
**Fix:**
```css
.weather-date  { font-size: 11px; }
.weather-score { font-size: 12px; font-weight: 700; }
```

---

### UX-003 - Brak disabled/loading state na przyciskach akcji
**Plik:** `planner.js`, `features.js`, `settings.js`
**Problem:** Po kliknięciu "Utwórz wyprawę", "Wyślij do chmury" itp. przycisk nie zmienia wyglądu. Przy wolnym połączeniu użytkownik nie wie czy akcja działa.
**Fix:** Wzorzec dla każdego async przycisku:
```js
async function createTrip() {
  const btn = event.currentTarget;
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = '⏳ Tworzę...';
  try { /* ... */ } finally { btn.disabled = false; btn.textContent = orig; }
}
```

---

### UX-004 - Brak wyraźnego "Jesteś na szczycie X" na ekranie Summit
**Plik:** `js/ui.js` (`renderSummit`)
**Problem:** Użytkownik nie widzi jednoznacznie, czy aplikacja wykryła właściwy szczyt. Brakuje dużego, czytelnego potwierdzenia lokalizacji GPS.
**Fix:** Duży baner z nazwą szczytu (min. 32px) i badge GPS w kolorze zielonym gdy pozycja wykryta.

---

### UX-005 - Etykiety dolnej nawigacji za małe
**Plik:** `css/style.css` (`.nav-btn span`)
**Problem:** `font-size: 10px` - poniżej progu czytelności na słońcu. Apple HIG rekomenduje min. 11px dla labeli.
**Fix:** `font-size: 11px`

---

### UX-006 - Brak "Następny szczyt" jako szybka akcja po zdobyciu
**Plik:** `js/ui.js`, `js/features.js`
**Problem:** Po zatwierdzeniu zdobycia użytkownik musi sam nawigować do listy/planera żeby znaleźć co dalej. Wymaga 3-4 kliknięć.
**Fix:** Po potwierdzeniu zdobycia pokazać kartę:
```html
<div class="card card-pad">Co dalej? → [Nazwa następnego szczytu] [km] ›</div>
```

---

### UX-007 - Zbyt wiele informacji naraz na stronie "Plan"
**Plik:** `js/features2.js`, `js/ui.js`
**Problem:** Strona Plan zawiera: pogodę, słońce, ostrzeżenia, parking, kalorie, pakowanie, restauracje, kamery, optimizer - wszystko rozwinięte. Scroll 800px+.
**Fix:** Zwinąć sekcje domyślnie (używać istniejącego `toggleSection()`). Pokazywać domyślnie tylko pogodę i ostrzeżenia.

---

### UX-008 - Kontrast koloru `--text2` poniżej WCAG AA
**Plik:** `css/style.css`
**Problem:** `--text2: #9090b0` na ciemnym tle daje kontrast ~4.2:1, WCAG AA wymaga 4.5:1 dla tekstu normalnego.
**Fix:**
```css
:root { --text2: #a0a0c0; }  /* kontrast ~5:1 */
```

---

### UX-009 - Brak haptic feedback na zdobycie szczytu
**Plik:** `js/features.js` (funkcja potwierdzenia zdobycia)
**Problem:** Na mobile brak wibracji - jeden z najbardziej satysfakcjonujących momentów (zdobycie szczytu) jest odczuwalnie "cichy".
**Fix:**
```js
if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
```

---

### UX-010 - Terminologia: "Planuj" niejednoznaczne
**Plik:** `index.html` (bottom nav)
**Problem:** Przycisk nawigacji "Planuj" prowadzi do planera wielodniowego, ale na stronie szczytu jest też "zaplanuj trasę". Dwuznaczność dla nowego użytkownika.
**Fix:** Zmienić etykietę nav na "Wyprawy" lub "Plan".

---

### Podsumowanie ergonomii - co działa dobrze

- ✅ Bottom nav ma prawidłowe touch targets (44px+)
- ✅ Wiersze listy szczytów są czytelne i dobrze klikalne
- ✅ Paleta kolorów ma dobry kontrast dla głównego tekstu (~13:1 dark mode)
- ✅ Offline bar jest natychmiast widoczny
- ✅ Toast notifications działają spójnie
- ✅ Animacja przejścia między stronami jest płynna
- ✅ Dark mode działa konsekwentnie w całej aplikacji

---

*Wygenerowano: 2026-04-12 | Wersja audytu: 1.1 (dodano sekcję ergonomii)*
