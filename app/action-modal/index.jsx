import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { Alert, Image, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { db } from '../../config/FirebaseConfig';

export default function Index() {
  const medicine = useLocalSearchParams(); 
  const { selectedDate, reminder, docId } = medicine;
  const router = useRouter();

  // Optimized Delete: Works instantly offline
  const onDeletePress = () => {
    Alert.alert('Delete Medication', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          try {
            // No 'await' here so it happens locally immediately
            deleteDoc(doc(db, 'Medication', docId)).catch(() => {});
            ToastAndroid.show("Deleted successfully", ToastAndroid.SHORT);
            router.replace('(tabs)'); 
          } catch (e) { 
            Alert.alert('Error', 'Could not delete.'); 
          }
      }},
    ]);
  };

  const onEditPress = () => {
    router.push({
      pathname: '/add-new-medication',
      params: { 
        ...medicine,
        type: typeof medicine.type === 'object' ? JSON.stringify(medicine.type) : medicine.type 
      }
    });
  };

  // Optimized Status Update: Works instantly offline
  const UpdateActionStatus = async (status) => {
    try {
      const actionData = { 
        status, 
        time: moment().format('LT'), 
        date: typeof selectedDate === 'string' ? selectedDate : moment().format('ll') 
      };

      const docRef = doc(db, 'Medication', docId);

      // We trigger the update without 'await'. 
      // Firestore saves this to the phone's disk and notifies the Home Screen.
      updateDoc(docRef, { action: arrayUnion(actionData) })
        .then(() => console.log("Action queued for sync"))
        .catch((e) => console.log("Local save only:", e));

      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        ToastAndroid.show("Saved offline! Will sync later.", ToastAndroid.SHORT);
      }

      router.replace('(tabs)');
    } catch (e) { 
      console.error(e);
      Alert.alert('Error', 'Failed to update.'); 
    }
  };

  const formatReminderTime = (reminderStr) => {
    if (!reminderStr) return 'No time set';
    const match = reminderStr.match(/seconds=(\d+)/);
    if (match) {
      const seconds = parseInt(match[1]);
      const date = new Date(seconds * 1000);
      return date.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    }
    return reminderStr;
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/notification.gif')} 
        style={styles.image} 
      />
      
      <Text style={styles.dateText}>{selectedDate}</Text>
      <Text style={styles.reminderText}>{formatReminderTime(reminder)}</Text>
      <Text style={styles.subText}>It's time to take</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.missedBtn} onPress={() => UpdateActionStatus('Missed')}>
          <AntDesign name="close" size={22} color="red" />
          <Text style={styles.missedText}>Missed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.takenBtn} onPress={() => UpdateActionStatus('Taken')}>
          <AntDesign name="check" size={22} color="white" />
          <Text style={styles.takenText}>Taken</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
        <AntDesign name="edit" size={22} color="#007AFF" />
        <Text style={styles.editText}>Edit Medication</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDeletePress}>
        <MaterialIcons name="delete-forever" size={24} color="#ff4444" />
        <Text style={styles.deleteText}>Delete Medication</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', bottom: 50 }}>
        <FontAwesome name="close" size={44} color="gray" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  image: { width: 120, height: 120 },
  dateText: { marginTop: 20, fontSize: 16, color: '#555' },
  reminderText: { fontSize: 32, fontWeight: 'bold', color: '#222', marginVertical: 10, textAlign: 'center' },
  subText: { fontSize: 18, color: '#444', marginBottom: 25 },
  buttonRow: { flexDirection: 'row', gap: 15 },
  missedBtn: { padding: 12, flexDirection: 'row', borderWidth: 2, borderColor: 'red', borderRadius: 10, gap: 6, alignItems: 'center' },
  missedText: { color: 'red', fontWeight: 'bold', fontSize: 18 },
  takenBtn: { padding: 12, flexDirection: 'row', backgroundColor: '#3dd474ff', borderRadius: 10, gap: 6, alignItems: 'center' },
  takenText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  editBtn: { marginTop: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editText: { color: '#007AFF', fontSize: 17, fontWeight: 'bold' },
  deleteBtn: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteText: { color: '#ff4444', fontSize: 17, fontWeight: 'bold' }
});