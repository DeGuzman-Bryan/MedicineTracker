import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export default function AddMedicationHeader() {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: 'white',
        elevation: 3,
        height: 70, // ✅ Ensures consistent header height
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          padding: 12, // ✅ Comfortable touch area
          borderRadius: 25,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // ✅ Expands invisible tap zone
      >
        <Ionicons name="arrow-back" size={26} color="black" />
      </TouchableOpacity>
    </View>
  );
}
