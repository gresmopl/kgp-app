// ============================================================
// FEATURE 1: TRYB SOS
// ============================================================
const GOPR_REGIONS = {
  'Tatry': { name: 'TOPR', phone: '601100300' },
  'Beskid Żywiecki': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Karkonosze': { name: 'GOPR Grupa Karkonoska', phone: '985' },
  'Masyw Śnieżnika': { name: 'GOPR Grupa Wałbrzyska', phone: '985' },
  'Bieszczady': { name: 'GOPR Grupa Bieszczadzka', phone: '985' },
  'Gorce': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Sądecki': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Śląski': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Wyspowy': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Niski': { name: 'GOPR Grupa Bieszczadzka', phone: '985' },
  'Pieniny': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Mały': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Beskid Makowski': { name: 'GOPR Grupa Beskidzka', phone: '985' },
  'Góry Świętokrzyskie': { name: 'GOPR Grupa Jurajska', phone: '985' },
};

function getGOPRForRange(range) {
  return GOPR_REGIONS[range] || { name: 'GOPR', phone: '985' };
}

function renderSOS() {
  const nearPeak = state.nearbyPeak ? PEAKS.find(p => p.id === state.nearbyPeak) : null;
  const selectedPeak = state.selectedPeak || PEAKS[0];
  const peak = nearPeak || selectedPeak;
  const gopr = getGOPRForRange(peak.range);
  const hasGPS = state.userLat && state.userLon;
  const coords = hasGPS ? `${state.userLat.toFixed(6)}, ${state.userLon.toFixed(6)}` : 'Brak GPS';
  const smsBody = hasGPS
    ? encodeURIComponent(`SOS! Potrzebuję pomocy. Moja lokalizacja: ${state.userLat.toFixed(6)}, ${state.userLon.toFixed(6)} (okolice ${peak.name}, ${peak.range}). https://maps.google.com/?q=${state.userLat.toFixed(6)},${state.userLon.toFixed(6)}`)
    : encodeURIComponent(`SOS! Potrzebuję pomocy. Okolice ${peak.name}, ${peak.range}. Brak GPS.`);
  const iceContact = state.iceContact || '';

  // Znajdź najbliższe schronisko
  let nearestShelter = null;
  let nearestDist = Infinity;
  if (hasGPS) {
    PEAKS.forEach(p => {
      (p.stamps || []).forEach(s => {
        if (s.type === '🏠') {
          const d = dist(state.userLat, state.userLon, p.lat, p.lon);
          if (d < nearestDist) {
            nearestDist = d;
            nearestShelter = { name: s.name, peak: p.name, dist: d };
          }
        }
      });
    });
  }

  // Zachód słońca
  const sunsetInfo = state._todaySunset
    ? `Zachód słońca: <b style="color:var(--accent)">${state._todaySunset}</b>`
    : 'Ładowanie danych o zachodzie...';

  return `
  <div class="header" style="background:var(--red)22;border-bottom-color:var(--red)44">
    <span class="header-icon">🆘</span>
    <div><div class="header-title" style="color:var(--red)">TRYB SOS</div><div class="header-sub">Pomoc w nagłych wypadkach</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <div class="card card-pad" style="border-color:var(--red)44;background:#351a1a">
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px">📍 Twoje koordynaty GPS</div>
      <div style="font-family:var(--font-display);font-size:22px;color:${hasGPS ? 'var(--text)' : 'var(--red)'};letter-spacing:1px;margin-bottom:6px">${coords}</div>
      ${hasGPS ? `<div style="font-size:11px;color:var(--text2)">Podaj te współrzędne ratownikom przez telefon</div>` : `<div style="font-size:11px;color:var(--red)">⚠️ Włącz GPS! Ratownicy potrzebują Twojej lokalizacji</div>`}
    </div>

    <a href="tel:${gopr.phone}" class="btn" style="background:var(--red);color:#fff;font-size:18px;padding:18px;text-decoration:none">
      📞 Zadzwoń ${gopr.name} - ${gopr.phone}
    </a>

    <a href="tel:112" class="btn" style="background:var(--card2);color:var(--text);font-size:16px;text-decoration:none;border:1px solid var(--border)">
      📞 Numer alarmowy - 112
    </a>

    ${iceContact ? `
    <a href="tel:${iceContact}" class="btn" style="background:var(--card2);color:var(--text);text-decoration:none;border:1px solid var(--border)">
      👤 Kontakt ICE - ${iceContact}
    </a>` : ''}

    <a href="sms:${gopr.phone}?body=${smsBody}" class="btn btn-secondary" style="text-decoration:none">
      💬 Wyślij SMS z lokalizacją
    </a>

    ${nearestShelter ? `
    <div class="card card-pad">
      <div class="section-title">🏠 Najbliższe schronisko</div>
      <div style="font-weight:600;font-size:14px">${nearestShelter.name}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px">Okolice ${nearestShelter.peak} · ~${(nearestShelter.dist/1000).toFixed(1)} km w linii prostej</div>
    </div>` : ''}

    <div class="card card-pad">
      <div style="font-size:12px;color:var(--text2)">${sunsetInfo}</div>
    </div>

    <div class="card card-pad">
      <div style="font-size:11px;color:var(--text2);line-height:1.6">
        <b>Co robić w sytuacji awaryjnej:</b><br>
        1. Zachowaj spokój<br>
        2. Zadzwoń na GOPR/TOPR (985) lub 112<br>
        3. Podaj swoje współrzędne GPS (powyżej)<br>
        4. Opisz sytuację i obrażenia<br>
        5. Pozostań w miejscu - czekaj na ratowników<br>
        6. Jeśli możesz - zabezpiecz się przed wiatrem i zimnem
      </div>
    </div>

  </div>`;
}

