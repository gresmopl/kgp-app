// ============================================================
// MAPY.COM ROUTING
// ============================================================
const MAPY_BASE = 'https://api.mapy.com/v1/routing/route';

async function getRoute_Mapy(startLon, startLat, endLon, endLat, type = 'foot_hiking', waypoints = []) {
  const params = new URLSearchParams({
    start: `${startLon},${startLat}`,
    end: `${endLon},${endLat}`,
    routeType: type,
    format: 'geojson',
    lang: 'pl',
    apiKey: MAPY_API_KEY
  });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map(w => `${w.lon},${w.lat}`).join(';'));
  }
  try {
    const res = await fetch(`${MAPY_BASE}?${params}`);
    if (!res.ok) throw new Error(`Mapy API: ${res.status}`);
    return await res.json();
  } catch(e) {
    console.error('Mapy routing error:', e);
    return null;
  }
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

let routeLayer = null;
let pendingRoute = null;

function drawRouteOnMap(geojson, color = '#e8a020') {
  pendingRoute = { geojson, color };
}

function applyRouteToMap() {
  if (!pendingRoute || !leafletMap) return;
  if (routeLayer) leafletMap.removeLayer(routeLayer);
  routeLayer = L.geoJSON(pendingRoute.geojson, {
    style: { color: pendingRoute.color, weight: 5, opacity: 0.85, dashArray: null, lineCap: 'round', lineJoin: 'round' }
  }).addTo(leafletMap);
  leafletMap.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
  pendingRoute = null;
}

async function navigateToPeak(peakId) {
  const peak = PEAKS.find(p => p.id === peakId);
  if (!peak) return;
  const parking = getRoute(peak).parking;

  if (!navigator.onLine) {
    showToast('⚠️ Nawigacja wymaga internetu');
    return;
  }

  showToast('🗺️ Wyznaczam trasę...');
  let results = {};

  let parkingCoords = parking.lat ? { lat: parking.lat, lon: parking.lon } : await geocodeParking(parking.name);
  if (!parkingCoords) {
    const simpleName = parking.name.split(' - ')[0].split(' – ')[0].trim();
    parkingCoords = await geocodeParking(simpleName);
  }

  let startLon, startLat;
  if (state.userLat && state.userLon) {
    startLon = state.userLon; startLat = state.userLat;
  } else if (state.homeAddr && state.homeAddr.trim()) {
    const homeCoords = await geocodeParking(state.homeAddr);
    if (homeCoords) { startLon = homeCoords.lon; startLat = homeCoords.lat; }
  }

  if (startLon && parkingCoords) {
    const carRoute = await getRoute_Mapy(startLon, startLat, parkingCoords.lon, parkingCoords.lat, 'car_fast');
    if (carRoute) {
      results.car = {
        distance: formatDistance(carRoute.length),
        duration: formatDuration(carRoute.duration),
        geometry: carRoute.geometry
      };
    }
  }

  let hikeLon, hikeLat;
  if (parkingCoords) {
    hikeLon = parkingCoords.lon;
    hikeLat = parkingCoords.lat;
  } else if (state.userLat) {
    showToast('⚠️ Nie znaleziono parkingu - trasę od GPS');
    hikeLon = state.userLon; hikeLat = state.userLat;
  } else {
    showToast('❌ Nie udało się zlokalizować parkingu');
    return;
  }

  const stamp = peak.stamps && peak.stamps.find(s => s.lat && s.lon);
  const endLat = stamp ? stamp.lat : peak.lat;
  const endLon = stamp ? stamp.lon : peak.lon;

  let waypoints = [];
  const viaInput = document.getElementById('via-point');
  const viaName = viaInput ? viaInput.value.trim() : '';
  if (viaName) {
    showToast('🔍 Szukam: ' + viaName + '...');
    const viaCoords = await geocodeNear(viaName, peak.lat, peak.lon);
    if (viaCoords) {
      waypoints = [{ lat: viaCoords.lat, lon: viaCoords.lon }];
      state._viaName = viaName;
    } else {
      showToast('Nie znaleziono w okolicy: ' + viaName);
    }
  } else {
    state._viaName = null;
  }

  const hikeRoute = await getRoute_Mapy(hikeLon, hikeLat, endLon, endLat, 'foot_hiking', waypoints);
  if (hikeRoute) {
    results.hike = {
      distance: formatDistance(hikeRoute.length),
      duration: formatDuration(hikeRoute.duration),
      geometry: hikeRoute.geometry
    };
  }

  showNavigationResult(peak, results);
}

async function geocodeNear(name, nearLat, nearLon) {
  try {
    const res = await fetch(`https://api.mapy.com/v1/geocode?query=${encodeURIComponent(name)}&lang=pl&limit=5&apiKey=${MAPY_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    console.log('geocodeNear results:', name, data.items);
    if (!data.items || data.items.length === 0) return null;
    let best = null;
    let bestDist = Infinity;
    for (const item of data.items) {
      const d = Math.pow(item.position.lat - nearLat, 2) + Math.pow(item.position.lon - nearLon, 2);
      if (d < bestDist) { bestDist = d; best = item.position; }
    }
    console.log('geocodeNear best:', best, 'dist:', bestDist);
    if (bestDist > 1) return null;
    return { lat: best.lat, lon: best.lon };
  } catch(e) {
    console.error('geocodeNear error:', e);
    return null;
  }
}

async function geocodeParking(name) {
  try {
    const res = await fetch(`https://api.mapy.com/v1/geocode?query=${encodeURIComponent(name + ', Polska')}&lang=pl&limit=1&apiKey=${MAPY_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const pos = data.items[0].position;
      return { lat: pos.lat, lon: pos.lon };
    }
    return null;
  } catch(e) {
    return null;
  }
}

let _navResults = {};

