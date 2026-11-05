// Hicri takvim: Diyanet İşleri Başkanlığı takvimindeki ay başlangıçları.
// Tablonun dışındaki tarihler için standart hesap (±1 gün) kullanılır; tablo her yıl uzatılmalı.

export const HMONTHS = ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir',
  'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'];
export const GMONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const WDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// [hicri yıl, ay (1-12), miladi başlangıç]
const STARTS = [
  [1448, 1, '2026-06-16'], [1448, 2, '2026-07-15'], [1448, 3, '2026-08-14'], [1448, 4, '2026-09-12'],
  [1448, 5, '2026-10-12'], [1448, 6, '2026-11-11'], [1448, 7, '2026-12-10'], [1448, 8, '2027-01-09'],
  [1448, 9, '2027-02-08'], [1448, 10, '2027-03-09'], [1448, 11, '2027-04-08'], [1448, 12, '2027-05-07'],
  [1449, 1, '2027-06-06'], [1449, 2, '2027-07-05'], [1449, 3, '2027-08-03'], [1449, 4, '2027-09-02'],
  [1449, 5, '2027-10-01'], [1449, 6, '2027-10-31'], [1449, 7, '2027-11-29'], [1449, 8, '2027-12-29'],
].map(([hy, hm, iso]) => ({ hy, hm, day: dayNum(iso) }));
const TABLE_END = STARTS[STARTS.length - 1].day + 29; // Şaban 1449 en az 29 gün

/** Miladi tarihi gün sayısına çevirir (UTC, 1970'ten beri). */
export function dayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
export const ymdNum = ({ y, m, d }) => Math.floor(Date.UTC(y, m - 1, d) / 86400000);
export function numToYmd(n) {
  const t = new Date(n * 86400000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

// Standart (tablolu) hicri hesap — yalnızca Diyanet tablosu dışı için
function arithmetic(n) {
  const jd = n + 2440588;
  const l0 = jd - 1948440 + 10632;
  const nn = Math.floor((l0 - 1) / 10631);
  const l1 = l0 - 10631 * nn + 354;
  const j = Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) + Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 = l1 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l2) / 709);
  return { hy: 30 * nn + j - 30, hm, hd: l2 - Math.floor((709 * hm) / 24) };
}

/** Gün sayısından hicri tarih: { hy, hm, hd } */
export function toHijri(n) {
  if (n >= STARTS[0].day && n < TABLE_END) {
    let s = STARTS[0];
    for (const x of STARTS) if (x.day <= n) s = x;
    return { hy: s.hy, hm: s.hm, hd: n - s.day + 1 };
  }
  return arithmetic(n);
}

export const hijriText = (n) => { const h = toHijri(n); return `${h.hd} ${HMONTHS[h.hm - 1]} ${h.hy}`; };
export const miladiText = (n, wd = true) => {
  const g = numToYmd(n);
  return `${g.d} ${GMONTHS[g.m - 1]} ${g.y}${wd ? ' ' + WDAYS[g.wd] : ''}`;
};

/** Hicri ayın gün listesi (Diyanet tablosundan). hy/hm verilmezse ayı içeren gün n'den bulunur. */
export function hijriMonthDays(n) {
  const h = toHijri(n);
  const start = n - h.hd + 1;
  // ay uzunluğu: bir sonraki ayın 1'ini bul
  let len = 29;
  if (toHijri(start + 29).hd !== 1) len = 30;
  return Array.from({ length: len }, (_, i) => start + i);
}

// Diyanet dini günler takvimi (gece idrak edilenler, o gecenin akşamındaki miladi tarihle)
const DINI = [
  ['2026-12-10', 'Üç Ayların Başlangıcı', 'ay'],
  ['2026-12-10', 'Regaip Kandili', 'kandil'],
  ['2027-01-04', 'Miraç Kandili', 'kandil'],
  ['2027-01-22', 'Berat Kandili', 'kandil'],
  ['2027-02-08', 'Ramazan Başlangıcı', 'ay'],
  ['2027-03-05', 'Kadir Gecesi', 'kandil'],
  ['2027-03-08', 'Ramazan Bayramı Arifesi', 'bayram'],
  ['2027-03-09', 'Ramazan Bayramı (1. Gün)', 'bayram'],
  ['2027-03-10', 'Ramazan Bayramı (2. Gün)', 'bayram'],
  ['2027-03-11', 'Ramazan Bayramı (3. Gün)', 'bayram'],
  ['2027-05-15', 'Kurban Bayramı Arifesi', 'bayram'],
  ['2027-05-16', 'Kurban Bayramı (1. Gün)', 'bayram'],
  ['2027-05-17', 'Kurban Bayramı (2. Gün)', 'bayram'],
  ['2027-05-18', 'Kurban Bayramı (3. Gün)', 'bayram'],
  ['2027-05-19', 'Kurban Bayramı (4. Gün)', 'bayram'],
  ['2027-06-06', 'Hicri Yılbaşı (1449)', 'ay'],
  ['2027-06-15', 'Aşure Günü', 'gun'],
  ['2027-08-13', 'Mevlid Kandili', 'kandil'],
  ['2027-11-29', 'Üç Ayların Başlangıcı', 'ay'],
  ['2027-12-02', 'Regaip Kandili', 'kandil'],
  ['2027-12-24', 'Miraç Kandili', 'kandil'],
].map(([iso, name, kind]) => ({ n: dayNum(iso), name, kind }));

/** Bugünden itibaren yaklaşan dini günler. */
export const upcomingDini = (today) => DINI.filter((x) => x.n >= today);
