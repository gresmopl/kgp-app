// ============================================================
// AI MODULE - Gemini API wrapper z autoryzacją i trackingiem
// ============================================================

let _aiKey = ''; // klucz Gemini pobierany z Supabase (nie w kodzie!)

// Pobierz klucz AI z Supabase (wywoływane przy logowaniu/init)
let _aiReady = false;

async function initAI() {
  if (!getProfileId()) { _aiKey = ''; _aiReady = false; return; }
  try {
    const { data, error } = await sb.from('app_config')
      .select('value').eq('key', 'gemini_api_key').single();
    if (!error && data) {
      _aiKey = data.value;
      _aiReady = true;
      updateAIBadge();
    }
  } catch(e) {
    console.error('initAI: nie udało się pobrać klucza AI', e);
  }
}

function isAIAvailable() {
  return !!getProfileId() && !!_aiKey;
}

// Centralna funkcja do wywołań Gemini API
// prompt: string, options: { maxTokens, temperature, model }
// Zwraca: { text, usage } lub null przy błędzie
async function callGeminiAI(prompt, options = {}) {
  if (!getProfileId()) {
    showToast('🔒 Zaloguj się kodem dostępu aby korzystać z AI');
    return null;
  }
  if (!_aiKey) {
    showToast('⚠️ AI niedostępne - brak klucza systemowego');
    return null;
  }

  const model = options.model || 'gemini-2.5-flash-lite';
  const maxTokens = options.maxTokens || 1024;
  const temperature = options.temperature || 0.3;
  const maxRetries = options.retries || 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + _aiKey;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      });

      if (res.status === 429) {
        console.warn('Gemini 429 rate limit, attempt ' + (attempt + 1));
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, (attempt + 1) * 10000)); continue; }
        showToast('⚠️ AI przeciążone - spróbuj za chwilę');
        return null;
      }

      if (!res.ok) {
        console.error('Gemini error:', res.status, await res.text());
        showToast('⚠️ Błąd AI: ' + res.status);
        return null;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const usage = data.usageMetadata || {};

      // Zapisz usage do Supabase
      trackAIUsage(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0, model);

      return { text, usage };
    } catch(e) {
      console.error('Gemini fetch error:', e);
      if (attempt < maxRetries) continue;
      showToast('⚠️ Błąd połączenia z AI');
      return null;
    }
  }
  return null;
}

// Tracking zużycia AI w Supabase
async function trackAIUsage(inputTokens, outputTokens, model) {
  const profileId = getProfileId();
  if (!profileId) return;

  const month = new Date().toISOString().slice(0, 7); // "2026-04"

  try {
    // Najpierw próbuj zaktualizować istniejący rekord
    const { data: existing } = await sb.from('ai_usage')
      .select('id, input_tokens, output_tokens, requests')
      .eq('user_id', profileId).eq('month', month).single();

    if (existing) {
      await sb.from('ai_usage').update({
        input_tokens: existing.input_tokens + inputTokens,
        output_tokens: existing.output_tokens + outputTokens,
        requests: existing.requests + 1,
        model: model
      }).eq('id', existing.id);
    } else {
      await sb.from('ai_usage').insert({
        user_id: profileId,
        month: month,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        requests: 1,
        model: model
      });
    }
  } catch(e) {
    console.error('trackAIUsage error:', e);
  }
}

// Pobierz statystyki użycia AI (bieżący miesiąc)
async function getAIUsageStats() {
  const profileId = getProfileId();
  if (!profileId) return null;

  const month = new Date().toISOString().slice(0, 7);
  try {
    const { data } = await sb.from('ai_usage')
      .select('input_tokens, output_tokens, requests')
      .eq('user_id', profileId).eq('month', month).single();
    if (!data) return { input: 0, output: 0, requests: 0, cost: 0 };

    // Gemini 2.5 Flash-Lite: $0.10/1M input, $0.40/1M output
    const cost = (data.input_tokens * 0.10 + data.output_tokens * 0.40) / 1_000_000;
    return {
      input: data.input_tokens,
      output: data.output_tokens,
      requests: data.requests,
      cost: cost
    };
  } catch(e) {
    return { input: 0, output: 0, requests: 0, cost: 0 };
  }
}