function showNavigationResult(peak, results) {
  _navResults = results;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:var(--font-display);font-size:22px;color:var(--accent)">🗺️ Trasa na ${peak.name}</div>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text2)">×</button>
      </div>

      ${results.car ? `
      <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="font-weight:600;color:var(--blue);margin-bottom:6px">🚗 Dojazd samochodem do parkingu</div>
        <div style="display:flex;gap:16px;font-size:14px">
          <span>📏 ${results.car.distance}</span>
          <span>⏱️ ${results.car.duration}</span>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%" onclick="showRouteOnMap('car')">🗺️ Pokaż na mapie</button>
      </div>` : ''}

      <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="font-weight:600;color:var(--green);margin-bottom:6px">🥾 Szlak pieszy na szczyt${state._viaName ? ' (przez ' + state._viaName + ')' : ''}</div>
        ${results.hike ? `
        <div style="display:flex;gap:16px;font-size:14px">
          <span>📏 ${results.hike.distance}</span>
          <span>⏱️ ${results.hike.duration}</span>
        </div>
        <div style="font-size:10px;color:var(--text2);margin-top:6px">Trasa orientacyjna (Mapy.com) - sprawdź przebieg na mapie</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="showRouteOnMap('hike')">🗺️ Pokaż na mapie</button>
          <button class="btn btn-green btn-sm" style="flex:1" onclick="saveRoute(${peak.id})">💾 Zapisz trasę</button>
        </div>
        ` : '<div style="font-size:13px;color:var(--text2)">Nie udało się wyznaczyć trasy pieszej</div>'}
      </div>

      ${state.savedRoutes[peak.id] ? `
      <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="font-weight:600;color:var(--accent);margin-bottom:6px">💾 Zapisana trasa${state.savedRoutes[peak.id].via ? ' (przez ' + state.savedRoutes[peak.id].via + ')' : ''}</div>
        <div style="font-size:12px;color:var(--text2)">${state.savedRoutes[peak.id].distance} · ${state.savedRoutes[peak.id].duration}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="loadSavedRoute(${peak.id})">🗺️ Pokaż na mapie</button>
          <button class="btn btn-sm" style="flex:1;background:none;color:var(--red);border:1px solid var(--red)" onclick="deleteSavedRoute(${peak.id})">🗑️ Usuń</button>
        </div>
      </div>` : ''}

      <button class="btn btn-secondary btn-full" onclick="this.closest('.modal-overlay').remove()">Zamknij</button>
    </div>`;
  document.body.appendChild(overlay);
}

function simplifyGeometry(geojson, every) {
  if (!geojson || !geojson.geometry) return geojson;
  const coords = geojson.geometry.coordinates;
  if (!coords || coords.length === 0) return geojson;
  const simplified = coords.filter((_, i) => i === 0 || i === coords.length - 1 || i % every === 0);
  return { type: geojson.type, geometry: { type: geojson.geometry.type, coordinates: simplified } };
}

function saveRoute(peakId) {
  const r = _navResults.hike;
  if (!r) return;
  state.savedRoutes[peakId] = {
    geometry: simplifyGeometry(r.geometry, 10),
    distance: r.distance,
    duration: r.duration,
    via: state._viaName || null,
    date: new Date().toLocaleDateString('pl-PL')
  };
  save();
  showToast('💾 Trasa zapisana!');
  document.querySelector('.modal-overlay')?.remove();
}

function loadSavedRoute(peakId) {
  const saved = state.savedRoutes[peakId];
  if (!saved) return;
  drawRouteOnMap(saved.geometry, '#4caf7d');
  document.querySelector('.modal-overlay')?.remove();
  goto('map');
}

function deleteSavedRoute(peakId) {
  delete state.savedRoutes[peakId];
  save();
  showToast('Trasa usunięta');
  document.querySelector('.modal-overlay')?.remove();
}

function showRouteOnMap(type) {
  const r = _navResults[type];
  if (!r) return;
  const color = type === 'car' ? '#4a90d9' : '#4caf7d';
  drawRouteOnMap(r.geometry, color);
  document.querySelector('.modal-overlay')?.remove();
  goto('map');
}

async function navigateToParking(parkingName, parkingLat, parkingLon) {
  let coords;
  if (parkingLat && parkingLon) {
    coords = { lat: parkingLat, lon: parkingLon };
  } else {
    coords = await geocodeParking(parkingName);
  }
  if (!coords) {
    showToast('❌ Nie znaleziono parkingu');
    return;
  }
  let startLon, startLat;
  if (state.userLat && state.userLon) {
    startLon = state.userLon; startLat = state.userLat;
  } else if (state.homeAddr && state.homeAddr.trim()) {
    const homeCoords = await geocodeParking(state.homeAddr);
    if (homeCoords) { startLon = homeCoords.lon; startLat = homeCoords.lat; }
  }
  if (startLon) {
    const url = `https://mapy.com/fnc/v1/route?start=${startLon},${startLat}&end=${coords.lon},${coords.lat}&routeType=car_fast`;
    window.open(url, '_blank');
  } else {
    window.open(`https://mapy.com/search?q=${encodeURIComponent(parkingName + ', Polska')}`, '_blank');
  }
}

// ============================================================
// LEAFLET MAP
// ============================================================
let leafletMap = null;

function renderMap() {
  const done = state.conquered.length;
  return `
  <div class="header">
    <span class="header-icon">👑</span>
    <div><div class="header-title">Korona Gór Polski</div><div class="header-sub">Twój asystent zdobywcy</div></div>
    <span class="header-badge">${done}/28</span>
  </div>
  <div id="map-container">
    <div id="leaflet-map" style="width:100%;height:100%"></div>
    <div class="map-legend">
      <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--green)"></div>Zdobyty</div>
      <div class="map-legend-item"><div class="map-legend-dot" style="background:var(--accent)"></div>Do zdobycia</div>
      <div class="map-legend-item"><div class="map-legend-dot" style="background:#4a90d9;font-size:8px;line-height:14px;text-align:center;color:#fff;font-weight:700">P</div>Parking</div>
      <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text2);margin-top:4px;cursor:pointer">
        <input type="checkbox" id="toggle-parking" checked onchange="toggleParkingLayer(this.checked)" style="margin:0;width:13px;height:13px"> Pokaż parkingi
      </label>
      <button id="btn-coord-picker" onclick="toggleCoordPicker()" style="margin-top:6px;background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:10px;color:var(--text2);cursor:pointer;width:100%">📌 Ustaw parking</button>
      <div style="font-size:9px;color:var(--accent);margin-top:6px;border-top:1px solid var(--border);padding-top:6px;max-width:180px;line-height:1.4" onclick="this.innerHTML='💡 '+getRandomFunFact();event.stopPropagation()">💡 ${getRandomFunFact()}</div>
    </div>
    <button id="btn-ai-chat" onclick="openAIChat()" style="position:absolute;bottom:16px;right:16px;z-index:90;width:48px;height:48px;border-radius:50%;background:var(--accent);color:#000;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s" title="Zapytaj AI">🤖</button>
  </div>`;
}

function makeIcon(color, done) {
  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color}44;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff">${done?'✓':''}</div>`
  });
}

let parkingLayerGroup = null;

function makeParkingIcon() {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#4a90d9;border:2px solid #fff;box-shadow:0 0 6px #4a90d944;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff">P</div>'
  });
}

