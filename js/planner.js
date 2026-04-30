// ============================================================
// PLANER WYPRAW
// ============================================================

// Sesyjne pola planera (nie persystowane)
state._plannerView = 'list';    // 'list' | 'editor'
state._activeTripId = null;     // ID edytowanej wyprawy
state._activeDayIdx = 0;        // aktywna zakładka dnia

// ============================================================
// TYPY PRZYSTANKÓW
// ============================================================
const STOP_TYPES = {
  start:     { icon: '🏠', label: 'Start' },
  drive:     { icon: '🚗', label: 'Przejazd' },
  parking:   { icon: '🅿️', label: 'Parking' },
  hike_up:   { icon: '🥾', label: 'Podejście' },
  summit:    { icon: '🏔️', label: 'Szczyt' },
  hike_down: { icon: '🔽', label: 'Zejście' },
  lodge:     { icon: '🛏️', label: 'Nocleg' },
  food:      { icon: '🍽️', label: 'Restauracja' },
  attraction:{ icon: '🏰', label: 'Atrakcja' },
  poi:       { icon: '📍', label: 'Punkt' },
  end:       { icon: '🏁', label: 'Koniec' },
};

// ============================================================
// GŁÓWNY RENDER
// ============================================================
function renderPlanner() {
  if (state._plannerView === 'editor' && state._activeTripId) {
    const trip = state.trips.find(t => t.id === state._activeTripId);
    if (trip) return renderTripEditor(trip);
  }
  state._plannerView = 'list';
  return renderTripList();
}

function getLocationMismatchWarning() {
  if (!state._homeGeo || !state.userLat || !state.userLon) return '';
  const d = dist(state._homeGeo.lat, state._homeGeo.lon, state.userLat, state.userLon);
  if (d < 50000) return ''; // mniej niż 50km - OK
  const kmAway = Math.round(d / 1000);
  return `
    <div style="background:var(--accent)15;border:1px solid var(--accent)44;border-radius:var(--radius);padding:12px;font-size:12px;color:var(--text2);line-height:1.5">
      📍 Jesteś <b style="color:var(--accent)">${kmAway}km</b> od adresu domowego (${esc(state.homeAddr)}). Odległości liczone są od adresu w ustawieniach.
      <div style="margin-top:6px"><button class="btn btn-secondary btn-sm" onclick="goto('settings')">⚙️ Zmień adres</button></div>
    </div>`;
}

