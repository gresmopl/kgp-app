# Changelog - Korona Gor Polski

Wszystkie istotne zmiany w projekcie. Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/).

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
