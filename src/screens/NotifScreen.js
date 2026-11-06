import React from 'react';
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { C, themed } from '../theme';
import { KEYS, NAMES } from '../prayer';
import { testNotification } from '../notifications';
import { HAS_EZAN_SOUND } from '../config';
import { Card, Seg, u } from './ui';

const MODES = [['off', 'Kapalı'], ['bildirim', 'Bildirim'], ['ezan', 'Ezan']];
const PRE = [0, 10, 15, 30, 45];

export default function NotifScreen({ loc, alarms, setAlarms, pre, setPre, notifOk, retryNotif, soundMode, vibNotif }) {
  return (
    <ScrollView contentContainerStyle={u.page}>
      {!notifOk && (
        <Card style={{ marginTop: 0, borderColor: C.bad }}>
          <Text style={[u.quote, { fontSize: 16, marginTop: 0 }]}>Bildirim izni kapalı. Vakit uyarıları için izin verin.</Text>
          <Pressable style={u.btn} onPress={retryNotif}><Text style={u.btnTxt}>İzin ver</Text></Pressable>
          <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
            <Text style={[u.btnTxt, { color: C.green }]}>Telefon ayarlarını aç</Text>
          </Pressable>
        </Card>
      )}

      <Card title="🕌 Vakit uyarıları" style={{ marginTop: notifOk ? 0 : 14 }}>
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

      <Pressable style={u.btn} onPress={() => testNotification(loc, false, soundMode, vibNotif)}>
        <Text style={u.btnTxt}>🔔 Deneme bildirimi gönder</Text>
      </Pressable>
      {HAS_EZAN_SOUND && (
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => testNotification(loc, true, soundMode, vibNotif)}>
          <Text style={[u.btnTxt, { color: C.green }]}>🕌 Ezan sesini dene</Text>
        </Pressable>
      )}

      <Card title="💡 Bildirimler geç geliyorsa">
        <Text style={[u.tip, { color: C.ink }]}>Bazı telefonlar (Xiaomi, Samsung, Oppo, Huawei) pil tasarrufu için bildirimleri geciktirebilir. Telefon ayarlarından Hayya için "Pil kısıtlaması yok" seçeneğini ve "Alarmlar ve hatırlatıcılar" iznini açın. Bildirimler 14 gün ileriye kurulur; uygulamayı arada bir açmanız yeterlidir.</Text>
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
          <Text style={[u.btnTxt, { color: C.green }]}>Uygulama ayarlarını aç</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const s = themed(() => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontSize: 16, fontWeight: '800', color: C.ink },
}));
