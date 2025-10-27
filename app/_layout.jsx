import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
   <Stack screenOptions={{
    headerShown:false
   }}>
    <Stack.Screen name='(tabs)'/>
     <Stack.Screen name='login'/>
     <Stack.Screen name='action-modal'
     options={{
      presentation:'modal'
     }}/>
   </Stack>
  );
}
