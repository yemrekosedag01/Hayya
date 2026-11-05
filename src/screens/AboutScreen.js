import React from 'react';
import { ScrollView, Text, Pressable, Linking } from 'react-native';
import Constants from 'expo-constants';
import { C } from '../theme';
import { Card, u } from './ui';

export default function AboutScreen() {
  const v = Constants.expoConfig?.version || '';
  return (
    <ScrollView contentContainerStyle={u.page}>
      <Card title="🕌 Hayya" style={{ marginTop: 0 }}>
        <Text style={u.tip}>Hayya; namaz vakitleri, ezan uyarıları, vaktin ayeti ve hadisi, dersler, quiz, zikirmatik ve kıble pusulası sunan bir uygulamadır. "Hayya ale's-salâh" (haydi namaza) çağrısından adını alır.</Text>
        <Text style={[u.src, { marginTop: 10 }]}>Sürüm {v}</Text>
      </Card>
      <Card title="🔒 Gizlilik">
        <Text style={u.tip}>• Hesap açmanız gerekmez; adınız, e-postanız veya telefon numaranız istenmez.</Text>
        <Text style={u.tip}>• Konum yalnızca namaz vakitlerini ve kıble yönünü hesaplamak için telefonunuzda kullanılır, hiçbir sunucuya gönderilmez.</Text>
        <Text style={u.tip}>• Ayarlarınız, zikir sayılarınız ve quiz skorlarınız yalnızca telefonunuzda saklanır.</Text>
        <Text style={u.tip}>• Duyuru bildirimleri Google Firebase ile gönderilir. Bunun için telefonunuza bir bildirim kimliği verilir ve seçtiğiniz şehrin (ör. Adana) duyuru kanalına abone olunur.</Text>
        <Text style={u.tip}>• Ayet, hadis ve quiz içerikleri internetten indirilir; bu sırada kişisel bilgi gönderilmez.</Text>
      </Card>
      <Card title="📚 Kaynaklar">
        <Text style={u.tip}>Vakitler Diyanet İşleri Başkanlığının kullandığı Türkiye yöntemiyle hesaplanır. Dini günler ve hicri tarihler Diyanet takvimine göredir.</Text>
      </Card>
      <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openURL('https://instagram.com/hayya.vakit')}>
        <Text style={[u.btnTxt, { color: C.green }]}>📷 Bize ulaşın · @hayya.vakit</Text>
      </Pressable>
    </ScrollView>
  );
}
