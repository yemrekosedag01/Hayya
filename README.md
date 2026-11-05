# Hayya – Ezan Vakti ve Dini Bilgiler

Expo (React Native) ile yazılmış Android/iOS uygulaması.

## Özellikler
- Namaz vakitleri: Diyanet'in kullandığı Türkiye yöntemiyle telefonda hesaplanır, internet gerekmez
- Konum: GPS ya da şehir listesi
- Kıble pusulası
- Vakit bildirimleri: her vakit için Kapalı / Bildirim / Ezan, vakitten önce hatırlatma
- Günün ayeti ve hadisi, kısa dersler, soru/cevap quiz
- İçerik Google E-Tablolar'dan gelir; sadece "Onaylı = EVET" satırlar gösterilir

## İçerik tablosunu bağlama
1. `Hayya_Icerik.xlsx` dosyasını Google Drive'a yükleyin ve Google E-Tablolar olarak açın.
2. Paylaş > Genel erişim > "Bağlantıya sahip olan herkes" > Görüntüleyen.
3. Linkteki `/d/` ile `/edit` arasındaki kimliği `src/config.js` içindeki `SHEET_ID` alanına yazın.

## Derleme (bilgisayarsız)
Derleme GitHub Actions üzerinden Expo EAS bulutunda yapılır:
GitHub > Actions > **Android derle** > Run workflow.
- `preview`: telefona doğrudan kurulabilen APK
- `production`: Play Store'a yüklenecek AAB

Gerekli GitHub gizli anahtarları (Settings > Secrets and variables > Actions):
`EXPO_TOKEN`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`

## Dosyalar
- `src/prayer.js` – vakit ve kıble hesabı
- `src/notifications.js` – bildirim kurma (14 gün ileriye)
- `src/content.js` – tablodan içerik çekme, örnek içerik
- `src/screens/` – ekranlar
