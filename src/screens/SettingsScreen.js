import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { C } from '../theme';
import { KEYS, NAMES } from '../prayer';
import { testNotification } from '../notifications';
import { HAS_EZAN_SOUND } from '../config';
import { Card, u } from './ui';

const MODES = [['off', 'Kapalı'], ['bildirim', 'Bildirim'], ['ezan', 'Ezan']];
const PRE = [0, 10, 15, 30, 45];

function Seg({ items, value, onChange }) {
  return (
    <View style={s.seg}>
      {items.map(([v, label]) => (
        <Pressable key={String(v)} onPress={() => onChange(v)} style={[s.segB, value === v && s.segOn]}>
          <Text style={[s.segT, value === v && { color: '#fff' }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen({ loc, alarms, setAlarms, pre, setPre, soundMode, setSoundMode, ongoing, setOngoing, notifOk, retryNotif }) {
  return (
    <ScrollView contentContainerStyle={u.page}>
      <Text style={u.h2}>Ezan Uyarıları</Text>

      {!notifOk && (
        <Card style={{ marginTop: 0, borderColor: C.bad }}>
          <Text style={[u.quote, { fontSize: 16, marginTop: 0 }]}>Bildirim izni kapalı. Vakit uyarıları için izin verin.</Text>
          <Pressable style={u.btn} onPress={retryNotif}><Text style={u.btnTxt}>İzin ver</Text></Pressable>
          <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
            <Text style={[u.btnTxt, { color: C.green }]}>Telefon ayarlarını aç</Text>
          </Pressable>
        </Card>
      )}

      <Card style={{ marginTop: notifOk ? 0 : 14 }}>
        {KEYS.map((k, i) => (
          <View key={k} style={[s.row, i === KEYS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={s.name}>{NAMES[k]}</Text>
            <Seg items={MODES} value={alarms[k]} onChange={(m) => setAlarms({ ...alarms, [k]: m })} />
          </View>
        ))}
      </Card>

      <Card title="⏰ Vakitten önce hatırlat">
        <View style={{ marginTop: 12 }}>
          <Seg items={PRE.map((v) => [v, v ? `${v} dk` : 'Yok'])} value={pre} onChange={setPre} />
        </View>
      </Card>

      <Card title="📌 Kalıcı vakit göstergesi">
        <View style={{ marginTop: 12 }}>
          <Seg items={[[true, 'Açık'], [false, 'Kapalı']]} value={ongoing} onChange={setOngoing} />
        </View>
        <Text style={[s.tip, { color: C.muted }]}>Bildirim çubuğunda bir sonraki vakte kalan süre ve günün vakitleri görünür. Kaydırıp kapatırsanız 5 dakika sonra yeniden gelir.</Text>
      </Card>

      <Card title="🔔 Bildirim sesi">
        <View style={{ marginTop: 12 }}>
          <Seg items={[['hayya', 'Hayya sesi'], ['sistem', 'Telefonun sesi']]} value={soundMode} onChange={setSoundMode} />
        </View>
        <Text style={[s.tip, { color: C.muted }]}>"Bildirim" seçili vakitlerde ve hatırlatmalarda çalar. Ezan seçili vakitlerde ezan okunur.</Text>
      </Card>

      <Pressable style={u.btn} onPress={() => testNotification(loc, false, soundMode)}>
        <Text style={u.btnTxt}>🔔 Deneme bildirimi gönder</Text>
      </Pressable>
      {HAS_EZAN_SOUND && (
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => testNotification(loc, true)}>
          <Text style={[u.btnTxt, { color: C.green }]}>🕌 Ezan sesini dene</Text>
        </Pressable>
      )}

      <Card title="💡 Bildirimler geç geliyorsa">
        <Text style={s.tip}>Bazı telefonlar (Xiaomi, Samsung, Oppo, Huawei) pil tasarrufu için bildirimleri geciktirebilir. Telefon ayarlarından Hayya için "Pil kısıtlaması yok" seçeneğini ve "Alarmlar ve hatırlatıcılar" iznini açın. Bildirimler 14 gün ileriye kurulur; uygulamayı arada bir açmanız yeterlidir.</Text>
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
          <Text style={[u.btnTxt, { color: C.green }]}>Uygulama ayarlarını aç</Text>
        </Pressable>
      </Card>

      <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openURL('https://instagram.com/hayya.vakit')}>
        <Text style={[u.btnTxt, { color: C.green }]}>📷 Instagramda takip et · @hayya.vakit</Text>
      </Pressable>

      {!HAS_EZAN_SOUND && (
        <Text style={[u.src, { marginTop: 12 }]}>Ezan seçeneği şimdilik yüksek öncelikli bildirim sesiyle çalar; ezan sesi sonraki sürümde eklenecek.</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontSize: 16, fontWeight: '800', color: C.ink },
  seg: { flexDirection: 'row', backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 3 },
  segB: { paddingVertical: 7, paddingHorizontal: 9, borderRadius: 9 },
  segOn: { backgroundColor: C.green },
  segT: { fontSize: 12, fontWeight: '800', color: C.muted },
  tip: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: C.ink, marginTop: 8 },
});
