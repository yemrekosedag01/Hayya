import AsyncStorage from '@react-native-async-storage/async-storage';

export async function load(key, fallback) {
  try {
    const v = await AsyncStorage.getItem('hayya_' + key);
    return v == null ? fallback : JSON.parse(v);
  } catch (e) {
    return fallback;
  }
}

export async function save(key, value) {
  try {
    await AsyncStorage.setItem('hayya_' + key, JSON.stringify(value));
  } catch (e) {}
}
