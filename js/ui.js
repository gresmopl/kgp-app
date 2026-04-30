// ============================================================
// LIST PAGE
// ============================================================
function renderList() {
  const done = state.conquered.length;
  const pct = Math.round(done/28*100);
  let peaks = PEAKS;
  if (state.filter === 'done') peaks = PEAKS.filter(p => isDone(p.id));
  if (state.filter === 'todo') peaks = PEAKS.filter(p => !isDone(p.id));
  const _karpaty = p => p.range.includes('Tatry') || p.range.includes('Beskid') || p.range.includes('Bieszczady') || p.range.includes('Gorce') || p.range.includes('Pieniny');
  const _sudety = p => ['Karkonosze','Góry Izerskie','Góry Stołowe','Góry Kaczawskie','Góry Wałbrzyskie','Góry Kamienne','Góry Sowie','Góry Bardzkie','Góry Bystrzyckie','Góry Orlickie','Góry Bialskie','Góry Złote','Góry Opawskie','Rudawy Janowickie','Masyw Śnieżnika','Masyw Ślęży'].includes(p.range);
  const _inne = p => !_karpaty(p) && !_sudety(p);
  if (state.filter === 'tatry') peaks = PEAKS.filter(_karpaty);
  if (state.filter === 'sudety') peaks = PEAKS.filter(_sudety);
  if (state.filter === 'inne') peaks = PEAKS.filter(_inne);

  return `
  <div class="header">
    <span class="header-icon">⛰️</span>
    <div><div class="header-title">28 Szczytów</div><div class="header-sub">${done} zdobytych · ${28-done} pozostało</div></div>
    <span class="header-badge">${pct}%</span>
  </div>
  <div style="padding:12px 14px 6px">
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>
  <div class="chips">
    <button class="chip ${state.filter==='all'?'active':''}" onclick="setFilter('all')">Wszystkie (28)</button>
    <button class="chip ${state.filter==='done'?'active':''}" onclick="setFilter('done')">Zdobyte (${done})</button>
    <button class="chip ${state.filter==='todo'?'active':''}" onclick="setFilter('todo')">Do zdobycia (${28-done})</button>
    <button class="chip ${state.filter==='tatry'?'active':''}" onclick="setFilter('tatry')">Karpaty (${PEAKS.filter(_karpaty).length})</button>
    <button class="chip ${state.filter==='sudety'?'active':''}" onclick="setFilter('sudety')">Sudety (${PEAKS.filter(_sudety).length})</button>
    <button class="chip ${state.filter==='inne'?'active':''}" onclick="setFilter('inne')">Inne (${PEAKS.filter(_inne).length})</button>
  </div>
  <div class="card" style="margin:0 14px 80px">
    ${peaks.sort((a,b)=>b.height-a.height).map(p => `
    <div class="peak-item" onclick="openPeakDetail(${p.id})">
      <span class="peak-dot ${isDone(p.id)?'done':'todo'}"></span>
      <div class="peak-info">
        <div class="peak-name">${p.name}</div>
        <div class="peak-meta">${p.range} &nbsp;·&nbsp; ${diffDots(p.difficulty)}</div>
      </div>
      <div class="peak-height">${p.height}m</div>
    </div>`).join('')}
  </div>`;
}

function setFilter(f) { state.filter = f; localStorage.setItem('kgp_filter', f); goto('list'); }

// PLAN PAGE — przeniesiona do planner.js jako renderPlanner()

function estimateDriveMin(peak) {
  if (!state.homeAddr || !state.homeAddr.trim()) return null;
  if (state.userLat) {
    const km = dist(state.userLat, state.userLon, peak.lat, peak.lon) / 1000;
    return Math.round(km * 1.2);
  }
  return null;
}

