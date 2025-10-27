import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message'; // <-- import toast
import { db } from '../config/FirebaseConfig';
import Colors from '../Constant/Colors';
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

    // Check every 15 seconds for precise timing
    intervalRef.current = setInterval(() => {
      checkMedicineTimes();
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const getLocalStorage = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.log('Error reading local storage:', e);
      return null;
    }
  };

  const loadMedications = async (dateToFetch) => {
    try {
      setLoading(true);
      const user = await getLocalStorage('userDetails');
      if (!user?.email) {
        setMedList([]);
        return;
      }

      const formattedDate = moment(dateToFetch, 'MM/DD/YYYY').format('MM/DD/YYYY');
      const q = query(
        collection(db, 'medication'),
        where('userEmail', '==', user.email),
        where('dates', 'array-contains', formattedDate)
      );

      const querySnapshot = await getDocs(q);
      const meds = [];
      querySnapshot.forEach((doc) => meds.push({ id: doc.id, ...doc.data() }));
      setMedList(meds);

      alertedMedsRef.current.clear(); // reset alerts for new day
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
    const now = moment();
    medList.forEach((med) => {
      if (!med.time || alertedMedsRef.current.has(med.id)) return;

      const medTime = moment(`${selectedDate} ${med.time}`, 'MM/DD/YYYY HH:mm');

      // Exact hour and minute match
      if (now.hour() === medTime.hour() && now.minute() === medTime.minute()) {
        Toast.show({
          type: 'success',
          text1: '💊 Time to take your medicine',
          text2: `Take: ${med.name}`,
          position: 'top',
          visibilityTime: 5000,
          autoHide: true,
        });

        alertedMedsRef.current.add(med.id);
      }
    });
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 15 }}>
      <Image
        source={require('./../assets/images/med1.jpg')}
        style={{ width: '100%', height: 200, borderRadius: 15, marginTop: 20 }}
      />

      <FlatList
        data={dateRange}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 15 }}
        contentContainerStyle={{ paddingHorizontal: 5 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dateGroup,
              {
                backgroundColor:
                  item.formattedDate === selectedDate ? Colors.PRIMARY : Colors.GRAY,
                transform: [{ scale: item.formattedDate === selectedDate ? 1.08 : 1 }],
              },
            ]}
            activeOpacity={0.8}
            onPress={() => handleDatePress(item)}
          >
            <Text
              style={[
                styles.day,
                { color: item.formattedDate === selectedDate ? 'white' : 'black' },
              ]}
            >
              {item.day}
            </Text>

            <Text
              style={[
                styles.date,
                { color: item.formattedDate === selectedDate ? 'white' : 'black' },
              ]}
            >
              {item.date}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(_, index) => index.toString()}
      />

      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : medList.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={medList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: '/action-modal',
                  params: { ...item, selectedDate },
                })
              }
            >
              <MedicationCardItem medicine={item} selectedDate={selectedDate} />
            </TouchableOpacity>
          )}
          style={{ marginTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateGroup: {
    width: 70,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightgray',
    marginRight: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  day: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 20, fontWeight: 'bold' },
});
