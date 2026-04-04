# KGP App - User Stories

Data utworzenia: 2026-04-04
Zrodlo: QA-FEEDBACK.md + analiza kodu

---

## Legenda

- **Priorytet**: 🔴 krytyczny | 🟠 wysoki | 🟡 sredni | 🟢 niski
- **Rozmiar**: S (kilka godzin) | M (1-2 dni) | L (3-5 dni) | XL (tydzien+)
- **Status**: [ ] do zrobienia | [~] w trakcie | [x] zrobione

---

## SYNC - Synchronizacja danych

### SYNC-1: Dwukierunkowa synchronizacja 🔴 L
**Jako** uzytkownik z dwoma urzadzeniami (Chrome + Samsung Browser)
**chce** aby dane synchronizowaly sie w obie strony
**zeby** plan wpisany na jednym telefonie byl widoczny na drugim.

**Kryteria akceptacji:**
- [ ] "Wymus synchronizacje" pobiera dane z chmury PRZED wyslaniem lokalnych
- [ ] Scalone dane: union szczytow, journal (nowszy wpis wygrywa), trips (po id + updatedAt), discoveredPlaces
- [ ] Skalary (nazwa, adres): lokalne maja priorytet, ale puste pola bierze z chmury
- [ ] Po synchronizacji oba urzadzenia maja identyczne dane
- [ ] Toast informuje o wyniku: "Zsynchronizowano (pobrano X, wyslano Y)" lub blad

**Uwagi:**
- Obecny `syncToCloud()` robi tylko push (upsert), `pullFromCloud()` tylko pull z nadpisaniem
- Trzeba dodac `mergeAndSync()` ktory robi pull → merge → push
- Zdjecia w journal maja `photo: undefined` przy sync - to osobny problem (SYNC-2)

---

### SYNC-2: Zdjecia nie gina przy synchronizacji 🔴 M
**Jako** uzytkownik ktory zrobil zdjecie na szczycie
**chce** aby zdjecie bylo dostepne po synchronizacji na drugim urzadzeniu
**zeby** moc je wydrukować i ogladac w dzienniku.

**Kryteria akceptacji:**
- [ ] `getStateForSync()` nie usuwa URL zdjecia z journal (moze usuwac base64, ale zachowac URL z Supabase Storage)
- [ ] Po pull z chmury, journal entries maja dzialajace linki do zdjec
- [ ] Przycisk "Drukuj zdjecia" widoczny gdy sa wpisy ze zdjeciami w Storage
- [ ] Miniaturki na osi czasu dzialaja na Chrome i Samsung Browser

**Uwagi:**
- Obecnie `photo: undefined` w `getStateForSync()` - po pull zdjecie znika
- Trzeba rozroznic `photo` (base64 lokalne) od `photoUrl` (URL z Supabase Storage)
- Powiazane: BUG-3, BUG-7

---

## PLANER - Planer wypraw

### PLAN-1: Przeliczanie tras i czasow 🔴 XL
**Jako** turysta planujacy wyprawe z wieloma przystankami
**chce** aby planer obliczal realne czasy i odleglosci miedzy punktami
**zeby** wiedziec o ktorej wyjade, o ktorej bede na szczycie i o ktorej wroce.

**Kryteria akceptacji:**
- [ ] Kazda pozycja na liscie ma koordynaty GPS (wlasne lub odziedziczone z poprzedniej pozycji)
- [ ] Start: koordynaty z GPS lub wybrane z mapy (nie sam tekst adresu)
- [ ] Przejazd: czas obliczany z API Mapy.com (car_fast) na podstawie koordynatow start → cel
- [ ] Podejscie/zejscie: czas z danych trasy szczytu (trail.up/down) lub z API (foot_hiking)
- [ ] Przycisk "Przelicz trase" odpytuje API i aktualizuje wszystkie czasy w wyprawie
- [ ] Godziny pokazuja sie dopiero PO przeliczeniu (nie "z czapy")
- [ ] Jezeli brak koordynatow - pozycja oznaczona jako "wymaga uzupelnienia"

**Uwagi:**
- Nie liczyc na biezaco (kosztowne API calls przy kazdej zmianie)
- Lepiej przycisk "Przelicz" lub automatycznie przy "Zapisz/Zatwierdz"
- Koordynaty parkingu juz sa w PEAKS[].routes[].parking.lat/lon
- Podejscie powinno brac koordynaty z parkingu powyzej, zejscie z szczytu powyzej

