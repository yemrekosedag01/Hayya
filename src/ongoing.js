// Kalıcı vakit göstergesi için 30 günlük vakit listesini hazırlayıp Android modülüne verir.
import { startOngoing, stopOngoing } from '../modules/hayya-ongoing';
import { KEYS, NAMES, prayerTimes, trNow, addDays, toDate, hm } from './prayer';

const DAYS = 30;
const pad = (n) => String(n).padStart(2, '0');

export function buildOngoingPayload(loc) {
  const today = trNow();
  const items = [];
  const days = {};
  for (let i = -1; i < DAYS; i++) {
    const d = addDays(today, i);
    const t = prayerTimes(d, loc.lat, loc.lng);
    for (const k of KEYS) items.push({ k: NAMES[k], t: toDate(d, t[k]).getTime() });
    const a = KEYS.slice(0, 3).map((k) => `${NAMES[k]} ${hm(t[k])}`).join('  ·  ');
    const b = KEYS.slice(3).map((k) => `${NAMES[k]} ${hm(t[k])}`).join('  ·  ');
    days[`${d.y}-${pad(d.m)}-${pad(d.d)}`] = `${a}\n${b}`;
  }
  return { city: loc.name, items, days };
}

export function applyOngoing(enabled, loc) {
  if (enabled) startOngoing(buildOngoingPayload(loc));
  else stopOngoing();
}