// ============================================================
// LISTA WYPRAW
// ============================================================
function renderTripList() {
  const trips = state.trips || [];
  const upcoming = trips.filter(t => new Date(t.endDate) >= new Date()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const past = trips.filter(t => new Date(t.endDate) < new Date()).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return `
  <div class="header">
    <span class="header-icon">📋</span>
    <div><div class="header-title">Moje Wyprawy</div><div class="header-sub">${trips.length} ${trips.length === 1 ? 'wyprawa' : trips.length < 5 ? 'wyprawy' : 'wypraw'}</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <button class="btn btn-primary btn-full" onclick="createTrip()" style="margin-bottom:4px">
      + Nowa wyprawa
    </button>

    ${getLocationMismatchWarning()}

    ${upcoming.length > 0 ? `
    <div style="font-size:11px;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">Nadchodzące</div>
    ${upcoming.map(t => renderTripCard(t)).join('')}` : ''}

    ${past.length > 0 ? `
    <div style="font-size:11px;color:var(--text2);font-weight:600;text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">Zakończone</div>
    ${past.map(t => renderTripCard(t)).join('')}` : ''}

    ${trips.length === 0 ? `
    <div class="card card-pad" style="text-align:center;padding:32px 16px">
      <div style="font-size:48px;margin-bottom:12px">🏔️</div>
      <div style="font-weight:600;font-size:15px;margin-bottom:8px">Brak zaplanowanych wypraw</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.5">Zaplanuj swoją pierwszą wyprawę w góry - dodaj szczyty, parkingi, noclegi i restauracje w jednym miejscu.</div>
    </div>` : ''}

    ${renderQuickPlanSection()}

  </div>`;
}

function renderTripCard(trip) {
  // Zawsze przelicz daty z faktycznych dni
  if (trip.days && trip.days.length > 0) {
    trip.startDate = trip.days[0].date;
    trip.endDate = trip.days[trip.days.length - 1].date;
  }

  const days = trip.days || [];
  const peakIds = [];
  days.forEach(d => (d.stops || []).forEach(s => { if (s.type === 'summit' && s.peakId) peakIds.push(s.peakId); }));
  const peaks = peakIds.map(id => PEAKS.find(p => p.id === id)).filter(Boolean);
  const peakNames = peaks.map(p => p.name).join(', ') || 'Brak szczytów';
  const isPast = new Date(trip.endDate) < new Date();

  return `
  <div class="card card-pad" style="cursor:pointer;${isPast ? 'opacity:0.7' : ''}" onclick="openTrip('${trip.id}')">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="font-size:28px">${peaks.length > 0 ? '🏔️' : '📋'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">${esc(trip.name)}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">${fmtTripDates(trip)} - ${days.length} ${days.length === 1 ? 'dzień' : 'dni'} - ${peaks.length} ${peaks.length === 1 ? 'szczyt' : 'szczytów'}</div>
        <div style="font-size:11px;color:var(--accent);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${peakNames}</div>
      </div>
      <span style="color:var(--text2);font-size:18px">›</span>
    </div>
  </div>`;
}

function renderQuickPlanSection() {
  const todo = getTodo();
  if (todo.length === 0) return '';

  const refLat = (state._homeGeo && state._homeGeo.lat) || state.userLat;
  const refLon = (state._homeGeo && state._homeGeo.lon) || state.userLon;
  const sorted = [...todo];
  if (refLat && refLon) {
    sorted.sort((a, b) => dist(refLat, refLon, a.lat, a.lon) - dist(refLat, refLon, b.lat, b.lon));
  }
  const nearest = sorted[0];
  const easiest = [...todo].sort((a,b) => a.difficulty - b.difficulty)[0];
  const month = new Date().getMonth() + 1;
  const seasonal = todo.find(p => p.season.includes(month)) || todo[0];

  const distLabel = (p) => refLat && refLon ? '~' + Math.round(dist(refLat, refLon, p.lat, p.lon) / 1000 * 1.3) + 'km' : p.range;

  const peakRow = (emoji, tag, p, desc) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card2);border-radius:10px;cursor:pointer" onclick="quickTrip(${p.id})">
      <span style="font-size:24px">${emoji}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px">${p.name} <span style="color:var(--accent);font-weight:400">${p.height}m</span></div>
        <div style="font-size:11px;color:var(--text2)">${tag} · ${desc}</div>
      </div>
      <span style="color:var(--text2)">›</span>
    </div>`;

  // Buduj listę: 3 wyróżnione + reszta
  const highlighted = [nearest.id];
  let suggestionsHtml = peakRow('📍', 'Najbliższy', nearest, distLabel(nearest));
  if (easiest.id !== nearest.id) { suggestionsHtml += peakRow('😊', 'Najłatwiejszy', easiest, 'Trudność ' + easiest.difficulty + '/5 · ' + distLabel(easiest)); highlighted.push(easiest.id); }
  if (seasonal.id !== nearest.id && seasonal.id !== easiest.id) { suggestionsHtml += peakRow('🌡️', 'Sezonowy', seasonal, 'Polecany na ' + new Date().toLocaleString('pl',{month:'long'}) + ' · ' + distLabel(seasonal)); highlighted.push(seasonal.id); }

  const rest = sorted.filter(p => !highlighted.includes(p.id));
  const restHtml = rest.map(p => peakRow('⛰️', p.range, p, distLabel(p))).join('');

  return `
  <div class="card card-pad" style="margin-top:8px;cursor:pointer" onclick="toggleSection('whatnext-section',this)">
    <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">
      <div class="section-title" style="margin:0">🤔 Co dalej? - ${todo.length} niezdobytych</div>
      <span style="font-size:12px;color:var(--text2)">▼</span>
    </div>
    <div id="whatnext-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
      <div style="display:flex;flex-direction:column;gap:6px">
        ${suggestionsHtml}
        ${restHtml}
      </div>
    </div>
  </div>`;
}

// ============================================================
// EDYTOR WYPRAWY
// ============================================================
function renderTripEditor(trip) {
  const days = trip.days || [];
  const dayIdx = Math.min(state._activeDayIdx, days.length - 1);
  const activeDay = days[dayIdx];

  return `
  <div class="header">
    <span class="header-icon" style="cursor:pointer" onclick="closeTripEditor()">←</span>
    <div style="flex:1">
      <div class="header-title" contenteditable="true" onblur="renameTripFromEl(this,'${trip.id}')" style="outline:none;min-width:50px;border-bottom:1px dashed var(--text2);padding-bottom:2px;cursor:text" title="Kliknij aby zmienić nazwę">${esc(trip.name)}</div>
      <div class="header-sub">${fmtTripDates(trip)} - ${trip.days.length} ${trip.days.length === 1 ? 'dzień' : 'dni'}</div>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="showTripMenu('${trip.id}')" style="font-size:16px;padding:6px 10px">⋮</button>
  </div>
  <div class="page" style="padding-bottom:80px">

    <div class="card card-pad" style="display:flex;gap:8px;align-items:center">
      <div style="flex:1">
        <div class="label">Data rozpoczęcia</div>
        <input class="input" type="date" value="${trip.startDate}" onchange="updateTripDates('${trip.id}',this.value)">
      </div>
    </div>

    ${days.length > 0 ? `
    <div class="chips" style="padding:8px 0">
      ${days.map((d, i) => `
        <span class="chip ${i === dayIdx ? 'active' : ''}" onclick="switchDay('${trip.id}',${i})">
          Dzień ${i + 1}${d.date ? ` (${fmtDayLabel(d.date)})` : ''}
        </span>
      `).join('')}
      <span class="chip" onclick="addDay('${trip.id}')" style="border-style:dashed">+ Dzień</span>
    </div>` : ''}

    ${activeDay ? renderTripDay(trip, dayIdx) : `
    <div class="card card-pad" style="text-align:center;padding:32px">
      <div style="font-size:36px;margin-bottom:8px">📅</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:12px">Dodaj pierwszy dzień wyprawy</div>
      <button class="btn btn-primary" onclick="addDay('${trip.id}')">+ Dodaj dzień</button>
    </div>`}

  </div>`;
}

// ============================================================
// DZIEŃ WYPRAWY
// ============================================================
function renderTripDay(trip, dayIdx) {
  const day = trip.days[dayIdx];
  const stops = day.stops || [];
  const tripId = trip.id;

  // Oblicz czasy
  const calculated = calcDayTimes(trip, dayIdx);

  return `
    <div class="card card-pad">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="section-title" style="margin-bottom:0">Dzień ${dayIdx + 1} ${day.date ? `- ${fmtDayLabel(day.date)}` : ''}</div>
        <button class="btn btn-sm" style="background:var(--red);color:#fff;font-size:11px;padding:4px 10px" onclick="removeDay('${tripId}',${dayIdx})">Usuń dzień</button>
      </div>

      ${stops.length > 0 ? `
      <div class="planner-timeline">
        ${stops.map((stop, i) => renderStopRow(tripId, dayIdx, stop, i, stops.length, calculated[i])).join('')}
      </div>` : `
      <div style="text-align:center;padding:16px;color:var(--text2);font-size:13px">Brak przystanków - dodaj pierwszy punkt trasy</div>`}

      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="showAddStop('${tripId}',${dayIdx})">+ Dodaj z listy</button>
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="openMapPicker('${tripId}',${dayIdx})">📍 Dodaj z mapy</button>
      </div>
    </div>

    ${renderDayWeatherCard(trip, dayIdx)}
  `;
}

function renderStopRow(tripId, dayIdx, stop, idx, total, calcTime) {
  const meta = STOP_TYPES[stop.type] || STOP_TYPES.poi;
  const peak = stop.peakId ? PEAKS.find(p => p.id === stop.peakId) : null;
  const displayName = stop.name || (peak ? peak.name : meta.label);
  const timeStr = calcTime || stop.time || '';
  const hasCheckpoint = stop.gpsCheckpoint != null;

  let detailParts = [];
  if (stop.distance) detailParts.push(`${stop.distance} km`);
  if (stop.duration) detailParts.push(fmtTime(stop.duration));
  if (peak && stop.type === 'summit') detailParts.push(`${peak.height}m - ${peak.range}`);
  if (peak && stop.type === 'hike_up') {
    const route = getRoute(peak);
    detailParts.push(`${route.trail.dist} km - ↑${route.trail.ascent}m - ${fmtTime(adjTime(route.trail.up))}`);
  }
  if (peak && stop.type === 'hike_down') {
    const route = getRoute(peak);
    detailParts.push(`${fmtTime(adjTime(route.trail.down))}`);
  }
  if (stop.addr) detailParts.push(stop.addr);
  const detail = detailParts.join(' - ');

  return `
  <div class="pl-stop ${idx < total - 1 ? 'pl-stop-border' : ''}" id="stop-${stop.id}">
    <div class="pl-stop-left">
      <div class="pl-stop-dot">${meta.icon}</div>
      ${idx < total - 1 ? '<div class="pl-stop-line"></div>' : ''}
    </div>
    <div class="pl-stop-content">
      <div style="display:flex;align-items:center;gap:6px">
        ${timeStr ? `<span class="pl-stop-time">${timeStr}</span>` : ''}
        <span class="pl-stop-name">${esc(displayName)}</span>
        ${hasCheckpoint ? '<span style="font-size:10px;color:var(--green)" title="Potwierdzone GPS">✅</span>' : ''}
      </div>
      ${detail ? `<div class="pl-stop-detail">${detail}</div>` : ''}
      ${stop.notes ? `<div class="pl-stop-notes">${esc(stop.notes)}</div>` : ''}
    </div>
    <div class="pl-stop-actions">
      <div class="pl-actions-col">
        ${idx > 0 ? `<button class="pl-btn-move" onclick="moveStop('${tripId}',${dayIdx},${idx},-1)">↑</button>` : '<div style="width:36px;height:36px"></div>'}
        ${idx < total - 1 ? `<button class="pl-btn-move" onclick="moveStop('${tripId}',${dayIdx},${idx},1)">↓</button>` : '<div style="width:36px;height:36px"></div>'}
      </div>
      <div class="pl-actions-col">
        <button class="pl-btn-move" onclick="editStop('${tripId}',${dayIdx},${idx})" style="font-size:11px">✏️</button>
        <button class="pl-btn-move" onclick="removeStop('${tripId}',${dayIdx},${idx})" style="color:var(--red)">✕</button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// OBLICZANIE CZASÓW
// ============================================================
function calcDayTimes(trip, dayIdx) {
  const day = trip.days[dayIdx];
  const stops = day.stops || [];
  const times = [];
  let currentMin = 0; // minuty od startu

  // Znajdź czas startu
  const startStop = stops.find(s => s.type === 'start');
  const startTime = startStop?.time || trip.startTime || '07:00';
  const [sh, sm] = startTime.split(':').map(Number);
  currentMin = sh * 60 + sm;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const h = Math.floor(currentMin / 60) % 24;
    const m = currentMin % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

    // Dodaj czas trwania do następnego przystanku
    if (stop.duration) {
      currentMin += stop.duration;
    } else if (stop.type === 'summit') {
      currentMin += 30; // domyślnie 30 min na szczycie
    } else if (stop.peakId && stop.type === 'hike_up') {
      const peak = PEAKS.find(p => p.id === stop.peakId);
      if (peak) currentMin += adjTime(getRoute(peak).trail.up);
    } else if (stop.peakId && stop.type === 'hike_down') {
      const peak = PEAKS.find(p => p.id === stop.peakId);
      if (peak) currentMin += adjTime(getRoute(peak).trail.down);
    }
  }

  return times;
}

