import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import { getLocalStorage, setLocalStorage } from '../../service/Storage';
import { requestPermissions } from '../../service/notifications';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    const user = await getLocalStorage('userDetails');
    setUserData(user);
  };

  const sendTestNotification = async () => {
    const hasPermission = await requestPermissions();
    
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Please enable notifications in your phone settings.");
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Medication Reminder Test",
          body: "It works! This is how your daily reminders will look.",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          seconds: 5,
          channelId: 'default', 
        },
      });

      Alert.alert("Scheduled!", "Notification will arrive in 5 seconds. Close the app or lock your screen now!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not schedule notification. Check your console.");
    }
  };

  const handleConnectPatient = async () => {
    if (!patientId.trim()) {
      Alert.alert('Error', 'Please enter a Patient Code');
      return;
    }
    setLoading(true);
    try {
      const patientDoc = await getDoc(doc(db, 'users', patientId.trim()));
      if (!patientDoc.exists()) {
        Alert.alert('Error', 'Invalid Code. Patient not found.');
        return;
      }

      const patientData = patientDoc.data();

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        linkedPatientId: patientId.trim(),
        linkedPatientEmail: patientData.email,
        linkedPatientName: patientData.fullName
      });

      await updateDoc(doc(db, 'users', patientId.trim()), {
        linkedCaregiverId: auth.currentUser.uid,
        linkedCaregiverEmail: userData.email, 
        linkedCaregiverName: userData.fullName 
      });

      const updatedUser = { 
        ...userData, 
        linkedPatientId: patientId.trim(),
        linkedPatientEmail: patientData.email,
        linkedPatientName: patientData.fullName
      };
      await setLocalStorage('userDetails', updatedUser);
      setUserData(updatedUser);

      Alert.alert('Success', `Connected to ${patientData.fullName}'s records!`);
      setPatientId('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 NEW FUNCTION: Removes the link for both users
  const handleRemovePatient = async () => {
    Alert.alert('Remove Connection', 'Are you sure you want to disconnect from this patient?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const currentPatientId = userData.linkedPatientId;

            // Clear Caregiver's Document
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              linkedPatientId: null,
              linkedPatientEmail: null,
              linkedPatientName: null
            });

            // Clear Patient's Document
            if (currentPatientId) {
              await updateDoc(doc(db, 'users', currentPatientId), {
                linkedCaregiverId: null,
                linkedCaregiverEmail: null, 
                linkedCaregiverName: null 
              });
            }

            // Update Local Storage & State
            const updatedUser = { 
              ...userData, 
              linkedPatientId: null,
              linkedPatientEmail: null,
              linkedPatientName: null
            };
            await setLocalStorage('userDetails', updatedUser);
            setUserData(updatedUser);

            Alert.alert('Success', 'Patient connection removed.');
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { 
        text: 'Logout', 
        onPress: async () => {
          await signOut(auth);
          await AsyncStorage.removeItem('userDetails');
          router.replace('/login/signIn');
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Profile</Text>

      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.email}>{userData.email}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userData.role?.toUpperCase()}</Text>
          </View>

          {/* CAREGIVER SECTION */}
          {userData.role === 'caregiver' && (
            <View style={styles.connectSection}>
              <Text style={styles.idLabel}>Connect to Patient:</Text>
              {userData.linkedPatientName ? (
                <View>
                  <View style={styles.linkedInfo}>
                    <Text style={styles.linkedText}>Linked to: {userData.linkedPatientName}</Text>
                    <Ionicons name="checkmark-circle" size={20} color="green" />
                  </View>
                  {/* 🌟 NEW REMOVE BUTTON */}
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={handleRemovePatient}
                    disabled={loading}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ff4d4d" />
                    <Text style={styles.removeBtnText}>Remove / Change Patient</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Paste Patient Code Here"
                    value={patientId}
                    onChangeText={setPatientId}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.connectBtn} 
                    onPress={handleConnectPatient}
                    disabled={loading}
                  >
                    <Ionicons name="link" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* PATIENT SECTION: Long Press to Copy */}
          {userData.role === 'patient' && (
            <View style={styles.idSection}>
              <Text style={styles.idLabel}>Your Share Code (Long press to copy):</Text>
              <View style={styles.copyBox}>
                <Text style={styles.idText} selectable={true}>{userData.uid}</Text>
              </View>
            </View>
          )}

          {/* TEST NOTIFICATION BUTTON */}
          <View style={[styles.idSection, { marginTop: 15 }]}>
            <Text style={styles.idLabel}>System Tools</Text>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={sendTestNotification}
            >
              <Ionicons name="notifications-outline" size={20} color="#8b5cf6" />
              <Text style={styles.testButtonText}>Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ff4d4d" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#f3f1ff' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  profileCard: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  name: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 16, color: 'gray', marginBottom: 10 },
  roleBadge: { 
    alignSelf: 'flex-start', backgroundColor: '#8b5cf6', 
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 20 
  },
  roleText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  idSection: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  connectSection: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 15, paddingBottom: 15 },
  idLabel: { fontSize: 14, color: 'gray', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10 },
  textInput: { 
    flex: 1, backgroundColor: '#f9f9f9', padding: 12, 
    borderRadius: 10, borderWidth: 1, borderColor: '#ddd' 
  },
  connectBtn: { 
    backgroundColor: '#8b5cf6', padding: 12, 
    borderRadius: 10, justifyContent: 'center' 
  },
  linkedInfo: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f0fff4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#c6f6d5'
  },
  linkedText: { color: '#2f855a', fontWeight: '500' },
  // 🌟 NEW REMOVE BUTTON STYLES
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, padding: 10, borderRadius: 10,
    backgroundColor: '#fff1f1', borderWidth: 1, borderColor: '#ffcdd2'
  },
  removeBtnText: { color: '#ff4d4d', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  copyBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  idText: { fontSize: 14, color: '#333' },
  testButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#8b5cf6', backgroundColor: '#f5f3ff'
  },
  testButtonText: { color: '#8b5cf6', fontWeight: 'bold', marginLeft: 10 },
  logoutButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    marginTop: 30, padding: 15, borderRadius: 15, backgroundColor: '#fff', 
    borderWidth: 1, borderColor: '#ff4d4d'
  },
  logoutText: { color: '#ff4d4d', fontWeight: 'bold', marginLeft: 10 }
});