function renderTimeline(peakId, returnHtml=false, startOverride=null) {
  const peak = getPeak(peakId);
  if (!peak) return '';
  const route = getRoute(peak);
  const start = startOverride || state.departTime || '07:00';
  const driveEst = estimateDriveMin(peak);
  const hasDrive = driveEst !== null;
  const upMin = adjTime(route.trail.up);
  const downMin = adjTime(route.trail.down);
  const summitMin = 30;
  const trailTotal = upMin + summitMin + downMin;

  let steps;
  if (hasDrive) {
    const driveMin = driveEst;
    const t1 = start;
    const t2 = addMinutes(t1, driveMin);
    const t3 = addMinutes(t2, upMin);
    const t4 = addMinutes(t3, summitMin);
    const t5 = addMinutes(t4, downMin);
    const t6 = addMinutes(t5, driveMin);
    steps = [
      {t:t1, icon:'🏠', label:'Wyjazd z domu', detail:''},
      {t:t2, icon:'🅿️', label:'Parking / Start szlaku', detail:`Dojazd ~${fmtTime(driveMin)} (szacunek)`},
      {t:t3, icon:'🏔️', label:`Szczyt - ${peak.name}`, detail:`Podejście: ${fmtTime(upMin)} · ${route.trail.ascent}m przewyższenia`},
      {t:t4, icon:'📸', label:'Zdjęcie + pieczątka', detail:`${summitMin} min na szczycie`},
      {t:t5, icon:'🔽', label:'Zejście do parkingu', detail:`Zejście: ${fmtTime(downMin)}`},
      {t:t6, icon:'🏠', label:'Powrót do domu', detail:`Łącznie: ${fmtTime(driveMin*2 + trailTotal)}`}
    ];
  } else {
    const t1 = start;
    const t2 = addMinutes(t1, upMin);
    const t3 = addMinutes(t2, summitMin);
    const t4 = addMinutes(t3, downMin);
    steps = [
      {t:t1, icon:'🅿️', label:'Parking / Start szlaku', detail:''},
      {t:t2, icon:'🏔️', label:`Szczyt - ${peak.name}`, detail:`Podejście: ${fmtTime(upMin)} · ${route.trail.ascent}m przewyższenia`},
      {t:t3, icon:'📸', label:'Zdjęcie + pieczątka', detail:`${summitMin} min na szczycie`},
      {t:t4, icon:'🔽', label:'Powrót do parkingu', detail:`Zejście: ${fmtTime(downMin)} · Łącznie na szlaku: ${fmtTime(trailTotal)}`}
    ];
  }

  const html = `
  <div class="card card-pad">
    <div class="section-title">⏱️ Kalkulator dnia</div>
    ${!hasDrive ? `<div style="background:var(--card2);border-radius:8px;padding:8px;font-size:11px;color:var(--accent);margin-bottom:10px">⚠️ ${!state.homeAddr?.trim() ? 'Wpisz adres startowy aby zobaczyć czas dojazdu.' : 'Włącz GPS aby oszacować czas dojazdu.'} Poniżej tylko czas na szlaku.</div>` : ''}
    <div class="timeline">
      ${steps.map((item, i, arr) => `
        <div class="tl-item">
          <div class="tl-left">
            <div class="tl-dot" style="background:var(--card2)">${item.icon}</div>
            ${i < arr.length-1 ? '<div class="tl-line"></div>' : ''}
          </div>
          <div class="tl-content">
            <div class="tl-time">${item.t}</div>
            <div class="tl-label">${item.label}</div>
            ${item.detail ? `<div class="tl-detail">${item.detail}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px;background:var(--card2);border-radius:10px;font-size:12px;color:var(--text2)">
      📍 Dystans trasy: <b style="color:var(--text)">${route.trail.dist} km</b> &nbsp;·&nbsp;
      ↑ <b style="color:var(--text)">${route.trail.ascent} m</b> przewyższenia
    </div>
  </div>`;

  if (returnHtml) return html;
  const el = document.getElementById('timeline-section');
  if (el) el.innerHTML = html;
}

function renderOptimizer(currentPeak) {
  const todo = getTodo().filter(p => p.id !== currentPeak.id);
  const nearby = todo.filter(p => dist(currentPeak.lat, currentPeak.lon, p.lat, p.lon) < 80000)
    .sort((a,b) => dist(currentPeak.lat,currentPeak.lon,a.lat,a.lon) - dist(currentPeak.lat,currentPeak.lon,b.lat,b.lon))
    .slice(0,3);

  if (nearby.length === 0) return `<div style="color:var(--text2);font-size:13px">Brak pobliskich niezdobytych szczytów w promieniu 80km 🎉</div>`;

  return `<div style="font-size:12px;color:var(--text2);margin-bottom:10px">Możesz połączyć z ${currentPeak.name} w jeden wyjazd:</div>
  ${nearby.map(p => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${p.name}</div>
        <div style="font-size:11px;color:var(--text2)">${p.range} · ${p.height}m</div>
      </div>
      <div style="font-size:11px;color:var(--accent);font-weight:600">${Math.round(dist(currentPeak.lat,currentPeak.lon,p.lat,p.lon)/1000)} km</div>
      <button class="btn btn-secondary btn-sm" onclick="changePlanPeak(${p.id})">Planuj</button>
    </div>`).join('')}`;
}

function updatePace(val) {
  state.paceMultiplier = parseFloat(val);
  const d = document.getElementById('pace-display');
  if (d) d.textContent = parseFloat(val).toFixed(2) + '×';
  save();
}

function changeRoute(peakId, idx) { state.selectedRoutes[peakId] = parseInt(idx); save(); goto('plan'); }
function setTransport(t) { state.transport = t; goto('plan'); }
function changePlanPeak(id) {
  state.selectedPeak = getPeak(id);
  goto('plan');
}

// ============================================================
// SUMMIT PAGE
// ============================================================
function renderSummit() {
  const nearby = state.nearbyPeak ? getPeak(state.nearbyPeak) : null;
  const peak = nearby || state.selectedPeak || getTodo()[0] || PEAKS[0];

  return `
  <div class="header">
    <span class="header-icon">🏔️</span>
    <div><div class="header-title">Tryb Szczyt</div>
    <div class="header-sub">${state.gpsActive?`<span class="gps-pulse"></span> GPS aktywny`:'GPS nieaktywny'}</div></div>
    ${nearby ? '<span style="background:var(--green);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">BLISKO!</span>' : ''}
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <div class="card card-pad">
      <div class="label">Aktualny szczyt</div>
      <select class="input" aria-label="Wybierz szczyt" onchange="changeSummitPeak(this.value)">
        <optgroup label="Do zdobycia">
          ${PEAKS.filter(p=>!isDone(p.id)).map(p=>`<option value="${p.id}" ${peak.id===p.id?'selected':''}>${p.name} (${p.height}m)</option>`).join('')}
        </optgroup>
        <optgroup label="Zdobyte">
          ${PEAKS.filter(p=>isDone(p.id)).map(p=>`<option value="${p.id}" ${peak.id===p.id?'selected':''}>${p.name} ✓</option>`).join('')}
        </optgroup>
      </select>
    </div>

    <div class="summit-header">
      <div class="summit-peak-name">${peak.name}</div>
      <div class="summit-height">${peak.height} m n.p.m. · ${peak.range}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${diffDots(peak.difficulty)} Trudność ${peak.difficulty}/5</div>
      <button onclick="aiPeakInfo(${peak.id})" style="margin-top:10px;background:var(--accent);color:#000;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">🤖 Dowiedz się więcej od AI</button>
    </div>

    <div class="card">
      <div class="card-pad" style="border-bottom:1px solid var(--border)">
        <div class="section-title">📍 Miejsca pieczątek</div>
      </div>
      <div class="card-pad">
        ${peak.stamps.map(s => {
          return `<div class="stamp-item">
            <div class="stamp-icon-wrap">${s.type}</div>
            <div class="stamp-info">
              <div class="stamp-name">${s.name}</div>
              <div class="stamp-note">${s.note}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="navigateToStamp('${s.name.replace(/'/g,'`')}',${s.lat||'null'},${s.lon||'null'})">🧭 Nawiguj</button>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${isDone(peak.id) ? `
    <div class="card card-pad" style="text-align:center">
      <div style="font-size:28px;margin-bottom:6px">✅</div>
      <div style="font-weight:600;color:var(--green);font-size:15px">Szczyt zdobyty!</div>
      ${(()=>{ const e=state.journal.find(j=>j.peakId===peak.id); return e ? '<div style="font-size:12px;color:var(--text2);margin-top:4px">'+e.date+(e.note?' - '+esc(e.note):'')+'</div>' : ''; })()}
    </div>
    ` : `
    <div class="card card-pad">
      <div class="section-title">📸 Gdzie zrobić zdjęcie</div>
      <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:13px;line-height:1.5">📌 ${peak.photo}</div>
      </div>
      <button class="btn btn-primary btn-full" id="photo-btn" onclick="takePhoto()">
        📷 Zrób zdjęcie szczytowe
      </button>
      <div id="photo-preview" style="margin-top:10px;display:none">
        <img id="photo-img" style="width:100%;border-radius:10px;max-height:200px;object-fit:cover">
        <div style="font-size:11px;color:var(--green);margin-top:6px;text-align:center">✅ Zdjęcie zapisane</div>
      </div>
      <input type="file" id="photo-input" aria-label="Zdjęcie ze szczytu" accept="image/*" capture="environment" style="display:none" onchange="photoSelected(this,${peak.id})">
    </div>

    <div class="card card-pad">
      <div class="label" style="margin-bottom:8px">Notatka ze szczytu</div>
      <textarea class="input" id="summit-note" aria-label="Notatka ze szczytu" rows="3" placeholder="Pogoda, widoki, towarzysze..." style="resize:none;line-height:1.5"></textarea>
    </div>

    <button class="btn btn-green btn-full" id="conquer-btn" onclick="conquerPeak(${peak.id})">
      ✅ Oznacz jako zdobyty
    </button>
    `}

    <button class="btn btn-primary btn-full" onclick="navigateToPeak(${peak.id})" style="background:var(--blue,#4a90d9)">
      🗺️ Wyznacz trasę
    </button>

    <button class="btn btn-secondary btn-full" onclick="returnToParking(${peak.id})">
      🧭 Wróć do parkingu
    </button>

  </div>`;
}

function changeSummitPeak(id) {
  state.selectedPeak = getPeak(id);
  goto('summit');
}

function takePhoto() { document.getElementById('photo-input').click(); }

function compressPhoto(dataUrl, maxW, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxW ? maxW / img.width : 1;
      const c = document.createElement('canvas');
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

function photoSelected(input, peakId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressPhoto(e.target.result, 800, 0.6);
    const img = document.getElementById('photo-img');
    img.src = compressed;
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-btn').textContent = '📷 Zmień zdjęcie';
    state.pendingPhoto = compressed;
    state.pendingPeakId = peakId;
    showToast('✅ Zdjęcie gotowe!');
  };
  reader.readAsDataURL(file);
}

function conquerPeak(peakId) {
  if (state.conquered.includes(peakId)) return;
  const note = document.getElementById('summit-note')?.value || '';
  const dedication = document.getElementById('summit-dedication')?.value || '';
  const peak = getPeak(peakId);
  state.conquered.push(peakId);
  const entry = {
    peakId, name: peak.name, height: peak.height, range: peak.range,
    date: new Date().toLocaleDateString('pl-PL'),
    time: new Date().toLocaleTimeString('pl-PL', {hour:'2-digit',minute:'2-digit'}),
    note, dedication, photo: state.pendingPhoto || null,
    gpsLat: state.userLat, gpsLon: state.userLon
  };
  state.journal.unshift(entry);
  save();
  if (state.pendingPhoto) {
    uploadPhoto(peakId, state.pendingPhoto, 'summit').then(url => {
      if (url) {
        entry.photoUrl = url;
        save();
      }
    });
  }
  confetti();
  if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
  showToast(`🎉 ${peak.name} zdobyta! ${state.conquered.length}/28`);
  setTimeout(() => {
    state.pendingPhoto = null;
    goto('next_suggest');
  }, 2000);
}

function openNavigation(lat, lon, label) {
  const url = `https://mapy.com/fnc/v1/route?start=${state.userLon||''},${state.userLat||''}&end=${lon},${lat}&routeType=foot_hiking`;
  window.open(url, '_blank');
}

async function navigateToStamp(stampName, lat, lon) {
  if (lat && lon) {
    openNavigation(lat, lon, stampName);
  } else {
    const coords = await geocodeParking(stampName);
    if (coords) {
      openNavigation(coords.lat, coords.lon, stampName);
    } else {
      window.open(`https://mapy.com/search?q=${encodeURIComponent(stampName + ', Polska')}`, '_blank');
    }
  }
}

function openEpodroznik(stationName) {
  const startInput = document.getElementById('startAddr');
  const from = startInput ? startInput.value : state.homeAddr;
  const to = stationName.replace(/ PKP| PKS| Główny/g, '').trim();
  const url = `https://www.e-podroznik.pl/public/wyniki.do?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  window.open(url, '_blank');
}

async function returnToParking(peakId) {
  const p = getPeak(peakId);
  if (!p) return;
  const pk = getRoute(p).parking;
  const coords = await geocodeParking(pk.name);
  if (coords) {
    const url = `https://mapy.com/fnc/v1/route?start=${state.userLon||''},${state.userLat||''}&end=${coords.lon},${coords.lat}&routeType=foot_fast`;
    window.open(url, '_blank');
  } else {
    window.open(`https://mapy.com/search?q=${encodeURIComponent(pk.name + ', Polska')}`, '_blank');
  }
}

