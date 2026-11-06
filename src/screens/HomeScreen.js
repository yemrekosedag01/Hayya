import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { C, themed } from '../theme';
import { KEYS, NAMES, hm, nextPrayer, trNow, vakitSlot, addDays } from '../prayer';
import { load, save } from '../storage';
import { Card, u } from './ui';
import { pickForSlot } from '../content';
import { hijriText, ymdNum, toHijri } from '../hijri';
import RadioCard from './RadioCard';
import { toggle, dayKey } from '../namaz';
import ShareCard from './ShareCard';
import { numToYmd } from '../hijri';

const dayIndex = () => {
  const n = trNow();
  return Math.floor(Date.UTC(n.y, n.m - 1, n.d) / 864e5);
};

function formatDates() {
  const d = trNow().date;
  let g = '', h = '';
  try { g = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' }).format(d); } catch (e) {}
  h = hijriText(ymdNum(trNow())); // Diyanet takvimi
  return [g, h].filter(Boolean).join(' · ');
}

export default function HomeScreen({ loc, content, go, radio, namaz, setNamaz }) {
  const [np, setNp] = useState(() => nextPrayer(loc));
  const [card, setCard] = useState(null);
  const [kehfDone, setKehfDone] = useState(null);
  useEffect(() => { load('kehfDone', '').then(setKehfDone); }, []);
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
  // Dönemlik hadisler (Ramazan, Arefe, Aşure) yalnız ilgili hicri ayda çıkar
  const hm0 = toHijri(ymdNum(trNow())).hm;
  const DONEM = { ramazan: 9, arefe: 12, 'aşure': 1, 'şevval': 10 };
  const hadis = pickForSlot(content.hadisler.filter((h) => !h.p || DONEM[h.p] === hm0), slot);
  const ders = content.dersler.length ? content.dersler[di % content.dersler.length] : null;

  // Cuma modu: Perşembe akşamından Cuma akşamına kadar Kehf hatırlatması (en üstte)
  const n0 = trNow();
  const wd = numToYmd(di).wd;
  const nowMin = n0.sec / 60;
  const kehfDay = wd === 5 && nowMin < np.today.aksam ? dayKey(n0) : wd === 4 && nowMin >= np.today.aksam ? dayKey(addDays(n0, 1)) : null;
  const showKehf = kehfDay && kehfDone !== null && kehfDone !== kehfDay;

  return (
    <ScrollView contentContainerStyle={u.page}>
      {showKehf && (
        <View style={s.kehf}>
          <Text style={s.kehfT}>🕌 {wd === 4 ? 'Cuma gecesi' : 'Bugün Cuma'} · Kehf Suresi</Text>
          <Text style={s.kehfB}>"Kim Cuma günü Kehf Suresini okursa, onun için iki Cuma arası nurla aydınlatılır."</Text>
          <Text style={s.kehfS}>Hâkim, Müstedrek; Beyhakî</Text>
          <Pressable style={s.kehfBtn} onPress={() => { setKehfDone(kehfDay); save('kehfDone', kehfDay); }}>
            <Text style={s.kehfBtnT}>Okudum ✓</Text>
          </Pressable>
        </View>
      )}
      <View style={s.hero}>
        <Text style={s.lbl}>Sonraki vakit</Text>
        <Text style={s.next}>{NAMES[np.key]} · {hm(np.at)}</Text>
        <Text style={s.count}>{count}</Text>
        <Text style={s.meta}>{formatDates()}</Text>
      </View>

      <View style={s.times}>
        {KEYS.map((k) => {
          // Vakti girmiş namaza dokununca "kıldım" işareti (Güneş hariç)
          const dk = dayKey(trNow());
          const entered = trNow().sec / 60 >= np.today[k];
          const can = k !== 'gunes' && entered && setNamaz;
          const done = !!(namaz && namaz[dk] && namaz[dk][k]);
          const Box = can ? Pressable : View;
          return (
            <Box key={k} style={[s.t, k === np.current && s.tCur, done && s.tDone]}
              {...(can ? { onPress: () => setNamaz(toggle(namaz, dk, k)), accessibilityLabel: `${NAMES[k]} kıldım` } : {})}>
              <Text style={[s.tName, k === np.current && { color: C.goldInk }]}>{NAMES[k]}</Text>
              <Text style={s.tVal}>{hm(np.today[k])}</Text>
              {k !== 'gunes' && <Text style={[s.tick, done && { color: C.ok }, !entered && { opacity: 0.25 }]}>{done ? '✓' : '○'}</Text>}
            </Box>
          );
        })}
      </View>

      <Text style={s.tickHint}>Kıldığınız namazın vaktine dokunarak işaretleyin</Text>

      {ayet && (
        <Card title="📖 Vaktin Ayeti">
          <Text style={u.quote}>“{ayet.text}”</Text>
          <Text style={u.src}>{ayet.src}</Text>
          <Pressable onPress={() => setCard({ label: '📖 Vaktin Ayeti', text: ayet.text, src: ayet.src })} style={s.share} hitSlop={8}>
            <Text style={s.shareT}>📤 Paylaş</Text>
          </Pressable>
        </Card>
      )}
      {hadis && (
        <Card title="🌿 Vaktin Hadisi">
          <Text style={u.quote}>“{hadis.text}”</Text>
          <Text style={u.src}>{hadis.src}</Text>
          <Pressable onPress={() => setCard({ label: '🌿 Vaktin Hadisi', text: hadis.text, src: hadis.src })} style={s.share} hitSlop={8}>
            <Text style={s.shareT}>📤 Paylaş</Text>
          </Pressable>
        </Card>
      )}

      {numToYmd(di).wd === 5 && (
        <Pressable style={s.cuma} onPress={() => setCard({ kind: 'tebrik', label: '🕌 Cuma', text: 'Hayırlı Cumalar', src: 'Rabbim dualarımızı kabul eylesin.' })}>
          <Text style={s.cumaT}>🕌 Hayırlı Cumalar kartı paylaş</Text>
        </Pressable>
      )}

      <RadioCard radio={radio} />

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
      <ShareCard card={card} onClose={() => setCard(null)} />
    </ScrollView>
  );
}

const s = themed(() => ({
  hero: { backgroundColor: C.primary, borderRadius: 24, padding: 20 },
  lbl: { color: '#fff', opacity: 0.85, fontSize: 13, fontWeight: '700' },
  next: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  count: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: 1, fontVariant: ['tabular-nums'], marginVertical: 2 },
  meta: { color: '#fff', opacity: 0.9, fontSize: 13, fontWeight: '600' },
  times: { flexDirection: 'row', gap: 6, marginTop: 14 },
  t: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 9, alignItems: 'center' },
  tCur: { backgroundColor: C.goldSoft, borderColor: C.gold },
  tName: { fontSize: 11, color: C.muted, fontWeight: '800' },
  tVal: { fontSize: 15, fontWeight: '900', color: C.ink, marginTop: 2 },
  share: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  shareT: { fontSize: 13, fontWeight: '800', color: C.green },
  kehf: { backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, borderRadius: 20, padding: 16, marginBottom: 12 },
  kehfT: { fontSize: 16, fontWeight: '900', color: C.goldInk },
  kehfB: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: C.ink, marginTop: 6 },
  kehfS: { fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 4 },
  kehfBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  kehfBtnT: { color: '#fff', fontWeight: '900', fontSize: 14 },
  cuma: { marginTop: 14, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, borderRadius: 16, padding: 14, alignItems: 'center' },
  cumaT: { fontSize: 15, fontWeight: '900', color: C.goldInk },
  tDone: { borderColor: C.ok, backgroundColor: C.okSoft },
  tick: { fontSize: 14, fontWeight: '900', color: C.muted, marginTop: 2 },
  tickHint: { fontSize: 11, fontWeight: '700', color: C.muted, textAlign: 'center', marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  mini: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14 },
  miniT: { fontSize: 15, fontWeight: '800', marginTop: 6, color: C.ink },
  miniS: { fontSize: 12, color: C.muted, fontWeight: '600' },
}));