---

### PLAN-2: Mechanika pozycji - reguly typow 🟠 M
**Jako** uzytkownik budujacy plan
**chce** aby typy pozycji mialy logiczne ograniczenia
**zeby** nie zrobic glupiego bledu jak przesuniecie startu na koniec.

**Kryteria akceptacji:**
- [ ] Start (🏠) - zawsze pierwszy, nie da sie przesunac w dol ani usunac
- [ ] Koniec (🏁) - zawsze ostatni, nie da sie przesunac w gore ani usunac
- [ ] Edycja startu: etykieta "Edytuj start wyprawy" (nie "Edytuj przystanek")
- [ ] Start nie pokazuje "Czas trwania" (bez sensu na punkcie startowym)
- [ ] Podejscie/zejscie: automatycznie powiazane ze szczytem (nie reczne)

---

### PLAN-3: UX przyciskow i scrollowania 🟠 M
**Jako** uzytkownik na malym telefonie
**chce** wygodnie edytowac plan bez frustracji
**zeby** planowanie nie bylo walka z interfejsem.

**Kryteria akceptacji:**
- [ ] Przyciski akcji (edycja, przesun, usun) sa wystarczajaco duze na telefonie (min. 44x44px)
- [ ] Alternatywna interakcja: swipe lub long press z menu kontekstowym
- [ ] Po dodaniu nowej pozycji widok scrolluje do niej (nie na poczatek)
- [ ] Pole nazwy wyprawy wyglada jak pole edycyjne (border, placeholder, kursor)

---

### PLAN-4: Geokodowanie - rozroznialne wyniki 🟡 S (zrobione)
**Jako** uzytkownik szukajacy adresu na mapie
**chce** odroznic wyniki wyszukiwania
**zeby** wybrac wlasciwy adres a nie losowy.

**Kryteria akceptacji:**
- [x] Wyniki geokodowania pokazuja pelny adres (ulica + gmina + powiat + region z Mapy.com API)
- [x] Jezeli to ten sam adres w roznych miastach - jasne rozroznienie
- [x] Wyniki posortowane po odleglosci (preferNear z API Mapy.com)

---

### PLAN-5: Lista szczytow z odleglosciami 🟡 S (zrobione)
**Jako** uzytkownik wybierajacy szczyt do planu
**chce** widziec odleglosc od mojego adresu domowego
**zeby** szybko ocenic ktore szczyty sa blisko a ktore daleko.

**Kryteria akceptacji:**
- [x] Lista szczytow w "Dodaj z listy" pokazuje odleglosc w km od adresu domowego
- [x] Odleglosc liczona w linii prostej * 1.3 (wspolczynnik krętosci drog)
- [x] Posortowane po odleglosci (gdy adres domowy dostepny)
- [ ] Tylko niezdobyte szczyty (lub oznaczenie zdobytych)

---

### PLAN-6: Szybki start - pelna lista 🟡 S (zrobione)
**Jako** uzytkownik ktory chce szybko zaplanowac wyjazd
**chce** widziec wszystkie niezdobyte szczyty w szybkim starcie
**zeby** nie musiec szukac w osobnej liscie.

**Kryteria akceptacji:**
- [x] Szybki start pokazuje wszystkie niezdobyte szczyty
- [x] Posortowane po odleglosci od adresu domowego (z odlegloscia w km)
- [x] Jedno klikniecie tworzy gotowy plan

---

### PLAN-7: Wspolne planowanie wypraw 🟠 XL
**Jako** turysta planujacy wyjazd z przyjaciolmi
**chce** udostepnic plan wyprawy i pozwolic innym dolaczyc
**zeby** kazdy mial ten sam plan, ale z wlasnym punktem startowym.

**Kryteria akceptacji:**
- [ ] Tworca wyprawy moze udostepnic plan kodem lub linkiem
- [ ] Uczestnik pobiera plan i widzi go w swoim planerze
- [ ] Kazdy uczestnik moze dodac swoja pozycje startowa na gorze listy
- [ ] Wspolna czesc planu (od spotkania do rozejscia) jest wspoldzielona
- [ ] Zmiany tworcy sa widoczne dla uczestnikow po synchronizacji
- [ ] Lista uczestnikow widoczna w planie
- [ ] Ranking zdobytych szczytow jako opcjonalny widok (nie glowna funkcja)

