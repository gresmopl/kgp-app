# Changelog - Korona Gor Polski

Wszystkie istotne zmiany w projekcie. Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/).

---

## [1.5.0] - 2026-04-21/22 (dev)

### Dodane
- Prawdziwe ikony PWA (PNG 192x192, 512x512 + maskable + apple-touch-icon) zamiast SVG data URI
- Service worker z cache'owaniem offline (network-first, fallback na cache) - wcześniej był wyłączony (pass-through)
- Screen Wake Lock API - ekran nie gaśnie w trybie Na szlaku / Na szczycie
- Wibracja przy zdobyciu szczytu (obok confetti)
- Autofocus na pierwszym polu w modalu edycji przystanku (planner)
- Parser markdown dla odpowiedzi AI (`mdToHtml()` w utils.js) - bold, italic, listy, nagłówki, code
- Dynamiczna wersja aplikacji (`APP_VERSION` w data.js, format `1.2.RRMMDD.HHmm`)
- Skrypt `bump-version.sh` do aktualizacji wersji przed deployem
- Komunikat offline na mapie - informacja o braku internetu z ikoną 📡, znika automatycznie po powrocie online
- Undo zdobycia szczytu - przycisk cofnięcia przez 60 sekund po zdobyciu
- Potwierdzenie usunięcia wyprawy w planerze (confirm dialog)

### Zmienione
- Manifest PWA: dodano `scope`, prawidłowe ikony PNG, usunięto SVG data URI
- index.html: favicon PNG zamiast SVG, dodano `<link rel="apple-touch-icon">`
- index.html: usunięto `user-scalable=no` i `maximum-scale=1.0` (dostępność WCAG)
- index.html: zakładka "Szczyt" → "Zdobywaj", ikona planera 📅 → 🎒
- Wersja w ustawieniach i onboardingu pobierana z `APP_VERSION` (nie hardcoded)
- AI chat i AI opisy szczytów renderują markdown zamiast plain text
- CSS: `overscroll-behavior: none` (blokada bounce iOS), `touch-action: manipulation` i `-webkit-touch-callout: none` na elementach interaktywnych (nie na mapie)
- Onboarding: 3-ekranowy (powitanie → adres domowy → sync/offline) zamiast jednego ekranu
- Dziennik: restrukturyzacja - timeline domyślnie otwarty, sekcje zgrupowane (statystyki, osiągnięcia)
- Kolapsowalne sekcje: obramowanie w kolorze akcentu gdy otwarte (toggleSection)
- Ostrzeżenia szlakowe: data relatywna, wygaszenie po 30 dniach, przycisk "nieaktualne"

