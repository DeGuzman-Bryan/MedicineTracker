import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
import Toast from 'react-native-toast-message';
import { db } from '../config/FirebaseConfig';
import { GetDateRangeToDisplay } from './../service/ConvertDateTime';
import EmptyState from './EmptyState';
import MedicationCardItem from './MedicationCardItem';

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
  const intervalRef = useRef(null);

  useEffect(() => {
    setDateRange(GetDateRangeToDisplay());
    loadMedications(selectedDate);

    intervalRef.current = setInterval(() => {
      checkMedicineTimes();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, [selectedDate]); // Added selectedDate to trigger reload

  const loadMedications = async (dateToFetch) => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('userDetails');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) return;

      // Major Task: If Caregiver has a linked patient, use patient email. Else use own email.
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
      querySnapshot.forEach((doc) => meds.push({ id: doc.id, ...doc.data() }));
      
      setMedList(meds);
    } catch (e) {
      console.log('Firestore Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePress = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(item.formattedDate);
    loadMedications(item.formattedDate);
  };

  const checkMedicineTimes = () => {
    const currentFormattedTime = moment().format('hh:mm A'); 
    medList.forEach((med) => {
      const medReminder = med.reminder || med.time;
      if (!medReminder || alertedMedsRef.current.has(med.id)) return;

      if (currentFormattedTime === medReminder) {
        Toast.show({
          type: 'success',
          text1: '💊 Time for Medication',
          text2: `Take: ${med.name}`,
          position: 'top',
          visibilityTime: 5000,
        });
        alertedMedsRef.current.add(med.id);
      }
    });
  };

  const formatDay = (day) => {
    const days = { 'Mon': 'Mon', 'Tue': 'Tues', 'Wed': 'Wed', 'Thu': 'Thurs', 'Fri': 'Fri', 'Sat': 'Sat', 'Sun': 'Sun' };
    return days[day] || day;
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

      <FlatList
        data={dateRange}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateList}
        renderItem={({ item }) => {
          const isSelected = item.formattedDate === selectedDate;
          const day = formatDay(moment(item.formattedDate, 'MM/DD/YYYY').format('ddd'));
          const dateNum = moment(item.formattedDate, 'MM/DD/YYYY').format('DD');

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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1},
  banner: { width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginTop: 10, marginBottom: 10 },
  bannerTextContainer: { padding: 20 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bannerSubtitle: { fontSize: 12, color: '#fff' },
  dateList: { marginBottom: 20, padding: 5 },
  dateButton: { height: 50, padding: 15, borderRadius: 25, marginRight: 10, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
});