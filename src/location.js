import * as Location from 'expo-location';

/** Telefonun konumundan vakit konumu: { loc } ya da { error } */
export async function detectLocation() {
  try {
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) return { error: 'Konum izni verilmedi. Listeden şehir seçebilirsiniz.' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let name = 'Konumum';
    let il = null;
    try {
      const [g] = await Location.reverseGeocodeAsync(pos.coords);
      if (g) { name = g.subregion || g.district || g.city || g.region || name; il = g.region || null; }
    } catch (e) {}
    return { loc: { name, il, lat: pos.coords.latitude, lng: pos.coords.longitude } };
  } catch (e) {
    return { error: 'Konum alınamadı. Konum servisinin açık olduğundan emin olun.' };
  }
}

/** Eski kayıtlarda il bilgisi yoksa telefonun adres hizmetinden bir kez doldur. */
export async function fillProvince(loc) {
  if (loc.il) return null;
  try {
    const [g] = await Location.reverseGeocodeAsync({ latitude: loc.lat, longitude: loc.lng });
    return g && g.region ? { ...loc, il: g.region } : null;
  } catch (e) { return null; }
}
