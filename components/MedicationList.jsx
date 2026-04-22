import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications'; // Added Expo Notifications
import { useRouter } from 'expo-router';
import { arrayUnion, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { db } from '../config/FirebaseConfig';
import { GetDateRangeToDisplay } from './../service/ConvertDateTime';
import EmptyState from './EmptyState';
import MedicationCardItem from './MedicationCardItem';

// Notification Handler Config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MedicationList() {
  const [medList, setMedList] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('MM/DD/YYYY'));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const alertedMedsRef = useRef(new Set());
  const missedAlertedRef = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    // 1. Request Permissions on Mount
    registerForPushNotificationsAsync();

    setDateRange(GetDateRangeToDisplay());
    loadMedications(selectedDate);

    intervalRef.current = setInterval(() => {
      checkMedicineTimes();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, [selectedDate]);

  // Request Permission Logic
  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  }

  const loadMedications = async (dateToFetch) => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('userDetails');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;

      const targetEmail = user.role === 'caregiver' && user.linkedPatientEmail 
        ? user.linkedPatientEmail 
        : user.email;

      const formattedDate = moment(dateToFetch, 'MM/DD/YYYY').format('MM/DD/YYYY');
      
      const q = query(
        collection(db, 'medication'),
        where('userEmail', '==', targetEmail),
        where('dates', 'array-contains', formattedDate)
      );

      const querySnapshot = await getDocs(q);
      const meds = [];
      const now = moment();

      for (const docSnap of querySnapshot.docs) {
        let data = docSnap.data();
        const medId = docSnap.id;
        const existingStatus = data.action?.find(a => a.date === formattedDate);
        
        if (!existingStatus) {
          const medTime = data.reminder || data.time;
          if (medTime) {
            const scheduledTime = moment(`${formattedDate} ${medTime}`, 'MM/DD/YYYY hh:mm A');
            if (now.diff(scheduledTime, 'minutes') >= 60) {
              const missedAction = { date: formattedDate, status: 'Missed', time: medTime };
              await updateDoc(doc(db, 'medication', medId), { action: arrayUnion(missedAction) });
              if (!data.action) data.action = [];
              data.action.push(missedAction);
            }
          }
        }
        meds.push({ id: medId, ...data });
      }
      setMedList(meds);
    } catch (e) {
      console.log('Load Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkMedicineTimes = () => {
    const now = moment();
    const currentFormattedTime = now.format('hh:mm A');
    const todayStr = now.format('MM/DD/YYYY');

    medList.forEach(async (med) => {
      const medTime = med.reminder || med.time;
      if (!medTime) return;

      const scheduledTime = moment(`${todayStr} ${medTime}`, 'MM/DD/YYYY hh:mm A');
      const minutesDiff = now.diff(scheduledTime, 'minutes');

      // 1. SYSTEM NOTIFICATION: IT'S TIME
      if (currentFormattedTime === medTime && !alertedMedsRef.current.has(med.id)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💊 Medication Reminder",
            body: `It's time to take your ${med.name}.`,
            data: { medId: med.id },
          },
          trigger: null, // Send immediately
        });
        alertedMedsRef.current.add(med.id);
      }

      // 2. SYSTEM NOTIFICATION: MISSED ALERT
      if (minutesDiff >= 60 && !missedAlertedRef.current.has(med.id)) {
        const isTaken = med.action?.find(a => a.date === todayStr && a.status === 'Taken');
        
        if (!isTaken) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "⚠️ Medication Missed!",
              body: `You are 1 hour late for your dose of ${med.name}.`,
              color: '#ff4444'
            },
            trigger: null,
          });
          missedAlertedRef.current.add(med.id);
        }
      }
    });
  };

  const handleDatePress = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(item.formattedDate);
    loadMedications(item.formattedDate);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('./../assets/images/med1.jpg')}
        style={styles.banner}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Stay Healthy, Stay Happy</Text>
          <Text style={styles.bannerSubtitle}>Consistency is the best medicine.</Text>
        </View>
      </ImageBackground>

      <View style={{height: 80}}>
        <FlatList
            data={dateRange}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateList}
            renderItem={({ item }) => {
                const isSelected = item.formattedDate === selectedDate;
                const dateNum = moment(item.formattedDate, 'MM/DD/YYYY').format('DD');
                const day = moment(item.formattedDate, 'MM/DD/YYYY').format('ddd');
                return (
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: isSelected ? '#8b5cf6' : '#F9F9F9' }]}
                        onPress={() => handleDatePress(item)}
                    >
                        <Text style={{ color: isSelected ? '#fff' : '#333', fontWeight: 'bold' }}>{day}, {dateNum}</Text>
                    </TouchableOpacity>
                );
            }}
            keyExtractor={(_, index) => index.toString()}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={'#8b5cf6'} style={{marginTop: 50}} />
      ) : medList.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={medList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push({ pathname: '/action-modal', params: { ...item, selectedDate } })}>
              <MedicationCardItem medicine={item} selectedDate={selectedDate} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{paddingBottom: 20}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  banner: { width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginTop: 10, marginBottom: 10 },
  bannerTextContainer: { padding: 20 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bannerSubtitle: { fontSize: 12, color: '#fff' },
  dateList: { marginBottom: 10, padding: 5 },
  dateButton: { height: 50, padding: 15, borderRadius: 25, marginRight: 10, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
});  
//SAVE COMPO