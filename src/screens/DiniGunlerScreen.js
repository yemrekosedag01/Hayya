import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { C, themed } from '../theme';
import { trNow } from '../prayer';
import { upcomingDini, hijriText, miladiText, ymdNum } from '../hijri';
import { Card, u } from './ui';

const ICON = { kandil: '🕯️', bayram: '🎉', ay: '🌙', gun: '🤲' };

export default function DiniGunlerScreen() {
  const today = ymdNum(trNow());
  const list = upcomingDini(today);
  const next = list[0];
  const left = next ? next.n - today : 0;
  return (
    <ScrollView contentContainerStyle={u.page}>
      {next ? (
        <View style={s.hero}>
          <Text style={s.heroL}>Sıradaki</Text>
          <Text style={s.heroN}>{ICON[next.kind]} {next.name}</Text>
          <Text style={s.heroD}>{left === 0 ? 'Bugün' : left === 1 ? 'Yarın' : `${left} gün kaldı`}</Text>
          <Text style={s.heroM}>{miladiText(next.n)} · {hijriText(next.n)}</Text>
        </View>
      ) : null}
      <Card title="📅 Yaklaşan dini günler">
        {list.map((x, i) => (
          <View key={x.n + x.name} style={[s.row, i === list.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={s.icon}>{ICON[x.kind]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, x.kind === 'kandil' && { color: C.goldInk }]}>{x.name}</Text>
              <Text style={s.date}>{miladiText(x.n)}</Text>
              <Text style={s.hdate}>{hijriText(x.n)}</Text>
            </View>
            <Text style={s.left}>{x.n - today === 0 ? 'Bugün' : `${x.n - today} gün`}</Text>
          </View>
        ))}
        {!list.length && <Text style={u.empty}>Takvim güncelleniyor.</Text>}
      </Card>
      <Text style={[u.tip, { marginTop: 12 }]}>Tarihler Diyanet İşleri Başkanlığı takvimine göredir. Kandiller, belirtilen günü takip eden gece (o günün akşamı) idrak edilir.</Text>
    </ScrollView>
  );
}

const s = themed(() => ({
  hero: { backgroundColor: C.primary, borderRadius: 24, padding: 20 },
  heroL: { color: '#fff', opacity: 0.85, fontSize: 13, fontWeight: '700' },
  heroN: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
  heroD: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
  heroM: { color: '#fff', opacity: 0.9, fontSize: 13, fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  icon: { fontSize: 22 },
  name: { fontSize: 16, fontWeight: '900', color: C.ink },
  date: { fontSize: 13, fontWeight: '700', color: C.ink, marginTop: 2 },
  hdate: { fontSize: 12, fontWeight: '700', color: C.muted },
  left: { fontSize: 13, fontWeight: '900', color: C.green },
}));