// Aktualizuj badge AI i statystyki w ustawieniach (jeśli widoczne)
function updateAIBadge() {
  const badge = document.getElementById('ai-badge');
  if (badge) {
    badge.textContent = (isAIAvailable() ? '✅ Aktywny' : '⚠️ Niedostępny') + ' ▼';
  }
  const statsEl = document.getElementById('ai-usage-stats');
  if (statsEl && getProfileId()) {
    getAIUsageStats().then(s => {
      if (!s) return;
      statsEl.innerHTML = '<div style="background:var(--card2);border-radius:8px;padding:8px;margin-top:4px">'
        + '<div style="font-weight:600;margin-bottom:4px">Zużycie AI - ' + new Date().toISOString().slice(0, 7) + '</div>'
        + '<div>Zapytania: <b>' + s.requests + '</b></div>'
        + '<div>Tokeny: <b>' + (s.input + s.output).toLocaleString() + '</b> (in: ' + s.input.toLocaleString() + ' / out: ' + s.output.toLocaleString() + ')</div>'
        + '<div>Szacowany koszt: <b>$' + s.cost.toFixed(4) + '</b></div>'
        + '</div>';
    });
  }
}

// Pobierz globalne statystyki (dla admina)
async function getAIUsageGlobal() {
  const month = new Date().toISOString().slice(0, 7);
  try {
    const { data } = await sb.from('ai_usage')
      .select('input_tokens, output_tokens, requests')
      .eq('month', month);
    if (!data || data.length === 0) return { input: 0, output: 0, requests: 0, cost: 0, users: 0 };

    const totals = data.reduce((acc, r) => ({
      input: acc.input + r.input_tokens,
      output: acc.output + r.output_tokens,
      requests: acc.requests + r.requests
    }), { input: 0, output: 0, requests: 0 });

    totals.cost = (totals.input * 0.10 + totals.output * 0.40) / 1_000_000;
    totals.users = data.length;
    return totals;
  } catch(e) {
    return { input: 0, output: 0, requests: 0, cost: 0, users: 0 };
  }
}

// ============================================================
// AI CHAT - pływający czat na mapie
// ============================================================
let _aiChatHistory = [];

function _buildAIContext() {
  const done = getDone();
  const todo = getTodo();
  const userName = state.userName || 'turysta';
  let ctx = `Jesteś przyjaznym asystentem turystyki górskiej KGP (Korona Gór Polski - 28 najwyższych szczytów polskich pasm).
Użytkownik: ${userName}, zdobyte: ${done.length}/28 (${done.map(p => p.name).join(', ') || 'brak'}).
Pozostałe: ${todo.map(p => p.name + ' ' + p.height + 'm ' + p.range).join(', ')}.`;
  if (state._homeGeo) ctx += `\nAdres domowy: ${state.homeAddr} (${state._homeGeo.lat},${state._homeGeo.lon}).`;
  if (state.userLat) ctx += `\nAktualna lokalizacja GPS: ${state.userLat.toFixed(4)},${state.userLon.toFixed(4)}.`;
  ctx += `\nTransport: ${state.transport === 'car' ? 'samochód' : 'komunikacja publiczna'}.`;
  ctx += `\nData: ${new Date().toLocaleDateString('pl-PL')}, miesiąc: ${new Date().getMonth() + 1}.`;
  ctx += `\n\nZasady: odpowiadaj krótko (max 3-4 zdania), po polsku, praktycznie. Używaj krótkich myślników. Jeśli proponujesz szczyt - podaj dlaczego (sezon, trudność, odległość). Nie wymyślaj informacji których nie znasz.`;
  return ctx;
}

