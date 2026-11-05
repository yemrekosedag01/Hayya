import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Modal, FlatList, ActivityIndicator, TextInput } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle, Path, Text as SvgText, G, Rect } from 'react-native-svg';
import { C } from '../theme';
import { CITIES, KEYS, hm, prayerTimes, trNow, addDays, qibla } from '../prayer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Card, u } from './ui';

const SHORT = { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' };

export default function TimesScreen({ loc, setLoc }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [heading, setHeading] = useState(null);
  const [query, setQuery] = useState('');
  const q2 = query.trim().toLocaleLowerCase('tr');
  const list = q2 ? CITIES.filter((c) => c.name.toLocaleLowerCase('tr').includes(q2)) : CITIES;

  const q = qibla(loc.lat, loc.lng);
  const today = trNow();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Pusula: telefonun yönünü dinle (izin varsa)
  useEffect(() => {
    let sub;
    (async () => {
      const p = await Location.getForegroundPermissionsAsync();
      if (!p.granted) return;
      try {
        sub = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
      } catch (e) {}
    })();
    return () => sub && sub.remove();
  }, [loc]);

  const closePicker = () => { setPicker(false); setQuery(''); setErr(''); };

  const useGps = async () => {
    setErr(''); setBusy(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) { setErr('Konum izni verilmedi. Listeden şehir seçebilirsiniz.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let name = 'Konumum';
      try {
        const [g] = await Location.reverseGeocodeAsync(pos.coords);
        if (g) name = g.subregion || g.district || g.city || g.region || name;
      } catch (e) {}
      setLoc({ name, lat: pos.coords.latitude, lng: pos.coords.longitude });
      closePicker();
    } catch (e) {
      setErr('Konum alınamadı. Konum servisinin açık olduğundan emin olun.');
    } finally {
      setBusy(false);
    }
  };

  const needle = heading == null ? q : q - heading;

  return (
    <ScrollView contentContainerStyle={u.page}>
      <Text style={u.h2}>Namaz Vakitleri</Text>
      <Pressable style={s.sel} onPress={() => setPicker(true)}>
        <Text style={s.selTxt}>📍 {loc.name}</Text>
        <Text style={s.selCh}>Değiştir ›</Text>
      </Pressable>

      <Card title="🗓️ 7 Günlük Takvim">
        <View style={[s.tr, s.th]}>
          <Text style={[s.c0, s.thT]}>Gün</Text>
          {KEYS.map((k) => <Text key={k} style={[s.c, s.thT]}>{SHORT[k]}</Text>)}
        </View>
        {days.map((d, i) => {
          const t = prayerTimes(d, loc.lat, loc.lng);
          let lbl = 'Bugün';
          if (i > 0) {
            try { lbl = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d.date); }
            catch (e) { lbl = `${d.d}.${d.m}`; }
          }
          return (
            <View key={i} style={[s.tr, i === 0 && { backgroundColor: C.goldSoft }]}>
              <Text style={s.c0}>{lbl}</Text>
              {KEYS.map((k) => <Text key={k} style={s.c}>{hm(t[k])}</Text>)}
            </View>
          );
        })}
      </Card>

      <Card title="🕋 Kıble Yönü">
        <View style={s.qRow}>
          <Svg width={120} height={120} viewBox="0 0 110 110">
            <Circle cx="55" cy="55" r="50" fill={C.card} stroke={C.line} strokeWidth="3" />
            <G rotation={heading == null ? 0 : -heading} origin="55, 55">
              <SvgText x="55" y="18" textAnchor="middle" fontSize="12" fontWeight="900" fill={C.bad}>K</SvgText>
              <SvgText x="96" y="59" textAnchor="middle" fontSize="11" fill={C.muted}>D</SvgText>
              <SvgText x="55" y="100" textAnchor="middle" fontSize="11" fill={C.muted}>G</SvgText>
              <SvgText x="14" y="59" textAnchor="middle" fontSize="11" fill={C.muted}>B</SvgText>
            </G>
            <G rotation={needle} origin="55, 55">
              <Path d="M55 20 L62 55 L55 50 L48 55 Z" fill={C.green} />
              <Rect x="50" y="12" width="10" height="9" rx="1.5" fill={C.ink} />
            </G>
            <Circle cx="55" cy="55" r="4" fill={C.gold} />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={s.qDeg}>{Math.round(q)}°</Text>
            <Text style={u.src}>
              {heading == null
                ? 'Kuzeyden saat yönünde. Canlı pusula için konum izni verin.'
                : 'Telefonu düz tutun; yeşil ok kıbleyi gösterir. Metal eşyalardan uzak durun.'}
            </Text>
          </View>
        </View>
      </Card>
      <Text style={[u.src, { marginTop: 12 }]}>Vakitler Diyanetin kullandığı Türkiye yöntemiyle telefonda hesaplanır; internet gerekmez.</Text>

      <Modal visible={picker} animationType="slide" onRequestClose={closePicker}>
        <SafeAreaProvider>
          <SafeAreaView style={s.sheet} edges={['top', 'bottom', 'left', 'right']}>
            <View style={s.sheetHead}>
              <Text style={[u.h2, { marginBottom: 0 }]}>Konum seç</Text>
              <Pressable onPress={closePicker} style={s.close} accessibilityLabel="Kapat">
                <Text style={s.closeTxt}>Kapat</Text>
              </Pressable>
            </View>
            <Pressable style={[u.btn, { marginTop: 12, marginBottom: 10 }]} onPress={useGps} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={u.btnTxt}>📡 Konumumu kullan</Text>}
            </Pressable>
            {err ? <Text style={s.err}>{err}</Text> : null}
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Şehir ara (81 il)"
              placeholderTextColor={C.muted}
              style={s.search}
              autoCorrect={false}
              accessibilityLabel="Şehir ara"
            />
            <FlatList
              style={{ flex: 1 }}
              data={list}
              keyExtractor={(c) => c.name}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={<Text style={[u.src, { marginTop: 16 }]}>Bu isimde bir il bulunamadı.</Text>}
              renderItem={({ item }) => (
                <Pressable style={s.cityRow} onPress={() => { setLoc(item); closePicker(); }}>
                  <Text style={s.cityTxt}>{item.name === loc.name ? '✓ ' : ''}{item.name}</Text>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  sel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14 },
  selTxt: { fontSize: 16, fontWeight: '800', color: C.ink },
  selCh: { fontSize: 14, fontWeight: '800', color: C.green },
  tr: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line, borderStyle: 'dashed' },
  th: { marginTop: 8 },
  thT: { fontSize: 10, color: C.muted, fontWeight: '900' },
  c0: { width: 52, fontSize: 12, fontWeight: '800', color: C.ink, paddingLeft: 4 },
  c: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  qDeg: { fontSize: 28, fontWeight: '900', color: C.ink, marginBottom: 2 },
  sheet: { flex: 1, backgroundColor: C.card, paddingHorizontal: 16, paddingTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bg },
  closeTxt: { fontSize: 15, fontWeight: '800', color: C.green },
  cityRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  cityTxt: { fontSize: 16, fontWeight: '700', color: C.ink },
  err: { color: C.bad, fontWeight: '700', marginBottom: 8 },
  search: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: C.ink, backgroundColor: C.bg, marginBottom: 6 },
});
