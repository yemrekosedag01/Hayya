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

// Türkiyenin 81 il merkezi, alfabetik sıralı.
export const CITIES = [
  ['Adana', 36.993, 35.3348],
  ['Adıyaman', 37.7643, 38.2769],
  ['Afyonkarahisar', 38.7573, 30.5366],
  ['Ağrı', 39.6224, 43.0168],
  ['Amasya', 40.6564, 35.8378],
  ['Ankara', 39.9291, 32.8561],
  ['Antalya', 36.8996, 30.7126],
  ['Artvin', 41.181, 41.8203],
  ['Aydın', 37.8377, 27.8457],
  ['Balıkesir', 39.6527, 27.8867],
  ['Bilecik', 40.1429, 29.9803],
  ['Bingöl', 38.8853, 40.4966],
  ['Bitlis', 38.4003, 42.1097],
  ['Bolu', 40.7321, 31.6107],
  ['Burdur', 37.7184, 30.2833],
  ['Bursa', 40.2109, 29.0186],
  ['Çanakkale', 40.1462, 26.409],
  ['Çankırı', 40.5999, 33.6149],
  ['Çorum', 40.5492, 34.9536],
  ['Denizli', 37.787, 29.0669],
  ['Diyarbakır', 37.9292, 40.1973],
  ['Edirne', 41.669, 26.5705],
  ['Elazığ', 38.6738, 39.223],
  ['Erzincan', 39.7492, 39.4913],
  ['Erzurum', 39.9051, 41.2651],
  ['Eskişehir', 39.7685, 30.5283],
  ['Gaziantep', 37.0666, 37.3762],
  ['Giresun', 40.9174, 38.3907],
  ['Gümüşhane', 40.4611, 39.4795],
  ['Hakkari', 37.5771, 43.7368],
  ['Hatay', 36.4337, 36.2481],
  ['Isparta', 37.763, 30.5533],
  ['Mersin', 36.8101, 34.6469],
  ['İstanbul', 41.0052, 28.9847],
  ['İzmir', 38.423, 27.1403],
  ['Kars', 40.6015, 43.0979],
  ['Kastamonu', 41.3948, 33.7832],
  ['Kayseri', 38.7236, 35.4843],
  ['Kırklareli', 41.7355, 27.2232],
  ['Kırşehir', 39.146, 34.1599],
  ['Kocaeli', 40.7646, 29.9409],
  ['Konya', 37.8703, 32.5099],
  ['Kütahya', 39.4206, 29.9848],
  ['Malatya', 38.3521, 38.3086],
  ['Manisa', 38.6211, 27.4024],
  ['Kahramanmaraş', 37.5746, 36.9227],
  ['Mardin', 37.3208, 40.7237],
  ['Muğla', 37.2152, 28.364],
  ['Muş', 38.7446, 41.5051],
  ['Nevşehir', 38.628, 34.716],
  ['Niğde', 37.9702, 34.6766],
  ['Ordu', 40.9757, 37.9048],
  ['Rize', 41.025, 40.5188],
  ['Sakarya', 40.7715, 30.395],
  ['Samsun', 41.2805, 36.3331],
  ['Siirt', 37.9315, 41.9368],
  ['Sinop', 42.0276, 35.1517],
  ['Sivas', 39.7506, 37.0143],
  ['Tekirdağ', 40.9781, 27.5094],
  ['Tokat', 40.336, 36.5502],
  ['Trabzon', 40.8035, 39.5978],
  ['Tunceli', 39.1061, 39.5485],
  ['Şanlıurfa', 37.1674, 38.7997],
  ['Uşak', 38.6743, 29.4043],
  ['Van', 38.523, 43.4518],
  ['Yozgat', 39.8213, 34.8085],
  ['Zonguldak', 41.4527, 31.7833],
  ['Aksaray', 38.3683, 34.0257],
  ['Bayburt', 40.2603, 40.229],
  ['Karaman', 37.1808, 33.2227],
  ['Kırıkkale', 39.8399, 33.5085],
  ['Batman', 37.8893, 41.1305],
  ['Şırnak', 37.5192, 42.4534],
  ['Bartın', 41.6376, 32.3355],
  ['Ardahan', 41.1132, 42.7024],
  ['Iğdır', 39.9202, 44.0433],
  ['Yalova', 40.6491, 29.2555],
  ['Karabük', 41.2001, 32.622],
  ['Kilis', 36.7162, 37.115],
  ['Osmaniye', 37.0741, 36.2458],
  ['Düzce', 40.8389, 31.1617],
].map(([name, lat, lng]) => ({ name, lat, lng }))
  .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

/**
 * "Vaktin ayeti/hadisi" sırası: günde 5 kez (İmsak, Öğle, İkindi, Akşam, Yatsı) ilerleyen sayaç.
 * Güneş vakti yeni içerik getirmez; imsaktan önceki saatler bir önceki günün yatsısına sayılır.
 */
const SLOT = { imsak: 0, gunes: 0, ogle: 1, ikindi: 2, aksam: 3, yatsi: 4 };
export function vakitSlot(loc) {
  const n = trNow();
  const t = prayerTimes(n, loc.lat, loc.lng);
  const nowMin = n.sec / 60;
  let day = Math.floor(Date.UTC(n.y, n.m - 1, n.d) / 864e5);
  let slot;
  if (nowMin < t.imsak) { day -= 1; slot = 4; }
  else slot = SLOT[[...KEYS].reverse().find((k) => t[k] <= nowMin)];
  return day * 5 + slot;
}
