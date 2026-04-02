// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

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

function distFromUser(peak) {
  if (!state.userLat) return null;
  return dist(state.userLat, state.userLon, peak.lat, peak.lon);
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
