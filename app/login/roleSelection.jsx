import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import { setLocalStorage } from '../../service/Storage';

export default function RoleSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Session expired. Please login again.");

      const userData = {
        fullName: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: selectedRole,
        uid: user.uid,
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Database
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      // 2. Save to Local Storage (Crucial to stop the loop)
      await setLocalStorage('userDetails', userData);

      // 3. Move to Dashboard
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert("Error", error.message);
      router.replace('/login/signIn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#8b5cf6" />
      ) : (
        <View style={{gap: 20, width: '100%'}}>
          <TouchableOpacity style={styles.card} onPress={() => handleRoleSelect('patient')}>
            <Text style={styles.cardText}>💊 I am a Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => handleRoleSelect('caregiver')}>
            <Text style={styles.cardText}>🫂 I am a Caregiver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  card: { width: '100%', padding: 20, borderRadius: 15, backgroundColor: '#f3f1ff', borderWidth: 1, borderColor: '#8b5cf6' },
  cardText: { fontSize: 18, textAlign: 'center', fontWeight: '600' }
});