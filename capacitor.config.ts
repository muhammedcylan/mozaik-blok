import type { CapacitorConfig } from '@capacitor/cli';

// DİKKAT: appId'yi yayınlamadan ÖNCE kendi domain'ine göre değiştir
// (ör. com.seninDomainin.mozaikblok). Play Store'a yüklendikten sonra
// bir daha DEĞİŞTİRİLEMEZ. Değiştirirsen: android/ ve ios/ klasörlerini
// silip "npx cap add android && npx cap add ios" ile yeniden oluştur.
const config: CapacitorConfig = {
  appId: 'com.ceylan.mozaikblok',
  appName: 'Mozaik Blok',
  webDir: 'www',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0b1f3a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
};

export default config;
