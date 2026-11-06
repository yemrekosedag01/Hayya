import { SHEET_ID } from './config';
import { load, save } from './storage';

// Örnek içerik — tablo bağlanana kadar ve hiç internet olmadığında kullanılır.
export const SAMPLE = {
  ayetler: [
    { text: 'Allah hiç kimseye gücünün yetmeyeceği bir yük yüklemez.', src: 'Bakara Suresi, 286' },
    { text: 'Şüphesiz zorlukla beraber bir kolaylık vardır. Evet, zorlukla beraber bir kolaylık vardır.', src: 'İnşirah Suresi, 5-6' },
    { text: 'Bilin ki kalpler ancak Allahı anmakla huzur bulur.', src: 'Rad Suresi, 28' },
    { text: 'Öyleyse siz beni anın ki ben de sizi anayım.', src: 'Bakara Suresi, 152' },
    { text: 'Allahın rahmetinden ümidinizi kesmeyin.', src: 'Zümer Suresi, 53' },
    { text: 'Şüphesiz namaz, hayâsızlıktan ve kötülükten alıkoyar.', src: 'Ankebut Suresi, 45' },
  ],
  hadisler: [
    { text: 'Ameller ancak niyetlere göredir.', src: "Buhârî, Bed'ü'l-vahy 1; Müslim, İmâre 155" },
    { text: 'Temizlik imanın yarısıdır.', src: 'Müslim, Tahâret 1' },
    { text: 'Sizin en hayırlınız Kuranı öğrenen ve öğretendir.', src: "Buhârî, Fezâilü'l-Kur'ân 21" },
    { text: 'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.', src: 'Buhârî, İlim 11' },
  ],
  dersler: [
    { id: '1', icon: '💧', title: 'Abdest nasıl alınır?', sub: 'Adım adım abdest', parts: [{ title: 'Adımlar', steps: [
      'Niyet edilir ve Besmele çekilir.', 'Eller bileklere kadar üç kez yıkanır.', 'Ağıza üç kez su verilir.',
      'Buruna üç kez su çekilip temizlenir.', 'Yüz üç kez yıkanır.', 'Sağ kol, sonra sol kol dirseklerle birlikte üçer kez yıkanır.',
      'Islak elle başın dörtte biri meshedilir.', 'Kulaklar ve boyun meshedilir.', 'Önce sağ, sonra sol ayak topuklarla birlikte üçer kez yıkanır.'] }] },
    { id: '2', icon: '✅', title: 'Abdestin farzları', sub: 'Hanefi mezhebine göre 4 farz', parts: [{ title: 'Farzlar', steps: [
      'Yüzü yıkamak.', 'Kolları dirseklerle birlikte yıkamak.', 'Başın dörtte birini meshetmek.', 'Ayakları topuklarla birlikte yıkamak.'] }] },
    { id: '3', icon: '🧎', title: 'Namazın farzları', sub: "6'sı dışında, 6'sı içinde", parts: [
      { title: 'Namazın dışındaki farzlar (şartlar)', steps: ['Hadesten taharet (abdestli olmak)', 'Necasetten taharet (beden, elbise ve yerin temizliği)', 'Setr-i avret (örtünmesi gereken yerleri örtmek)', 'İstikbal-i kıble (kıbleye yönelmek)', 'Vakit', 'Niyet'] },
      { title: 'Namazın içindeki farzlar (rükünler)', steps: ['İftitah tekbiri', 'Kıyam (ayakta durmak)', 'Kıraat (Kuran okumak)', 'Rükû', 'Sücud (secde)', "Ka'de-i ahîre (son oturuş)"] }] },
    { id: '4', icon: '🕰️', title: 'Vakit namazlarının rekatları', sub: 'Beş vaktin sünnet ve farzları', parts: [{ title: 'Rekatlar', steps: [
      'Sabah: 2 sünnet, 2 farz', 'Öğle: 4 ilk sünnet, 4 farz, 2 son sünnet', 'İkindi: 4 sünnet, 4 farz',
      'Akşam: 3 farz, 2 sünnet', 'Yatsı: 4 sünnet, 4 farz, 2 son sünnet, 3 vitir (vacip)'] }] },
    { id: '5', icon: '🚿', title: 'Guslün farzları', sub: 'Hanefi mezhebine göre 3 farz', parts: [{ title: 'Farzlar', steps: [
      'Ağza su vermek (mazmaza).', 'Burna su çekmek (istinşak).', 'Bütün bedeni kuru yer kalmayacak şekilde yıkamak.'] }] },
    { id: '6', icon: '⭐', title: 'İmanın ve İslamın şartları', sub: '6 + 5 temel esas', parts: [
      { title: 'İmanın şartları', steps: ['Allaha iman', 'Meleklere iman', 'Kitaplara iman', 'Peygamberlere iman', 'Ahiret gününe iman', 'Kadere, hayır ve şerrin Allahtan olduğuna iman'] },
      { title: 'İslamın şartları', steps: ['Kelime-i şehadet getirmek', 'Namaz kılmak', 'Oruç tutmak', 'Zekât vermek', 'Gücü yetene hacca gitmek'] }] },
  ],
  sorular: [
    { q: 'Kuranda adı geçen tek sahabe kimdir?', opts: ['Hz. Ebu Bekir', 'Hz. Zeyd', 'Hz. Ömer', 'Hz. Bilal'], a: 1, why: 'Hz. Zeyd bin Harise, Ahzab Suresi 37. ayette adıyla anılır.' },
    { q: 'Kuranın en uzun ayeti hangi surededir?', opts: ['Bakara', 'Âl-i İmran', 'Nisa', 'Yasin'], a: 0, why: 'Borç ayeti olarak bilinen Bakara 282, Kuranın en uzun ayetidir.' },
    { q: 'Hanefi mezhebine göre abdestin kaç farzı vardır?', opts: ['3', '4', '5', '6'], a: 1, why: 'Yüz, kollar, başın dörtte biri ve ayaklar: toplam 4 farz.' },
    { q: 'Hangi vaktin farzı 3 rekattır?', opts: ['Sabah', 'Öğle', 'Akşam', 'Yatsı'], a: 2, why: 'Akşam namazının farzı 3 rekattır.' },
    { q: 'İlk inen ayetler hangi surededir?', opts: ['Fatiha', 'Alak', 'Müddessir', 'İhlas'], a: 1, why: '"Oku!" emriyle başlayan Alak Suresinin ilk ayetleri ilk vahiydir.' },
    { q: 'Hanefi mezhebine göre vitir namazının hükmü nedir?', opts: ['Farz', 'Vacip', 'Sünnet', 'Müstehap'], a: 1, why: 'Hanefilere göre vitir namazı vaciptir.' },
    { q: 'Kuranı Kerimde kaç sure vardır?', opts: ['99', '110', '114', '120'], a: 2, why: 'Kuranda 114 sure vardır.' },
    { q: 'Hicret hangi şehre yapılmıştır?', opts: ['Taif', 'Kudüs', 'Medine', 'Habeşistan'], a: 2, why: 'Hz. Peygamber Mekkeden Medineye (Yesrib) hicret etmiştir.' },
  ],
};

