import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { db } from '../../config/FirebaseConfig';
import { getLocalStorage } from '../../service/Storage';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [medList, setMedList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeDocs;

    const initializeData = async () => {
      try {
        const user = await getLocalStorage('userDetails');
        
        // If no user email exists, cancel guest logic and go straight to login
        if (!user || !user.email) {
          setLoading(false);
          router.replace('/login'); 
          return;
        }

        const q = query(
          collection(db, 'medication'), 
          where('userEmail', '==', user.email)
        );
        
        // Cleaned up listener without the manual offline toggling
        unsubscribeDocs = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
          const meds = [];
          snapshot.forEach((doc) => {
            meds.push({ id: doc.id, ...doc.data() });
          });
          
          setMedList(meds);
          setIsSyncing(snapshot.metadata.hasPendingWrites);
          setLoading(false);
        });

      } catch (error) {
        console.error("Initialization Error:", error);
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      if (unsubscribeDocs) unsubscribeDocs();
    };
  }, []); 

  if (loading) {
    return <ActivityIndicator size={'large'} color={'#8b5cf6'} style={{marginTop: '50%'}} />;
  }

  return (
    <View style={styles.mainContainer}>
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