**Uwagi:**
- Zastepuje obecne "Wyzwania grupowe" (ranking X/28)
- Wymaga nowej tabeli w Supabase (shared_trips juz istnieje)
- Przeniesc z dziennika do zakladki Plany

---

## MAPA - Widok mapy

### MAPA-1: Parkingi na mapie 🟢 M (zrobione)
**Jako** turysta przegladajacy mape
**chce** widziec zapisane parkingi
**zeby** orientowac sie gdzie zaczac szlak.

**Kryteria akceptacji:**
- [x] Parkingi z PEAKS[].routes[].parking wyswietlane na mapie
- [x] Ikona: niebieskie kolko z "P"
- [x] Klikniecie w parking: nazwa, notatka, nawiguj (Mapy.com)
- [x] Parkingi widoczne od zoom 10 (nie zasmiecaja mapy)
- [x] Mozliwosc wlaczenia/wylaczenia warstwy parkingow (checkbox w legendzie)

---

### MAPA-2: Popup zdobytego szczytu - widok wspomnienia 🟢 M (zrobione)
**Jako** turysta ktory zdobyl szczyt
**chce** po kliknieciu w zielone kolko zobaczyc wspomnienie
**zeby** poczuc satysfakcje i przypomniesc sobie ten dzien.

**Kryteria akceptacji:**
- [x] Zdjecie ze zdobycia (miniaturka z lightboxem)
- [x] Data zdobycia
- [x] Notatka z dziennika (jesli jest, do 80 znaków)
- [x] Przycisk "Dziennik" (otwiera szczegoly szczytu)
- [x] BEZ: combo wyboru szczytu, szlaku glownego, planera, trybu szczytu
- [x] Przycisk ponownego wejscia (ikona 🔄, przenosi do planera)

---

### MAPA-3: Popup niezdobytego szczytu - lekki i informacyjny 🟢 M (zrobione)
**Jako** turysta przegladajacy mape
**chce** szybko zobaczyc kluczowe info o szczycie
**zeby** zdecydowac czy chce go zdobyc.

**Kryteria akceptacji:**
- [x] Nazwa, wysokosc, pasmo, trudnosc (kolorowa etykieta)
- [x] Najblizszy parking (nazwa)
- [x] Odleglosc od adresu domowego (~km)
- [x] Czas przejscia (dystans + czas + przewyzszenie)
- [x] Przycisk "Dodaj do planu" (przenosi do planera)
- [x] BEZ: duplikatu planera, trybu szczytu, szczegolowego widoku trasy

---

### MAPA-4: Ciekawostka na mapie 🟢 S (zrobione)
**Jako** uzytkownik przegladajacy mape
**chce** zobaczyc losowa ciekawostke o KGP
**zeby** sie czegos nauczyc podczas eksploracji.

**Kryteria akceptacji:**
- [x] Ciekawostka wyswietlana na mapie (w legendzie, lewy dolny rog)
- [x] Mozliwosc odswiezenia (klik = nowa losowa)
- [x] Nie przeszkadza w korzystaniu z mapy (dyskretna, w legendzie)

---

## SZCZYT - Tryb szczytu (na gorze)

### SZCZYT-1: Kontekstowy powrot ze szczytu 🟠 L
**Jako** turysta stojacy na szczycie
**chce** dostac pomoc w bezpiecznym powrocie
**zeby** zejsc przed zmrokiem i trafic do samochodu/przystanku.

**Kryteria akceptacji:**
- [ ] Przy rozpoczeciu wejscia: zapisanie koordynatow GPS punktu startowego (parking/przystanek/dowolny)
- [ ] Na szczycie: przycisk "Wracam" zamiast "Wyznacz trase"
- [ ] "Wracam" pokazuje: trase do zapisanego punktu startowego (nie domyslnego parkingu)
- [ ] Czas do zachodu slonca + ile czasu zostalo na zejscie
- [ ] Ostrzezenie jesli czas zejscia > czas do zachodu (zwlaszcza zima)
- [ ] BEZ: "dojazd do parkingu" i "wejscie na szczyt" (jestesmy JUZ na szczycie)

---

### SZCZYT-2: Pieczatki niezalezne od trasy 🟡 M (wymaga zmian w data.js)
**Jako** turysta ktory przyszedl inna trasa niz domyslna
**chce** widziec pieczatki istotne dla mojej trasy
**zeby** nie dostawac informacji o Morskim Oku gdy szedlem od strony slowackiej.

