import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { C, themed } from '../theme';
import { load, save } from '../storage';
import { Card, u } from './ui';

const NISAB_ALTIN_GR = 80.18; // 20 miskal altın (Diyanet esası)
const ORAN = 0.025; // kırkta bir

const FIELDS = [
  { k: 'altinFiyat', label: 'Gram altın fiyatı (₺)', hint: 'Güncel fiyatı yazın', req: true },
  { k: 'nakit', label: 'Nakit ve banka hesapları (₺)' },
  { k: 'altin', label: 'Altın (gram)' },
  { k: 'gumus', label: 'Gümüş (gram)' },
  { k: 'gumusFiyat', label: 'Gram gümüş fiyatı (₺)', hint: 'Gümüşünüz varsa' },
  { k: 'doviz', label: 'Döviz ve diğer varlıklar (₺ karşılığı)' },
  { k: 'ticaret', label: 'Ticaret malı ve stok (₺)' },
  { k: 'alacak', label: 'Tahsili kesin alacaklar (₺)' },
  { k: 'borc', label: 'Borçlar (bu yıl ödenecek, ₺)' },
];

const num = (v) => {
  const n = parseFloat(String(v || '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const tl = (n) => Math.round(n).toLocaleString('tr-TR') + ' ₺';

export default function ZekatScreen() {
  const [v, setV] = useState({});
  useEffect(() => { load('zekat', {}).then(setV); }, []);
  const set = (k, t) => { const n = { ...v, [k]: t }; setV(n); save('zekat', n); };

  const altinFiyat = num(v.altinFiyat);
  const varlik = num(v.nakit) + num(v.altin) * altinFiyat + num(v.gumus) * num(v.gumusFiyat)
    + num(v.doviz) + num(v.ticaret) + num(v.alacak);
  const net = varlik - num(v.borc);
  const nisab = NISAB_ALTIN_GR * altinFiyat;
  const ready = altinFiyat > 0;
  const gerekli = ready && net >= nisab;

  return (
    <ScrollView contentContainerStyle={u.page} keyboardShouldPersistTaps="handled">
      <Text style={[u.tip, { marginTop: 0 }]}>Zekât, nisap miktarı mala sahip olup üzerinden bir yıl geçen Müslümana farzdır. Oran kırkta birdir (%2,5). Güncel altın fiyatını girip varlıklarınızı yazın.</Text>
      <Card>
        {FIELDS.map((f) => (
          <View key={f.k} style={s.row}>
            <Text style={s.lbl}>{f.label}</Text>
            <TextInput
              value={v[f.k] || ''}
              onChangeText={(t) => set(f.k, t)}
              keyboardType="decimal-pad"
              placeholder={f.hint || '0'}
              placeholderTextColor={C.muted}
              style={s.inp}
            />
          </View>
        ))}
      </Card>

      <Card title="Sonuç">
        {!ready ? (
          <Text style={u.src}>Hesap için gram altın fiyatını girin.</Text>
        ) : (
          <View>
            <Line a="Toplam varlık" b={tl(varlik)} />
            <Line a="Borçlar" b={'− ' + tl(num(v.borc))} />
            <Line a="Net varlık" b={tl(net)} bold />
            <Line a={`Nisap (${NISAB_ALTIN_GR} gr altın)`} b={tl(nisab)} />
            <View style={[s.res, gerekli ? s.resOn : s.resOff]}>
              {gerekli ? (
                <View>
                  <Text style={s.resL}>Vermeniz gereken zekât</Text>
                  <Text style={s.resV}>{tl(net * ORAN)}</Text>
                </View>
              ) : (
                <Text style={s.resL}>Net varlığınız nisaba ulaşmıyor; zekât gerekmiyor.</Text>
              )}
            </View>
          </View>
        )}
      </Card>
      <Text style={[u.src, { marginTop: 12 }]}>Bu hesap bilgilendirme amaçlıdır ve Diyanetin esas aldığı altın nisabına göredir. Hesaba katılacak mallar ve özel durumlar için müftülüğe veya güvendiğiniz bir âlime danışın. Bilgileriniz yalnızca telefonunuzda saklanır.</Text>
    </ScrollView>
  );
}

function Line({ a, b, bold }) {
  return (
    <View style={s.line}>
      <Text style={[s.lbl, bold && { fontWeight: '900' }]}>{a}</Text>
      <Text style={[s.val, bold && { fontWeight: '900' }]}>{b}</Text>
    </View>
  );
}

const s = themed(() => ({
  row: { marginBottom: 12 },
  lbl: { color: C.ink, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  inp: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: C.ink, backgroundColor: C.bg },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  val: { color: C.ink, fontWeight: '700' },
  res: { marginTop: 12, borderRadius: 14, padding: 14 },
  resOn: { backgroundColor: C.okSoft },
  resOff: { backgroundColor: C.goldSoft },
  resL: { color: C.ink, fontWeight: '700' },
  resV: { color: C.green, fontWeight: '900', fontSize: 28, marginTop: 4 },
}));
