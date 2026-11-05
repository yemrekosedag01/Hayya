import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, Vibration, Alert } from 'react-native';
import { C, themed } from '../theme';
import { load, save } from '../storage';
import { Seg, u } from './ui';

export const ZIKIRLER = [
  { id: 'tesbihat', name: 'Namaz sonrası tesbihat', ar: '33 Sübhanallah · 33 Elhamdülillah · 33 Allahu Ekber' },
  { id: 'subhanallah', name: 'Sübhanallah', ar: 'Allah her türlü eksiklikten uzaktır' },
  { id: 'elhamdulillah', name: 'Elhamdülillah', ar: 'Hamd Allah’a mahsustur' },
  { id: 'allahuekber', name: 'Allahu Ekber', ar: 'Allah en büyüktür' },
  { id: 'tevhid', name: 'Lâ ilâhe illallah', ar: 'Allah’tan başka ilah yoktur' },
  { id: 'istigfar', name: 'Estağfirullah', ar: 'Allah’tan bağışlanma dilerim' },
  { id: 'salavat', name: 'Allâhümme salli alâ Muhammed', ar: 'Allah’ım, Muhammed’e salât eyle' },
  { id: 'serbest', name: 'Serbest zikir', ar: 'Kendi zikrin için sayaç' },
];
const TESBIHAT = ['Sübhanallah', 'Elhamdülillah', 'Allahu Ekber'];
const TARGETS = [[33, '33'], [99, '99'], [100, '100'], [0, 'Sınırsız']];

export default function ZikirScreen({ vibZikir }) {
  const [st, setSt] = useState(null);
  const saveT = useRef(null);

  useEffect(() => { load('zikir', null).then((v) => setSt(v || { sel: 'tesbihat', target: 33, counts: {} })); }, []);
  const update = (next) => {
    setSt(next);
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => save('zikir', next), 400);
  };
  useEffect(() => () => { clearTimeout(saveT.current); }, []);
  if (!st) return null;

  const z = ZIKIRLER.find((x) => x.id === st.sel) || ZIKIRLER[0];
  const isT = z.id === 'tesbihat';
  const count = st.counts[z.id] || 0;
  const target = isT ? 99 : st.target;
  const done = target > 0 && count >= target;
  // Tesbihat: 0-32 Sübhanallah, 33-65 Elhamdülillah, 66-98 Allahu Ekber
  const phase = Math.min(2, Math.floor(count / 33));
  const inPhase = done ? 33 : count - phase * 33;
  const label = isT ? (done ? 'Tesbihat tamamlandı' : TESBIHAT[phase]) : z.name;

  const tap = () => {
    if (done) return;
    const c = count + 1;
    if (vibZikir) {
      const reached = (target > 0 && c >= target) || (isT && c % 33 === 0);
      Vibration.vibrate(reached ? 500 : 18);
    }
    update({ ...st, counts: { ...st.counts, [z.id]: c } });
  };
  const reset = () => Alert.alert('Sıfırla', `"${z.name}" sayacı sıfırlansın mı?`, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sıfırla', style: 'destructive', onPress: () => update({ ...st, counts: { ...st.counts, [z.id]: 0 } }) },
  ]);

  return (
    <ScrollView contentContainerStyle={u.page}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {ZIKIRLER.map((x) => (
          <Pressable key={x.id} onPress={() => update({ ...st, sel: x.id })} style={[s.chip, x.id === st.sel && s.chipOn]}>
            <Text style={[s.chipT, x.id === st.sel && { color: '#fff' }]}>{x.id === 'tesbihat' ? 'Tesbihat' : x.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={tap} style={[s.pad, done && { borderColor: C.ok }]} accessibilityLabel="Zikir say">
        <Text style={s.zName}>{label}</Text>
        <Text style={s.zMean}>{isT && !done ? z.ar.split(' · ')[phase] : z.ar}</Text>
        <Text style={s.count}>{isT ? inPhase : count}</Text>
        <Text style={s.of}>
          {isT ? `${done ? 3 : phase + 1}. bölüm · toplam ${count}/99` : target > 0 ? `hedef ${target}` : 'sınırsız'}
        </Text>
        {target > 0 && (
          <View style={s.bar}><View style={[s.fill, { width: `${Math.min(100, (count / target) * 100)}%` }]} /></View>
        )}
        <Text style={s.hint}>{done ? '✅ Hedefe ulaştın · Allah kabul etsin' : 'Saymak için dokun'}</Text>
      </Pressable>

      {!isT && (
        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={[u.src, { marginBottom: 6 }]}>Hedef</Text>
          <Seg items={TARGETS} value={st.target} onChange={(t) => update({ ...st, target: t })} />
        </View>
      )}
      <Pressable style={[u.btn, u.btnGhost]} onPress={reset}>
        <Text style={[u.btnTxt, { color: C.green }]}>↺ Sayacı sıfırla</Text>
      </Pressable>
      <Text style={[u.tip, { textAlign: 'center' }]}>Sayılar kaydedilir; uygulamayı kapatsan da kaldığın yerden devam edersin.{vibZikir ? '' : ' Titreşim Ayarlar’dan açılabilir.'}</Text>
    </ScrollView>
  );
}

const s = themed(() => ({
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipT: { fontSize: 13, fontWeight: '800', color: C.ink },
  pad: { marginTop: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, borderRadius: 28, paddingVertical: 34, paddingHorizontal: 18, alignItems: 'center', minHeight: 340, justifyContent: 'center' },
  zName: { fontSize: 22, fontWeight: '900', color: C.green, textAlign: 'center' },
  zMean: { fontSize: 13, fontWeight: '700', color: C.muted, textAlign: 'center', marginTop: 4 },
  count: { fontSize: 88, fontWeight: '900', color: C.ink, fontVariant: ['tabular-nums'], marginTop: 10 },
  of: { fontSize: 14, fontWeight: '800', color: C.muted },
  bar: { alignSelf: 'stretch', height: 8, backgroundColor: C.line, borderRadius: 99, overflow: 'hidden', marginTop: 16 },
  fill: { height: '100%', backgroundColor: C.gold },
  hint: { fontSize: 13, fontWeight: '700', color: C.muted, marginTop: 14 },
}));
