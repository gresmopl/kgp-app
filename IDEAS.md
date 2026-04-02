# KGP App - Pomysly i plan rozwoju

## Legenda statusow
- [ ] Do zrobienia
- [x] Zrobione
- [~] W trakcie

---

## Zrobione
- [x] Integracja Supabase (sync code, zdjecia, profil)
- [x] Integracja Mapy.com (routing pieszy/auto, kafelki outdoor, geocoding)
- [x] Ekran Ustawienia (profil, adres, tempo, transport, sync, backup)

---

## Bugfixy
- [ ] **Grupowanie parkingów** — jeden parking → wiele szczytów (np. Gorce). Zmiana struktury danych `peaks[]`, wsparcie w plannerze dla 2 szczytów z jednego parkingu

---

## Bezpieczenstwo
- [ ] **Tryb SOS** — przycisk alarmowy wyswietlajacy:
  - Dokladne koordynaty GPS (do podania ratownikom)
  - Numer GOPR/TOPR wlasciwy dla regionu szczytu
  - Najblizsze schronisko z kierunkiem i odlegloscia
  - Czas do zmroku (API sunrise-sunset)
  - Mozliwosc wyslania SMS z lokalizacja (link `sms:`)
  - Kontakt ICE (z ustawien uzytkownika)

- [ ] **Ostrzezenia bezpieczenstwa AI** — Gemini ocenia warunki pogodowe + teren + pora roku i ostrzega przed niebezpieczenstwem

- [ ] **Czas zachodu/wschodu slonca + golden hour** — automatyczne ostrzezenie w plannerze "nie zdazysz przed zmrokiem". Darmowe API sunrise-sunset.org

---

## Planowanie wypraw
- [ ] **Inteligentny AI Planner (Gemini)** — uzytkownik podaje "weekend 18-19 kwietnia, jade z Krakowa, srednia kondycja" → AI generuje pelny plan: ktore gory, kolejnosc, noclegi, restauracje, pogoda. Killer feature.

- [ ] **Restauracje w poblizu parkingu** — po zejsciu ze szlaku, wyszukiwanie miejsc do jedzenia (Mapy.com Places API + link do opinii Google)

- [ ] **Planowanie weekendu z noclegiem** — linki do booking.com / nocowanie.pl z wypelniona lokalizacja i datami

- [ ] **Kamery gorskie na zywo** — linki do kamer internetowych schronisk przy poszczegolnych szczytach. Jedno spojrzenie mowi wiecej niz prognoza.

- [ ] **Porownaj trase z kolega** — import/export planow wycieczek jako linki. "Hej, ide w sobote na Ryse, tu masz moj plan" → link otwiera sie w aplikacji z pelnym planem.

---

## AI (Gemini Flash)
- [ ] **AI Chatbot / Przewodnik gorski** — "Jaka gore zdobyc w weekend?", "Co zabrac na Babia Gore w listopadzie?" — odpowiada w kontekscie zdobytych szczytow, pogody, poziomu
- [ ] **Rozpoznawanie szczytow ze zdjecia** — Gemini Vision analizuje panorame i mowi jakie szczyty widzisz
- [ ] **Automatyczny opis zdobycia** — AI generuje ladny wpis do dziennika na podstawie: trasa, pogoda, czas, zdjecia
- [ ] **Podsumowanie sezonu** — "W 2026 zdobyles 8 szczytow, najdluzsza trasa to Babia Gora (6h). Brakuje Ci 12 — przy Twoim tempie ukonczysz KGP w 2028."
- [ ] **Prognoza ukonczenia KGP** — na podstawie dotychczasowego tempa: "Przy obecnym tempie ukonczysz KGP za ~14 miesiecy (sierpien 2027)". Motywujace i konkretne.

---

## Motywacja i grywalizacja
- [ ] **System osiagniec (achievements)** — odznaki:
  - "Zimowy wojownik" — szczyt zdobyty w styczniu/lutym
  - "Swit na szczycie" — wejscie przed 7:00
  - "Maraton" — 2 szczyty w jeden dzien
  - "Pelnia Karpat" — wszystkie szczyty karpackie
  - "Pierwszy krok" — pierwszy szczyt
  - "Bez auta" — dojazd PKP/PKS
  - Wyswietlane w profilu jak medale

