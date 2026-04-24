import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../../config/FirebaseConfig';

export default function TabLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    // 1. Check local storage IMMEDIATELY on app start
    const checkLocalSession = async () => {
      try {
        const localData = await AsyncStorage.getItem('userDetails');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (parsedData) {
            setUserLoggedIn(true);
            // We don't stop loading yet; we wait for Firebase to confirm the auth state
          }
        }
      } catch (e) {
        console.error("Local session check error:", e);
      }
    };

    checkLocalSession();

    // 2. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firebase confirms we have a session
        setUserLoggedIn(true);
        setLoading(false);
      } else {
        // Double check local storage before kicking them out
        const localData = await AsyncStorage.getItem('userDetails');
        if (!localData) {
          setUserLoggedIn(false);
          router.replace('/login/signIn');
        } else {
          // If we have localData but Firebase is "thinking", stay logged in
          setUserLoggedIn(true);
        }
        setLoading(false);
      }
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

  // If not logged in, this stops the Tab UI from rendering while we redirect
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