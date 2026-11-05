import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, AppState, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { C } from './src/theme';
import { CITIES } from './src/prayer';
import { load, save } from './src/storage';
import { loadContent } from './src/content';
import { setupNotifications, scheduleAll } from './src/notifications';
import { startPush, setPushCity } from './src/push';
import { applyOngoing } from './src/ongoing';
import HomeScreen from './src/screens/HomeScreen';
import TimesScreen from './src/screens/TimesScreen';
import LessonsScreen from './src/screens/LessonsScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const TABS = [
  { key: 'ana', icon: '🕌', label: 'Ana Sayfa' },
  { key: 'vakitler', icon: '🕰️', label: 'Vakitler' },
  { key: 'dersler', icon: '📚', label: 'Dersler' },
  { key: 'quiz', icon: '🎯', label: 'Quiz' },
  { key: 'ayarlar', icon: '⚙️', label: 'Ayarlar' },
];

const DEFAULT_ALARMS = { imsak: 'ezan', gunes: 'off', ogle: 'ezan', ikindi: 'ezan', aksam: 'ezan', yatsi: 'ezan' };

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('ana');
  const [loc, setLoc] = useState(CITIES[0]);
  const [alarms, setAlarms] = useState(DEFAULT_ALARMS);
  const [pre, setPre] = useState(15);
  const [soundMode, setSoundMode] = useState('hayya');
  const [ongoing, setOngoing] = useState(true);
  const [content, setContent] = useState({ dersler: [], sorular: [], ayetler: [], hadisler: [] });
  const [notifOk, setNotifOk] = useState(true);
  const appState = useRef(AppState.currentState);

  // İlk açılış: kayıtlı ayarlar + içerik
  useEffect(() => {
    (async () => {
      setLoc(await load('loc', CITIES[0]));
      setAlarms({ ...DEFAULT_ALARMS, ...(await load('alarms', {})) });
      setPre(await load('pre', 15));
      setSoundMode(await load('soundMode', 'hayya'));
      setOngoing(await load('ongoing', true));
      setContent(await loadContent(setContent));
      setNotifOk(await setupNotifications());
      setReady(true);
      startPush();
    })();
  }, []);

  // Konum / ayar değişince bildirimleri yeniden kur
  useEffect(() => {
    if (!ready) return;
    save('loc', loc); save('alarms', alarms); save('pre', pre); save('soundMode', soundMode);
    if (notifOk) scheduleAll(loc, alarms, pre, soundMode);
  }, [ready, loc, alarms, pre, soundMode, notifOk]);

  useEffect(() => { if (ready) setPushCity(loc.name); }, [ready, loc.name]);

  // Bildirim çubuğundaki kalıcı vakit göstergesi
  useEffect(() => {
    if (!ready) return;
    save('ongoing', ongoing);
    if (notifOk) applyOngoing(ongoing, loc);
  }, [ready, ongoing, loc, notifOk]);

  // Uygulamaya her dönüldüğünde bildirimleri tazele (7 günlük pencere ilerlesin)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && ready && notifOk) {
        scheduleAll(loc, alarms, pre, soundMode);
        applyOngoing(ongoing, loc);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [ready, loc, alarms, pre, soundMode, ongoing, notifOk]);

  const screen = {
    ana: <HomeScreen loc={loc} content={content} go={setTab} />,
    vakitler: <TimesScreen loc={loc} setLoc={setLoc} />,
    dersler: <LessonsScreen content={content} go={setTab} />,
    quiz: <QuizScreen content={content} />,
    ayarlar: (
      <SettingsScreen loc={loc} alarms={alarms} setAlarms={setAlarms} pre={pre} setPre={setPre}
        soundMode={soundMode} setSoundMode={setSoundMode} ongoing={ongoing} setOngoing={setOngoing}
        notifOk={notifOk} retryNotif={async () => setNotifOk(await setupNotifications())} />
    ),
  }[tab];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
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
              <Pressable key={t.key} style={s.tab} onPress={() => setTab(t.key)}>
                <Text style={[s.tabIcon, tab !== t.key && { opacity: 0.45 }]}>{t.icon}</Text>
                <Text style={[s.tabLbl, tab === t.key && { color: C.green }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 12 },
  brand: { fontSize: 22, fontWeight: '900', color: C.green },
  brandSub: { fontSize: 11, color: C.muted, fontWeight: '700' },
  chip: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipTxt: { fontSize: 13, fontWeight: '800', color: C.green },
  tabs: { backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
  tabRow: { flexDirection: 'row', paddingVertical: 8 },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 21 },
  tabLbl: { fontSize: 11, fontWeight: '800', color: C.muted, marginTop: 2 },
});