**Kryteria akceptacji:**
- [ ] Pieczatki pogrupowane per trasa (jesli szczyt ma wiele tras)
- [ ] Wyswietlane tylko pieczatki na trasie ktora uzytkownik wybral/szedl
- [ ] Lub: wszystkie pieczatki z oznaczeniem ktorej trasy dotycza

**Uwagi:**
- Tylko Rysy maja 2 trasy. Wymaga dodania pola `routeIndex` do kazdej pieczatki w data.js
- Nie da sie zrobic jako quick fix - wymaga zmian struktury danych

---

### SZCZYT-3: Propozycje na zejscie 🟢 M
**Jako** turysta schodzacy ze szczytu
**chce** wiedziec co moge zobaczyc po drodze
**zeby** wykorzystac pozostaly czas.

**Kryteria akceptacji:**
- [ ] Na podstawie czasu do zachodu: lista atrakcji/punktow mozliwych do odwiedzenia
- [ ] Uwzglednienie pory roku (zima = krotszy dzien, priorytet bezpieczenstwo)
- [ ] Tylko jesli zostaje wystarczajaco czasu (nie sugeruj atrakcji gdy trzeba spieszyc sie na dol)

---

## DZIENNIK

### DZIENNIK-1: Poprawki interfejsu 🟡 S (zrobione)
**Jako** uzytkownik przegladajacy dziennik
**chce** aby interfejs byl czytelny i spolny
**zeby** latwo sie orientowac.

**Kryteria akceptacji:**
- [x] "Dashboard" → "Podsumowanie"
- [x] Os czasu: bez wysokosci gory przy nazwie
- [x] Tempo szczytow/miesiac: poprawna wartosc obliczenia
- [x] Formularz historycznego wejscia: bez pola dedykacji
- [x] Zwijane sekcje: os czasu, wyzwanie grupowe, historyczne wejscie, druk zdjec
- [x] Link-karty: "Co dalej?" → planer, "Ustawienia" → settings (spojny styl)

---

## USTAWIENIA

### USTAW-1: Przelacznik dark/light mode 🟠 S
**Jako** uzytkownik
**chce** recznie zmienic motyw jasny/ciemny
**zeby** nie zalezec od ustawien systemowych.

**Kryteria akceptacji:**
- [ ] Przelacznik w ustawieniach: Jasny / Ciemny / Systemowy (domyslnie)
- [ ] Zmiana natychmiastowa bez przeladowania
- [ ] Zapisywane do localStorage (persystowane)

---

### USTAW-2: Reorganizacja ustawien 🟡 M (zrobione)
**Jako** uzytkownik
**chce** aby najwazniejsze opcje byly na gorze
**zeby** nie scrollowac w poszukiwaniu potrzebnej funkcji.

**Kryteria akceptacji:**
- [x] Wszystkie sekcje zwijane (accordion) z biezaca wartoscia w naglowku
- [x] Kolejnosc: sync button → about → profil → adres → transport → tempo → motyw → sync → alarmowe → kopia → dane → instalacja
- [x] "Zainstaluj na telefonie" na koncu
- [x] Adres: walidacja geokodowaniem, przycisk GPS, persystowane koordynaty

---

### USTAW-3: Tempo chodzenia - intuicyjny format 🟡 S
**Jako** uzytkownik ustawiajacy swoje tempo
**chce** rozumiec co oznacza wybrana wartosc
**zeby** nie mylic "1.5x" z "szybciej" gdy oznacza "wolniej".

**Kryteria akceptacji:**
- [ ] Zamiast mnoznika "1.5x" - opis slowny lub procent predkosci
- [ ] Np. slider z etykietami: "Szybki (70% czasu)" ... "Sredni (100%)" ... "Wolny (150% czasu)"
- [ ] Lub: "Twoje tempo: ~4.5 km/h" obok slidera (przeliczone z mnoznika)
- [ ] Podpowiedz: "Dla wiekszosci turystow: sredni"

---

### USTAW-4: Transport - wplyw na cala aplikacje 🟡 M
**Jako** uzytkownik podrozujacy komunikacja publiczna
**chce** aby wybor PKP/PKS byl uwzgledniany wszedzie
**zeby** nie dostawac informacji o parkingach gdy jade pociagiem.

