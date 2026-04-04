// ============================================================
// SETTINGS PAGE
// ============================================================
function renderSettings() {
  const syncCode = getSyncCode();
  return `
  <div class="header">
    <span class="header-icon">⚙️</span>
    <div><div class="header-title">USTAWIENIA</div></div>
  </div>
  <div class="page page-gap">

    ${''/* usunięto - manualne przyciski sync są w sekcji Synchronizacja */}

    <a href="about.html" target="_blank" class="card card-pad" style="display:flex;align-items:center;justify-content:space-between;text-decoration:none;color:var(--text);cursor:pointer">
      <div class="section-title" style="margin:0">🏔️ Informacje o aplikacji</div>
      <span style="font-size:12px;color:var(--text2)">→</span>
    </a>

    <div class="card card-pad" onclick="toggleSection('profile-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">👤 Profil ${state.userName ? '- ' + esc(state.userName) : ''}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="profile-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <label class="label">Imię / nick</label>
        <input class="input" type="text" value="${esc(state.userName)}" placeholder="Jak się nazywasz?" onchange="state.userName=this.value;save()">
        <div style="font-size:10px;color:var(--text2);margin-top:4px">Widoczne w dzienniku i kartach zdobycia</div>
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('address-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🏠 Adres ${state.homeAddr ? '- ' + esc(state.homeAddr) : ''}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="address-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <label class="label">Skąd wyruszasz na szlak?</label>
        <div style="display:flex;gap:6px">
          <input class="input" id="home-addr-input" type="text" value="${esc(state.homeAddr)}" placeholder="Np. Kraków, Warszawa..." onchange="validateHomeAddr(this.value)" style="flex:1">
          <button class="btn btn-secondary btn-sm" onclick="detectHomeAddr()" style="white-space:nowrap" title="Użyj GPS">📍 GPS</button>
        </div>
        <div id="home-addr-status" style="font-size:10px;margin-top:4px;${state._homeGeo ? 'color:var(--green)' : 'color:var(--text2)'}">
          ${state._homeGeo ? '✅ '+state._homeGeo.lat.toFixed(4)+', '+state._homeGeo.lon.toFixed(4)+' - używany do obliczania odległości' : state.homeAddr ? '⏳ Weryfikacja adresu...' : 'Używany do obliczania czasu dojazdu i odległości'}
        </div>
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('transport-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🚗 Transport - ${state.transport==='pks'?'Komunikacja':'Samochód'}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="transport-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm ${state.transport!=='pks'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.transport='car';save();goto('settings')">🚗 Samochód</button>
          <button class="btn btn-sm ${state.transport==='pks'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.transport='pks';save();goto('settings')">🚂 Komunikacja</button>
        </div>
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('pace-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">⏱️ Tempo ${state.paceMultiplier<=0.85?'Szybkie':state.paceMultiplier<=1.1?'Normalne':'Spokojne'}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="pace-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm ${state.paceMultiplier===0.8?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.paceMultiplier=0.8;save();goto('settings')">🏃 Szybkie</button>
          <button class="btn btn-sm ${state.paceMultiplier===1.0?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.paceMultiplier=1.0;save();goto('settings')">🚶 Normalne</button>
          <button class="btn btn-sm ${state.paceMultiplier===1.3?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.paceMultiplier=1.3;save();goto('settings')">🐢 Spokojne</button>
        </div>
        <div style="font-size:10px;color:var(--text2);margin-top:6px">${getPaceDescription(state.paceMultiplier)}</div>
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('theme-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🌓 Motyw ${(localStorage.getItem('kgp_theme')||'system')==='light'?'Jasny':(localStorage.getItem('kgp_theme')||'system')==='dark'?'Ciemny':'Systemowy'}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="theme-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm ${(localStorage.getItem('kgp_theme')||'system')==='light'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="setTheme('light')">☀️ Jasny</button>
          <button class="btn btn-sm ${(localStorage.getItem('kgp_theme')||'system')==='dark'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="setTheme('dark')">🌙 Ciemny</button>
          <button class="btn btn-sm ${(localStorage.getItem('kgp_theme')||'system')==='system'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="setTheme('system')">⚙️ Systemowy</button>
        </div>
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('sync-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">☁️ Synchronizacja ${syncCode ? '- ' + syncCode : ''}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="sync-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Synchronizuj dane między urządzeniami za pomocą kodu dostępu.</div>
        ${syncCode ? `
          <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px;text-align:center">
            <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Twój kod dostępu</div>
            <div style="font-family:var(--font-display);font-size:24px;color:var(--accent);letter-spacing:1px">${syncCode}</div>
            <div style="font-size:10px;color:var(--text2);margin-top:4px">Podaj ten kod na innym urządzeniu</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button class="btn btn-primary btn-sm" style="flex:1" onclick="syncToCloud().then(()=>showToast('☁️ Wysłano do chmury'))">⬆️ Wyślij do chmury</button>
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="pullFromCloud().then(ok=>{if(ok){showToast('⬇️ Pobrano z chmury');goto('settings')}else{showToast('❌ Błąd pobierania')}})">⬇️ Pobierz z chmury</button>
          </div>
          <div style="font-size:10px;color:var(--text2)">Zdobyte: ${state.conquered.length}, wpisy: ${state.journal.length}, wycieczki: ${state.trips.length}</div>
        ` : `
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button class="btn btn-green btn-sm" style="flex:1" onclick="createNewProfile().then(()=>goto('settings'))">🆕 Nowy kod dostępu</button>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:6px">Masz już kod? Wpisz go poniżej:</div>
          <div style="display:flex;gap:8px">
            <input class="input" id="sync-code-input" placeholder="np. turbacz4821" style="flex:1;font-size:13px">
            <button class="btn btn-secondary btn-sm" onclick="loginWithCode(document.getElementById('sync-code-input').value)">Zaloguj</button>
          </div>
        `}
      </div>
    </div>

    ${(() => {
      const sos = getSOSInfo();
      return `
    <div class="card card-pad" onclick="toggleSection('sos-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🆘 Numery alarmowe ${sos.peak ? '- ' + sos.gopr.name : ''}</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="sos-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="background:var(--card2);border-radius:10px;padding:10px;margin-bottom:10px;text-align:center">
          <div style="font-size:10px;color:var(--text2);margin-bottom:2px">📍 Twoje koordynaty GPS</div>
          <div style="font-family:var(--font-display);font-size:18px;${sos.hasGPS ? 'color:var(--accent)' : 'color:var(--red)'};letter-spacing:1px">${sos.coords || 'Brak GPS'}</div>
          ${sos.hasGPS ? '<div style="font-size:9px;color:var(--text2);margin-top:2px">Podaj ratownikom przez telefon</div>' : '<div style="font-size:9px;color:var(--red);margin-top:2px">Włącz GPS aby poznać swoje koordynaty</div>'}
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--red)15;border-radius:10px;margin-bottom:6px">
          <span style="font-size:20px">📞</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--red)">${sos.gopr.name}</div>
            <div style="font-family:var(--font-display);font-size:20px;letter-spacing:1px">${sos.gopr.phone}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card2);border-radius:10px;margin-bottom:8px">
          <span style="font-size:20px">📞</span>
          <div>
            <div style="font-weight:700;font-size:13px">Numer alarmowy</div>
            <div style="font-family:var(--font-display);font-size:20px;letter-spacing:1px">112</div>
          </div>
        </div>
        ${sos.peak ? '<div style="font-size:10px;color:var(--text2);margin-bottom:6px">Numer dla regionu: <b>'+sos.peak.range+'</b></div>' : ''}
        <div style="font-size:10px;color:var(--text2)">Do alarmowania polecamy aplikację <b>Ratunek</b> (GOPR/TOPR) - ma wbudowane zabezpieczenia przed przypadkowym wysłaniem</div>
      </div>
    </div>`;
    })()}

    <div class="card card-pad" onclick="toggleSection('ai-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🤖 Asystent AI</div>
        <span id="ai-badge" style="font-size:12px;color:var(--text2)">${isAIAvailable() ? '✅ Aktywny' : getProfileId() ? '⏳ Ładowanie...' : '🔒 Wymaga logowania'} ▼</span>
      </div>
      <div id="ai-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        ${getProfileId() ? `
        <div style="font-size:11px;color:var(--text2);margin-bottom:8px">AI pomaga opisywać parkingi i sugerować trasy. Dostępne po zalogowaniu kodem dostępu.</div>
        <div id="ai-usage-stats" style="font-size:11px;color:var(--text2)">Ładowanie statystyk...</div>
        ` : `
        <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Zaloguj się kodem dostępu aby korzystać z AI. Asystent pomaga opisywać parkingi i sugerować trasy.</div>
        `}
      </div>
    </div>

    ${renderParkingOverridesSection()}

    <div class="card card-pad" onclick="toggleSection('backup-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">💾 Kopia zapasowa</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="backup-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Eksportuj dane aby nie stracić postępu.</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="exportData()">📤 Eksportuj</button>
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="document.getElementById('import-input-settings').click()">📥 Importuj</button>
        </div>
        <input type="file" id="import-input-settings" accept=".json" style="display:none" onchange="importData(this)">
      </div>
    </div>

    <div class="card card-pad" onclick="toggleSection('data-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🗑️ Dane lokalne</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="data-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Wyczyść wszystkie lokalne dane aplikacji. Dane w chmurze (jeśli masz kod dostępu) pozostaną nienaruszone.</div>
        <button class="btn btn-sm" style="background:var(--red);color:#fff;width:100%" onclick="if(confirm('Na pewno? Wszystkie lokalne dane zostaną usunięte!')){localStorage.clear();location.reload()}">🗑️ Wyczyść dane lokalne</button>
      </div>
    </div>

    ${!(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) ? `
    <div class="card card-pad" onclick="toggleSection('install-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">📲 Zainstaluj na telefonie</div>
        <span style="font-size:12px;color:var(--text2)">▼</span>
      </div>
      <div id="install-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Dodaj aplikację do ekranu głównego - działa jak zwykła aplikacja, bez paska przeglądarki.</div>
        <button class="btn btn-primary btn-full" onclick="installApp()">📲 Dodaj do ekranu głównego</button>
      </div>
    </div>` : ''}

    <div style="text-align:center;padding:12px;font-size:10px;color:var(--text2)" onclick="adminTap()">
      Korona Gór Polski v1.2.0<br>
      <span style="margin-top:2px;display:inline-block">Projekt: Grzegorz Smoliński</span>
    </div>
  </div>`;
}

