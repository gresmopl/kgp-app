// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function mdToHtml(raw) {
  const lines = esc(raw).split('\n');
  let html = '', inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<br>';
      continue;
    }
    const li = trimmed.match(/^[\*\-]\s+(.+)/);
    if (li) {
      if (!inList) { html += '<ul style="margin:4px 0 4px 18px">'; inList = true; }
      html += '<li>' + inline(li[1]) + '</li>';
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) { html += '<div style="font-weight:700;margin-top:8px">' + inline(h3[1]) + '</div>'; continue; }
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) { html += '<div style="font-weight:700;font-size:14px;margin-top:8px;color:var(--accent)">' + inline(h2[1]) + '</div>'; continue; }
    html += '<div>' + inline(trimmed) + '</div>';
  }
  if (inList) html += '</ul>';
  return html;

  function inline(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--card2);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  }
}

function toggleSection(id, card) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  const arrow = card.querySelector('span:last-child');
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  card.style.borderColor = isOpen ? '' : 'var(--accent)';
}

function addMinutes(timeStr, mins) {
  const [h,m] = timeStr.split(':').map(Number);
  const total = h*60+m+mins;
  return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function fmtTime(min) {
  const h = Math.floor(min/60), m = min%60;
  return h > 0 ? `${h}h ${m>0?m+'min':''}` : `${m} min`;
}

function adjTime(min) { return Math.round(min * state.paceMultiplier); }

function dist(lat1,lon1,lat2,lon2) {
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function diffDots(n) {
  return `<span class="peak-diff">${Array.from({length:5},(_,i)=>`<span class="diff-dot ${i<n?'filled':''}"></span>`).join('')}</span>`;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
// CONFETTI
// ============================================================
function confetti() {
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  const colors = ['#e8a020','#4caf7d','#4a90d9','#e05555','#f0c060','#a0e8d0'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;top:-20px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*1.5}s;animation-duration:${2+Math.random()*2}s;transform:rotate(${Math.random()*360}deg)`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 5000);
}

// ============================================================
// GPS
// ============================================================
function startGPS() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(pos => {
    state.userLat = pos.coords.latitude;
    state.userLon = pos.coords.longitude;
    state.gpsActive = true;
    checkGeofence();
  }, null, {enableHighAccuracy:true, maximumAge:10000});
}

function checkGeofence() {
  if (!state.userLat) return;
  for (const p of PEAKS) {
    if (isDone(p.id)) continue;
    const d = dist(state.userLat, state.userLon, p.lat, p.lon);
    if (d < 500) {
      if (state.nearbyPeak !== p.id) {
        state.nearbyPeak = p.id;
        changeSummitPeak(p.id);
        showToast(`📍 Jesteś blisko ${p.name}! Kliknij Szczyt w menu.`);
      }
      return;
    }
  }
  state.nearbyPeak = null;
}

// ============================================================
// CONTEXT DETECTION (home / trail / summit)
// ============================================================
const CTX = { HOME: 'home', DRIVING: 'driving', TRAIL: 'trail', SUMMIT: 'summit' };
const CTX_META = {
  home:    { icon: '🏠', label: 'Planowanie',  color: 'var(--accent)' },
  driving: { icon: '🚗', label: 'W trasie',    color: 'var(--blue)' },
  trail:   { icon: '🥾', label: 'Na szlaku',   color: 'var(--green)' },
  summit:  { icon: '🏔️', label: 'Na szczycie', color: '#e05555' },
};

let _ctxHistory = [];       // ostatnie odczyty [{ctx, ts}]
let _ctxGpsHistory = [];    // pozycje do pomiaru prędkości [{lat,lon,ts}]
const CTX_SPEED_DRIVING = 4.17; // 15 km/h w m/s

function detectContext() {
  if (state._contextOverride) return state._contextOverride;
  if (!state.gpsActive || !state.userLat) return CTX.HOME;

  // Oblicz dystans do najbliższego szczytu
  let minDist = Infinity, nearestPeak = null;
  for (const p of PEAKS) {
    const d = dist(state.userLat, state.userLon, p.lat, p.lon);
    if (d < minDist) { minDist = d; nearestPeak = p; }
  }

  // Oblicz prędkość (m/s) z ostatnich odczytów GPS
  const now = Date.now();
  _ctxGpsHistory.push({ lat: state.userLat, lon: state.userLon, ts: now });
  // Zachowaj tylko ostatnie 2 minuty
  _ctxGpsHistory = _ctxGpsHistory.filter(h => now - h.ts < 120000);

  let speed = 0; // m/s
  if (_ctxGpsHistory.length >= 2) {
    const oldest = _ctxGpsHistory[0];
    const dt = (now - oldest.ts) / 1000;
    if (dt > 5) {
      const dd = dist(oldest.lat, oldest.lon, state.userLat, state.userLon);
      speed = dd / dt;
    }
  }

  // Reguły detekcji (priorytet od najwyższego)
  // 1. Na szczycie: <200m + wolno
  // 2. W trasie: prędkość >15 km/h (samochód, niezależnie od dystansu)
  // 3. Na szlaku: <5km od szczytu + prędkość 1-15 km/h
  // 4. Planowanie: reszta
  let raw;
  if (minDist < 200 && speed < 0.5) {
    raw = CTX.SUMMIT;
  } else if (speed > CTX_SPEED_DRIVING) {
    raw = CTX.DRIVING;
  } else if (minDist < 5000 && speed > 0.3) {
    raw = CTX.TRAIL;
  } else {
    raw = CTX.HOME;
  }

  // Debounce - wymagaj 3 kolejnych odczytów tego samego kontekstu (ok. 45s)
  _ctxHistory.push({ ctx: raw, ts: now });
  _ctxHistory = _ctxHistory.filter(h => now - h.ts < 90000);

  const recent = _ctxHistory.slice(-3);
  if (recent.length >= 3 && recent.every(h => h.ctx === raw)) {
    return raw;
  }

  return state.context || CTX.HOME;
}

function updateContext() {
  const prev = state.context;
  const next = detectContext();
  if (next === prev) return;

  state.context = next;
  state._contextPeak = null;

  // Ustal szczyt kontekstowy
  if (next !== CTX.HOME && state.userLat) {
    let minD = Infinity, best = null;
    for (const p of PEAKS) {
      const d = dist(state.userLat, state.userLon, p.lat, p.lon);
      if (d < minD) { minD = d; best = p; }
    }
    state._contextPeak = best;
  }

  updateContextBadge();
  updateWakeLock(next);

  // Toast przy zmianie kontekstu
  const meta = CTX_META[next];
  if (prev && prev !== next) {
    const peakInfo = state._contextPeak ? ` - ${state._contextPeak.name}` : '';
    showToast(`${meta.icon} Tryb: ${meta.label}${peakInfo}`);
  }
}

function updateContextBadge() {
  let badge = document.getElementById('ctx-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'ctx-badge';
    badge.onclick = showContextSwitcher;
    document.getElementById('nav')?.prepend(badge);
  }

  const meta = CTX_META[state.context || CTX.HOME];
  const overrideIndicator = state._contextOverride ? ' 🔧' : '';
  badge.innerHTML = `<span class="ctx-icon">${meta.icon}</span><span class="ctx-label">${meta.label}${overrideIndicator}</span>`;
  badge.style.setProperty('--ctx-color', meta.color);
  badge.className = 'ctx-badge ctx-' + (state.context || CTX.HOME);
}

function showContextSwitcher() {
  const existing = document.getElementById('ctx-switcher');
  if (existing) { existing.remove(); return; }

  const current = state._contextOverride || '';
  const options = [
    { val: '', label: '🔄 Auto (GPS)', desc: 'Automatyczna detekcja' },
    { val: CTX.HOME, label: '🏠 Planowanie', desc: 'Tryb domowy' },
    { val: CTX.DRIVING, label: '🚗 W trasie', desc: 'Jazda samochodem' },
    { val: CTX.TRAIL, label: '🥾 Na szlaku', desc: 'Piesze podejście' },
    { val: CTX.SUMMIT, label: '🏔️ Na szczycie', desc: 'Blisko szczytu' },
  ];

  const popup = document.createElement('div');
  popup.id = 'ctx-switcher';
  popup.style.cssText = 'position:fixed;top:56px;left:8px;right:8px;max-width:280px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:8px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5)';

  popup.innerHTML = '<div style="font-size:11px;color:var(--text2);padding:4px 8px;margin-bottom:4px">Testowanie trybu kontekstu</div>' +
    options.map(o => {
      const active = o.val === current;
      return `<div onclick="setContextOverride('${o.val}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;background:${active ? 'var(--accent)' : 'transparent'};color:${active ? '#000' : 'var(--text)'};transition:background 0.15s">
        <span style="font-size:18px">${o.label.split(' ')[0]}</span>
        <div><div style="font-size:13px;font-weight:600">${o.label.split(' ').slice(1).join(' ')}</div><div style="font-size:10px;opacity:0.7">${o.desc}</div></div>
      </div>`;
    }).join('');

  document.body.appendChild(popup);

  const close = e => {
    if (!popup.contains(e.target) && e.target.id !== 'ctx-badge' && !e.target.closest('#ctx-badge')) {
      popup.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 10);
}

function setContextOverride(val) {
  state._contextOverride = val || null;
  if (val) {
    state.context = val;
    state._contextPeak = null;
    if (val !== CTX.HOME) {
      let minD = Infinity, best = null;
      for (const p of PEAKS) {
        const d = dist(state.userLat || 0, state.userLon || 0, p.lat, p.lon);
        if (d < minD) { minD = d; best = p; }
      }
      state._contextPeak = best;
    }
  } else {
    updateContext();
  }
  updateContextBadge();
  const popup = document.getElementById('ctx-switcher');
  if (popup) popup.remove();
  const modeLabel = val ? CTX_META[val].icon + ' ' + CTX_META[val].label : '🔄 Auto';
  showToast(`Tryb: ${modeLabel}${val ? ' (test)' : ''}`);
}

// ============================================================
// SCREEN WAKE LOCK
// ============================================================
let _wakeLock = null;

async function updateWakeLock(ctx) {
  const needsLock = ctx === CTX.TRAIL || ctx === CTX.SUMMIT;
  if (needsLock && !_wakeLock) {
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    } catch(e) {}
  } else if (!needsLock && _wakeLock) {
    _wakeLock.release();
    _wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wakeLock === null) {
    const ctx = state.context || CTX.HOME;
    if (ctx === CTX.TRAIL || ctx === CTX.SUMMIT) updateWakeLock(ctx);
  }
});
