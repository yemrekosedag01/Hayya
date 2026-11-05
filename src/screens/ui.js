import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, themed } from '../theme';

export function Card({ title, children, style }) {
  return (
    <View style={[u.card, style]}>
      {title ? <Text style={u.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

/** Seçenek düğmeleri: items = [[değer, etiket], ...] */
export function Seg({ items, value, onChange }) {
  return (
    <View style={u.seg}>
      {items.map(([v, label]) => (
        <Pressable key={String(v)} onPress={() => onChange(v)} style={[u.segB, value === v && u.segOn]}>
          <Text style={[u.segT, value === v && { color: '#fff' }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Menü alt sayfalarının başlığı (geri düğmeli). */
export function SubHeader({ title, onBack }) {
  return (
    <View style={u.subHead}>
      <Pressable onPress={onBack} style={u.back} hitSlop={10} accessibilityLabel="Menüye dön">
        <Text style={u.backT}>‹ Menü</Text>
      </Pressable>
      <Text style={u.subTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

export const u = themed(() => ({
  page: { paddingHorizontal: 16, paddingBottom: 24 },
  h2: { fontSize: 22, fontWeight: '900', color: C.green, marginTop: 4, marginBottom: 12 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 16, marginTop: 14 },
  cardTitle: { fontSize: 12, letterSpacing: 1, color: C.gold, fontWeight: '900', textTransform: 'uppercase' },
  quote: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: C.ink, marginTop: 10, marginBottom: 8 },
  src: { fontSize: 13, color: C.muted, fontWeight: '700' },
  btn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: { backgroundColor: C.card, borderWidth: 2, borderColor: C.green },
  seg: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 3 },
  segB: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 9 },
  segOn: { backgroundColor: C.primary },
  segT: { fontSize: 12, fontWeight: '800', color: C.muted },
  subHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  back: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  backT: { fontSize: 14, fontWeight: '800', color: C.green },
  subTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: C.green },
  tip: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: C.muted, marginTop: 8 },
  empty: { fontSize: 15, color: C.muted, fontWeight: '600', textAlign: 'center', marginTop: 30, lineHeight: 22 },
}));
