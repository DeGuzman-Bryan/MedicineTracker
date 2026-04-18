import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Colors from '../Constant/Colors'; // optional — only if you want to match your app theme

export default function AddMedicationHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="arrow-back" size={26} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerText}>Add New Medication</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 3,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: 40,
  },
  backButton: {
    padding: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8b5cf6',
  },
});
