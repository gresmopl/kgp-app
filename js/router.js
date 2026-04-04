// ============================================================
// ROUTER
// ============================================================
const navMap = {map:'nav-map',list:'nav-list',plan:'nav-plan',summit:'nav-summit',journal:'nav-journal',settings:'nav-settings'};

async function goto(page, skipHistory) {
  if (!skipHistory && state.currentPage !== page) {
    history.pushState({page}, '', '#' + page);
  }
  state.currentPage = page;
  // Zapamiętaj ostatnią główną zakładkę
  if (navMap[page]) localStorage.setItem('kgp_last_page', page);

  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navId = navMap[page] || navMap[page.replace('_suggest','')];
  if (navId) document.getElementById(navId)?.classList.add('active');

  const screen = document.getElementById('screen');
  let html = '';

  switch(page) {
    case 'map':    html = renderMap(); break;
    case 'list':   html = renderList(); break;
    case 'plan':   html = renderPlanner(); break;
    case 'summit': html = renderSummit(); break;
    case 'journal':html = renderJournal(); break;
    case 'settings': html = renderSettings(); break;
    case 'next_suggest': html = renderNextSuggestPage(); break;
    case 'history': html = renderHistoryEntry(); break;
  }

  // Animacja przejścia
  screen.style.opacity = '0';
  screen.innerHTML = html;
  screen.scrollTop = 0;
  requestAnimationFrame(() => { screen.style.opacity = '1'; });

  // Przycisk "do góry" na długich stronach
  updateScrollTopBtn(screen, page);

  if (page === 'settings') {
    setTimeout(updateAIBadge, 100);
  }
  if (page === 'map') {
    setTimeout(() => { initMap(); setTimeout(applyRouteToMap, 100); }, 50);
  }
  if (page === 'plan') {
    // Ładuj pogodę/słońce/ostrzeżenia jeśli edytujemy wyprawę z peakiem
    const trip = state._activeTripId ? state.trips.find(t => t.id === state._activeTripId) : null;
    let planPeak = null;
    if (trip) {
      const dayIdx = Math.min(state._activeDayIdx, (trip.days || []).length - 1);
      const day = trip.days?.[dayIdx];
      const peakStop = day?.stops?.find(s => s.type === 'summit' && s.peakId);
      if (peakStop) planPeak = PEAKS.find(p => p.id === peakStop.peakId);
    }
    if (planPeak) {
      loadWeather(planPeak);
      loadSunTimes(planPeak);
      loadWarnings(planPeak.id);
    }
  }
}

// ============================================================
// INIT
// ============================================================
window.openPeakDetail = openPeakDetail;
window.goto = goto;

window.addEventListener('popstate', e => {
  const page = e.state?.page || 'map';
  goto(page, true);
});

// Admin easter egg - 5x tap na wersję w ustawieniach
let _adminTaps = 0;
let _adminTimer = null;
function adminTap() {
  _adminTaps++;
  if (_adminTaps >= 5) {
    _adminTaps = 0;
    clearTimeout(_adminTimer);
    window.open('panel.html', '_blank');
  } else {
    clearTimeout(_adminTimer);
    _adminTimer = setTimeout(() => { _adminTaps = 0; }, 2000);
    if (_adminTaps >= 3) showToast('Jeszcze ' + (5 - _adminTaps) + '...');
  }
}

// PWA install prompt
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstallPrompt = e;
});

function installApp() {
  if (_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(result => {
      if (result.outcome === 'accepted') showToast('✅ Aplikacja zainstalowana!');
      _deferredInstallPrompt = null;
      goto('settings');
    });
  } else if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    showToast('Aplikacja jest już zainstalowana');
  } else {
    showToast('Użyj menu przeglądarki → "Dodaj do ekranu głównego"');
  }
}

// Scroll-to-top button
function updateScrollTopBtn(screen, page) {
  let btn = document.getElementById('scroll-top-btn');
  const longPages = ['plan','journal','settings','list'];
  if (!longPages.includes(page)) {
    if (btn) btn.style.display = 'none';
    return;
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'scroll-top-btn';
    btn.className = 'scroll-top-btn';
    btn.textContent = '↑';
    btn.onclick = () => screen.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('app').appendChild(btn);
  }
  btn.style.display = 'none';
  screen.onscroll = () => {
    btn.style.display = screen.scrollTop > 400 ? 'flex' : 'none';
  };
}

// Offline indicator
function initOfflineIndicator() {
  const bar = document.createElement('div');
  bar.id = 'offline-bar';
  bar.className = 'offline-bar';
  bar.textContent = '📡 Brak połączenia z internetem';
  document.body.appendChild(bar);

  function update() {
    bar.classList.toggle('visible', !navigator.onLine);
  }
  window.addEventListener('online', () => { update(); showToast('✅ Połączenie przywrócone'); });
  window.addEventListener('offline', update);
  update();
}

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  applyTheme();
  initOfflineIndicator();
  updateContextBadge();
  setInterval(updateContext, 15000);

  // Sprawdź czy to link do shared trip
  const hash = location.hash;
  if (hash.startsWith('#trip/')) {
    const shareCode = hash.slice(6);
    loadSharedTrip(shareCode);
  }

  const lastPage = state.currentPage || 'map';
  history.replaceState({page: lastPage}, '', '#' + lastPage);
  startGPS();
  restoreTracking();
  goto(lastPage, true);
  if (shouldShowOnboarding()) {
    document.body.insertAdjacentHTML('beforeend', renderOnboarding());
  }
  initSync();
  if (navigator.onLine && getProfileId()) {
    if (localStorage.getItem('kgp_sync_pending')) syncToCloud();
    processPhotoQueue();
  }
  // Geokoduj adres domowy w tle (jeśli brak cache)
  if (state.homeAddr && !state._homeGeo) {
    geocodeParking(state.homeAddr).then(coords => {
      if (coords) {
        state._homeGeo = coords;
        localStorage.setItem('kgp_home_geo', JSON.stringify(coords));
      }
    }).catch(() => {});
  }
});
