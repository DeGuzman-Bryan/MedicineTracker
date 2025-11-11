import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message'; // <-- import toast
import { auth } from '../../config/FirebaseConfig';

export default function TabLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserLoggedIn(true);
      } else {
        setUserLoggedIn(false);

        // Show session expired toast then navigate
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please sign in again.',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
        });

        setTimeout(() => {
          router.replace('/login/signIn');
        }, 3500); // wait for toast to disappear
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!userLoggedIn) return null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#8b5cf6',
          tabBarInactiveTintColor: '#8e8e93',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="History"
          options={{
            title: 'History',
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="history" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="user" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Toast container for global notifications */}
      <Toast />
    </View>
  );
}
