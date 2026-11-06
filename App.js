import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, AppState, Image, BackHandler, useColorScheme, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { C, themed, setTheme as applyTheme } from './src/theme';
import { CITIES } from './src/prayer';
import { load, save } from './src/storage';
import { loadContent } from './src/content';
import { loadRadio } from './src/radio';
import { DEFAULT_VAKIT_SND, DEFAULT_HATIRLATMA, migrateSounds } from './src/sounds';
import { setupNotifications, scheduleAll, notifGranted, askNotifPermission } from './src/notifications';
import { startPush, setPushCity } from './src/push';
import { fillProvince } from './src/location';
import { applyOngoing } from './src/ongoing';
import HomeScreen from './src/screens/HomeScreen';
import TimesScreen from './src/screens/TimesScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MenuScreen from './src/screens/MenuScreen';
import ZikirScreen from './src/screens/ZikirScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import EsmaScreen from './src/screens/EsmaScreen';
import DiniGunlerScreen from './src/screens/DiniGunlerScreen';
import HicriScreen from './src/screens/HicriScreen';
import AboutScreen from './src/screens/AboutScreen';
import NotifScreen from './src/screens/NotifScreen';
import NamazScreen from './src/screens/NamazScreen';
import Onboarding from './src/screens/Onboarding';
import { canExact, openExactSettings } from './modules/hayya-ongoing';
import { SubHeader } from './src/screens/ui';

const TABS = [
  { key: 'ana', icon: '🕌', label: 'Ana Sayfa' },
  { key: 'vakitler', icon: '🕰️', label: 'Vakitler' },
  { key: 'dersler', icon: '📚', label: 'Dersler' },
  { key: 'quiz', icon: '🎯', label: 'Quiz' },
  { key: 'menu', icon: '☰', label: '' },
];

const SUB_TITLES = {
  bildirim: 'Ezan ve Bildirimler', namaz: 'Namaz Takibi', zikir: 'Zikirmatik', kible: 'Kıble Pusulası', esma: 'Esmaül Hüsna', dini: 'Dini Günler',
  hicri: 'Hicri Takvim', ayarlar: 'Ayarlar', hakkinda: 'Hakkında ve Gizlilik',
};


