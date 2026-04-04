# KGP App - Uwagi z testowania

Data: 2026-04-04

---

## Bugi

### BUG-1: Synchronizacja nie merguje danych
- **Gdzie**: Ustawienia > Wymus synchronizacje
- **Co robie**: Mam ten sam kod (np. babia9010) na Chrome i Samsung Browser. Wpisuje dane na jednym, klikam synchronizuj, na drugim tez klikam synchronizuj.
- **Co sie dzieje**: Dane sa niezalezne - dwa rozne plany wyprawy mimo tego samego kodu.
- **Czego oczekuje**: Dane powinny sie scalac - co wpisze na jednym urzadzeniu, widze na drugim.
- **Przyczyna techniczna**: `syncToCloud()` robi tylko push (upsert), nigdy pull. Brak merge - drugie urzadzenie nadpisuje dane pierwszego.

### BUG-2: Tempo szczytow/miesiac bledna wartosc
- **Gdzie**: Dziennik > statystyki
- **Co sie dzieje**: "Tempo: 1.0 szczytow/miesiac" - wartosc 1.0 jest bledna.

### BUG-3: Os czasu - miniaturki zdjec nie dzialaja na Chrome
- **Gdzie**: Dziennik > Os czasu
- **Co sie dzieje**: Na Chrome brak miniaturek zdjec. Na Samsung Browser dzialaja poprawnie.

### BUG-4: Dedykacja nadal widoczna w historycznym wejsciu
- **Gdzie**: Dziennik > Wpisz historyczne wejscie
- **Co sie dzieje**: Pole dedykacji nadal jest widoczne, mialo byc usuniete.

### BUG-5: Planer - bledne odleglosci podejscia
- **Gdzie**: Planer > podejscie na szczyt
- **Co sie dzieje**: Podejscie na Skopiec pokazuje 5km mimo ze parking jest ~860m od szczytu. Pozycja na liscie nie pobiera koordynatow z pozycji wyzej (np. parkingu).
- **Czego oczekuje**: Kazda pozycja powinna dziedziczyc koordynaty z poprzedniej pozycji na liscie.

### BUG-6: Planer - czasy z czapy
- **Gdzie**: Planer > dowolna wyprawa
- **Co sie dzieje**: Godziny dojazdu/przejscia sa zahardkodowane, nie liczone na podstawie koordynatow i trasy. Dodanie nowych punktow nie zmienia czasow.

---

## UX / Interfejs

### UX-1: Brak przelacznika dark/light mode
- **Gdzie**: Ustawienia
- **Co jest**: Tryb zalezy od ustawien systemowych.
- **Czego oczekuje**: Reczny przelacznik w ustawieniach.

### UX-2: Widok zdobytego szczytu (zielone kolko na mapie) - nieadekwatny
- **Gdzie**: Mapa > klikniecie w zielone kolko
- **Co jest**: Szlak glowny, planuj wyjazd, szczegoly z combo wyboru szczytu i planerem.
- **Czego oczekuje**: Po zdobyciu - widok wspomnienia (zdjecie, data, dziennik), nie planowania. "Szlak glowny" nie mowi nic o tym jak ja to przeszedlem. Combo z lista szczytow przy kliknieciu na konkretny szczyt nie ma sensu.

### UX-3: Popup niezdobytego szczytu (pomaranczowe kolko) - przeladowany
- **Gdzie**: Mapa > klikniecie w pomaranczowe kolko
- **Co jest**: Szlak glowny bez kontekstu, planer (duplikuje dedykowany modul), przycisk trybu szczytu.
- **Czego oczekuje**: Lekki popup - nazwa, wysokosc, region, info o najblizszym parkingu, dojazd z uwzglednieniem preferencji transportu (auto/PKP). Bez planera i trybu szczytu.

### UX-4: Tryb szczytu - brak kontekstu
- **Gdzie**: Tryb szczytu (np. Rysy)
- **Problemy**:
  - Miejsca pieczatek zakladaja konkretna trase (np. Morskie Oko) - a co jesli ktos przyszedl od strony slowackiej?
  - "Wyznacz trase" z opcjami "dojazd do parkingu / wejscie na szczyt" - nie ma sensu NA szczycie
  - "Wroc do parkingu" zaklada auto - a co jesli ktos jest PKP?