// ============================================================
// POGODA W KONTEKŚCIE DNIA
// ============================================================
function renderDayWeatherCard(trip, dayIdx) {
  const day = trip.days[dayIdx];
  const peakStops = (day.stops || []).filter(s => s.type === 'summit' && s.peakId);
  if (peakStops.length === 0) return '';

  const peak = PEAKS.find(p => p.id === peakStops[0].peakId);
  if (!peak) return '';

  return `
    <div class="card card-pad" id="weather-section">
      <div class="section-title">🌤️ Prognoza - ${peak.name}</div>
      <div id="weather-content"><div style="color:var(--text2);font-size:13px;text-align:center;padding:20px">Ładowanie prognozy... ☁️</div></div>
    </div>
    <div class="card card-pad" id="sun-section">
      <div class="section-title">🌅 Wschód / zachód słońca</div>
      <div id="sun-content" style="font-size:13px;color:var(--text2)">Ładowanie...</div>
    </div>
    ${renderPackingList(peak)}
    ${renderWarningsSection(peak.id)}
  `;
}

// ============================================================
// TWORZENIE I ZARZĄDZANIE WYPRAWAMI
// ============================================================
function createTrip() {
  const today = new Date();
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const nextSun = new Date(nextSat);
  nextSun.setDate(nextSat.getDate() + 1);

  const trip = {
    id: 'trip_' + Date.now(),
    name: 'Nowa wyprawa',
    created: today.toISOString().slice(0, 10),
    startDate: nextSat.toISOString().slice(0, 10),
    endDate: nextSat.toISOString().slice(0, 10),
    base: null,
    shareCode: null,
    days: [
      { date: nextSat.toISOString().slice(0, 10), stops: [{ id: 'stop_' + Date.now(), type: 'start', name: state.homeAddr || '', time: '07:00' }] }
    ]
  };

  state.trips.push(trip);
  save();
  openTrip(trip.id);
}

