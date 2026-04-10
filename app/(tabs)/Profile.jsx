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

  // States for Caregiver Linking
  const [isModalVisible, setModalVisible] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [linking, setLinking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

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

  // ✅ Function for Caregiver to Link a Patient
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
        Alert.alert("Error", "Invalid Patient Code. Please check the code and try again.");
        return;
      }

      const patientData = patientSnap.data();
      const caregiverRef = doc(db, 'users', auth.currentUser.uid);
      
      const updateData = {
        linkedPatientId: patientCode.trim(),
        linkedPatientName: patientData.fullName || patientData.userName
      };

      await updateDoc(caregiverRef, updateData);
      Alert.alert("Success!", `You are now monitoring ${updateData.linkedPatientName}`);
      setModalVisible(false);
      setPatientCode('');
      fetchUserData(); // Refresh UI
    } catch (err) {
      Alert.alert("Error", "Could not link patient.");
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.removeItem('userDetails');
            router.replace('/login/signIn');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout.');
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
          
          <View style={styles.roleBox}>
             <Text style={styles.roleLabel}>ROLE: {userData.role?.toUpperCase()}</Text>
          </View>

          {/* ✅ CAREGIVER SECTION: Input for Patient Code */}
          {userData.role === 'caregiver' && (
            <View style={styles.linkContainer}>
              {userData.linkedPatientName ? (
                <View style={styles.monitoringBox}>
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                  <Text style={styles.monitoringText}> Monitoring: {userData.linkedPatientName}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.linkBtn} onPress={() => setModalVisible(true)}>
                  <Ionicons name="link-outline" size={18} color="#fff" />
                  <Text style={styles.linkBtnText}> Link to Patient</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/editProfile/edit-profile')}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}> Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Logout</Text>
      </TouchableOpacity>

      {/* ✅ LINKING MODAL */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Patient</Text>
            <Text style={styles.modalSub}>Enter the unique code from the Patient's profile.</Text>
            
            <TextInput 
              style={styles.input}
              placeholder="Paste Patient Code Here"
              value={patientCode}
              onChangeText={setPatientCode}
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmBtn} onPress={handleLinkPatient}>
                {linking ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Link Now</Text>}
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
  username: { color: '#6b7280', marginBottom: 2 },
  roleBox: { marginVertical: 10, padding: 8, backgroundColor: '#f4f4f4', borderRadius: 8 },
  roleLabel: { fontWeight: 'bold', color: '#8b5cf6', fontSize: 13 },
  
  // Caregiver Link Styles
  linkContainer: { width: '100%', marginVertical: 10 },
  linkBtn: { flexDirection: 'row', backgroundColor: '#8b5cf6', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: 'bold' },
  monitoringBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  monitoringText: { color: '#166534', fontWeight: '600' },

  editButton: { flexDirection: 'row', backgroundColor: '#ede9fe', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center', marginTop: 15 },
  editButtonText: { color: '#8b5cf6', fontWeight: '600' },
  button: { flexDirection: 'row', width: '80%', padding: 15, backgroundColor: '#6d28d9', borderRadius: 12, marginVertical: 8, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  logout: { backgroundColor: '#e74c3c' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 13 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#8b5cf6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});