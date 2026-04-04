// ============================================================
// NUMERY ALARMOWE (sekcja w ustawieniach)
// ============================================================
const GOPR_REGIONS = {
  'Tatry': { name: 'TOPR', phone: '601 100 300' },
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

function getSOSInfo() {
  const nearPeak = state.nearbyPeak ? PEAKS.find(p => p.id === state.nearbyPeak) : null;
  const selectedPeak = state.selectedPeak || null;
  const peak = nearPeak || selectedPeak;
  const gopr = peak ? getGOPRForRange(peak.range) : { name: 'GOPR', phone: '985' };
  const hasGPS = state.userLat && state.userLon;
  const coords = hasGPS ? `${state.userLat.toFixed(6)}, ${state.userLon.toFixed(6)}` : null;
  return { peak, gopr, hasGPS, coords };
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
  if (state.journal.length < 1) return null;

  const dates = state.journal.map(e => parsePolishDate(e.date)).filter(Boolean).sort((a, b) => a - b);
  if (dates.length < 1) return null;

  const firstDate = dates[0];
  const now = new Date();
  const daySpan = Math.max(30, (now - firstDate) / (1000 * 60 * 60 * 24));
  const peaksPerDay = dates.length / daySpan;
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

// ============================================================
// FEATURE 13: KARTA ZDOBYCIA (Canvas PNG)
// ============================================================
function generateConquestCard(peakId) {
  const entry = state.journal.find(e => e.peakId === peakId);
  if (!entry) return;
  const done = state.conquered.length;
  const pct = Math.round(done / 28 * 100);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  const drawCard = (bgImg) => {
    // Tło
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, 1080, 1350);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, 1080, 1350);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, 1350);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#0f2027');
      grad.addColorStop(1, '#203a43');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);
    }

    // Góra - emoji góry
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏔️', 540, 200);

    // Nazwa szczytu
    ctx.fillStyle = '#e8a020';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(entry.name, 540, 340);

    // Wysokość
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Arial, sans-serif';
    ctx.fillText(entry.height + ' m n.p.m.', 540, 460);

    // Pasmo
    ctx.fillStyle = '#9090b0';
    ctx.font = '36px Arial, sans-serif';
    ctx.fillText(entry.range, 540, 520);

    // Data i godzina
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '40px Arial, sans-serif';
    ctx.fillText('📅 ' + entry.date + '  ⏰ ' + entry.time, 540, 620);

    // Dedykacja
    if (entry.dedication) {
      ctx.fillStyle = '#e8a020';
      ctx.font = 'italic 32px Arial, sans-serif';
      ctx.fillText('🎁 ' + entry.dedication, 540, 700);
    }

    // Notatka
    if (entry.note) {
      ctx.fillStyle = '#c0c0d0';
      ctx.font = 'italic 28px Arial, sans-serif';
      const noteY = entry.dedication ? 760 : 700;
      const words = entry.note.split(' ');
      let line = '"';
      let y = noteY;
      words.forEach(w => {
        if (ctx.measureText(line + w).width > 900) {
          ctx.fillText(line, 540, y);
          line = w + ' ';
          y += 36;
        } else {
          line += w + ' ';
        }
      });
      ctx.fillText(line.trim() + '"', 540, y);
    }

    // Pasek postępu
    const barY = 1000;
    ctx.fillStyle = '#2a2a45';
    ctx.beginPath();
    ctx.roundRect(140, barY, 800, 40, 20);
    ctx.fill();
    const grad2 = ctx.createLinearGradient(140, 0, 940, 0);
    grad2.addColorStop(0, '#e8a020');
    grad2.addColorStop(1, '#f0c060');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.roundRect(140, barY, 800 * (done / 28), 40, 20);
    ctx.fill();

    // Tekst postępu
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillText(done + ' / 28', 540, barY + 100);
    ctx.fillStyle = '#9090b0';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('Korona Gór Polski - ' + pct + '%', 540, barY + 145);

    // Imię
    if (state.userName) {
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '32px Arial, sans-serif';
      ctx.fillText('Zdobywca: ' + state.userName, 540, barY + 220);
    }

    // Stopka
    ctx.fillStyle = '#606080';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('KGP App - Asystent Zdobywcy', 540, 1310);

    // Pobierz
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KGP_${entry.name.replace(/ /g, '_')}_${entry.date.replace(/\./g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📸 Karta zdobycia pobrana!');
    });
  };

  if (entry.photo) {
    const img = new Image();
    img.onload = () => drawCard(img);
    img.onerror = () => drawCard(null);
    img.src = entry.photo;
  } else {
    drawCard(null);
  }
}