function quickTrip(peakId) {
  const peak = PEAKS.find(p => p.id === peakId);
  if (!peak) return;

  const today = new Date();
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));

  const route = getRoute(peak);
  const parking = route.parking || (peak.parking && peak.parking[0]);

  const trip = {
    id: 'trip_' + Date.now(),
    name: peak.name,
    created: today.toISOString().slice(0, 10),
    startDate: nextSat.toISOString().slice(0, 10),
    endDate: nextSat.toISOString().slice(0, 10),
    base: null,
    shareCode: null,
    days: [{
      date: nextSat.toISOString().slice(0, 10),
      stops: [
        { id: 'stop_' + Date.now(), type: 'start', name: state.homeAddr || 'Dom', time: '07:00' },
        { id: 'stop_' + (Date.now() + 1), type: 'drive', name: `Dojazd do ${parking?.name || 'parkingu'}`, duration: null },
        { id: 'stop_' + (Date.now() + 2), type: 'parking', name: parking?.name || 'Parking', lat: parking?.lat, lon: parking?.lon },
        { id: 'stop_' + (Date.now() + 3), type: 'hike_up', name: `Podejście na ${peak.name}`, peakId: peak.id },
        { id: 'stop_' + (Date.now() + 4), type: 'summit', name: peak.name, peakId: peak.id, lat: peak.lat, lon: peak.lon },
        { id: 'stop_' + (Date.now() + 5), type: 'hike_down', name: `Zejście do ${parking?.name || 'parkingu'}`, peakId: peak.id },
        { id: 'stop_' + (Date.now() + 6), type: 'drive', name: 'Powrót do domu', duration: null },
        { id: 'stop_' + (Date.now() + 7), type: 'end', name: state.homeAddr || 'Dom' },
      ]
    }]
  };

  state.trips.push(trip);
  save();
  openTrip(trip.id);
  showToast(`📋 Wyprawa na ${peak.name} utworzona`);
}

function openTrip(tripId) {
  state._plannerView = 'editor';
  state._activeTripId = tripId;
  state._activeDayIdx = 0;
  goto('plan');
}

function closeTripEditor() {
  state._plannerView = 'list';
  state._activeTripId = null;
  goto('plan');
}

// ============================================================
// EDYCJA WYPRAWY
// ============================================================
function renameTripFromEl(el, tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const name = el.textContent.trim();
  if (name && name !== trip.name) {
    trip.name = name;
    save();
  }
}

function updateTripDates(tripId, startDate) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;

  const oldStart = new Date(trip.startDate);
  const newStart = new Date(startDate);
  const diffDays = Math.round((newStart - oldStart) / 86400000);

  trip.startDate = startDate;

  // Przesuń daty wszystkich dni o tę samą różnicę
  trip.days.forEach(d => {
    const dt = new Date(d.date);
    dt.setDate(dt.getDate() + diffDays);
    d.date = dt.toISOString().slice(0, 10);
  });

  // Zaktualizuj endDate na ostatni dzień
  if (trip.days.length > 0) {
    trip.endDate = trip.days[trip.days.length - 1].date;
  } else {
    trip.endDate = startDate;
  }

  save();
  goto('plan');
}

function shiftTripDates(tripId, days) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const shift = d => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
  };
  trip.startDate = shift(trip.startDate);
  trip.endDate = shift(trip.endDate);
  trip.days.forEach(d => { d.date = shift(d.date); });
  save();
  goto('plan');
  showToast(`📅 Przesunięto o ${days > 0 ? '+' : ''}${days} dni`);
}

// ============================================================
// DNI
// ============================================================
function addDay(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const lastDate = trip.days.length > 0 ? trip.days[trip.days.length - 1].date : trip.startDate;
  const next = new Date(lastDate);
  next.setDate(next.getDate() + 1);
  const newDate = next.toISOString().slice(0, 10);

  trip.days.push({
    date: newDate,
    stops: [{ id: 'stop_' + Date.now(), type: 'start', name: trip.base?.name || state.homeAddr || '', time: '07:00' }]
  });

  // Rozszerz endDate jeśli trzeba
  if (newDate > trip.endDate) trip.endDate = newDate;

  state._activeDayIdx = trip.days.length - 1;
  save();
  goto('plan');
}

function removeDay(tripId, dayIdx) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip || trip.days.length <= 1) {
    showToast('Wyprawa musi mieć minimum 1 dzień');
    return;
  }
  trip.days.splice(dayIdx, 1);
  state._activeDayIdx = Math.min(state._activeDayIdx, trip.days.length - 1);

  // Przelicz zakres dat na podstawie pozostałych dni
  if (trip.days.length > 0) {
    trip.startDate = trip.days[0].date;
    trip.endDate = trip.days[trip.days.length - 1].date;
  }

  save();
  goto('plan');
  showToast('Dzień usunięty');
}

function switchDay(tripId, dayIdx) {
  state._activeDayIdx = dayIdx;
  goto('plan');
}