// toggleSection() przeniesione do utils.js (używane globalnie)

// saveGeminiKey/removeGeminiKey usunięte - klucz AI zarządzany centralnie przez ai.js

function renderParkingOverridesSection() {
  const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
  const entries = [];
  Object.entries(ov).forEach(([peakId, changes]) => {
    const peak = PEAKS.find(p => p.id === parseInt(peakId));
    if (!peak) return;
    const parkings = changes.parking || [];
    parkings.forEach((pk, idx) => {
      entries.push({ peakId: parseInt(peakId), peakName: peak.name, idx, name: pk.name, lat: pk.lat, lon: pk.lon, note: pk.note || '' });
    });
    if (changes.routes) {
      changes.routes.forEach((r, idx) => {
        if (r.parking) entries.push({ peakId: parseInt(peakId), peakName: peak.name, idx, name: r.parking.name, lat: r.parking.lat, lon: r.parking.lon, note: r.parking.note || '', isRoute: true });
      });
    }
  });

  if (entries.length === 0) return '';

  const list = entries.map(e =>
    '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--card2);border-radius:8px;margin-bottom:6px">'
    + '<div style="flex:1;min-width:0">'
    + '<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(e.peakName) + ' - ' + esc(e.name) + '</div>'
    + '<div style="font-size:10px;color:var(--text2)">' + e.lat.toFixed(5) + ', ' + e.lon.toFixed(5) + (e.note ? ' - ' + esc(e.note).substring(0, 40) : '') + '</div>'
    + '</div>'
    + '<button onclick="deleteParkingOverride(' + e.peakId + ',' + e.idx + ',' + (e.isRoute ? 'true' : 'false') + ')" style="background:none;border:none;color:var(--red,#e04040);font-size:16px;cursor:pointer;padding:4px" title="Usuń nadpisanie">✕</button>'
    + '</div>'
  ).join('');

  return `<div class="card card-pad" onclick="toggleSection('parking-ov-section',this)" style="cursor:pointer">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="section-title" style="margin:0">🅿️ Moje parkingi</div>
        <span style="font-size:12px;color:var(--text2)">${entries.length} nadpisań ▼</span>
      </div>
      <div id="parking-ov-section" style="display:none;margin-top:10px" onclick="event.stopPropagation()">
        <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Parkingi ustawione przez Ciebie (koordynaty, notatki). Kliknij ✕ aby przywrócić domyślne.</div>
        ${list}
        <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:6px" onclick="if(confirm('Usunąć wszystkie nadpisania parkingów?')){localStorage.removeItem('kgp_peaks_overrides');location.reload()}">🗑️ Wyczyść wszystkie</button>
      </div>
    </div>`;
}

