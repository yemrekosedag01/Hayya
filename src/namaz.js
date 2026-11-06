// Namaz takibi: { 'YYYY-M-D': { imsak: true, ogle: true, ... } } — imsak = sabah namazı
export const PRAYERS = [['imsak', 'Sabah'], ['ogle', 'Öğle'], ['ikindi', 'İkindi'], ['aksam', 'Akşam'], ['yatsi', 'Yatsı']];
export const KAZA = [['sabah', 'Sabah'], ['ogle', 'Öğle'], ['ikindi', 'İkindi'], ['aksam', 'Akşam'], ['yatsi', 'Yatsı'], ['vitir', 'Vitir']];
export const dayKey = ({ y, m, d }) => `${y}-${m}-${d}`;

export function toggle(namaz, key, k) {
  const day = { ...(namaz[key] || {}) };
  if (day[k]) delete day[k]; else day[k] = true;
  const next = { ...namaz, [key]: day };
  if (!Object.keys(day).length) delete next[key];
  return next;
}

export const countDay = (namaz, key) => PRAYERS.filter(([k]) => namaz[key] && namaz[key][k]).length;
