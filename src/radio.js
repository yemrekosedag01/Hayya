// Hayya Radyo: sunucusuz 7/24 yayın. Çalma listesi ve sponsor duyuruları içerik tablosundan
// ("Radyo" ve "Sponsorlar" sayfaları) gelir. Yayın saate göre hesaplanır: herkes aynı anda aynı yeri dinler.
import { fetchSheet, approved } from './content';
import { load, save } from './storage';
import { trNow } from './prayer';

export const SPONSOR_EVERY = 3; // her 3 parçada bir sponsor duyurusu (sureler arasında)
const EPOCH = Date.UTC(2026, 0, 1, 0, 0, 0) - 3 * 3600e3; // 1 Ocak 2026 00:00 (TR)

const num = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isFinite(n) ? n : 0; };
// GG.AA.YYYY -> gün sayısı (boş = sınırsız)
const dayOf = (v) => {
  const m = String(v || '').trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m ? Math.floor(Date.UTC(+m[3], +m[2] - 1, +m[1]) / 864e5) : null;
};

export function buildRadio(rows, sponsorRows) {
  const tracks = rows
    .filter((r) => approved(r['onaylı']) && r['ses linki'] && num(r['süre (sn)']) > 0)
    .map((r) => ({ n: num(r['sıra']), url: r['ses linki'], dur: Math.round(num(r['süre (sn)'])), title: r['sure'] || 'Kur’an-ı Kerim', sub: r['kari'] || '' }))
    .sort((a, b) => a.n - b.n);
  const sponsors = sponsorRows
    .filter((r) => approved(r['onaylı']) && r['sponsor'])
    .map((r) => ({ name: r['sponsor'], url: r['duyuru ses linki'], dur: Math.round(num(r['süre (sn)'])), text: r['ekran yazısı'] || r['sponsor'], from: dayOf(r['başlangıç']), to: dayOf(r['bitiş']) }));
  return { tracks, sponsors };
}

export async function loadRadio(onUpdate) {
  const cached = await load('radio', { tracks: [], sponsors: [] });
  (async () => {
    try {
      const [rows, sp] = await Promise.all([fetchSheet('Radyo'), fetchSheet('Sponsorlar').catch(() => [])]);
      const fresh = buildRadio(rows, sp);
      await save('radio', fresh);
      onUpdate && onUpdate(fresh);
    } catch (e) {}
  })();
  return cached;
}

/** Bugün yayında olan sponsorlar. */
export function activeSponsors(radio) {
  const n = trNow();
  const today = Math.floor(Date.UTC(n.y, n.m - 1, n.d) / 864e5);
  return radio.sponsors.filter((s) => (s.from == null || s.from <= today) && (s.to == null || today <= s.to));
}

/** Telefona verilecek yayın akışı: parçalar + her SPONSOR_EVERY parçada bir sponsor duyurusu. */
export function buildPlaylist(radio) {
  const sp = activeSponsors(radio).filter((s) => s.url && s.dur > 0);
  const items = [];
  let k = 0;
  radio.tracks.forEach((t, i) => {
    items.push({ url: t.url, dur: t.dur, title: t.title, sub: t.sub });
    if (sp.length && (i + 1) % SPONSOR_EVERY === 0) {
      const s = sp[k++ % sp.length];
      items.push({ url: s.url, dur: s.dur, title: 'Sponsor duyurusu', sub: s.name });
    }
  });
  return { epoch: EPOCH, items };
}

/** Şu an yayında olan parça (telefonda çalmıyorken göstermek için). */
export function liveNow(playlist) {
  const total = playlist.items.reduce((a, x) => a + x.dur * 1000, 0);
  if (!total) return null;
  let t = (((Date.now() - playlist.epoch) % total) + total) % total;
  for (const x of playlist.items) { if (t < x.dur * 1000) return x; t -= x.dur * 1000; }
  return playlist.items[0];
}
