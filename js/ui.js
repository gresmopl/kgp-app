// ============================================================
// LIST PAGE
// ============================================================
function renderList() {
  const done = state.conquered.length;
  const pct = Math.round(done/28*100);
  let peaks = PEAKS;
  if (state.filter === 'done') peaks = PEAKS.filter(p => isDone(p.id));
  if (state.filter === 'todo') peaks = PEAKS.filter(p => !isDone(p.id));
  if (state.filter === 'tatry') peaks = PEAKS.filter(p => p.range.includes('Tatry') || p.range.includes('Beskid') || p.range.includes('Bieszczady') || p.range.includes('Gorce') || p.range.includes('Pieniny'));
  if (state.filter === 'sudety') peaks = PEAKS.filter(p => ['Karkonosze','Góry Izerskie','Góry Stołowe','Góry Kaczawskie','Góry Wałbrzyskie','Góry Kamienne','Góry Sowie','Góry Bardzkie','Góry Bystrzyckie','Góry Orlickie','Góry Bialskie','Góry Złote','Góry Opawskie','Rudawy Janowickie','Masyw Śnieżnika','Masyw Ślęży'].includes(p.range));

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
    <span class="chip ${state.filter==='all'?'active':''}" onclick="setFilter('all')">Wszystkie (28)</span>
    <span class="chip ${state.filter==='todo'?'active':''}" onclick="setFilter('todo')">Do zdobycia (${28-done})</span>
    <span class="chip ${state.filter==='done'?'active':''}" onclick="setFilter('done')">Zdobyte (${done})</span>
    <span class="chip ${state.filter==='tatry'?'active':''}" onclick="setFilter('tatry')">Karpaty</span>
    <span class="chip ${state.filter==='sudety'?'active':''}" onclick="setFilter('sudety')">Sudety</span>
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

function setFilter(f) { state.filter = f; goto('list'); }

// ============================================================
// PLAN PAGE
// ============================================================
async function renderPlan() {
  const todo = getTodo();
  const peak = state.selectedPeak || (todo.length > 0 ? todo[0] : PEAKS[0]);

  return `
  <div class="header">
    <span class="header-icon">📅</span>
    <div><div class="header-title">Planuj Wyjazd</div><div class="header-sub">Kalkulator + pogoda + trasa</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <div class="card card-pad">
      <div class="label">Wybierz szczyt</div>
      <select class="input" onchange="changePlanPeak(this.value)">
        ${PEAKS.map(p => `<option value="${p.id}" ${peak.id===p.id?'selected':''}>${p.name} (${p.height}m) ${isDone(p.id)?'✅':''}</option>`).join('')}
      </select>
    </div>

    ${peak.routes && peak.routes.length > 1 ? `
    <div class="card card-pad">
      <div class="label">Wariant trasy</div>
      <select class="input" onchange="changeRoute(${peak.id}, this.value)">
        ${peak.routes.map((r, i) => `<option value="${i}" ${(state.selectedRoutes[peak.id]||0)===i?'selected':''}>${r.name}</option>`).join('')}
      </select>
    </div>` : ''}

    <div class="card card-pad">
      <div class="label">Skąd wyjeżdżasz?</div>
      <input class="input" type="text" id="startAddr" value="${state.homeAddr}" placeholder="Np. Kraków, Warszawa..." onfocus="this.select()" onchange="state.homeAddr=this.value;save()">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-secondary btn-sm" onclick="setTransport('car')" id="btn-car" style="flex:1;${state.transport!=='pks'?'border-color:var(--accent);color:var(--accent)':''}">🚗 Samochód</button>
        <button class="btn btn-secondary btn-sm" onclick="setTransport('pks')" id="btn-pks" style="flex:1;${state.transport==='pks'?'border-color:var(--accent);color:var(--accent)':''}">🚂 PKP/PKS</button>
      </div>
    </div>

    <div class="card card-pad">
      <div class="label">Godzina wyjazdu</div>
      <input class="input" type="time" id="startTime" value="${state.departTime||'07:00'}" onchange="state.departTime=this.value;renderTimeline('${peak.id}')">
    </div>

    <div id="timeline-section">
      ${renderTimeline(peak.id, true)}
    </div>

    <div class="card card-pad">
      <div class="section-title">Parking / Dojazd</div>
      ${(() => { const route = getRoute(peak); return state.transport === 'pks' ? `
        <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-weight:600;font-size:13px">🚂 ${route.station.name}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">${route.station.info}</div>
        </div>
        <button class="btn btn-secondary btn-full" onclick="openEpodroznik('${route.station.name.replace(/'/g,'`')}')">🔗 Otwórz e-podróżnik.pl</button>
      ` : getParkingList(peak).map(pk => `
        <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:8px">
          <div style="font-weight:600;font-size:13px">🅿️ ${pk.name}</div>
          <div style="font-size:12px;color:var(--accent);margin-top:3px">⚠️ ${pk.note}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%" onclick="navigateToParking('${pk.name.replace(/'/g,'`')}')">🚗 Wyznacz dojazd</button>
        </div>
      `).join(''); })()}
      <button class="btn btn-primary btn-full" onclick="navigateToPeak(${peak.id})" style="margin-top:8px;background:var(--blue,#4a90d9)">
        🗺️ Wyznacz trasę (Mapy.com)
      </button>
    </div>

    <div class="card card-pad" id="weather-section">
      <div class="section-title">🌤️ Prognoza 7 dni</div>
      <div id="weather-content"><div style="color:var(--text2);font-size:13px;text-align:center;padding:20px">Ładowanie prognozy... ☁️</div></div>
    </div>

    <div class="card card-pad" id="sun-section">
      <div class="section-title">🌅 Wschód / zachód słońca</div>
      <div id="sun-content" style="font-size:13px;color:var(--text2)">Ładowanie...</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">🔥 Szacunkowe spalanie kalorii</div>
      <div style="font-family:var(--font-display);font-size:28px;color:var(--accent)">${estimateCalories(peak)} kcal</div>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">Szacunek dla ~70kg osoby (podejście + zejście). Tempo: ${state.paceMultiplier}×</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">📷 Kamery górskie</div>
      <a href="${getCameraSearchUrl(peak)}" target="_blank" class="btn btn-secondary btn-full" style="text-decoration:none">
        📹 Szukaj kamer - ${peak.name}
      </a>
    </div>

    ${getNearbyFood(peak.id) ? `
    <div class="card card-pad">
      <div class="section-title">🍽️ Gdzie zjeść po zejściu</div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px">${getNearbyFood(peak.id).type}</span>
        <div>
          <div style="font-weight:600;font-size:13px">${getNearbyFood(peak.id).name}</div>
          <div style="font-size:11px;color:var(--text2)">${getNearbyFood(peak.id).dist}</div>
        </div>
      </div>
    </div>` : ''}

    <div class="card card-pad">
      <div class="section-title">🧠 Optimizer Weekendu</div>
      ${renderOptimizer(peak)}
    </div>

    <div class="card card-pad">
      <div class="section-title">📐 Kalibracja tempa</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <input type="range" min="0.7" max="1.5" step="0.05" value="${state.paceMultiplier}" oninput="updatePace(this.value)" style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);margin-top:4px"><span>Szybko (×0.7)</span><span>Normalnie</span><span>Wolno (×1.5)</span></div>
        </div>
        <div style="text-align:center;min-width:50px">
          <div style="font-family:var(--font-display);font-size:24px;color:var(--accent)" id="pace-display">${state.paceMultiplier}×</div>
          <div style="font-size:10px;color:var(--text2)">Twoje tempo</div>
        </div>
      </div>
    </div>

  </div>`;
}

