import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import MedicationCardItem from '../../components/MedicationCardItem';
import { db } from '../../config/FirebaseConfig';

export default function MedicationHistory() {
  const [medList, setMedList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      loadAllMedications();
    }, [])
  );

  const getLocalStorage = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) { return null; }
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
    } catch (e) { setMedList([]); }
  };

  const handleDelete = async () => {
    if (!selectedMed) return;
    Alert.alert("Delete", "Remove this from history?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, 'medication', selectedMed.id));
          setModalVisible(false);
          loadAllMedications();
      }}
    ]);
  };

  // Helper to find the latest action status and date
  const getActionDetails = (med) => {
    if (!med?.action || med.action.length === 0) {
      return { status: 'Pending', date: 'Not yet recorded' };
    }
    // Get the most recent action from the array
    const lastAction = med.action[med.action.length - 1];
    return {
      status: lastAction.status || 'Pending',
      date: lastAction.date || 'N/A'
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>History</Text>
        <Text style={styles.subText}>Track your past medication activities</Text>
      </View>

      {medList.length === 0 ? (
        <View style={styles.listContainer}><EmptyState /></View>
      ) : (
        <FlatList
          data={medList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedMed(item); setModalVisible(true); }}>
              <MedicationCardItem medicine={item} status={item.action?.[0]?.status} />
            </TouchableOpacity>
          )}
          style={styles.listContainer}
        />
      )}

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
              </TouchableOpacity>
            </View>

            {selectedMed && (
              <View style={styles.detailsContainer}>
                <Text style={styles.medName}>{selectedMed.name}</Text>
                
                {/* Status Row */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { 
                    color: getActionDetails(selectedMed).status === 'Taken' ? '#4caf50' : 
                           getActionDetails(selectedMed).status === 'Missed' ? '#f44336' : '#888' 
                  }]}>
                    {getActionDetails(selectedMed).status}
                  </Text>
                </View>

                {/* Date Logged Row */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {getActionDetails(selectedMed).date}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedMed.time || selectedMed.reminder}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dose:</Text>
                  <Text style={styles.detailValue}>{selectedMed.dose} {selectedMed.type?.name || selectedMed.type}</Text>
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
  container: { flex: 1, backgroundColor: '#f3f1ff', paddingHorizontal: 25 },
  headerContainer: { marginTop: 45, marginBottom: 20 },
  headerText: { fontSize: 24, fontWeight: '600', color: '#8b5cf6' },
  subText: { fontSize: 16, color: 'gray', marginTop: 4 },
  listContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  medName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { width: 70, fontSize: 14, color: '#888' },
  detailValue: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
});