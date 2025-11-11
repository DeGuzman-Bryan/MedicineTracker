import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // ✅ Logout handler
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

  // ✅ Show loading spinner while fetching data
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

      {/* ✅ Profile Card */}
      {userData && (
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={90} color="#8b5cf6" />
          </View>

          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.username}>@{userData.userName}</Text>
          <Text style={styles.email}>{userData.email}</Text>

          <View style={styles.detailsContainer}>
            {userData.age ? (
              <Text style={styles.info}>
                <Text style={styles.label}>Age: </Text>
                {userData.age}
              </Text>
            ) : null}
            {userData.gender ? (
              <Text style={styles.info}>
                <Text style={styles.label}>Gender: </Text>
                {userData.gender}
              </Text>
            ) : null}
            {userData.bio ? (
              <Text style={styles.bio}>
                “{userData.bio}”
              </Text>
            ) : null}
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

      {/* ✅ Navigation Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/History')}>
        <Ionicons name="time-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>  Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: '#f3f1ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginTop: 45, marginBottom: 20, alignItems: 'center' },
  headerText: { fontSize: 26, fontWeight: '700', color: '#5b21b6' },

  profileCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  avatarContainer: {
    backgroundColor: '#ede9fe',
    borderRadius: 100,
    padding: 5,
    marginBottom: 10,
  },

  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  username: { color: '#6b7280', marginBottom: 5 },
  email: { color: '#888', marginBottom: 10 },
  detailsContainer: { marginTop: 8, alignItems: 'center' },
  info: { color: '#4b5563', fontSize: 15, marginTop: 2 },
  label: { fontWeight: '600', color: '#5b21b6' },
  bio: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 15,
  },

  editButton: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
  },
  editButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },

  button: {
    flexDirection: 'row',
    width: '80%',
    padding: 15,
    backgroundColor: '#6d28d9',
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: { backgroundColor: '#e74c3c' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
