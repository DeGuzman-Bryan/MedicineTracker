import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user info from Firestore
  useEffect(() => {
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
  }, []);

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
        <Text style={styles.headerText}>Profile</Text>
      </View>

      {/* Profile Card */}
      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.username}>@{userData.userName}</Text>
          <Text style={styles.email}>{userData.email}</Text>

          {userData.age ? <Text style={styles.info}>Age: {userData.age}</Text> : null}
          {userData.gender ? <Text style={styles.info}>Gender: {userData.gender}</Text> : null}
          {userData.bio ? <Text style={styles.bio}>{userData.bio}</Text> : null}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/editProfile/edit-profile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/History')}>
        <Text style={styles.buttonText}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginTop: 45, marginBottom: 20 },
  headerText: { fontSize: 24, fontWeight: '600', color: '#8b5cf6', paddingHorizontal: 10 },
  profileCard: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  username: { color: '#666', marginBottom: 5 },
  email: { color: '#888', marginBottom: 10 },
  info: { color: '#555' },
  bio: { marginTop: 10, fontStyle: 'italic', color: '#444' },
  editButton: {
    backgroundColor: '#8b5cf6',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  button: {
    width: '80%',
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 10,
    marginVertical: 10,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logout: { backgroundColor: '#e74c3c' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
