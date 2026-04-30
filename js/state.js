// ============================================================
// STATE & PERSISTENCE
// ============================================================

// Wersja schematu danych - inkrementuj przy kazdej zmianie struktury state
const STATE_VERSION = 2;

const state = {
  conquered: JSON.parse(localStorage.getItem('kgp_conquered') || '[]'),
  journal: JSON.parse(localStorage.getItem('kgp_journal') || '[]'),
  userLat: null, userLon: null,
  gpsActive: false,
  selectedPeak: null,
  filter: localStorage.getItem('kgp_filter') || 'all',
  transport: localStorage.getItem('kgp_transport') || 'car',
  currentPage: localStorage.getItem('kgp_last_page') || 'map',
  paceMultiplier: parseFloat(localStorage.getItem('kgp_pace') || '1.0'),
  homeAddr: localStorage.getItem('kgp_home') || '',
  _homeGeo: JSON.parse(localStorage.getItem('kgp_home_geo') || 'null'),
  nearbyPeak: null,
  selectedRoutes: JSON.parse(localStorage.getItem('kgp_routes') || '{}'),
  userName: localStorage.getItem('kgp_username') || '',
  savedRoutes: JSON.parse(localStorage.getItem('kgp_saved_routes') || '{}'),
  trips: JSON.parse(localStorage.getItem('kgp_trips') || '[]'),
  discoveredPlaces: JSON.parse(localStorage.getItem('kgp_discovered') || '[]'),
  context: 'home',
  _contextPeak: null,
};

// ============================================================
// MIGRACJA DANYCH
// ============================================================
// Kazda migracja to funkcja ktora aktualizuje dane z wersji N do N+1.
// Dodaj nowa migracje na koniec tablicy gdy zmieniasz strukture state.
const MIGRATIONS = [
  // v0 → v1: poczatkowa wersja, brak zmian
  function() {},
  // v1 → v2: dodanie trips, discoveredPlaces, persystowanie transport
  function() {
    if (!localStorage.getItem('kgp_trips')) localStorage.setItem('kgp_trips', '[]');
    if (!localStorage.getItem('kgp_discovered')) localStorage.setItem('kgp_discovered', '[]');
    if (!localStorage.getItem('kgp_transport')) localStorage.setItem('kgp_transport', 'car');
  },
];

function migrateState() {
  const currentVersion = parseInt(localStorage.getItem('kgp_state_version') || '0');
  if (currentVersion >= STATE_VERSION) return;

  for (let v = currentVersion; v < STATE_VERSION; v++) {
    if (MIGRATIONS[v]) {
      try {
        MIGRATIONS[v]();
        // migracja OK
      } catch(e) {
        console.error(`Migracja v${v} → v${v + 1} blad:`, e);
      }
    }
  }
  localStorage.setItem('kgp_state_version', String(STATE_VERSION));
}

migrateState();

// Nakładanie nadpisań danych szczytów z panelu admina
(function applyPeakOverrides() {
  const ov = JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}');
  Object.entries(ov).forEach(([id, changes]) => {
    const peak = getPeak(id);
    if (!peak) return;
    if (changes.trail) Object.assign(peak.trail || (peak.trail = {}), changes.trail);
    if (changes.parking) peak.parking = changes.parking;
    if (changes.routes) peak.routes = changes.routes;
    if (changes.station) peak.station = changes.station;
    if (changes.stamps) peak.stamps = changes.stamps;
    if (changes.photo !== undefined) peak.photo = changes.photo;
    if (changes.season) peak.season = changes.season;
    if (changes.difficulty !== undefined) peak.difficulty = changes.difficulty;
  });
})();

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
    localStorage.setItem('kgp_saved_routes', JSON.stringify(state.savedRoutes));
    localStorage.setItem('kgp_trips', JSON.stringify(state.trips));
    localStorage.setItem('kgp_discovered', JSON.stringify(state.discoveredPlaces));
    localStorage.setItem('kgp_transport', state.transport);
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
