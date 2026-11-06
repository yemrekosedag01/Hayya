import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { C, themed } from '../theme';
import { hasRadio, radioPlay, radioStop, radioState } from '../../modules/hayya-ongoing';
import { buildPlaylist, liveNow, activeSponsors } from '../radio';
import { u } from './ui';

export default function RadioCard({ radio }) {
  const [st, setSt] = useState(() => radioState());
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { setSt(radioState()); tick((x) => x + 1); }, 1000);
    return () => clearInterval(id);
  }, []);

  const ready = radio && radio.tracks.length > 0 && hasRadio();
  const playlist = ready ? buildPlaylist(radio) : null;
  const on = !!(st && (st.playing || st.buffering));
  const live = playlist ? liveNow(playlist) : null;
  const title = on && st.title ? st.title : live ? live.title : '';
  const sub = on && st.title ? st.sub : live ? live.sub : '';
  const sponsors = radio ? activeSponsors(radio).map((s) => s.text).filter(Boolean) : [];

  const toggle = () => {
    if (on) radioStop(); else radioPlay(playlist);
    setSt({ ...(st || {}), playing: false, buffering: !on });
  };

  return (
    <View style={[u.card, s.card]}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={u.cardTitle}>📻 Hayya Radyo</Text>
          <Text style={s.sub}>7/24 Kur{'’'}an-ı Kerim</Text>
        </View>
        {ready && (
          <Pressable onPress={toggle} style={[s.btn, on && s.btnOn]} accessibilityLabel={on ? 'Radyoyu durdur' : 'Radyoyu başlat'}>
            {st && st.buffering ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>{on ? '■' : '▶'}</Text>}
          </Pressable>
        )}
      </View>
      {ready ? (
        <>
          <Text style={s.now}>{on ? (st.buffering ? 'Bağlanıyor…' : 'Şu an dinliyorsunuz') : 'Şu an yayında'}</Text>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {sub ? <Text style={u.src} numberOfLines={1}>{sub}</Text> : null}
          {sponsors.length > 0 && <Text style={s.sp}>Bu yayın {sponsors.join(', ')} katkılarıyla</Text>}
        </>
      ) : (
        <Text style={[u.tip, { marginTop: 6 }]}>Yayın çok yakında başlıyor inşallah.</Text>
      )}
    </View>
  );
}

const s = themed(() => ({
  card: { borderColor: C.gold },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sub: { fontSize: 15, fontWeight: '800', color: C.ink, marginTop: 2 },
  btn: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  btnOn: { backgroundColor: C.bad },
  btnT: { color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 2 },
  now: { fontSize: 12, fontWeight: '800', color: C.muted, marginTop: 12 },
  title: { fontSize: 18, fontWeight: '900', color: C.green, marginTop: 2 },
  sp: { fontSize: 12, fontWeight: '700', color: C.goldInk, marginTop: 8 },
}));
