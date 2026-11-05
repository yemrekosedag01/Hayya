import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../theme';

export function Card({ title, children, style }) {
  return (
    <View style={[u.card, style]}>
      {title ? <Text style={u.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export const u = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingBottom: 24 },
  h2: { fontSize: 22, fontWeight: '900', color: C.green, marginTop: 4, marginBottom: 12 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 16, marginTop: 14 },
  cardTitle: { fontSize: 12, letterSpacing: 1, color: C.gold, fontWeight: '900', textTransform: 'uppercase' },
  quote: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: C.ink, marginTop: 10, marginBottom: 8 },
  src: { fontSize: 13, color: C.muted, fontWeight: '700' },
  btn: { backgroundColor: C.green, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  btnGhost: { backgroundColor: C.card, borderWidth: 2, borderColor: C.green },
  empty: { fontSize: 15, color: C.muted, fontWeight: '600', textAlign: 'center', marginTop: 30, lineHeight: 22 },
});
