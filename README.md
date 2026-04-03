# Korona Gor Polski - Asystent Zdobywcy

Progresywna aplikacja webowa (PWA) wspierajaca zdobywcow Korony Gor Polski - zestawu 28 najwyzszych szczytow poszczegolnych pasm gorskich w Polsce.

## Funkcjonalnosci

- **Mapa interaktywna** - wizualizacja wszystkich 28 szczytow z oznaczeniem zdobytych i pozostalych (Leaflet)
- **Planowanie wypraw** - informacje o parkingach, szlakach, czasie dojscia i transporcie publicznym
- **Prognoza pogody** - ocena warunkow na szlaku z uwzglednieniem terenu i wiatru
- **Tryb szczytowy** - nawigacja GPS, pieczatki, zdjecia, notatki ze szczytu
- **Dziennik zdobywcy** - historia wejsc ze zdjeciami i statystykami
- **Synchronizacja** - dane zsynchronizowane miedzy urzadzeniami przez Supabase (kod sync)
- **Tryb offline** - aplikacja dziala bez internetu, dane synchronizowane po polaczeniu
- **Tryb SOS** - koordynaty GPS, telefon GOPR/TOPR, SMS z lokalizacja, najblizsze schronisko
- **Wschod/zachod slonca** - ostrzezenie jesli zejscie po zmroku
- **Kalkulator kalorii** - szacunkowe spalanie na trasie
- **Passa zdobywcy** - streak, prognoza ukonczenia KGP, porownanie z innymi
- **Onboarding** - ekran powitalny dla nowych uzytkownikow
- **Karta zdobycia** - generowana grafika PNG ze zdjeciem, nazwa szczytu, postepem - do udostepnienia
- **System osiagniec** - 12 odznak (Zimowy wojownik, Maraton, Dach Polski i inne)
- **Timeline** - wizualna os czasu w dzienniku z miniaturkami zdjec i przerwami miedzy wejsciami
- **Lightbox** - pelnoekranowy podglad zdjec z nawigacja swipe
- **Dashboard** - wykresy: szczyty/miesiac, ulubiony dzien tygodnia, laczne km i kcal
- **Generator wydruku** - wydruk zdjec A4 w formacie 9x13cm z liniami ciecia
- **Pakuj sie!** - dynamiczna lista rzeczy do spakowania na podstawie terenu, trudnosci i pogody
- **Ciekawostki KGP** - losowe fakty o Koronie Gor Polski
- **Nawigacja powrotna** - zapisz lokalizacje parkingu i wroc do auta po zejsciu
- **Okno pogodowe** - automatyczna rekomendacja najlepszego dnia na wyjscie
- **Restauracje** - wyszukiwanie miejsc do jedzenia w okolicy parkingu (Google Maps)
- **Wyzwanie grupowe** - rywalizacja ze znajomymi w zdobywaniu KGP
- **Ostrzezenia szlakowe** - spolecznosciowe ostrzezenia o warunkach na szlaku
- **Strona informacyjna** - responsywna strona "O aplikacji" z opisem funkcji (about.html)
- **Panel administracyjny** - dashboard, zarzadzanie uzytkownikami, galeria zdjec, ostrzezenia, stan systemu (panel.html)

## Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Mapy | Leaflet 1.9.4 |
| Backend / Baza danych | Supabase (PostgreSQL) |
| Storage zdjec | Supabase Storage |
| Hosting | GitHub Pages |

## Struktura projektu

```
kgp-app/
├── index.html          # HTML + nawigacja (SPA)
├── about.html          # Strona informacyjna "O aplikacji"
├── panel.html          # Panel administracyjny (PIN)
├── css/
│   └── style.css       # Wszystkie style CSS
├── js/
│   ├── data.js         # PEAKS[], klucze API, stale
│   ├── state.js        # Stan aplikacji, localStorage, save()
│   ├── utils.js        # Funkcje pomocnicze, GPS, toast, confetti
│   ├── sync.js         # Supabase sync, login, upload zdjec
│   ├── weather.js      # Prognoza pogody (Open-Meteo API)
│   ├── map.js          # Leaflet mapa, Mapy.com routing
│   ├── ui.js           # Strony: lista, plan, szczyt, modal
│   ├── journal.js      # Dziennik, eksport/import
│   ├── settings.js     # Ustawienia
│   ├── features.js     # SOS, streak, prognoza, onboarding, kalorie, karta, osiagniecia, timeline, lightbox, dashboard
│   ├── features2.js    # Wydruk, pakowanie, ciekawostki, parking, pogoda, restauracje, grupy, tracker, ostrzezenia
│   └── router.js       # Nawigacja SPA, init
├── manifest.json       # Konfiguracja PWA
├── sw.js               # Service Worker
├── schema.sql          # Schemat bazy danych Supabase
├── IDEAS.md            # Pomysly i plan rozwoju
├── DOCS.md             # Dokumentacja projektowa analityczna
├── CHANGELOG.md        # Historia wersji
├── CLAUDE.md           # Instrukcje dla Claude Code
├── .gitignore          # Wykluczenia git
└── README.md           # Dokumentacja
```

## Uruchomienie lokalne

```bash
# Dowolny serwer HTTP, np.:
python -m http.server 8080

# lub
npx serve .
```

Aplikacja bedzie dostepna pod `http://localhost:8080`

> **Uwaga:** Service Worker wymaga protokolu HTTP/HTTPS. Otwarcie `index.html` bezposrednio z dysku (`file://`) nie obsluguje pelnej funkcjonalnosci PWA.

## Synchronizacja danych

Aplikacja dziala w trybie offline-first:

1. Dane zapisywane sa lokalnie w `localStorage`
2. Po uzyskaniu polaczenia z internetem synchronizowane sa z Supabase
3. Uzytkownik otrzymuje unikalny **kod sync** (np. `turbacz4821`) umozliwiajacy dostep do danych na innym urzadzeniu

## Baza danych (Supabase)

| Tabela | Opis |
|---|---|
| `profiles` | Profile uzytkownikow z kodami sync |
| `user_data` | Dane uzytkownika jako JSONB (szczyty, dziennik, ustawienia) |
| `photos` | Metadane zdjec (pliki w Supabase Storage) |
| `group_members` | Czlonkowie grup wyzwan z wynikami |
| `warnings` | Ostrzezenia szlakowe od uzytkownikow |

## Branche

- `main` - wersja produkcyjna (GitHub Pages)
- `dev` - branch roboczy, zmiany testowane lokalnie

## Licencja

Projekt prywatny. Wszelkie prawa zastrzezone.

## Autor

[@gresmopl](https://github.com/gresmopl)
