// ============================================================
// FEATURES 20-28: TRUDNIEJSZE FUNKCJE
// ============================================================

// ============================================================
// FEATURE 20: GENERATOR WYDRUKU A4 (9x13cm)
// ============================================================
function printPhotos() {
  const entries = state.journal.filter(e => e.photo);
  if (entries.length === 0) { showToast('Brak zdjęć do wydruku'); return; }

  const win = window.open('', '_blank');
  const styles = '@page{size:A4;margin:10mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif}.page{page-break-after:always;display:grid;grid-template-columns:1fr 1fr;gap:8mm;padding:5mm}.page:last-child{page-break-after:auto}.photo-card{width:90mm;height:130mm;border:1px dashed #ccc;position:relative;overflow:hidden;break-inside:avoid}.photo-card img{width:100%;height:105mm;object-fit:cover;display:block}.photo-card .caption{padding:3mm;text-align:center;background:#fff}.photo-card .caption .name{font-size:14px;font-weight:700}.photo-card .caption .meta{font-size:10px;color:#666;margin-top:2px}.cut-guide{position:absolute;top:-1px;left:-1px;right:-1px;bottom:-1px;border:1px dashed #aaa;pointer-events:none}@media screen{body{background:#eee;padding:20px}.page{background:#fff;max-width:210mm;margin:0 auto 20px;box-shadow:0 2px 10px #0002}}';

  let html = '<!DOCTYPE html><html><head><title>KGP - Wydruk 9x13</title><style>' + styles + '</style></head><body>';

  for (let i = 0; i < entries.length; i += 4) {
    html += '<div class="page">';
    for (let j = i; j < Math.min(i + 4, entries.length); j++) {
      const e = entries[j];
      html += '<div class="photo-card"><img src="' + e.photo + '" alt="' + e.name + '"><div class="caption"><div class="name">' + e.name + ' ' + e.height + 'm</div><div class="meta">' + e.range + ' - ' + e.date + '</div>' + (e.dedication ? '<div class="meta">' + e.dedication + '</div>' : '') + '</div><div class="cut-guide"></div></div>';
    }
    html += '</div>';
  }
  html += '<script>setTimeout(function(){window.print()},500)</script></body></html>';
  win.document.write(html);
  win.document.close();
}

// ============================================================
// FEATURE 21: "PAKUJ SIE!" - DYNAMICZNA LISTA RZECZY
// ============================================================
function getPackingList(peak) {
  const month = new Date().getMonth() + 1;
  const route = getRoute(peak);
  const isWinter = month <= 3 || month === 12;
  const isAlpine = peak.terrain === 'alpine' || peak.terrain === 'exposed';
  const isLong = route.trail.dist > 12;
  const isHard = peak.difficulty >= 4;

  const items = [
    { name: 'Buty trekkingowe', icon: '\u{1F97E}', always: true },
    { name: 'Woda (min. 1.5L)', icon: '\u{1F4A7}', always: true },
    { name: 'Kanapki / batony', icon: '\u{1F96A}', always: true },
    { name: 'Telefon + powerbank', icon: '\u{1F4F1}', always: true },
    { name: 'Mapa / GPS', icon: '\u{1F5FA}', always: true },
    { name: 'Kurtka przeciwdeszczowa', icon: '\u{1F9E5}', always: true },
    { name: 'Apteczka', icon: '\u{1FA79}', always: true },
    { name: 'Czołówka', icon: '\u{1F526}', cond: isLong || isHard, reason: 'Długa trasa' },
    { name: 'Kije trekkingowe', icon: '\u{1F962}', cond: isHard || isAlpine, reason: peak.terrain },
    { name: 'Kask', icon: '\u{26D1}', cond: peak.id === 1, reason: 'Rysy - eksponowane' },
    { name: 'Raki / raczki', icon: '\u{1F9CA}', cond: isWinter && isAlpine, reason: 'Zima + alpejski' },
    { name: 'Getry', icon: '\u{1F9BF}', cond: isWinter, reason: 'Śnieg' },
    { name: 'Ciepła bielizna termiczna', icon: '\u{1F9E4}', cond: isWinter, reason: 'Mróz' },
    { name: 'Czapka + rękawice', icon: '\u{1F9E3}', cond: isWinter || isAlpine, reason: 'Zimno na szczycie' },
    { name: 'Okulary przeciwsłoneczne', icon: '\u{1F576}', cond: isAlpine || (month >= 5 && month <= 8), reason: 'Ochrona oczu' },
    { name: 'Krem z filtrem SPF50', icon: '\u{1F9F4}', cond: isAlpine && month >= 5, reason: 'Silne UV' },
    { name: 'Bilet wstępu (park narodowy)', icon: '\u{1F3AB}', cond: [1,2,5,12,26].includes(peak.id), reason: 'Park narodowy' },
    { name: 'Książeczka KGP + długopis', icon: '\u{1F4D6}', always: true },
  ];

  return items.filter(i => i.always || i.cond);
}

