import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import Colors from '../../Constant/Colors';

export default function RoleSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found. Please log in again.");

      // Save user profile & role to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        role: selectedRole, // 'patient' or 'caregiver'
        uid: user.uid,
        createdAt: new Date(),
      }, { merge: true });

      // Move to the main app
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error(error);
      Alert.alert("Selection Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>One last step!</Text>
      <Text style={styles.subtitle}>Are you tracking your own meds or helping someone else?</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      ) : (
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={styles.roleCard} 
            onPress={() => handleRoleSelect('patient')}
          >
            <Text style={styles.emoji}>💊</Text>
            <Text style={styles.roleTitle}>I am a Patient</Text>
            <Text style={styles.roleDesc}>I will manage my own medication schedule.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard} 
            onPress={() => handleRoleSelect('caregiver')}
          >
            <Text style={styles.emoji}>🫂</Text>
            <Text style={styles.roleTitle}>I am a Caregiver</Text>
            <Text style={styles.roleDesc}>I will monitor a patient's medication intake.</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#8b5cf6', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  cardContainer: { gap: 20 },
  roleCard: {
    backgroundColor: '#fbf0ff',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 10 },
  roleTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  roleDesc: { fontSize: 14, color: '#777', textAlign: 'center', marginTop: 5 },
});