- [ ] **Karta zdobycia do udostepnienia** — grafika generowana na Canvas po wejsciu na szczyt:
  - Zdjecie ze szczytu w tle
  - Nazwa szczytu, wysokosc, data
  - Pasek postepu "12/28 KGP"
  - Do pobrania jako PNG, gotowa na Instagram/Facebook

- [ ] **Panorama postepu** — grafika panoramy gor, gdzie zdobyte szczyty sa kolorowe/podswietlone, a niezdobyte szare. Im wiecej zdobywasz, tym bardziej panorama "ozywa".

- [ ] **Timeline / os czasu** — zamiast suchej listy w dzienniku, piekna wizualna os z miniaturkami zdjec, mapka kolejnosci zdobywania, "od Babiej do Turbacza minelo 23 dni"

- [ ] **Porownanie z innymi (anonimowe)** — "Przecietny zdobywca KGP potrzebuje 2.3 lat. Ty jestes na 40% po 8 miesiacach — szybciej niz 67% osob!" Na start predefiniowane benchmarki, pozniej realne dane z Supabase.

- [ ] **Wyzwanie grupowe** — kodowana nazwa grupy (np. "EKIPA2026"), kazdy importuje — widzisz kto ile ma szczytow. Realizowalne przez shared JSON na GitHub Gist lub Supabase.

---

## Social i sharing
- [ ] **Porownaj trase z kolega** — import/export planow jako linki
- [ ] **Wyzwanie grupowe** — wspolne sledzenie postepu w grupie znajomych

---

## UX / Pierwsze wrazenie
- [ ] **Onboarding z charakterem** — animowany intro: "28 szczytow. Jedna korona. Twoja przygoda zaczyna sie teraz." Z mapa Polski i zaznaczonymi punktami. Pierwsze wrazenie robi robote.

---

## Design i animacje
- [ ] **Gorski dark theme** — gradientowe tlo imitujace niebo o zmierzchu, subtelne tekstury skaly, ikony w stylu topograficznym. Spojna identyfikacja wizualna zamiast generycznych kolorow.

- [ ] **Micro-interactions i animacje**:
  - Szczyt "wskakuje" na liste zdobytych z animacja
  - Pasek postepu animuje sie plynnie
  - Karta szczytu rozwija sie gesture-based (swipe up)
  - Dzwiek dzwonka na szczycie (opcjonalny)
  - Confetti juz jest — rozbudowac o wiecej efektow

---

## Zdjecia
- [ ] **Galeria z lightboxem** — powiekszanie, swipe miedzy zdjeciami
- [ ] **Wiele zdjec na szczyt** — nie tylko jedno, a cala galeria
- [ ] **Porownanie lato vs zima** — to samo miejsce w roznych porach roku

---

## Dane i statystyki
- [ ] **Dashboard z wykresami**:
  - Wykres tempo zdobywania (szczyty/miesiac)
  - Mapa ciepla — kiedy najczesciej chodzisz (dzien tygodnia x pora roku)
  - Laczne km, laczne przewyzszenie, srednia trudnosc
  - Wykres "najbardziej produktywny miesiac"

---

## Baza wiedzy i spolecznosc
- [ ] **Ciekawostki o KGP** — tabela `fun_facts` w Supabase. Rekordy, historie, statystyki. Np. "Rekord KGP: 3 dni 5h", "Rysy to jedyny szczyt KGP powyzej 2000m". Losowo wyswietlane na ekranie glownym lub przy szczycie.

- [ ] **Ostrzezenia od uzytkownikow** — mini-system komentarzy. "Brak pieczatki na Turbaczu, skradziona 03.2026". Tabela `warnings` w Supabase, widoczne dla wszystkich, z mozliwoscia zglaszania.

---

## Druk zdjec do ksiazeczki KGP
- [ ] **Generator wydruku A4** — 4 zdjecia na strone w formacie 9x13 cm (standard ksiazeczki KGP):
  - Uzytkownik wybiera szczyty lub "wszystkie zdobyte"
  - Pod kazdym zdjeciem: nazwa szczytu, wysokosc, data zdobycia
  - Linie ciecia (przerywane) do wyciecia nozyczkami
  - `window.print()` na papierze fotograficznym w domu
  - Alternatywnie: CSS `@media print` lub eksport PDF (jsPDF)
- [ ] **Eksport pojedynczych zdjec 9x13** — generuje osobne pliki JPG gotowe do wrzucenia do Empik Foto / Rossmann (~1 zl/szt)

---

