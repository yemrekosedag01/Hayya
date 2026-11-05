import { StyleSheet } from 'react-native';

// green: vurgu/yazı rengi, primary: buton ve dolgu rengi (koyu temada ayrışır)
const LIGHT = {
  bg: '#F6F1E7', card: '#FFFDF8', ink: '#1E2B27', muted: '#6F7A74',
  green: '#1F5A4A', green2: '#2E7A63', gold: '#C9A24A', goldSoft: '#F1E4C2', goldInk: '#8A6A1F',
  line: '#E7DECC', ok: '#2E7A63', okSoft: '#E3F1EA', bad: '#B4533F', badSoft: '#F7E4DF',
  primary: '#1F5A4A',
};
const DARK = {
  bg: '#0F1513', card: '#18211D', ink: '#E6ECE8', muted: '#93A09A',
  green: '#6CC3A0', green2: '#4FA886', gold: '#D4B05A', goldSoft: '#3A3220', goldInk: '#E8C877',
  line: '#2A3530', ok: '#5CC08F', okSoft: '#1D3A2C', bad: '#E07A62', badSoft: '#3D2420',
  primary: '#2C7A60',
};

export const C = { ...LIGHT };
let mode = 'light';

/** Tema değişince C nesnesinin renkleri yerinde güncellenir. */
export function setTheme(m) {
  if (m === mode) return;
  mode = m;
  Object.assign(C, m === 'dark' ? DARK : LIGHT);
}
export const isDark = () => mode === 'dark';

/** Temaya duyarlı stil: her tema için bir kez oluşturulur, okunurken o anki temanınki döner. */
export function themed(fn) {
  const cache = {};
  return new Proxy({}, {
    get(_, k) {
      const c = cache[mode] || (cache[mode] = StyleSheet.create(fn()));
      return c[k];
    },
  });
}
