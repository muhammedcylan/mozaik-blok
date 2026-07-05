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

`android/keystore.properties` dosyası oluştur (git'e girmez):

```properties
storeFile=C:\\guvenli\\yol\\mozaik-blok-release.keystore
storePassword=SENIN_STORE_SIFREN
keyAlias=mozaikblok
keyPassword=SENIN_KEY_SIFREN
```

`android/app/build.gradle` içinde `android {` bloğuna şunu ekle:

```gradle
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
```

ve `buildTypes.release` içine: `signingConfig signingConfigs.release`

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

**Evet, gerekli.** Reklam ve veri toplama olmasa bile Google Play, Data Safety formu
ve her uygulama için erişilebilir bir gizlilik politikası URL'si ister; Play Console
uygulama kaydında "Privacy policy" alanı boş bırakılamaz.

Bu oyun için durum kolay: hiçbir kişisel veri toplanmıyor, tek saklanan şey cihazda
kalan rekor skor. Politika metni 5-6 cümle yeter:

> Mozaik Blok hiçbir kişisel veri toplamaz, saklamaz veya üçüncü taraflarla paylaşmaz.
> Yalnızca en yüksek skorunuz cihazınızda yerel olarak saklanır ve cihazınızdan
> ayrılmaz. Uygulama reklam içermez, analitik kullanmaz ve internet bağlantısı
> gerektirmez. (+ iletişim e-postası, tarih)

Nereye koyacaksın (herkese açık bir URL olmalı):
- **GitHub Pages** (ücretsiz, en pratik): repoya `docs/privacy-policy.html` koy,
  Settings > Pages'ten yayınla → `https://kullanici.github.io/mozaik-blok/privacy-policy.html`
- Alternatif: kendi domain'in, Google Sites, Notion public sayfası.

Play Console'da: **Uygulama içeriği (App content) > Gizlilik politikası** alanına bu
URL'yi gir. Data Safety formunda "veri toplanmıyor / paylaşılmıyor" seç.

### 6. Play Console adımları (özet)

1. [Play Console](https://play.google.com/console) hesabı (25$ tek seferlik)
2. Uygulama oluştur → mağaza kaydını doldur (açıklama, ekran görüntüleri,
   512x512 icon — `assets/icon-only.png`'den küçültebilirsin, 1024x500 feature graphic)
3. App content: privacy policy URL, Data Safety, içerik derecelendirme anketi
   (basit bulmaca → herkes/PEGI 3), hedef kitle
4. AAB'yi önce **Internal testing**'e yükle, kendi cihazında dene, sonra Production'a terfi ettir

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
