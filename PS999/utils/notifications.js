
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  console.log('[NOTIFY] registerForPushNotificationsAsync sequence started...');

  if (Platform.OS !== 'android') {
    console.warn('[NOTIFY] Only Android is supported');
    return null;
  }

  if (!Device.isDevice) {
    console.warn('[NOTIFY] Must use physical device for proper push notifications');
    return 'SIMULATOR_TEST_TOKEN';
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NOTIFY] Permission for push notifications not granted');
      return 'PERMISSION_DENIED_FALLBACK';
    }

    // Get Native FCM Device Token for Android
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    console.log('[NOTIFY] Android FCM Device Token:', deviceToken.data);
    return deviceToken.data;

  } catch (err) {
    console.error('[NOTIFY] Error getting FCM token:', err);
    const uniqueId = Math.random().toString(36).substring(2, 12).toUpperCase();
    const dummyToken = `${uniqueId}_TEST`;
    console.log('[NOTIFY] Using Dummy Token for testing:', dummyToken);
    return dummyToken;
  }
}