- **Czego oczekuje**:
  - Opcja zejscia/powrotu do punktu startu (GPS zapisany na poczatku wejscia, nie domyslny parking)
  - Uwzglednienie czasu do zachodu slonca (dane juz sa)
  - Propozycje co mozna zobaczyc po drodze w ramach pozostalego czasu
  - Pora roku: zima = musisz zdazic przed zmrokiem

### UX-5: Os czasu - zbedna wysokosc gory
- **Gdzie**: Dziennik > Os czasu
- **Co jest**: Przy nazwie gory wyswietlana jest jej wysokosc.
- **Czego oczekuje**: Sama nazwa, bez wysokosci.

### UX-6: Wyzwania grupowe - do calkowitej przerobki
- **Gdzie**: Dziennik > Wyzwania grupowe
- **Co jest teraz**: Tylko ranking zdobytych szczytow (tablica wynikow). Tworzysz grupe kodem, kazdy synchronizuje swoja nazwe i liczbe szczytow, wyswietla ranking X/28. Zero interakcji poza tym.
- **Czego oczekuje**: Przeniesc do zakladki Plany. Calkowita zmiana koncepcji:
  - Istota: **wspolne planowanie wypraw** - ktos konfiguruje wyprawe, udostepnia kodem/linkiem, inni pobieraja plan
  - Kazdy uczestnik moze dodac swoja pozycje startowa na gorze listy (np. "jade z Wrocławia"), reszta planu wspolna
  - Ranking zdobytych moze zostac jako dodatkowa funkcja, ale nie glowna
  - Potrzebna: synchronizacja planow przez Supabase, powiadomienia o zmianach, lista uczestnikow wyprawy

### UX-7: Szybki start - niekompletna lista
- **Gdzie**: Planer > Szybki start
- **Co jest**: Pokazuje kilka wybranych szczytow.
- **Czego oczekuje**: Wszystkie niezdobyte szczyty. Albo zastapic ta opcje wspolnym planowaniem.

### UX-8: "Dashboard" po angielsku
- **Gdzie**: Dziennik
- **Czego oczekuje**: Polska nazwa (np. "Podsumowanie" lub "Przeglad"). Zasada: polski jezyk w UI.

### UX-9: Ciekawostki nie na miejscu
- **Gdzie**: Dziennik (na dole)
- **Czego oczekuje**: Przeniesc na gore zakladki Mapa - kontekst eksploracji, nie historii.

### UX-10: Ustawienia - kolejnosc i layout
- **Gdzie**: Ustawienia
- **Problemy**:
  - "Zainstaluj na telefonie" na gorze - jednorazowa akcja, powinna byc na koncu
  - "Synchronizacja" za nisko - wazna funkcja, powinna byc zaraz po "O aplikacji"
  - "Kopia zapasowa" i "Dane lokalne" - zajmuja miejsce, a uzywa sie rzadko. Zwinac domyslnie (naglowek widoczny, rozwijane po kliknieciu)
  - Info o wersji / easter egg panelu admina na samym dole - trzeba daleko scrollowac

### UX-11: Tempo chodzenia - nieintuicyjny zapis
- **Gdzie**: Ustawienia > Tempo chodzenia
- **Co jest**: Slider z wartoscia "1.5x" przy "Wolny".
- **Problem**: 1.5x sugeruje "1.5 razy szybciej", a oznacza odwrotnie (mnoznik czasu).
- **Czego oczekuje**: Bardziej zrozumialy format - np. procenty predkosci, minuty/km, lub odwrocona skala.

### UX-12: Przelacznik Samochod/Komunikacja - ograniczony zasieg
- **Gdzie**: Ustawienia > Transport
- **Co jest**: Wplywa tylko na widok szczegolow szczytu (parking vs stacja PKP).
- **Czego oczekuje**: Albo rozszerzyc na cala aplikacje (mapa, planer, tryb szczytu, popupy), albo przeniesc z ustawien globalnych do widoku szczytu jako lokalny przelacznik.

---

## Parkingi na mapie

### FEATURE-1: Parkingi widoczne na mapie
- **Gdzie**: Mapa
- **Co jest**: Tylko szczyty (zielone/pomaranczowe kolka).
- **Czego oczekuje**: Zapisane parkingi jako niebieskie kolka z "P".

