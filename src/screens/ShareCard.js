import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Image, ActivityIndicator } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { C, themed } from '../theme';

// Paylaşılabilir kart: Hayya logolu kare görsel (WhatsApp / Instagram)
// card: { label, text, src } — label: "📖 Vaktin Ayeti" gibi; tebrikte text büyük başlık olur
export default function ShareCard({ card, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const share = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1080 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Hayya kartını paylaş' });
    } catch (e) {}
    setBusy(false);
  };
  const greet = card && card.kind === 'tebrik';
  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.back}>
          {card && (
            <>
              <View ref={ref} collapsable={false} style={s.card}>
                <View style={s.inner}>
                  <Text style={s.label}>{card.label}</Text>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={greet ? s.greet : [s.text, card.text.length > 160 && { fontSize: 17, lineHeight: 25 }]}
                      numberOfLines={greet ? 3 : 10} adjustsFontSizeToFit minimumFontScale={0.6}>
                      {greet ? card.text : `“${card.text}”`}
                    </Text>
                    {card.src ? <Text style={s.src}>{card.src}</Text> : null}
                  </View>
                  <View style={s.brand}>
                    <Image source={require('../../assets/icon.png')} style={s.logo} />
                    <View>
                      <Text style={s.bName}>Hayya</Text>
                      <Text style={s.bSub}>Ezan Vakti ve Dini Bilgiler · @hayya.vakit</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.btns}>
                <Pressable style={[s.btn, s.ghost]} onPress={onClose}><Text style={[s.btnT, { color: '#fff' }]}>Kapat</Text></Pressable>
                <Pressable style={s.btn} onPress={share} disabled={busy}>
                  {busy ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnT}>📤 Paylaş</Text>}
                </Pressable>
              </View>
            </>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// Kartın renkleri temadan bağımsız (her zaman aynı görünsün)
const s = themed(() => ({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: 340, height: 340, backgroundColor: '#F6F1E7', borderRadius: 4, padding: 12 },
  inner: { flex: 1, borderWidth: 2, borderColor: '#C9A24A', borderRadius: 2, padding: 16 },
  label: { fontSize: 13, fontWeight: '900', color: '#C9A24A', letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase' },
  text: { fontSize: 20, lineHeight: 28, fontWeight: '800', color: '#1F5A4A', textAlign: 'center' },
  greet: { fontSize: 30, lineHeight: 38, fontWeight: '900', color: '#1F5A4A', textAlign: 'center' },
  src: { fontSize: 13, fontWeight: '700', color: '#6F7A74', textAlign: 'center', marginTop: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { width: 28, height: 28, borderRadius: 7 },
  bName: { fontSize: 15, fontWeight: '900', color: '#1F5A4A' },
  bSub: { fontSize: 10, fontWeight: '700', color: '#6F7A74' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btn: { minWidth: 130, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#fff' },
  ghost: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff' },
  btnT: { fontSize: 16, fontWeight: '900', color: C.primary },
}));

/** Dini gün adından tebrik cümlesi. */
export function greetingFor(name) {
  const n = name.replace(/\s*\(.*\)$/, '');
  const map = {
    'Üç Ayların Başlangıcı': 'Üç Aylarınız mübarek olsun',
    'Regaip Kandili': 'Regaip Kandiliniz mübarek olsun',
    'Miraç Kandili': 'Miraç Kandiliniz mübarek olsun',
    'Berat Kandili': 'Berat Kandiliniz mübarek olsun',
    'Ramazan Başlangıcı': 'Hayırlı Ramazanlar',
    'Kadir Gecesi': 'Kadir Geceniz mübarek olsun',
    'Ramazan Bayramı Arifesi': 'Ramazan Bayramınız mübarek olsun',
    'Ramazan Bayramı': 'Ramazan Bayramınız mübarek olsun',
    'Kurban Bayramı Arifesi': 'Kurban Bayramınız mübarek olsun',
    'Kurban Bayramı': 'Kurban Bayramınız mübarek olsun',
    'Hicri Yılbaşı': 'Hicri yeni yılınız mübarek olsun',
    'Aşure Günü': 'Aşure Gününüz mübarek olsun',
    'Mevlid Kandili': 'Mevlid Kandiliniz mübarek olsun',
  };
  return map[n] || `${n} mübarek olsun`;
}
