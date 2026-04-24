import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserLoggedIn(true);
        setLoading(false);
      } else {
        setUserLoggedIn(false);
        setLoading(false);
        // Direct to Sign In form
        router.replace('/login/signIn');
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

  if (!userLoggedIn) return null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#8b5cf6' }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} /> }} />
        <Tabs.Screen name="add-new-medication/index" options={{ title: 'Add', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="plus-circle" size={32} color={color} /> }} />
        <Tabs.Screen name="History" options={{ title: 'History', tabBarIcon: ({ color }) => <AntDesign name="history" size={24} color={color} /> }} />
        <Tabs.Screen name="Profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
      </Tabs>
      <Toast />
    </View>
  );
}