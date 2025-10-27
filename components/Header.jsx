import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/FirebaseConfig'; // adjust path if needed
export default function Header() {
  const user = auth.currentUser; // Get currently logged-in user
  const router=useRouter();
  return (
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: 10,
        }}
      >
        <Text style={{ fontSize: 25, fontWeight: '600', color: 'black' }}>
          {user ? user.email : 'No user logged in'} 👋
        </Text>
<TouchableOpacity onPress={()=>router.push('/add-new-medication')}> 
<AntDesign name="medicine-box" size={24} color="black" />   
</TouchableOpacity>
   </View>
    </View>
  );
}
