// Seçilebilir sesler. long: uzun ses (ezan) -> uygulamanın kendi oynatıcısıyla çalar ("Sustur" düğmeli)
export const SOUNDS = [
  { id: 'ezan', label: 'Ezan 1 (Segâh)', long: true },
  { id: 'kisa_ezan', label: 'Kısa Ezan', long: true },
  { id: 'uzun_ezan', label: 'Ezan 2', long: true },
  { id: 'sabah_ezan', label: 'Sabah Ezanı', long: true },
  { id: 'salat_hayrun', label: 'Es-salâtü hayrun', long: true },
  { id: 'hayya_ses', label: 'Hayya bildirim sesi', long: false },
  { id: 'default', label: 'Telefonun sesi', long: false },
];
export const soundLabel = (id) => (SOUNDS.find((s) => s.id === id) || SOUNDS[0]).label;
export const isLong = (id) => !!(SOUNDS.find((s) => s.id === id) || {}).long;

// Varsayılanlar: imsakta Sabah Ezanı, diğer vakitlerde Ezan 1 (Segâh); bütün hatırlatmalarda Hayya bildirim sesi
export const DEFAULT_EZAN_SOUNDS = { imsak: 'sabah_ezan', gunes: 'ezan', ogle: 'ezan', ikindi: 'ezan', aksam: 'ezan', yatsi: 'ezan' };
export const DEFAULT_REM_SOUNDS = { imsak: 'hayya_ses', ogle: 'hayya_ses', ikindi: 'hayya_ses', aksam: 'hayya_ses', yatsi: 'hayya_ses' };

// ---- Yeni ayar yapısı ----
// vakitSnd: vakit girince çalacak ses ya da 'off'
// hatirlatma: vakitten önce { min: 15|30|45, snd: ses ya da 'off' }
export const REM_MINUTES = [15, 30, 45];
export const DEFAULT_VAKIT_SND = { imsak: 'sabah_ezan', gunes: 'off', ogle: 'ezan', ikindi: 'ezan', aksam: 'ezan', yatsi: 'ezan' };
export const DEFAULT_HATIRLATMA = {
  imsak: { min: 15, snd: 'hayya_ses' }, gunes: { min: 30, snd: 'off' }, ogle: { min: 15, snd: 'hayya_ses' },
  ikindi: { min: 15, snd: 'hayya_ses' }, aksam: { min: 15, snd: 'hayya_ses' }, yatsi: { min: 15, snd: 'hayya_ses' },
};

/** Eski ayarlardan (alarms + pre + soundMode + ezanSounds + remSounds) yeni yapıya geçiş. */
export function migrateSounds(old) {
  const { alarms, pre, soundMode, ezanSounds = {}, remSounds = {} } = old;
  const vakitSnd = { ...DEFAULT_VAKIT_SND };
  const hatirlatma = JSON.parse(JSON.stringify(DEFAULT_HATIRLATMA));
  if (alarms) {
    for (const k of Object.keys(vakitSnd)) {
      const a = alarms[k];
      if (a === 'off') vakitSnd[k] = 'off';
      else if (a === 'bildirim') vakitSnd[k] = soundMode === 'sistem' ? 'default' : 'hayya_ses';
      else if (a === 'ezan') vakitSnd[k] = ezanSounds[k] || DEFAULT_VAKIT_SND[k] || 'ezan';
    }
  }
  if (pre != null) {
    const min = REM_MINUTES.includes(pre) ? pre : 15;
    for (const k of Object.keys(hatirlatma)) {
      if (k === 'gunes') continue;
      hatirlatma[k] = { min, snd: pre > 0 ? (remSounds[k] || 'hayya_ses') : 'off' };
    }
  }
  return { vakitSnd, hatirlatma };
}