// ============================================================
// FEATURE 2: DEDYKACJA ZDOBYCIA
// ============================================================
// Zintegrowana w conquerPeak - pole "dedication" w formularzu szczytu

// ============================================================
// FEATURE 3: DZIENNY STREAK / PASSA
// ============================================================
function getStreakInfo() {
  if (state.journal.length === 0) return null;

  const now = new Date();
  const lastEntry = state.journal[0];
  const lastDate = parsePolishDate(lastEntry.date);
  if (!lastDate) return null;

  const daysSinceLast = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

  // Najdłuższa przerwa
  let maxGap = 0;
  for (let i = 0; i < state.journal.length - 1; i++) {
    const d1 = parsePolishDate(state.journal[i].date);
    const d2 = parsePolishDate(state.journal[i + 1].date);
    if (d1 && d2) {
      const gap = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
      if (gap > maxGap) maxGap = gap;
    }
  }

  // Szczyty w tym miesiącu
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthCount = state.journal.filter(e => {
    const d = parsePolishDate(e.date);
    return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Najlepszy miesiąc
  const monthCounts = {};
  state.journal.forEach(e => {
    const d = parsePolishDate(e.date);
    if (d) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }
  });
  const bestMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

  return { daysSinceLast, maxGap, thisMonthCount, bestMonth: bestMonth ? bestMonth[1] : 0 };
}

function parsePolishDate(dateStr) {
  // Format: "2.04.2026" or "02.04.2026"
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// ============================================================
// FEATURE 4: PROGNOZA UKOŃCZENIA KGP
// ============================================================
function getCompletionForecast() {
  if (state.journal.length < 2) return null;

  const dates = state.journal.map(e => parsePolishDate(e.date)).filter(Boolean).sort((a, b) => a - b);
  if (dates.length < 2) return null;

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daySpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
  const peaksPerDay = state.conquered.length / daySpan;
  const remaining = 28 - state.conquered.length;

  if (remaining <= 0) return { done: true };

  const daysNeeded = Math.round(remaining / peaksPerDay);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);

  return {
    done: false,
    daysNeeded,
    completionDate: completionDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
    peaksPerMonth: (peaksPerDay * 30).toFixed(1)
  };
}

// ============================================================
// FEATURE 5: "ROK TEMU DZIŚ..."
// ============================================================
function getYearAgoMemory() {
  const now = new Date();
  const today = `${now.getDate()}.${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const entry of state.journal) {
    const d = parsePolishDate(entry.date);
    if (!d) continue;
    const entryDay = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    const yearDiff = now.getFullYear() - d.getFullYear();
    if (yearDiff >= 1 && entryDay === today) {
      return { entry, yearsAgo: yearDiff };
    }
  }
  return null;
}

// ============================================================
// FEATURE 6: PORÓWNANIE Z INNYMI (benchmarki)
// ============================================================
function getBenchmarkComparison() {
  if (state.journal.length < 1) return null;

  const dates = state.journal.map(e => parsePolishDate(e.date)).filter(Boolean).sort((a, b) => a - b);
  if (dates.length === 0) return null;

  const firstDate = dates[0];
  const now = new Date();
  const monthsActive = Math.max(1, (now - firstDate) / (1000 * 60 * 60 * 24 * 30));

  // Benchmarki (szacunkowe, predefiniowane)
  const AVG_MONTHS = 28; // średni czas ukończenia KGP
  const AVG_PACE = 1.0;  // 1 szczyt/miesiąc średnio

  const userPace = state.conquered.length / monthsActive;
  const pctComplete = (state.conquered.length / 28 * 100).toFixed(0);
  const expectedAtThisPoint = Math.round(monthsActive * AVG_PACE);
  const aheadOrBehind = state.conquered.length - expectedAtThisPoint;

  let percentile;
  if (userPace > 2.5) percentile = 95;
  else if (userPace > 1.5) percentile = 80;
  else if (userPace > 1.0) percentile = 60;
  else if (userPace > 0.5) percentile = 40;
  else percentile = 20;

  return { monthsActive: monthsActive.toFixed(0), userPace: userPace.toFixed(1), pctComplete, aheadOrBehind, percentile };
}

// ============================================================
// FEATURE 7: CZAS ZACHODU/WSCHODU SŁOŃCA
// ============================================================
async function fetchSunTimes(lat, lon) {
  try {
    const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=today`);
    const data = await res.json();
    if (data.status === 'OK') {
      const sunrise = new Date(data.results.sunrise);
      const sunset = new Date(data.results.sunset);
      const goldenStart = new Date(sunset.getTime() - 60 * 60 * 1000);
      return {
        sunrise: sunrise.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        sunset: sunset.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        goldenHour: goldenStart.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        sunsetDate: sunset
      };
    }
  } catch (e) { console.error('Sun times error:', e); }
  return null;
}

