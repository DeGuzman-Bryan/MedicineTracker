import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/FirebaseConfig';
import { useRouter } from 'expo-router';

export default function EditProfile() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    age: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            fullName: data.fullName || '',
            userName: data.userName || '',
            age: data.age ? data.age.toString() : '',
            gender: data.gender || '',
            bio: data.bio || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        fullName: form.fullName,
        userName: form.userName,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        bio: form.bio,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(text) => setForm({ ...form, fullName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={form.userName}
        onChangeText={(text) => setForm({ ...form, userName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={form.age}
        onChangeText={(text) => setForm({ ...form, age: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={form.gender}
        onChangeText={(text) => setForm({ ...form, gender: text })}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Bio"
        value={form.bio}
        multiline
        numberOfLines={4}
        onChangeText={(text) => setForm({ ...form, bio: text })}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#8b5cf6', marginBottom: 25 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
});
