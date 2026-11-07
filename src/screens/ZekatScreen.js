import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { C, themed } from '../theme';
import { load, save } from '../storage';
import { Card, u } from './ui';
import { fetchSheet } from '../content';

const NISAB_ALTIN_GR = 80.18; // 20 miskal altın (Diyanet esası)
const ORAN = 0.025; // kırkta bir

const FIELDS = [
  { k: 'nakit', label: 'Nakit ve banka hesapları (₺)' },
  { k: 'altin', label: 'Sahip olduğunuz altın (gram)' },
  { k: 'gumus', label: 'Sahip olduğunuz gümüş (gram)' },
  { k: 'dolar', label: 'Sahip olduğunuz dolar ($)' },
  { k: 'euro', label: 'Sahip olduğunuz euro (€)' },
  { k: 'doviz', label: 'Varsa başka dövizlerinizin TL karşılığı (₺)' },
  { k: 'ticaret', label: 'Ticaret malı ve stok, TL karşılığı (₺)' },
  { k: 'alacak', label: 'Tahsili kesin alacaklar (₺)' },
  { k: 'borc', label: 'Borçlar, bu yıl ödenecek (₺)' },
];

export default function ZekatScreen() {
  const [v, setV] = useState({});
  const [pr, setPr] = useState(null); // { altin, gumus, usd, eur, tarih }
  const [prErr, setPrErr] = useState(false);
  useEffect(() => {
    load('zekat', {}).then(setV);
    load('zekatFiyat', null).then((c) => { if (c) setPr(c); });
    fetchSheet('Fiyatlar').then((rows) => {
      const get = (name) => rows.find((r) => String(r['kalem'] || '').toLocaleLowerCase('tr').startsWith(name));
      const val = (r) => (r ? num(r['değer']) : 0);
      const altin = get('gram altın'); const gumus = get('gram gümüş');
      const f = { altin: val(altin), gumus: val(gumus), usd: val(get('dolar')), eur: val(get('euro')), tarih: altin ? altin['güncelleme'] : '' };
      if (f.altin > 0) { setPr(f); setPrErr(false); save('zekatFiyat', f); } else setPrErr(true);
    }).catch(() => setPrErr(true));
  }, []);
  const set = (k, t) => { const n = { ...v, [k]: t }; setV(n); save('zekat', n); };

  const altinFiyat = pr ? pr.altin : num(v.altinFiyat);
  const varlik = num(v.nakit) + num(v.altin) * altinFiyat + num(v.gumus) * (pr ? pr.gumus : 0)
    + num(v.dolar) * (pr ? pr.usd : 0) + num(v.euro) * (pr ? pr.eur : 0)
    + num(v.doviz) + num(v.ticaret) + num(v.alacak);
  const net = varlik - num(v.borc);
  const nisab = NISAB_ALTIN_GR * altinFiyat;
  const ready = altinFiyat > 0;
  const gerekli = ready && net >= nisab;

  return (
    <ScrollView contentContainerStyle={u.page} keyboardShouldPersistTaps="handled">
      <Text style={[u.tip, { marginTop: 0 }]}>Zekât, nisap miktarı mala sahip olup üzerinden bir yıl geçen Müslümana farzdır. Oran kırkta birdir (%2,5). Sahip olduklarınızı yazın, güncel fiyatlarla hesaplanır.</Text>
      <Card title="Güncel fiyatlar">
        {pr ? (
          <View>
            <Line a="Gram altın" b={pr.altin.toLocaleString('tr-TR') + ' ₺'} />
            <Line a="Gram gümüş" b={pr.gumus.toLocaleString('tr-TR') + ' ₺'} />
            <Line a="Dolar" b={pr.usd.toLocaleString('tr-TR') + ' ₺'} />
            <Line a="Euro" b={pr.eur.toLocaleString('tr-TR') + ' ₺'} />
            {pr.tarih ? <Text style={u.src}>Altın ve gümüş fiyatı {pr.tarih} tarihinde güncellendi</Text> : null}
          </View>
        ) : (
          <View>
            <Text style={u.src}>{prErr ? 'Güncel fiyatlara ulaşılamadı. Gram altın fiyatını kendiniz yazın.' : 'Fiyatlar yükleniyor…'}</Text>
            {prErr && (
              <TextInput value={v.altinFiyat || ''} onChangeText={(t) => set('altinFiyat', t)} keyboardType="decimal-pad"
                placeholder="Gram altın (₺)" placeholderTextColor={C.muted} style={[s.inp, { marginTop: 8 }]} />
            )}
          </View>
        )}
      </Card>

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
