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

### Bezpieczenstwo
- [x] Tryb SOS (GPS, GOPR/TOPR, schronisko, SMS, ICE)
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
- [x] Dedykacja zdobycia szczytu

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
- [ ] **Planer wyprawy (multi-segment)** - refactor strony Planuj. Wyprawa = kontener segmentów: 🚗 Dojazd, 🥾 Podejście (z via), 🔽 Zejście, 🏨 Nocleg, 🍽️ Restauracja, ☀️ Przerwa, 🚂 Komunikacja, ⛽ Tankowanie. Jeden szczyt = 3 segmenty, weekend = wiele segmentów + nocleg. Kalkulator dnia sumuje wszystko w timeline. Zapis do Supabase.
- [ ] **Profil wysokosciowy trasy** - wykres przewyzszen (OpenElevation API + Canvas). Gdzie stromo, gdzie plask, gdzie odpoczac.
- [ ] **Tryb offline z mapami** - cache kafelkow w IndexedDB dla okolic kazdego szczytu. W gorach czesto brak zasiegu.
- [ ] **Wiele zdjec na szczyt** - galeria zamiast jednego zdjecia. Porownanie lato vs zima.

### Priorytet sredni
- [ ] **AI Planner (Gemini)** - "weekend 18-19 kwietnia, jade z Krakowa" → AI generuje plan: ktore gory, kolejnosc, noclegi, pogoda
- [ ] **AI Chatbot / Przewodnik** - "Co zabrac na Babia Gore w listopadzie?" - odpowiada w kontekscie pogody i poziomu
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
- [ ] **Adaptive UI** - kontekstowy interfejs zależny od sytuacji: w domu → tryb planowania (duże karty, pogoda), na szlaku → tryb nawigacji (duża mapa, duże przyciski), na szczycie → tryb zdobywcy (aparat, formularz). Wykrywanie przez GPS + czas + aktywność.
- [ ] **Accessibility** - wysoki kontrast, skalowalne fonty, aria labels, semantic HTML, obsługa czytnika ekranu. Nie feature, a wymóg.
- [ ] **Onboarding jako quest** - zamiast intro screena, pierwszy szczyt jako "misja treningowa": wybierz szczyt → sprawdź pogodę → zaplanuj → zdobądź → zrób zdjęcie. Grywalizacja od pierwszej minuty.

### Bugfixy
- [ ] **Grupowanie parkingow** - jeden parking → wiele szczytow (np. Gorce)

---

*Ostatnia aktualizacja: 2026-04-03*
