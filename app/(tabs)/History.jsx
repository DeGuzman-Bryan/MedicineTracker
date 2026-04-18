import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router'; // Added useFocusEffect
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react'; // Removed useEffect, Added useCallback
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import MedicationCardItem from '../../components/MedicationCardItem';
import { db } from '../../config/FirebaseConfig';

export default function MedicationHistory() {
  const [medList, setMedList] = useState([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  
  const router = useRouter();

  // THIS IS THE MAGIC PART: It re-runs every time you click the History tab!
  useFocusEffect(
    useCallback(() => {
      loadAllMedications();
    }, [])
  );

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
              onPress={() => {
                setSelectedMed(item);
                setModalVisible(true);
              }}
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

      {/* --- CUSTOM DETAILS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header (Close Button & Delete Icon) */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.headerIcons}>
                <TouchableOpacity onPress={() => console.log('Delete clicked for:', selectedMed.id)}>
                  <Ionicons name="trash-outline" size={22} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Medicine Details */}
            {selectedMed && (
              <View style={styles.detailsContainer}>
                <Text style={styles.medName}>{selectedMed.name}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedMed.time || selectedMed.reminder}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedMed.type?.name || selectedMed.type || 'Capsule'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dose:</Text>
                  <Text style={styles.detailValue}>{selectedMed.dose || 'N/A'}</Text>
                </View>

                {/* Dates Row */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dates:</Text>
                  <Text style={styles.detailValue}>
                    {selectedMed.startDate || 'N/A'} {selectedMed.endDate ? `to ${selectedMed.endDate}` : ''}
                  </Text>
                </View>

              </View>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f1ff',
    paddingHorizontal: 25, 
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
  listContainer: {
    flex: 1,
  },
  
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  detailsContainer: {
    marginTop: 5,
  },
  medName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 60,
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    flex: 1, 
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});