// Kuran verisi: Arapça metin (Tanzil, Osmanlı imlası) ve Türkçe meal (QuranEnc).
// Veri dosyaları ilk açılışta tembel yüklenir; paket açılışını yavaşlatmaz.

export const SURAH_TR = [
  'Fâtiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', "En'âm", "A'râf", 'Enfâl', 'Tevbe', 'Yûnus',
  'Hûd', 'Yûsuf', "Ra'd", 'İbrâhîm', 'Hicr', 'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ',
  'Enbiyâ', 'Hac', "Mü'minûn", 'Nûr', 'Furkân', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm',
  'Lokmân', 'Secde', 'Ahzâb', "Sebe'", 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', "Mü'min",
  'Fussilet', 'Şûrâ', 'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf',
  'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele', 'Haşr', 'Mümtehine',
  'Saff', 'Cuma', 'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka', 'Meâric',
  'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâme', 'İnsan', 'Mürselât', "Nebe'", 'Nâziât', 'Abese',
  'Tekvîr', 'İnfitâr', 'Mutaffifîn', 'İnşikak', 'Bürûc', 'Târık', "A'lâ", 'Gâşiye', 'Fecr', 'Beled',
  'Şems', 'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak', 'Kadir', 'Beyyine', 'Zilzâl', 'Âdiyât',
  'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr',
  'Mesed', 'İhlâs', 'Felak', 'Nâs',
];

export const SURAH_AR = [
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
  'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
  'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
  'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
  'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج',
  'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
  'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات',
  'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر',
  'المسد', 'الإخلاص', 'الفلق', 'الناس',
];

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
export const TOTAL_AYAH = 6236;

// Okuyucular (EveryAyah.com ayet ayet ses kayıtları). İlki Hayya Radyo'daki kâridir.
export const RECITERS = [
  { id: 'Nasser_Alqatami_128kbps', name: 'Nâsır el-Katâmî', note: 'Hayya Radyo' },
  { id: 'Alafasy_128kbps', name: 'Mişârî Alafasy' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdurrahman es-Sudeys' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'Suûd eş-Şureym' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdulbâsıt Abdussamed' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Muhammed el-Minşâvî' },
  { id: 'Husary_128kbps', name: 'Mahmûd Halîl el-Husarî' },
  { id: 'Hudhaify_128kbps', name: 'Ali el-Huzeyfî' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Ebû Bekir eş-Şâtırî' },
];

export const pad3 = (n) => String(n).padStart(3, '0');
export const audioUrl = (reciter, s, a) => `https://everyayah.com/data/${reciter}/${pad3(s)}${pad3(a)}.mp3`;

let cache = null;
/** { ar: [[ayet…]…], tr: [[meal…]…] } — sure sırası 0 tabanlı. */
export function quranData() {
  if (!cache) cache = { ar: require('./ar.json'), tr: require('./tr.json') };
  return cache;
}

/** Basılı Medine Mushafı'na göre her ayetin başladığı sayfa: [sure][ayet-1] → 1..604 */
export const pageStarts = () => require('./pages.json');
