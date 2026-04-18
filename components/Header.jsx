import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/FirebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';

export default function Header() {
  const [userName, setUserName] = useState('');
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().userName);
          } else {
            console.log('User document not found in Firestore');
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, [user]);

  return (
    <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center', // centers icon vertically with texts
        }}
      >
        {/* Texts stacked vertically */}
        <View>
          <Text style={{ fontSize: 24, fontWeight: '600', color:'#8b5cf6' }}>
            Welcome, {userName || user?.displayName || 'No user logged in'}!
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: 'gray', marginTop: 4 }}>
            How are you feeling today?
          </Text>
        </View>

        {/* Icon vertically centered with the texts */}
        <TouchableOpacity onPress={() => router.push('/add-new-medication')}>
          <AntDesign name="medicine-box" size={28} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
