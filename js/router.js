// ============================================================
// ROUTER
// ============================================================
const navMap = {map:'nav-map',list:'nav-list',plan:'nav-plan',summit:'nav-summit',journal:'nav-journal',settings:'nav-settings'};

async function goto(page, skipHistory) {
  if (!skipHistory && state.currentPage !== page) {
    history.pushState({page}, '', '#' + page);
  }
  state.currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navId = navMap[page] || navMap[page.replace('_suggest','')];
  if (navId) document.getElementById(navId)?.classList.add('active');

  const screen = document.getElementById('screen');
  let html = '';

  switch(page) {
    case 'map':    html = renderMap(); break;
    case 'list':   html = renderList(); break;
    case 'plan':   html = await renderPlan(); break;
    case 'summit': html = renderSummit(); break;
    case 'journal':html = renderJournal(); break;
    case 'settings': html = renderSettings(); break;
    case 'next_suggest': html = renderNextSuggestPage(); break;
  }

  screen.innerHTML = html;
  screen.scrollTop = 0;

  if (page === 'map') {
    setTimeout(() => { initMap(); setTimeout(applyRouteToMap, 100); }, 50);
  }
  if (page === 'plan') {
    const peak = state.selectedPeak || getTodo()[0] || PEAKS[0];
    loadWeather(peak);
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

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  history.replaceState({page:'map'}, '', '#map');
  startGPS();
  goto('map', true);
  if (navigator.onLine && getProfileId()) {
    if (localStorage.getItem('kgp_sync_pending')) syncToCloud();
    processPhotoQueue();
  }
});
