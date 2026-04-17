import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../config/FirebaseConfig';

export default function TabLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("LOG ✅ Active Session:", user.email);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Save fresh data to local storage
            await AsyncStorage.setItem('userDetails', JSON.stringify(userData));

            // ✅ REDIRECT LOGIC: If role is missing, go to Role Selection
            if (!userData.role) {
              console.log("LOG ⚠️ No role found, redirecting to Role Selection");
              router.replace('/login/roleSelection');
              setLoading(false);
              return; 
            }
            
            console.log("LOG 👤 Role Found:", userData.role);
            setUserLoggedIn(true);
          } else {
            // New user with no Firestore document yet
            router.replace('/login/roleSelection');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      } else {
        console.log("LOG 🚪 User logged out");
        setUserLoggedIn(false);
        await AsyncStorage.removeItem('userDetails'); 
        router.replace('/login/signIn');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f1ff' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  // If we aren't logged in or are being redirected, show nothing (loading state handles the rest)
  if (!userLoggedIn) return null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#8b5cf6' }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} /> }} />
        <Tabs.Screen 
          name="add-new-medication/index" 
          options={{
            title: 'Add',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="plus-circle" size={32} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="History" options={{ title: 'History', tabBarIcon: ({ color }) => <AntDesign name="history" size={24} color={color} /> }} />
        <Tabs.Screen name="Profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
      </Tabs>
      <Toast />
    </View>
  );
}