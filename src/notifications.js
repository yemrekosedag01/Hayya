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

// Android'de bir kanalın sesi sonradan değiştirilemez; bu yüzden her ses için ayrı kanal var.
const HAYYA_SOUND = 'hayya_bildirim.wav';
const CH = {
  vakit: { hayya: 'vakit-hayya-v1', sistem: 'vakit-v1' },
  hatirlatma: { hayya: 'hatirlatma-hayya-v1', sistem: 'hatirlatma-v1' },
};
const CH_EZAN = HAS_EZAN_SOUND ? 'ezan-v2' : 'ezan-v1';
const soundFor = (soundMode) => (soundMode === 'sistem' ? 'default' : HAYYA_SOUND);
const DAYS_AHEAD = 14; // uygulama açılmasa da 2 hafta bildirim gelir

export async function setupNotifications() {
  if (Platform.OS === 'android') {
    for (const mode of ['hayya', 'sistem']) {
      const sound = mode === 'hayya' ? HAYYA_SOUND : 'default';
      const tag = mode === 'hayya' ? ' (Hayya sesi)' : ' (telefon sesi)';
      await Notifications.setNotificationChannelAsync(CH.vakit[mode], {
        name: 'Vakit bildirimi' + tag, importance: Notifications.AndroidImportance.HIGH, sound,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      await Notifications.setNotificationChannelAsync(CH.hatirlatma[mode], {
        name: 'Vakit öncesi hatırlatma' + tag, importance: Notifications.AndroidImportance.DEFAULT, sound,
      });
    }
    await Notifications.setNotificationChannelAsync(CH_EZAN, {
      name: 'Ezan', importance: Notifications.AndroidImportance.MAX,
      sound: HAS_EZAN_SOUND ? 'ezan.wav' : 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Önümüzdeki 14 günün vakit bildirimlerini yeniden kurar.
 * alarms: { imsak: 'off' | 'bildirim' | 'ezan', ... }, pre: dakika (0 = yok), soundMode: 'hayya' | 'sistem'
 */
export async function scheduleAll(loc, alarms, pre, soundMode = 'hayya') {
  const snd = soundFor(soundMode);
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
            sound: mode === 'ezan' && HAS_EZAN_SOUND ? 'ezan.wav' : snd,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: mode === 'ezan' ? CH_EZAN : CH.vakit[soundMode === 'sistem' ? 'sistem' : 'hayya'] },
        });
      }
      if (pre > 0 && k !== 'gunes') {
        const preAt = new Date(at.getTime() - pre * 60000);
        if (preAt.getTime() > now + 5000) {
          jobs.push({
            content: { title: `${NAMES[k]} vaktine ${pre} dakika`, body: `${loc.name} · ${NAMES[k]} ${hm(t[k])}`, sound: snd },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: preAt, channelId: CH.hatirlatma[soundMode === 'sistem' ? 'sistem' : 'hayya'] },
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

export async function testNotification(loc, ezan = false, soundMode = 'hayya') {
  const m = soundMode === 'sistem' ? 'sistem' : 'hayya';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: ezan ? 'Hayya · Ezan sesi denemesi' : 'Hayya · Deneme bildirimi',
      body: `${loc.name} için vakit bildirimleri açık.`,
      sound: ezan && HAS_EZAN_SOUND ? 'ezan.wav' : soundFor(m),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: ezan ? CH_EZAN : CH.vakit[m] },
  });
}
