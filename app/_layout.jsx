import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Your new hook import
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '../config/FirebaseConfig';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // From the new code
  const colorScheme = useColorScheme();

  // From the old code: Clears session on cold start
  useEffect(() => {
    const clearSessionOnAppLoad = async () => {
      try {
        await signOut(auth);
        await AsyncStorage.removeItem('userDetails');
        console.log("App Cold Start: Session cleared.");
      } catch (e) {
        console.error("Init Error:", e);
      }
    };
    clearSessionOnAppLoad();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' />
      <Stack.Screen name='login' />
      <Stack.Screen 
        name='action-modal'
        options={{ presentation: 'modal' }} 
      />
    </Stack>
  );
}