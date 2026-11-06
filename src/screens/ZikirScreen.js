import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, Vibration, Alert } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  const [down, setDown] = useState(false);

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
    <View style={{ flex: 1 }}>
      {/* Üst şerit: zikir seçimi ve hedef (dokunma alanının dışında) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
        {ZIKIRLER.map((x) => (
          <Pressable key={x.id} onPress={() => update({ ...st, sel: x.id })} style={[s.chip, x.id === st.sel && s.chipOn]}>
            <Text style={[s.chipT, x.id === st.sel && { color: '#fff' }]}>{x.id === 'tesbihat' ? 'Tesbihat' : x.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.bar2}>
        {!isT ? <Seg items={TARGETS} value={st.target} onChange={(t) => update({ ...st, target: t })} /> : <Text style={u.src}>33 · 33 · 33</Text>}
        <Pressable onPress={reset} style={s.reset} hitSlop={8}><Text style={s.resetT}>↺ Sıfırla</Text></Pressable>
      </View>

      {/* Ekranın geri kalanı: nereye dokunulursa sayar */}
      <Pressable onPressIn={() => { setDown(true); tap(); }} onPressOut={() => setDown(false)} style={s.area} accessibilityLabel="Zikir say" accessibilityRole="button">
        <Text style={s.zName}>{label}</Text>
        <Text style={s.zMean}>{isT && !done ? z.ar.split(' · ')[phase] : z.ar}</Text>
        <Device count={isT ? inPhase : count} down={down} done={done} />
        <Text style={s.of}>
          {isT ? `${done ? 3 : phase + 1}. bölüm · toplam ${count}/99` : target > 0 ? `${count} / ${target}` : `toplam ${count}`}
        </Text>
        {target > 0 && <View style={s.prog}><View style={[s.fill, { width: `${Math.min(100, (count / target) * 100)}%` }]} /></View>}
        <Text style={s.hint}>{done ? '✅ Hedefe ulaştın · Allah kabul etsin' : 'Ekranın herhangi bir yerine dokun'}</Text>
      </Pressable>
    </View>
  );
}

/** Zikirmatik cihazı (çizim). */
function Device({ count, down, done }) {
  const digits = String(count % 100000).padStart(5, '0');
  return (
    <Svg width={230} height={300} viewBox="0 0 200 260" style={{ marginVertical: 8 }}>
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2E7A63" />
          <Stop offset="1" stopColor="#163F34" />
        </LinearGradient>
        <LinearGradient id="btn" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={down ? '#A8852F' : '#E2BF66'} />
          <Stop offset="1" stopColor={down ? '#8A6A1F' : '#B48E36'} />
        </LinearGradient>
      </Defs>
      {/* halka */}
      <Circle cx="100" cy="246" r="10" fill="none" stroke="#163F34" strokeWidth="5" />
      {/* gövde */}
      <Path d="M100 8 C165 8 188 60 188 120 C188 190 150 238 100 238 C50 238 12 190 12 120 C12 60 35 8 100 8 Z" fill="url(#body)" />
      <Path d="M100 16 C155 16 178 62 178 118" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* ekran */}
      <Rect x="40" y="48" width="120" height="50" rx="8" fill="#0E2A22" />
      <Rect x="45" y="53" width="110" height="40" rx="5" fill={done ? '#CFE8C4' : '#C7D6AE'} />
      <SvgText x="100" y="84" textAnchor="middle" fontSize="30" fontWeight="bold" fontFamily="monospace" fill="#2A3A20" fillOpacity="0.12" letterSpacing="2">88888</SvgText>
      <SvgText x="100" y="84" textAnchor="middle" fontSize="30" fontWeight="bold" fontFamily="monospace" fill="#1E2B16" letterSpacing="2">{digits}</SvgText>
      {/* küçük sıfırlama düğmesi (süs) */}
      <Circle cx="160" cy="118" r="7" fill="#0E2A22" />
      <Circle cx="160" cy="118" r="5" fill="#C9A24A" />
      {/* büyük sayma düğmesi */}
      <Circle cx="100" cy="168" r="46" fill="#0E2A22" />
      <Circle cx="100" cy={down ? 170 : 166} r="40" fill="url(#btn)" />
      <Circle cx="100" cy={down ? 170 : 166} r="40" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" />
    </Svg>
  );
}

const s = themed(() => ({
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipT: { fontSize: 13, fontWeight: '800', color: C.ink },
  bar2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  reset: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  resetT: { fontSize: 13, fontWeight: '800', color: C.green },
  area: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  zName: { fontSize: 22, fontWeight: '900', color: C.green, textAlign: 'center' },
  zMean: { fontSize: 13, fontWeight: '700', color: C.muted, textAlign: 'center', marginTop: 4 },
  of: { fontSize: 15, fontWeight: '800', color: C.ink },
  prog: { alignSelf: 'stretch', height: 8, backgroundColor: C.line, borderRadius: 99, overflow: 'hidden', marginTop: 10, marginHorizontal: 20 },
  fill: { height: '100%', backgroundColor: C.gold },
  hint: { fontSize: 13, fontWeight: '700', color: C.muted, marginTop: 10 },
}));
