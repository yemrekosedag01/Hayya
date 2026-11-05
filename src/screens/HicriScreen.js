import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { C, themed } from '../theme';
import { trNow } from '../prayer';
import { toHijri, hijriText, miladiText, hijriMonthDays, numToYmd, HMONTHS, GMONTHS, WDAYS, ymdNum, upcomingDini } from '../hijri';
import { u } from './ui';

export default function HicriScreen() {
  const today = ymdNum(trNow());
  const [ref, setRef] = useState(today); // gösterilen hicri ayın içindeki bir gün
  const days = hijriMonthDays(ref);
  const h = toHijri(days[0]);
  const dini = {};
  for (const x of upcomingDini(days[0])) if (x.n <= days[days.length - 1]) (dini[x.n] = dini[x.n] || []).push(x.name);

  return (
    <ScrollView contentContainerStyle={u.page}>
      <View style={s.hero}>
        <Text style={s.heroL}>Bugün</Text>
        <Text style={s.heroH}>{hijriText(today)}</Text>
        <Text style={s.heroM}>{miladiText(today)}</Text>
      </View>

      <View style={s.nav}>
        <Pressable style={s.navB} onPress={() => setRef(days[0] - 1)} hitSlop={8}><Text style={s.navT}>‹</Text></Pressable>
        <Text style={s.month}>{HMONTHS[h.hm - 1]} {h.hy}</Text>
        <Pressable style={s.navB} onPress={() => setRef(days[days.length - 1] + 1)} hitSlop={8}><Text style={s.navT}>›</Text></Pressable>
      </View>
      {ref !== today && !days.includes(today) && (
        <Pressable onPress={() => setRef(today)}><Text style={s.back}>Bu aya dön</Text></Pressable>
      )}

      <View style={s.card}>
        {days.map((n, i) => {
          const g = numToYmd(n);
          const isToday = n === today;
          return (
            <View key={n} style={[s.row, isToday && s.today, i === days.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.hd}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.gd}>{g.d} {GMONTHS[g.m - 1]} {g.y}</Text>
                {dini[n] && <Text style={s.ev}>🌙 {dini[n].join(' · ')}</Text>}
              </View>
              <Text style={[s.wd, g.wd === 5 && { color: C.green }]}>{WDAYS[g.wd]}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[u.tip, { marginTop: 12 }]}>Hicri tarihler Diyanet İşleri Başkanlığı takvimine göredir.</Text>
    </ScrollView>
  );
}

const s = themed(() => ({
  hero: { backgroundColor: C.primary, borderRadius: 24, padding: 20, alignItems: 'center' },
  heroL: { color: '#fff', opacity: 0.85, fontSize: 13, fontWeight: '700' },
  heroH: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2, textAlign: 'center' },
  heroM: { color: '#fff', opacity: 0.9, fontSize: 14, fontWeight: '600', marginTop: 2 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  navB: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  navT: { fontSize: 24, fontWeight: '900', color: C.green, marginTop: -2 },
  month: { fontSize: 19, fontWeight: '900', color: C.ink },
  back: { textAlign: 'center', color: C.green, fontWeight: '800', marginTop: 8 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 12, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  today: { backgroundColor: C.goldSoft, marginHorizontal: -12, paddingHorizontal: 12 },
  hd: { width: 30, fontSize: 18, fontWeight: '900', color: C.green, textAlign: 'center' },
  gd: { fontSize: 15, fontWeight: '700', color: C.ink },
  ev: { fontSize: 12, fontWeight: '800', color: C.goldInk, marginTop: 2 },
  wd: { fontSize: 13, fontWeight: '700', color: C.muted },
}));
