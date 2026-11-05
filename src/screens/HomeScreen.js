import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { KEYS, NAMES, hm, nextPrayer, trNow, vakitSlot } from '../prayer';
import { Card, u } from './ui';
import { pickForSlot } from '../content';

const dayIndex = () => {
  const n = trNow();
  return Math.floor(Date.UTC(n.y, n.m - 1, n.d) / 864e5);
};

function formatDates() {
  const d = trNow().date;
  let g = '', h = '';
  try { g = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' }).format(d); } catch (e) {}
  try { h = new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d); } catch (e) {}
  return [g, h].filter(Boolean).join(' · ');
}

export default function HomeScreen({ loc, content, go }) {
  const [np, setNp] = useState(() => nextPrayer(loc));
  useEffect(() => {
    setNp(nextPrayer(loc));
    const id = setInterval(() => setNp(nextPrayer(loc)), 1000);
    return () => clearInterval(id);
  }, [loc]);

  const left = np.secondsLeft;
  const count = [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((x) => String(x).padStart(2, '0')).join(':');
  const di = dayIndex();
  const slot = vakitSlot(loc); // her vakit (günde 5 kez) değişir
  const ayet = pickForSlot(content.ayetler, slot); // vakte uygun ayet
  const hadis = pickForSlot(content.hadisler, slot);
  const ders = content.dersler.length ? content.dersler[di % content.dersler.length] : null;

  return (
    <ScrollView contentContainerStyle={u.page}>
      <View style={s.hero}>
        <Text style={s.lbl}>Sonraki vakit</Text>
        <Text style={s.next}>{NAMES[np.key]} · {hm(np.at)}</Text>
        <Text style={s.count}>{count}</Text>
        <Text style={s.meta}>{formatDates()}</Text>
      </View>

      <View style={s.times}>
        {KEYS.map((k) => (
          <View key={k} style={[s.t, k === np.current && s.tCur]}>
            <Text style={[s.tName, k === np.current && { color: '#8a6a1f' }]}>{NAMES[k]}</Text>
            <Text style={s.tVal}>{hm(np.today[k])}</Text>
          </View>
        ))}
      </View>

      {ayet && (
        <Card title="📖 Vaktin Ayeti">
          <Text style={u.quote}>“{ayet.text}”</Text>
          <Text style={u.src}>{ayet.src}</Text>
        </Card>
      )}
      {hadis && (
        <Card title="🌿 Vaktin Hadisi">
          <Text style={u.quote}>“{hadis.text}”</Text>
          <Text style={u.src}>{hadis.src}</Text>
        </Card>
      )}

      <View style={s.row}>
        {ders && (
          <Pressable style={s.mini} onPress={() => go('dersler')}>
            <Text style={{ fontSize: 22 }}>📚</Text>
            <Text style={s.miniT}>Bugünün dersi</Text>
            <Text style={s.miniS}>{ders.title}</Text>
          </Pressable>
        )}
        {content.sorular.length > 0 && (
          <Pressable style={s.mini} onPress={() => go('quiz')}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
            <Text style={s.miniT}>Günlük quiz</Text>
            <Text style={s.miniS}>5 soru · kendini dene</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: C.green, borderRadius: 24, padding: 20 },
  lbl: { color: '#fff', opacity: 0.85, fontSize: 13, fontWeight: '700' },
  next: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  count: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: 1, fontVariant: ['tabular-nums'], marginVertical: 2 },
  meta: { color: '#fff', opacity: 0.9, fontSize: 13, fontWeight: '600' },
  times: { flexDirection: 'row', gap: 6, marginTop: 14 },
  t: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 9, alignItems: 'center' },
  tCur: { backgroundColor: C.goldSoft, borderColor: C.gold },
  tName: { fontSize: 11, color: C.muted, fontWeight: '800' },
  tVal: { fontSize: 15, fontWeight: '900', color: C.ink, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  mini: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14 },
  miniT: { fontSize: 15, fontWeight: '800', marginTop: 6, color: C.ink },
  miniS: { fontSize: 12, color: C.muted, fontWeight: '600' },
});
