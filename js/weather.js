// ============================================================
// WEATHER SCORING
// ============================================================
function scoreWeather(code, wind, precip, terrain) {
  if (precip > 8) return 'bad';
  if (terrain === 'alpine' && wind > 40) return 'bad';
  if (terrain === 'alpine' && wind > 25) return 'risky';
  if (terrain === 'exposed' && wind > 50) return 'bad';
  if (precip > 3) return 'risky';
  if ([95,96,99,80,81,82].includes(code)) return 'bad';
  if ([61,63,65,71,73,75,51,53,55].includes(code)) return 'risky';
  return 'good';
}

const weatherIcon = c => {
  if ([0].includes(c)) return '☀️';
  if ([1,2].includes(c)) return '🌤️';
  if ([3].includes(c)) return '☁️';
  if ([45,48].includes(c)) return '🌫️';
  if ([51,53,55,61,63,65].includes(c)) return '🌧️';
  if ([71,73,75,77].includes(c)) return '❄️';
  if ([80,81,82].includes(c)) return '🌦️';
  if ([95,96,99].includes(c)) return '⛈️';
  return '🌡️';
};

const days = ['Nd','Pn','Wt','Śr','Cz','Pt','So'];

async function fetchWeather(peak) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${peak.lat}&longitude=${peak.lon}&daily=weather_code,wind_speed_10m_max,precipitation_sum&timezone=Europe%2FWarsaw&forecast_days=7`;
    const r = await fetch(url, {mode:'cors'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const daily = d.daily;
    if (daily.weather_code && !daily.weathercode) daily.weathercode = daily.weather_code;
    if (daily.wind_speed_10m_max && !daily.windspeed_10m_max) daily.windspeed_10m_max = daily.wind_speed_10m_max;
    return daily;
  } catch(e) {
    const today = new Date();
    return {
      time: Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()+i);return d.toISOString().split('T')[0]}),
      weathercode: [1,2,3,61,80,1,2],
      windspeed_10m_max: [15,20,35,25,18,12,22],
      precipitation_sum: [0,0.5,8,3,2,0,0.2],
      _offline: true
    };
  }
}

async function loadWeather(peak) {
  const el = document.getElementById('weather-content');
  if (!el) return;
  el.innerHTML = '<div style="color:var(--text2);font-size:12px;text-align:center;padding:16px">⏳ Pobieranie prognozy...</div>';
  const data = await fetchWeather(peak);
  if (!data) { el.innerHTML = '<div style="color:var(--text2);font-size:12px">Brak połączenia</div>'; return; }

  const isOffline = data._offline;
  const html = `
  ${isOffline ? '<div style="background:var(--card2);border:1px solid var(--red)44;border-radius:8px;padding:8px;font-size:11px;color:var(--red);margin-bottom:8px">⚠️ Brak internetu - przykładowe dane pogodowe</div>' : ''}
  <div class="weather-grid">
    ${data.time.map((date, i) => {
      const d = new Date(date + 'T12:00:00');
      const score = scoreWeather(data.weathercode[i], data.windspeed_10m_max[i], data.precipitation_sum[i], peak.terrain);
      const scoreLabel = score==='good'?'DOBRY':score==='risky'?'RYZYKO':'ZŁY';
      return `<div class="weather-day ${score}">
        <div class="weather-date">${days[d.getDay()]}</div>
        <div class="weather-icon">${weatherIcon(data.weathercode[i])}</div>
        <div style="font-size:9px;color:var(--text2)">${Math.round(data.windspeed_10m_max[i])}km/h</div>
        <div class="weather-score ${score}">${scoreLabel}</div>
      </div>`;
    }).join('')}
  </div>
  <div style="margin-top:8px;font-size:10px;color:var(--text2)">Scoring dla terenu: <b style="color:var(--text)">${peak.terrain}</b>${isOffline ? '' : ' · Open-Meteo API'}</div>`;
  el.innerHTML = html;
}
