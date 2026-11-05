// Namaz vakti hesabı — Türkiye (Diyanet) yöntemi:
// imsak 18°, yatsı 17°, ikindi Şafii gölge, temkinler: güneş -7, öğle +5, ikindi +4, akşam +7 dk.
const DTR = Math.PI / 180;
const sin = (d) => Math.sin(d * DTR);
const cos = (d) => Math.cos(d * DTR);
const tan = (d) => Math.tan(d * DTR);
const asin = (x) => Math.asin(x) / DTR;
const acos = (x) => Math.acos(Math.max(-1, Math.min(1, x))) / DTR;
const atan2 = (y, x) => Math.atan2(y, x) / DTR;
const acot = (x) => Math.atan(1 / x) / DTR;
const fix = (a, b) => {
  a = a - b * Math.floor(a / b);
  return a < 0 ? a + b : a;
};

export const TZ = 3; // Türkiye saati (UTC+3, yaz saati yok)
export const KEYS = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
export const NAMES = {
  imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı',
};

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPos(jd) {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
}

/** Gün için vakitleri Türkiye saatine göre gece yarısından itibaren DAKİKA olarak döndürür. */
export function prayerTimes({ y, m, d }, lat, lng) {
  const jd = julian(y, m, d) - lng / (15 * 24);
  const midDay = (t) => fix(12 - sunPos(jd + t).eqt, 24);
  const angleTime = (ang, t, ccw) => {
    const dec = sunPos(jd + t).decl;
    const noon = midDay(t);
    const T = acos((-sin(ang) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat))) / 15;
    return noon + (ccw ? -T : T);
  };
  const asrT = (t) => {
    const dec = sunPos(jd + t).decl;
    return angleTime(-acot(1 + tan(Math.abs(lat - dec))), t);
  };
  const r = {
    imsak: angleTime(18, 5 / 24, true),
    gunes: angleTime(0.833, 6 / 24, true),
    ogle: midDay(12 / 24),
    ikindi: asrT(13 / 24),
    aksam: angleTime(0.833, 18 / 24),
    yatsi: angleTime(17, 18 / 24),
  };
  const adj = { imsak: 0, gunes: -7, ogle: 5, ikindi: 4, aksam: 7, yatsi: 0 };
  const out = {};
  for (const k of KEYS) out[k] = Math.round((r[k] + TZ - lng / 15) * 60 + adj[k]);
  return out;
}

export const hm = (min) => {
  min = ((min % 1440) + 1440) % 1440;
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
};

/** Şu anki Türkiye tarihi ve gün içindeki saniye. */
export function trNow() {
  const n = new Date(Date.now() + TZ * 3600e3);
  return {
    y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate(),
    sec: n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds(),
    date: n,
  };
}

export function addDays({ y, m, d }, k) {
  const t = new Date(Date.UTC(y, m - 1, d + k));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), date: t };
}

/** Türkiye saatiyle verilen gün + dakikayı gerçek Date nesnesine çevirir. */
export function toDate({ y, m, d }, minutes) {
  return new Date(Date.UTC(y, m - 1, d) + (minutes - TZ * 60) * 60000);
}

/** Sonraki vakit ve şu anki vakit. */
export function nextPrayer(loc) {
  const n = trNow();
  const t = prayerTimes(n, loc.lat, loc.lng);
  const nowMin = n.sec / 60;
  let key = KEYS.find((k) => t[k] > nowMin);
  let at;
  if (key) at = t[key];
  else {
    const t2 = prayerTimes(addDays(n, 1), loc.lat, loc.lng);
    key = 'imsak';
    at = t2.imsak + 1440;
  }
  const current = [...KEYS].reverse().find((k) => t[k] <= nowMin) || 'yatsi';
  return { key, at, current, today: t, secondsLeft: Math.max(0, Math.round(at * 60 - n.sec)) };
}

/** Kuzeyden saat yönünde kıble açısı (derece). */
export function qibla(lat, lng) {
  const kLat = 21.4225, kLng = 39.8262;
  const dL = kLng - lng;
  return fix(atan2(sin(dL), cos(lat) * tan(kLat) - sin(lat) * cos(dL)), 360);
}

export const CITIES = [
  ['Adana', 37.0, 35.3213], ['Ağrı', 39.7191, 43.0503], ['Ankara', 39.9334, 32.8597],
  ['Antalya', 36.8969, 30.7133], ['Bursa', 40.1885, 29.061], ['Diyarbakır', 37.9144, 40.2306],
  ['Erzurum', 39.9043, 41.2679], ['Eskişehir', 39.7767, 30.5206], ['Gaziantep', 37.0662, 37.3833],
  ['Hatay', 36.2021, 36.1603], ['İstanbul', 41.0082, 28.9784], ['İzmir', 38.4237, 27.1428],
  ['Kayseri', 38.7205, 35.4826], ['Kocaeli', 40.7654, 29.9408], ['Konya', 37.8746, 32.4932],
  ['Malatya', 38.3552, 38.3095], ['Mersin', 36.8121, 34.6415], ['Samsun', 41.2867, 36.33],
  ['Sakarya', 40.7569, 30.3783], ['Şanlıurfa', 37.1591, 38.7969], ['Trabzon', 41.0027, 39.7168],
  ['Van', 38.5012, 43.3729],
].map(([name, lat, lng]) => ({ name, lat, lng }));
