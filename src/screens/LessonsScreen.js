import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Card, u } from './ui';

export default function LessonsScreen({ content, go }) {
  const [open, setOpen] = useState(null);
  const lesson = content.dersler.find((l) => l.id === open);

  if (lesson) {
    return (
      <ScrollView contentContainerStyle={u.page}>
        <Pressable onPress={() => setOpen(null)}><Text style={s.back}>‹ Dersler</Text></Pressable>
        <Text style={u.h2}>{lesson.icon} {lesson.title}</Text>
        <Card style={{ marginTop: 0 }}>
          {lesson.parts.map((p, pi) => (
            <View key={pi}>
              {p.title ? <Text style={s.subh}>{p.title}</Text> : null}
              {p.steps.map((st, i) => (
                <View key={i} style={[s.step, i === p.steps.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.num}><Text style={s.numT}>{i + 1}</Text></View>
                  <Text style={s.stepT}>{st}</Text>
                </View>
              ))}
            </View>
          ))}
        </Card>
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => go('quiz')}>
          <Text style={[u.btnTxt, { color: C.green }]}>Kendini dene 🎯</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={u.page}>
      <Text style={u.h2}>Kısa Dersler</Text>
      {content.dersler.length === 0 && <Text style={u.empty}>Dersler yakında eklenecek.</Text>}
      {content.dersler.map((l) => (
        <Pressable key={l.id} style={s.item} onPress={() => setOpen(l.id)}>
          <View style={s.icon}><Text style={{ fontSize: 20 }}>{l.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.itemT}>{l.title}</Text>
            {l.sub ? <Text style={s.itemS}>{l.sub}</Text> : null}
          </View>
          <Text style={s.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  back: { color: C.green, fontWeight: '900', fontSize: 15, paddingVertical: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, marginBottom: 10 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  itemT: { fontSize: 16, fontWeight: '800', color: C.ink },
  itemS: { fontSize: 12, color: C.muted, fontWeight: '600' },
  arrow: { fontSize: 24, color: C.muted },
  subh: { fontSize: 14, fontWeight: '900', color: C.green, marginTop: 10, marginBottom: 2 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  numT: { color: '#fff', fontWeight: '900', fontSize: 13 },
  stepT: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '600', color: C.ink },
});