---

## Planer - Story Tell

### Scenariusz: Planowanie jednodniowej wyprawy na Skopiec (poniedzialek na sobote)

**Kontekst**: Uzytkownik siada w poniedzialek wieczorem i planuje sobotnia wyprawe z kolegami.

**Przebieg krok po kroku:**

1. **Klikam Plany > Moje wyprawy > Nowa wyprawa**
   - Nazwa wyprawy wyglada jak napis, nie jak pole edycyjne - nie wiadomo ze mozna zmienic

2. **Punkt startowy - adres domowy z ustawien**
   - Klikam edycja, napis "Edytuj przystanek" - to nie przystanek, to start wyprawy
   - "Czas trwania" - po co na punkcie startowym?
   - Godzina i notatki OK
   - Adres startowy powinien byc koordynata GPS (z GPS lub wybrany z mapy), z opisem tekstowym "Dom" i adresem. Nie sam tekst

3. **Dodaje kolege po ktorego jade (Strzelin)**
   - Opcja "Przejazd" pasuje do tej roli - OK
   - Dodaje "Punkt" z listy, wpisuje "Strzelin" - ale czasy sie nie zmieniaja
   - Dodaje z mapy "Strzelin, ul. Sienkiewicza 8" - znajdzie kilka wynikow ale lista nierozroznialna (same "ul. Sienkiewicza" bez numerow/miast)

4. **Wybieram szczyt Skopiec**
   - Na liscie szczytow do wyboru brakuje odleglosci od adresu domowego (chocby w linii prostej * wspolczynnik)
   - Dodaje - system automatycznie tworzy 4 pozycje (parking, podejscie, szczyt, zejscie) - dobrze!

5. **Czasy i odleglosci sa bledne**
   - Godzina dojazdu do parkingu - z czapy, nie liczona z koordynatow
   - Podejscie na Skopiec: 5km zamiast ~860m - nie uzywa koordynatow parkingu z pozycji wyzej
   - Zejscie nie ma koordynatow celu (samochod/przystanek)
   - **Propozycja**: Nie liczyc na biezaco. Przycisk "Przelicz trase" ktory odpytuje API marszruty i oblicza realne czasy. Albo przeliczanie przy "zatwierdzeniu" wyprawy.

6. **Dodaje restauracje (Glodomor, Janowice Wielkie)** - OK

7. **Dodaje drugi szczyt (Skalnik)** - bledne czasy wejscia z parkingu

8. **Odstawienie kolegi do Strzelina + atrakcja Zamek Ksiaz**
   - Wybieram "Atrakcja", wpisuje "Ksiaz" - OK
   - Dodaje "Koniec"
   - Czasy calkowicie bez sensu

**Wnioski ogolne o planerze:**
- Planer ma dobra strukture (typy przystankow, auto-dodawanie parkingu/podejscia/szczytu/zejscia)
- Glowny problem: **brak przeliczania tras i czasow** na podstawie rzeczywistych koordynatow
- Kazda pozycja powinna dziedziczyc koordynaty z poprzedniej (parking → podejscie, szczyt → zejscie)
- Pole nazwy wyprawy nie wyglada na edytowalne
- Etykiety nie pasuja do kontekstu ("Edytuj przystanek" na punkcie startowym)
- Lista wynikow geokodowania nierozroznialna
- Lista szczytow bez odleglosci
- Potrzebny mechanizm przeliczania calej trasy (nie na biezaco, a na zadanie lub przy zatwierdzeniu)
- To jest wersja jednodniowa - wielodniowe beda jeszcze bardziej wymagajace

---

## Planer - dodatkowe uwagi

### PLANER-1: Mechanika pozycji - ograniczenia przesuwania
- Start nie powinien dac sie przesunac nizej (zawsze pierwszy)
- Koniec nie powinien dac sie przesunac wyzej (zawsze ostatni)
- Kazdy typ pozycji powinien miec okreslone zachowanie i reguly

### PLANER-2: Przyciski za male na telefonie
- 4 male przyciski (edycja/przesun/usun?) praktycznie nie do trafienia na malym ekranie
- Potrzebny inny layout: 4 duze przyciski w jednej linii lub calkiem inne rozwiazanie (np. swipe, long press, menu kontekstowe)

