// Anahtarı göstermeden yapısını kontrol eder (sadece uzunluk/biçim bilgisi yazar).
const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
console.log('toplam uzunluk:', raw.length, '| ilk karakter:', JSON.stringify(raw[0]), '| son karakter:', JSON.stringify(raw[raw.length - 1]));
const m = raw.match(/"private_key"\s*:\s*"([\s\S]*?)"/);
if (!m) { console.log('private_key alanı bulunamadı'); process.exit(0); }
const k = m[1];
console.log('private_key uzunluğu:', k.length);
console.log('\\n kaçış sayısı:', (k.match(/\\n/g) || []).length, '| gerçek satır sonu sayısı:', (k.match(/\n/g) || []).length);
console.log('BEGIN var mı:', k.includes('-----BEGIN PRIVATE KEY-----'), '| END var mı:', k.includes('-----END PRIVATE KEY-----'));
const body = k.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\\n|\n|\r/g, '');
console.log('gövde uzunluğu:', body.length, '| base64 dışı karakterler:', JSON.stringify([...new Set(body.replace(/[A-Za-z0-9+/=]/g, ''))].join('')));
for (const f of ['type', 'project_id', 'client_email', 'private_key_id']) console.log(f, 'var mı:', raw.includes('"' + f + '"'));