// ============================================================
// FEATURE 14: SYSTEM OSIĄGNIĘĆ
// ============================================================
const ACHIEVEMENTS = [
  { id: 'first', name: 'Pierwszy krok', icon: '👣', desc: 'Zdobyj pierwszy szczyt', check: () => state.conquered.length >= 1 },
  { id: 'five', name: 'Piątka', icon: '🖐️', desc: 'Zdobyj 5 szczytów', check: () => state.conquered.length >= 5 },
  { id: 'half', name: 'Półmetek', icon: '⚡', desc: 'Zdobyj 14 szczytów', check: () => state.conquered.length >= 14 },
  { id: 'crown', name: 'Zdobywca Korony', icon: '👑', desc: 'Zdobyj wszystkie 28 szczytów', check: () => state.conquered.length >= 28 },
  { id: 'winter', name: 'Zimowy wojownik', icon: '❄️', desc: 'Zdobyj szczyt w styczniu lub lutym', check: () => state.journal.some(e => { const d = parsePolishDate(e.date); return d && (d.getMonth() === 0 || d.getMonth() === 1); }) },
  { id: 'dawn', name: 'Świt na szczycie', icon: '🌅', desc: 'Zdobyj szczyt przed 8:00', check: () => state.journal.some(e => { const [h] = (e.time || '12:00').split(':').map(Number); return h < 8; }) },
  { id: 'marathon', name: 'Maraton', icon: '🏃', desc: '2 szczyty w jeden dzień', check: () => { const dates = state.journal.map(e => e.date); return dates.some(d => dates.filter(x => x === d).length >= 2); } },
  { id: 'karpaty', name: 'Pełnia Karpat', icon: '🏔️', desc: 'Zdobyj wszystkie szczyty karpackie', check: () => { const karpatRanges = ['Tatry','Beskid Żywiecki','Gorce','Beskid Sądecki','Beskid Śląski','Beskid Wyspowy','Beskid Niski','Pieniny','Beskid Mały','Beskid Makowski','Bieszczady']; return PEAKS.filter(p => karpatRanges.includes(p.range)).every(p => isDone(p.id)); } },
  { id: 'sudety', name: 'Pan Sudetów', icon: '⛰️', desc: 'Zdobyj wszystkie szczyty sudeckie', check: () => { const sudetRanges = ['Karkonosze','Góry Stołowe','Masyw Śnieżnika','Góry Sowie','Góry Bystrzyckie','Góry Wałbrzyskie','Góry Kamienne','Masyw Ślęży','Góry Opawskie']; return PEAKS.filter(p => sudetRanges.includes(p.range)).every(p => isDone(p.id)); } },
  { id: 'rysy', name: 'Dach Polski', icon: '🇵🇱', desc: 'Zdobyj Rysy (2499m)', check: () => isDone(1) },
  { id: 'hard', name: 'Twardziel', icon: '💪', desc: 'Zdobyj szczyt o trudności 5/5', check: () => state.conquered.some(id => { const p = PEAKS.find(pk => pk.id === id); return p && p.difficulty === 5; }) },
  { id: 'speed', name: 'Sprinter', icon: '⚡', desc: '3 szczyty w jednym miesiącu', check: () => { const mc = {}; state.journal.forEach(e => { const d = parsePolishDate(e.date); if (d) { const k = d.getFullYear() + '-' + d.getMonth(); mc[k] = (mc[k]||0)+1; } }); return Object.values(mc).some(v => v >= 3); } },
];

function getUnlockedAchievements() {
  return ACHIEVEMENTS.filter(a => a.check());
}

