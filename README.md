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
├── index.html       # Cala aplikacja (SPA)
├── manifest.json    # Konfiguracja PWA
├── sw.js            # Service Worker
├── schema.sql       # Schemat bazy danych Supabase
├── .gitignore       # Wykluczenia git
└── README.md        # Dokumentacja
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

## Branche

- `main` - wersja produkcyjna (GitHub Pages)
- `dev` - branch roboczy, zmiany testowane lokalnie

## Licencja

Projekt prywatny. Wszelkie prawa zastrzezone.

## Autor

[@gresmopl](https://github.com/gresmopl)
