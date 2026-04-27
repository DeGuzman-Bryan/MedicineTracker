import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image 
        source={require('./../assets/images/medicine.png')} 
        style={styles.image} 
        resizeMode="contain"
      />
      
      <Text style={styles.title}>No Medication</Text>
      <Text style={styles.subtitle}>
        You have 0 Medication setup, Kindly setup a new one
      </Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/add-new-medication')}
      >
        <Text style={styles.buttonText}>+ Add New Medication</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#8b5cf6', 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});