function renderAchievements() {
  const unlocked = getUnlockedAchievements();
  return `
  <div class="card card-pad">
    <div class="section-title">🏅 Osiągnięcia (${unlocked.length}/${ACHIEVEMENTS.length})</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${ACHIEVEMENTS.map(a => {
        const done = unlocked.includes(a);
        return `<div class="achievement-badge ${done ? 'unlocked' : 'locked'}">
          <div style="font-size:28px;${done ? '' : 'filter:grayscale(1);opacity:0.3'}">${a.icon}</div>
          <div style="font-size:10px;font-weight:600;margin-top:4px;${done ? 'color:var(--accent)' : 'color:var(--text2)'}">${a.name}</div>
          <div style="font-size:8px;color:var(--text2);margin-top:2px">${a.desc}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ============================================================
// FEATURE 15: TIMELINE / OŚ CZASU W DZIENNIKU
// ============================================================
function renderJournalTimeline(inline) {
  if (state.journal.length === 0) return '';

  let lastDate = null;
  const content = `
    <div class="journal-timeline">
      ${state.journal.map((entry, i) => {
        const d = parsePolishDate(entry.date);
        let gapHtml = '';
        if (lastDate && d) {
          const gap = Math.floor((lastDate - d) / (1000 * 60 * 60 * 24));
          if (gap > 1) {
            gapHtml = `<div class="jtl-gap">${gap} dni przerwy</div>`;
          }
        }
        lastDate = d;
        return `${gapHtml}
        <div class="jtl-item anim-fade-in" style="animation-delay:${i * 0.05}s">
          <div class="jtl-left">
            <div class="jtl-dot" style="background:var(--green)"></div>
            ${i < state.journal.length - 1 ? '<div class="jtl-line"></div>' : ''}
          </div>
          <div class="jtl-content">
            <div class="jtl-photo" onclick="${entry.photo ? `openLightbox(${entry.peakId})` : ''}" style="cursor:${entry.photo ? 'pointer' : 'default'}">
              ${entry.photo ? `<img src="${entry.photo}" alt="${entry.name}">` : '<span style="font-size:24px">📷</span>'}
            </div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px">${entry.name}</div>
              <div style="font-size:11px;color:var(--text2)">📅 ${entry.date} o ${entry.time}</div>
              ${entry.note ? `<div style="font-size:11px;color:var(--text2);margin-top:3px;font-style:italic">"${esc(entry.note)}"</div>` : ''}
              ${entry.dedication ? `<div style="font-size:11px;color:var(--accent);margin-top:2px">🎁 ${esc(entry.dedication)}</div>` : ''}
              <div style="display:flex;gap:6px;margin-top:4px">
                ${entry.photo ? `<button onclick="generateConquestCard(${entry.peakId})" class="btn btn-secondary btn-sm" style="font-size:10px;padding:4px 8px">🎴 Karta</button>` : ''}
                ${entry.photo ? `<button onclick="downloadPhoto(${entry.peakId})" class="btn btn-secondary btn-sm" style="font-size:10px;padding:4px 8px">⬇️ Zdjęcie</button>` : ''}
                <button onclick="removePeak(${entry.peakId})" class="btn btn-secondary btn-sm" style="font-size:10px;padding:4px 8px;color:var(--red)">× Usuń</button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  if (inline) return content;
  return `<div class="card"><div class="card-pad" style="border-bottom:1px solid var(--border)"><div class="section-title">📅 Oś czasu</div></div>${content}</div>`;
}

// ============================================================
// FEATURE 18: GALERIA / LIGHTBOX
// ============================================================
function openLightbox(peakId) {
  const photos = state.journal.filter(e => e.photo);
  const idx = photos.findIndex(e => e.peakId === peakId);
  if (idx === -1) return;

  state._lightboxPhotos = photos;
  state._lightboxIdx = idx;
  renderLightbox();
}

function renderLightbox() {
  const photos = state._lightboxPhotos;
  const idx = state._lightboxIdx;
  const entry = photos[idx];

  document.querySelector('.lightbox-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <div class="lightbox-close" onclick="closeLightbox()">×</div>
    <div class="lightbox-counter">${idx + 1} / ${photos.length}</div>
    ${photos.length > 1 ? `
      <div class="lightbox-nav lightbox-prev" onclick="lightboxNav(-1)">‹</div>
      <div class="lightbox-nav lightbox-next" onclick="lightboxNav(1)">›</div>
    ` : ''}
    <div class="lightbox-img-wrap">
      <img src="${entry.photo}" class="lightbox-img" alt="${entry.name}">
    </div>
    <div class="lightbox-caption">
      <div style="font-weight:600">${entry.name} ${entry.height}m</div>
      <div style="font-size:12px;color:var(--text2)">${entry.date} o ${entry.time}</div>
    </div>`;

  // Swipe support
  let startX = 0;
  overlay.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
  overlay.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 60) {
      lightboxNav(diff > 0 ? -1 : 1);
    }
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

  document.body.appendChild(overlay);
}

function lightboxNav(dir) {
  const photos = state._lightboxPhotos;
  let idx = state._lightboxIdx + dir;
  if (idx < 0) idx = photos.length - 1;
  if (idx >= photos.length) idx = 0;
  state._lightboxIdx = idx;
  renderLightbox();
}

function closeLightbox() {
  document.querySelector('.lightbox-overlay')?.remove();
}

// ============================================================
// FEATURE 19: DASHBOARD Z WYKRESAMI
// ============================================================
function renderDashboard() {
  if (state.journal.length === 0) return '';

  // Szczyty na miesiąc
  const monthData = {};
  state.journal.forEach(e => {
    const d = parsePolishDate(e.date);
    if (d) {
      const key = d.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' });
      monthData[key] = (monthData[key] || 0) + 1;
    }
  });
  const months = Object.entries(monthData).reverse();
  const maxMonth = Math.max(...months.map(m => m[1]), 1);

  // Łączne statystyki
  let totalDist = 0, totalAscent = 0, totalDescent = 0;
  state.journal.forEach(e => {
    const p = PEAKS.find(pk => pk.id === e.peakId);
    if (p) {
      const r = getRoute(p);
      totalDist += r.trail.dist;
      totalAscent += r.trail.ascent;
      totalDescent += r.trail.ascent; // descent ~ ascent
    }
  });

  // Trudność
  const avgDiff = state.conquered.length > 0
    ? (state.conquered.reduce((s, id) => { const p = PEAKS.find(pk => pk.id === id); return s + (p ? p.difficulty : 0); }, 0) / state.conquered.length).toFixed(1)
    : 0;

  // Dzień tygodnia
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  state.journal.forEach(e => {
    const d = parsePolishDate(e.date);
    if (d) dayCounts[d.getDay()]++;
  });
  const maxDay = Math.max(...dayCounts, 1);

  return `
  <div class="card card-pad">
    <div class="section-title">📊 Podsumowanie</div>

    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-card">
        <div class="stat-val">${totalDist.toFixed(0)}</div>
        <div class="stat-label">km na szlakach</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${(totalAscent/1000).toFixed(1)}</div>
        <div class="stat-label">km w górę (przewyższenia)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${avgDiff}</div>
        <div class="stat-label">Śr. trudność</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${Math.round(totalDist * 1000 * 0.04 + totalAscent * 0.5 + totalDescent * 0.15)}</div>
        <div class="stat-label">Łączne kcal</div>
      </div>
    </div>

    <div style="font-size:12px;color:var(--text2);margin-bottom:6px;font-weight:600">Szczyty na miesiąc</div>
    <div class="chart-bars" style="margin-bottom:16px">
      ${months.map(([label, count]) => `
        <div class="chart-bar-col">
          <div class="chart-bar-val">${count}</div>
          <div class="chart-bar" style="height:${Math.round(count / maxMonth * 60)}px"></div>
          <div class="chart-bar-label">${label}</div>
        </div>`).join('')}
    </div>

    <div style="font-size:12px;color:var(--text2);margin-bottom:6px;font-weight:600">Ulubiony dzień tygodnia</div>
    <div class="chart-bars">
      ${dayCounts.map((count, i) => `
        <div class="chart-bar-col">
          <div class="chart-bar-val">${count || ''}</div>
          <div class="chart-bar" style="height:${Math.round(count / maxDay * 40)}px;${count === Math.max(...dayCounts) ? 'background:var(--green)' : ''}"></div>
          <div class="chart-bar-label">${dayNames[i]}</div>
        </div>`).join('')}
    </div>
  </div>`;
}
