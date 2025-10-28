import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>History</Text>
        <Text style={styles.subText}>Track your past medication activities</Text>
      </View>

      {/* Banner Image */}
      <Image
        source={require('../../assets/images/sign.jpg')}
        style={styles.bannerImage}
      />

      {/* Medication List */}
      {medList.length === 0 ? (
        <View style={styles.listContainer}>
          <EmptyState />
        </View>
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
                selectedDate={null}
                status={null}
              />
            </TouchableOpacity>
          )}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25, // ✅ Apply 25 padding globally
  },
  headerContainer: {
    marginTop: 45,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
    paddingHorizontal: 10, 
  },
  subText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'gray',
    marginTop: 4,
    paddingHorizontal: 10, 
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
  },
});