function openAIChat() {
  if (!isAIAvailable()) {
    if (!getProfileId()) showToast('🔒 Zaloguj się aby korzystać z AI');
    else showToast('⚠️ AI niedostępne');
    return;
  }

  const existing = document.getElementById('ai-chat-overlay');
  if (existing) { existing.remove(); return; }

  _aiChatHistory = [];

  const overlay = document.createElement('div');
  overlay.id = 'ai-chat-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:#000a;z-index:10000;display:flex;align-items:flex-end';
  overlay.onclick = ev => { if (ev.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div style="background:var(--bg2);border-radius:20px 20px 0 0;width:100%;max-height:70dvh;display:flex;flex-direction:column;border-top:1px solid var(--border)">
      <div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:12px auto 0"></div>
      <div style="padding:12px 16px 8px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:var(--font-display);font-size:16px;color:var(--accent)">🤖 Asystent KGP</div>
        <button onclick="document.getElementById('ai-chat-overlay').remove()" style="background:none;border:none;color:var(--text2);font-size:18px;cursor:pointer">✕</button>
      </div>
      <div id="ai-chat-msgs" style="flex:1;overflow-y:auto;padding:8px 16px;min-height:120px;max-height:50dvh">
        <div style="background:var(--card2);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;color:var(--text);line-height:1.5;max-width:85%">
          Cześć${state.userName ? ' ' + esc(state.userName) : ''}! Jestem Twoim asystentem KGP. Zapytaj mnie o:
          <div style="font-size:11px;color:var(--text2);margin-top:6px">
          - Jaki szczyt na weekend?<br>
          - Jak dojechać na Babią Górę?<br>
          - Co zabrać na Rysy?<br>
          - Który szczyt najłatwiejszy?
          </div>
        </div>
      </div>
      <div style="padding:8px 16px calc(12px + var(--safe-bottom,0px));display:flex;gap:8px">
        <input id="ai-chat-input" type="text" placeholder="Zapytaj o szczyty, szlaki, pogodę..." style="flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:20px;background:var(--card);color:var(--text);font-size:13px;outline:none" onkeydown="if(event.key==='Enter')sendAIChatMsg()">
        <button onclick="sendAIChatMsg()" style="width:40px;height:40px;border-radius:50%;background:var(--accent);border:none;color:#000;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">➤</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('ai-chat-input').focus();
}

async function sendAIChatMsg() {
  const input = document.getElementById('ai-chat-input');
  const msgs = document.getElementById('ai-chat-msgs');
  if (!input || !msgs) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  // Wiadomość użytkownika
  msgs.innerHTML += '<div style="background:var(--accent);color:#000;border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;line-height:1.5;max-width:85%;margin-left:auto">' + esc(text) + '</div>';

  // Typing indicator
  msgs.innerHTML += '<div id="ai-typing" style="background:var(--card2);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;color:var(--text2);max-width:85%">⏳ Myślę...</div>';
  msgs.scrollTop = msgs.scrollHeight;

  // Buduj prompt z historią
  _aiChatHistory.push({ role: 'user', text: text });
  const historyText = _aiChatHistory.map(m => (m.role === 'user' ? 'Użytkownik: ' : 'Asystent: ') + m.text).join('\n');
  const prompt = _buildAIContext() + '\n\nHistoria rozmowy:\n' + historyText + '\n\nOdpowiedz na ostatnie pytanie użytkownika. Krótko, konkretnie, po polsku.';

  const result = await callGeminiAI(prompt, { maxTokens: 512, temperature: 0.5 });

  // Usuń typing
  const typing = document.getElementById('ai-typing');
  if (typing) typing.remove();

  if (result && result.text) {
    _aiChatHistory.push({ role: 'assistant', text: result.text });
    msgs.innerHTML += '<div style="background:var(--card2);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:13px;color:var(--text);line-height:1.5;max-width:85%">' + esc(result.text).replace(/\n/g, '<br>') + '</div>';
  } else {
    msgs.innerHTML += '<div style="background:var(--card2);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-size:12px;color:var(--red,#e04040);max-width:85%">Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.</div>';
  }
  msgs.scrollTop = msgs.scrollHeight;

  // Ogranicz historię do ostatnich 6 wiadomości (oszczędność tokenów)
  if (_aiChatHistory.length > 6) _aiChatHistory = _aiChatHistory.slice(-6);
}

// ============================================================
// AI PEAK INFO - "Opowiedz więcej" o szczycie
// ============================================================
async function aiPeakInfo(peakId) {
  if (!isAIAvailable()) {
    if (!getProfileId()) showToast('🔒 Zaloguj się aby korzystać z AI');
    else showToast('⚠️ AI niedostępne');
    return;
  }

  const p = PEAKS.find(pk => pk.id === peakId);
  if (!p) return;

  const done = isDone(p.id);
  const entry = state.journal.find(j => j.peakId === p.id);
  const route = getRoute(p);
  const parking = route.parking;
  const trail = route.trail || p.trail;

  let peakContext = `Szczyt: ${p.name}, ${p.height}m, pasmo: ${p.range}, trudność: ${p.difficulty}/5, teren: ${p.terrain}.`;
  if (p.season) peakContext += ` Sezon: miesiące ${p.season.join(',')}.`;
  if (parking) peakContext += ` Parking: ${parking.name}${parking.note ? ' (' + parking.note + ')' : ''}.`;
  if (trail) peakContext += ` Szlak: ${trail.dist}km, przewyższenie ${trail.ascent}m.`;
  if (p.stamps) peakContext += ` Pieczątki: ${p.stamps.map(s => s.name).join(', ')}.`;
  if (p.photo) peakContext += ` Zdjęcie: ${p.photo}.`;
  if (done && entry) peakContext += ` Użytkownik zdobył ten szczyt ${entry.date}${entry.note ? ', notatka: ' + entry.note : ''}.`;
  else peakContext += ` Użytkownik jeszcze nie zdobył tego szczytu.`;

  const prompt = `Jesteś ekspertem turystyki górskiej w Polsce z pasją i doświadczeniem.

${peakContext}

Napisz krótki, ciekawy opis tego szczytu dla turysty. Zawrzyj:
1. Jedną ciekawostkę historyczną lub przyrodniczą
2. Najlepszą porę na wejście i dlaczego
3. Na co uważać / co zabrać
4. Jedną praktyczną radę od doświadczonego turysty
${done ? '5. Pogratuluj zdobycia i zasugeruj co ciekawego w okolicy' : '5. Zachęć do wejścia - co sprawia że ten szczyt warto zdobyć'}

Pisz po polsku, krótko (max 6 zdań), z entuzjazmem ale bez przesady. Krótkie myślniki.`;

  // Pokaż modal z ładowaniem
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = ev => { if (ev.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:360px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:24px">🤖</span>
        <div>
          <div style="font-family:var(--font-display);font-size:16px;color:var(--accent)">${esc(p.name)}</div>
          <div style="font-size:11px;color:var(--text2)">${esc(p.range)} · ${p.height} m</div>
        </div>
      </div>
      <div id="ai-peak-content" style="font-size:13px;color:var(--text);line-height:1.6;min-height:60px">
        ⏳ AI generuje opis...
      </div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary" style="width:100%;margin-top:12px;font-size:12px">Zamknij</button>
    </div>`;
  document.body.appendChild(overlay);

  const result = await callGeminiAI(prompt, { maxTokens: 512, temperature: 0.6 });
  const contentEl = document.getElementById('ai-peak-content');
  if (!contentEl) return;

  if (result && result.text) {
    contentEl.innerHTML = esc(result.text).replace(/\n/g, '<br>');
  } else {
    contentEl.innerHTML = '<span style="color:var(--red,#e04040)">Nie udało się pobrać opisu. Spróbuj ponownie.</span>';
  }
}

// Auto-init AI przy starcie (jeśli użytkownik zalogowany)
initAI();
