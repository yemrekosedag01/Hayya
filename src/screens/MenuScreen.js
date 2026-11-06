import React from 'react';
import { ScrollView, View, Text, Pressable, Linking, Share, Alert } from 'react-native';
import { C, themed } from '../theme';
import { trNow } from '../prayer';
import { hijriText, miladiText, ymdNum } from '../hijri';
import { Card, u } from './ui';


const TILES = [
  { key: 'bildirim', icon: '🔔', title: 'Ezan ve Bildirimler', sub: 'Vakit uyarıları ve hatırlatma' },
  { key: 'zikir', icon: '📿', title: 'Zikirmatik', sub: 'Tesbihat ve zikir sayacı' },
  { key: 'kible', icon: '🧭', title: 'Kıble Pusulası', sub: 'Kâbe yönünü bul' },
  { key: 'esma', icon: '✨', title: 'Esmaül Hüsna', sub: 'Allah’ın 99 güzel ismi' },
  { key: 'dini', icon: '🌙', title: 'Dini Günler', sub: 'Kandiller ve bayramlar' },
  { key: 'hicri', icon: '🗓️', title: 'Hicri Takvim', sub: 'Hicri ve miladi tarih' },
  { key: 'ayarlar', icon: '⚙️', title: 'Ayarlar', sub: 'Tema, titreşim ve daha fazlası' },
];

export const SHARE_TEXT = 'Hayya · Ezan Vakti ve Dini Bilgiler uygulamasını sana da tavsiye ederim. Instagram: @hayya.vakit\nhttps://play.google.com/store/apps/details?id=com.kosedag.hayya';

export default function MenuScreen({ open, notifOk }) {
  const today = ymdNum(trNow());
  const plus = () => Alert.alert('⭐ Hayya Plus', 'Hayya Plus henüz aktif değil. Daha fazla quiz sorusu ve ek özellikler çok yakında burada olacak inşallah.', [{ text: 'Tamam' }]);

  return (
    <ScrollView contentContainerStyle={u.page}>
      <View style={s.dateBox}>
        <Text style={s.hijri}>{hijriText(today)}</Text>
        <Text style={u.src}>{miladiText(today)}</Text>
      </View>

      {!notifOk && (
        <Pressable style={s.warn} onPress={() => open('bildirim')}>
          <Text style={s.warnT}>⚠️ Bildirim izni kapalı. Vakit uyarıları için dokunun.</Text>
        </Pressable>
      )}

      <View style={s.grid}>
        {TILES.map((t) => (
          <Pressable key={t.key} style={s.tile} onPress={() => open(t.key)}>
            <Text style={s.tIcon}>{t.icon}</Text>
            <Text style={s.tTitle}>{t.title}</Text>
            <Text style={s.tSub}>{t.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={s.plus} onPress={plus}>
        <Text style={s.tIcon}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.tTitle, { color: C.goldInk }]}>Hayya Plus</Text>
          <Text style={s.tSub}>Çok yakında</Text>
        </View>
        <Text style={[s.tTitle, { color: C.goldInk }]}>›</Text>
      </Pressable>

      <Card>
        <LinkRow icon="📷" label="Instagramda takip et · @hayya.vakit" onPress={() => Linking.openURL('https://instagram.com/hayya.vakit')} />
        <LinkRow icon="📤" label="Uygulamayı paylaş" onPress={() => Share.share({ message: SHARE_TEXT })} />
        <LinkRow icon="ℹ️" label="Hakkında ve gizlilik" onPress={() => open('hakkinda')} last />
      </Card>
    </ScrollView>
  );
}

function LinkRow({ icon, label, onPress, last }) {
  return (
    <Pressable onPress={onPress} style={[s.link, last && { borderBottomWidth: 0 }]}>
      <Text style={s.linkT}>{icon}  {label}</Text>
      <Text style={s.linkCh}>›</Text>
    </Pressable>
  );
}

const s = themed(() => ({
  dateBox: { alignItems: 'center', marginBottom: 14, marginTop: 2 },
  hijri: { fontSize: 20, fontWeight: '900', color: C.green, marginBottom: 2 },
  warn: { backgroundColor: C.badSoft, borderRadius: 14, padding: 12, marginBottom: 4 },
  warnT: { color: C.bad, fontWeight: '800', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  tile: { width: '48.5%', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 14, marginBottom: 10 },
  tIcon: { fontSize: 28 },
  tTitle: { fontSize: 16, fontWeight: '900', color: C.ink, marginTop: 6 },
  tSub: { fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 2 },
  plus: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, borderRadius: 20, padding: 14 },
  link: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  linkT: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  linkCh: { fontSize: 20, fontWeight: '800', color: C.muted },
}));
