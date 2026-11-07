import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { C, themed } from '../theme';
import { load, save } from '../storage';
import { u } from './ui';
import { SURAH_TR, RECITERS, audioUrl, quranData, TOTAL_AYAH } from '../quran';
import { getOwner, setOwner } from '../quran/owner';
import { hasQuranAudio, quranPlay, quranCmd, quranState } from '../../modules/hayya-ongoing';

const MAX_QUEUE = 700;
const MODES = [['devam', 'Sırayla devam'], ['ayet', 'Ayeti tekrarla'], ['sure', 'Sureyi tekrarla']];
const DEF = { s: null, a: null, mode: 'devam', reciter: RECITERS[0].id };

function randomAyah() {
  const { ar } = quranData();
  let n = Math.floor(Math.random() * TOTAL_AYAH);
  for (let s = 0; s < 114; s++) {
    if (n < ar[s].length) return [s + 1, n + 1];
    n -= ar[s].length;
  }
  return [1, 1];
}

/** Ayarlara göre çalma kuyruğu: [[sure, ayet], …] */
function buildList(s0, a0, mode) {
  const { ar } = quranData();
  const list = [];
  if (mode === 'ayet') {
    for (let i = 0; i < 300; i++) list.push([s0, a0]);
  } else if (mode === 'sure') {
    const len = ar[s0 - 1].length;
    for (let i = a0; i <= len; i++) list.push([s0, i]);
    while (list.length + len <= MAX_QUEUE) for (let i = 1; i <= len; i++) list.push([s0, i]);
  } else {
    for (let ss = s0; ss <= 114 && list.length < MAX_QUEUE; ss++) {
      for (let i = ss === s0 ? a0 : 1; i <= ar[ss - 1].length && list.length < MAX_QUEUE; i++) list.push([ss, i]);
    }
  }
  return list;
}