**Kryteria akceptacji:**
- [ ] Mapa: popup szczytu pokazuje stacje zamiast parkingu (przy PKP)
- [ ] Planer: "Przejazd" uwzglednia PKP/PKS (e-podroznik, czas przejazdu)
- [ ] Tryb szczytu: "Wroc do przystanku" zamiast "Wroc do parkingu"
- [ ] Lub: przelacznik przeniesiony z ustawien globalnych do kontekstu (per wyprawa)

---

## POGODA

### POGODA-1: Kafelki prognozy na telefonie 🟡 S (zrobione)
**Jako** uzytkownik na telefonie
**chce** widziec cala prognoze bez scrollowania w bok
**zeby** porownac dni i wybrac najlepszy.

**Kryteria akceptacji:**
- [x] Kafelki nie wychodza poza ekran na telefonie (grid 4 kolumn mobile, 7 desktop)
- [ ] Opcjonalnie: w ustawieniach wybor 3/5/7 dni

---

### POGODA-2: "Golden hour" po polsku 🟢 S (zrobione)
**Jako** uzytkownik
**chce** widziec polskie nazwy w UI
**zeby** aplikacja byla spojna jezykowo.

**Kryteria akceptacji:**
- [x] "Golden hour" → "Najlepszy czas na zdjecia"

---

## PAKOWANIE

### PAK-1: Kontekstowa lista pakowania 🟡 L
**Jako** turysta pakujacy sie na wyprawe
**chce** dostac liste rzeczy dopasowana do mojej wyprawy
**zeby** nie zabrac za duzo na Skopiec ani za malo na Rysy zima.

**Kryteria akceptacji:**
- [ ] Lista generowana na podstawie: szczytu, daty (pora roku), prognozy pogody, czasu przejscia
- [ ] Zima + ujemna temperatura: cieple ubranie, termos, czolowka, folia NRC, odblask
- [ ] Trudny teren (alpine/exposed): raczki/raki, kask (Rysy), dlugie spodnie
- [ ] Krotkie wejscie (< 1h): minimalna lista (0.5l wody, lekkie buty OK)
- [ ] Dlugie wejscie (> 4h): pelna lista (1.5l+ wody, jedzenie, apteczka)
- [ ] Deszcz w prognozie: kurtka przeciwdeszczowa, pokrowiec na plecak
- [ ] Nie podawac oczywistosci - lepiej mniej ale trafnych

---

## SOS

### SOS-1: Tryb informacyjny zamiast akcji 🟠 S (zrobione)
**Jako** uzytkownik
**chce** aby SOS nie pozwalal na przypadkowe wyslanie SMS/telefonu do GOPR
**zeby** nie spowodowac falszywego alarmu.

**Kryteria akceptacji:**
- [x] Usunac przyciski tel: i sms: (bezposrednie dzwonienie/wysylanie)
- [x] Zostaja numery telefonow jako tekst (do recznego przepisania)
- [x] Informacja: "Do alarmowania uzyj aplikacji Ratunek (GOPR/TOPR)"
- [x] Przeniesione do ustawien jako zwijana sekcja "Numery alarmowe"
- [x] Zwolnione miejsce w dolnej nawigacji (6→5 zakladek)
- [x] GOPR/TOPR dynamicznie per region (na podstawie nearbyPeak/selectedPeak)
- [x] Koordynaty GPS widoczne przed numerami

---

## PLANER - Architektura blokow (plan techniczny)

### Koncepcja

Kazda pozycja w planerze to "inteligentny blok" ktory:
- Wie co dostaje od bloku wyzej (WEJSCIE)
- Ma wlasne dane (WLASCIWOSCI)
- Wie co daje blokowi nizej (WYJSCIE)
- Ma reguly czego wymaga i co dopuszcza (REGULY)

Bloki tworza lancuch - zmiana jednego przelicza caly lancuch ponizej.

### Przeplyw danych w lancuchu