### Poprawione
- PWA instalowalna na pulpicie (Chrome wymagał ikon PNG 192+512)
- Aplikacja działa offline (service worker cache'uje wszystkie zasoby)
- Przycisk zdobycia szczytu nie wymaga już zdjęcia (zdjęcie opcjonalne)
- Select szczytu: dwie grupy - "Do zdobycia" i "Zdobyte" z ✓
- Zapis parkingu z mapy: modal UI zamiast natywnego prompt()
- Popupy mapy: `var(--text2)` zamiast hardkodowanych `#888`/`#aaa` (lepszy kontrast w light mode)
- Przyciski w popupach mapy: większe cele dotykowe (min 44px)
- Przyciski sortowania w planerze: 36x36px zamiast 24x24px
- Podwójny atrybut `style` na "Co dalej?" w planerze (połączony)

---

## [1.4.0] - 2026-04-04 (dev)

### Dodane
- Przełącznik dark/light/system mode w ustawieniach (localStorage, per-device)
- Context switcher - klik w badge kontekstu otwiera popup z wyborem trybu (do testowania)
- Reverse geocoding adresu domowego (Mapy.com rgeocode API) - przycisk "📍 GPS" w ustawieniach
- Walidacja adresu domowego z geokodowaniem - zielony status z koordynatami lub czerwony błąd
- Geokodowanie adresu domowego persystowane w localStorage (`kgp_home_geo`), fallback na GPS
- Sekcja "Numery alarmowe" w ustawieniach - zwijana, z GPS, GOPR/TOPR dynamicznie per region, 112
- Sekcja "Co dalej?" w planerze - zwijana lista wszystkich niezdobytych szczytów z odległościami, 3 wyróżnione (najbliższy, najłatwiejszy, sezonowy) + reszta
- Odległości od domu przy szczytach w planerze (lista "Dodaj z listy" + "Co dalej?")
- Sortowanie szczytów po odległości od adresu domowego (fallback na GPS)
- Lepsze wyniki geokodowania - pełny adres (gmina, powiat, region) z Mapy.com API
- Ciekawostki przeniesione z dziennika na mapę (legenda, klik = nowa losowa)
- Scroll do nowo dodanej pozycji w planerze (smooth, block: center)
- Powiadomienie w planerze gdy GPS >50km od adresu domowego (np. urlop w Zakopanem)
- Warstwa parkingów na mapie - niebieskie "P", widoczne od zoom 10, toggle w legendzie, popup z nawigacją
- Nowy popup zdobytego szczytu - zdjęcie z lightboxem, data, notatka, przycisk do dziennika
- Nowy popup niezdobytego szczytu - trudność, parking, czas przejścia, odległość od domu, "Dodaj do planu"

### Zmienione
- Ustawienia: wszystkie sekcje zwijane (accordion) z bieżącą wartością w nagłówku
- Ustawienia: nowa kolejność (sync button → about → profil → adres → transport → tempo → motyw → sync → alarmowe → kopia → dane → instalacja)
- Tempo: 3 przyciski (Szybkie/Normalne/Spokojne) zamiast slidera z mnożnikiem
- SOS: przeniesione z osobnej zakładki do ustawień, usunięte przyciski tel:/sms:
- SOS: numery alarmowe dynamicznie per region (TOPR w Tatrach, odpowiednia grupa GOPR w innych pasmach)
- Dolna nawigacja: 6→5 zakładek (usunięta zakładka SOS)
- "Dashboard" → "Podsumowanie" (polski język)
- "Golden hour" → "Najlepszy czas na zdjęcia" (polski język)
- Oś czasu: usunięta wysokość przy nazwie szczytu
- Dziennik: zwijane sekcje (oś czasu, wyzwanie grupowe, historyczne wejście, druk zdjęć) - spójny styl z ustawieniami
- Dziennik: "Co dalej?" i "Ustawienia" jako link-karty ze strzałką (bez luźnych przycisków)
- Planer: "Co dalej?" zastępuje osobny "Szybki start" i stary "Co dalej?" z dziennika - jedno miejsce, zero duplikacji
- `toggleSection()` przeniesione z settings.js do utils.js (helper globalny)
- `renderJournalTimeline(inline)` - parametr inline zwraca zawartość bez wrappera card

### Usunięte
- Zakładka SOS z dolnej nawigacji (info przeniesione do ustawień)
- Kontakt ICE (osoba bliska) - niepotrzebny w tego typu aplikacji
- Pole dedykacji w formularzu historycznego wejścia
- Ciekawostki z dziennika (przeniesione na mapę)
- `renderNextSuggestions()` z ui.js (zduplikowana logika, zastąpiona sekcją w planerze)
- Stary `renderGroupChallenge()` zastąpiony przez `renderGroupChallengeCollapsible()`

### Poprawione
- Prognoza ukończenia KGP: daySpan liczone od pierwszego wpisu do teraz (nie do ostatniego), minimum 30 dni
- Kafelki pogody: 4 kolumny na mobile (4+3), 7 na desktop (już było w CSS)
- `_homeGeo` persystowane w localStorage (wcześniej ginęło po odświeżeniu strony)

---

## [1.3.0] - 2026-04-03 (dev)

### Dodane
- Panel administracyjny (panel.html) z autoryzacja PIN
  - Dashboard: statystyki, aktywnosc uzytkownikow
  - Zarzadzanie uzytkownikami, ciekawostkami, ostrzezeniami
  - Galeria zdjec z filtrami (szczyt, typ)
  - Stan systemu: sprawdzanie polaczenia, spojnosci danych, tabel
  - Przegladarka surowych danych z Supabase
- System kontekstowy (Adaptive UI) - 4 tryby automatyczne
  - 🏠 Planowanie (dom, brak GPS)
  - 🚗 W trasie (predkosc >15 km/h)
  - 🥾 Na szlaku (<5km od szczytu, pieszy)
  - 🏔️ Na szczycie (<200m, niska predkosc)
  - Badge kontekstowy nad dolna nawigacja
  - Debounce 3 odczytow (~45s) zapobiegajacy skakaniu GPS
- Strona informacyjna (about.html) z dark/light mode
- Animacja przejscia miedzy stronami (opacity fade 150ms)
- Wskaznik offline (czerwony pasek u gory)
- Przycisk scroll-to-top na dlugich stronach
- Przycisk instalacji PWA w ustawieniach
- Easter egg: 5x tap na wersje → panel admina
- Zapamietywanie ostatniej zakladki i filtru listy
- Dokumentacja projektowa (DOCS.md)
- System migracji danych (wersjonowanie schematu state)

### Zmienione
- Mapa: kafelki z `lang=pl` (poprawka "Polsko" → "Polska")
- Mapa: domyslny zoom 8, centrum [50.0, 19.5]
- Filtry listy: zawijanie (flex-wrap) zamiast przewijania
- Ustawienia: przeniesienie kontaktu ICE z Ustawien do SOS
- Ustawienia: "sync" → "kod dostepu", "backup" → "kopia zapasowa"
- Ustawienia: dodano link do about.html, podpis autora

### Poprawione
- Wysokosci 6 szczytow wg Wikipedii: Snieznik 1423, Radziejowa 1266, Kowadlo 989, Jagodna 977, Czupel 931, Chelmiec 850
- Koordynaty Czupel (49.7679, 19.1610) - wskazy waly na zla gore
- Parking Skopiec (50.9398, 15.8778) - zweryfikowany w terenie
- Parking Skalnik: 2 parkingi (glowny + zachodni)
- Polskie diakrytyki w tekstach UI

---

## [1.2.0] - 2026-03-28

### Dodane
- Waypoints w routingu (via schronisko, przystanek)
- Zapisywanie tras z geometria (state.savedRoutes)
- geocodeNear() - szukanie miejsc w poblizu punktu
- Strona historii wejsc
- Style modali
- Aktualizacja ikon

---

## [1.1.0] - 2026-03-25

### Dodane
- Funkcje 13-29: karta zdobycia, osiagniecia, timeline, lightbox, dashboard, wydruk, pakowanie, ciekawostki, nawigacja na parking, okno pogodowe, restauracje, wyzwanie grupowe, tracker, ostrzezenia szlakowe, wpisy historyczne
- Filtr regionow "Inne" na liscie szczytow

### Poprawione
- Polskie diakrytyki w tekstach UI
- Usunieto filtr "Zdobyte" (redundantny)

---

## [1.0.0] - 2026-03-20

### Dodane
- 12 nowych funkcji: SOS, pogoda, kalkulator kalorii, streak, prognoza ukonczenia, porownanie, onboarding, dark theme, micro-interactions
- Poprawki bledow

---

## [0.3.0] - 2026-03-15

### Dodane
- Integracja Mapy.com: routing pieszy i samochodowy, geocoding parkingow
- Widok planowania z timeline

---

## [0.2.0] - 2026-03-10

### Dodane
- Synchronizacja Supabase: sync code, profil, zdjecia
- Schemat bazy danych (schema.sql)

---

## [0.1.0] - 2026-03-05

### Dodane
- Refaktoring: podzial monolitycznego index.html na moduly JS
- Struktura: data.js, state.js, utils.js, ui.js, map.js, router.js

---

## [0.0.1] - 2026-03-01

### Dodane
- Poczatkowa wersja aplikacji: mapa 28 szczytow, lista, dziennik
- Leaflet + Mapy.com kafelki
- localStorage persistence

---

*Daty przyblizone na podstawie historii git.*
