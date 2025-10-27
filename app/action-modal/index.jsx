import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore'; // ✅ FIXED: use firestore, not firestore/lite
import moment from 'moment';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../config/FirebaseConfig';

export default function Index() {
  const { selectedDate, reminder, docId } = useLocalSearchParams(); // ✅ Get docId directly
  const router = useRouter();

  const UpdateActionStatus = async (status) => {
    try {
      if (!docId) {
        Alert.alert('Error', 'Missing document ID. Cannot update.');
        return;
      }

      const docRef = doc(db, 'medication', docId); // ✅ Use docId from params
      await updateDoc(docRef, {
        action: arrayUnion({
          status: status,
          time: moment().format('LT'),
          date: selectedDate,
        }),
      });

      // ✅ Works both iOS + Android
      Alert.alert(
        status,
        'Response saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('(tabs)'),
          },
        ],
        { cancelable: false }
      );
    } catch (e) {
      console.log('Error updating status:', e);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const formatReminderTime = (reminderStr) => {
    if (!reminderStr) return 'No reminder set';
    const match = reminderStr.match(/seconds=(\d+)/);
    if (!match) return 'Invalid time';
    const seconds = parseInt(match[1]);
    const date = new Date(seconds * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formattedTime = formatReminderTime(reminder);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/notification.gif')}
        style={styles.image}
      />

      <Text style={styles.dateText}>{selectedDate || 'No date selected'}</Text>

      <Text style={styles.reminderText}>{formattedTime}</Text>

      <Text style={styles.subText}>It's time to take</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.missedBtn}
          onPress={() => UpdateActionStatus('Missed')}
        >
          <AntDesign name="close" size={22} color="red" />
          <Text style={styles.missedText}>Missed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.takenBtn}
          onPress={() => UpdateActionStatus('Taken')}
        >
          <AntDesign name="check" size={22} color="white" />
          <Text style={styles.takenText}>Taken</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: 'absolute', bottom: 50 }}
      >
        <FontAwesome name="close" size={44} color="gray" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 120,
    height: 120,
  },
  dateText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  reminderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 10,
  },
  subText: {
    fontSize: 18,
    color: '#444',
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  missedBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'red',
    borderRadius: 10,
    gap: 6,
  },
  missedText: {
    fontSize: 18,
    color: 'red',
    fontWeight: '600',
  },
  takenBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3aff33',
    borderRadius: 10,
    gap: 6,
  },
  takenText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});
