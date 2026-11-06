// Bildirim çubuğundaki kalıcı vakit göstergesi (yalnızca Android).
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const Native = Platform.OS === 'android' ? requireOptionalNativeModule('HayyaOngoing') : null;

export function startOngoing(payload) {
  try { if (Native) Native.start(JSON.stringify(payload)); } catch (e) {}
}

export function stopOngoing() {
  try { if (Native) Native.stop(); } catch (e) {}
}

/** Ezan uygulama içinde (medya sesiyle) çalınabiliyor mu? */
export const hasNativeEzan = () => !!(Native && Native.setEzan);

export function setEzan(list, vib) {
  try { if (Native) Native.setEzan(JSON.stringify(list), !!vib); } catch (e) {}
}

export function testEzan(title, body) {
  try { if (Native) Native.testEzan(title, body); } catch (e) {}
}
