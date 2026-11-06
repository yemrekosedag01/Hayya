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
