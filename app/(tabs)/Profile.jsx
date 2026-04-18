import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { deleteField, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Link or CHANGE a Patient
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
      Alert.alert("Success", `Now monitoring ${updateData.linkedPatientName}`);
      setModalVisible(false);
      setPatientCode('');
      fetchUserData(); 
    } catch (err) {
      Alert.alert("Error", "Failed to link.");
    } finally {
      setLinking(false);
    }
  };

  // ✅ NEW: Disconnect current patient
  const handleDisconnect = async () => {
    Alert.alert('Disconnect', 'Stop monitoring this patient?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Stop', 
        style: 'destructive', 
        onPress: async () => {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            linkedPatientId: deleteField(),
            linkedPatientEmail: deleteField(),
            linkedPatientName: deleteField()
          });
          fetchUserData();
        } 
      }
    ]);
  };

  const onShareID = async () => {
    await Share.share({ message: `My Patient Code: ${auth.currentUser.uid}` });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: async () => {
          await signOut(auth);
          await AsyncStorage.removeItem('userDetails');
          router.replace('/login/signIn');
      }}
    ]);
  };

  if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>My Profile</Text>
      </View>

      {userData && (
        <View style={styles.profileCard}>
          <Ionicons name="person-circle-outline" size={90} color="#8b5cf6" />
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.username}>@{userData.userName}</Text>
          
          <View style={styles.roleBox}><Text style={styles.roleLabel}>{userData.role?.toUpperCase()}</Text></View>

          {/* CAREGIVER SECTION */}
          {userData.role === 'caregiver' && (
            <View style={{ width: '100%' }}>
              {userData.linkedPatientName ? (
                <View style={styles.monitorCard}>
                  <Text style={styles.monitorName}>{userData.linkedPatientName}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.actionBtn}>
                      <Ionicons name="swap-horizontal" size={16} color="#8b5cf6" /><Text style={styles.actionText}> Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDisconnect} style={styles.actionBtn}>
                      <Ionicons name="close-circle" size={16} color="#e74c3c" /><Text style={[styles.actionText, {color: '#e74c3c'}]}> Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.linkBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.linkBtnText}>Link to Patient</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* PATIENT SECTION */}
          {userData.role === 'patient' && (
            <View style={styles.idBox}>
              <Text style={styles.idLabel}>YOUR PATIENT CODE:</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text selectable style={styles.idValue}>{auth.currentUser.uid}</Text>
                <TouchableOpacity onPress={onShareID}><Ionicons name="share-social" size={18} color="#8b5cf6" /></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.btnHome} onPress={() => router.push('/')}><Text style={styles.btnText}>Home</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}><Text style={styles.btnText}>Logout</Text></TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Patient Code</Text>
            <TextInput style={styles.input} placeholder="Paste ID here" value={patientCode} onChangeText={setPatientCode} autoCapitalize="none" />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleLinkPatient} style={styles.saveBtn}>
                {linking ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff'}}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#f3f1ff' },
  headerContainer: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#5b21b6' },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 4 },
  name: { fontSize: 20, fontWeight: 'bold' },
  username: { color: '#666', marginBottom: 10 },
  roleBox: { backgroundColor: '#f3f1ff', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 15 },
  roleLabel: { fontSize: 12, color: '#8b5cf6', fontWeight: 'bold' },
  monitorCard: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 15, width: '100%', alignItems: 'center' },
  monitorName: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  actionRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: 'bold', color: '#8b5cf6' },
  linkBtn: { backgroundColor: '#8b5cf6', padding: 15, borderRadius: 12, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: 'bold' },
  idBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  idLabel: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  idValue: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  btnHome: { backgroundColor: '#6d28d9', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  btnLogout: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 25, borderRadius: 20 },
  modalTitle: { fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, alignItems: 'center' },
  saveBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }
});