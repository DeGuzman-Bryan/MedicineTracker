import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import MedicationCardItem from '../../components/MedicationCardItem';
import { db } from '../../config/FirebaseConfig';

export default function MedicationHistory() {
  const [medList, setMedList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadAllMedications();
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

  const loadAllMedications = async () => {
    const user = await getLocalStorage('userDetails');
    if (!user?.email) return;

    try {
      const q = query(collection(db, 'medication'), where('userEmail', '==', user.email));
      const snapshot = await getDocs(q);
      const meds = [];
      snapshot.forEach((doc) => meds.push({ id: doc.id, ...doc.data() }));
      setMedList(meds);
    } catch (e) {
      console.log('Firestore error:', e);
      setMedList([]);
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 15 }}>
      <Image
        source={require('../../assets/images/sign.jpg')}
        style={{ width: '100%', height: 200, borderRadius: 15, marginTop: 20 }}
      />

      {/* Medication List */}
      {medList.length === 0 ? (
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
                  params: {
                    ...item,
                  },
                })
              }
            >
              <MedicationCardItem
                medicine={item}
                selectedDate={null} // no date filtering
                status={null}       // no date-specific status
              />
            </TouchableOpacity>
          )}
          style={{ marginTop: 10 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // No date selector styles needed
});
