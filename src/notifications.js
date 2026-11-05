import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { KEYS, NAMES, prayerTimes, trNow, addDays, toDate, hm } from './prayer';
import { HAS_EZAN_SOUND } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CH_VAKIT = 'vakit-v1';
const CH_EZAN = HAS_EZAN_SOUND ? 'ezan-v2' : 'ezan-v1';
const CH_HATIRLATMA = 'hatirlatma-v1';
const DAYS_AHEAD = 14; // uygulama açılmasa da 2 hafta bildirim gelir

export async function setupNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CH_VAKIT, {
      name: 'Vakit bildirimi', importance: Notifications.AndroidImportance.HIGH, sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync(CH_EZAN, {
      name: 'Ezan', importance: Notifications.AndroidImportance.MAX,
      sound: HAS_EZAN_SOUND ? 'ezan.wav' : 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync(CH_HATIRLATMA, {
      name: 'Vakit öncesi hatırlatma', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default',
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Önümüzdeki 14 günün vakit bildirimlerini yeniden kurar.
 * alarms: { imsak: 'off' | 'bildirim' | 'ezan', ... }, pre: dakika (0 = yok)
 */
export async function scheduleAll(loc, alarms, pre) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const today = trNow();
  const jobs = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const t = prayerTimes(day, loc.lat, loc.lng);
    for (const k of KEYS) {
      const mode = alarms[k] || 'off';
      if (mode === 'off') continue;
      const at = toDate(day, t[k]);
      if (at.getTime() > now + 5000) {
        jobs.push({
          content: {
            title: k === 'gunes' ? `Güneş doğdu · ${hm(t[k])}` : `${NAMES[k]} vakti girdi · ${hm(t[k])}`,
            body: k === 'gunes' ? `${loc.name}: Kerahat vakti başladı.` : `${loc.name} için ${NAMES[k]} vakti. Hayya ale's-salâh!`,
            sound: mode === 'ezan' && HAS_EZAN_SOUND ? 'ezan.wav' : 'default',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: mode === 'ezan' ? CH_EZAN : CH_VAKIT },
        });
      }
      if (pre > 0 && k !== 'gunes') {
        const preAt = new Date(at.getTime() - pre * 60000);
        if (preAt.getTime() > now + 5000) {
          jobs.push({
            content: { title: `${NAMES[k]} vaktine ${pre} dakika`, body: `${loc.name} · ${NAMES[k]} ${hm(t[k])}`, sound: 'default' },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: preAt, channelId: CH_HATIRLATMA },
          });
        }
      }
    }
  }
  for (const j of jobs) {
    try { await Notifications.scheduleNotificationAsync(j); } catch (e) {}
  }
  return jobs.length;
}

export async function testNotification(loc) {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Hayya · Deneme bildirimi', body: `${loc.name} için vakit bildirimleri açık.`, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CH_VAKIT },
  });
}