// ---- CSV okuma (tırnaklı alanlar ve satır içi yeni satırlar desteklenir) ----
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const norm = (s) => String(s || '').trim().toLocaleLowerCase('tr');
export const approved = (v) => ['evet', 'true', 'doğru', '✅', 'x'].includes(norm(v));

/** CSV satırlarını başlık adlarıyla nesneye çevirir. */
function toObjects(rows) {
  if (!rows.length) return [];
  const head = rows[0].map(norm);
  return rows.slice(1).map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    return o;
  });
}

export async function fetchSheet(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return toObjects(parseCSV(await res.text()));
  } finally {
    clearTimeout(timer);
  }
}

const LETTERS = { a: 0, b: 1, c: 2, d: 3 };

// Tablodaki "Vakit" sütunu: İmsak, Öğle, İkindi, Akşam, Yatsı (boş = genel)
const VAKIT_SLOT = { imsak: 0, sabah: 0, 'öğle': 1, ogle: 1, ikindi: 2, 'akşam': 3, aksam: 3, 'yatsı': 4, yatsi: 4 };
const vakitOf = (v) => { const k = norm(v); return k in VAKIT_SLOT ? VAKIT_SLOT[k] : -1; };

export function buildContent({ dersler, adimlar, sorular, ayetler, hadisler }) {
  const lessons = dersler
    .filter((d) => approved(d['onaylı']) && d['başlık'])
    .map((d) => {
      const id = d['ders no'];
      const parts = [];
      adimlar.filter((a) => a['ders no'] === id && a['adım']).forEach((a) => {
        const title = a['bölüm'] || '';
        let p = parts.find((x) => x.title === title);
        if (!p) { p = { title, steps: [] }; parts.push(p); }
        p.steps.push(a['adım']);
      });
      return { id, icon: d['simge'] || '📘', title: d['başlık'], sub: d['açıklama'] || '', parts };
    });
  const questions = sorular
    .filter((s) => approved(s['onaylı']) && s['soru'] && LETTERS[norm(s['doğru'])] !== undefined)
    .map((s) => ({
      q: s['soru'], opts: [s['a'], s['b'], s['c'], s['d']], a: LETTERS[norm(s['doğru'])],
      why: s['açıklama'] || '', cat: s['kategori'] || '',
    }))
    .filter((s) => s.opts.every((o) => o));
  const verses = ayetler.filter((a) => approved(a['onaylı']) && a['meal']).map((a) => ({ text: a['meal'], src: a['kaynak'], v: vakitOf(a['vakit']) }));
  const hadith = hadisler.filter((h) => approved(h['onaylı']) && h['hadis']).map((h) => ({ text: h['hadis'], src: h['kaynak'], v: vakitOf(h['vakit']) }));
  return { dersler: lessons, sorular: questions, ayetler: verses, hadisler: hadith };
}

