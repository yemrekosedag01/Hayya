// Kurulu Expo SDK'sının uyumlu sürüm listesine göre paketleri package.json'a sabitler.
const fs = require('fs');
const bundled = require('../node_modules/expo/bundledNativeModules.json');
const expoVersion = require('../node_modules/expo/package.json').version;
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const want = [
  'react', 'react-native', 'expo-notifications', 'expo-location', 'expo-status-bar',
  'expo-constants', '@react-native-async-storage/async-storage',
  'react-native-safe-area-context', 'react-native-svg', 'expo-system-ui',
  'react-native-view-shot', 'expo-sharing',
];
pkg.dependencies = { expo: '~' + expoVersion };
for (const name of want) {
  if (!bundled[name]) throw new Error('Sürüm bulunamadı: ' + name);
  pkg.dependencies[name] = bundled[name];
}
// Firebase paketleri Expo listesinde yok. 23.8.x: React Native 0.83 ile uyumlu son seri (24+ daha yeni RN ister).
pkg.dependencies['@react-native-firebase/app'] = '23.8.8';
pkg.dependencies['@react-native-firebase/messaging'] = '23.8.8';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.dependencies);
