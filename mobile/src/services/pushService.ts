// SparkMatch — Device push notifications (Expo)
// Registers the device's Expo push token with the backend and sets up how
// notifications are displayed. Push only works on a real device / built app —
// it's a no-op in the web browser and Expo Go on newer SDKs.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

let registered = false;

export async function registerForPush(): Promise<void> {
  if (registered) return;
  if (Platform.OS === 'web') return; // Web uses the in-app banner instead.

  try {
    // Loaded lazily so web bundles don't pull native-only code.
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    if (!Device.isDevice) return; // Simulators can't get a push token.

    // Ask permission.
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    // Android needs a notification channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4D67',
      });
    }

    // Show alerts while the app is foregrounded too.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ||
      (Constants.easConfig as any)?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;

    if (token) {
      await api.post('/notifications/push-token', { token });
      registered = true;
    }
  } catch (e) {
    // Non-fatal — push simply won't be available.
    console.log('Push registration skipped:', (e as Error)?.message);
  }
}

export async function unregisterPush(): Promise<void> {
  registered = false;
  try {
    await api.post('/notifications/push-token', { token: '' });
  } catch {
    /* ignore */
  }
}
