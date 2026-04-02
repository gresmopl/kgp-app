// ============================================================
// STATE & PERSISTENCE
// ============================================================
const state = {
  conquered: JSON.parse(localStorage.getItem('kgp_conquered') || '[]'),
  journal: JSON.parse(localStorage.getItem('kgp_journal') || '[]'),
  userLat: null, userLon: null,
  gpsActive: false,
  selectedPeak: null,
  filter: 'all',
  transport: 'car',
  currentPage: 'map',
  paceMultiplier: parseFloat(localStorage.getItem('kgp_pace') || '1.0'),
  homeAddr: localStorage.getItem('kgp_home') || '',
  nearbyPeak: null,
  selectedRoutes: JSON.parse(localStorage.getItem('kgp_routes') || '{}'),
  userName: localStorage.getItem('kgp_username') || '',
  iceContact: localStorage.getItem('kgp_ice') || '',
};

function getRoute(peak) {
  const idx = state.selectedRoutes[peak.id] || 0;
  if (peak.routes) return peak.routes[idx] || peak.routes[0];
  return { name:'Domyślna', parking: peak.parking[0], station: peak.station, trail: peak.trail };
}

function getParkingList(peak) {
  if (peak.routes) return [getRoute(peak).parking];
  return peak.parking;
}

let _skipSync = false;
function save() {
  try {
    localStorage.setItem('kgp_conquered', JSON.stringify(state.conquered));
    localStorage.setItem('kgp_journal', JSON.stringify(state.journal));
    localStorage.setItem('kgp_pace', state.paceMultiplier);
    localStorage.setItem('kgp_home', state.homeAddr);
    localStorage.setItem('kgp_routes', JSON.stringify(state.selectedRoutes));
    localStorage.setItem('kgp_username', state.userName);
    localStorage.setItem('kgp_ice', state.iceContact);
  } catch(e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      showToast('⚠️ Brak miejsca! Zapisz zdjęcia i wyczyść stare wpisy.');
    }
  }
  if (!_skipSync) syncToCloud();
}

function isDone(id) { return state.conquered.includes(id); }
function getDone() { return PEAKS.filter(p => isDone(p.id)); }
function getTodo() { return PEAKS.filter(p => !isDone(p.id)); }