export default function QuranMini() {
  const [cfg, setCfg] = useState(DEF);
  const [pickR, setPickR] = useState(false);
  const [pickM, setPickM] = useState(false);
  const [pickS, setPickS] = useState(false);
  const [pickA, setPickA] = useState(false);
  const [now, setNow] = useState(null); // { s, a }
  const cfgRef = useRef(DEF);
  const list = useRef(null);
  const on = now !== null;

  useEffect(() => {
    load('quranMini', DEF).then((v) => { const n = { ...DEF, ...v }; cfgRef.current = n; setCfg(n); });
  }, []);

  const update = (patch, restart) => {
    const n = { ...cfgRef.current, ...patch };
    cfgRef.current = n; setCfg(n); save('quranMini', n);
    if (restart && now) start(now, n);
  };

  const start = async (from, c = cfgRef.current) => {
    let s0; let a0;
    if (from) { s0 = from.s; a0 = from.a; }
    else if (c.s) { s0 = c.s; a0 = c.a || 1; }
    else [s0, a0] = randomAyah();
    const l = buildList(s0, a0, c.mode);
    let speed = 1;
    try { speed = (await load('quran', {})).speed || 1; } catch (e) { /* varsayılan */ }
    list.current = l;
    setOwner('mini');
    quranPlay({
      urls: l.map(([s, a]) => audioUrl(c.reciter, s, a)),
      titles: l.map(([s, a]) => `${SURAH_TR[s - 1]} Suresi · ${a}. ayet`),
      start: 0, speed,
    });
    setNow({ s: s0, a: a0 });
  };
  const stop = () => { quranCmd('STOP'); list.current = null; setNow(null); };

  useEffect(() => {
    if (!on) return undefined;
    const t = setInterval(() => {
      const l = list.current; const st = quranState();
      if (!l || !st || getOwner() !== 'mini' || !st.active) { list.current = null; setNow(null); return; }
      const pos = l[Math.max(0, Math.min(l.length - 1, st.index))];
      setNow((c) => (c && c.s === pos[0] && c.a === pos[1] ? c : { s: pos[0], a: pos[1] }));
    }, 800);
    return () => clearInterval(t);
  }, [on]);

  if (!hasQuranAudio()) return null;

  const rec = RECITERS.find((r) => r.id === cfg.reciter) || RECITERS[0];
  const { ar } = quranData();
  const ayCount = cfg.s ? ar[cfg.s - 1].length : 0;
  const modeL = (MODES.find((m) => m[0] === cfg.mode) || MODES[0])[1];

  return (
    <View style={[u.card, s.card]}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.h}>🎧 Kur{'’'}an Dinle</Text>
          {on ? <Text style={s.now} numberOfLines={1}>{SURAH_TR[now.s - 1]} · {now.a}. ayet</Text> : null}
        </View>
        <Pressable onPress={() => (on ? stop() : start(null))} style={[s.btn, on && s.btnOn]} accessibilityLabel={on ? 'Durdur' : 'Başlat'}>
          <Text style={s.btnT}>{on ? '■' : '▶'}</Text>
        </Pressable>
      </View>

      <View style={s.pickRow}>
        <Pressable style={s.pick} onPress={() => setPickS(true)}>
          <Text style={s.pickL}>Sure</Text>
          <Text style={s.pickV} numberOfLines={1}>{cfg.s ? SURAH_TR[cfg.s - 1] : 'Seçiniz'} ▾</Text>
        </Pressable>
        <Pressable style={[s.pick, !cfg.s && { opacity: 0.4 }]} disabled={!cfg.s} onPress={() => setPickA(true)}>
          <Text style={s.pickL}>Ayet</Text>
          <Text style={s.pickV}>{cfg.s ? (cfg.a || 1) : 'Seçiniz'} ▾</Text>
        </Pressable>
      </View>
      <View style={s.pickRow}>
        <Pressable style={s.pick} onPress={() => setPickR(true)}>
          <Text style={s.pickL}>Okuyucu</Text>
          <Text style={s.pickV} numberOfLines={1}>{rec.name} ▾</Text>
        </Pressable>
        <Pressable style={s.pick} onPress={() => setPickM(true)}>
          <Text style={s.pickL}>Çalma biçimi</Text>
          <Text style={s.pickV} numberOfLines={1}>{modeL} ▾</Text>
        </Pressable>
      </View>

      <Modal visible={pickR} transparent animationType="fade" onRequestClose={() => setPickR(false)}>
        <Pressable style={s.back} onPress={() => setPickR(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>Okuyucu seç</Text>
            {RECITERS.map((r) => (
              <Pressable key={r.id} style={[s.item, cfg.reciter === r.id && s.itemOn]}
                onPress={() => { setPickR(false); update({ reciter: r.id }, true); }}>
                <Text style={s.itemT}>{r.name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={pickM} transparent animationType="fade" onRequestClose={() => setPickM(false)}>
        <Pressable style={s.back} onPress={() => setPickM(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>Çalma biçimi</Text>
            {MODES.map(([k, l]) => (
              <Pressable key={k} style={[s.item, cfg.mode === k && s.itemOn]}
                onPress={() => { setPickM(false); update({ mode: k }, true); }}>
                <Text style={s.itemT}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={pickS} transparent animationType="fade" onRequestClose={() => setPickS(false)}>
        <Pressable style={s.back} onPress={() => setPickS(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>Sure seç</Text>
            <FlatList
              data={[0, ...SURAH_TR.map((_, i) => i + 1)]}
              keyExtractor={(x) => String(x)}
              initialNumToRender={20}
              renderItem={({ item }) => (
                <Pressable style={[s.item, cfg.s === (item || null) && s.itemOn]}
                  onPress={() => { setPickS(false); update({ s: item || null, a: null }, true); }}>
                  <Text style={s.itemT}>{item ? `${item}. ${SURAH_TR[item - 1]}` : 'Seçimi kaldır (rastgele ayet)'}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={pickA} transparent animationType="fade" onRequestClose={() => setPickA(false)}>
        <Pressable style={s.back} onPress={() => setPickA(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>{cfg.s ? SURAH_TR[cfg.s - 1] : ''} · ayet seç</Text>
            <FlatList
              key="grid"
              numColumns={6}
              data={Array.from({ length: ayCount }, (_, i) => i + 1)}
              keyExtractor={(x) => String(x)}
              initialNumToRender={60}
              renderItem={({ item }) => (
                <Pressable style={[s.cell, (cfg.a || 1) === item && s.itemOn]}
                  onPress={() => { setPickA(false); update({ a: item }, true); }}>
                  <Text style={s.itemT}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = themed(() => ({
  card: { borderColor: C.gold },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h: { fontSize: 22, fontWeight: '900', color: C.green },
  now: { fontSize: 15, fontWeight: '800', color: C.goldInk, marginTop: 2 },
  btn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  btnOn: { backgroundColor: C.bad },
  btnT: { color: '#fff', fontSize: 19, fontWeight: '900', marginLeft: 2 },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  pick: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  pickL: { fontSize: 11, fontWeight: '800', color: C.muted },
  pickV: { fontSize: 16, fontWeight: '900', color: C.ink, marginTop: 1 },
  lbl: { fontSize: 12, fontWeight: '800', color: C.muted, marginTop: 12, marginBottom: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipT: { fontSize: 13, fontWeight: '800', color: C.ink },
  chipTOn: { color: '#fff' },
  modes: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  mode: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.card, borderRadius: 20, padding: 16, maxHeight: '75%' },
  sheetT: { fontSize: 17, fontWeight: '900', color: C.green, marginBottom: 10 },
  item: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12 },
  itemOn: { backgroundColor: C.goldSoft },
  itemT: { fontSize: 16, fontWeight: '700', color: C.ink, textAlign: 'center' },
  cell: { flex: 1 / 6, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
}));
