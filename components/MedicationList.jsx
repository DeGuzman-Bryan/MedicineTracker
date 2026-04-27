import AntDesign from '@expo/vector-icons/AntDesign';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { GetDateRangeToDisplay } from './../service/ConvertDateTime';
import EmptyState from './EmptyState';
import MedicationCardItem from './MedicationCardItem';

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

export default function MedicationList({ medList: realTimeMedList = [] }) {
  const [medList, setMedList] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('MM/DD/YYYY'));
  const router = useRouter();

  const alertedMedsRef = useRef(new Set());
  const missedAlertedRef = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    setDateRange(GetDateRangeToDisplay());

    intervalRef.current = setInterval(() => {
      checkMedicineTimes();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    loadMedications(selectedDate);
  }, [selectedDate, realTimeMedList]);

  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  }

  const loadMedications = (dateToFetch) => {
    const formattedDate = moment(dateToFetch, 'MM/DD/YYYY').format('MM/DD/YYYY');
    const filteredMeds = realTimeMedList.filter(data => 
      data.dates && data.dates.includes(formattedDate)
    );
    setMedList(filteredMeds);
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

      if (currentFormattedTime === medTime && !alertedMedsRef.current.has(med.id)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💊 Medication Reminder",
            body: `It's time to take your ${med.name}.`,
            data: { medId: med.id },
          },
          trigger: null, 
        });
        alertedMedsRef.current.add(med.id);
      }

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
  };

  return (
    <View style={styles.container}>
     

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

      {/* 🌟 NEW HEADER WITH PLUS ICON */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Today's Medication</Text>
        <TouchableOpacity 
          style={styles.plusButton} 
          onPress={() => router.push('/add-new-medication')}
        >
          <AntDesign name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* 🌟 FIXED: No more infinite loading! Immediately shows EmptyState if no meds. */}
      {medList.length === 0 ? (
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
  
  /* 🌟 NEW STYLES FOR HEADER */
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 5,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  plusButton: {
    backgroundColor: '#8b5cf6', // The signature purple color
    padding: 8,
    borderRadius: 10,
  },
});