import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import MedicationCardItem from '../../components/MedicationCardItem';
import { db } from '../../config/FirebaseConfig';

export default function MedicationHistory() {
  const [medList, setMedList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  
  useEffect(() => {
    let unsubscribe;

    const setupQuery = async () => {
      try {
        const value = await AsyncStorage.getItem('userDetails');
        const user = value ? JSON.parse(value) : null;
        if (!user?.email) return;

        // 🌟 FETCH SHARED HISTORY (Logic from your Old Code) 🌟
        const q = query(
          collection(db, 'medication'), 
          where('accessibleBy', 'array-contains', user.email)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const medsMap = new Map();
          
          snapshot.forEach((doc) => {
            medsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });

          const sortedMeds = Array.from(medsMap.values()).sort((a, b) => {
            const lastA = a.action?.[a.action.length - 1];
            const lastB = b.action?.[b.action.length - 1];

            const timeA = lastA?.date ? new Date(lastA.date).getTime() : 0;
            const timeB = lastB?.date ? new Date(lastB.date).getTime() : 0;

            return timeB - timeA;
          });

          setMedList(sortedMeds);
        });

      } catch (e) {
        console.error("Setup error:", e);
      }
    };

    setupQuery();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); 

  const ensureString = (val) => {
    if (!val) return 'N/A';
    if (typeof val === 'object') {
      if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
      return JSON.stringify(val);
    }
    return String(val);
  };

  const getActionDetails = (med) => {
    if (!med?.action || !Array.isArray(med.action) || med.action.length === 0) {
      return { status: 'Pending', date: 'Not yet recorded' };
    }
    const lastAction = med.action[med.action.length - 1];
    return {
      status: ensureString(lastAction.status || 'Pending'),
      date: ensureString(lastAction.date)
    };
  };

  const handleDelete = async () => {
    if (!selectedMed) return;
    Alert.alert("Delete", "Remove this from history? This deletes it for both users.", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, 'medication', selectedMed.id));
            setModalVisible(false);
          } catch (e) {
            console.error("Delete error:", e);
          }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>History</Text>
        <Text style={styles.subText}>Track shared medication activities</Text>
      </View>

      {medList.length === 0 ? (
        <View style={styles.listContainer}><EmptyState /></View>
      ) : (
        <FlatList
          data={medList}
          keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()} 
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedMed(item); setModalVisible(true); }}>
              <MedicationCardItem medicine={item} status={getActionDetails(item).status} />
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
                <Text style={styles.medName}>{ensureString(selectedMed.name)}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { 
                    color: getActionDetails(selectedMed).status === 'Taken' ? '#4caf50' : 
                           getActionDetails(selectedMed).status === 'Missed' ? '#f44336' : '#888' 
                  }]}>
                    {getActionDetails(selectedMed).status}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{getActionDetails(selectedMed).date}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{ensureString(selectedMed.time || selectedMed.reminder)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dose:</Text>
                  <Text style={styles.detailValue}>
                    {ensureString(selectedMed.dose)} {ensureString(selectedMed.type?.name || selectedMed.type)}
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
    backgroundColor: '#f3f1ff', // Added from old code so the list background matches nicely
  },
  headerContainer: { 
    backgroundColor: '#8b5cf6', 
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingBottom: 30,
    paddingHorizontal: 25,
    paddingTop: 40,
    overflow: 'hidden',
  },
  headerText: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
   },
  subText: { fontSize: 16, color: '#E0D7FF', marginTop: 4 },
  listContainer: { 
    flex: 1,
    paddingHorizontal: 25, // Added back here so items don't touch the edge of the screen
    paddingTop: 15,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  medName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { width: 70, fontSize: 14, color: '#888' },
  detailValue: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
});