function buildPeakPopup(p) {
  const done = isDone(p.id);
  const color = done ? '#4caf7d' : '#e8a020';

  if (done) {
    // MAPA-2: Popup zdobytego szczytu - wspomnienie
    const entry = state.journal.find(j => j.peakId === p.id);
    const date = entry ? entry.date : '';
    const note = entry && entry.note ? esc(entry.note) : '';
    const photoHtml = entry && entry.photo
      ? '<div style="margin:6px 0;border-radius:6px;overflow:hidden;max-height:100px"><img src="' + entry.photo + '" style="width:100%;height:100px;object-fit:cover;display:block" onclick="openLightbox(' + p.id + ');event.stopPropagation()"></div>'
      : '';
    return `
      <div style="font-family:Inter,sans-serif;min-width:160px;max-width:220px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div style="font-weight:700;font-size:14px;flex:1">✅ ${esc(p.name)}</div>
          <div style="font-size:13px;font-weight:700;color:${color}">${p.height} m</div>
        </div>
        <div style="font-size:11px;color:#888">${esc(p.range)} · ${date}</div>
        ${photoHtml}
        ${note ? '<div style="font-size:11px;color:#aaa;margin:4px 0;font-style:italic;line-height:1.3">' + note.substring(0, 80) + (note.length > 80 ? '...' : '') + '</div>' : ''}
        <div style="display:flex;gap:6px;margin-top:6px">
          <button onclick="openPeakDetail(${p.id})" style="flex:1;background:${color};border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:600;cursor:pointer;color:#fff">📖 Dziennik</button>
          <button onclick="aiPeakInfo(${p.id})" style="background:#eee;border:none;border-radius:6px;padding:6px;font-size:11px;cursor:pointer" title="AI opowie więcej">🤖</button>
          <button onclick="changePlanPeak(${p.id});goto('plan')" style="background:#eee;border:none;border-radius:6px;padding:6px;font-size:11px;cursor:pointer" title="Planuj ponowne wejście">🔄</button>
        </div>
      </div>`;
  } else {
    // MAPA-3: Popup niezdobytego szczytu - info + planowanie
    const route = getRoute(p);
    const parking = route.parking;
    const trail = route.trail || p.trail;
    const diffLabels = ['', 'Łatwy', 'Łatwy', 'Umiarkowany', 'Trudny', 'Wymagający'];
    const diffColors = ['', '#4caf7d', '#4caf7d', '#e8a020', '#e07020', '#d04040'];
    const diffLabel = diffLabels[p.difficulty] || '';
    const diffColor = diffColors[p.difficulty] || '#888';

    let distHtml = '';
    const refLat = (state._homeGeo && state._homeGeo.lat) || state.userLat;
    const refLon = (state._homeGeo && state._homeGeo.lon) || state.userLon;
    if (refLat && refLon) {
      const km = Math.round(dist(refLat, refLon, p.lat, p.lon) / 1000 * 1.3);
      distHtml = '<div style="font-size:10px;color:#888;margin-top:3px">📍 ~' + km + ' km</div>';
    }

    let trailHtml = '';
    if (trail) {
      const timeMin = trail.up ? trail.up + trail.down : Math.round(trail.dist * 25);
      const h = Math.floor(timeMin / 60);
      const m = timeMin % 60;
      trailHtml = '<div style="font-size:10px;color:#888;margin-top:2px">🥾 ' + trail.dist + ' km · ⏱️ ~' + (h > 0 ? h + 'h ' : '') + m + 'min · ↑' + trail.ascent + ' m</div>';
    }

    const parkingName = parking ? esc(parking.name.split(' - ')[0].split(' – ')[0]) : '';

    return `
      <div style="font-family:Inter,sans-serif;min-width:160px;max-width:220px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <div style="font-weight:700;font-size:14px;flex:1">${esc(p.name)}</div>
          <div style="font-size:13px;font-weight:700;color:${color}">${p.height} m</div>
        </div>
        <div style="font-size:11px;color:#888">${esc(p.range)} · <span style="color:${diffColor};font-weight:600">${diffLabel}</span></div>
        ${parkingName ? '<div style="font-size:10px;color:#888;margin-top:3px">🅿️ ' + parkingName + '</div>' : ''}
        ${trailHtml}
        ${distHtml}
        <div style="display:flex;gap:6px;margin-top:8px">
          <button onclick="changePlanPeak(${p.id});goto('plan')" style="flex:1;background:${color};border:none;border-radius:6px;padding:7px;font-size:11px;font-weight:600;cursor:pointer;color:#000">📅 Dodaj do planu</button>
          <button onclick="aiPeakInfo(${p.id})" style="background:#eee;border:none;border-radius:6px;padding:7px;font-size:11px;cursor:pointer" title="AI opowie więcej">🤖</button>
          <button onclick="openPeakDetail(${p.id})" style="background:#eee;border:none;border-radius:6px;padding:7px;font-size:11px;cursor:pointer" title="Szczegóły">📋</button>
        </div>
      </div>`;
  }
}