// ============================================================
// PARKING FINDER - mapa z wyszukiwaniem parkingów
// ============================================================
function openParkingFinder(peakId) {
  const peak = getPeak(peakId);
  if (!peak) return;

  const overlay = document.createElement('div');
  overlay.id = 'parking-finder-overlay';
  overlay.innerHTML = `
  <div style="position:fixed;inset:0;z-index:300;background:var(--bg);display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);gap:12px">
      <button class="btn btn-secondary btn-sm" onclick="closeParkingFinder()">✕</button>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">🅿️ Parkingi - ${esc(peak.name)}</div>
        <div style="font-size:11px;color:var(--text2)">Kliknij parking aby zapisać</div>
      </div>
    </div>
    <div id="parking-finder-map" style="flex:1"></div>
    <div id="parking-finder-info" style="padding:12px 16px;background:var(--bg2);border-top:1px solid var(--border);display:none">
      <div id="parking-finder-name" style="font-weight:600;font-size:14px"></div>
      <div id="parking-finder-details" style="font-size:12px;color:var(--text2);margin-top:2px"></div>
      <button class="btn btn-primary btn-full" style="margin-top:8px" id="parking-finder-save" onclick="saveParkingFromFinder(${peakId})">💾 Zapisz ten parking</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  setTimeout(() => {
    const map = L.map('parking-finder-map', {
      center: [peak.lat, peak.lon],
      zoom: 14
    });

    createTileLayer().addTo(map);

    window._parkingFinderMap = map;
    window._parkingFinderData = null;
    window._parkingFinderMarkers = [];

    // Marker szczytu
    L.marker([peak.lat, peak.lon], {
      icon: L.divIcon({ className: '', html: '<div style="font-size:24px">🏔️</div>', iconSize: [28, 28], iconAnchor: [14, 14] })
    }).addTo(map).bindTooltip(peak.name, { permanent: true, direction: 'top', offset: [0, -10] });

    // Istniejące parkingi z danych
    const existingParkings = getParkingList(peak);
    existingParkings.filter(pk => pk.lat && pk.lon).forEach(pk => {
      const m = L.marker([pk.lat, pk.lon], {
        icon: L.divIcon({ className: '', html: '<div style="font-size:20px">🅿️</div>', iconSize: [24, 24], iconAnchor: [12, 12] })
      }).addTo(map).bindTooltip(pk.name, { direction: 'top', offset: [0, -8] });
      m.on('click', () => selectParkingOnMap(pk.lat, pk.lon, pk.name, pk.note || ''));
    });

    // Szukaj parkingów z OSM Overpass
    fetchOsmParkings(peak.lat, peak.lon, 6000, map);

    // Klik na mapę - reverse geocode i zapisz
    map.on('click', async e => {
      const { lat, lng: lon } = e.latlng;
      selectParkingOnMap(lat, lon, null, null);
      // Reverse geocode
      try {
        const data = await reverseGeocode(lat, lon);
        const name = data.items?.[0]?.name || `Parking (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
        window._parkingFinderData.name = name;
        document.getElementById('parking-finder-name').textContent = '🅿️ ' + name;
      } catch {}
    });
  }, 100);
}