export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('ana');
  const [loc, setLoc] = useState(CITIES[0]);
  const [vakitSnd, setVakitSnd] = useState(DEFAULT_VAKIT_SND);
  const [hatirlatma, setHatirlatma] = useState(DEFAULT_HATIRLATMA);
  const [ongoing, setOngoing] = useState(true);
  const [content, setContent] = useState({ dersler: [], sorular: [], ayetler: [], hadisler: [] });
  const [notifOk, setNotifOk] = useState(true);
  const [radio, setRadio] = useState({ tracks: [], sponsors: [] });
  const [sub, setSub] = useState(null); // menü içindeki alt sayfa
  const [theme, setTheme] = useState('auto');
  const [vibNotif, setVibNotif] = useState(true);
  const [vibZikir, setVibZikir] = useState(true);
  const [namaz, setNamazS] = useState({});
  const [kaza, setKazaS] = useState({});
  const setNamaz = (v) => { setNamazS(v); save('namaz', v); };
  const setKaza = (v) => { setKazaS(v); save('kaza', v); };
  const sys = useColorScheme();
  const dark = theme === 'dark' || (theme === 'auto' && sys === 'dark');
  applyTheme(dark ? 'dark' : 'light'); // çizimden önce renkleri ayarla
  const appState = useRef(AppState.currentState);
  const asking = useRef(false);
  const [onboarded, setOnboarded] = useState(null);
  const [autoPick, setAutoPick] = useState(false);

  // İzinler kapalıysa uygulamaya her girişte sor: önce bildirim, o açıksa "Alarmlar ve hatırlatıcılar"
  const promptPerms = async () => {
    if (asking.current) return;
    const done = () => { asking.current = false; };
    if (!(await notifGranted())) {
      asking.current = true;
      Alert.alert(
        '🔔 Bildirimler kapalı',
        'Ezan vakitlerinden ve hatırlatmalardan haberdar olmak için bildirimler açılsın mı?',
        [
          { text: 'Şimdi değil', style: 'cancel', onPress: done },
          { text: 'Aç', onPress: async () => { setNotifOk(await askNotifPermission()); done(); } },
        ],
        { cancelable: true, onDismiss: done },
      );
    } else if (!canExact()) {
      asking.current = true;
      Alert.alert(
        '⏰ Ezan tam vaktinde okunsun',
        'Telefonunuz pil tasarrufu için ezanı birkaç dakika geciktirebilir. Bunu önlemek için "Alarmlar ve hatırlatıcılar" iznini açın.',
        [
          { text: 'Şimdi değil', style: 'cancel', onPress: done },
          { text: 'İzni aç', onPress: () => { openExactSettings(); done(); } },
        ],
        { cancelable: true, onDismiss: done },
      );
    }
  };

  // İlk açılış: kayıtlı ayarlar + içerik
  useEffect(() => {
    (async () => {
      setLoc(await load('loc', CITIES[0]));
      // Ses ayarları: yeni yapı yoksa eski ayarlardan taşı
      const vs = await load('vakitSnd', null);
      if (vs) {
        setVakitSnd({ ...DEFAULT_VAKIT_SND, ...vs });
        setHatirlatma({ ...DEFAULT_HATIRLATMA, ...(await load('hatirlatma', {})) });
      } else {
        const m = migrateSounds({ alarms: await load('alarms', null), pre: await load('pre', null), soundMode: await load('soundMode', 'hayya'),
          ezanSounds: await load('ezanSounds', {}), remSounds: await load('remSounds', {}) });
        setVakitSnd(m.vakitSnd); setHatirlatma(m.hatirlatma);
      }
      setOngoing(await load('ongoing', true));
      setTheme(await load('theme', 'auto'));
      setVibNotif(await load('vibNotif', true));
      setVibZikir(await load('vibZikir', true));
      setNamazS(await load('namaz', {}));
      setKazaS(await load('kaza', {}));
      setContent(await loadContent(setContent));
      setRadio(await loadRadio(setRadio));
      const ok = await setupNotifications();
      setNotifOk(ok);
      const ob = await load('onboarded', false);
      setOnboarded(ob);
      setReady(true);
      if (ob) promptPerms();
      startPush();
    })();
  }, []);

  // Konum / ayar değişince bildirimleri yeniden kur
  useEffect(() => {
    if (!ready) return;
    save('loc', loc); save('vakitSnd', vakitSnd); save('hatirlatma', hatirlatma); save('vibNotif', vibNotif);
    if (notifOk) scheduleAll(loc, vakitSnd, hatirlatma, vibNotif);
  }, [ready, loc, vakitSnd, hatirlatma, vibNotif, notifOk]);

  useEffect(() => { if (ready) { save('theme', theme); save('vibZikir', vibZikir); } }, [ready, theme, vibZikir]);

  // Android geri tuşu: menü alt sayfasından menüye, diğer sekmelerden ana sayfaya
  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'menu' && sub) { setSub(null); return true; }
      if (tab !== 'ana') { setTab('ana'); return true; }
      return false;
    });
    return () => h.remove();
  }, [tab, sub]);

  useEffect(() => {
    if (!ready) return;
    // İlçe seçmiş eski kullanıcılarda il bilgisi yoksa bir kez bul; sonra il + ilçe kanallarına abone ol
    if (!loc.il && !CITIES.some((c) => c.name === loc.name)) {
      fillProvince(loc).then((l) => { if (l) setLoc(l); else setPushCity(loc); });
      return;
    }
    setPushCity(loc);
  }, [ready, loc.name, loc.lat, loc.lng, loc.il]);

  // Bildirim çubuğundaki kalıcı vakit göstergesi
  useEffect(() => {
    if (!ready) return;
    save('ongoing', ongoing);
    applyOngoing(ongoing && notifOk, loc); // widget verisi izin olmasa da yazılır
  }, [ready, ongoing, loc, notifOk]);

  // Uygulamaya her dönüldüğünde bildirimleri tazele (7 günlük pencere ilerlesin)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      const back = !!appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (!back || !ready || !onboarded) return;
      // Uygulamaya dönüldü: izin durumu değişmiş olabilir (ayarlardan açıldıysa)
      const g = await notifGranted();
      if (g !== notifOk) { setNotifOk(g); return; } // değişince bildirimler zaten yeniden kurulur
      if (!g) { promptPerms(); return; }
      if (!canExact()) promptPerms();
      scheduleAll(loc, vakitSnd, hatirlatma, vibNotif);
      applyOngoing(ongoing, loc);
    });
    return () => sub.remove();
  }, [ready, onboarded, loc, vakitSnd, hatirlatma, vibNotif, ongoing, notifOk]);

  const screen = {
    ana: <HomeScreen loc={loc} content={content} go={setTab} radio={radio} namaz={namaz} setNamaz={setNamaz} />,
    vakitler: <TimesScreen loc={loc} setLoc={setLoc} autoPick={autoPick} />,
    dersler: <LessonsScreen content={content} go={setTab} />,
    quiz: <QuizScreen content={content} />,
    menu: sub ? (
      <View style={{ flex: 1 }}>
        <SubHeader title={SUB_TITLES[sub]} onBack={() => setSub(null)} />
        <View style={{ flex: 1 }}>
          {{
            bildirim: (
              <NotifScreen loc={loc} vakitSnd={vakitSnd} setVakitSnd={setVakitSnd} hatirlatma={hatirlatma} setHatirlatma={setHatirlatma}
                notifOk={notifOk} retryNotif={async () => setNotifOk(await askNotifPermission())} vibNotif={vibNotif} />
            ),
            namaz: <NamazScreen loc={loc} namaz={namaz} setNamaz={setNamaz} kaza={kaza} setKaza={setKaza} />,
            zikir: <ZikirScreen vibZikir={vibZikir} />,
            kible: <QiblaScreen loc={loc} />,
            esma: <EsmaScreen />,
            dini: <DiniGunlerScreen />,
            hicri: <HicriScreen />,
            hakkinda: <AboutScreen />,
            ayarlar: (
              <SettingsScreen theme={theme} setTheme={setTheme} vibNotif={vibNotif} setVibNotif={setVibNotif}
                vibZikir={vibZikir} setVibZikir={setVibZikir}
                ongoing={ongoing} setOngoing={setOngoing} />
            ),
          }[sub]}
        </View>
      </View>
    ) : (
      <MenuScreen open={setSub} notifOk={notifOk} />
    ),
  }[tab];

  // İlk kurulum ekranları
  if (ready && onboarded === false) {
    return (
      <SafeAreaProvider>
        <Onboarding dark={dark} setLoc={setLoc} setNotifOk={setNotifOk}
          onDone={(pick) => { save('onboarded', true); setOnboarded(true); if (pick) { setAutoPick(true); setTab('vakitler'); } }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={s.header}>
          <Image source={require('./assets/icon.png')} style={s.logo} />
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>Hayya</Text>
            <Text style={s.brandSub}>Ezan Vakti ve Dini Bilgiler</Text>
          </View>
          <Pressable onPress={() => setTab('vakitler')} style={s.chip}>
            <Text style={s.chipTxt}>📍 {loc.name}</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>{ready ? screen : null}</View>
        <SafeAreaView edges={['bottom']} style={s.tabs}>
          <View style={s.tabRow}>
            {TABS.map((t) => (
              <Pressable key={t.key} style={s.tab} accessibilityLabel={t.label || 'Menü'}
                onPress={() => { if (t.key === 'menu' && tab === 'menu') setSub(null); setTab(t.key); }}>
                {t.key === 'menu' ? (
                  <Text style={[s.menuIcon, { color: tab === 'menu' ? C.green : C.muted }]}>☰</Text>
                ) : (
                  <>
                    <Text style={[s.tabIcon, tab !== t.key && { opacity: 0.45 }]}>{t.icon}</Text>
                    <Text style={[s.tabLbl, tab === t.key && { color: C.green }]}>{t.label}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 12 },
  brand: { fontSize: 22, fontWeight: '900', color: C.green },
  brandSub: { fontSize: 11, color: C.muted, fontWeight: '700' },
  chip: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipTxt: { fontSize: 13, fontWeight: '800', color: C.green },
  tabs: { backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
  tabRow: { flexDirection: 'row', paddingVertical: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  tabIcon: { fontSize: 21 },
  tabLbl: { fontSize: 11, fontWeight: '800', color: C.muted, marginTop: 2 },
}));