function estimateDriveMin(peak) {
  if (!state.homeAddr || !state.homeAddr.trim()) return null;
  if (state.userLat) {
    const km = dist(state.userLat, state.userLon, peak.lat, peak.lon) / 1000;
    return Math.round(km * 1.2);
  }
  return null;
}

function renderTimeline(peakId, returnHtml=false, startOverride=null) {
  const peak = PEAKS.find(p=>p.id==peakId);
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
  state.selectedPeak = PEAKS.find(p=>p.id==id);
  goto('plan');
}

// ============================================================
// SUMMIT PAGE
// ============================================================
function renderSummit() {
  const nearby = state.nearbyPeak ? PEAKS.find(p=>p.id===state.nearbyPeak) : null;
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
      <select class="input" onchange="changeSummitPeak(this.value)">
        ${PEAKS.filter(p=>!isDone(p.id)).map(p=>`<option value="${p.id}" ${peak.id===p.id?'selected':''}>${p.name} (${p.height}m)</option>`).join('')}
      </select>
    </div>

    <div class="summit-header">
      <div class="summit-peak-name">${peak.name}</div>
      <div class="summit-height">${peak.height} m n.p.m. · ${peak.range}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">${diffDots(peak.difficulty)} Trudność ${peak.difficulty}/5</div>
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
            <button class="btn btn-secondary btn-sm" onclick="navigateToStamp('${s.name.replace(/'/g,'`')}')">🧭 Nawiguj</button>
          </div>`;
        }).join('')}
      </div>
    </div>

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
      <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none" onchange="photoSelected(this,${peak.id})">
    </div>

    <div class="card card-pad">
      <div class="label" style="margin-bottom:8px">Notatka ze szczytu</div>
      <textarea class="input" id="summit-note" rows="3" placeholder="Pogoda, widoki, towarzysze..." style="resize:none;line-height:1.5"></textarea>
    </div>

    <div class="card card-pad">
      <div class="label" style="margin-bottom:8px">Dedykacja (opcjonalnie)</div>
      <input class="input" type="text" id="summit-dedication" placeholder="Ten szczyt dedykuję...">
      <div style="font-size:10px;color:var(--text2);margin-top:4px">Pojawi się na karcie zdobycia</div>
    </div>

    <button class="btn btn-green btn-full" id="conquer-btn" onclick="conquerPeak(${peak.id})" disabled>
      ✅ Oznacz jako zdobyty
    </button>
    <div style="font-size:11px;color:var(--text2);text-align:center;margin-top:-6px">Zrób najpierw zdjęcie aby aktywować</div>

    <button class="btn btn-primary btn-full" onclick="navigateToPeak(${peak.id})" style="background:var(--blue,#4a90d9)">
      🗺️ Wyznacz trasę (Mapy.com)
    </button>

    <button class="btn btn-secondary btn-full" onclick="returnToParking(${peak.id})">
      🧭 Wróć do parkingu
    </button>

  </div>`;
}

