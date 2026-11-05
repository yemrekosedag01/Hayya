// Firebase Cloud Messaging ile bir konuya (topic) bildirim gönderir.
// Kullanım: GitHub Actions > "Bildirim gönder"
const admin = require('firebase-admin');

const { TITLE, BODY, TOPIC, FIREBASE_SERVICE_ACCOUNT } = process.env;
if (!FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT gizli anahtarı eksik.');
if (!TITLE || !BODY) throw new Error('Başlık ve metin boş olamaz.');
if (!/^[a-z0-9_-]{1,60}$/.test(TOPIC || '')) throw new Error('Geçersiz hedef: ' + TOPIC + ' (ör. tum, sehir_adana)');

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)) });

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
