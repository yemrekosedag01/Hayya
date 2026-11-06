import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Linking, Modal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SOUNDS, soundLabel, isLong, REM_MINUTES } from '../sounds';
import { previewSound, stopPreview, isPreviewing, canExact, openExactSettings } from '../../modules/hayya-ongoing';
import { AppState } from 'react-native';
import { C, themed } from '../theme';
import { KEYS, NAMES } from '../prayer';
import { testNotification } from '../notifications';
import { HAS_EZAN_SOUND } from '../config';
import { Card, u } from './ui';

export default function NotifScreen({ loc, vakitSnd, setVakitSnd, hatirlatma, setHatirlatma, notifOk, retryNotif, vibNotif }) {
  const [pick, setPick] = useState(null); // { kind: 'rem' | 'vakit', k }
  const [exact, setExact] = useState(() => canExact());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') setExact(canExact()); });
    return () => sub.remove();
  }, []);
  const setRem = (k, patch) => setHatirlatma({ ...hatirlatma, [k]: { ...hatirlatma[k], ...patch } });
  const ezanTest = isLong(vakitSnd.ogle) ? vakitSnd.ogle : 'ezan';
  return (
    <ScrollView contentContainerStyle={u.page}>
      {!exact && (
        <Card style={{ marginTop: 0, marginBottom: 14, borderColor: C.gold, backgroundColor: C.goldSoft }}>
          <Text style={[u.quote, { fontSize: 16, marginTop: 0 }]}>⏰ Ezanın tam vaktinde okunması için "Alarmlar ve hatırlatıcılar" iznini açın.</Text>
          <Text style={[u.tip, { color: C.ink }]}>Bu izin kapalıyken telefon, pil tasarrufu için ezanı birkaç dakika geciktirebilir.</Text>
          <Pressable style={u.btn} onPress={openExactSettings}><Text style={u.btnTxt}>İzni aç</Text></Pressable>
        </Card>
      )}
      {!notifOk && (
        <Card style={{ marginTop: 0, marginBottom: 14, borderColor: C.bad }}>
          <Text style={[u.quote, { fontSize: 16, marginTop: 0 }]}>Bildirim izni kapalı. Vakit uyarıları için izin verin.</Text>
          <Pressable style={u.btn} onPress={retryNotif}><Text style={u.btnTxt}>İzin ver</Text></Pressable>
          <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
            <Text style={[u.btnTxt, { color: C.green }]}>Telefon ayarlarını aç</Text>
          </Pressable>
        </Card>
      )}

      <Card title="⏰ Vakitten önce hatırlatma" style={{ marginTop: 0 }}>
        {KEYS.map((k, i) => {
          const r = hatirlatma[k];
          const off = r.snd === 'off';
          return (
            <View key={k} style={[s.row, i === KEYS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.name}>{NAMES[k]}</Text>
              <View style={[s.mins, off && { opacity: 0.35 }]}>
                {REM_MINUTES.map((m) => (
                  <Pressable key={m} onPress={() => setRem(k, { min: m })} style={[s.min, r.min === m && s.minOn]} hitSlop={4}>
                    <Text style={[s.minT, r.min === m && { color: '#fff' }]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              <SoundBtn value={r.snd} onPress={() => setPick({ kind: 'rem', k })} />
            </View>
          );
        })}
        <Text style={u.tip}>Sayılar, vakitten kaç dakika önce hatırlatılacağını gösterir. Sesi "Kapalı" yaparsanız o vakit için hatırlatma gelmez.</Text>
      </Card>

      <Card title="🕌 Vakit girince">
        {KEYS.map((k, i) => (
          <View key={k} style={[s.row, i === KEYS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={s.name}>{NAMES[k]}</Text>
            <View style={{ flex: 1 }} />
            <SoundBtn value={vakitSnd[k]} wide onPress={() => setPick({ kind: 'vakit', k })} />
          </View>
        ))}
        <Text style={u.tip}>Ezan çalarken ses açma ya da kısma tuşuna basarak veya bildirimdeki "Sustur" düğmesiyle susturabilirsiniz. Bildirim çubuğunu indirmek ezanı susturmaz.</Text>
      </Card>

      <Pressable style={u.btn} onPress={() => testNotification(loc, false, 'hayya', vibNotif)}>
        <Text style={u.btnTxt}>🔔 Deneme bildirimi gönder</Text>
      </Pressable>
      {HAS_EZAN_SOUND && (
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => testNotification(loc, true, 'hayya', vibNotif, ezanTest)}>
          <Text style={[u.btnTxt, { color: C.green }]}>🕌 Ezan sesini dene (bildirimle)</Text>
        </Pressable>
      )}

      <Card title="💡 Bildirimler geç geliyorsa">
        <Text style={[u.tip, { color: C.ink }]}>Bazı telefonlar (Xiaomi, Samsung, Oppo, Huawei) pil tasarrufu için bildirimleri geciktirebilir. Telefon ayarlarından Hayya için "Pil kısıtlaması yok" seçeneğini ve "Alarmlar ve hatırlatıcılar" iznini açın. Bildirimler 14 gün ileriye kurulur; uygulamayı arada bir açmanız yeterlidir.</Text>
        <Pressable style={[u.btn, u.btnGhost]} onPress={() => Linking.openSettings()}>
          <Text style={[u.btnTxt, { color: C.green }]}>Uygulama ayarlarını aç</Text>
        </Pressable>
      </Card>
      <SoundPicker pick={pick} onClose={() => setPick(null)}
        value={pick ? (pick.kind === 'rem' ? hatirlatma[pick.k].snd : vakitSnd[pick.k]) : null}
        onChange={(v) => { if (pick.kind === 'rem') setRem(pick.k, { snd: v }); else setVakitSnd({ ...vakitSnd, [pick.k]: v }); }} />
    </ScrollView>
  );
}

function SoundBtn({ value, onPress, wide }) {
  const off = value === 'off';
  return (
    <Pressable onPress={onPress} style={[s.sb, wide && { minWidth: 150 }, off && s.sbOff]} hitSlop={4}>
      <Text style={[s.sbT, off && { color: C.muted }]} numberOfLines={1}>{off ? 'Kapalı' : soundLabel(value)}</Text>
      <Text style={[s.sbT, { color: C.muted }]}> ▾</Text>
    </Pressable>
  );
}

function SoundPicker({ pick, onClose, value, onChange }) {
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
  const opts = [{ id: 'off', label: 'Kapalı' }, ...SOUNDS];
  return (
    <Modal visible={!!pick} animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView style={s.sheet} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={[u.h2, { marginBottom: 0 }]}>{pick ? NAMES[pick.k] : ''}</Text>
              <Text style={u.src}>{pick && pick.kind === 'rem' ? 'Vakitten önce hatırlatma sesi' : 'Vakit girince çalacak ses'}</Text>
            </View>
            <Pressable onPress={close} style={s.close}><Text style={s.closeT}>Tamam</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {opts.map((o) => (
              <View key={o.id} style={s.opt}>
                <Pressable style={s.optMain} onPress={() => onChange(o.id)}>
                  <Text style={[s.radio, value === o.id && { color: C.green }]}>{value === o.id ? '◉' : '○'}</Text>
                  <Text style={[s.optT, value === o.id && { color: C.green }]}>{o.label}</Text>
                </Pressable>
                {o.id !== 'off' && (
                  <Pressable style={s.play} onPress={() => listen(o.id)} hitSlop={6} accessibilityLabel={o.label + ' dinle'}>
                    <Text style={s.playT}>{playing === o.id ? '■' : '▶'}</Text>
                  </Pressable>
                )}
              </View>
            ))}
            <Text style={[u.tip, { marginTop: 14 }]}>▶ ile dinleyebilirsiniz.</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = themed(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { width: 58, fontSize: 15, fontWeight: '800', color: C.ink },
  mins: { flexDirection: 'row', backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 2 },
  min: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  minOn: { backgroundColor: C.primary },
  minT: { fontSize: 13, fontWeight: '800', color: C.muted },
  sb: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: C.card, borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 },
  sbOff: { borderColor: C.line, backgroundColor: C.bg },
  sbT: { fontSize: 13, fontWeight: '800', color: C.green, flexShrink: 1 },
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