function getSunWarning(peak, sunTimes) {
  if (!sunTimes) return null;
  const route = getRoute(peak);
  const totalTrailMin = adjTime(route.trail.up) + 30 + adjTime(route.trail.down);
  const startTime = state.departTime || '07:00';
  const driveEst = estimateDriveMin(peak);
  const trailStartMin = driveEst ? driveEst : 0;

  const [sh, sm] = startTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm + trailStartMin;
  const endMinutes = startMinutes + totalTrailMin;
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;

  const sunsetParts = sunTimes.sunset.split(':').map(Number);
  const sunsetMinutes = sunsetParts[0] * 60 + sunsetParts[1];

  if (endMinutes > sunsetMinutes) {
    const overMin = endMinutes - sunsetMinutes;
    return `⚠️ Uwaga! Zejdziesz ~${overMin} min po zachodzie słońca (${sunTimes.sunset}). Weź czołówkę lub wyjdź wcześniej!`;
  }
  if (endMinutes > sunsetMinutes - 60) {
    return `🌅 Będzie ciasno - zejście ~${endHour}:${String(endMin).padStart(2,'0')}, zachód o ${sunTimes.sunset}. Rozważ wcześniejszy wyjazd.`;
  }
  return null;
}

// ============================================================
// FEATURE 8: KALORIE
// ============================================================
function estimateCalories(peak) {
  const route = getRoute(peak);
  // Formuła: ~0.5 kcal na metr przewyższenia + 0.04 kcal na metr dystansu (70kg osoba)
  const ascentCal = route.trail.ascent * 0.5;
  const distCal = route.trail.dist * 1000 * 0.04;
  const descentCal = route.trail.ascent * 0.15;
  return Math.round((ascentCal + distCal + descentCal) * state.paceMultiplier);
}

