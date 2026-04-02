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

    ${renderProgressPanorama()}

    ${(() => {
      const streak = getStreakInfo();
      if (!streak) return '';
      return `
      <div class="card card-pad">
        <div class="section-title">📊 Twoja passa</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${streak.daysSinceLast}</div>
            <div class="stat-label">Dni od ostatniego szczytu</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${streak.thisMonthCount}</div>
            <div class="stat-label">Szczyty w tym miesiącu</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${streak.bestMonth}</div>
            <div class="stat-label">Rekord miesiąca</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${streak.maxGap}</div>
            <div class="stat-label">Najdłuższa przerwa (dni)</div>
          </div>
        </div>
      </div>`;
    })()}

    ${(() => {
      const forecast = getCompletionForecast();
      if (!forecast) return '';
      if (forecast.done) return '<div class="card card-pad" style="text-align:center"><div style="font-family:var(--font-display);font-size:24px;color:var(--green)">🏆 Korona zdobyta!</div></div>';
      return `
      <div class="card card-pad">
        <div class="section-title">📈 Prognoza ukończenia</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">
          Twoje tempo: <b style="color:var(--accent)">${forecast.peaksPerMonth} szczytów/miesiąc</b><br>
          Przy tym tempie ukończysz KGP za ~<b style="color:var(--green)">${forecast.daysNeeded} dni</b> (${forecast.completionDate})
        </div>
      </div>`;
    })()}

    ${(() => {
      const bench = getBenchmarkComparison();
      if (!bench) return '';
      return `
      <div class="card card-pad">
        <div class="section-title">🏅 Na tle innych zdobywców</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">
          Aktywność: <b style="color:var(--text)">${bench.monthsActive} miesięcy</b><br>
          Tempo: <b style="color:var(--accent)">${bench.userPace} szczytów/miesiąc</b><br>
          ${bench.aheadOrBehind >= 0
            ? `Jesteś <b style="color:var(--green)">+${bench.aheadOrBehind} szczytów</b> przed średnią`
            : `Jesteś <b style="color:var(--red)">${bench.aheadOrBehind} szczytów</b> za średnią`}<br>
          Szybciej niż <b style="color:var(--accent)">${bench.percentile}%</b> zdobywców
        </div>
      </div>`;
    })()}

    ${(() => {
      const memory = getYearAgoMemory();
      if (!memory) return '';
      return `
      <div class="card card-pad" style="border-color:var(--accent)44">
        <div class="section-title">📅 ${memory.yearsAgo === 1 ? 'Rok' : memory.yearsAgo + ' lata'} temu dziś...</div>
        <div style="font-size:14px;font-weight:600">${memory.entry.name} <span style="color:var(--accent)">${memory.entry.height}m</span></div>
        ${memory.entry.photo ? `<img src="${memory.entry.photo}" style="width:100%;border-radius:10px;max-height:150px;object-fit:cover;margin-top:8px">` : ''}
        ${memory.entry.note ? `<div style="font-size:12px;color:var(--text2);margin-top:6px;font-style:italic">"${esc(memory.entry.note)}"</div>` : ''}
      </div>`;
    })()}

    ${renderAchievements()}

    ${renderDashboard()}

    ${state.journal.length > 0 ? renderJournalTimeline() : `
    <div style="text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:48px;margin-bottom:12px">⛰️</div>
      <div style="font-size:14px">Brak wpisów w dzienniku</div>
      <div style="font-size:12px;margin-top:6px">Zdobądź pierwszy szczyt!</div>
    </div>`}

    <div style="text-align:center;margin-bottom:6px">
      <button class="btn btn-secondary btn-sm" onclick="openHistoryEntry()">📝 Wpisz historyczne wejscie</button>
    </div>

    ${renderGroupChallenge()}

    ${done > 0 ? `
    <div class="card card-pad">
      <div class="section-title">🤔 Co dalej?</div>
      ${renderNextSuggestions()}
    </div>` : ''}

    ${renderFunFact()}

    <div style="text-align:center;padding:12px;display:flex;flex-direction:column;gap:8px;align-items:center">
      ${state.journal.filter(e => e.photo).length > 0 ? `<button class="btn btn-secondary btn-sm" onclick="printPhotos()">🖨️ Drukuj zdjęcia (A4, 9x13)</button>` : ''}
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