```
START (Dom, Krakow)
  wyjscie: GPS 50.06, 19.94 | godz. 6:00
     |
PRZEJAZD (auto)
  wejscie: GPS z STARTu → oblicz trase do nastepnego
  wyjscie: GPS celu | godz. 6:00 + czas przejazdu
     |
PARKING (Komary)
  wejscie: GPS z PRZEJAZDU (lub wlasne stale GPS)
  wyjscie: GPS parkingu | godz. + 10 min (przebranie)
     |
PODEJSCIE
  wejscie: GPS z PARKINGU
  wyjscie: GPS szczytu | godz. + czas trail.up
     |
SZCZYT (Skopiec)
  wejscie: GPS z PODEJSCIA (weryfikacja)
  wyjscie: GPS szczytu | godz. + 30 min (odpoczynek, zdjecia)
     |
ZEJSCIE
  wejscie: GPS szczytu
  wyjscie: GPS parkingu | godz. + czas trail.down
     |
KONIEC
  wejscie: GPS + czas = podsumowanie dnia
```

### Reguly per typ bloku

| Typ | Pozycja | Zrodlo GPS | Czas trwania | Przed nim | Po nim |
|-----|---------|------------|-------------|-----------|--------|
| START | pierwszy, staly | GPS/mapa/adres | 0 | nic | cokolwiek |
| PRZEJAZD | dowolna | cel = nastepny blok | API Mapy.com (car_fast) | START lub blok z GPS | blok z GPS |
| PARKING | dowolna | stale z PEAKS | konfigurowalny (domyslnie 10min) | PRZEJAZD | PODEJSCIE |
| PODEJSCIE | po PARKING | z parkingu wyzej | trail.up z PEAKS | PARKING | SZCZYT |
| SZCZYT | po PODEJSCIE | stale z PEAKS | konfigurowalny (domyslnie 30min) | PODEJSCIE | ZEJSCIE |
| ZEJSCIE | po SZCZYT | ze szczytu wyzej | trail.down z PEAKS | SZCZYT | PARKING/PRZEJAZD/KONIEC |
| NOCLEG | dowolna | wlasne/mapa | do rana (konfigurowalny) | cokolwiek | nowy dzien |
| RESTAURACJA | dowolna | wlasne/mapa | konfigurowalny (domyslnie 60min) | cokolwiek | cokolwiek |
| ATRAKCJA | dowolna | wlasne/mapa | konfigurowalny (domyslnie 60min) | cokolwiek | cokolwiek |
| PUNKT | dowolna | wlasne/mapa | konfigurowalny | cokolwiek | cokolwiek |
| KONIEC | ostatni, staly | z poprzedniego | 0 | cokolwiek | nic |

### Mega-blok szczytowy

PARKING → PODEJSCIE → SZCZYT → ZEJSCIE to jeden "mega-blok". Dodajesz szczyt z listy, dostajesz caly zestaw 4 pozycji. Wewnetrznie powiazane - nie da sie rozbic (np. usunac samo PODEJSCIE bez reszty). Usuwasz szczyt = usuwasz caly mega-blok.

### Hierarchia kontenerow

```
WYPRAWA "Weekend w Sudetach"
  |-- DZIEN 1
  |   |-- START (Dom)
  |   |-- PRZEJAZD
  |   |-- [PARKING → PODEJSCIE → SKOPIEC → ZEJSCIE]  <- mega-blok
  |   |-- RESTAURACJA (Glodomor)
  |   |-- [PARKING → PODEJSCIE → SKALNIK → ZEJSCIE]  <- mega-blok
  |   |-- NOCLEG (schronisko)
  |-- DZIEN 2
  |   |-- PRZEJAZD
  |   |-- ATRAKCJA (Zamek Ksiaz)
  |   |-- KONIEC (powrot do domu)
```

### Przeliczanie lancucha

Nie na biezaco (kosztowne API calls). Dwa tryby:
1. **Przycisk "Przelicz trase"** - uzytkownik klika, API oblicza czasy przejazdow i aktualizuje caly lancuch
2. **Przy zatwierdzeniu wyprawy** - automatyczne przeliczenie przed zapisem/udostepnieniem

Funkcja `recalcChain(stops)` idzie od gory do dolu:
- Kazdy blok dostaje (lat, lon, departureTime) z poprzedniego
- Oblicza swoj czas trwania (staly, z PEAKS, lub z API)
- Przekazuje (lat, lon, departureTime + duration) do nastepnego

Jesli blok nie ma koordynatow (np. dodany z listy bez mapy) - oznaczony jako "wymaga uzupelnienia", lancuch przerywa sie w tym miejscu.

### Implementacja w vanilla JS