// ============================================================
// PRZYSTANKI
// ============================================================
function showAddStop(tripId, dayIdx) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const _rLat = (state._homeGeo && state._homeGeo.lat) || state.userLat;
  const _rLon = (state._homeGeo && state._homeGeo.lon) || state.userLon;
  const peaksSorted = [...PEAKS];
  if (_rLat && _rLon) {
    peaksSorted.sort((a, b) => dist(_rLat, _rLon, a.lat, a.lon) - dist(_rLat, _rLon, b.lat, b.lon));
  }
  const peakOptions = peaksSorted.map(p => {
    const d = _rLat && _rLon ? Math.round(dist(_rLat, _rLon, p.lat, p.lon) / 1000 * 1.3) : null;
    return `<div class="peak-item" style="cursor:pointer" onclick="addPeakStops('${tripId}',${dayIdx},${p.id});this.closest('.modal-overlay').remove()">
      <span class="peak-dot ${isDone(p.id) ? 'done' : 'todo'}"></span>
      <div class="peak-info"><div class="peak-name">${p.name}</div><div class="peak-meta">${p.range}${d ? ' · ~'+d+'km' : ''}</div></div>
      <div class="peak-height">${p.height}m</div>
    </div>`;
  }).join('');

  overlay.innerHTML = `
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="padding:16px">
      <div style="font-family:var(--font-display);font-size:20px;color:var(--accent);margin-bottom:12px">Dodaj przystanek</div>

      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:8px">SZCZYT KGP (dodaje parking + podejście + szczyt + zejście)</div>
      <div class="card" style="max-height:200px;overflow-y:auto;margin-bottom:16px">${peakOptions}</div>

      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:8px">INNY PRZYSTANEK</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${Object.entries(STOP_TYPES).filter(([k]) => !['summit', 'hike_up', 'hike_down'].includes(k)).map(([type, meta]) =>
          `<button class="btn btn-secondary btn-sm" onclick="addManualStop('${tripId}',${dayIdx},'${type}');this.closest('.modal-overlay').remove()">${meta.icon} ${meta.label}</button>`
        ).join('')}
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);
}

function addPeakStops(tripId, dayIdx, peakId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const day = trip.days[dayIdx];
  if (!day) return;

  const peak = PEAKS.find(p => p.id === peakId);
  if (!peak) return;
  const route = getRoute(peak);
  const parking = route.parking || (peak.parking && peak.parking[0]);
  const now = Date.now();

  const newStops = [
    { id: 'stop_' + now, type: 'parking', name: parking?.name || 'Parking', peakId, lat: parking?.lat, lon: parking?.lon },
    { id: 'stop_' + (now + 1), type: 'hike_up', name: `Podejście na ${peak.name}`, peakId },
    { id: 'stop_' + (now + 2), type: 'summit', name: peak.name, peakId, lat: peak.lat, lon: peak.lon },
    { id: 'stop_' + (now + 3), type: 'hike_down', name: `Zejście do ${parking?.name || 'parkingu'}`, peakId },
  ];

  day.stops.push(...newStops);
  save();
  goto('plan');
  setTimeout(() => { document.getElementById('stop-' + newStops[0].id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  showToast(`🏔️ ${peak.name} dodana do dnia ${dayIdx + 1}`);
}

function addManualStop(tripId, dayIdx, type) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const day = trip.days[dayIdx];
  if (!day) return;

  const meta = STOP_TYPES[type] || STOP_TYPES.poi;
  const stopId = 'stop_' + Date.now();
  day.stops.push({
    id: stopId,
    type,
    name: '',
    notes: ''
  });

  save();
  goto('plan');
  setTimeout(() => { document.getElementById('stop-' + stopId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function moveStop(tripId, dayIdx, stopIdx, direction) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const stops = trip.days[dayIdx]?.stops;
  if (!stops) return;

  const newIdx = stopIdx + direction;
  if (newIdx < 0 || newIdx >= stops.length) return;

  [stops[stopIdx], stops[newIdx]] = [stops[newIdx], stops[stopIdx]];
  save();
  goto('plan');
}

function removeStop(tripId, dayIdx, stopIdx) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  trip.days[dayIdx]?.stops.splice(stopIdx, 1);
  save();
  goto('plan');
}

function editStop(tripId, dayIdx, stopIdx) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const stop = trip.days[dayIdx]?.stops[stopIdx];
  if (!stop) return;
  const meta = STOP_TYPES[stop.type] || STOP_TYPES.poi;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="padding:16px">
      <div style="font-family:var(--font-display);font-size:20px;color:var(--accent);margin-bottom:12px">${meta.icon} Edytuj przystanek</div>
      <div class="label">Nazwa</div>
      <input class="input" type="text" id="edit-stop-name" value="${esc(stop.name)}" placeholder="${meta.label}">
      ${stop.type === 'lodge' || stop.type === 'food' || stop.type === 'attraction' ? `
      <div class="label" style="margin-top:8px">Adres</div>
      <input class="input" type="text" id="edit-stop-addr" value="${esc(stop.addr || '')}" placeholder="Adres lub lokalizacja...">` : ''}
      <div class="label" style="margin-top:8px">Czas trwania (minuty)</div>
      <input class="input" type="number" id="edit-stop-duration" value="${stop.duration || ''}" placeholder="Automatycznie">
      <div class="label" style="margin-top:8px">Godzina</div>
      <input class="input" type="time" id="edit-stop-time" value="${stop.time || ''}">
      <div class="label" style="margin-top:8px">Notatki</div>
      <textarea class="input" id="edit-stop-notes" rows="2" placeholder="Opcjonalne...">${esc(stop.notes || '')}</textarea>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" style="flex:1" onclick="saveStopEdit('${tripId}',${dayIdx},${stopIdx});this.closest('.modal-overlay').remove()">💾 Zapisz</button>
        <button class="btn btn-secondary" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
      </div>
      ${stop.lat ? `<div style="font-size:10px;color:var(--text2);margin-top:8px">📍 ${stop.lat.toFixed(5)}, ${stop.lon.toFixed(5)}</div>` : ''}
    </div>
  </div>`;

  document.body.appendChild(overlay);
  overlay.querySelector('#edit-stop-name')?.focus();
}

