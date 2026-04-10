import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for Major Task: Linking Caregiver to Patient
  const [isModalVisible, setModalVisible] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [linking, setLinking] = useState(false);

  // ✅ Re-fetch user info every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [])
  );

  // ✅ Major Task: Handle Linking Patient to Caregiver
  const handleLinkPatient = async () => {
    if (!patientCode.trim()) {
      Alert.alert("Error", "Please enter a code.");
      return;
    }
    setLinking(true);
    try {
      const patientRef = doc(db, 'users', patientCode.trim());
      const patientSnap = await getDoc(patientRef);

      if (!patientSnap.exists()) {
        Alert.alert("Error", "Invalid Patient Code.");
        return;
      }

      const patientData = patientSnap.data();
      const caregiverRef = doc(db, 'users', auth.currentUser.uid);

      const updateData = {
        linkedPatientId: patientCode.trim(),
        linkedPatientEmail: patientData.email,
        linkedPatientName: patientData.fullName || patientData.userName
      };

      await updateDoc(caregiverRef, updateData);
      
      // Update local storage so Home/MedicationList reflects changes
      const currentLocalData = await AsyncStorage.getItem('userDetails');
      const parsedData = currentLocalData ? JSON.parse(currentLocalData) : {};
      await AsyncStorage.setItem('userDetails', JSON.stringify({ ...parsedData, ...updateData }));

      Alert.alert("Success!", `Linked to ${updateData.linkedPatientName}`);
      setModalVisible(false);
      // Re-fetch data to update UI
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserData(userSnap.data());
    } catch (err) {
      Alert.alert("Error", "Could not link patient.");
    } finally {
      setLinking(false);
    }
  };

  // ✅ Your Original Logout Handler (Applied Here)
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.clear();
            router.replace('/login/signIn');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>My Profile</Text>
      </View>

      {userData && (
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={90} color="#8b5cf6" />
          </View>

          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.username}>@{userData.userName}</Text>
          <Text style={styles.email}>{userData.email}</Text>

          {/* Role and Linking UI Section */}
          <View style={styles.roleBox}>
            <Text style={styles.roleLabel}>ROLE: {userData.role?.toUpperCase()}</Text>
            {userData.role === 'patient' ? (
              <>
                <Text style={styles.label}>Your Patient Code:</Text>
                <Text selectable style={styles.codeText}>{auth.currentUser.uid}</Text>
              </>
            ) : (
              <>
                {userData.linkedPatientName ? (
                  <Text style={styles.linkedText}>Monitoring: {userData.linkedPatientName}</Text>
                ) : (
                  <TouchableOpacity style={styles.linkBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.linkBtnText}>Link to Patient</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/editProfile/edit-profile')}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}> Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/History')}>
        <Ionicons name="time-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Logout</Text>
      </TouchableOpacity>

      {/* Linking Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Patient Code</Text>
            <TextInput 
              style={styles.input} 
              value={patientCode} 
              onChangeText={setPatientCode} 
              placeholder="Paste Patient UID here"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLinkPatient} disabled={linking}>
                {linking ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Text style={styles.confirmText}>Link</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: '#f3f1ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginTop: 45, marginBottom: 20, alignItems: 'center' },
  headerText: { fontSize: 26, fontWeight: '700', color: '#5b21b6' },
  profileCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 25, elevation: 5 },
  avatarContainer: { backgroundColor: '#ede9fe', borderRadius: 100, padding: 5, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  username: { color: '#6b7280', marginBottom: 5 },
  email: { color: '#888', marginBottom: 10 },
  roleBox: { width: '100%', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 15, marginVertical: 10, alignItems: 'center' },
  roleLabel: { fontSize: 14, fontWeight: 'bold', color: '#8b5cf6', marginBottom: 8 },
  label: { fontSize: 12, color: '#666' },
  codeText: { fontSize: 11, fontWeight: 'bold', color: '#333', marginTop: 4 },
  linkedText: { color: 'green', fontWeight: 'bold' },
  linkBtn: { backgroundColor: '#8b5cf6', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  linkBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  editButton: { flexDirection: 'row', backgroundColor: '#8b5cf6', marginTop: 15, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center' },
  editButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  button: { flexDirection: 'row', width: '80%', padding: 15, backgroundColor: '#6d28d9', borderRadius: 12, marginVertical: 8, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  logout: { backgroundColor: '#e74c3c' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', width: '100%', marginBottom: 25, padding: 8, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  cancelText: { color: '#666', fontSize: 16 },
  confirmText: { color: '#8b5cf6', fontSize: 16, fontWeight: 'bold' }
});