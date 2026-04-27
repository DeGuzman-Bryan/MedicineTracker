import { AntDesign, Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { Alert, Image, SafeAreaView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { db } from '../../config/FirebaseConfig';
import { addToOfflineQueue } from '../../service/OfflineSync';
import { getLocalStorage } from '../../service/Storage';
import { sendImmediateNotification } from '../../service/notifications';

export default function ActionModal() {
  const medicine = useLocalSearchParams();
  const { selectedDate, reminder, docId, name } = medicine;
  const router = useRouter();

  const onDeletePress = () => {
    if (!docId) {
      Alert.alert('Error', 'Medication ID is missing.');
      return;
    }

    Alert.alert('Delete Medication', 'Are you sure you want to remove this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // 🌟 CHECK WIFI FIRST
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              await addToOfflineQueue('DELETE', { docId });
              ToastAndroid.show('Saved offline. Will delete when connected.', ToastAndroid.SHORT);
              router.replace('(tabs)');
              return;
            }

            await deleteDoc(doc(db, 'medication', docId));
            ToastAndroid.show('Deleted successfully', ToastAndroid.SHORT);
            router.replace('(tabs)');
          } catch (e) {
            console.error('Delete Error:', e);
            Alert.alert('Error', 'Could not delete.');
          }
        },
      },
    ]);
  };

  const onEditPress = () => {
    router.push({
      pathname: '/add-new-medication',
      params: {
        ...medicine,
        type: typeof medicine.type === 'object' ? JSON.stringify(medicine.type) : medicine.type,
      },
    });
  };

  const UpdateActionStatus = async (status) => {
    if (!docId) {
      Alert.alert('Error', 'Cannot update. Medication ID is missing.');
      return;
    }

    try {
      const user = await getLocalStorage('userDetails');
      const actionData = {
        status,
        time: moment().format('LT'),
        date: typeof selectedDate === 'string' ? selectedDate : moment().format('ll'),
        by: user?.email || 'Unknown',
      };

      const medName = name ? name : 'your medicine';

      // 🌟 CHECK WIFI FIRST
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        await addToOfflineQueue('UPDATE_ACTION', { docId, actionData });
        ToastAndroid.show(`Saved ${status} offline. Will sync when connected.`, ToastAndroid.SHORT);

        // 🌟 NOTIFICATION TRIGGER (OFFLINE)
        await sendImmediateNotification(`💊 ${medName} Update`, `You marked this as ${status} (Saved Offline).`);

        router.replace('(tabs)');
        return;
      }

      const docRef = doc(db, 'medication', docId);
      await updateDoc(docRef, { action: arrayUnion(actionData) });
      ToastAndroid.show(`Marked as ${status}`, ToastAndroid.SHORT);

      // 🌟 NOTIFICATION TRIGGER (ONLINE)
      await sendImmediateNotification(`💊 ${medName} Update`, `You successfully marked this as ${status}.`);

      router.replace('(tabs)');
    } catch (e) {
      console.error('Update Error:', e);
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
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return reminderStr;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Row with Minimal Icons */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity onPress={onEditPress} style={styles.iconBtn}>
              <AntDesign name="edit" size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeletePress} style={[styles.iconBtn, { marginLeft: 12 }]}>
              <AntDesign name="delete" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/images/notification.gif')}
                style={styles.image}
              />
            </View>
            <Text style={styles.dateLabel}>{selectedDate}</Text>
            <Text style={styles.timeText}>{formatReminderTime(reminder)}</Text>
            <Text style={styles.medicationName}>{name || 'Medication Name'}</Text>
            <Text style={styles.subText}>It's time for your scheduled dose.</Text>
          </View>

          <TouchableOpacity
            style={styles.takenBtn}
            onPress={() => UpdateActionStatus('Taken')}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.takenText}>Mark as Taken</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f1ff',
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  rightActions: {
    flexDirection: 'row',
  },
  closeBtn: {
    padding: 8,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  imageContainer: {
    marginBottom: 30,
  },
  image: {
    width: 140,
    height: 140,
  },
  infoCard: {
    backgroundColor: 'white',
    width: '100%',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dateLabel: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4b5563',
    textAlign: 'center',
  },
  subText: {
    fontSize: 15,
    color: '#9ca3af',
    marginTop: 10,
    textAlign: 'center',
  },
  takenBtn: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 3,
  },
  takenText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
});