function selectParkingOnMap(lat, lon, name, details) {
  const map = window._parkingFinderMap;
  if (!map) return;

  // Usuń stary marker wyboru
  if (window._parkingFinderSelected) window._parkingFinderSelected.remove();
  window._parkingFinderSelected = L.marker([lat, lon]).addTo(map);

  window._parkingFinderData = { lat, lon, name: name || `Parking (${lat.toFixed(5)}, ${lon.toFixed(5)})` };

  const info = document.getElementById('parking-finder-info');
  info.style.display = 'block';
  document.getElementById('parking-finder-name').textContent = '🅿️ ' + (name || 'Wybrany punkt');
  document.getElementById('parking-finder-details').textContent = details || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

async function fetchOsmParkings(lat, lon, radiusM, map) {
  try {
    const query = `[out:json][timeout:10];(node["amenity"="parking"](around:${radiusM},${lat},${lon});way["amenity"="parking"](around:${radiusM},${lat},${lon}););out center;`;
    const res = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
    const data = await res.json();
    const elements = data.elements || [];

    elements.forEach(el => {
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      if (!elLat || !elLon) return;

      const name = el.tags?.name || '';
      const fee = el.tags?.fee === 'yes' ? '💰 Płatny' : el.tags?.fee === 'no' ? '🆓 Darmowy' : '';
      const capacity = el.tags?.capacity ? `${el.tags.capacity} miejsc` : '';
      const label = [name, fee, capacity].filter(Boolean).join(' · ') || 'Parking (OSM)';

      const m = L.marker([elLat, elLon], {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#2196F3;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 4px rgba(0,0,0,0.3)">P</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      }).addTo(map).bindTooltip(label, { direction: 'top', offset: [0, -8] });

      m.on('click', () => selectParkingOnMap(elLat, elLon, name || 'Parking (OSM)', label));
      window._parkingFinderMarkers.push(m);
    });
  } catch (e) {
    // Overpass może nie odpowiedzieć - nie krytyczne
    console.error('OSM parking search failed:', e);
  }
}

function saveParkingFromFinder(peakId) {
  const d = window._parkingFinderData;
  if (!d || !d.lat) return;
  const peak = getPeak(peakId);
  if (!peak) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
  <div class="modal-content" style="max-width:340px">
    <div style="font-family:var(--font-display);font-size:18px;color:var(--accent);margin-bottom:12px">🅿️ Zapisz parking</div>
    <div class="label">Nazwa</div>
    <input class="input" type="text" id="save-parking-name" aria-label="Nazwa parkingu" value="${esc(d.name || '')}" placeholder="Nazwa parkingu">
    <div class="label" style="margin-top:8px">Notatka</div>
    <input class="input" type="text" id="save-parking-note" aria-label="Notatka o parkingu" placeholder="Cena, liczba miejsc, uwagi...">
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1" onclick="confirmSaveParking(${peakId});this.closest('.modal-overlay').remove()">💾 Zapisz</button>
      <button class="btn btn-secondary" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#save-parking-name')?.focus();
}

function confirmSaveParking(peakId) {
  const d = window._parkingFinderData;
  if (!d || !d.lat) return;
  const peak = getPeak(peakId);
  if (!peak) return;

  const name = document.getElementById('save-parking-name')?.value.trim() || d.name;
  const note = document.getElementById('save-parking-note')?.value.trim() || '';

  const newParking = { name, lat: d.lat, lon: d.lon, note };

  // Zapisz jako override w localStorage
  const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
  if (!ov[peakId]) ov[peakId] = {};

  // Zbierz istniejące parkingi (z routes lub parking[])
  if (!ov[peakId].parking) {
    if (peak.routes) {
      ov[peakId].parking = peak.routes.map(r => r.parking).filter(Boolean).map(p => JSON.parse(JSON.stringify(p)));
    } else {
      ov[peakId].parking = JSON.parse(JSON.stringify(peak.parking || []));
    }
  }

  // Sprawdź czy nie duplikat (blisko istniejącego)
  const isDup = ov[peakId].parking.some(p => {
    return Math.abs(p.lat - d.lat) < 0.0005 && Math.abs(p.lon - d.lon) < 0.0005;
  });
  if (!isDup) {
    ov[peakId].parking.push(newParking);
  } else {
    const idx = ov[peakId].parking.findIndex(p => Math.abs(p.lat - d.lat) < 0.0005 && Math.abs(p.lon - d.lon) < 0.0005);
    if (idx >= 0) ov[peakId].parking[idx] = newParking;
  }

  localStorage.setItem('kgp_peaks_overrides', JSON.stringify(ov));

  // Odśwież PEAKS w pamięci
  if (!peak.routes) {
    peak.parking = ov[peakId].parking;
  }

  closeParkingFinder();
  goto(state.currentPage);
  showToast(`🅿️ ${name || d.name} zapisany!`);
}

function closeParkingFinder() {
  if (window._parkingFinderMap) {
    window._parkingFinderMap.remove();
    window._parkingFinderMap = null;
  }
  if (window._parkingFinderSelected) window._parkingFinderSelected = null;
  window._parkingFinderMarkers = [];
  window._parkingFinderData = null;
  const overlay = document.getElementById('parking-finder-overlay');
  if (overlay) overlay.remove();
}

// ============================================================
// PEAK DETAIL MODAL
// ============================================================
function openPeakDetail(id) {
  const p = getPeak(id);
  const done = isDone(id);
  const journal = state.journal.find(e=>e.peakId===id);

  if (leafletMap) leafletMap.closePopup();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  overlay.innerHTML = `
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:12px">
        <div>
          <div style="font-family:var(--font-display);font-size:28px;color:${done?'var(--green)':'var(--accent)'};letter-spacing:1px">${p.name}</div>
          <div style="font-size:13px;color:var(--text2)">${p.range} ${done?'· ✅ Zdobyty':''}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-family:var(--font-display);font-size:32px;color:var(--accent)">${p.height}m</div>
          <div style="font-size:11px;color:var(--text2)">n.p.m.</div>
        </div>
      </div>
    </div>
    <div class="page page-gap" style="padding-top:14px">
      ${journal?.photo ? `<img src="${journal.photo}" style="width:100%;border-radius:12px;max-height:180px;object-fit:cover">` : ''}
      ${journal ? `<div style="background:var(--card2);border-radius:10px;padding:12px;font-size:13px"><b>📅 ${journal.date}</b>${journal.note?`<br><i>"${esc(journal.note)}"</i>`:''}</div>` : ''}

      <div class="card card-pad">
        <div class="section-title">Szlak główny</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${(()=>{const r=getRoute(p);return [['📏',r.trail.dist+'km','Dystans'],['↑',r.trail.ascent+'m','Przewyższenie'],['⏱️',fmtTime(adjTime(r.trail.up)),'Podejście']];})().map(([i,v,l])=>`
          <div style="text-align:center;background:var(--card2);border-radius:8px;padding:8px">
            <div style="font-size:16px">${i}</div>
            <div style="font-family:var(--font-display);font-size:18px;color:var(--accent)">${v}</div>
            <div style="font-size:10px;color:var(--text2)">${l}</div>
          </div>`).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn-primary" onclick="changePlanPeak(${p.id});document.querySelector('.modal-overlay')?.remove();goto('plan')">📅 Planuj wyjazd</button>
        <button class="btn btn-secondary" onclick="changeSummitPeak(${p.id});document.querySelector('.modal-overlay')?.remove();goto('summit')">${done?'👁️ Szczegóły':'🏔️ Tryb szczyt'}</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

let _undoConquerDeadline = 0;

function renderNextSuggestPage() {
  const lastId = state.conquered[state.conquered.length-1];
  const last = getPeak(lastId);
  if (!_undoConquerDeadline) _undoConquerDeadline = Date.now() + 60000;
  const canUndo = Date.now() < _undoConquerDeadline;
  return `
  <div class="header">
    <span class="header-icon">🎉</span>
    <div><div class="header-title">Brawo!</div><div class="header-sub">${state.conquered.length}/28 zdobytych</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">
    <div style="text-align:center;padding:20px">
      <div style="font-size:64px">🏔️</div>
      <div style="font-family:var(--font-display);font-size:32px;color:var(--green);margin-top:8px">${last?.name} ZDOBYTA!</div>
      <div style="font-size:14px;color:var(--text2);margin-top:4px">${state.conquered.length} z 28 szczytów Korony</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="generateConquestCard(${lastId})">🎴 Pobierz kartę zdobycia</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-full" onclick="goto('plan')">🤔 Co dalej? → Planuj wyprawę</button>
      <button class="btn btn-secondary btn-full" onclick="goto('journal')">📖 Zobacz dziennik</button>
      ${canUndo ? `<button class="btn btn-full" style="background:none;color:var(--text2);border:1px solid var(--border);font-size:12px" onclick="undoConquer(${lastId})">↩️ Cofnij zdobycie (pomyłka)</button>` : ''}
    </div>
  </div>`;
}

function undoConquer(peakId) {
  if (Date.now() > _undoConquerDeadline) {
    showToast('Czas na cofnięcie minął');
    return;
  }
  if (!confirm('Cofnąć oznaczenie tego szczytu jako zdobyty?')) return;
  state.conquered = state.conquered.filter(id => id !== peakId);
  state.journal = state.journal.filter(j => j.peakId !== peakId);
  save();
  _undoConquerDeadline = 0;
  showToast('Zdobycie cofnięte');
  goto('summit');
}