function renderPackingList(peak) {
  const items = getPackingList(peak);
  return `
  <div class="card card-pad">
    <div class="section-title">\u{1F392} Pakuj się!</div>
    <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Lista na podstawie: ${peak.terrain}, trudność ${peak.difficulty}/5, ${new Date().toLocaleDateString('pl-PL',{month:'long'})}</div>
    ${items.map(i => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:16px">${i.icon}</span>
        <span style="font-size:13px;flex:1">${i.name}</span>
        ${i.reason ? `<span style="font-size:9px;color:var(--accent);background:var(--card2);padding:2px 6px;border-radius:4px">${i.reason}</span>` : ''}
      </div>`).join('')}
  </div>`;
}

// ============================================================
// FEATURE 22: CIEKAWOSTKI O KGP
// ============================================================
const KGP_FUN_FACTS = [
  'Rekord zdobycia wszystkich 28 szczytów KGP wynosi 3 dni 5 godzin i 25 minut (2019).',
  'Rysy (2499m) to jedyny szczyt KGP powyżej 2000m n.p.m.',
  'Łysica (614m) to najniższy szczyt w Koronie Gór Polski.',
  'Korona Gór Polski powstała w 1997 roku z inicjatywy Jerzego Galewskiego.',
  'Aby oficjalnie zdobyć KGP, trzeba wejść na 28 szczytów i zebrać pieczątki w książeczce.',
  'Najtrudniejsze szczyty KGP to Rysy i Babia Góra - wymagają dobrej pogody i kondycji.',
  'Najłatwiejsze szczyty KGP (Waligóra, Skopiec) można zdobyć w 30-40 minut.',
  'Lackowa w Beskidzie Niskim jest najmniej uczęszczanym szczytem KGP.',
  'Szczeliniec Wielki w Górach Stołowych to najwyższy szczyt gór płaskich w Polsce.',
  'Wysoka Kopa w Górach Izerskich jest zamknięta - szczyt wyłączony z ruchu dla ochrony cietrzewia.',
  'Łączne przewyższenie wszystkich 28 tras KGP to ponad 14 000 metrów - prawie 2x Everest!',
  'Średni czas zdobycia pełnej Korony to ok. 2-3 lata.',
  'Biskupia Kopa leży na granicy polsko-czeskiej - z wieży widać trzy kraje.',
  'Ślęża (718m) była świętą górą starożytnych Słowian.',
  'Turbacz w Gorcach oferuje jeden z najlepszych widoków na Tatry w Polsce.',
];

function getRandomFunFact() {
  return KGP_FUN_FACTS[Math.floor(Math.random() * KGP_FUN_FACTS.length)];
}

function renderFunFact() {
  return `
  <div class="card card-pad" style="border-color:var(--accent)22">
    <div style="display:flex;gap:10px;align-items:flex-start">
      <span style="font-size:20px">💡</span>
      <div>
        <div style="font-size:10px;color:var(--accent);font-weight:600;margin-bottom:4px">CIEKAWOSTKA</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.5">${getRandomFunFact()}</div>
      </div>
    </div>
  </div>`;
}

// ============================================================
// FEATURE 23: NAWIGACJA POWROTNA "DO AUTA"
// ============================================================
function saveParkingLocation() {
  if (!state.userLat || !state.userLon) { showToast('Brak GPS - nie mogę zapisać lokalizacji'); return; }
  localStorage.setItem('kgp_parking_lat', state.userLat);
  localStorage.setItem('kgp_parking_lon', state.userLon);
  showToast('Lokalizacja parkingu zapisana!');
}

function getSavedParking() {
  const lat = parseFloat(localStorage.getItem('kgp_parking_lat'));
  const lon = parseFloat(localStorage.getItem('kgp_parking_lon'));
  if (lat && lon) return { lat, lon };
  return null;
}

function navigateToSavedParking() {
  const parking = getSavedParking();
  if (!parking) { showToast('Nie zapisano lokalizacji parkingu!'); return; }
  if (state.userLat && state.userLon) {
    window.open('https://mapy.com/fnc/v1/route?start=' + state.userLon + ',' + state.userLat + '&end=' + parking.lon + ',' + parking.lat + '&routeType=foot_fast', '_blank');
  } else {
    window.open('https://maps.google.com/?q=' + parking.lat + ',' + parking.lon, '_blank');
  }
}

function renderParkingButtons() {
  const saved = getSavedParking();
  let html = '<div style="display:flex;gap:8px;margin-top:8px">';
  html += '<button class="btn btn-secondary btn-sm" style="flex:1" onclick="saveParkingLocation()">📍 Zapisz parking</button>';
  if (saved) html += '<button class="btn btn-green btn-sm" style="flex:1" onclick="navigateToSavedParking()">🅿️ Wróć do auta</button>';
  html += '</div>';
  if (saved) html += '<div style="font-size:10px;color:var(--text2);margin-top:4px">Zapisany parking: ' + saved.lat.toFixed(4) + ', ' + saved.lon.toFixed(4) + '</div>';
  return html;
}

// ============================================================
// FEATURE 24: "OKNO POGODOWE" - NAJLEPSZY TERMIN
// ============================================================
function findBestWeatherDay(weatherData, peak) {
  if (!weatherData || !weatherData.time) return null;
  let bestIdx = -1;
  let bestScore = -1;

  for (let i = 0; i < weatherData.time.length; i++) {
    const code = weatherData.weathercode[i];
    const wind = weatherData.windspeed_10m_max[i];
    const precip = weatherData.precipitation_sum[i];
    const score = scoreWeather(code, wind, precip, peak.terrain);

    let points = 0;
    if (score === 'good') points = 3;
    else if (score === 'risky') points = 1;

    const d = new Date(weatherData.time[i] + 'T12:00:00');
    if (d.getDay() === 0 || d.getDay() === 6) points += 0.5;
    points -= wind / 100;

    if (points > bestScore) { bestScore = points; bestIdx = i; }
  }

  if (bestIdx === -1 || bestScore <= 0) return null;
  const bestDate = new Date(weatherData.time[bestIdx] + 'T12:00:00');
  const dayNames = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];
  return {
    date: bestDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' }),
    dayName: dayNames[bestDate.getDay()],
    wind: Math.round(weatherData.windspeed_10m_max[bestIdx]),
    precip: weatherData.precipitation_sum[bestIdx],
    isWeekend: bestDate.getDay() === 0 || bestDate.getDay() === 6
  };
}

// ============================================================
// FEATURE 25: RESTAURACJE BLISKO PARKINGU
// ============================================================
function getRestaurantSearchUrl(peak) {
  const parking = getRoute(peak).parking;
  if (parking.lat && parking.lon) {
    return 'https://www.google.com/maps/search/restauracja+jedzenie/@' + parking.lat + ',' + parking.lon + ',14z';
  }
  return 'https://www.google.com/maps/search/restauracja+jedzenie+' + encodeURIComponent(parking.name + ', Polska');
}

// ============================================================
// FEATURE 26: WYZWANIE GRUPOWE
// ============================================================
function renderGroupChallenge() {
  const groupCode = localStorage.getItem('kgp_group_code');
  const groupData = JSON.parse(localStorage.getItem('kgp_group_data') || '[]');

  if (!groupCode) {
    return `
    <div class="card card-pad">
      <div class="section-title">👥 Wyzwanie grupowe</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Rywalizuj z przyjaciółmi! Stwórz grupę lub dołącz do istniejącej.</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-green btn-sm" style="flex:1" onclick="createGroup()">🆕 Nowa grupa</button>
      </div>
      <div style="font-size:11px;color:var(--text2);margin-top:8px">Masz kod grupy? Wpisz go:</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <input class="input" id="group-code-input" placeholder="np. EKIPA2026" style="flex:1;font-size:13px">
        <button class="btn btn-secondary btn-sm" onclick="joinGroup(document.getElementById('group-code-input').value)">Dołącz</button>
      </div>
    </div>`;
  }

  let membersHtml = '';
  if (groupData.length > 0) {
    groupData.sort((a,b) => b.count - a.count).forEach((m, i) => {
      const isMe = m.name === state.userName;
      membersHtml += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">';
      membersHtml += '<div style="font-family:var(--font-display);font-size:20px;color:' + (i===0?'var(--accent)':'var(--text2)') + ';width:24px">' + (i+1) + '.</div>';
      membersHtml += '<div style="flex:1;font-size:13px;font-weight:' + (isMe?'700':'400') + '">' + m.name + (isMe?' (Ty)':'') + '</div>';
      membersHtml += '<div style="font-family:var(--font-display);font-size:18px;color:var(--accent)">' + m.count + '/28</div></div>';
    });
  } else {
    membersHtml = '<div style="font-size:12px;color:var(--text2)">Brak danych grupy. Synchronizuj aby zobaczyć ranking.</div>';
  }

  return `
  <div class="card card-pad">
    <div class="section-title">👥 Wyzwanie grupowe</div>
    <div style="background:var(--card2);border-radius:10px;padding:10px;margin-bottom:10px;text-align:center">
      <div style="font-size:10px;color:var(--text2)">Kod grupy</div>
      <div style="font-family:var(--font-display);font-size:22px;color:var(--accent);letter-spacing:1px">${groupCode}</div>
    </div>
    ${membersHtml}
    <button class="btn btn-secondary btn-sm btn-full" style="margin-top:10px" onclick="syncGroupData()">🔄 Synchronizuj grupę</button>
    <button class="btn btn-sm btn-full" style="margin-top:6px;background:none;color:var(--red);font-size:11px" onclick="leaveGroup()">Opuść grupę</button>
  </div>`;
}

function createGroup() {
  const code = 'EKIPA' + Math.random().toString(36).substring(2, 6).toUpperCase();
  localStorage.setItem('kgp_group_code', code);
  syncGroupData();
  showToast('Grupa utworzona: ' + code);
  goto('journal');
}

function joinGroup(code) {
  if (!code || code.trim().length < 3) { showToast('Podaj kod grupy'); return; }
  localStorage.setItem('kgp_group_code', code.trim().toUpperCase());
  syncGroupData();
  showToast('Dołączono do grupy!');
  goto('journal');
}

function leaveGroup() {
  if (!confirm('Opuścić grupę?')) return;
  localStorage.removeItem('kgp_group_code');
  localStorage.removeItem('kgp_group_data');
  showToast('Opuszczono grupę');
  goto('journal');
}

async function syncGroupData() {
  const code = localStorage.getItem('kgp_group_code');
  if (!code) return;
  const profileId = getProfileId();
  if (!profileId) { showToast('Potrzebujesz kodu sync aby korzystać z grup'); return; }

  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await sb.from('group_members').upsert({
      group_code: code, profile_id: profileId,
      name: state.userName || 'Anonim', count: state.conquered.length
    }, { onConflict: 'group_code,profile_id' });

    const { data } = await sb.from('group_members').select('name,count').eq('group_code', code);
    if (data) {
      localStorage.setItem('kgp_group_data', JSON.stringify(data));
      showToast('Grupa zsynchronizowana!');
      goto('journal');
    }
  } catch(e) {
    console.error('Group sync error:', e);
    showToast('Błąd synchronizacji grupy');
  }
}

// ============================================================
// FEATURE 27: LIVE TRACKER "ILE JESZCZE?"
// ============================================================
let _trackingInterval = null;

function startTrailTracking(peakId) {
  const peak = PEAKS.find(p => p.id === peakId);
  if (!peak) return;
  if (!state.userLat || !state.userLon) { showToast('Włącz GPS aby śledzić trasę'); return; }

  state._tracking = {
    peakId, startLat: state.userLat, startLon: state.userLon,
    startTime: Date.now(), targetLat: peak.lat, targetLon: peak.lon,
    totalDist: getRoute(peak).trail.dist * 1000
  };
  localStorage.setItem('kgp_tracking', JSON.stringify(state._tracking));
  updateTracker();
  _trackingInterval = setInterval(updateTracker, 10000);
  showToast('Tracking rozpoczęty!');
}

function stopTrailTracking() {
  clearInterval(_trackingInterval);
  _trackingInterval = null;
  state._tracking = null;
  localStorage.removeItem('kgp_tracking');
  showToast('Tracking zatrzymany');
  const el = document.getElementById('tracker-panel');
  if (el) el.innerHTML = '';
}

function updateTracker() {
  const t = state._tracking;
  if (!t || !state.userLat) return;

  const distToTarget = dist(state.userLat, state.userLon, t.targetLat, t.targetLon);
  const distFromStart = dist(state.userLat, state.userLon, t.startLat, t.startLon);
  const elapsed = Math.round((Date.now() - t.startTime) / 60000);
  const progress = Math.min(100, Math.max(0, Math.round((1 - distToTarget / t.totalDist) * 100)));
  const speedMpm = elapsed > 0 ? distFromStart / elapsed : 50;
  const etaMin = speedMpm > 0 ? Math.round(distToTarget / speedMpm) : 0;

  const el = document.getElementById('tracker-panel');
  if (!el) return;
  el.innerHTML = '<div class="card card-pad" style="border-color:var(--green)44">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<div class="section-title" style="margin-bottom:0">🏃 Live tracker</div>' +
    '<button class="btn btn-sm" style="background:var(--red);color:#fff;font-size:10px;padding:4px 10px" onclick="stopTrailTracking()">Stop</button></div>' +
    '<div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill" style="width:' + progress + '%;background:var(--green)"></div></div>' +
    '<div class="stats-grid">' +
    '<div class="stat-card"><div class="stat-val" style="font-size:22px">' + (distToTarget/1000).toFixed(1) + '</div><div class="stat-label">km do szczytu</div></div>' +
    '<div class="stat-card"><div class="stat-val" style="font-size:22px">' + (etaMin > 0 ? '~' + etaMin : '?') + '</div><div class="stat-label">min pozostało</div></div>' +
    '<div class="stat-card"><div class="stat-val" style="font-size:22px">' + elapsed + '</div><div class="stat-label">min w drodze</div></div>' +
    '<div class="stat-card"><div class="stat-val" style="font-size:22px">' + progress + '%</div><div class="stat-label">postęp trasy</div></div>' +
    '</div></div>';
}

function restoreTracking() {
  const saved = localStorage.getItem('kgp_tracking');
  if (saved) {
    state._tracking = JSON.parse(saved);
    _trackingInterval = setInterval(updateTracker, 10000);
  }
}

// ============================================================
// FEATURE 28: OSTRZEZENIA OD UZYTKOWNIKOW
// ============================================================
async function loadWarnings(peakId) {
  const el = document.getElementById('warnings-content');
  if (!el) return;
  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await sb.from('warnings').select('*').eq('peak_id', peakId).order('created_at', { ascending: false }).limit(5);
    if (!data || data.length === 0) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text2)">Brak ostrzeżeń. Bądź pierwszy!</div>';
      return;
    }
    el.innerHTML = data.map(w =>
      '<div style="padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<div style="font-size:12px">' + esc(w.message) + '</div>' +
      '<div style="font-size:10px;color:var(--text2);margin-top:4px">' + (w.author || 'Anonim') + ' - ' + new Date(w.created_at).toLocaleDateString('pl-PL') + '</div></div>'
    ).join('');
  } catch(e) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text2)">Offline - brak dostępu do ostrzeżeń</div>';
  }
}

async function addWarning(peakId) {
  const input = document.getElementById('warning-input');
  const msg = input && input.value ? input.value.trim() : '';
  if (!msg) { showToast('Wpisz treść ostrzeżenia'); return; }
  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await sb.from('warnings').insert({ peak_id: peakId, message: msg, author: state.userName || 'Anonim', profile_id: getProfileId() });
    input.value = '';
    showToast('Ostrzeżenie dodane!');
    loadWarnings(peakId);
  } catch(e) { showToast('Nie udało się dodać ostrzeżenia'); }
}

function renderWarningsSection(peakId) {
  return '<div class="card card-pad">' +
    '<div class="section-title">⚠️ Ostrzeżenia szlakowe</div>' +
    '<div id="warnings-content" style="margin-bottom:10px"><div style="font-size:12px;color:var(--text2)">Ładowanie...</div></div>' +
    '<div style="display:flex;gap:8px">' +
    '<input class="input" id="warning-input" placeholder="Np. Brak pieczątki, zamknięty szlak..." style="flex:1;font-size:12px">' +
    '<button class="btn btn-secondary btn-sm" onclick="addWarning(' + peakId + ')">Dodaj</button></div></div>';
}

// ============================================================
// FEATURE 29: WPISZ HISTORYCZNE WEJSCIE
// ============================================================
function openHistoryEntry() {
  goto('history');
}

function renderHistoryEntry() {
  const todo = PEAKS.filter(p => !isDone(p.id));

  if (todo.length === 0) {
    return `
    <div class="header">
      <span class="header-icon">📝</span>
      <div><div class="header-title">Dodaj wejście</div><div class="header-sub">Wszystkie szczyty zdobyte!</div></div>
    </div>
    <div class="page page-gap" style="padding-bottom:80px;text-align:center;padding-top:40px">
      <div style="font-size:48px;margin-bottom:12px">🏆</div>
      <div style="font-size:16px;color:var(--accent);font-weight:700">Gratulacje!</div>
      <div style="font-size:13px;color:var(--text2);margin-top:8px">Masz już wszystkie 28 szczytów w dzienniku.</div>
      <button class="btn btn-secondary" style="margin-top:20px" onclick="goto('journal')">← Wróć do dziennika</button>
    </div>`;
  }

  return `
  <div class="header">
    <span class="header-icon">📝</span>
    <div><div class="header-title">Dodaj wejście</div><div class="header-sub">Wpisz wcześniej zdobyte szczyty</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <div class="card card-pad">
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px">Zdobyłeś już szczyty wcześniej? Wpisz je tutaj - zdjęcie i GPS nie są wymagane.</div>

      <div style="margin-bottom:10px">
        <div class="label">Szczyt</div>
        <select class="input" id="hist-peak" style="font-size:14px">
          ${todo.map(p => `<option value="${p.id}">${p.name} (${p.height}m) - ${p.range}</option>`).join('')}
        </select>
      </div>

      <div style="margin-bottom:10px">
        <div class="label">Data wejścia</div>
        <input class="input" type="date" id="hist-date" value="${new Date().toISOString().split('T')[0]}">
      </div>

      <div style="margin-bottom:10px">
        <div class="label">Zdjęcie (opcjonalnie)</div>
        <input type="file" id="hist-photo" accept="image/*" class="input" style="padding:8px">
      </div>

      <div style="margin-bottom:10px">
        <div class="label">Notatka (opcjonalnie)</div>
        <input class="input" type="text" id="hist-note" placeholder="Pogoda, towarzysze, wspomnienia...">
      </div>

      <div style="margin-bottom:12px">
        <div class="label">Dedykacja (opcjonalnie)</div>
        <input class="input" type="text" id="hist-dedication" placeholder="Ten szczyt dedykuję...">
      </div>

      <button class="btn btn-green btn-full" onclick="saveHistoryEntry()">✅ Dodaj do dziennika</button>
    </div>

    <button class="btn btn-secondary btn-full" onclick="goto('journal')">← Wróć do dziennika</button>

  </div>`;
}

function parseInputDate(dateInput) {
  const parts = dateInput.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function saveHistoryEntry() {
  const peakId = parseInt(document.getElementById('hist-peak').value);
  if (state.conquered.includes(peakId)) { showToast('Ten szczyt już jest zdobyty'); return; }

  const peak = PEAKS.find(p => p.id === peakId);
  const dateInput = document.getElementById('hist-date').value;
  const note = document.getElementById('hist-note').value || '';
  const dedication = document.getElementById('hist-dedication').value || '';
  const fileInput = document.getElementById('hist-photo');

  const d = parseInputDate(dateInput);
  const dateStr = d.toLocaleDateString('pl-PL');

  function doSave(photo) {
    state.conquered.push(peakId);
    const entry = {
      peakId, name: peak.name, height: peak.height, range: peak.range,
      date: dateStr, time: '', note: note, dedication: dedication,
      photo: photo || null, gpsLat: null, gpsLon: null, historical: true
    };
    state.journal.push(entry);
    state.journal.sort((a, b) => {
      const pa = a.date.split('.').map(Number);
      const pb = b.date.split('.').map(Number);
      return (pb[2]*10000+pb[1]*100+pb[0]) - (pa[2]*10000+pa[1]*100+pa[0]);
    });
    save();
    if (photo) uploadPhoto(peakId, photo, 'summit');
    showToast('\u{1F389} ' + peak.name + ' dodana do dziennika!');
    goto('history');
  }

  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async e => {
      const compressed = await compressPhoto(e.target.result, 800, 0.6);
      doSave(compressed);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    doSave(null);
  }
}