// ============================================================
// FEATURE 9: ONBOARDING
// ============================================================
function shouldShowOnboarding() {
  return !localStorage.getItem('kgp_onboarded') && state.conquered.length === 0;
}

function renderOnboarding() {
  return `
  <div style="position:fixed;inset:0;background:var(--bg);z-index:20000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center">
    <div style="font-size:80px;margin-bottom:20px">🏔️</div>
    <div style="font-family:var(--font-display);font-size:36px;color:var(--accent);letter-spacing:2px;line-height:1.2;margin-bottom:12px">
      28 SZCZYTÓW<br>JEDNA KORONA
    </div>
    <div style="font-size:15px;color:var(--text2);margin-bottom:30px;max-width:300px;line-height:1.6">
      Twoja przygoda ze zdobywaniem Korony Gór Polski zaczyna się teraz. Planuj, zdobywaj, kolekcjonuj pieczątki.
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px">
      ${['🗺️ Mapa','📅 Planuj','🏔️ Zdobywaj','📖 Dziennik'].map(t => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:11px;color:var(--text2)">${t}</div>`).join('')}
    </div>
    <button class="btn btn-primary" style="font-size:16px;padding:16px 40px" onclick="dismissOnboarding()">
      🚀 Zaczynamy!
    </button>
    <div style="font-size:10px;color:var(--text2);margin-top:16px">Korona Gór Polski - Asystent Zdobywcy v1.2.0</div>
  </div>`;
}

function dismissOnboarding() {
  localStorage.setItem('kgp_onboarded', '1');
  document.querySelector('[style*="z-index:20000"]')?.remove();
}

// ============================================================
// FEATURE 10: PANORAMA POSTĘPU
// ============================================================
function renderProgressPanorama() {
  const done = state.conquered.length;
  const pct = Math.round(done / 28 * 100);
  const sorted = [...PEAKS].sort((a, b) => a.id - b.id);

  const peaks = sorted.map(p => {
    const conquered = isDone(p.id);
    const h = Math.round((p.height / 2499) * 40); // normalize height, max 40px
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:0">
      <div style="width:100%;height:${h}px;background:${conquered ? 'var(--green)' : 'var(--border)'};border-radius:2px 2px 0 0;transition:background 0.5s"></div>
    </div>`;
  }).join('');

  return `
  <div class="card card-pad">
    <div class="section-title">🏔️ Panorama postępu</div>
    <div style="display:flex;align-items:flex-end;gap:1px;height:50px;margin-bottom:8px">
      ${peaks}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2)">
      <span>${done}/28 szczytów</span>
      <span>${pct}%</span>
    </div>
    <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

// ============================================================
// FEATURE 11: KAMERY GÓRSKIE
// ============================================================
function getCameraSearchUrl(peak) {
  return `https://www.google.com/search?q=${encodeURIComponent('kamera internetowa ' + peak.name + ' ' + peak.range + ' webcam')}`;
}

// ============================================================
// FEATURE 12: COUNTDOWN DO CIEPŁEGO POSIŁKU
// ============================================================
// Dane o karczmach/schroniskach blisko parkingów
const NEARBY_FOOD = {
  1: { name: 'Włosienica - bar przy parkingu', dist: 'przy parkingu Palenica', type: '🍺' },
  9: { name: 'Karczma Baranówka', dist: 'przy parkingu', type: '🍺' },
  17: { name: 'Schronisko Andrzejówka', dist: 'przy parkingu', type: '🏠' },
  28: { name: 'Gościniec pod Lubomirem', dist: 'przy parkingu', type: '🏡' },
};

function getNearbyFood(peakId) {
  return NEARBY_FOOD[peakId] || null;
}
