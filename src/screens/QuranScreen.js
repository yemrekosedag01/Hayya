import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Modal, TextInput } from 'react-native';
import { C, themed } from '../theme';
import { trNow } from '../prayer';
import { ymdNum } from '../hijri';
import { load, save } from '../storage';
import { u } from './ui';
import { SURAH_TR, SURAH_AR, BISMILLAH, TOTAL_AYAH, RECITERS, audioUrl, quranData } from '../quran';

import { hasQuranAudio, quranPlay, quranCmd, quranState } from '../../modules/hayya-ongoing';

const DEF = { last: null, read: {}, hatims: 0, days: 30, dayKey: 0, dayN: 0, reciter: RECITERS[0].id, fs: 28, meal: true, view: 'ayet' };
const DAY_CHOICES = [10, 30, 60, 90];

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const arNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);
const CHUNK = 10; // tam sayfa modunda bir parçadaki ayet sayısı

function ViewToggle({ view, set }) {
  return (
    <View style={s2.seg}>
      {[['ayet', 'Ayet ayet'], ['sayfa', 'Tam sayfa']].map(([k, l]) => (
        <Pressable key={k} onPress={() => set({ view: k })} style={[s2.segB, view === k && s2.segOn]}>
          <Text style={[s2.segT, view === k && s2.segTOn]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const totalRead = (read) => Object.values(read).reduce((a, b) => a + b, 0);

export default function QuranScreen() {
  const [st, setSt] = useState(DEF);
  const [ready, setReady] = useState(false);
  const [surah, setSurah] = useState(null); // 1..114 | null
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState('');
  const stRef = useRef(DEF);
  const set = useCallback((patch) => {
    const n = { ...stRef.current, ...patch };
    stRef.current = n; setSt(n); save('quran', n);
  }, []);

  useEffect(() => {
    load('quran', DEF).then((v) => { const n = { ...DEF, ...v }; stRef.current = n; setSt(n); setReady(true); });
  }, []);

  // ---- Ses (native QuranService: ekran kapalıyken de çalar) ----
  const [now, setNow] = useState(null); // { s, a } çalan ayet
  const [paused, setPaused] = useState(false);
  const base = useRef(null); // { s, a, count }: kuyruğun başı
  const listRef = useRef(null);
  const surahRef = useRef(null);
  surahRef.current = surah;

  const playAyah = (s, a) => {
    if (!hasQuranAudio()) return;
    const n = quranData().ar[s - 1].length;
    const urls = []; const titles = [];
    for (let i = a; i <= n; i++) { urls.push(audioUrl(stRef.current.reciter, s, i)); titles.push(`${SURAH_TR[s - 1]} Suresi · ${i}. ayet`); }
    base.current = { s, a, count: urls.length };
    quranPlay({ urls, titles, start: 0 });
    setNow({ s, a }); setPaused(false);
  };
  const seek = (d) => {
    const b = base.current; const st0 = quranState();
    if (!b || !st0) return;
    quranCmd('SEEK', Math.max(0, Math.min(b.count - 1, st0.index + d)));
  };
  const nextAyah = () => seek(1);
  const prevAyah = () => seek(-1);
  const togglePause = () => { quranCmd(paused ? 'RESUME' : 'PAUSE'); setPaused(!paused); };
  const stopAudio = () => { quranCmd('STOP'); base.current = null; setNow(null); setPaused(false); };

  // Çalan ayeti native taraftan oku (ekran açıkken)
  useEffect(() => {
    if (!now) return undefined;
    const t = setInterval(() => {
      const b = base.current; const st0 = quranState();
      if (!b || !st0) return;
      if (!st0.active) { base.current = null; setNow(null); setPaused(false); return; }
      const a = b.a + Math.max(0, st0.index);
      setPaused(!!st0.paused);
      setNow((cur) => {
        if (cur && cur.s === b.s && cur.a === a) return cur;
        return { s: b.s, a };
      });
    }, 700);
    return () => clearInterval(t);
  }, [now !== null]);

  // ---- Okuma / hatim ----
  const markRead = (s, a) => {
    const cur = stRef.current;
    const prev = cur.read[s] || 0;
    const key = ymdNum(trNow());
    let dayN = cur.dayKey === key ? cur.dayN : 0;
    let read = { ...cur.read };
    let hatims = cur.hatims;
    if (a > prev) { dayN += a - prev; read[s] = a; }
    let done = false;
    if (totalRead(read) >= TOTAL_AYAH) { hatims += 1; read = {}; done = true; }
    set({ read, hatims, dayKey: key, dayN, last: done ? null : { s, a } });
  };

  if (!ready) return <View style={u.page} />;

  if (surah) {
    return (
      <Reader
        s={surah} st={st} set={set} listRef={listRef} now={now} paused={paused}
        onBack={() => setSurah(null)} onPlay={playAyah} onMark={markRead}
        onPrev={prevAyah} onNext={nextAyah} onToggle={togglePause} onStop={stopAudio}
      />
    );
  }

  const total = totalRead(st.read);
  const goal = Math.ceil(TOTAL_AYAH / st.days);
  const todayN = st.dayKey === ymdNum(trNow()) ? st.dayN : 0;
  const k = q.trim().toLocaleLowerCase('tr');
  const data = SURAH_TR.map((n, i) => ({ i: i + 1, n, ar: SURAH_AR[i], c: quranData().ar[i].length }))
    .filter((x) => !k || x.n.toLocaleLowerCase('tr').includes(k) || String(x.i) === k);
  const rec = RECITERS.find((r) => r.id === st.reciter) || RECITERS[0];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={u.page}
        data={data}
        keyExtractor={(x) => String(x.i)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <ViewToggle view={st.view} set={set} />
            {st.last && (
              <Pressable style={s2.cont} onPress={() => setSurah(st.last.s)}>
                <Text style={s2.contT}>📖 Kaldığın yerden devam et</Text>
                <Text style={s2.contS}>{SURAH_TR[st.last.s - 1]} Suresi · {st.last.a}. ayet</Text>
              </Pressable>
            )}
            <View style={s2.card}>
              <Text style={s2.cardT}>Hatim takibi{st.hatims > 0 ? ` · ${st.hatims}. hatim tamamlandı` : ''}</Text>
              <View style={s2.bar}><View style={[s2.fill, { width: `${Math.min(100, (total / TOTAL_AYAH) * 100)}%` }]} /></View>
              <Text style={u.src}>{total} / {TOTAL_AYAH} ayet · %{Math.floor((total / TOTAL_AYAH) * 100)}</Text>
              <Text style={[u.src, { marginTop: 6 }]}>Hedef: {st.days} günde hatim · günde {goal} ayet · bugün {Math.min(todayN, 99999)} / {goal}</Text>
              <View style={s2.chips}>
                {DAY_CHOICES.map((d) => (
                  <Pressable key={d} onPress={() => set({ days: d })} style={[s2.chip, st.days === d && s2.chipOn]}>
                    <Text style={[s2.chipT, st.days === d && s2.chipTOn]}>{d} gün</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[u.src, { marginTop: 8 }]}>Okuduğun ayette ✓ simgesine dokun; ilerlemen buraya işlenir.</Text>
            </View>
            <Pressable style={s2.recRow} onPress={() => setPick(true)}>
              <Text style={s2.recL}>🎧 Okuyan</Text>
              <Text style={s2.recV}>{rec.name} ›</Text>
            </Pressable>
            <TextInput value={q} onChangeText={setQ} placeholder="Sure adı veya numarası ara" placeholderTextColor={C.muted} style={s2.search} autoCorrect={false} />
          </View>
        }
        renderItem={({ item }) => {
          const done = (st.read[item.i] || 0) >= item.c;
          return (
            <Pressable style={s2.row} onPress={() => setSurah(item.i)}>
              <View style={s2.num}><Text style={s2.numT}>{item.i}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s2.name}>{item.n} Suresi {done ? '✓' : ''}</Text>
                <Text style={s2.sub}>{item.c} ayet{st.read[item.i] && !done ? ` · ${st.read[item.i]}. ayete kadar` : ''}</Text>
              </View>
              <Text style={s2.ar}>{item.ar}</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Text style={[u.src, { marginTop: 14, textAlign: 'center' }]}>
            Arapça metin: Tanzil.net (Osmanlı imlası) · Türkçe meal: Türkiye Diyanet Vakfı Meali (Dr. Ali Özek ve ark.), QuranEnc.com v1.0.0 · Ses: EveryAyah.com
          </Text>
        }
      />
      <Modal visible={pick} transparent animationType="fade" onRequestClose={() => setPick(false)}>
        <Pressable style={s2.shade} onPress={() => setPick(false)}>
          <View style={s2.sheet}>
            <Text style={s2.cardT}>Okuyan seç</Text>
            {RECITERS.map((r) => (
              <Pressable key={r.id} style={s2.pickRow} onPress={() => { set({ reciter: r.id }); setPick(false); }}>
                <Text style={s2.name}>{r.name}{r.note ? `  · ${r.note}` : ''}</Text>
                <Text style={s2.name}>{r.id === st.reciter ? '✓' : ''}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Reader({ s, st, set, listRef, now, paused, onBack, onPlay, onMark, onPrev, onNext, onToggle, onStop }) {
  const { ar, tr } = quranData();
  const ayahs = ar[s - 1];
  const items = ayahs.map((t, i) => ({ a: i + 1, t, m: tr[s - 1][i] }));
  const chunks = [];
  for (let i = 0; i < items.length; i += CHUNK) chunks.push({ k: i / CHUNK, list: items.slice(i, i + CHUNK) });
  const readTo = st.read[s] || 0;
  const flow = st.view === 'sayfa';
  const [sel, setSel] = useState(null); // tam sayfada dokunulan ayet
  const lastChunk = useRef(-1);
  useEffect(() => { lastChunk.current = -1; }, [flow]);

  useEffect(() => {
    if (st.last && st.last.s === s && st.last.a > 1) {
      const t = setTimeout(() => {
        try { listRef.current && listRef.current.scrollToIndex({ index: flow ? Math.floor((st.last.a - 1) / CHUNK) : st.last.a - 1, viewPosition: 0.1, animated: false }); } catch (e) {}
      }, 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [flow]);

  // Çalan ayet değişince ekranı kaydır (tam sayfada parça değişince)
  useEffect(() => {
    if (!now || now.s !== s) return;
    const idx = flow ? Math.floor((now.a - 1) / CHUNK) : now.a - 1;
    if (idx !== lastChunk.current) {
      lastChunk.current = idx;
      try { listRef.current && listRef.current.scrollToIndex({ index: idx, viewPosition: flow ? 0.05 : 0.2, animated: true }); } catch (e) {}
    }
  }, [now, flow]);

  const bottomPad = now || sel ? 110 : 30;
  return (
    <View style={{ flex: 1 }}>
      <View style={s2.head}>
        <Pressable onPress={onBack} hitSlop={10}><Text style={s2.back}>‹ Sureler</Text></Pressable>
        <Text style={s2.headT}>{SURAH_TR[s - 1]} Suresi</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable style={s2.fsBtn} onPress={() => set({ fs: Math.max(20, st.fs - 3) })}><Text style={s2.fsT}>A-</Text></Pressable>
          <Pressable style={s2.fsBtn} onPress={() => set({ fs: Math.min(46, st.fs + 3) })}><Text style={s2.fsT}>A+</Text></Pressable>
          <Pressable style={s2.fsBtn} onPress={() => set({ meal: !st.meal })}><Text style={s2.fsT}>{st.meal ? 'Meal ✓' : 'Meal'}</Text></Pressable>
        </View>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}><ViewToggle view={st.view} set={(p) => { setSel(null); set(p); }} /></View>
      {flow ? (
        <FlatList
          key="flow"
          ref={listRef}
          contentContainerStyle={[u.page, { paddingBottom: bottomPad }]}
          data={chunks}
          keyExtractor={(x) => String(x.k)}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={s !== 1 && s !== 9 ? <Text style={[s2.bism, { fontSize: st.fs }]}>{BISMILLAH}</Text> : null}
          renderItem={({ item }) => (
            <View style={s2.page}>
              <Text style={[s2.arFlow, { fontSize: st.fs, lineHeight: st.fs * 2 }]}>
                {item.list.map((x) => {
                  const on = now && now.s === s && now.a === x.a;
                  const pick = sel === x.a;
                  return (
                    <Text key={x.a} onPress={() => setSel(pick ? null : x.a)} style={on ? s2.flowOn : pick ? s2.flowSel : null}>
                      {x.t}{' ﴿' + arNum(x.a) + '﴾ '}
                    </Text>
                  );
                })}
              </Text>
              {st.meal && (
                <Text style={s2.mealFlow}>
                  {item.list.map((x) => (
                    <Text key={x.a}><Text style={s2.mealNo}>{x.a}. </Text>{x.m + ' '}</Text>
                  ))}
                </Text>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          key="ayet"
          ref={listRef}
          contentContainerStyle={[u.page, { paddingBottom: bottomPad }]}
          data={items}
          keyExtractor={(x) => String(x.a)}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={s !== 1 && s !== 9 ? <Text style={[s2.bism, { fontSize: st.fs }]}>{BISMILLAH}</Text> : null}
          renderItem={({ item }) => {
            const on = now && now.s === s && now.a === item.a;
            const done = item.a <= readTo;
            return (
              <View style={[s2.ay, on && s2.ayOn]}>
                <View style={s2.ayTop}>
                  <View style={s2.num}><Text style={s2.numT}>{item.a}</Text></View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable style={s2.act} onPress={() => onPlay(s, item.a)}><Text style={s2.actT}>▶</Text></Pressable>
                    <Pressable style={[s2.act, done && s2.actOn]} onPress={() => onMark(s, item.a)}><Text style={[s2.actT, done && { color: '#fff' }]}>✓</Text></Pressable>
                  </View>
                </View>
                <Text style={[s2.arT, { fontSize: st.fs, lineHeight: st.fs * 1.9 }]}>{item.t}</Text>
                {st.meal && <Text style={s2.mealT}>{item.m}</Text>}
              </View>
            );
          }}
        />
      )}
      {flow && sel && !now && (
        <View style={s2.player}>
          <Text style={s2.pT} numberOfLines={1}>{sel}. ayet</Text>
          <View style={s2.pBtns}>
            <Pressable onPress={() => { onPlay(s, sel); setSel(null); }} hitSlop={8}><Text style={s2.pB}>▶</Text></Pressable>
            <Pressable onPress={() => { onMark(s, sel); setSel(null); }} hitSlop={8}><Text style={s2.pB}>✓</Text></Pressable>
          </View>
        </View>
      )}
      {now && (
        <View style={s2.player}>
          <Text style={s2.pT} numberOfLines={1}>{SURAH_TR[now.s - 1]} · {now.a}. ayet</Text>
          <View style={s2.pBtns}>
            <Pressable onPress={onPrev} hitSlop={8}><Text style={s2.pB}>⏮</Text></Pressable>
            <Pressable onPress={onToggle} hitSlop={8}><Text style={s2.pB}>{paused ? '▶' : '⏸'}</Text></Pressable>
            <Pressable onPress={onNext} hitSlop={8}><Text style={s2.pB}>⏭</Text></Pressable>
            <Pressable onPress={onStop} hitSlop={8}><Text style={s2.pB}>■</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s2 = themed(() => ({
  cont: { backgroundColor: C.green, borderRadius: 16, padding: 14, marginBottom: 10 },
  contT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  contS: { color: '#fff', opacity: 0.9, marginTop: 3 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardT: { color: C.ink, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden', marginBottom: 6 },
  fill: { height: 8, backgroundColor: C.green },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipT: { color: C.ink, fontWeight: '600' },
  chipTOn: { color: '#fff' },
  recRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, marginBottom: 10 },
  recL: { color: C.ink, fontWeight: '700' },
  recV: { color: C.green, fontWeight: '700' },
  search: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: C.ink, backgroundColor: C.card, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, marginTop: 8 },
  num: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  numT: { color: C.ink, fontWeight: '800', fontSize: 13 },
  name: { color: C.ink, fontWeight: '700', fontSize: 15 },
  sub: { color: C.muted, fontSize: 12, marginTop: 2 },
  ar: { color: C.ink, fontSize: 20 },
  shade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.card, borderRadius: 18, padding: 16 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  back: { color: C.green, fontWeight: '800', fontSize: 15 },
  headT: { color: C.ink, fontWeight: '800', fontSize: 15 },
  fsBtn: { borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  fsT: { color: C.ink, fontWeight: '700', fontSize: 12 },
  bism: { textAlign: 'center', color: C.ink, marginBottom: 12, writingDirection: 'rtl' },
  ay: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, marginTop: 10 },
  ayOn: { borderColor: C.green, borderWidth: 2 },
  ayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  act: { width: 38, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  actOn: { backgroundColor: C.green, borderColor: C.green },
  actT: { color: C.ink, fontWeight: '800' },
  arT: { color: C.ink, textAlign: 'right', writingDirection: 'rtl' },
  mealT: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  player: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.green, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pT: { color: C.ink, fontWeight: '700', flex: 1, marginRight: 8 },
  pBtns: { flexDirection: 'row', gap: 16 },
  seg: { flexDirection: 'row', backgroundColor: C.line, borderRadius: 12, padding: 3, marginBottom: 10 },
  segB: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segOn: { backgroundColor: C.green },
  segT: { color: C.ink, fontWeight: '700' },
  segTOn: { color: '#fff' },
  page: { marginTop: 8, marginBottom: 6 },
  arFlow: { color: C.ink, textAlign: 'right', writingDirection: 'rtl' },
  flowOn: { backgroundColor: C.goldSoft },
  flowSel: { backgroundColor: C.okSoft },
  mealFlow: { color: C.muted, fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 14 },
  mealNo: { color: C.green, fontWeight: '800' },
  pB: { color: C.green, fontSize: 22, fontWeight: '800' },
}));
