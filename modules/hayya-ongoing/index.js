// Bildirim çubuğundaki kalıcı vakit göstergesi (yalnızca Android).
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const Native = Platform.OS === 'android' ? requireOptionalNativeModule('HayyaOngoing') : null;

export function startOngoing(payload) {
  try { if (Native) Native.start(JSON.stringify(payload)); } catch (e) {}
}

export function setOngoingData(payload) {
  try { if (Native && Native.setData) Native.setData(JSON.stringify(payload)); } catch (e) {}
}

export function stopOngoing() {
  try { if (Native) Native.stop(); } catch (e) {}
}

/** Ezan uygulama içinde (medya sesiyle) çalınabiliyor mu? */
export const hasNativeEzan = () => !!(Native && Native.setEzan);

export function setEzan(list, vib) {
  try { if (Native) Native.setEzan(JSON.stringify(list), !!vib); } catch (e) {}
}

export function testEzan(title, body, snd = 'ezan') {
  try { if (Native) Native.testEzan(title, body, snd); } catch (e) {}
}

// Ses seçerken dinletme
export function previewSound(name) { try { if (Native) Native.preview(name); } catch (e) {} }
export function stopPreview() { try { if (Native) Native.stopPreview(); } catch (e) {} }
export function isPreviewing() { try { return Native ? Native.isPreviewing() : false; } catch (e) { return false; } }

// ---- Hayya Radyo ----
export const hasRadio = () => !!(Native && Native.radioPlay);
export function radioPlay(playlist) {
  try { if (Native) Native.radioPlay(JSON.stringify(playlist)); } catch (e) {}
}
export function radioStop() {
  try { if (Native) Native.radioStop(); } catch (e) {}
}
export function radioState() {
  try { return Native ? JSON.parse(Native.radioState()) : null; } catch (e) { return null; }
}

// "Alarmlar ve hatırlatıcılar" izni
export function canExact() { try { return Native && Native.canExact ? Native.canExact() : true; } catch (e) { return true; } }
export function openExactSettings() { try { if (Native && Native.openExactSettings) Native.openExactSettings(); } catch (e) {} }
