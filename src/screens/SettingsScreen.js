import React from 'react';
import { ScrollView, Text, Pressable, Linking, View } from 'react-native';
import { C } from '../theme';
import { testNotification } from '../notifications';
import { HAS_EZAN_SOUND, HAYYA_SOUND_READY } from '../config';
import { Card, Seg, u } from './ui';

export default function SettingsScreen({ loc, theme, setTheme, vibNotif, setVibNotif, vibZikir, setVibZikir, soundMode, setSoundMode, ongoing, setOngoing }) {
  return (
    <ScrollView contentContainerStyle={u.page}>
      <Card title="🌓 Görünüm" style={{ marginTop: 0 }}>
        <View style={{ marginTop: 12 }}>
          <Seg items={[['auto', 'Telefona göre'], ['light', 'Açık'], ['dark', 'Koyu']]} value={theme} onChange={setTheme} />
        </View>
        <Text style={u.tip}>"Telefona göre" seçiliyken telefonunuz karanlık moddaysa uygulama da koyu temaya geçer.</Text>
      </Card>

      <Card title="📳 Titreşim">
        <Text style={[u.src, { marginTop: 12, marginBottom: 6 }]}>Vakit bildirimleri ve ezan</Text>
        <Seg items={[[true, 'Titreşsin'], [false, 'Titreşmesin']]} value={vibNotif} onChange={setVibNotif} />
        <Text style={[u.src, { marginTop: 14, marginBottom: 6 }]}>Zikirmatik</Text>
        <Seg items={[[true, 'Titreşsin'], [false, 'Titreşmesin']]} value={vibZikir} onChange={setVibZikir} />
      </Card>

      <Card title="📌 Kalıcı vakit göstergesi">
        <View style={{ marginTop: 12 }}>
          <Seg items={[[true, 'Açık'], [false, 'Kapalı']]} value={ongoing} onChange={setOngoing} />
        </View>
        <Text style={u.tip}>Bildirim çubuğunda bir sonraki vakte kalan süre ve günün vakitleri görünür. Kaydırıp kapatırsanız 5 dakika sonra yeniden gelir.</Text>
      </Card>

      {HAYYA_SOUND_READY && (
        <Card title="🔔 Bildirim sesi">
          <View style={{ marginTop: 12 }}>
            <Seg items={[['hayya', 'Hayya sesi'], ['sistem', 'Telefonun sesi']]} value={soundMode} onChange={setSoundMode} />
          </View>
          <Text style={u.tip}>"Bildirim" seçili vakitlerde ve hatırlatmalarda çalar. Ezan seçili vakitlerde ezan okunur.</Text>
        </Card>
      )}

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
