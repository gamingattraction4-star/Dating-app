// SparkMatch — Location
// Requests device location (with permission) and saves it to the backend so
// distance-based discovery works. Safe no-op if permission is denied.
import { Platform } from 'react-native';
import { userService } from './userService';

let asked = false;

export async function requestAndSaveLocation(force = false): Promise<boolean> {
  if (asked && !force) return false;
  asked = true;
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Best-effort reverse geocode for a city label (skip on web where it's flaky).
    let city: string | undefined;
    if (Platform.OS !== 'web') {
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        city = places[0]?.city || places[0]?.region || undefined;
      } catch { /* ignore */ }
    }

    await userService.updateLocation(pos.coords.latitude, pos.coords.longitude, city);
    return true;
  } catch {
    return false;
  }
}
