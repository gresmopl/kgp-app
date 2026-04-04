// ============================================================
// SUPABASE SYNC
// ============================================================
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function generateSyncCode() {
  const name = PEAK_NAMES_FOR_CODE[Math.floor(Math.random() * PEAK_NAMES_FOR_CODE.length)];
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return name + num;
}

function getSyncCode() { return localStorage.getItem('kgp_sync_code'); }
function getProfileId() { return localStorage.getItem('kgp_profile_id'); }

async function initSync() {
  if (getProfileId()) {
    syncToCloud();
    initAI();
    return;
  }
  let attempts = 0;
  while (attempts < 10) {
    const code = generateSyncCode();
    const { data, error } = await sb.from('profiles').insert({
      sync_code: code,
      device_info: navigator.userAgent.substring(0, 200)
    }).select().single();
    if (!error && data) {
      localStorage.setItem('kgp_sync_code', code);
      localStorage.setItem('kgp_profile_id', data.id);
      await sb.from('user_data').insert({ user_id: data.id, data: getStateForSync() });
      showToast(`🔗 Twój kod dostępu: ${code}`);
      initAI();
      return;
    }
    if (error && error.code === '23505') { attempts++; continue; }
    console.error('Sync init error:', error);
    return;
  }
}

function getStateForSync() {
  return {
    conquered: state.conquered,
    journal: state.journal.map(j => ({ ...j, photo: undefined })),
    paceMultiplier: state.paceMultiplier,
    homeAddr: state.homeAddr,
    selectedRoutes: state.selectedRoutes,
    userName: state.userName,
    trips: state.trips,
    discoveredPlaces: state.discoveredPlaces,
    transport: state.transport,
    peakOverrides: JSON.parse(localStorage.getItem('kgp_peaks_overrides') || '{}'),
    _stateVersion: STATE_VERSION
  };
}

async function syncToCloud() {
  const profileId = getProfileId();
  if (!profileId || !navigator.onLine) {
    queueSync();
    return;
  }
  try {
    const { error } = await sb.from('user_data')
      .upsert({ user_id: profileId, data: getStateForSync() }, { onConflict: 'user_id' });
    if (error) throw error;
    localStorage.removeItem('kgp_sync_pending');
  } catch(e) {
    console.error('Sync error:', e);
    queueSync();
  }
}

function queueSync() {
  localStorage.setItem('kgp_sync_pending', 'true');
}

async function pullFromCloud() {
  const profileId = getProfileId();
  if (!profileId || !navigator.onLine) return false;
  try {
    const { data, error } = await sb.from('user_data')
      .select('data').eq('user_id', profileId).single();
    if (error || !data) return false;
    const d = data.data;
    state.conquered = d.conquered || [];
    state.journal = d.journal || [];
    state.paceMultiplier = d.paceMultiplier || 1.0;
    state.homeAddr = d.homeAddr || '';
    state.selectedRoutes = d.selectedRoutes || {};
    state.userName = d.userName || '';
    state.trips = d.trips || [];
    state.discoveredPlaces = d.discoveredPlaces || [];
    state.transport = d.transport || 'car';
    if (d.peakOverrides) localStorage.setItem('kgp_peaks_overrides', JSON.stringify(d.peakOverrides));
    _skipSync = true;
    save();
    _skipSync = false;
    return true;
  } catch(e) {
    console.error('Pull error:', e);
    return false;
  }
}

async function loginWithCode(code) {
  code = code.toLowerCase().trim();
  const { data, error } = await sb.from('profiles')
    .select('id, sync_code').eq('sync_code', code).single();
  if (error || !data) {
    showToast('❌ Nieprawidłowy kod dostępu');
    return false;
  }
  localStorage.setItem('kgp_sync_code', data.sync_code);
  localStorage.setItem('kgp_profile_id', data.id);
  const pulled = await pullFromCloud();
  if (pulled) {
    showToast(`✅ Zalogowano! Pobrano dane.`);
    initAI();
    goto(state.currentPage);
  }
  return true;
}

async function uploadPhoto(peakId, photoBase64, photoType = 'summit') {
  const profileId = getProfileId();
  if (!profileId || !navigator.onLine) {
    queuePhotoUpload(peakId, photoType);
    return null;
  }
  try {
    const blob = await fetch(photoBase64).then(r => r.blob());
    const path = `${profileId}/${peakId}_${photoType}_${Date.now()}.jpg`;
    const { error: uploadError } = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;
    const { data: urlData } = sb.storage.from('photos').getPublicUrl(path);
    let gpsLat = null, gpsLon = null;
    if (state.userLat) { gpsLat = state.userLat; gpsLon = state.userLon; }
    await sb.from('photos').insert({
      user_id: profileId, peak_id: peakId, storage_path: path,
      photo_type: photoType, gps_lat: gpsLat, gps_lon: gpsLon
    });
    return urlData.publicUrl;
  } catch(e) {
    console.error('Photo upload error:', e);
    queuePhotoUpload(peakId, photoType);
    return null;
  }
}

function queuePhotoUpload(peakId, photoType) {
  const queue = JSON.parse(localStorage.getItem('kgp_photo_queue') || '[]');
  queue.push({ peakId, photoType, timestamp: Date.now() });
  localStorage.setItem('kgp_photo_queue', JSON.stringify(queue));
}

async function processPhotoQueue() {
  if (!navigator.onLine || !getProfileId()) return;
  const queue = JSON.parse(localStorage.getItem('kgp_photo_queue') || '[]');
  if (queue.length === 0) return;
  const remaining = [];
  for (const item of queue) {
    const entry = state.journal.find(j => j.peakId === item.peakId);
    if (entry && entry.photo) {
      const url = await uploadPhoto(item.peakId, entry.photo, item.photoType);
      if (!url) remaining.push(item);
    }
  }
  localStorage.setItem('kgp_photo_queue', JSON.stringify(remaining));
}

window.addEventListener('online', () => {
  if (localStorage.getItem('kgp_sync_pending')) syncToCloud();
  processPhotoQueue();
});
