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

    <div class="card card-pad">
      <div class="section-title">👤 Profil</div>
      <label class="label">Imię / nick</label>
      <input class="input" type="text" value="${esc(state.userName)}" placeholder="Jak się nazywasz?" onchange="state.userName=this.value;save()">
      <div style="font-size:10px;color:var(--text2);margin-top:4px">Widoczne w dzienniku i kartach zdobycia</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">🏠 Adres startowy</div>
      <label class="label">Skąd wyruszasz na szlak?</label>
      <input class="input" type="text" value="${esc(state.homeAddr)}" placeholder="Np. Kraków, Warszawa, Wrocław..." onchange="state.homeAddr=this.value;save()">
      <div style="font-size:10px;color:var(--text2);margin-top:4px">Używany do obliczania czasu dojazdu</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">🆘 Kontakt ICE</div>
      <label class="label">Numer telefonu osoby bliskiej (na wypadek SOS)</label>
      <input class="input" type="tel" value="${esc(state.iceContact)}" placeholder="np. 600123456" onchange="state.iceContact=this.value;save()">
      <div style="font-size:10px;color:var(--text2);margin-top:4px">Wyświetlany na ekranie SOS jako szybki kontakt</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">🚗 Transport</div>
      <label class="label">Preferowany środek transportu</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn btn-sm ${state.transport==='car'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.transport='car';save();goto('settings')">🚗 Auto</button>
        <button class="btn btn-sm ${state.transport==='public'?'btn-primary':'btn-secondary'}" style="flex:1" onclick="state.transport='public';save();goto('settings')">🚌 Komunikacja</button>
      </div>
    </div>

    <div class="card card-pad">
      <div class="section-title">⏱️ Tempo chodzenia</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <input type="range" min="0.7" max="1.5" step="0.05" value="${state.paceMultiplier}"
            oninput="state.paceMultiplier=parseFloat(this.value);save();document.getElementById('settings-pace').textContent=this.value+'×'"
            style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text2)">
            <span>Szybki</span><span>Wolny</span>
          </div>
        </div>
        <div style="font-family:var(--font-display);font-size:24px;color:var(--accent);min-width:50px;text-align:center" id="settings-pace">${state.paceMultiplier}×</div>
      </div>
      <div style="font-size:10px;color:var(--text2);margin-top:4px">1.0× = średnie tempo. Poniżej = szybciej, powyżej = wolniej.</div>
    </div>

    <div class="card card-pad">
      <div class="section-title">☁️ Synchronizacja</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Synchronizuj dane między urządzeniami za pomocą kodu sync.</div>
      ${syncCode ? `
        <div style="background:var(--card2);border-radius:10px;padding:12px;margin-bottom:10px;text-align:center">
          <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Twój kod sync</div>
          <div style="font-family:var(--font-display);font-size:24px;color:var(--accent);letter-spacing:1px">${syncCode}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:4px">Podaj ten kod na innym urządzeniu</div>
        </div>
        <button class="btn btn-secondary btn-sm btn-full" onclick="syncToCloud().then(()=>showToast('☁️ Zsynchronizowano!'))">🔄 Wymuś synchronizację</button>
      ` : `
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button class="btn btn-green btn-sm" style="flex:1" onclick="initSync().then(()=>goto('settings'))">🆕 Nowy kod sync</button>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-bottom:6px">Masz już kod? Wpisz go poniżej:</div>
        <div style="display:flex;gap:8px">
          <input class="input" id="sync-code-input" placeholder="np. turbacz4821" style="flex:1;font-size:13px">
          <button class="btn btn-secondary btn-sm" onclick="loginWithCode(document.getElementById('sync-code-input').value)">Zaloguj</button>
        </div>
      `}
    </div>

    <div class="card card-pad">
      <div class="section-title">💾 Backup danych</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Eksportuj dane aby nie stracić postępu.</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="exportData()">📤 Eksportuj</button>
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="document.getElementById('import-input-settings').click()">📥 Importuj</button>
      </div>
      <input type="file" id="import-input-settings" accept=".json" style="display:none" onchange="importData(this)">
    </div>

    <div class="card card-pad">
      <div class="section-title">🗑️ Dane lokalne</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Wyczyść wszystkie lokalne dane aplikacji. Dane w chmurze (jeśli masz kod sync) pozostaną nienaruszone.</div>
      <button class="btn btn-sm" style="background:var(--red);color:#fff;width:100%" onclick="if(confirm('Na pewno? Wszystkie lokalne dane zostaną usunięte!')){localStorage.clear();location.reload()}">🗑️ Wyczyść dane lokalne</button>
    </div>

    <div style="text-align:center;padding:12px;font-size:10px;color:var(--text2)">KGP App v1.2.0</div>
  </div>`;
}