function addParkingLayer() {
  if (parkingLayerGroup) return;
  parkingLayerGroup = L.layerGroup();
  const icon = makeParkingIcon();

  PEAKS.forEach(p => {
    const parkings = p.routes
      ? p.routes.map(r => r.parking)
      : (p.parking || []);

    parkings.forEach(pk => {
      if (!pk || !pk.lat || !pk.lon) return;
      const name = esc(pk.name);
      const note = pk.note ? esc(pk.note) : '';
      const navName = pk.name.replace(/'/g, '`');
      const popupHtml = `
        <div style="font-family:Inter,sans-serif;min-width:140px;max-width:200px">
          <div style="font-weight:700;font-size:12px;color:#4a90d9;margin-bottom:3px">🅿️ ${name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:2px">Szczyt: ${esc(p.name)}</div>
          ${note ? '<div style="font-size:10px;color:#aaa;margin-bottom:6px;line-height:1.3">' + note + '</div>' : ''}
          <button onclick="navigateToParking('${navName}',${pk.lat},${pk.lon})" style="width:100%;background:#4a90d9;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:600;cursor:pointer;color:#fff">🧭 Nawiguj</button>
        </div>`;
      const marker = L.marker([pk.lat, pk.lon], { icon: icon });
      marker.bindPopup(popupHtml, { closeButton: false, className: 'kgp-popup' });
      parkingLayerGroup.addLayer(marker);
    });
  });
}

function toggleParkingLayer(show) {
  if (!leafletMap) return;
  if (show) {
    addParkingLayer();
    if (leafletMap.getZoom() >= 10) parkingLayerGroup.addTo(leafletMap);
  } else {
    if (parkingLayerGroup) leafletMap.removeLayer(parkingLayerGroup);
  }
}

function initMap() {
  const el = document.getElementById('leaflet-map');
  if (!el) return;

  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  parkingLayerGroup = null;

  leafletMap = L.map('leaflet-map', {
    center: [50.0, 19.5],
    zoom: 8,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer(`https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?lang=pl&apiKey=${MAPY_API_KEY}`, {
    maxZoom: 18,
    minZoom: 6,
    attribution: '&copy; <a href="https://www.mapy.com">Mapy.com</a> &copy; <a href="https://www.openstreetmap.org">OSM</a>'
  }).addTo(leafletMap);

  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

  PEAKS.forEach(p => {
    const done = isDone(p.id);
    const color = done ? '#4caf7d' : '#e8a020';
    const marker = L.marker([p.lat, p.lon], { icon: makeIcon(color, done) }).addTo(leafletMap);
    marker.bindPopup(buildPeakPopup(p), { closeButton: false, className: 'kgp-popup', maxWidth: 240 });

    marker.bindTooltip(p.name, {
      permanent: leafletMap.getZoom() >= 9,
      direction: 'top',
      offset: [0, -14],
      className: 'kgp-label'
    });
  });

  // Warstwa parkingów - domyślnie włączona, widoczna od zoom 10
  addParkingLayer();

  leafletMap.on('zoomend', () => {
    const z = leafletMap.getZoom();
    // Toggle tooltipów szczytów
    leafletMap.eachLayer(layer => {
      if (layer.getTooltip) {
        const tip = layer.getTooltip();
        if (tip) {
          if (z >= 9) { tip.options.permanent = true; layer.openTooltip(); }
          else { tip.options.permanent = false; layer.closeTooltip(); }
        }
      }
    });
    // Toggle parkingów wg zoomu
    const cb = document.getElementById('toggle-parking');
    if (parkingLayerGroup && (!cb || cb.checked)) {
      if (z >= 10 && !leafletMap.hasLayer(parkingLayerGroup)) parkingLayerGroup.addTo(leafletMap);
      else if (z < 10 && leafletMap.hasLayer(parkingLayerGroup)) leafletMap.removeLayer(parkingLayerGroup);
    }
  });

  if (state.userLat) {
    L.circleMarker([state.userLat, state.userLon], {
      radius: 8, color: '#fff', weight: 2, fillColor: '#4a90d9', fillOpacity: 1
    }).addTo(leafletMap).bindTooltip('Ty', { permanent: true, direction: 'top' });
  }

  // Marker adresu domowego
  if (state._homeGeo && state._homeGeo.lat) {
    const homeIcon = L.divIcon({
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
      html: '<div style="width:22px;height:22px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 0 6px #6366f144;display:flex;align-items:center;justify-content:center;font-size:11px">🏠</div>'
    });
    L.marker([state._homeGeo.lat, state._homeGeo.lon], { icon: homeIcon })
      .addTo(leafletMap)
      .bindTooltip(state.homeAddr || 'Dom', { direction: 'top', offset: [0, -12], className: 'kgp-label' });
  }

  if (pendingRoute) {
    applyRouteToMap();
  }
}

// ============================================================
// COORD PICKER - tryb wybierania koordynatów parkingów
// ============================================================
let _coordPickerActive = false;
let _coordPickerMarker = null;

function toggleCoordPicker() {
  _coordPickerActive = !_coordPickerActive;
  const btn = document.getElementById('btn-coord-picker');
  if (_coordPickerActive) {
    btn.style.background = 'var(--accent)';
    btn.style.color = '#000';
    btn.style.fontWeight = '700';
    btn.textContent = '📌 Kliknij na mapę...';
    document.getElementById('leaflet-map').style.cursor = 'crosshair';
    leafletMap.on('click', onCoordPickerClick);
  } else {
    btn.style.background = 'none';
    btn.style.color = 'var(--text2)';
    btn.style.fontWeight = 'normal';
    btn.textContent = '📌 Ustaw parking';
    document.getElementById('leaflet-map').style.cursor = '';
    leafletMap.off('click', onCoordPickerClick);
    if (_coordPickerMarker) { leafletMap.removeLayer(_coordPickerMarker); _coordPickerMarker = null; }
  }
}

function onCoordPickerClick(e) {
  const lat = e.latlng.lat.toFixed(7);
  const lon = e.latlng.lng.toFixed(7);

  if (_coordPickerMarker) leafletMap.removeLayer(_coordPickerMarker);
  _coordPickerMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: makeParkingIcon() }).addTo(leafletMap);

  // Sortuj szczyty po odległości od klikniętego punktu
  const sorted = PEAKS.slice().sort((a, b) =>
    dist(e.latlng.lat, e.latlng.lng, a.lat, a.lon) - dist(e.latlng.lat, e.latlng.lng, b.lat, b.lon)
  );

  const peakOptions = sorted.map(p => {
    const parkings = p.routes ? p.routes.map((r, i) => ({ idx: i, name: r.parking.name, route: true })) : (p.parking || []).map((pk, i) => ({ idx: i, name: pk.name, route: false }));
    return { peak: p, parkings: parkings };
  });

  const selectOptions = peakOptions.map(po => {
    const existing = po.parkings.map(pk => '<option value="' + po.peak.id + ':' + pk.idx + ':' + (pk.route ? 'r' : 'p') + '">' + esc(po.peak.name) + ' - ' + esc(pk.name) + '</option>').join('');
    const addNew = '<option value="' + po.peak.id + ':new:p">➕ ' + esc(po.peak.name) + ' - nowy parking</option>';
    return existing + addNew;
  }).join('');

  const gmapsUrl = 'https://www.google.com/maps/@' + lat + ',' + lon + ',18z';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = ev => { if (ev.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:400px;max-height:85vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:var(--font-display);font-size:18px;color:var(--accent)">📌 Parking</div>
        <a href="${gmapsUrl}" target="_blank" style="font-size:11px;color:#4a90d9;text-decoration:none">🌍 Google Maps</a>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <div style="flex:1">
          <label style="font-size:11px;color:var(--text2)">Lat</label>
          <input id="picker-lat" type="text" value="${lat}" readonly style="width:100%;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-family:monospace;font-size:12px">
        </div>
        <div style="flex:1">
          <label style="font-size:11px;color:var(--text2)">Lon</label>
          <input id="picker-lon" type="text" value="${lon}" readonly style="width:100%;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-family:monospace;font-size:12px">
        </div>
      </div>
      <div id="picker-info" style="background:var(--bg-alt,#f4f4f8);border-radius:8px;padding:10px;margin-bottom:10px;font-size:11px;color:var(--text2);line-height:1.6">
        ⏳ Pobieram informacje o lokalizacji...
      </div>
      <div id="picker-area-section" style="background:var(--bg-alt,#f4f4f8);border-radius:8px;padding:10px;margin-bottom:10px;display:none">
        <div style="font-size:10px;font-weight:600;color:var(--text);margin-bottom:6px">📐 Pomiar parkingu (kliknij 4 rogi)</div>
        <div id="picker-area-status" style="font-size:11px;color:var(--text2)">Zamknij ten modal, kliknij 4 rogi parkingu na mapie</div>
        <div id="picker-area-result" style="font-size:12px;font-weight:600;color:var(--accent);margin-top:4px;display:none"></div>
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:11px;color:var(--text2)">Przypisz do parkingu</label>
        <select id="picker-target" onchange="onPickerTargetChange()" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-size:12px">
          <option value="">-- wybierz --</option>
          ${selectOptions}
        </select>
      </div>
      <div id="picker-name-section" style="margin-bottom:10px;display:none">
        <label style="font-size:11px;color:var(--text2)">Nazwa nowego parkingu</label>
        <input id="picker-name" type="text" placeholder="np. Przełęcz pod Kopą" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-size:12px">
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:11px;color:var(--text2)">Notatka (cena, pojemność, nawierzchnia...)</label>
        <textarea id="picker-note" rows="2" placeholder="np. 20 zł/dzień, ~50 miejsc, asfalt" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-size:12px;resize:vertical">${esc(_lastAreaResult)}</textarea>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:6px">
        <button onclick="startAreaMeasure()" class="btn btn-secondary" style="flex:1;font-size:11px">📐 Zmierz</button>
        <button onclick="aiDescribeParking()" class="btn btn-secondary" style="flex:1;font-size:11px">🤖 Opisz AI</button>
        <button onclick="copyPickerCoords()" class="btn btn-secondary" style="flex:1;font-size:11px">📋 Kopiuj</button>
        <button onclick="savePickerCoords()" class="btn" style="flex:1;font-size:11px;background:var(--accent);color:#000;border:none;border-radius:8px;padding:8px;font-weight:600;cursor:pointer">💾 Zapisz</button>
      </div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary" style="width:100%;font-size:12px">Zamknij</button>
    </div>`;
  document.body.appendChild(overlay);

  // Pokaż wynik pomiaru jeśli jest
  if (_lastAreaResult) {
    const areaSection = document.getElementById('picker-area-section');
    const areaResult = document.getElementById('picker-area-result');
    if (areaSection) areaSection.style.display = 'block';
    if (areaResult) { areaResult.style.display = 'block'; areaResult.textContent = '📐 ' + _lastAreaResult; }
  }

  fetchPickerLocationInfo(parseFloat(lat), parseFloat(lon));
}

function onPickerTargetChange() {
  const val = document.getElementById('picker-target').value;
  const nameSection = document.getElementById('picker-name-section');
  if (nameSection) {
    nameSection.style.display = val && val.includes(':new:') ? 'block' : 'none';
  }
}

// ── Pomiar powierzchni parkingu ──
let _areaMeasureActive = false;
let _areaMeasurePoints = [];
let _areaMeasureMarkers = [];
let _areaMeasurePolygon = null;

function startAreaMeasure() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();

  _areaMeasureActive = true;
  _areaMeasurePoints = [];
  _areaMeasureMarkers.forEach(m => leafletMap.removeLayer(m));
  _areaMeasureMarkers = [];
  if (_areaMeasurePolygon) { leafletMap.removeLayer(_areaMeasurePolygon); _areaMeasurePolygon = null; }

  // Wyłącz coord picker żeby kliknięcia szły do pomiaru
  leafletMap.off('click', onCoordPickerClick);
  leafletMap.on('click', onAreaMeasureClick);

  document.getElementById('leaflet-map').style.cursor = 'crosshair';
  showToast('📐 Kliknij 4 rogi parkingu na mapie');
}

function onAreaMeasureClick(e) {
  if (!_areaMeasureActive) return;

  _areaMeasurePoints.push([e.latlng.lat, e.latlng.lng]);

  // Marker z numerem
  const n = _areaMeasurePoints.length;
  const icon = L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div style="width:20px;height:20px;border-radius:50%;background:#e04040;border:2px solid #fff;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">' + n + '</div>'
  });
  const marker = L.marker([e.latlng.lat, e.latlng.lng], { icon }).addTo(leafletMap);
  _areaMeasureMarkers.push(marker);

  if (n >= 2 && _areaMeasurePolygon) leafletMap.removeLayer(_areaMeasurePolygon);
  if (n >= 3) {
    _areaMeasurePolygon = L.polygon(_areaMeasurePoints, {
      color: '#e04040', weight: 2, fillColor: '#e04040', fillOpacity: 0.2
    }).addTo(leafletMap);
  }

  if (n >= 4) {
    finishAreaMeasure();
  } else {
    showToast('📐 Punkt ' + n + '/4 - jeszcze ' + (4 - n));
  }
}

function finishAreaMeasure() {
  _areaMeasureActive = false;
  leafletMap.off('click', onAreaMeasureClick);
  leafletMap.on('click', onCoordPickerClick);
  document.getElementById('leaflet-map').style.cursor = 'crosshair';

  // Oblicz powierzchnię wielokąta (Shoelace formula na metrach)
  const pts = _areaMeasurePoints;
  // Konwertuj lat/lon na przybliżone metry (względem centroidu)
  const cLat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cLon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos(cLat * Math.PI / 180);

  const mPts = pts.map(p => [(p[0] - cLat) * mPerDegLat, (p[1] - cLon) * mPerDegLon]);

  // Shoelace
  let area = 0;
  for (let i = 0; i < mPts.length; i++) {
    const j = (i + 1) % mPts.length;
    area += mPts[i][0] * mPts[j][1];
    area -= mPts[j][0] * mPts[i][1];
  }
  area = Math.abs(area) / 2;

  // 1 miejsce parkingowe = ~12.5 m² (2.5m x 5m) + ~30% na manewry
  const spotsEstimate = Math.round(area / 16);

  const resultText = Math.round(area) + ' m² - szacunkowo ~' + spotsEstimate + ' miejsc';
  showToast('📐 ' + resultText);

  // Zapamiętaj wynik - wstawi się do notatki przy kolejnym otwarciu modala
  _lastAreaResult = '~' + spotsEstimate + ' miejsc (' + Math.round(area) + ' m²)';
  showToast('📐 ' + _lastAreaResult + '. Kliknij parking aby zapisać.');
}

let _lastAreaResult = '';

let _pickerOsmItems = [];

async function fetchPickerLocationInfo(lat, lon) {
  const infoEl = document.getElementById('picker-info');
  if (!infoEl) return;
  _pickerOsmItems = [];
  let addressHtml = '';

  // 1. Reverse geocode z Mapy.com (regionalStructure)
  try {
    const rgRes = await fetch(`https://api.mapy.com/v1/rgeocode?lon=${lon}&lat=${lat}&lang=pl&apiKey=${MAPY_API_KEY}`);
    const rgData = await rgRes.json();
    const item = rgData.items && rgData.items[0];
    if (item) {
      const rs = item.regionalStructure || [];
      const findType = (type) => { const r = rs.find(x => x.type === type); return r ? r.name : ''; };
      const street = findType('regional.street');
      const number = findType('regional.address');
      const municipality = findType('regional.municipality');
      const regions = rs.filter(x => x.type === 'regional.region').map(x => x.name);
      const streetFull = street + (number ? ' ' + number : '');
      addressHtml = '<div style="margin-bottom:6px">📍 <b>' + esc(streetFull || item.name) + '</b>'
        + (municipality ? ', <b>' + esc(municipality) + '</b>' : '')
        + (regions.length ? '<br><span style="color:var(--text3,#888);font-size:10px">' + regions.map(r => esc(r)).join(', ') + '</span>' : '')
        + '</div>';
    }
  } catch(e) { console.warn('rgeocode error:', e); }

  infoEl.innerHTML = addressHtml + '⏳ Szukam obiektów w OSM...';

  // 2. Mapy.com - szukaj obiektów w okolicy (parking, schronisko, itp.)
  const categories = ['parking', 'schronisko', 'restauracja', 'hotel', 'kemping'];
  for (const cat of categories) {
    try {
      const r = await fetch(`https://api.mapy.com/v1/geocode?query=${encodeURIComponent(cat)}&lang=pl&limit=5&near=${lon},${lat}&apiKey=${MAPY_API_KEY}`);
      if (!r.ok) continue;
      const data = await r.json();
      if (!data.items) continue;
      const catIcons = { parking: '🅿️', schronisko: '🏔️', restauracja: '🍽️', hotel: '🏨', kemping: '⛺' };
      data.items.forEach(item => {
        const dMeters = dist(lat, lon, item.position.lat, item.position.lon);
        if (dMeters > 500) return; // max 500m
        const icon = catIcons[cat] || '📍';
        const name = item.name || cat;
        const details = [Math.round(dMeters) + 'm stąd'];
        if (item.location) details.push(item.location);
        _pickerOsmItems.push({ icon, name, typeName: cat, details, isParking: cat === 'parking', tags: {} });
      });
    } catch(e) { console.warn('Mapy.com geocode error for ' + cat, e); }
  }

  // 3. Nominatim (OSM) - szczegóły parkingów w okolicy (tagi: fee, capacity, surface)
  try {
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=parking&viewbox=${lon-0.005},${lat+0.005},${lon+0.005},${lat-0.005}&bounded=1&limit=5&extratags=1`, {
      headers: { 'User-Agent': 'KGP-App/1.4 (parking-picker)' }
    });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      nomData.forEach(p => {
        const dMeters = dist(lat, lon, parseFloat(p.lat), parseFloat(p.lon));
        if (dMeters > 500) return;
        const tags = p.extratags || {};
        const details = [Math.round(dMeters) + 'm stąd'];
        if (tags.capacity) details.push('miejsc: ' + tags.capacity);
        if (tags.fee === 'yes') details.push('💰 płatny');
        else if (tags.fee === 'no') details.push('✅ darmowy');
        if (tags.surface) details.push(tags.surface);
        if (tags.access && tags.access !== 'yes') details.push('dostęp: ' + tags.access);
        if (tags.opening_hours) details.push(tags.opening_hours);
        if (tags.operator) details.push(tags.operator);
        // Nie dodawaj duplikatów (Mapy.com mógł już znaleźć)
        const isDup = _pickerOsmItems.some(x => x.isParking && Math.abs(dMeters - parseInt(x.details[0])) < 50);
        if (!isDup) {
          _pickerOsmItems.push({
            icon: '🅿️', name: p.display_name.split(',')[0] || 'Parking (OSM)',
            typeName: 'Parking (OSM)', details, isParking: true, tags
          });
        } else {
          // Wzbogać istniejący wpis o tagi z OSM
          const existing = _pickerOsmItems.find(x => x.isParking && Math.abs(dMeters - parseInt(x.details[0])) < 50);
          if (existing && details.length > 1) {
            details.slice(1).forEach(d => { if (!existing.details.includes(d)) existing.details.push(d); });
          }
        }
      });
    }
  } catch(e) { console.warn('Nominatim error:', e); }

  // Renderuj z checkboxami
  let itemsHtml = '';
  if (_pickerOsmItems.length > 0) {
    itemsHtml = _pickerOsmItems.map((item, i) => {
      const detailStr = item.details.length ? '<br><span style="color:var(--text3,#888);font-size:10px">' + item.details.map(d => esc(d)).join(' · ') + '</span>' : '';
      const nameDisplay = item.name !== item.typeName ? esc(item.name) + ' <span style="color:var(--text3,#888)">(' + item.typeName + ')</span>' : esc(item.name);
      return `<label style="display:flex;gap:6px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--border,#eee);cursor:pointer">
        <input type="checkbox" class="picker-osm-cb" data-idx="${i}" checked style="margin-top:2px;flex-shrink:0">
        <span>${item.icon} <b>${nameDisplay}</b>${detailStr}</span>
      </label>`;
    }).join('');
  } else {
    itemsHtml = '<div style="color:var(--text3,#888)">Brak obiektów OSM w promieniu 300m</div>';
  }

  infoEl.innerHTML = addressHtml
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    + '<span style="font-size:10px;font-weight:600;color:var(--text)">Obiekty w okolicy (OSM):</span>'
    + (_pickerOsmItems.length > 1 ? '<button onclick="toggleAllPickerOsm()" style="background:none;border:none;font-size:10px;color:var(--accent);cursor:pointer;padding:0">Odznacz wszystkie</button>' : '')
    + '</div>'
    + itemsHtml;
}

function toggleAllPickerOsm() {
  const cbs = document.querySelectorAll('.picker-osm-cb');
  const allChecked = Array.from(cbs).every(cb => cb.checked);
  cbs.forEach(cb => cb.checked = !allChecked);
}

function getPickerSelectedOsmNote() {
  const cbs = document.querySelectorAll('.picker-osm-cb');
  const selected = [];
  cbs.forEach(cb => {
    if (cb.checked) {
      const item = _pickerOsmItems[parseInt(cb.dataset.idx)];
      if (item) {
        let text = item.name;
        if (item.details.length) text += ' (' + item.details.join(', ') + ')';
        selected.push(text);
      }
    }
  });
  return selected;
}

function copyPickerCoords() {
  const lat = document.getElementById('picker-lat').value;
  const lon = document.getElementById('picker-lon').value;
  const note = document.getElementById('picker-note').value.trim();
  const osmItems = getPickerSelectedOsmNote();
  let text = 'lat:' + lat + ', lon:' + lon;
  if (note) text += '\nNotatka: ' + note;
  if (osmItems.length) text += '\nOSM: ' + osmItems.join('; ');
  navigator.clipboard.writeText(text).then(() => showToast('📋 Skopiowane!'));
}

function savePickerCoords() {
  const target = document.getElementById('picker-target').value;
  if (!target) { showToast('⚠️ Wybierz parking z listy'); return; }
  const [peakIdStr, idxStr, type] = target.split(':');
  const peakId = parseInt(peakIdStr);
  const isNew = idxStr === 'new';
  const idx = isNew ? -1 : parseInt(idxStr);
  const lat = parseFloat(document.getElementById('picker-lat').value);
  const lon = parseFloat(document.getElementById('picker-lon').value);
  const note = document.getElementById('picker-note').value.trim();
  const peak = PEAKS.find(p => p.id === peakId);
  if (!peak) return;

  if (isNew) {
    const nameInput = document.getElementById('picker-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { showToast('⚠️ Wpisz nazwę nowego parkingu'); return; }

    // Dodaj nowy parking do pamięci
    if (!peak.parking) peak.parking = [];
    peak.parking.push({ name: name, lat: lat, lon: lon, note: note || '' });

    // Zapisz override
    const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
    if (!ov[peakId]) ov[peakId] = {};
    ov[peakId].parking = JSON.parse(JSON.stringify(peak.parking));
    localStorage.setItem('kgp_peaks_overrides', JSON.stringify(ov));
  } else {
    // Aktualizuj istniejący parking w pamięci
    if (type === 'r' && peak.routes && peak.routes[idx]) {
      peak.routes[idx].parking.lat = lat;
      peak.routes[idx].parking.lon = lon;
      if (note) peak.routes[idx].parking.note = note;
    } else if (peak.parking && peak.parking[idx]) {
      peak.parking[idx].lat = lat;
      peak.parking[idx].lon = lon;
      if (note) peak.parking[idx].note = note;
    }

    // Zapisz override do localStorage
    const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
    if (!ov[peakId]) ov[peakId] = {};
    if (type === 'r') {
      if (!ov[peakId].routes) ov[peakId].routes = JSON.parse(JSON.stringify(peak.routes));
      ov[peakId].routes[idx].parking.lat = lat;
      ov[peakId].routes[idx].parking.lon = lon;
      if (note) ov[peakId].routes[idx].parking.note = note;
    } else {
      if (!ov[peakId].parking) ov[peakId].parking = JSON.parse(JSON.stringify(peak.parking));
      ov[peakId].parking[idx].lat = lat;
      ov[peakId].parking[idx].lon = lon;
      if (note) ov[peakId].parking[idx].note = note;
    }
    localStorage.setItem('kgp_peaks_overrides', JSON.stringify(ov));
  }

  _lastAreaResult = '';
  // Wyczyść markery pomiaru
  _areaMeasureMarkers.forEach(m => leafletMap.removeLayer(m));
  _areaMeasureMarkers = [];
  if (_areaMeasurePolygon) { leafletMap.removeLayer(_areaMeasurePolygon); _areaMeasurePolygon = null; }

  showToast('✅ Zapisano: ' + peak.name);
  document.querySelector('.modal-overlay')?.remove();

  // Odśwież warstwę parkingów
  if (parkingLayerGroup) {
    leafletMap.removeLayer(parkingLayerGroup);
    parkingLayerGroup = null;
    toggleParkingLayer(true);
  }
}

// Eksport overrides do konsoli (do wklejenia w data.js)
function exportParkingOverrides() {
  const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
  const lines = [];
  Object.entries(ov).forEach(([peakId, changes]) => {
    const peak = PEAKS.find(p => p.id === parseInt(peakId));
    if (!peak) return;
    const parkings = changes.routes
      ? changes.routes.map(r => r.parking)
      : (changes.parking || []);
    parkings.forEach(pk => {
      if (pk && pk.lat) {
        lines.push(peak.name + ': {name:"' + pk.name + '", lat:' + pk.lat + ', lon:' + pk.lon + ', note:"' + (pk.note || '').replace(/"/g, '\\"') + '"}');
      }
    });
  });
  console.log('=== PARKING OVERRIDES ===\n' + lines.join('\n'));
  return lines;
}

// Hurtowy opis wszystkich parkingów przez Gemini (1 request)
async function aiBulkDescribeParkings() {
  if (!isAIAvailable()) {
    if (!getProfileId()) showToast('🔒 Zaloguj się aby korzystać z AI');
    else showToast('⚠️ AI niedostępne');
    return;
  }

  const parkingList = [];
  PEAKS.forEach(p => {
    const parkings = p.routes
      ? p.routes.map(r => ({ name: r.parking.name, lat: r.parking.lat, lon: r.parking.lon, note: r.parking.note || '' }))
      : (p.parking || []).map(pk => ({ name: pk.name, lat: pk.lat, lon: pk.lon, note: pk.note || '' }));
    parkings.forEach(pk => {
      parkingList.push({ peak: p.name, range: p.range, height: p.height, difficulty: p.difficulty,
        parking_name: pk.name, lat: pk.lat, lon: pk.lon, current_note: pk.note });
    });
  });

  const prompt = `Jesteś ekspertem turystyki górskiej w Polsce. Znasz wszystkie parkingi przy szlakach Korony Gór Polski.

Dla każdego parkingu poniżej napisz NOWĄ, LEPSZĄ notatkę. Format notatki (max 100 znaków):
~X miejsc, CENA, nawierzchnia. Praktyczna wskazówka.

Zasady:
- Podaj realistyczną liczbę miejsc (na podstawie Twojej wiedzy o tym parkingu)
- Cenę podaj jeśli znasz (np. "10 zł/dzień", "darmowy"), inaczej pomiń - NIE ZMYŚLAJ ceny
- Nawierzchnia: asfalt/szuter/trawa/utwardzony/leśna droga
- Wskazówka: o której przyjechać w sezonie, co ważnego wiedzieć, jaki szlak stąd
- Pisz po polsku, krótki myślnik (nie długi)
- Jeśli aktualna notatka jest już dobra i kompletna - zostaw ją bez zmian

PARKINGI DO OPISANIA:
${parkingList.map((p, i) => (i + 1) + '. ' + p.peak + ' (' + p.range + ', ' + p.height + 'm, trudność ' + p.difficulty + '/5) - parking: "' + p.parking_name + '" [' + p.lat + ',' + p.lon + '] aktualna notatka: "' + p.current_note + '"').join('\n')}

Odpowiedz w formacie JSON (bez markdown, bez backtick) - tablica obiektów:
[{"peak":"nazwa szczytu","parking":"nazwa parkingu","note":"nowa notatka max 100 znaków"}]`;

  showToast('🤖 Gemini opisuje ' + parkingList.length + ' parkingów...');

  const result = await callGeminiAI(prompt, { maxTokens: 4096, temperature: 0.2, model: 'gemini-2.5-flash-lite' });
  if (!result || !result.text) return;

  let results;
  try {
    const jsonStr = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    results = JSON.parse(jsonStr);
  } catch(e) {
    console.error('JSON parse error:', e, result.text);
    showToast('⚠️ Nie udało się sparsować odpowiedzi - sprawdź konsolę');
    return;
  }

  let updated = 0;
  results.forEach(r => {
    const peak = PEAKS.find(p => p.name === r.peak);
    if (!peak) return;
    const parkings = peak.routes ? peak.routes.map(rt => rt.parking) : (peak.parking || []);
    const pk = parkings.find(p => p.name === r.parking);
    if (pk && r.note) { pk.note = r.note; updated++; }
  });

  console.log('aiBulkDescribeParkings: zaktualizowano ' + updated + '/' + results.length + ' parkingów');
  console.log('Wyniki:', JSON.stringify(results, null, 2));
  showToast('🤖 Zaktualizowano ' + updated + ' parkingów! Sprawdź konsolę.');
  return results;
}

// ============================================================
// GEMINI AI - opis parkingu
// ============================================================
async function aiDescribeParking() {
  if (!isAIAvailable()) {
    if (!getProfileId()) showToast('🔒 Zaloguj się aby korzystać z AI');
    else showToast('⚠️ AI niedostępne');
    return;
  }

  const lat = document.getElementById('picker-lat').value;
  const lon = document.getElementById('picker-lon').value;
  const noteEl = document.getElementById('picker-note');
  const infoEl = document.getElementById('picker-info');

  const target = document.getElementById('picker-target').value;
  let peakName = '';
  if (target) {
    const peakId = parseInt(target.split(':')[0]);
    const peak = PEAKS.find(p => p.id === peakId);
    if (peak) peakName = peak.name + ' (' + peak.range + ', ' + peak.height + ' m)';
  }

  const osmInfo = getPickerSelectedOsmNote().join('; ');
  const addressText = infoEl ? infoEl.innerText : '';
  const areaInfo = _lastAreaResult || '';

  const prompt = `Jesteś ekspertem turystyki górskiej w Polsce, znasz parkingi przy szlakach Korony Gór Polski z własnego doświadczenia i opinii turystów.

LOKALIZACJA: ${lat}, ${lon}
${peakName ? 'SZCZYT DOCELOWY: ' + peakName : ''}
${addressText ? 'ADRES: ' + addressText : ''}
${osmInfo ? 'DANE Z MAP: ' + osmInfo : ''}
${areaInfo ? 'ZMIERZONA POWIERZCHNIA: ' + areaInfo : ''}

Odpowiedz w formacie JSON (bez markdown, bez backtick):
{
  "note": "krótka notatka do aplikacji (max 120 znaków): ~X miejsc, cena, nawierzchnia, 1 wskazówka",
  "details": "szczegółowy opis (2-4 zdania): opłaty, nawierzchnia, obłożenie w sezonie, czy to dobry punkt startowy na ten szczyt, jaki szlak stąd najlepszy, na co uważać",
  "rating": "ocena jako punkt startowy na szczyt 1-5 (5=idealny)",
  "tips": "1-2 praktyczne rady od doświadczonego turysty (np. o której przyjechać, czy są toalety, gdzie kupić bilet parkingowy, alternatywny parking gdy pełny)"
}

Zasady:
- Pisz po polsku, krótki myślnik (nie długi)
- Jeśli nie znasz ceny - napisz "cena nieznana" (nie zmyślaj)
- Jeśli nie znasz parkingu - napisz co wiesz o okolicy i szlakach stąd
- Bądź praktyczny - pisz to co turysta chce wiedzieć jadąc tam o 6 rano
- note musi być krótkie (max 120 znaków) - reszta idzie do details`;

  noteEl.value = '⏳ AI generuje opis...';
  noteEl.disabled = true;
  showToast('🤖 Pytam Gemini...');

  const result = await callGeminiAI(prompt, { maxTokens: 1024, model: 'gemini-2.5-flash-lite' });
  noteEl.disabled = false;

  if (!result || !result.text) { noteEl.value = ''; return; }

  let ai;
  try {
    const jsonStr = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    ai = JSON.parse(jsonStr);
  } catch(e) {
    noteEl.value = result.text.substring(0, 150);
    showToast('🤖 Opis wygenerowany (format surowy)');
    return;
  }

  noteEl.value = ai.note || result.text.substring(0, 150);

  const detailsBox = document.getElementById('ai-details');
  if (detailsBox) detailsBox.remove();

  const aiHtml = document.createElement('div');
  aiHtml.id = 'ai-details';
  aiHtml.style.cssText = 'background:var(--bg-alt,#f4f4f8);border-radius:8px;padding:10px;margin-bottom:10px;font-size:11px;line-height:1.5';
  aiHtml.innerHTML = '<div style="font-weight:600;color:var(--accent);margin-bottom:4px">🤖 Analiza AI' + (ai.rating ? ' - ocena ' + ai.rating + '/5' : '') + '</div>'
    + (ai.details ? '<div style="color:var(--text2);margin-bottom:6px">' + esc(ai.details) + '</div>' : '')
    + (ai.tips ? '<div style="color:var(--text);font-style:italic">💡 ' + esc(ai.tips) + '</div>' : '');

  const noteParent = noteEl.closest('div');
  if (noteParent && noteParent.nextElementSibling) {
    noteParent.parentNode.insertBefore(aiHtml, noteParent.nextElementSibling);
  }

  showToast('🤖 Analiza gotowa');
}
