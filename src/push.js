// Anlık bildirimler (Firebase Cloud Messaging).
// Herkes "tum" kanalına, ilinin kanalına (ör. "sehir_adana") ve ilçe seçtiyse ilçesinin kanalına (ör. "ilce_seyhan") abone olur.
// Bildirimler Firebase konsolundan (Messaging) gönderilir.
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging, onMessage, subscribeToTopic, unsubscribeFromTopic, registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { load, save } from './storage';
import { HAYYA_SOUND_READY } from './config';
import { CITIES } from './prayer';

export const CH_DUYURU = HAYYA_SOUND_READY ? 'duyuru-v3' : 'duyuru-v2s';

const TR = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
export const cityTopic = (name) =>
  'sehir_' + String(name || '').toLocaleLowerCase('tr').split('').map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let started = false;

export async function startPush() {
  if (started) return;
  started = true;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CH_DUYURU, {
        name: 'Duyurular', importance: Notifications.AndroidImportance.HIGH, sound: HAYYA_SOUND_READY ? 'hayya_ses.wav' : 'default',
      });
    }
    const m = getMessaging(getApp());
    await registerDeviceForRemoteMessages(m).catch(() => {});
    await subscribeToTopic(m, 'tum');
    // Uygulama açıkken gelen bildirimi de göster
    onMessage(m, async (msg) => {
      const n = msg.notification || {};
      if (!n.title && !n.body) return;
      await Notifications.scheduleNotificationAsync({
        content: { title: n.title || 'Hayya', body: n.body || '', sound: HAYYA_SOUND_READY ? 'hayya_ses.wav' : 'default' },
        trigger: Platform.OS === 'android' ? { channelId: CH_DUYURU } : null,
      });
    });
  } catch (e) {
    started = false; // internet yoksa bir sonraki açılışta tekrar dener
  }
}

/** Şehir değişince eski şehir kanalından çıkıp yenisine abone olur. */
const slug = (name) =>
  String(name || '').toLocaleLowerCase('tr').split('').map((c) => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Konumun ili: listedeki il adı, telefonun verdiği il adı ya da en yakın il merkezi. */
export function provinceOf(loc) {
  const byName = (n) => n && CITIES.find((c) => slug(c.name) === slug(n));
  const hit = byName(loc.name) || byName(loc.il);
  if (hit) return hit.name;
  let best = CITIES[0]; let bd = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - loc.lat) ** 2 + ((c.lng - loc.lng) * Math.cos((loc.lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best.name;
}

/** Konum değişince il ve ilçe kanallarına abone ol (eskilerden çık). */
export async function setPushCity(loc) {
  try {
    const m = getMessaging(getApp());
    const il = provinceOf(loc);
    const next = [cityTopic(il)];
    if (slug(loc.name) !== slug(il)) next.push('ilce_' + slug(loc.name));
    let prev = await load('pushTopics', null);
    if (!prev) { const old = await load('pushCity', null); prev = old ? [old] : []; }
    if (prev.join() === next.join()) return;
    for (const t of prev) if (!next.includes(t)) await unsubscribeFromTopic(m, t).catch(() => {});
    for (const t of next) if (!prev.includes(t)) await subscribeToTopic(m, t);
    await save('pushTopics', next);
  } catch (e) {}
}
