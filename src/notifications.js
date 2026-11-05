import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { KEYS, NAMES, prayerTimes, trNow, addDays, toDate, hm } from './prayer';
import { HAS_EZAN_SOUND, HAYYA_SOUND_READY } from './config';

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
const effMode = (m) => (HAYYA_SOUND_READY && m !== 'sistem' ? 'hayya' : 'sistem');
const soundFor = (soundMode) => (effMode(soundMode) === 'sistem' ? 'default' : HAYYA_SOUND);
// Titreşim de kanala bağlıdır: titreşimsiz kanallar '-nv' ekiyle ayrı tutulur.
const nv = (id, vib) => (vib ? id : id + '-nv');
const DAYS_AHEAD = 14; // uygulama açılmasa da 2 hafta bildirim gelir

export async function setupNotifications() {
  if (Platform.OS === 'android') {
    for (const vib of [true, false]) {
      const v = { enableVibrate: vib, ...(vib ? { vibrationPattern: [0, 400, 250, 400] } : {}) };
      const vt = vib ? '' : ', titreşimsiz';
      for (const mode of ['hayya', 'sistem']) {
        if (mode === 'hayya' && !HAYYA_SOUND_READY) continue;
        const sound = mode === 'hayya' ? HAYYA_SOUND : 'default';
        const tag = (mode === 'hayya' ? ' (Hayya sesi' : ' (telefon sesi') + vt + ')';
        await Notifications.setNotificationChannelAsync(nv(CH.vakit[mode], vib), {
          name: 'Vakit bildirimi' + tag, importance: Notifications.AndroidImportance.HIGH, sound, ...v,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
        await Notifications.setNotificationChannelAsync(nv(CH.hatirlatma[mode], vib), {
          name: 'Vakit öncesi hatırlatma' + tag, importance: Notifications.AndroidImportance.DEFAULT, sound, ...v,
        });
      }
      await Notifications.setNotificationChannelAsync(nv(CH_EZAN, vib), {
        name: 'Ezan' + (vib ? '' : ' (titreşimsiz)'), importance: Notifications.AndroidImportance.MAX,
        sound: HAS_EZAN_SOUND ? 'ezan.wav' : 'default', ...v,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Önümüzdeki 14 günün vakit bildirimlerini yeniden kurar.
 * vib: bildirimlerde titreşim açık mı
 * alarms: { imsak: 'off' | 'bildirim' | 'ezan', ... }, pre: dakika (0 = yok), soundMode: 'hayya' | 'sistem'
 */
export async function scheduleAll(loc, alarms, pre, soundMode = 'hayya', vib = true) {
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
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: nv(mode === 'ezan' ? CH_EZAN : CH.vakit[effMode(soundMode)], vib) },
        });
      }
      if (pre > 0 && k !== 'gunes') {
        const preAt = new Date(at.getTime() - pre * 60000);
        if (preAt.getTime() > now + 5000) {
          jobs.push({
            content: { title: `${NAMES[k]} vaktine ${pre} dakika`, body: `${loc.name} · ${NAMES[k]} ${hm(t[k])}`, sound: snd },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: preAt, channelId: nv(CH.hatirlatma[effMode(soundMode)], vib) },
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

export async function testNotification(loc, ezan = false, soundMode = 'hayya', vib = true) {
  const m = effMode(soundMode);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: ezan ? 'Hayya · Ezan sesi denemesi' : 'Hayya · Deneme bildirimi',
      body: `${loc.name} için vakit bildirimleri açık.`,
      sound: ezan && HAS_EZAN_SOUND ? 'ezan.wav' : soundFor(m),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: nv(ezan ? CH_EZAN : CH.vakit[m], vib) },
  });
}
