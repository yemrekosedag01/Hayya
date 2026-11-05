import React, { useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { C, themed } from '../theme';
import { ESMA } from '../esma';
import { u } from './ui';

export default function EsmaScreen() {
  const [q, setQ] = useState('');
  const k = q.trim().toLocaleLowerCase('tr');
  const data = ESMA.map(([name, mean], i) => ({ i: i + 1, name, mean }))
    .filter((x) => !k || x.name.toLocaleLowerCase('tr').includes(k) || x.mean.toLocaleLowerCase('tr').includes(k));
  return (
    <FlatList
      contentContainerStyle={u.page}
      data={data}
      keyExtractor={(x) => String(x.i)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <Text style={[u.tip, { marginTop: 0, marginBottom: 10 }]}>"Allah’ın doksan dokuz ismi vardır. Kim onları sayıp korursa cennete girer." (Buhârî, Tevhîd 12; Müslim, Zikir 5)</Text>
          <TextInput value={q} onChangeText={setQ} placeholder="İsim veya anlam ara" placeholderTextColor={C.muted} style={s.search} autoCorrect={false} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.row}>
          <View style={s.num}><Text style={s.numT}>{item.i}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.mean}>{item.mean}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={u.empty}>Bulunamadı.</Text>}
    />
  );
}

const s = themed(() => ({
  search: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: C.ink, backgroundColor: C.card, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, marginTop: 8 },
  num: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  numT: { fontSize: 13, fontWeight: '900', color: C.goldInk },
  name: { fontSize: 17, fontWeight: '900', color: C.green },
  mean: { fontSize: 14, fontWeight: '600', color: C.ink, marginTop: 2, lineHeight: 19 },
}));