/** Önce kayıtlı içeriği döndürür; tablodan yenisi gelirse onUpdate ile bildirir. */
export async function loadContent(onUpdate) {
  if (!SHEET_ID) return SAMPLE;
  const cached = await load('content', null);
  (async () => {
    try {
      const [dersler, adimlar, sorular, ayetler, hadisler] = await Promise.all(
        ['Dersler', 'Adımlar', 'Sorular', 'Ayetler', 'Hadisler'].map(fetchSheet),
      );
      const fresh = buildContent({ dersler, adimlar, sorular, ayetler, hadisler });
      await save('content', fresh);
      onUpdate && onUpdate(fresh);
    } catch (e) {
      // internet yok ya da tablo erişilemiyor: kayıtlı içerikle devam
    }
  })();
  return cached || { dersler: [], sorular: [], ayetler: [], hadisler: [] };
}

/**
 * Vakte uygun içerik seçimi. slot: vakitSlot() sayacı (günde 5 artar).
 * Her vaktin havuzu = o vakte etiketli satırlar + genel satırların o vakte düşen payı.
 */
export function pickForSlot(list, slot) {
  if (!list.length) return null;
  const s = ((slot % 5) + 5) % 5;
  const day = Math.floor(slot / 5);
  const pool = [];
  let g = 0;
  for (const item of list) {
    if (item.v === s) pool.push(item);
    else if (item.v === undefined || item.v < 0) { if (g % 5 === s) pool.push(item); g++; }
  }
  const src = pool.length ? pool : list;
  return src[((day % src.length) + src.length) % src.length];
}
