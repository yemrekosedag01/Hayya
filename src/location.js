import * as Location from 'expo-location';

/** Telefonun konumundan vakit konumu: { loc } ya da { error } */
export async function detectLocation() {
  try {
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) return { error: 'Konum izni verilmedi. Listeden şehir seçebilirsiniz.' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let name = 'Konumum';
    try {
      const [g] = await Location.reverseGeocodeAsync(pos.coords);
      if (g) name = g.subregion || g.district || g.city || g.region || name;
    } catch (e) {}
    return { loc: { name, lat: pos.coords.latitude, lng: pos.coords.longitude } };
  } catch (e) {
    return { error: 'Konum alınamadı. Konum servisinin açık olduğundan emin olun.' };
  }
}
