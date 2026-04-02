// ============================================================
// JOURNAL PAGE
// ============================================================
function renderJournal() {
  const done = state.conquered.length;
  const totalAscent = state.journal.reduce((sum,e)=>{
    const p=PEAKS.find(pk=>pk.id===e.peakId); return sum+(p?getRoute(p).trail.ascent:0);
  }, 0);
  const everests = (totalAscent / 8849 * 100).toFixed(0);

  return `
  <div class="header">
    <span class="header-icon">📖</span>
    <div><div class="header-title">Dziennik</div><div class="header-sub">${done} szczytów zdobytych</div></div>
  </div>
  <div class="page page-gap" style="padding-bottom:80px">

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${done}</div>
        <div class="stat-label">Szczytów zdobytych</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${28-done}</div>
        <div class="stat-label">Pozostało</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${totalAscent.toLocaleString()}</div>
        <div class="stat-label">Metrów w górę</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${everests}%</div>
        <div class="stat-label">Everestu (8849m)</div>
      </div>
    </div>

    ${done > 0 ? `
    <div style="background:var(--card);border:1px solid ${done===28?'var(--accent)':'var(--green)'}44;border-radius:var(--radius);padding:14px;text-align:center">
      ${done === 28
        ? `<div style="font-family:var(--font-display);font-size:28px;color:var(--accent)">🏆 ZDOBYWCA KORONY!</div><div style="font-size:13px;color:var(--text2)">Wszystkie 28 szczytów zdobyte!</div>`
        : `<div style="font-size:13px;color:var(--text2)">Do tytułu Zdobywcy brakuje Ci</div><div style="font-family:var(--font-display);font-size:36px;color:var(--green)">${28-done} szczytów</div>`}
    </div>` : ''}

    ${state.journal.length > 0 ? `
    <div class="card">
      <div class="card-pad" style="border-bottom:1px solid var(--border)">
        <div class="section-title">Historia</div>
        <div style="font-size:11px;color:var(--text2);margin-top:-8px;margin-bottom:4px">
          📱 Zdjęcia przechowywane lokalnie w przeglądarce (localStorage). Nie znikną po zamknięciu - ale wyczyść się przy czyszczeniu danych przeglądarki. Zrób backup zdjęć zapisując je do galerii telefonu.
        </div>
      </div>
      ${state.journal.map(entry => `
        <div class="journal-item">
          <div class="journal-photo" style="cursor:${entry.photo?'pointer':'default'}" onclick="${entry.photo?`downloadPhoto(${entry.peakId})`:''}">
            ${entry.photo ? `<img src="${entry.photo}" alt="szczyt" style="width:100%;height:100%;border-radius:10px;object-fit:cover">` : '📷'}
          </div>
          <div class="journal-info">
            <div class="journal-name">${entry.name} <span style="color:var(--accent);font-family:var(--font-display);font-size:16px">${entry.height}m</span></div>
            <div class="journal-date">📅 ${entry.date} o ${entry.time}</div>
            ${entry.note ? `<div class="journal-note">"${esc(entry.note)}"</div>` : ''}
            ${entry.photo ? `<button onclick="downloadPhoto(${entry.peakId})" style="background:none;border:none;font-size:11px;color:var(--blue);cursor:pointer;padding:2px 0;margin-top:2px;display:block">⬇️ Zapisz zdjęcie</button>` : ''}
          </div>
          <button onclick="removePeak(${entry.peakId})" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text2);padding:4px" title="Usuń">×</button>
        </div>`).join('')}
    </div>` : `
    <div style="text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:48px;margin-bottom:12px">⛰️</div>
      <div style="font-size:14px">Brak wpisów w dzienniku</div>
      <div style="font-size:12px;margin-top:6px">Zdobądź pierwszy szczyt!</div>
    </div>`}

    ${done > 0 ? `
    <div class="card card-pad">
      <div class="section-title">🤔 Co dalej?</div>
      ${renderNextSuggestions()}
    </div>` : ''}

    <div style="text-align:center;padding:12px">
      <button class="btn btn-secondary btn-sm" onclick="goto('settings')">⚙️ Ustawienia, sync i backup</button>
    </div>

  </div>`;
}

function removePeak(peakId) {
  if (!confirm('Usunąć wpis?')) return;
  state.conquered = state.conquered.filter(id=>id!==peakId);
  state.journal = state.journal.filter(e=>e.peakId!==peakId);
  save();
  goto('journal');
}

function exportData() {
  const data = { conquered: state.conquered, journal: state.journal, pace: state.paceMultiplier, home: state.homeAddr, userName: state.userName, version: 2 };
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kgp-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📤 Backup zapisany!');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.conquered || !Array.isArray(data.conquered)) throw new Error('Nieprawidłowy format');
      if (!confirm(`Importować dane? ${data.conquered.length} zdobytych szczytów, ${(data.journal||[]).length} wpisów. Nadpisze obecne dane!`)) return;
      state.conquered = data.conquered;
      state.journal = data.journal || [];
      if (data.pace) state.paceMultiplier = data.pace;
      if (data.home) state.homeAddr = data.home;
      if (data.userName) state.userName = data.userName;
      save();
      showToast('📥 Dane zaimportowane!');
      goto('journal');
    } catch(err) {
      showToast('❌ Błąd importu - nieprawidłowy plik');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function downloadPhoto(peakId) {
  const entry = state.journal.find(e=>e.peakId===peakId);
  if (!entry || !entry.photo) return;
  const a = document.createElement('a');
  a.href = entry.photo;
  a.download = `KGP_${entry.name.replace(/ /g,'_')}_${entry.date.replace(/\./g,'-')}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('📥 Zdjęcie zapisane!');
}
