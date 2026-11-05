// Anlık bildirimler (Firebase Cloud Messaging).
// Herkes "tum" kanalına, ayrıca seçtiği şehrin kanalına (ör. "sehir_adana") abone olur.
// Bildirimler Firebase konsolundan (Messaging) gönderilir.
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging, onMessage, subscribeToTopic, unsubscribeFromTopic, registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { load, save } from './storage';

export const CH_DUYURU = 'duyuru-v2';

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
        name: 'Duyurular', importance: Notifications.AndroidImportance.HIGH, sound: 'hayya_bildirim.wav',
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
        content: { title: n.title || 'Hayya', body: n.body || '', sound: 'hayya_bildirim.wav' },
        trigger: Platform.OS === 'android' ? { channelId: CH_DUYURU } : null,
      });
    });
  } catch (e) {
    started = false; // internet yoksa bir sonraki açılışta tekrar dener
  }
}

/** Şehir değişince eski şehir kanalından çıkıp yenisine abone olur. */
export async function setPushCity(name) {
  try {
    const m = getMessaging(getApp());
    const next = cityTopic(name);
    const prev = await load('pushCity', null);
    if (prev === next) return;
    if (prev) await unsubscribeFromTopic(m, prev).catch(() => {});
    await subscribeToTopic(m, next);
    await save('pushCity', next);
  } catch (e) {}
}