function saveStopEdit(tripId, dayIdx, stopIdx) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const stop = trip.days[dayIdx]?.stops[stopIdx];
  if (!stop) return;

  stop.name = document.getElementById('edit-stop-name').value.trim();
  const addrEl = document.getElementById('edit-stop-addr');
  if (addrEl) stop.addr = addrEl.value.trim();
  const dur = document.getElementById('edit-stop-duration').value;
  stop.duration = dur ? parseInt(dur) : null;
  stop.time = document.getElementById('edit-stop-time').value || null;
  stop.notes = document.getElementById('edit-stop-notes').value.trim();

  save();
  goto('plan');
}

// ============================================================
// GPS CHECKPOINT
// ============================================================
function gpsCheckpoint(tripId, dayIdx, stopIdx) {
  if (!state.gpsActive || !state.userLat) {
    showToast('📍 GPS nieaktywny - włącz lokalizację');
    return;
  }

  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const stop = trip.days[dayIdx]?.stops[stopIdx];
  if (!stop) return;

  stop.gpsCheckpoint = {
    lat: state.userLat,
    lon: state.userLon,
    timestamp: new Date().toISOString(),
    accuracy: 10
  };

  // Zapisz do discovered places
  if (stop.name && stop.lat) {
    const exists = state.discoveredPlaces.find(p =>
      p.name === stop.name && dist(p.lat, p.lon, state.userLat, state.userLon) < 200
    );
    if (!exists) {
      state.discoveredPlaces.push({
        name: stop.name,
        type: stop.type,
        lat: state.userLat,
        lon: state.userLon,
        peakId: stop.peakId || null,
        date: new Date().toISOString().slice(0, 10)
      });
    }
  }

  save();
  goto('plan');
  showToast('✅ Pozycja potwierdzona GPS');
}

// ============================================================
// MENU WYPRAWY
// ============================================================
function showTripMenu(tripId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      <div style="font-family:var(--font-display);font-size:20px;color:var(--accent);margin-bottom:4px">Opcje wyprawy</div>
      <button class="btn btn-secondary btn-full" onclick="shiftTripDates('${tripId}',7);this.closest('.modal-overlay').remove()">📅 Przesuń o +1 tydzień</button>
      <button class="btn btn-secondary btn-full" onclick="shiftTripDates('${tripId}',-7);this.closest('.modal-overlay').remove()">📅 Przesuń o -1 tydzień</button>
      <button class="btn btn-secondary btn-full" onclick="duplicateTrip('${tripId}');this.closest('.modal-overlay').remove()">📋 Duplikuj wyprawę</button>
      <button class="btn btn-secondary btn-full" onclick="shareTrip('${tripId}');this.closest('.modal-overlay').remove()">🔗 Udostępnij</button>
      <button class="btn btn-full" style="background:var(--red);color:#fff" onclick="deleteTrip('${tripId}');this.closest('.modal-overlay').remove()">🗑️ Usuń wyprawę</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);
}

function deleteTrip(tripId) {
  if (!confirm('Usunąć tę wyprawę? Nie można cofnąć.')) return;
  state.trips = state.trips.filter(t => t.id !== tripId);
  save();
  closeTripEditor();
  showToast('Wyprawa usunięta');
}

function duplicateTrip(tripId) {
  const original = state.trips.find(t => t.id === tripId);
  if (!original) return;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = 'trip_' + Date.now();
  copy.name = original.name + ' (kopia)';
  copy.created = new Date().toISOString().slice(0, 10);
  copy.shareCode = null;
  state.trips.push(copy);
  save();
  openTrip(copy.id);
  showToast('📋 Wyprawa zduplikowana');
}