Bez klas/modulow ES6. Wystarczy:
- Obiekt `BLOCK_RULES` z definicjami regul per typ (canMove, requiredBefore, requiredAfter, defaultDuration, gpsSource)
- Funkcja `recalcChain(stops)` propagujaca koordynaty i czasy
- Funkcja `validateChain(stops)` sprawdzajaca reguly (START pierwszy, KONIEC ostatni, PODEJSCIE po PARKINGU itp.)
- Funkcja `insertMegaBlock(stops, peakId, position)` dodajaca zestaw 4 pozycji
- Funkcja `removeMegaBlock(stops, peakId)` usuwajaca caly zestaw

Dane bloku:
```
{
  id: "uuid",
  type: "parking",         // typ bloku
  name: "Komary",          // nazwa wyswietlana
  lat: 50.123,             // koordynaty (wlasne lub odziedziczone)
  lon: 16.456,
  gpsSource: "peaks",      // skad GPS: "peaks" | "geocode" | "gps" | "inherited"
  duration: 10,            // czas trwania w minutach
  arrivalTime: null,       // obliczony przez recalcChain
  departureTime: null,     // obliczony przez recalcChain
  peakId: 15,              // powiazanie ze szczytem (dla mega-bloku)
  routeIndex: 0,           // ktora trasa szczytu
  note: "",                // notatka uzytkownika
  needsGps: false          // flaga "wymaga uzupelnienia"
}
```

---

## REFAKTOR - Porzadkowanie kodu

### REFAKTOR-1: Rozbicie features.js i features2.js na logiczne moduly 🟡 L
**Jako** developer
**chce** aby pliki JS mialy logiczne nazwy i zawartosc
**zeby** szybko znalezc kod i nie szukac po workach "features".

**Obecny stan:**
- `features.js` (~750 linii) - SOS, streak, forecast, benchmark, slonce, kalorie, onboarding, panorama, kamery, restauracje, karta zdobycia, osiagniecia, timeline, lightbox, dashboard
- `features2.js` (~500 linii) - druk zdjec, pakowanie, ciekawostki, parking, pogoda okno, restauracje, grupy, live tracker, ostrzezenia, historyczne wejscia

**Proponowany podzial:**

| Nowy plik | Zawartosc |
|-----------|-----------|
| `sos.js` | renderSOS, getGOPRForRange, ICE |
| `stats.js` | getStreakInfo, getCompletionForecast, getBenchmarkComparison, estimateCalories |
| `gallery.js` | renderJournalTimeline, openLightbox, renderDashboard, generateConquestCard, printPhotos |
| `achievements.js` | getUnlockedAchievements, renderAchievements, renderProgressPanorama, renderOnboarding |
| `packing.js` | getPackingList, renderPackingList |
| `social.js` | renderGroupChallenge, createGroup, joinGroup, leaveGroup |
| `tracker.js` | startTrailTracking, saveParkingLocation, renderWarningsSection |
| `history.js` | renderHistoryEntry, saveHistoryEntry, renderFunFact, findBestWeatherDay |

**Kryteria akceptacji:**
- [ ] Kazdy nowy plik ma jedna odpowiedzialnosc (nazwa = zawartosc)
- [ ] Kolejnosc ladowania skryptow w index.html zachowana (zaleznosci)
- [ ] Wszystkie funkcje dzialaja identycznie po przeniesieniu
- [ ] Stare pliki features.js i features2.js usuniete

**Uwagi:**
- Robic przy okazji wiekszych zmian w danym obszarze (np. przerabiasz SOS → wydziel sos.js)
- Nie robic calego refaktoru na raz - plik po pliku
- Pamietac o kolejnosci ladowania w index.html (data → state → utils → sync → ...)

---

## TESTOWANIE

### TEST-1: Context switcher do testowania 🟢 S (zrobione)
**Jako** tester/developer
**chce** przelaczac tryb kontekstu (planowanie/w trasie/na szlaku/na szczycie)
**zeby** testowac UI bez fizycznego bycia w gorach.

**Kryteria akceptacji:**
- [x] Klikniecie w badge kontekstu otwiera popup z wyborem trybu
- [x] Opcje: Auto (GPS) / Planowanie / W trasie / Na szlaku / Na szczycie
- [x] Override oznaczony ikona klucza 🔧 na badge
- [x] Override zyje tylko w sesji (nie persystowany)
- [x] Toast potwierdza zmiane trybu

---

*Ostatnia aktualizacja: 2026-04-04*
