// Firebase Cloud Messaging ile bir konuya (topic) bildirim gönderir.
// Kullanım: GitHub Actions > "Bildirim gönder"
const admin = require('firebase-admin');

const { TITLE, BODY, TOPIC, FIREBASE_SERVICE_ACCOUNT } = process.env;
if (!FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT gizli anahtarı eksik.');
if (!TITLE || !BODY) throw new Error('Başlık ve metin boş olamaz.');
if (!/^[a-z0-9_-]{1,60}$/.test(TOPIC || '')) throw new Error('Geçersiz hedef: ' + TOPIC + ' (ör. tum, sehir_adana)');

// Telefonda kopyalanırken özel anahtardaki "\n" kaçışları gerçek satır sonuna dönüşebiliyor; düzelt.
function parseKey(txt) {
  try { return JSON.parse(txt); } catch (e) {
    const fixed = txt.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/, (m, a, b, c) => a + b.replace(/\r?\n/g, '\\n') + c);
    return JSON.parse(fixed);
  }
}
admin.initializeApp({ credential: admin.credential.cert(parseKey(FIREBASE_SERVICE_ACCOUNT.trim())) });

admin.messaging().send({
  topic: TOPIC,
  notification: { title: TITLE, body: BODY },
  android: { priority: 'high', notification: { channelId: 'duyuru-v1', sound: 'default' } },
}).then((id) => {
  console.log('Gönderildi:', id, '| hedef:', TOPIC);
}).catch((e) => {
  console.error('Gönderilemedi:', e.message);
  process.exit(1);
});
