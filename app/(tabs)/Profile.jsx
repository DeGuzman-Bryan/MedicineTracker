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
  SafeAreaView,
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

  const handleEditProfile = () => {
    router.push('/editProfile/edit-profile');
  };

  // Bi-directional Link (Updates both Caregiver & Patient)
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

      // 1. Update Caregiver Document
      const updateData = {
        linkedPatientId: patientCode.trim(),
        linkedPatientEmail: patientData.email,
        linkedPatientName: patientData.fullName || patientData.userName
      };
      await updateDoc(caregiverRef, updateData);

      // 2. Update Patient Document
      await updateDoc(patientRef, {
        linkedCaregiverId: auth.currentUser.uid,
        linkedCaregiverEmail: userData.email, 
        linkedCaregiverName: userData.fullName 
      });

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

  // Bi-directional Disconnect (Clears both Caregiver & Patient)
  const handleDisconnect = async () => {
    Alert.alert('Disconnect', 'Stop monitoring this patient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          try {
            const currentPatientId = userData.linkedPatientId;
            const caregiverRef = doc(db, 'users', auth.currentUser.uid);
            
            // 1. Clear Caregiver Document
            await updateDoc(caregiverRef, {
              linkedPatientId: deleteField(),
              linkedPatientEmail: deleteField(),
              linkedPatientName: deleteField()
            });

            // 2. Clear Patient Document
            if (currentPatientId) {
              const patientRef = doc(db, 'users', currentPatientId);
              await updateDoc(patientRef, {
                linkedCaregiverId: deleteField(),
                linkedCaregiverEmail: deleteField(), 
                linkedCaregiverName: deleteField() 
              });
            }

            fetchUserData();
          } catch (error) {
            Alert.alert("Error", "Failed to disconnect.");
          }
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
      {
        text: 'Logout', onPress: async () => {
          await signOut(auth);
          await AsyncStorage.removeItem('userDetails');
          router.replace('/login/signIn');
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#8b5cf6" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity onPress={handleEditProfile} style={styles.editIconButton}>
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {userData && (
            <View style={styles.userInfoSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={50} color="#8b5cf6" />
              </View>
              <Text style={styles.nameText}>{userData.fullName}</Text>
              <Text style={styles.emailText}>{userData.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{userData.role?.toUpperCase()}</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>

      <View style={styles.contentContainer}>
        {userData?.role === 'caregiver' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Monitoring Status</Text>
            {userData.linkedPatientName ? (
              <View style={styles.monitorCard}>
                <Text style={styles.monitorName}>{userData.linkedPatientName}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.actionBtn}>
                    <Ionicons name="swap-horizontal" size={16} color="#8b5cf6" />
                    <Text style={styles.actionText}> Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDisconnect} style={styles.actionBtn}>
                    <Ionicons name="close-circle" size={16} color="#e74c3c" />
                    <Text style={[styles.actionText, { color: '#e74c3c' }]}> Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.linkBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="link-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.linkBtnText}>Link to Patient</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {userData?.role === 'patient' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Patient Code</Text>
            <View style={styles.idBox}>
              <Text selectable style={styles.idValue}>{auth.currentUser.uid}</Text>
              <TouchableOpacity onPress={onShareID} style={styles.shareBtn}>
                <Ionicons name="share-social" size={20} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Share this code with your caregiver to link accounts.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Patient Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste Patient ID here"
              value={patientCode}
              onChangeText={setPatientCode}
              autoCapitalize="none"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLinkPatient} style={styles.saveBtn}>
                {linking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Link Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    backgroundColor: '#8b5cf6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  editIconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  userInfoSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  emailText: {
    fontSize: 14,
    color: '#E0D7FF',
    marginBottom: 15,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    marginLeft: 5,
  },
  monitorCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monitorName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  actionRow: { flexDirection: 'row', gap: 20, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6' },
  linkBtn: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  linkBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  idBox: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  idValue: { fontSize: 13, fontWeight: 'bold', color: '#333', flex: 1 },
  shareBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  btnLogout: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 15,
    marginTop: 'auto',
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 30, borderRadius: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 }
});