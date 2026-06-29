import { API_BASE_URL, WEATHER_API, FOOD_API } from '../config';

// ─── AI Chat ─────────────────────────────────────────────────────────────────
// messages: [{role:'user'|'assistant', content:string, images?:string[]}]

export async function sendChatMessage(messages) {
  const res = await fetch(`${API_BASE_URL}/api/nutriai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.reply || '';
}

// ─── Weather ─────────────────────────────────────────────────────────────────

const WX_MAP = {
  0:  { code: 'CLR', label: 'Clear sky' },
  1:  { code: 'CLR', label: 'Mainly clear' },
  2:  { code: 'PTY', label: 'Partly cloudy' },
  3:  { code: 'OVC', label: 'Overcast' },
  45: { code: 'FOG', label: 'Fog' },
  48: { code: 'FOG', label: 'Depositing rime fog' },
  51: { code: 'DRZ', label: 'Light drizzle' },
  53: { code: 'DRZ', label: 'Moderate drizzle' },
  55: { code: 'DRZ', label: 'Dense drizzle' },
  61: { code: 'RIN', label: 'Slight rain' },
  63: { code: 'RIN', label: 'Moderate rain' },
  65: { code: 'RIN', label: 'Heavy rain' },
  71: { code: 'SNW', label: 'Slight snow' },
  73: { code: 'SNW', label: 'Moderate snow' },
  75: { code: 'SNW', label: 'Heavy snow' },
  77: { code: 'SNW', label: 'Snow grains' },
  80: { code: 'SHW', label: 'Slight showers' },
  81: { code: 'SHW', label: 'Moderate showers' },
  82: { code: 'SHW', label: 'Violent showers' },
  85: { code: 'SNW', label: 'Snow showers' },
  86: { code: 'SNW', label: 'Heavy snow showers' },
  95: { code: 'THD', label: 'Thunderstorm' },
  96: { code: 'THD', label: 'Thunderstorm w/ hail' },
  99: { code: 'THD', label: 'Heavy thunderstorm' },
};

export function wxLookup(code) {
  return WX_MAP[code] || WX_MAP[Math.floor(code / 10) * 10] || { code: '–', label: 'Unknown' };
}

export async function fetchWeather(latitude, longitude) {
  const url = `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const cw = data.current_weather;
  const wx = wxLookup(cw.weathercode);
  return {
    code:        cw.weathercode,
    wxCode:      wx.code,
    label:       wx.label,
    temperature: Math.round(cw.temperature),
  };
}

// ─── Barcode / Open Food Facts ───────────────────────────────────────────────

export async function lookupBarcode(barcode) {
  const res = await fetch(`${FOOD_API}/${barcode}.json`);
  if (!res.ok) throw new Error('Not found');
  const data = await res.json();
  if (!data.product) throw new Error('Product not found');
  const p = data.product;
  const n = p.nutriments || {};
  return {
    name:     p.product_name || p.product_name_en || 'Unknown product',
    brand:    p.brands || '',
    serving:  p.serving_size || '100g',
    calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    protein:  Math.round(n.proteins_100g || 0),
    carbs:    Math.round(n.carbohydrates_100g || 0),
    fat:      Math.round(n.fat_100g || 0),
  };
}