function deleteParkingOverride(peakId, idx, isRoute) {
  const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
  if (!ov[peakId]) return;

  if (isRoute && ov[peakId].routes) {
    delete ov[peakId].routes;
  } else if (ov[peakId].parking) {
    ov[peakId].parking.splice(idx, 1);
    if (ov[peakId].parking.length === 0) delete ov[peakId].parking;
  }

  // Usuń cały wpis jeśli pusty
  if (Object.keys(ov[peakId]).length === 0) delete ov[peakId];

  if (Object.keys(ov).length === 0) localStorage.removeItem('kgp_peaks_overrides');
  else localStorage.setItem('kgp_peaks_overrides', JSON.stringify(ov));

  showToast('✅ Usunięto nadpisanie');
  goto('settings');
}

function applyTheme() {
  const theme = localStorage.getItem('kgp_theme') || 'system';
  document.documentElement.classList.remove('dark-theme', 'light-theme');
  if (theme === 'dark') document.documentElement.classList.add('dark-theme');
  else if (theme === 'light') document.documentElement.classList.add('light-theme');
}

function setTheme(theme) {
  localStorage.setItem('kgp_theme', theme);
  applyTheme();
  goto('settings');
}

function getPaceDescription(val) {
  if (val <= 0.85) return 'Szybkie tempo - trasa 3h zajmie Ci ok. 2h 30min';
  if (val <= 1.1) return 'Normalne tempo - czasy przejść będą standardowe';
  return 'Spokojne tempo - trasa 3h zajmie Ci ok. 4h';
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(`https://api.mapy.com/v1/rgeocode?lon=${lon}&lat=${lat}&lang=pl&apiKey=${MAPY_API_KEY}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  const loc = item.location || {};
  return loc.municipality || loc.city || item.name || null;
}

async function detectHomeAddr() {
  const statusEl = document.getElementById('home-addr-status');
  const input = document.getElementById('home-addr-input');
  statusEl.style.color = 'var(--text2)';
  statusEl.textContent = '⏳ Pobieranie lokalizacji GPS...';

  if (!navigator.geolocation) {
    statusEl.style.color = 'var(--red)';
    statusEl.textContent = '❌ GPS niedostępny w tej przeglądarce';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      statusEl.textContent = '⏳ Rozpoznawanie adresu...';
      try {
        const name = await reverseGeocode(lat, lon);
        if (name) {
          input.value = name;
          state.homeAddr = name;
          state._homeGeo = { lat, lon };
          localStorage.setItem('kgp_home_geo', JSON.stringify({ lat, lon }));
          save();
          statusEl.style.color = 'var(--green)';
          statusEl.textContent = '✅ ' + lat.toFixed(4) + ', ' + lon.toFixed(4) + ' - używany do obliczania odległości';
        } else {
          statusEl.style.color = 'var(--red)';
          statusEl.textContent = '❌ Nie udało się rozpoznać lokalizacji';
        }
      } catch(e) {
        statusEl.style.color = 'var(--red)';
        statusEl.textContent = '❌ Błąd połączenia - sprawdź internet';
      }
    },
    (err) => {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = err.code === 1 ? '❌ Brak zgody na GPS - zezwól w ustawieniach przeglądarki' : '❌ Nie udało się pobrać lokalizacji';
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

async function validateHomeAddr(value) {
  const statusEl = document.getElementById('home-addr-status');
  state.homeAddr = value;
  state._homeGeo = null;
  localStorage.removeItem('kgp_home_geo');
  save();

  if (!value.trim()) {
    statusEl.style.color = 'var(--text2)';
    statusEl.textContent = 'Używany do obliczania czasu dojazdu i odległości';
    return;
  }

  statusEl.style.color = 'var(--text2)';
  statusEl.textContent = '⏳ Sprawdzam adres...';

  try {
    const coords = await geocodeParking(value);
    if (coords) {
      state._homeGeo = coords;
      localStorage.setItem('kgp_home_geo', JSON.stringify(coords));
      statusEl.style.color = 'var(--green)';
      statusEl.textContent = '✅ ' + coords.lat.toFixed(4) + ', ' + coords.lon.toFixed(4) + ' - używany do obliczania odległości';
    } else {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = '❌ Nie rozpoznano adresu - wpisz poprawną nazwę miejscowości';
    }
  } catch(e) {
    statusEl.style.color = 'var(--red)';
    statusEl.textContent = '❌ Błąd połączenia - sprawdź internet i spróbuj ponownie';
  }
}
