import NetInfo from '@react-native-community/netinfo';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

/**
 * Manages the Firestore network state based on actual device connectivity.
 * This ensures the background sync "wakes up" immediately when online.
 */
export const SyncOfflineData = async () => {
    const state = await NetInfo.fetch();
    
    if (state.isConnected) {
        console.log("Internet detected: Waking up Firestore sync pipe...");
        await enableNetwork(db).catch(() => {});
    } else {
        console.log("No internet: Firestore switched to local-only mode.");
        await disableNetwork(db).catch(() => {});
    }
};

// We keep this empty function so your other files don't break if they still import it
export const AddToOfflineQueue = async () => {
    return Promise.resolve();
};