async function shareTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;

  // Generuj shareCode
  if (!trip.shareCode) {
    const peakName = (() => {
      for (const d of trip.days) {
        for (const s of d.stops) {
          if (s.peakId) {
            const p = PEAKS.find(pk => pk.id === s.peakId);
            if (p) return p.name.toLowerCase().replace(/\s+/g, '-').replace(/[ąćęłńóśźż]/g, c =>
              ({ą:'a',ć:'c',ę:'e',ł:'l',ń:'n',ó:'o',ś:'s',ź:'z',ż:'z'}[c] || c)
            );
          }
        }
      }
      return 'wyprawa';
    })();
    trip.shareCode = `trip-${peakName}-${Math.random().toString(36).slice(2, 6)}`;
    save();
  }

  // Zapisz do Supabase shared_trips
  const profileId = getProfileId();
  if (profileId && navigator.onLine) {
    try {
      await sb.from('shared_trips').upsert({
        share_code: trip.shareCode,
        creator_id: profileId,
        trip_data: trip
      }, { onConflict: 'share_code' });
    } catch (e) {
      console.error('Share error:', e);
    }
  }

  // Kopiuj link
  const url = `${location.origin}${location.pathname}#trip/${trip.shareCode}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('🔗 Link skopiowany do schowka!');
  } catch {
    showToast(`🔗 Kod: ${trip.shareCode}`);
  }
}

async function loadSharedTrip(shareCode) {
  if (!navigator.onLine) {
    showToast('Potrzebujesz internetu aby pobrać plan');
    return;
  }
  try {
    const { data, error } = await sb.from('shared_trips')
      .select('trip_data').eq('share_code', shareCode).single();
    if (error || !data) {
      showToast('❌ Nie znaleziono wyprawy');
      return;
    }
    const trip = data.trip_data;
    trip.id = 'trip_' + Date.now();
    trip.shareCode = null;
    state.trips.push(trip);
    save();
    openTrip(trip.id);
    showToast(`📋 Wyprawa "${trip.name}" dodana!`);
  } catch (e) {
    console.error('Load shared trip error:', e);
    showToast('❌ Błąd pobierania wyprawy');
  }
}

// ============================================================
// MAP PICKER (fullscreen overlay)
// ============================================================
function openMapPicker(tripId, dayIdx) {
  const overlay = document.createElement('div');
  overlay.id = 'map-picker-overlay';
  overlay.innerHTML = `
  <div style="position:fixed;inset:0;z-index:300;background:var(--bg);display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="closeMapPicker()">✕</button>
      <div style="flex:1;font-weight:700;font-size:14px">Wybierz punkt na mapie</div>
      <button class="btn btn-primary btn-sm" id="map-picker-confirm" disabled onclick="confirmMapPick('${tripId}',${dayIdx})">Dodaj</button>
    </div>
    <div style="padding:8px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;gap:8px">
      <input type="text" id="map-picker-search" placeholder="Szukaj: parking, schronisko, restauracja..." style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px">
      <button class="btn btn-primary btn-sm" onclick="mapPickerSearch()" style="white-space:nowrap">🔍 Szukaj</button>
    </div>
    <div id="map-picker-results" style="display:none;background:var(--bg2);border-bottom:1px solid var(--border);max-height:180px;overflow-y:auto"></div>
    <div id="map-picker-container" style="flex:1"></div>
    <div id="map-picker-info" style="padding:12px 16px;background:var(--bg2);border-top:1px solid var(--border);display:none">
      <div id="map-picker-name" style="font-weight:600;font-size:14px"></div>
      <div id="map-picker-coords" style="font-size:11px;color:var(--text2);margin-top:2px"></div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap" id="map-picker-types"></div>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  // Znajdź szczyt z dnia wyprawy, żeby wycentrować mapę
  const trip = state.trips.find(t => t.id === tripId);
  let centerLat = state.userLat || 50.0;
  let centerLon = state.userLon || 19.5;
  let initZoom = state.userLat ? 12 : 8;

  if (trip && trip.days[dayIdx]) {
    const day = trip.days[dayIdx];
    // Szukaj szczytu w przystankach dnia
    const peakStop = day.stops.find(s => s.type === 'summit' && s.peakId);
    if (peakStop) {
      const peak = PEAKS.find(p => p.id === peakStop.peakId);
      if (peak) {
        centerLat = peak.lat;
        centerLon = peak.lon;
        initZoom = 14; // Zoom 14+ pokazuje symbole POI na kafelkach outdoor
      }
    } else {
      // Weź pierwszy przystanek z koordynatami
      const withCoords = day.stops.find(s => s.lat && s.lon);
      if (withCoords) {
        centerLat = withCoords.lat;
        centerLon = withCoords.lon;
        initZoom = 14;
      }
    }
  }

  // Inicjalizuj mini-mapę
  setTimeout(() => {
    const pickerMap = L.map('map-picker-container', {
      center: [centerLat, centerLon],
      zoom: initZoom
    });

    L.tileLayer(`https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?lang=pl&apikey=${MAPY_API_KEY}`, {
      maxZoom: 18,
      attribution: '© Mapy.com'
    }).addTo(pickerMap);

    let pickerMarker = null;
    window._pickerMap = pickerMap;
    window._pickerData = { lat: null, lon: null, name: '', type: 'poi' };
    window._pickerSearchMarkers = [];

    // Enter w polu wyszukiwania
    document.getElementById('map-picker-search').addEventListener('keydown', e => {
      if (e.key === 'Enter') mapPickerSearch();
    });

    pickerMap.on('click', async e => {
      const { lat, lng: lon } = e.latlng;
      mapPickerSelectPoint(lat, lon, pickerMap, pickerMarker);
      pickerMarker = window._pickerMarker;
    });

    // Dodaj markery istniejących przystanków z tego dnia
    if (trip && trip.days[dayIdx]) {
      trip.days[dayIdx].stops.filter(s => s.lat && s.lon).forEach(s => {
        const meta = STOP_TYPES[s.type] || STOP_TYPES.poi;
        L.marker([s.lat, s.lon], {
          icon: L.divIcon({ className: '', html: `<div style="font-size:20px">${meta.icon}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] })
        }).addTo(pickerMap).bindTooltip(s.name || meta.label);
      });
    }

    // Oznacz szczyt na mapie
    if (trip && trip.days[dayIdx]) {
      const peakStop = trip.days[dayIdx].stops.find(s => s.type === 'summit' && s.peakId);
      if (peakStop) {
        const peak = PEAKS.find(p => p.id === peakStop.peakId);
        if (peak) {
          L.marker([peak.lat, peak.lon], {
            icon: L.divIcon({ className: '', html: `<div style="font-size:24px">🏔️</div>`, iconSize: [28, 28], iconAnchor: [14, 14] })
          }).addTo(pickerMap).bindTooltip(peak.name, { permanent: true, direction: 'top', offset: [0, -10] });
        }
      }
    }
  }, 100);
}

// Wyszukiwanie w map pickerze (geocoding Mapy.com)
async function mapPickerSearch() {
  const input = document.getElementById('map-picker-search');
  const query = (input?.value || '').trim();
  if (!query) return;

  const resultsDiv = document.getElementById('map-picker-results');
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<div style="padding:12px 16px;color:var(--text2);font-size:13px">Szukam...</div>';

  try {
    // Użyj aktualnego widoku mapy jako kontekstu wyszukiwania
    const map = window._pickerMap;
    const center = map ? map.getCenter() : null;
    let url = `https://api.mapy.com/v1/geocode?query=${encodeURIComponent(query)}&lang=pl&limit=6&apiKey=${MAPY_API_KEY}`;
    if (center) {
      url += `&preferNear=${center.lng},${center.lat}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      resultsDiv.innerHTML = '<div style="padding:12px 16px;color:var(--text2);font-size:13px">Brak wyników</div>';
      return;
    }

    // Wyczyść stare markery wyszukiwania
    clearPickerSearchMarkers();

    resultsDiv.innerHTML = items.map((item, i) => {
      const name = item.name || 'Bez nazwy';
      const label = item.label || '';
      const loc = item.location ? `${item.location.address || ''}` : '';
      const region = [item.location?.municipality, item.location?.county, item.location?.region].filter(Boolean).join(', ');
      const detail = loc || region || label;
      return `<div onclick="mapPickerSelectResult(${i})" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
        <span style="font-size:18px">📍</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(name)}</div>
          ${detail ? `<div style="font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(detail)}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    // Zapisz wyniki i dodaj markery na mapie
    window._pickerSearchResults = items;
    if (map) {
      items.forEach((item, i) => {
        const lat = item.position?.lat;
        const lon = item.position?.lon;
        if (lat && lon) {
          const marker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:var(--accent);color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${i + 1}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(map).bindTooltip(item.name || '');
          window._pickerSearchMarkers.push(marker);
        }
      });

      // Dopasuj widok do wyników
      const bounds = items.filter(it => it.position?.lat && it.position?.lon)
        .map(it => [it.position.lat, it.position.lon]);
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      else if (bounds.length === 1) map.setView(bounds[0], 15);
    }
  } catch (err) {
    resultsDiv.innerHTML = '<div style="padding:12px 16px;color:var(--text2);font-size:13px">Błąd wyszukiwania</div>';
  }
}

// Wybierz wynik wyszukiwania
function mapPickerSelectResult(idx) {
  const item = window._pickerSearchResults?.[idx];
  if (!item || !item.position) return;

  const lat = item.position.lat;
  const lon = item.position.lon;
  const map = window._pickerMap;

  // Ukryj wyniki
  document.getElementById('map-picker-results').style.display = 'none';

  // Centruj mapę na wyniku
  if (map) map.setView([lat, lon], 16);

  // Ustaw punkt
  mapPickerSelectPoint(lat, lon, map, null, item.name || '');
}

// Ustaw punkt na mapie (kliknięcie lub wynik wyszukiwania)
async function mapPickerSelectPoint(lat, lon, map, existingMarker, presetName) {
  window._pickerData.lat = lat;
  window._pickerData.lon = lon;

  if (window._pickerMarker) window._pickerMarker.setLatLng([lat, lon]);
  else {
    window._pickerMarker = L.marker([lat, lon]).addTo(map);
  }

  document.getElementById('map-picker-info').style.display = 'block';
  document.getElementById('map-picker-coords').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  document.getElementById('map-picker-confirm').disabled = false;

  if (presetName) {
    window._pickerData.name = presetName;
    document.getElementById('map-picker-name').textContent = presetName;
  } else {
    // Reverse geocode
    document.getElementById('map-picker-name').textContent = 'Szukam nazwy...';
    try {
      const res = await fetch(`https://api.mapy.com/v1/rgeocode?lon=${lon}&lat=${lat}&apikey=${MAPY_API_KEY}`);
      const data = await res.json();
      const name = data.items?.[0]?.name || `Punkt (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      window._pickerData.name = name;
      document.getElementById('map-picker-name').textContent = name;
    } catch {
      window._pickerData.name = `Punkt (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      document.getElementById('map-picker-name').textContent = window._pickerData.name;
    }
  }

  // Auto-detect typu na podstawie nazwy
  const nameLower = (window._pickerData.name || '').toLowerCase();
  if (nameLower.includes('parking') || nameLower.includes('park&ride'))
    window._pickerData.type = 'parking';
  else if (nameLower.includes('schronisk') || nameLower.includes('hotel') || nameLower.includes('pensjonat') || nameLower.includes('hostel'))
    window._pickerData.type = 'lodge';
  else if (nameLower.includes('restaura') || nameLower.includes('karczma') || nameLower.includes('gospoda') || nameLower.includes('bar ') || nameLower.includes('pizz'))
    window._pickerData.type = 'food';
  else
    window._pickerData.type = 'poi';

  // Pokaż przyciski typów
  document.getElementById('map-picker-types').innerHTML = Object.entries(STOP_TYPES)
    .filter(([k]) => !['hike_up', 'hike_down', 'summit', 'drive', 'end'].includes(k))
    .map(([type, meta]) =>
      `<button class="btn btn-sm ${window._pickerData.type === type ? 'btn-primary' : 'btn-secondary'}" onclick="setPickerType('${type}')">${meta.icon} ${meta.label}</button>`
    ).join('');
}

function clearPickerSearchMarkers() {
  (window._pickerSearchMarkers || []).forEach(m => m.remove());
  window._pickerSearchMarkers = [];
}

function setPickerType(type) {
  window._pickerData.type = type;
  document.querySelectorAll('#map-picker-types button').forEach(btn => {
    btn.className = btn.textContent.includes(STOP_TYPES[type]?.label) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  });
}

function confirmMapPick(tripId, dayIdx) {
  const d = window._pickerData;
  if (!d || !d.lat) return;

  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  const day = trip.days[dayIdx];
  if (!day) return;

  const stopId = 'stop_' + Date.now();
  day.stops.push({
    id: stopId,
    type: d.type,
    name: d.name,
    lat: d.lat,
    lon: d.lon,
  });

  save();
  closeMapPicker();
  goto('plan');
  setTimeout(() => { document.getElementById('stop-' + stopId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  showToast(`📍 ${d.name} dodany do planu`);
}

function closeMapPicker() {
  clearPickerSearchMarkers();
  if (window._pickerMap) {
    window._pickerMap.remove();
    window._pickerMap = null;
  }
  window._pickerMarker = null;
  window._pickerSearchResults = null;
  const overlay = document.getElementById('map-picker-overlay');
  if (overlay) overlay.remove();
}

// ============================================================
// HELPERY
// ============================================================
function fmtTripDates(trip) {
  const opts = { day: 'numeric', month: 'short' };
  const s = new Date(trip.startDate + 'T12:00:00');
  const e = new Date(trip.endDate + 'T12:00:00');
  if (trip.startDate === trip.endDate) return s.toLocaleDateString('pl-PL', opts);
  return `${s.toLocaleDateString('pl-PL', opts)} - ${e.toLocaleDateString('pl-PL', opts)}`;
}

function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  return `${days[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString('pl-PL', { month: 'short' })}`;
}
