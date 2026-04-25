import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayUnion, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';

export const addToOfflineQueue = async (actionType, payload) => {
  try {
    const queueStr = await AsyncStorage.getItem('offlineQueue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    queue.push({ actionType, payload, timestamp: Date.now() });
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
    console.log(`Added ${actionType} to offline queue.`);
  } catch (error) {
    console.error("Failed to add to offline queue:", error);
  }
};

export const syncOfflineQueue = async () => {
  try {
    const queueStr = await AsyncStorage.getItem('offlineQueue');
    if (!queueStr) return;
    
    const queue = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline actions...`);

    for (const item of queue) {
      const { actionType, payload } = item;
      
      try {
        if (actionType === 'DELETE') {
          await deleteDoc(doc(db, 'medication', payload.docId));
        } 
        else if (actionType === 'UPDATE_ACTION') {
          const docRef = doc(db, 'medication', payload.docId);
          await updateDoc(docRef, { action: arrayUnion(payload.actionData) });
        }
        else if (actionType === 'ADD') {
          const docRef = doc(db, 'medication', payload.docId);
          await setDoc(docRef, payload.data);
        }
        // 🌟 NEW: Handles edited medications syncing back to database
        else if (actionType === 'UPDATE_MED') {
          const docRef = doc(db, 'medication', payload.docId);
          await updateDoc(docRef, payload.data);
        }
      } catch (e) {
        console.error("Failed to sync item:", item, e);
      }
    }

    // Clear the queue after successful sync
    await AsyncStorage.setItem('offlineQueue', JSON.stringify([]));
    console.log("Offline sync complete!");
    
  } catch (error) {
    console.error("Sync error:", error);
  }
};