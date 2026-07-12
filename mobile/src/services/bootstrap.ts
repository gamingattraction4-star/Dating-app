// SparkMatch — Post-login bootstrap
// Loads the signed-in user's profile into the app store so Profile/Settings/Edit
// screens have data immediately and opens the realtime chat socket.
// Safe to call repeatedly; failures are non-fatal.
import { userService } from './userService';
import { useAppStore } from '../store/appStore';
import { chatSocket } from './chatSocket';
import { registerForPush } from './pushService';
import { requestAndSaveLocation } from './locationService';

export async function bootstrapUser(): Promise<void> {
  chatSocket.connect();
  // Register for device push notifications (no-op on web / simulator).
  registerForPush();
  // Ask for location so nearby discovery works (no-op if denied).
  requestAndSaveLocation();
  try {
    const profile = await userService.getMyProfile();
    useAppStore.getState().setMyProfile(profile);
  } catch (e) {
    // Non-fatal: the user may not have completed profile setup yet.
    console.log('bootstrapUser: could not load profile yet');
  }
}