function changeSummitPeak(id) {
  state.selectedPeak = PEAKS.find(p=>p.id==id);
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
    document.getElementById('conquer-btn').disabled = false;
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
  const peak = PEAKS.find(p=>p.id===peakId);
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
    uploadPhoto(peakId, state.pendingPhoto, 'summit');
  }
  confetti();
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

async function navigateToStamp(stampName) {
  const coords = await geocodeParking(stampName);
  if (coords) {
    openNavigation(coords.lat, coords.lon, stampName);
  } else {
    window.open(`https://mapy.com/search?q=${encodeURIComponent(stampName + ', Polska')}`, '_blank');
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
  const p = PEAKS.find(pk=>pk.id===peakId);
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
// PEAK DETAIL MODAL
// ============================================================
function openPeakDetail(id) {
  const p = PEAKS.find(pk=>pk.id==id);
  const done = isDone(id);
  const journal = state.journal.find(e=>e.peakId===id);

  if (leafletMap) leafletMap.closePopup();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
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
            <div style="font-size:9px;color:var(--text2)">${l}</div>
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

// ============================================================
// NEXT SUGGESTIONS
// ============================================================
function renderNextSuggestions() {
  const todo = getTodo();
  if (todo.length === 0) return '<div style="color:var(--green);font-weight:600">🏆 Wszystkie szczyty zdobyte!</div>';

  const byDist = state.userLat ? [...todo].sort((a,b)=>dist(state.userLat,state.userLon,a.lat,a.lon)-dist(state.userLat,state.userLon,b.lat,b.lon)) : todo;
  const nearest = byDist[0];
  const easiest = [...todo].sort((a,b)=>a.difficulty-b.difficulty)[0];
  const month = new Date().getMonth()+1;
  const seasonal = todo.find(p=>p.season.includes(month)) || todo[0];

  const card = (emoji, tag, color, p, desc) => `
    <div class="next-card" onclick="changePlanPeak(${p.id});goto('plan')" style="margin-bottom:8px">
      <div style="font-size:28px">${emoji}</div>
      <div style="flex:1">
        <div class="next-tag" style="color:${color}">${tag}</div>
        <div style="font-weight:700;font-size:14px">${p.name} <span style="color:var(--accent)">${p.height}m</span></div>
        <div style="font-size:11px;color:var(--text2)">${desc}</div>
      </div>
      <div style="color:var(--text2)">›</div>
    </div>`;

  return card('📍','NAJBLIŻSZY','var(--blue)',nearest,
    state.userLat ? `${Math.round(dist(state.userLat,state.userLon,nearest.lat,nearest.lon)/1000)} km od Ciebie · ${nearest.range}` : nearest.range) +
  card('😊','NAJŁATWIEJSZY','var(--green)',easiest,
    `Trudność ${easiest.difficulty}/5 · ${easiest.range}`) +
  card('🌡️','SEZONOWY','var(--accent)',seasonal,
    `Polecany na ${new Date().toLocaleString('pl',{month:'long'})} · ${seasonal.range}`);
}

function renderNextSuggestPage() {
  const lastId = state.conquered[state.conquered.length-1];
  const last = PEAKS.find(p=>p.id===lastId);
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
    </div>
    <div class="card card-pad">
      <div class="section-title">Co dalej?</div>
      ${renderNextSuggestions()}
    </div>
    <button class="btn btn-secondary btn-full" onclick="goto('journal')">📖 Zobacz dziennik</button>
  </div>`;
}
