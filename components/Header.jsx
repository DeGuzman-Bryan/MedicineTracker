import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../config/FirebaseConfig';
import { getLocalStorage } from '../service/Storage';

export default function Header() {
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      try {
        // 1. First, try to get name from Local Storage (Instant)
        const localStorageUser = await getLocalStorage('userDetails');
        if (localStorageUser && localStorageUser.displayName) {
          setUserName(localStorageUser.displayName);
        } else if (localStorageUser && localStorageUser.userName) {
          setUserName(localStorageUser.userName);
        }

        // 2. Second, sync with Firestore for the most up-to-date data
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().userName) {
            setUserName(userDoc.data().userName);
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    getUserData();
  }, []);

  return (
    <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: '600', color:'#8b5cf6' }}>
            Welcome, {userName || 'User'}!
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: 'gray', marginTop: 4 }}>
            How are you feeling today?
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/add-new-medication')}>
          <AntDesign name="medicine-box" size={28} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}