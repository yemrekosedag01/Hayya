// Kurulu Expo SDK'sının uyumlu sürüm listesine göre paketleri package.json'a sabitler.
const fs = require('fs');
const bundled = require('../node_modules/expo/bundledNativeModules.json');
const expoVersion = require('../node_modules/expo/package.json').version;
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const want = [
  'react', 'react-native', 'expo-notifications', 'expo-location', 'expo-status-bar',
  'expo-constants', '@react-native-async-storage/async-storage',
  'react-native-safe-area-context', 'react-native-svg',
];
pkg.dependencies = { expo: '~' + expoVersion };
for (const name of want) {
  if (!bundled[name]) throw new Error('Sürüm bulunamadı: ' + name);
  pkg.dependencies[name] = bundled[name];
}
// Firebase paketleri Expo listesinde yok: ikisi de aynı (en güncel) sürüm olmalı.
pkg.dependencies['@react-native-firebase/app'] = '*';
pkg.dependencies['@react-native-firebase/messaging'] = '*';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.dependencies);
