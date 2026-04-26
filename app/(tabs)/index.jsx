import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Added missing imports
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { db } from '../../config/FirebaseConfig';
import { getLocalStorage } from '../../service/Storage'; // Ensure this is imported

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [medList, setMedList] = useState([]);

  useEffect(() => {
    // 1. Create an async function inside useEffect
    const initializeData = async () => {
      try {
        const user = await getLocalStorage('userDetails'); // Added 'await' and key
        
        if (user && user.email) {
          const q = query(
            collection(db, 'Medication'), 
            where('userEmail', '==', user.email)
          );
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const meds = [];
            snapshot.forEach((doc) => {
              meds.push({ id: doc.id, ...doc.data() });
            });
            
            setMedList(meds);
            setIsSyncing(snapshot.metadata.hasPendingWrites);
            setLoading(false); // Data loaded (either from cache or server)
          });

          return unsubscribe;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    const unsubPromise = initializeData();

    // Clean up the listener
    return () => {
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []); 

  if (loading) {
    return <ActivityIndicator size={'large'} color={'#8b5cf6'} style={{marginTop: '50%'}} />;
  }

  return (
    <View style={{
      backgroundColor: '#f3f1ff',
      flex: 1, // Use flex: 1 instead of height: '100%' for better layout
    }}>
      {/* Sync Indicator */}
      {isSyncing && (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'center', 
          padding: 5, 
          backgroundColor: '#e0e7ff', // Light indigo to match your theme
          borderRadius: 10,
          marginBottom: 10 
        }}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={{ marginLeft: 5, fontSize: 12, color: '#4f46e5' }}>Syncing with cloud...</Text>
        </View>
      )}

      <Header />

      {/* IMPORTANT: Pass medList to your MedicationList component 
        so it actually displays the synced data! 
      */}
      <MedicationList medList={medList} />
    </View>
  );
}