import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, AppState, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C, themed } from '../theme';
import { askNotifPermission, notifGranted } from '../notifications';
import { canExact, openExactSettings } from '../../modules/hayya-ongoing';
import { detectLocation } from '../location';
import { save } from '../storage';

// İlk kurulum: 1) Hoş geldiniz  2) Bildirim ve alarm izinleri  3) Konum
export default function Onboarding({ onDone, setLoc, setNotifOk, dark }) {
  const [step, setStep] = useState(0);
  const [notif, setNotif] = useState(false);
  const [exact, setExact] = useState(() => canExact());
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState(null);
  const [err, setErr] = useState('');

  const refresh = async () => { const g = await notifGranted(); setNotif(g); setNotifOk(g); setExact(canExact()); };
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refresh(); });
    return () => sub.remove();
  }, []);

  const askNotif = async () => { await save('askedNotif', true); await askNotifPermission(); refresh(); };
  const gps = async () => {
    setErr(''); setBusy(true);
    const r = await detectLocation();
    setBusy(false);
    if (r.loc) { setLoc(r.loc); setFound(r.loc.name); } else setErr(r.error);
  };

  if (step === 0) {
    return (
      <SafeAreaView style={s.welcome}>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/icon.png')} style={s.logo} />
          <Text style={s.wTitle}>Hayya{'’'}ya{'\n'}Hoş Geldiniz</Text>
          <Text style={s.wSub}>Ezan vakitleri, vaktin ayeti ve hadisi, Hayya Radyo, zikirmatik ve kıble bir arada.</Text>
        </View>
        <Dots step={0} light />
        <Pressable style={s.wBtn} onPress={() => setStep(1)}><Text style={s.wBtnT}>Başla</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={s.page}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={s.icon}>🔔</Text>
          <Text style={s.title}>Ezan vakitlerini kaçırmayın</Text>
          <Text style={s.sub}>Vakit girdiğinde ezan okunabilmesi ve hatırlatma yapılabilmesi için iki izin gerekiyor.</Text>
          <Perm done={notif} title="Bildirimler" desc="Ezan, vakit ve hatırlatma bildirimleri" onPress={askNotif} />
          <Perm done={exact} title="Alarmlar ve hatırlatıcılar" desc="Ezanın gecikmeden, tam vaktinde okunması" onPress={openExactSettings} />
          {!exact && <Text style={s.note}>"İzin ver"e dokununca açılan sayfada anahtarı açıp geri dönün.</Text>}
        </View>
        <Dots step={1} />
        <Pressable style={s.btn} onPress={() => setStep(2)}><Text style={s.btnT}>{notif && exact ? 'Devam' : 'Devam et'}</Text></Pressable>
        {!(notif && exact) && <Text style={s.later}>İzinleri daha sonra Menü → Ezan ve Bildirimler{'’'}den de açabilirsiniz.</Text>}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={s.icon}>📍</Text>
        <Text style={s.title}>Vakitler için konumunuz</Text>
        <Text style={s.sub}>Namaz vakitleri ve kıble yönü bulunduğunuz yere göre hesaplanır. Konumunuz yalnızca telefonunuzda kullanılır, hiçbir yere gönderilmez.</Text>
        {found ? (
          <View style={[s.perm, { borderColor: C.ok }]}>
            <Text style={[s.permT, { color: C.ok }]}>✓ {found}</Text>
            <Text style={s.permD}>Vakitler bu konuma göre gösterilecek.</Text>
          </View>
        ) : (
          <Pressable style={[s.btn, { marginTop: 22 }]} onPress={gps} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>📍 Konumumu kullan</Text>}
          </Pressable>
        )}
        {err ? <Text style={[s.note, { color: C.bad }]}>{err}</Text> : null}
      </View>
      <Dots step={2} />
      {found ? (
        <Pressable style={s.btn} onPress={() => onDone(false)}><Text style={s.btnT}>Başlayalım</Text></Pressable>
      ) : (
        <Pressable style={[s.btn, s.ghost]} onPress={() => onDone(true)}><Text style={[s.btnT, { color: C.green }]}>Şehri listeden seçeceğim</Text></Pressable>
      )}
    </SafeAreaView>
  );
}

function Perm({ done, title, desc, onPress }) {
  return (
    <View style={[s.perm, done && { borderColor: C.ok }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.permT, done && { color: C.ok }]}>{done ? '✓ ' : ''}{title}</Text>
        <Text style={s.permD}>{desc}</Text>
      </View>
      {!done && <Pressable style={s.permBtn} onPress={onPress}><Text style={s.permBtnT}>İzin ver</Text></Pressable>}
    </View>
  );
}

function Dots({ step, light }) {
  return (
    <View style={s.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.dot, { backgroundColor: light ? 'rgba(255,255,255,0.4)' : C.line }, i === step && { backgroundColor: light ? '#fff' : C.green, width: 22 }]} />
      ))}
    </View>
  );
}

const s = themed(() => ({
  welcome: { flex: 1, backgroundColor: '#1F5A4A', paddingHorizontal: 28, paddingBottom: 24 },
  logo: { width: 120, height: 120, borderRadius: 30, marginBottom: 28 },
  wTitle: { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', lineHeight: 42 },
  wSub: { color: '#F1E4C2', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 16, lineHeight: 23 },
  wBtn: { backgroundColor: '#fff', borderRadius: 18, paddingVertical: 17, alignItems: 'center' },
  wBtnT: { color: '#1F5A4A', fontSize: 18, fontWeight: '900' },
  page: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingBottom: 24 },
  icon: { fontSize: 54, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: C.green, textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 15, fontWeight: '600', color: C.muted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  perm: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, borderRadius: 18, padding: 16, marginTop: 16 },
  permT: { fontSize: 16, fontWeight: '900', color: C.ink },
  permD: { fontSize: 13, fontWeight: '600', color: C.muted, marginTop: 2 },
  permBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  permBtnT: { color: '#fff', fontWeight: '900', fontSize: 14 },
  note: { fontSize: 13, fontWeight: '600', color: C.muted, textAlign: 'center', marginTop: 12 },
  btn: { backgroundColor: C.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  ghost: { backgroundColor: C.card, borderWidth: 2, borderColor: C.green },
  btnT: { color: '#fff', fontSize: 17, fontWeight: '900' },
  later: { fontSize: 12, fontWeight: '600', color: C.muted, textAlign: 'center', marginTop: 10 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
}));
