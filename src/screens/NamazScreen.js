import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { C, themed } from '../theme';
import { trNow, addDays, prayerTimes } from '../prayer';
import { PRAYERS, KAZA, dayKey, toggle, countDay } from '../namaz';
import { GMONTHS, WDAYS, ymdNum, numToYmd } from '../hijri';
import { Card, u } from './ui';

export default function NamazScreen({ loc, namaz, setNamaz, kaza, setKaza }) {
  const today = trNow();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const tTimes = prayerTimes(today, loc.lat, loc.lng);
  const nowMin = today.sec / 60;
  const week = days.reduce((a, d) => a + countDay(namaz, dayKey(d)), 0);
  // Seri: bugünden (bugün tamamsa) ya da dünden geriye 5/5 kılınan günler
  let streak = 0;
  for (let i = countDay(namaz, dayKey(today)) === 5 ? 0 : 1; i < 400; i++) {
    if (countDay(namaz, dayKey(addDays(today, -i))) === 5) streak++; else break;
  }
  const kazaTotal = KAZA.reduce((a, [k]) => a + (kaza[k] || 0), 0);

  return (
    <ScrollView contentContainerStyle={u.page}>
      <View style={s.stats}>
        <Stat n={`${countDay(namaz, dayKey(today))}/5`} l="Bugün" />
        <Stat n={`${week}/35`} l="Son 7 gün" />
        <Stat n={streak} l="Gün seri" />
      </View>
      <Text style={[u.tip, { textAlign: 'center' }]}>
        {week >= 30 ? 'Maşallah, devam! 🌿' : week >= 15 ? 'Güzel gidiyor, Allah kabul etsin.' : 'Her vakit yeni bir başlangıçtır. 🌱'}
      </Text>

      <Card title="✅ Son 7 gün">
        <View style={[s.tr, { borderBottomWidth: 0 }]}>
          <Text style={[s.c0, s.th]}>Gün</Text>
          {PRAYERS.map(([k, n]) => <Text key={k} style={[s.c, s.th]}>{n}</Text>)}
        </View>
        {days.map((d, i) => {
          const key = dayKey(d);
          const g = numToYmd(ymdNum(d));
          return (
            <View key={key} style={s.tr}>
              <Text style={s.c0}>{i === 0 ? 'Bugün' : i === 1 ? 'Dün' : `${g.d} ${GMONTHS[g.m - 1].slice(0, 3)}`}{'\n'}<Text style={s.wd}>{WDAYS[g.wd].slice(0, 3)}</Text></Text>
              {PRAYERS.map(([k]) => {
                const on = !!(namaz[key] && namaz[key][k]);
                const future = i === 0 && nowMin < tTimes[k];
                return (
                  <Pressable key={k} disabled={future} onPress={() => setNamaz(toggle(namaz, key, k))} style={s.c} hitSlop={4}>
                    <View style={[s.box, on && s.boxOn, future && { opacity: 0.3 }]}><Text style={s.boxT}>{on ? '✓' : ''}</Text></View>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        <Text style={u.tip}>Kıldığınız namazı işaretleyin. Geçmiş günleri de düzeltebilirsiniz.</Text>
      </Card>

      <Kaza kaza={kaza} setKaza={setKaza} total={kazaTotal} />
    </ScrollView>
  );
}

function Stat({ n, l }) {
  return (
    <View style={s.stat}>
      <Text style={s.statN}>{n}</Text>
      <Text style={s.statL}>{l}</Text>
    </View>
  );
}

function Kaza({ kaza, setKaza, total }) {
  const [years, setYears] = useState('');
  const add = (k, d) => setKaza({ ...kaza, [k]: Math.max(0, (kaza[k] || 0) + d) });
  const calc = () => {
    const y = parseFloat(String(years).replace(',', '.'));
    if (!isFinite(y) || y <= 0) return;
    const n = Math.round(y * 365);
    Alert.alert('Kaza ekle', `Her namaz için ${n} kaza eklensin mi? (${y} yıl)`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ekle', onPress: () => { const next = { ...kaza }; KAZA.forEach(([k]) => { next[k] = (next[k] || 0) + n; }); setKaza(next); setYears(''); } },
    ]);
  };
  return (
    <Card title="🕰️ Kaza namazı takibi">
      <Text style={s.total}>{total}</Text>
      <Text style={[u.src, { textAlign: 'center' }]}>toplam kaza borcu</Text>
      {KAZA.map(([k, n]) => (
        <View key={k} style={s.kRow}>
          <Text style={s.kName}>{n}</Text>
          <Pressable style={s.kBtn} onPress={() => add(k, 1)} hitSlop={4}><Text style={s.kBtnT}>＋</Text></Pressable>
          <Text style={s.kNum}>{kaza[k] || 0}</Text>
          <Pressable style={[s.kBtn, s.kDone]} onPress={() => add(k, -1)} disabled={!kaza[k]} hitSlop={4}>
            <Text style={[s.kBtnT, { color: '#fff', fontSize: 13 }]}>Kıldım</Text>
          </Pressable>
        </View>
      ))}
      <Text style={[u.src, { marginTop: 14 }]}>Kaç yıllık kazanız var? (yaklaşık)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <TextInput value={years} onChangeText={setYears} keyboardType="decimal-pad" placeholder="ör. 2" placeholderTextColor={C.muted} style={s.input} />
        <Pressable style={[u.btn, { marginTop: 0, flex: 1 }]} onPress={calc}><Text style={u.btnTxt}>Hesapla ve ekle</Text></Pressable>
      </View>
      <Text style={u.tip}>"Kıldım" her dokunuşta o namazın kazasını bir azaltır. Kaza borcunun hesabı için bir hocaya danışmanız tavsiye edilir.</Text>
    </Card>
  );
}

const s = themed(() => ({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: C.primary, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  statN: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statL: { color: '#fff', opacity: 0.85, fontSize: 12, fontWeight: '700', marginTop: 2 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  th: { fontSize: 11, color: C.muted, fontWeight: '900', textAlign: 'center' },
  c0: { width: 58, fontSize: 12, fontWeight: '800', color: C.ink },
  wd: { fontSize: 10, fontWeight: '700', color: C.muted },
  c: { flex: 1, alignItems: 'center' },
  box: { width: 30, height: 30, borderRadius: 9, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.ok, borderColor: C.ok },
  boxT: { color: '#fff', fontWeight: '900', fontSize: 16 },
  total: { fontSize: 40, fontWeight: '900', color: C.green, textAlign: 'center', marginTop: 8 },
  kRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  kName: { flex: 1, fontSize: 16, fontWeight: '800', color: C.ink },
  kBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  kBtnT: { fontSize: 18, fontWeight: '900', color: C.green },
  kNum: { minWidth: 56, textAlign: 'center', fontSize: 18, fontWeight: '900', color: C.ink, fontVariant: ['tabular-nums'] },
  kDone: { width: 70, backgroundColor: C.primary, borderColor: C.primary },
  input: { width: 80, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 12, fontSize: 16, color: C.ink, backgroundColor: C.bg },
}));
