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
      alertedMedsRef.current.clear();
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
      if (now.hour() === medTime.hour() && now.minute() === medTime.minute()) {
        Toast.show({
          type: 'success',
          text1: '💊 Time to take your medicine',
          text2: `Take: ${med.name}`,
          position: 'top',
          visibilityTime: 5000,
        });
        alertedMedsRef.current.add(med.id);
      }
    });
  };

  const formatDay = (day) => {
    switch (day) {
      case 'Mon': return 'Mon';
      case 'Tue': return 'Tues';
      case 'Wed': return 'Wed';
      case 'Thu': return 'Thurs';
      case 'Fri': return 'Fri';
      case 'Sat': return 'Sat';
      case 'Sun': return 'Sun';
      default: return day;
    }
  };

  return (
    <View style={styles.container}>
      {/* --- Hero Banner --- */}
      <ImageBackground
        source={require('./../assets/images/med1.jpg')}
        style={styles.banner}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Stay Healthy, Stay Happy</Text>
          <Text style={styles.bannerSubtitle}>Consistency is the best medicine.</Text>
        </View>
      </ImageBackground>

      {/* --- Date Selector --- */}
      <FlatList
        data={dateRange}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateList}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        renderItem={({ item }) => {
          const isSelected = item.formattedDate === selectedDate;
          const day = formatDay(moment(item.formattedDate, 'MM/DD/YYYY').format('ddd'));
          const dateNum = moment(item.formattedDate, 'MM/DD/YYYY').format('DD');

          return (
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: isSelected ? '#8b5cf6' : '#F9F9F9',
                  borderColor: isSelected ? '#8b5cf6' : '#E0E0E0',
                },
              ]}
              onPress={() => handleDatePress(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dateLabel,
                  { color: isSelected ? '#fff' : '#333' },
                ]}
              >
                {day}, {dateNum}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(_, index) => index.toString()}
      />

      {/* --- Medication List --- */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
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
              //style={styles.medCard}
            >
              <MedicationCardItem medicine={item} selectedDate={selectedDate} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 5 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Hero Banner
  banner: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 10, // slightly tighter spacing
    justifyContent: 'flex-start',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  bannerTextContainer: {
    position: 'absolute',
    top: 25,
    left: 20,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
    fontStyle: 'italic',
  },

  dateList: {
    marginVertical: 1,
  },
  dateButton: {
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 90,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
});