## Na szlaku (podczas podejscia/zejscia)
- [ ] **"Ile jeszcze?" — live tracker podejscia** — GPS sledzi pozycje na szlaku w real-time. Pasek postepu: "zostalo ~47 min, 312m przewyzszenia". Najbardziej pozadana informacja na szlaku.
- [ ] **Glosowy asystent szlakowy** — co 15 min mowi przez glosnik: "Swietnie, pokonales 60% trasy. Zostalo 40 minut." Motywacja bez wyciagania telefonu.
- [ ] **"Heartbeat" — puls wyprawy** — wibracja co okragle 100m przewyzszenia. Na szczycie dluga wibracja + dzwiek.
- [ ] **Nawigacja powrotna "do samochodu"** — jeden przycisk. Aplikacja zapamietala lokalizacje parkingu przy starcie i prowadzi z powrotem.
- [ ] **Kalorie** — "Dzisiejszy Turbacz: ~1200 kcal. Zasluzyles na oscypka!" Na podstawie przewyzszenia, dystansu, tempa.
- [ ] **Countdown do cieplego posilku** — "Za 45 min bedziesz na parkingu. Najblizsa karczma 2.3km, ocena 4.6"

---

## Na szczycie
- [ ] **Wiadomosc w butelce** — zostawiasz anonimowa wiadomosc na szczycie w aplikacji. Nastepna osoba ktora wejdzie, ja przeczyta. Buduje spolecznosc.
- [ ] **Dedykacja zdobycia** — "Ten szczyt dedykuje..." — zonie, dziecku, babci. Pojawia sie na karcie zdobycia. Emocjonalny element.

---

## Przed wyprawa
- [ ] **"Pakuj sie!" — dynamiczna lista rzeczy** — na podstawie pogody, pory roku, trudnosci. "Babia Gora jutro: kurtka (70% deszcz), czolowka (zachod 17:20), raki (snieg powyzej 1400m w kwietniu)"
- [ ] **Wirtualny spacer po szlaku** — zdjecia z kluczowych punktow. "Tu skrecasz w lewo", "Tu zaczyna sie stroma czesc". Zmniejsza stres przed pierwsza wyprawa.
- [ ] **"Okno pogodowe"** — skanuje prognoze 14 dni i sugeruje najlepszy termin. Nie "pogoda jutro" ale "idealne okno na Sniezke: piatek-sobota za 2 tygodnie".

---

## Motywacja na co dzien
- [ ] **Dzienny streak / passa** — "Od ostatniego szczytu minelo 23 dni. Twoj rekord przerwy: 45 dni. Nie daj sie!"
- [ ] **"Gora tygodnia"** — co tydzien wyroznia jeden szczyt: ciekawostka, zdjecie, pogoda. Push: "Ta gora czeka na Ciebie."
- [ ] **Wirtualna polka z trofeami** — kazdy zdobyty szczyt to miniatura gory, pieczatka, kamien. Kolekcja jak medale w grze.
- [ ] **"Rok temu dzis..."** — wspomnienie ze zdjeciem. Jak Facebook memories ale gorskie.

---

## Spolecznosc
- [ ] **Live na szczycie** — "Jestem teraz na Rysach!" — inni widza w real-time kto jest na ktorym szczycie.
- [ ] **Mentoring** — doswiadczeni zdobywcy (20+ szczytow) odpowiadaja na pytania nowych.
- [ ] **Szlakowy geocaching** — ukryte wirtualne punkty na szlaku zbierane GPS-em jak Pokemon GO.

---

## Pomysly abstrakcyjne / na przyszlosc
> Tu wrzucamy wszystko co przyjdzie do glowy, nawet jesli dzis nie wiadomo jak to zrobic

- Tryb offline z pelnym cachem map (pobierz region na telefon)
- Integracja z zegarkami sportowymi (Garmin, Apple Watch)
- Wspolne wyprawy — zapraszanie znajomych, wspolny tracking
- AR (augmented reality) — naceluj telefon na gore i zobacz nazwe szczytu
- Ranking zdobywcow (opcjonalny, anonimowy)
- Eksport do GPX / KML
- Widget na ekran glowny telefonu — "Najblizszy niezdobyty szczyt: Babia Gora, 127km". PWA Web App Manifest na Androidzie.
- Powiadomienia push — "W sobote idealna pogoda na Sniezke!"

---

*Ostatnia aktualizacja: 2026-04-02*
