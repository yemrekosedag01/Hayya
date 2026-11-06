import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { C } from '../theme';
import { HAYYA_SOUND_READY } from '../config';
import { Card, Seg, u } from './ui';

export default function SettingsScreen({ theme, setTheme, vibNotif, setVibNotif, vibZikir, setVibZikir, soundMode, setSoundMode, ongoing, setOngoing }) {
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
        <Text style={u.tip}>Bildirim çubuğunda bir sonraki vakte kalan süre ve günün vakitleri görünür. Kaydırıp kapatırsanız 3 dakika sonra yeniden gelir; 20 dakika içinde 5 kez kaydırırsanız 30 dakika gizli kalır.</Text>
      </Card>

      {HAYYA_SOUND_READY && (
        <Card title="🔔 Bildirim sesi">
          <View style={{ marginTop: 12 }}>
            <Seg items={[['hayya', 'Hayya sesi'], ['sistem', 'Telefonun sesi']]} value={soundMode} onChange={setSoundMode} />
          </View>
          <Text style={u.tip}>"Bildirim" seçili vakitlerde ve hatırlatmalarda çalar. Ezan seçili vakitlerde ezan okunur.</Text>
        </Card>
      )}

    </ScrollView>
  );
}