### PLANER-3: Scroll skacze na poczatek po dodaniu pozycji
- Po dodaniu nowej pozycji widok przeskakuje na poczatek listy
- Trzeba za kazdym razem wracac do dodanej pozycji - bardzo irytujace
- Powinno scrollowac do nowo dodanej pozycji

---

## Widok szczytu - dodatkowe uwagi

### POGODA-1: Kafelki prognozy wychodza poza ekran
- **Gdzie**: Widok szczytu > Prognoza 7 dni (telefon)
- **Co sie dzieje**: Kafelki z dniami tygodnia wychodza poza ekran
- **Propozycja**: 2 linie, albo ograniczyc do 5 dni, albo dac w ustawieniach wybor (3/5/7 dni). Pogoda na 7 dni to i tak malo wiarygodne.

### POGODA-2: "Golden hour" po angielsku
- **Gdzie**: Widok szczytu > Wschod/zachod slonca
- **Co jest**: "Golden hour od 18:35"
- **Czego oczekuje**: Po polsku, np. "Najlepszy czas na zdjecia od 18:35" lub "Zlota godzina od 18:35". Zasada: brak angielskich zwrotow w UI.

### SZLAK-1: Ostrzezenia szlakowe - nie wiadomo gdzie umiescic
- Obecna lokalizacja nie do konca pasuje
- Trzeba sie zastanowic gdzie maja sens - moze w planerze przy konkretnym szczycie? Moze w trybie szczytu? Na razie bez decyzji.

---

## Lista pakowania - uwagi do mechaniki

### PAKOWANIE-1: Lista musi byc kontekstowa
- **Problem**: Obecna lista jest statyczna/ogolna, nie uwzglednia realiow wyprawy
- **Oczekiwana mechanika**:
  - **Pora roku / temperatura**: zima → czolowka, raczki/raki (Rysy!), bardzo cieple ubranie, termos z goraca woda, folia NRC, odblask
  - **Trudnosc / dlugsc trasy**: Skopiec (15 min) → 0.5l wody, lekkie buty wystarczaja. Rysy zimowa → 1.5l, porczadne buty, raczki
  - **Pogoda**: deszcz → kurtka przeciwdeszczowa, mokre warunki
- **Zasada**: Nie podawac oczywistosci. Lepiej mniej trafnych niz duzo banalnych
- **Mechanika**: powiazac z danymi wyprawy (szczyt, data/pora roku, prognoza pogody, czas przejscia) i generowac adekwatna liste
- **Przyklad**: Wejscie na Skopiec w czerwcu = minimalna lista. Rysy w styczniu = pelne wyposazenie zimowe

---

## Drukowanie zdjec

### BUG-7: Przycisk drukowania zdjec niewidoczny mimo dodanych zdjec
- **Gdzie**: Dziennik > sam dol strony
- **Co sie dzieje**: Przycisk "Drukuj zdjecia (A4, 9x13)" nie pojawia sie mimo ze uzytkownik ma dodane zdjecie.
- **Prawdopodobna przyczyna**: Sync (`getStateForSync()`) ustawia `photo: undefined` w journal. Po pull z chmury pole photo znika, wiec warunek `e.photo` jest false.
- **Dodatkowy problem**: Przycisk jest na samym dole dziennika - latwo przegapic nawet gdy dziala.

---

## SOS

### SOS-1: Usunac mozliwosc dzwonienia i wysylania SMS
- **Gdzie**: Zakladka SOS
- **Problem**: Przycisk "Wyslij SMS" prawie spowodowal wyslanie wiadomosci do GOPR podczas testowania. Ryzyko przypadkowego wyslania przez uzytkownika jest realne.
- **Czego oczekuje**: Tylko numery telefonow do przepisania recznie - bez przyciskow tel: i sms:. Do alarmow sluzy dedykowana aplikacja "Ratunek" (GOPR/TOPR) ktora ma zabezpieczenia. KGP powinno byc tylko informacyjne.
- **Propozycja szersza**: Moze cala zakladka SOS jest zbedna jako osobny tab na dole - za duzo przyciskow na malym telefonie. Wystarczyloby umiesci numery alarmowe jako tekst informacyjny w ustawieniach (na koncu).

---

*Ostatnia aktualizacja: 2026-04-04*
