import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import { KEYS, NAMES, prayerTimes, trNow, addDays, toDate, hm } from './prayer';
import { HAS_EZAN_SOUND, HAYYA_SOUND_READY } from './config';
import { hasNativeEzan, setEzan, testEzan } from '../modules/hayya-ongoing';
import { isLong, DEFAULT_VAKIT_SND, DEFAULT_HATIRLATMA } from './sounds';

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
const HAYYA_SOUND = 'hayya_ses.wav';
const CH = {
  vakit: { hayya: 'vakit-hayya-v2', sistem: 'vakit-v1' },
  hatirlatma: { hayya: 'hatirlatma-hayya-v2', sistem: 'hatirlatma-v1' },
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
  // İzin ilk kurulum ekranlarında (Onboarding) ya da girişteki uyarıyla istenir
  const cur = await Notifications.getPermissionsAsync();
  return cur.granted;
}

/** Bildirim izni var mı? */
export async function notifGranted() {
  try { return (await Notifications.getPermissionsAsync()).granted; } catch (e) { return true; }
}

/** İzni iste; sistem artık sormuyorsa telefon ayarlarını aç. */
export async function askNotifPermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (cur.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    if (req.granted) return true;
    if (req.canAskAgain) return false;
  }
  Linking.openSettings();
  return false;
}

/**
 * Önümüzdeki 14 günün vakit bildirimlerini yeniden kurar.
 * vakitSnd: { imsak: 'off' | ses, ... } — vakit girince çalacak ses
 * hatirlatma: { imsak: { min: 15|30|45, snd: 'off' | ses }, ... } — vakitten önce
 * vib: titreşim
 */
export async function scheduleAll(loc, vakitSnd = DEFAULT_VAKIT_SND, hatirlatma = DEFAULT_HATIRLATMA, vib = true) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const today = trNow();
  const jobs = [];
  // Uzun sesler (ezanlar) uygulamanın kendi oynatıcısıyla çalar:
  // ses tuşu kesmez sesini kısar, yalnızca "Sustur" düğmesi susturur.
  const native = hasNativeEzan();
  const nativeList = [];

  // Bir bildirimi seçilen sese göre kur. kind: 'vakit' | 'hatirlatma'
  const add = (at, title, body, sndId, kind) => {
    if (at.getTime() <= now + 5000) return;
    if (isLong(sndId) && native) { nativeList.push({ t: at.getTime(), title, body, snd: sndId }); return; }
    let channelId; let sound;
    if (isLong(sndId)) { channelId = CH_EZAN; sound = HAS_EZAN_SOUND ? 'ezan.wav' : 'default'; } // eski cihaz yedeği
    else {
      const m = sndId === 'default' ? 'sistem' : effMode('hayya');
      channelId = (kind === 'vakit' ? CH.vakit : CH.hatirlatma)[m];
      sound = m === 'sistem' ? 'default' : HAYYA_SOUND;
    }
    jobs.push({
      content: { title, body, sound },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: nv(channelId, vib) },
    });
  };

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const t = prayerTimes(day, loc.lat, loc.lng);
    for (const k of KEYS) {
      const at = toDate(day, t[k]);
      const snd = vakitSnd[k] || 'off';
      if (snd !== 'off') {
        const title = k === 'gunes' ? `Güneş doğdu · ${hm(t[k])}` : `${NAMES[k]} vakti girdi · ${hm(t[k])}`;
        const body = k === 'gunes' ? `${loc.name}: Kerahat vakti başladı.` : `${loc.name} için ${NAMES[k]} vakti. Hayya ale's-salâh!`;
        add(at, title, body, snd, 'vakit');
      }
      const r = hatirlatma[k];
      if (r && r.snd && r.snd !== 'off') {
        const title = k === 'gunes' ? `Güneşin doğmasına ${r.min} dakika` : `${NAMES[k]} vaktine ${r.min} dakika`;
        const body = k === 'gunes' ? `${loc.name} · Güneş ${hm(t[k])} · Sabah namazının vakti çıkmak üzere.` : `${loc.name} · ${NAMES[k]} ${hm(t[k])}`;
        add(new Date(at.getTime() - r.min * 60000), title, body, r.snd, 'hatirlatma');
      }
    }
  }
  if (native) setEzan(nativeList, vib);
  for (const j of jobs) {
    try { await Notifications.scheduleNotificationAsync(j); } catch (e) {}
  }
  return jobs.length + nativeList.length;
}

export async function testNotification(loc, ezan = false, soundMode = 'hayya', vib = true, ezanSnd = 'ezan') {
  const m = effMode(soundMode);
  if (ezan && HAS_EZAN_SOUND && hasNativeEzan()) {
    testEzan('Hayya · Ezan sesi denemesi', `${loc.name} için ezan uyarıları açık. Susturmak için "Sustur"a dokunun.`, ezanSnd);
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: ezan ? 'Hayya · Ezan sesi denemesi' : 'Hayya · Deneme bildirimi',
      body: `${loc.name} için vakit bildirimleri açık.`,
      sound: ezan && HAS_EZAN_SOUND ? 'ezan.wav' : soundFor(m),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: nv(ezan ? CH_EZAN : CH.vakit[m], vib) },
  });
}
