# Mozaik Blok

8x8 ızgarada Block Blast tarzı blok bulmaca oyunu. Saf HTML/CSS/JS +
[Capacitor](https://capacitorjs.com/) ile Android (Google Play) ve iOS (App Store)
paketlemesi.

## Proje yapısı

```
www/index.html          Oyunun kendisi (tek dosya, mobil iyileştirmelerle)
mozaik-blok.html        Orijinal web sürümü (referans olarak duruyor)
capacitor.config.ts     Capacitor yapılandırması (appId, appName, splash ayarları)
assets/                 Icon/splash SVG kaynakları + üretilen 1024/2732px PNG'ler
scripts/render-assets.mjs  SVG → PNG dönüştürücü (sharp kullanır)
android/                Android Studio / Gradle projesi
ios/                    Xcode projesi (Mac gerektirir)
```

## ⚠️ Yayınlamadan önce: appId

`capacitor.config.ts` içindeki `appId` şu an `com.ceylan.mozaikblok`.
Kendi domain'in varsa **yayınlamadan önce** değiştir (ör. `com.seninDomainin.mozaikblok`).
Play Store ve App Store'a yüklendikten sonra **bir daha değiştirilemez**.

Değiştirme adımları:
```
1. capacitor.config.ts içindeki appId'yi düzenle
2. android/ ve ios/ klasörlerini sil
3. npx cap add android
4. npx cap add ios
5. npx capacitor-assets generate
6. npx cap sync
7. android/app/src/main/AndroidManifest.xml → MainActivity'ye
   android:screenOrientation="portrait" ekle (yeniden oluşturma bunu siler)
8. ios/App/App/Info.plist → orientation ayarlarını tekrar portrait yap
```

## Geliştirme akışı

- Oyun kodu **sadece** `www/index.html` içinde düzenlenir.
- Her değişiklikten sonra: `npx cap sync` (web dosyalarını native projelere kopyalar).
- Tarayıcıda hızlı test: `www/index.html`'i doğrudan aç (Preferences yerine
  localStorage'a düşer, geri tuşu/splash gibi native özellikler devre dışı kalır).

## Mobil iyileştirmeler (orijinale göre farklar)

- **Kalıcı rekor skor**: Capacitor Preferences API; tarayıcıda localStorage fallback.
- **Safe area / çentik**: `viewport-fit=cover` + `env(safe-area-inset-*)` padding.
- **Android geri tuşu**: oyun içinde "çıkmak istiyor musun?" onayı; oyun bitti
  ekranındayken doğrudan çıkış; onay ekranı açıkken geri tuşu onayı kapatır.
- **Sürükleme performansı**: ghost parça `left/top` yerine `translate3d` ile taşınır
  (GPU compositing), pointermove olayları `requestAnimationFrame` ile kare başına
  bire indirgenir, hedef hücre değişmediyse önizleme yeniden hesaplanmaz.
- **Portrait kilidi**: AndroidManifest (`android:screenOrientation="portrait"`) ve
  Info.plist (`UISupportedInterfaceOrientations` yalnızca portrait +
  `UIRequiresFullScreen`).

---

## Android — test etme

Gereksinim: [Android Studio](https://developer.android.com/studio) (SDK + emülatör +
platform-tools ile birlikte gelir). Kurulumdan sonra `ANDROID_HOME` genellikle
`C:\Users\<kullanıcı>\AppData\Local\Android\Sdk` olur; Android Studio kuruluysa
Capacitor bunu kendisi bulur.

### Emülatörde

```
# 1. Android Studio > Device Manager'dan bir sanal cihaz (AVD) oluştur (örn. Pixel 7, API 34+)
# 2. Cihazları listele:
npx cap run android --list

# 3. Çalıştır (cihaz seçmeni ister ya da --target ile belirt):
npx cap run android
```

Bu komut Gradle ile debug APK derler, emülatörü/cihazı seçtirir, APK'yı yükler ve
uygulamayı başlatır. İlk derleme Gradle bağımlılıklarını indireceği için 5-10 dk
sürebilir; sonrakiler hızlıdır.

### Gerçek cihazda (USB)

```
# 1. Telefonda: Ayarlar > Telefon Hakkında > Yapı Numarası'na 7 kez dokun (geliştirici modu)
# 2. Geliştirici Seçenekleri > USB Hata Ayıklama'yı aç
# 3. USB ile bağla, telefonda "izin ver" de
npx cap run android            # cihaz listede görünür, seç
```

### Alternatif: Android Studio'dan

```
npx cap open android           # projeyi Android Studio'da açar, ▶ ile çalıştır
```

### Neleri test et

- Parça sürükleme akıcılığı (60fps hedef; takılma olursa bildir)
- Geri tuşu: oyun içinde onay çıkmalı, "Devam Et" oyuna dönmeli, "Çık" kapatmalı
- Rekor skor: uygulamayı tamamen kapatıp açınca REKOR korunmalı
- Çentikli cihazda üst bilgilerin çentiğe girmemesi
- Telefonu yan çevirince ekranın dönmemesi

---

## Android — Google Play yayın hazırlığı

### 1. Keystore oluşturma (kendin üret, benimle paylaşma)

Uygulamayı imzalamak için bir keystore gerekir. **Bu dosya ve şifreleri kaybedersen
uygulamayı bir daha güncelleyemezsin** (Play App Signing kullanıyorsan Google yedekler,
yine de sakla). Terminalde (keytool, kurduğun JDK ile geliyor):

```
keytool -genkey -v -keystore mozaik-blok-release.keystore -alias mozaikblok -keyalg RSA -keysize 2048 -validity 10000
```

- Sorulan şifreyi ve bilgileri (ad, kuruluş vs.) doldur.
- Dosyayı proje **dışında** güvenli bir yerde sakla (ör. şifre yöneticisi + yedek disk).
- `.gitignore` zaten `*.keystore`, `*.jks` ve `keystore.properties`'i dışlıyor.

### 2. İmzalama yapılandırması

Gradle tarafı **hazır** (`android/app/build.gradle` içinde koşullu signing config var).
Tek yapman gereken `android/keystore.properties` dosyasını oluşturmak (git'e girmez):

```properties
storeFile=C:\\guvenli\\yol\\mozaik-blok-release.keystore
storePassword=SENIN_STORE_SIFREN
keyAlias=mozaikblok
keyPassword=SENIN_KEY_SIFREN
```

Dosya yokken derleme normal çalışır; dosyayı koyduğun an `bundleRelease` imzalı çıkar.

### 3. Sürüm bilgileri

`android/app/build.gradle` → `defaultConfig`:

- `applicationId "com.ceylan.mozaikblok"` (appId ile aynı olmalı)
- `versionCode 1` → **her Play yüklemesinde +1 artır** (tamsayı, kullanıcı görmez)
- `versionName "1.0"` → kullanıcıya görünen sürüm (örn. "1.0.1")

### 4. AAB üretme (Play Store APK değil AAB ister)

```
cd android
.\gradlew bundleRelease
```

Çıktı: `android/app/build/outputs/bundle/release/app-release.aab` — bunu Play
Console'a yüklersin.

### 5. Privacy Policy (zorunlu!)

**Evet, gerekli.** Google Play her uygulama için erişilebilir bir gizlilik politikası
URL'si ister; Play Console'da "Privacy policy" alanı boş bırakılamaz.

Hazır sayfalar repoda: `docs/privacy-policy.html` ve `docs/terms.html`. İçerik,
liderlik tablosunu da kapsıyor (Firebase'de saklanan hesap kimliği + takma ad + skor).
Uygulama içinde de ilk açılışta bu metinlerin özeti gösterilip kabul alınıyor.

**Yayınlandı (canlı URL'ler):**
- Gizlilik politikası: https://muhammedcylan.github.io/mozaik-blok-pages/privacy-policy.html
- Kullanım koşulları: https://muhammedcylan.github.io/mozaik-blok-pages/terms.html
- Kaynak: `mozaik-blok-pages` public reposu (masaüstünde `mozaik-blok-pages` klasörü);
  metin değişirse orada düzenleyip push et — `docs/` içindeki kopyaları da eşitle.

Play Console'da: **Uygulama içeriği (App content) > Gizlilik politikası** alanına bu
URL'yi gir. **Data Safety formunda artık "veri toplanıyor" beyan etmelisin** (liderlik
tablosu yüzünden): "Kişisel bilgiler > E-posta adresi" ve "Kimlik bilgileri > Kullanıcı
kimlikleri" — amaç "Uygulama işlevselliği", paylaşım yok, şifreli aktarım evet,
silme talebi mümkün evet. App Store Connect'te de "App Privacy" bölümünde aynı beyan
yapılır ("Data Linked to You: Contact Info / Identifiers").

### 6. Play Console adımları (özet)

1. [Play Console](https://play.google.com/console) hesabı (25$ tek seferlik)
2. Uygulama oluştur → mağaza kaydını doldur (açıklama, ekran görüntüleri,
   512x512 icon — `assets/icon-only.png`'den küçültebilirsin, 1024x500 feature graphic)
3. App content: privacy policy URL, Data Safety, içerik derecelendirme anketi
   (basit bulmaca → herkes/PEGI 3), hedef kitle
4. AAB'yi önce **Internal testing**'e yükle, kendi cihazında dene, sonra Production'a terfi ettir

---

## Liderlik tablosu — Firebase kurulumu (bir kez yapılır, ücretsiz)

Oyundaki 🏆 Liderlik özelliği (Google / Apple / e-posta girişi + dünya sıralaması)
Google Firebase kullanır. Kod hazır; Firebase yapılandırılana kadar oyun içinde
"liderlik henüz etkin değil" mesajı görünür, oyunun geri kalanı normal çalışır.

### 1. Firebase projesi aç

1. [console.firebase.google.com](https://console.firebase.google.com) → Google
   hesabınla gir → **Create a project** (Analytics'i kapatabilirsin).
2. Proje panelinde **Authentication > Sign-in method**: şu üçünü etkinleştir:
   **Email/Password**, **Google**, **Apple**.
3. **Firestore Database > Create database** → Production mode → bölge: `europe-west1`.
4. Firestore **Rules** sekmesine şunu yapıştır ve Publish de:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 3
        && request.resource.data.name.size() <= 16
        && request.resource.data.score is int
        && request.resource.data.score >= 0;
    }
    match /daily/{day}/scores/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 3
        && request.resource.data.name.size() <= 16
        && request.resource.data.score is int
        && request.resource.data.score >= 0;
    }
  }
}
```

> **Not:** Günlük bulmaca liderliği `daily/{tarih}/scores/{uid}` yolunu kullanır.
> Kuralları daha önce yayınladıysan, `daily` bloğunu ekleyip tekrar **Publish** de.

### 2. Android uygulamasını bağla

1. Firebase konsolunda ⚙ > Project settings > **Add app > Android**.
2. Package name: `com.ceylan.mozaikblok` (capacitor.config.ts'teki appId ile aynı).
3. **SHA-1 ekle** (Google ile giriş bunun olmadan çalışmaz). Debug SHA-1'i almak için:
   ```
   cd android
   .\gradlew signingReport
   ```
   Çıktıdaki `Variant: debug` altındaki SHA1 değerini Firebase'e ekle.
   (Yayın öncesi release keystore'unun SHA-1'ini de ekleyeceksin:
   `keytool -list -v -keystore mozaik-blok-release.keystore -alias mozaikblok`)
4. **google-services.json** dosyasını indir → `android/app/` klasörüne koy.
   Başka bir şey gerekmiyor; Gradle dosyayı görünce Firebase'i otomatik etkinleştirir.
5. `npx cap sync` çalıştır, uygulamayı yeniden derle.

### 3. iOS uygulamasını bağla (Mac'te)

1. Firebase konsolunda **Add app > iOS**, bundle ID: `com.ceylan.mozaikblok`.
2. **GoogleService-Info.plist** dosyasını indir → Xcode'da `App/App` klasörüne
   sürükle ("Copy items if needed" işaretli).
3. Google girişi için: plist içindeki `REVERSED_CLIENT_ID` değerini Xcode'da
   **App target > Info > URL Types**'a yeni URL scheme olarak ekle.
4. Apple girişi için: **Signing & Capabilities > + Capability > Sign in with Apple**
   ekle (Apple Developer hesabında da etkinleştirilmiş olmalı).

### Notlar

- Ücretsiz Spark planı bu oyun için fazlasıyla yeterli (50K okuma/gün).
- Apple ile giriş yalnızca iOS'ta gösterilir; Android'de Google + e-posta var.
- Veri modeli: `users/{uid}` → takma ad; `leaderboard/{uid}` → ad + en yüksek skor.
  Kullanıcı silme talebi gelirse Firebase konsolundan Authentication'daki hesabı ve
  bu iki dokümanı silmen yeterli.

---

## iOS — App Store hazırlığı (Mac + Xcode gerektirir)

`ios/` klasörü hazır ve senkronize; Capacitor 8 Swift Package Manager kullandığı
için CocoaPods kurmana gerek yok. Mac'te yapılacaklar:

```
# Mac'te repo'yu klonla, sonra:
npm install
npx cap sync ios
npx cap open ios        # Xcode'da açar
```

Xcode'da:

1. **Signing & Capabilities** → Team olarak Apple Developer hesabını seç
   (99$/yıl). Bundle Identifier `capacitor.config.ts`'teki appId'den gelir.
2. **General** → Version (`1.0`) ve Build (`1`) — her App Store yüklemesinde
   Build'i artır.
3. Gerçek iPhone'da test: cihazı bağla, hedef olarak seç, ▶.
4. Yayın: Product > Archive → Distribute App → App Store Connect.

### Info.plist — hazır ayarlar ve notlar

Şu ayarlar bu repoda **zaten yapıldı**:
- `UISupportedInterfaceOrientations` (iPhone + iPad): yalnızca
  `UIInterfaceOrientationPortrait` → dikey kilit
- `UIRequiresFullScreen = true`: iPad'de tek yönelim desteklemenin ön koşulu
  (yoksa App Store yüklemesi reddedilir)

Notlar:
- **ATS (App Transport Security)**: istisna eklemedik ve gerekmiyor — uygulama
  yalnızca yerel dosya yüklüyor; Google Fonts HTTPS olduğu için ATS'ye takılmaz.
  Fontlar çevrimdışıyken yüklenmezse sistem fontlarına düşer (oyun çalışmaya devam eder).
- Kamera/konum/mikrofon kullanılmadığı için hiçbir `NS...UsageDescription` gerekmiyor.
- App Store gizlilik: App Store Connect'te "App Privacy" bölümünde "Data Not
  Collected" seç; privacy policy URL'si (Play için hazırladığının aynısı) burada da istenir.

---

## Icon / Splash yeniden üretme

Tasarımı değiştirmek istersen `assets/*.svg` dosyalarını düzenle, sonra:

```
npm run assets      # SVG → PNG çevirir ve tüm boyutları android/ + ios/ içine üretir
npx cap sync
```
