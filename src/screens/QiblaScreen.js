import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle, Path, Text as SvgText, G, Rect, Line } from 'react-native-svg';
import { C, themed } from '../theme';
import { qibla } from '../prayer';
import { Card, u } from './ui';

export default function QiblaScreen({ loc }) {
  const [heading, setHeading] = useState(null);
  const [perm, setPerm] = useState(null);
  const q = qibla(loc.lat, loc.lng);

  const startWatch = async () => {
    const p = await Location.getForegroundPermissionsAsync();
    setPerm(p.granted);
    if (!p.granted) return null;
    try {
      return await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    } catch (e) { return null; }
  };

  useEffect(() => {
    let sub; let dead = false;
    startWatch().then((x) => { if (dead) x && x.remove(); else sub = x; });
    return () => { dead = true; sub && sub.remove(); };
  }, [loc, perm]);

  const needle = heading == null ? q : q - heading;
  // Telefon kıbleye ±5° dönükse yeşil onay
  const diff = heading == null ? null : Math.abs(((q - heading + 540) % 360) - 180);
  const aligned = diff != null && diff <= 5;

  return (
    <ScrollView contentContainerStyle={[u.page, { alignItems: 'stretch' }]}>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Svg width={290} height={290} viewBox="0 0 110 110">
          <Circle cx="55" cy="55" r="52" fill={C.card} stroke={aligned ? C.ok : C.line} strokeWidth="3" />
          <G rotation={heading == null ? 0 : -heading} origin="55, 55">
            {Array.from({ length: 36 }, (_, i) => (
              <Line key={i} x1="55" y1="5" x2="55" y2={i % 9 === 0 ? 11 : 8} stroke={C.muted} strokeWidth={i % 9 === 0 ? 1.2 : 0.6} rotation={i * 10} origin="55, 55" />
            ))}
            <SvgText x="55" y="20" textAnchor="middle" fontSize="9" fontWeight="900" fill={C.bad}>K</SvgText>
            <SvgText x="92" y="58" textAnchor="middle" fontSize="8" fill={C.muted}>D</SvgText>
            <SvgText x="55" y="96" textAnchor="middle" fontSize="8" fill={C.muted}>G</SvgText>
            <SvgText x="18" y="58" textAnchor="middle" fontSize="8" fill={C.muted}>B</SvgText>
          </G>
          <G rotation={needle} origin="55, 55">
            <Path d="M55 22 L61 55 L55 51 L49 55 Z" fill={aligned ? C.ok : C.primary} />
            <Rect x="50.5" y="13" width="9" height="8" rx="1.5" fill={C.ink} />
            <Rect x="50.5" y="15" width="9" height="1.4" fill={C.gold} />
          </G>
          <Circle cx="55" cy="55" r="3.5" fill={C.gold} />
        </Svg>
      </View>

      <Text style={s.deg}>{Math.round(q)}°</Text>
      <Text style={[u.src, { textAlign: 'center' }]}>{loc.name} için kıble açısı (kuzeyden saat yönünde)</Text>
      {aligned && <Text style={s.ok}>✓ Kıbleye dönüksünüz</Text>}

      {perm === false ? (
        <Card>
          <Text style={u.tip}>Canlı pusula için konum izni gerekir. İzin vermezseniz yukarıdaki açıyı bir pusulayla kullanabilirsiniz.</Text>
          <Pressable style={u.btn} onPress={async () => { const p = await Location.requestForegroundPermissionsAsync(); setPerm(p.granted); }}>
            <Text style={u.btnTxt}>Konum izni ver</Text>
          </Pressable>
        </Card>
      ) : (
        <Card title="💡 Doğru sonuç için">
          <Text style={u.tip}>Telefonu yere paralel tutun, metal eşyalardan ve mıknatıslardan uzak durun. Ok sapıyorsa telefonu havada birkaç kez 8 çizerek pusulayı ayarlayın.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const s = themed(() => ({
  deg: { fontSize: 40, fontWeight: '900', color: C.ink, textAlign: 'center', marginTop: 6 },
  ok: { textAlign: 'center', color: C.ok, fontSize: 17, fontWeight: '900', marginTop: 8 },
}));
