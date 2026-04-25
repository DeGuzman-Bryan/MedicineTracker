import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { db } from '../../config/FirebaseConfig';
import { sendImmediateNotification } from '../../service/notifications';
import { getLocalStorage } from '../../service/Storage';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [medList, setMedList] = useState([]);
  const router = useRouter();
  const currentUserEmail = useRef(null); 

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
    const today = moment().format('ll'); 
    const currentTime = moment();

    for (const med of fetchedMedications) {
      const reminderTime = parseTime(med.reminder);
      if (!reminderTime) continue;

      const todayReminder = moment().set({
        hour: reminderTime.hour(),
        minute: reminderTime.minute(),
        second: 0
      });

      const missedThreshold = moment(todayReminder).add(1, 'hours');

      if (currentTime.isAfter(missedThreshold)) {
        const hasEntryForToday = med.action?.some(entry => entry.date === today);

        if (!hasEntryForToday) {
          try {
            console.log(`Marking ${med.name} as missed for ${today}`);
            const medRef = doc(db, 'medication', med.id);
            
            await updateDoc(medRef, {
              action: arrayUnion({
                status: 'Missed',
                time: todayReminder.format('LT'),
                date: today,
                by: 'System'
              })
            });

            await sendImmediateNotification(
              "🚨 Medication Missed",
              `You missed your scheduled dose of ${med.name}. Please check your tracker.`
            );

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

      currentUserEmail.current = user.email;

      const todayStr = moment().format('YYYY-MM-DD');
      const lastLoginNotif = await AsyncStorage.getItem('lastLoginNotif');
      if (lastLoginNotif !== todayStr) {
        await sendImmediateNotification("Welcome Back! 👋", "We're keeping track of your schedule today.");
        await AsyncStorage.setItem('lastLoginNotif', todayStr);
      }

      const q = query(
        collection(db, 'medication'), 
        where('accessibleBy', 'array-contains', user.email)
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 🌟 REAL-TIME "BOTH SIDES" NOTIFICATION LISTENER 🌟
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const data = change.doc.data();
            const actionArray = data.action;
            
            if (actionArray && actionArray.length > 0) {
              const lastAction = actionArray[actionArray.length - 1];
              
              if (lastAction.by && lastAction.by !== 'System' && lastAction.by !== currentUserEmail.current) {
                const userName = lastAction.by.split('@')[0];
                const medName = data.name ? data.name : 'a medication';
                sendImmediateNotification(
                  `💊 ${medName} Update`,
                  `${userName} marked this medication as ${lastAction.status}.`
                );
              }
            }
          }
        });

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