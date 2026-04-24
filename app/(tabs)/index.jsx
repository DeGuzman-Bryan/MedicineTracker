import { useRouter } from 'expo-router';
import { arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
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

  // Helper to parse the weird "seconds=..." string or standard time strings
  const parseTime = (reminderStr) => {
    if (!reminderStr) return null;
    const match = reminderStr.match(/seconds=(\d+)/);
    if (match) {
      const seconds = parseInt(match[1]);
      return moment(new Date(seconds * 1000));
    }
    return moment(reminderStr, 'hh:mm A');
  };

  const checkAndMarkMissedMedications = async (fetchedMedications) => {
    const today = moment().format('ll'); // Matches your ActionModal date format
    const currentTime = moment();

    for (const med of fetchedMedications) {
      const reminderTime = parseTime(med.reminder);
      if (!reminderTime) continue;

      // Set the reminder time to TODAY'S date for comparison
      const todayReminder = moment().set({
        hour: reminderTime.hour(),
        minute: reminderTime.minute(),
        second: 0
      });

      // 1. Check if time has passed
      if (currentTime.isAfter(todayReminder)) {
        // 2. Check if there is already an entry for today in the 'action' array
        const hasEntryForToday = med.action?.some(entry => entry.date === today);

        if (!hasEntryForToday) {
          try {
            console.log(`Marking ${med.name} as missed for ${today}`);
            const medRef = doc(db, 'medication', med.id);
            
            // Push the missed status into the action array just like ActionModal does
            await updateDoc(medRef, {
              action: arrayUnion({
                status: 'Missed',
                time: todayReminder.format('LT'),
                date: today
              })
            });
          } catch (error) {
            console.error("Auto-miss update error:", error);
          }
        }
      }
    }
  };

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

      const q = query(
        collection(db, 'medication'), 
        where('accessibleBy', 'array-contains', user.email)
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // This triggers the check every time the data syncs
        checkAndMarkMissedMedications(meds);

        setMedList(meds);
        setLoading(false);
      }, (err) => {
        console.error("Snapshot error:", err);
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