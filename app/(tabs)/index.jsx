import NetInfo from '@react-native-community/netinfo';
import {
  collection,
  disableNetwork,
  enableNetwork,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { db } from '../../config/FirebaseConfig';
import { getLocalStorage } from '../../service/Storage';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [medList, setMedList] = useState([]);

  useEffect(() => {
    // 1. Network Listener: Forces Firestore to sync immediately when online
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      if (state.isConnected) {
        // Wake up Firebase network pipe to push offline changes
        enableNetwork(db).catch((err) => console.error("Enable Network Error:", err));
      } else {
        // Tell Firebase we are intentionally offline to save battery/resources
        disableNetwork(db).catch((err) => console.error("Disable Network Error:", err));
      }
    });

    const initializeData = async () => {
      try {
        const user = await getLocalStorage('userDetails');
        
        if (user && user.email) {
          const q = query(
            collection(db, 'Medication'), 
            where('userEmail', '==', user.email)
          );
          
          // 2. onSnapshot: including metadata changes to track "Syncing" status
          const unsubscribeDocs = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
            const meds = [];
            snapshot.forEach((doc) => {
              meds.push({ id: doc.id, ...doc.data() });
            });
            
            setMedList(meds);
            
            // metadata.hasPendingWrites is TRUE if data is only local and waiting to upload
            setIsSyncing(snapshot.metadata.hasPendingWrites);
            setLoading(false);
          });

          return unsubscribeDocs;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Initialization Error:", error);
        setLoading(false);
      }
    };

    const unsubPromise = initializeData();

    // Clean up listeners when user leaves the screen
    return () => {
      unsubscribeNet();
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []); 

  if (loading) {
    return <ActivityIndicator size={'large'} color={'#8b5cf6'} style={{marginTop: '50%'}} />;
  }

  return (
    <View style={styles.mainContainer}>
      {/* Offline Banner: Shows when Wi-Fi/Data is totally off */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>No Internet Connection - Changes saved locally</Text>
        </View>
      )}

      {/* Syncing Indicator: Shows when Firestore is uploading background data */}
      {isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.syncText}>Syncing changes to cloud...</Text>
        </View>
      )}

      <Header />
      <MedicationList medList={medList} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    padding: 25, 
    backgroundColor: '#f3f1ff', 
    flex: 1 
  },
  offlineBanner: { 
    backgroundColor: '#ef4444', 
    padding: 8, 
    borderRadius: 8, 
    marginBottom: 10, 
    alignItems: 'center' 
  },
  offlineText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  syncBanner: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 10, 
    backgroundColor: '#e0e7ff', 
    borderRadius: 10, 
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe'
  },
  syncText: { 
    marginLeft: 10, 
    fontSize: 13, 
    color: '#4f46e5', 
    fontWeight: '600' 
  }
});