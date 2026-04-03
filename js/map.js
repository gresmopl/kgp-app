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
      <div style="font-size:10px;color:var(--text2);margin-top:4px">Dotknij marker → szczegóły</div>
    </div>
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

function initMap() {
  const el = document.getElementById('leaflet-map');
  if (!el) return;

  if (leafletMap) { leafletMap.remove(); leafletMap = null; }

  leafletMap = L.map('leaflet-map', {
    center: [50.1, 19.0],
    zoom: 7,
    zoomControl: false,
    attributionControl: true
  });

  L.tileLayer(`https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?apiKey=${MAPY_API_KEY}`, {
    maxZoom: 18,
    minZoom: 6,
    attribution: '&copy; <a href="https://www.mapy.com">Mapy.com</a> &copy; <a href="https://www.openstreetmap.org">OSM</a>'
  }).addTo(leafletMap);

  L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

  PEAKS.forEach(p => {
    const done = isDone(p.id);
    const color = done ? '#4caf7d' : '#e8a020';
    const marker = L.marker([p.lat, p.lon], { icon: makeIcon(color, done) }).addTo(leafletMap);

    const popupHtml = `
      <div style="font-family:Inter,sans-serif;min-width:140px">
        <div style="font-weight:700;font-size:14px">${p.name}</div>
        <div style="font-size:11px;color:#666">${p.range}</div>
        <div style="font-size:18px;font-weight:700;color:${color};margin:4px 0">${p.height} m</div>
        <div style="display:flex;gap:6px">
          <button onclick="openPeakDetail(${p.id})" style="flex:1;background:${color};border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;color:${done?'#fff':'#000'}">
            ${done?'✅ Zdobyty':'📋 Szczegóły'}
          </button>
          <button onclick="changePlanPeak(${p.id});goto('plan')" style="background:#eee;border:none;border-radius:6px;padding:6px;font-size:11px;cursor:pointer">📅</button>
        </div>
      </div>`;
    marker.bindPopup(popupHtml, { closeButton: false, className: 'kgp-popup' });

    marker.bindTooltip(p.name, {
      permanent: leafletMap.getZoom() >= 9,
      direction: 'top',
      offset: [0, -14],
      className: 'kgp-label'
    });
  });

  leafletMap.on('zoomend', () => {
    const z = leafletMap.getZoom();
    leafletMap.eachLayer(layer => {
      if (layer.getTooltip) {
        const tip = layer.getTooltip();
        if (tip) {
          if (z >= 9) { tip.options.permanent = true; layer.openTooltip(); }
          else { tip.options.permanent = false; layer.closeTooltip(); }
        }
      }
    });
  });

  if (state.userLat) {
    L.circleMarker([state.userLat, state.userLon], {
      radius: 8, color: '#fff', weight: 2, fillColor: '#4a90d9', fillOpacity: 1
    }).addTo(leafletMap).bindTooltip('Ty', { permanent: true, direction: 'top' });
  }

  if (!pendingRoute) {
    const bounds = L.latLngBounds(PEAKS.map(p => [p.lat, p.lon]));
    leafletMap.fitBounds(bounds, { padding: [20, 20] });
  }
}
