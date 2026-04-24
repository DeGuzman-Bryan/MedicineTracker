import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { db } from '../../config/FirebaseConfig';
import { getLocalStorage } from '../../service/Storage';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [medList, setMedList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe;
    const init = async () => {
      const user = await getLocalStorage('userDetails');
      
      if (!user || !user.email) { 
        router.replace('/login/signIn'); 
        return; 
      }
      
      if (!user.role) { 
        router.replace('/login/roleSelection'); 
        return; 
      }

      // 🌟 THE SYNC FIX: Querying by array-contains user.email
      const q = query(
        collection(db, 'medication'), 
        where('accessibleBy', 'array-contains', user.email)
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMedList(meds);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
    };

    init();
    return () => unsubscribe && unsubscribe();
  }, []);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#8b5cf6"/></View>;

  return (
    <View style={styles.mainContainer}>
      <Header />
      <MedicationList medList={medList} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { padding: 25, backgroundColor: '#f3f1ff', flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});