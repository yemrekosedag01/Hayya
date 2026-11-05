import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { load, save } from '../storage';
import { Card, u } from './ui';

const PER_ROUND = 5;
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

export default function QuizScreen({ content }) {
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [best, setBest] = useState(0);

  const start = () => {
    // Soruları ve her sorunun şıklarını karıştır (doğru cevap hep aynı harfte olmasın)
    setQs(shuffle(content.sorular).slice(0, PER_ROUND).map((q) => {
      const order = shuffle([0, 1, 2, 3]);
      return { ...q, opts: order.map((i) => q.opts[i]), a: order.indexOf(q.a) };
    }));
    setI(0); setScore(0); setPicked(null);
  };
  useEffect(() => { start(); load('best', 0).then(setBest); }, [content.sorular]);

  const finished = qs.length > 0 && i >= qs.length;
  useEffect(() => {
    if (finished && score > best) { setBest(score); save('best', score); }
  }, [finished]);

  if (!content.sorular.length) {
    return <View style={u.page}><Text style={u.h2}>Soru / Cevap</Text><Text style={u.empty}>Sorular yakında eklenecek.</Text></View>;
  }

  if (finished) {
    const nb = Math.max(best, score);
    return (
      <ScrollView contentContainerStyle={u.page}>
        <Text style={u.h2}>Soru / Cevap</Text>
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 0 }}>
          <Text style={{ fontSize: 40 }}>{score >= qs.length - 1 ? '🏆' : score >= 2 ? '👏' : '🌱'}</Text>
          <Text style={s.big}>{score}/{qs.length}</Text>
          <Text style={u.src}>En iyi skorun: {nb}/{PER_ROUND}</Text>
        </Card>
        <Pressable style={u.btn} onPress={start}><Text style={u.btnTxt}>Tekrar oyna</Text></Pressable>
      </ScrollView>
    );
  }

  const q = qs[i];
  if (!q) return null;
  const choose = (k) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.a) setScore((x) => x + 1);
  };

  return (
    <ScrollView contentContainerStyle={u.page}>
      <Text style={u.h2}>Soru / Cevap</Text>
      <Text style={u.src}>Soru {i + 1} / {qs.length}</Text>
      <View style={s.bar}><View style={[s.fill, { width: `${(i / qs.length) * 100}%` }]} /></View>
      <Text style={s.q}>{q.q}</Text>
      {q.opts.map((o, k) => {
        const st = picked === null ? null : k === q.a ? 'ok' : k === picked ? 'bad' : null;
        return (
          <Pressable key={k} onPress={() => choose(k)} style={[s.opt, st === 'ok' && s.ok, st === 'bad' && s.bad]}>
            <Text style={s.optT}>{['A', 'B', 'C', 'D'][k]}) {o}</Text>
          </Pressable>
        );
      })}
      {picked !== null && (
        <>
          <Text style={s.expl}>{picked === q.a ? '✅ Doğru! ' : '❌ '}{q.why}</Text>
          <Pressable style={u.btn} onPress={() => { setI(i + 1); setPicked(null); }}>
            <Text style={u.btnTxt}>{i < qs.length - 1 ? 'Sonraki soru' : 'Sonucu gör'}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bar: { height: 8, backgroundColor: C.line, borderRadius: 99, overflow: 'hidden', marginTop: 6, marginBottom: 14 },
  fill: { height: '100%', backgroundColor: C.gold },
  q: { fontSize: 20, fontWeight: '800', lineHeight: 28, color: C.ink, marginBottom: 14 },
  opt: { padding: 14, marginBottom: 10, borderRadius: 16, borderWidth: 2, borderColor: C.line, backgroundColor: C.card },
  ok: { borderColor: C.ok, backgroundColor: C.okSoft },
  bad: { borderColor: C.bad, backgroundColor: C.badSoft },
  optT: { fontSize: 16, fontWeight: '700', color: C.ink },
  expl: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: C.muted, marginTop: 4 },
  big: { fontSize: 56, fontWeight: '900', color: C.green },
});
