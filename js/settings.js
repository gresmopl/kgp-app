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

    ${syncCode ? `
    <button class="btn btn-secondary btn-full" onclick="syncToCloud().then(()=>showToast('☁️ Zsynchronizowano!'))">🔄 Wymuś synchronizację</button>
    ` : ''}

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
        <input class="input" type="text" value="${esc(state.homeAddr)}" placeholder="Np. Kraków, Warszawa, Wrocław..." onchange="state.homeAddr=this.value;save()">
        <div style="font-size:10px;color:var(--text2);margin-top:4px">Używany do obliczania czasu dojazdu</div>
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
        ` : `
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <button class="btn btn-green btn-sm" style="flex:1" onclick="initSync().then(()=>goto('settings'))">🆕 Nowy kod dostępu</button>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:6px">Masz już kod? Wpisz go poniżej:</div>
          <div style="display:flex;gap:8px">
            <input class="input" id="sync-code-input" placeholder="np. turbacz4821" style="flex:1;font-size:13px">
            <button class="btn btn-secondary btn-sm" onclick="loginWithCode(document.getElementById('sync-code-input').value)">Zaloguj</button>
          </div>
        `}
      </div>
    </div>

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

function toggleSection(id, card) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  const arrow = card.querySelector('span:last-child');
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
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
