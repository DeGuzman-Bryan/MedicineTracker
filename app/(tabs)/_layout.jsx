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
          // 1. Check local storage FIRST for immediate offline access
          const localData = await AsyncStorage.getItem('userDetails');
          if (localData) {
            const parsedData = JSON.parse(localData);
            if (parsedData.role) {
              setUserLoggedIn(true);
              setLoading(false); // Stop loading immediately because we have local data!
            }
          }

          // 2. Sync with Firestore in the background
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef); 
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            await AsyncStorage.setItem('userDetails', JSON.stringify(userData));

            if (!userData.role) {
              router.replace('/login/roleSelection');
            } else {
              setUserLoggedIn(true);
            }
          } else if (!localData) {
            // No local data AND no firestore data
            router.replace('/login/roleSelection');
          }
        } catch (error) {
          console.error("Sync error:", error);
          // If error occurs (like timeout), but we have localData, we already set userLoggedIn to true
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
        <Tabs.Screen name="History" options={{ title: 'History', tabBarIcon: ({ color }) => <AntDesign name="history" size={24} color={color} /> }} />
        <Tabs.Screen name="Profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
      </Tabs>
      <Toast />
    </View>
  );
}