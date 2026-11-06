import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Linking, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SOUNDS, soundLabel } from '../sounds';
import { previewSound, stopPreview, isPreviewing } from '../../modules/hayya-ongoing';
import { C, themed } from '../theme';
import { KEYS, NAMES } from '../prayer';
import { testNotification } from '../notifications';
import { HAS_EZAN_SOUND } from '../config';
import { Card, Seg, u } from './ui';

const MODES = [['off', 'Kapalı'], ['bildirim', 'Bildirim'], ['ezan', 'Ezan']];
const PRE = [0, 10, 15, 30, 45];

export default function NotifScreen({ loc, alarms, setAlarms, pre, setPre, notifOk, retryNotif, soundMode, vibNotif, ezanSounds, setEzanSounds, remSounds, setRemSounds }) {
  const [pick, setPick] = useState(null); // ses seçilen vakit
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

      <Card title="🎵 Sesler">
        <Text style={u.tip}>Her vakit için ezan sesini ve hatırlatma sesini seçebilirsiniz. Ezan sesi, vakit "Ezan" seçiliyken çalar.</Text>
        {KEYS.map((k, i) => (
          <Pressable key={k} onPress={() => setPick(k)} style={[s.row, i === KEYS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{NAMES[k]}</Text>
              <Text style={s.snd}>🕌 {soundLabel(ezanSounds[k])}</Text>
              {k !== 'gunes' && <Text style={s.snd}>⏰ {soundLabel(remSounds[k])}</Text>}
            </View>
            <Text style={s.ch}>Değiştir ›</Text>
          </Pressable>
        ))}
      </Card>

      <Pressable style={u.btn} onPress={() => testNotification(loc, false, soundMode, vibNotif)}>
        <Text style={u.btnTxt}>🔔 Deneme bildirimi gönder</Text>
      </Pressable>
      {HAS_EZAN_SOUND && (
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => testNotification(loc, true, soundMode, vibNotif, ezanSounds.ogle)}>
          <Text style={[u.btnTxt, { color: C.green }]}>🕌 Ezan sesini dene (bildirimle)</Text>
        </Pressable>
      )}

      <Card title="💡 Bildirimler geç geliyorsa">
        <Text style={[u.tip, { color: C.ink }]}>Bazı telefonlar (Xiaomi, Samsung, Oppo, Huawei) pil tasarrufu için bildirimleri geciktirebilir. Telefon ayarlarından Hayya için "Pil kısıtlaması yok" seçeneğini ve "Alarmlar ve hatırlatıcılar" iznini açın. Bildirimler 14 gün ileriye kurulur; uygulamayı arada bir açmanız yeterlidir.</Text>
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
          <Text style={[u.btnTxt, { color: C.green }]}>Uygulama ayarlarını aç</Text>
        </Pressable>
      </Card>
      <SoundPicker vakit={pick} onClose={() => setPick(null)}
        ezan={pick ? ezanSounds[pick] : null} setEzan={(v) => setEzanSounds({ ...ezanSounds, [pick]: v })}
        rem={pick ? remSounds[pick] : null} setRem={(v) => setRemSounds({ ...remSounds, [pick]: v })} />
    </ScrollView>
  );
}

function SoundPicker({ vakit, onClose, ezan, setEzan, rem, setRem }) {
  const [playing, setPlaying] = useState(null);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => { if (!isPreviewing()) setPlaying(null); }, 500);
    return () => clearInterval(id);
  }, [playing]);
  const close = () => { stopPreview(); setPlaying(null); onClose(); };
  const listen = (id) => {
    if (playing === id) { stopPreview(); setPlaying(null); return; }
    previewSound(id); setPlaying(id);
  };
  const section = (title, value, set) => (
    <View style={{ marginTop: 16 }}>
      <Text style={u.cardTitle}>{title}</Text>
      {SOUNDS.map((o) => (
        <View key={o.id} style={s.opt}>
          <Pressable style={s.optMain} onPress={() => set(o.id)}>
            <Text style={[s.radio, value === o.id && { color: C.green }]}>{value === o.id ? '◉' : '○'}</Text>
            <Text style={[s.optT, value === o.id && { color: C.green }]}>{o.label}</Text>
          </Pressable>
          <Pressable style={s.play} onPress={() => listen(o.id)} hitSlop={6} accessibilityLabel={o.label + ' dinle'}>
            <Text style={s.playT}>{playing === o.id ? '■' : '▶'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
  return (
    <Modal visible={!!vakit} animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView style={s.sheet} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.sheetHead}>
            <Text style={[u.h2, { marginBottom: 0 }]}>{vakit ? NAMES[vakit] : ''} sesleri</Text>
            <Pressable onPress={close} style={s.close}><Text style={s.closeT}>Tamam</Text></Pressable>
          </View>
          <ScrollView>
            {section('🕌 Ezan vaktinde', ezan, setEzan)}
            {vakit !== 'gunes' && section('⏰ Vakitten önce hatırlatmada', rem, setRem)}
            <Text style={[u.tip, { marginTop: 14 }]}>▶ ile dinleyebilirsiniz. Ezanlar çalarken ses tuşlarıyla kısılır, bildirimdeki "Sustur" düğmesiyle susturulur.</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = themed(() => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontSize: 16, fontWeight: '800', color: C.ink },
  snd: { fontSize: 13, fontWeight: '700', color: C.muted, marginTop: 2 },
  ch: { fontSize: 14, fontWeight: '800', color: C.green },
  sheet: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.primary },
  closeT: { fontSize: 15, fontWeight: '800', color: '#fff' },
  opt: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 14, marginTop: 8 },
  optMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  radio: { fontSize: 18, color: C.muted, fontWeight: '900' },
  optT: { fontSize: 15, fontWeight: '800', color: C.ink },
  play: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.line },
  playT: { fontSize: 16, fontWeight: '900', color: C.green },
}));
