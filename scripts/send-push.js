// Firebase Cloud Messaging ile bir konuya (topic) bildirim gönderir.
// Kullanım: GitHub Actions > "Bildirim gönder"
const admin = require('firebase-admin');

const { TITLE, BODY, TOPIC, FIREBASE_SERVICE_ACCOUNT } = process.env;
if (!FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT gizli anahtarı eksik.');
if (!TITLE || !BODY) throw new Error('Başlık ve metin boş olamaz.');
if (!/^[a-z0-9_-]{1,60}$/.test(TOPIC || '')) throw new Error('Geçersiz hedef: ' + TOPIC + ' (ör. tum, sehir_adana)');

// Telefonda kopyalanırken anahtarın içine fazladan satır sonu girebiliyor.
// Özel anahtarı gövdesinden yeniden kurarak düzeltiriz.
function parseKey(txt) {
  const cleaned = txt.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/, (m, a, b, c) => a + b.replace(/[\r\n]/g, '') + c);
  const obj = JSON.parse(cleaned);
  const body = obj.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\\n|\s/g, '');
  obj.private_key = '-----BEGIN PRIVATE KEY-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';
  return obj;
}
admin.initializeApp({ credential: admin.credential.cert(parseKey(FIREBASE_SERVICE_ACCOUNT.trim())) });

admin.messaging().send({
  topic: TOPIC,
  notification: { title: TITLE, body: BODY },
  android: { priority: 'high', notification: { channelId: 'duyuru-v2', sound: 'hayya_bildirim' } },
}).then((id) => {
  console.log('Gönderildi:', id, '| hedef:', TOPIC);
}).catch((e) => {
  console.error('Gönderilemedi:', e.message);
  process.exit(1);
});
