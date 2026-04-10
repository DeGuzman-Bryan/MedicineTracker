import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../Constant/Colors';

export default function LoginScreen() {
  const router=useRouter();
  return (
    <View style={styles.container}>
      {/* Big Logo */}
      <Image
        source={require('../../assets/images/logo1.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Blue Bottom Section */}
      <View style={styles.bottomContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.title}>Stay on Track, Stay Healthy!</Text>
          <Text style={styles.note}>
            Track your meds, take control of your health.{"\n"}
            Stay consistent, Stay Confident
          </Text>
        </View>

        <TouchableOpacity style={styles.button}
        onPress={()=>router.push('login/signIn')}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: 300,
    marginTop: 70,
  },
  bottomContainer: {
    flex: 0.8,
    backgroundColor: Colors.PRIMARY,
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    justifyContent: 'space-between', // pushes button to bottom
    alignItems: 'center',
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  note: {
    fontSize: 16,
    color: '#eaf4ff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 70,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 10, // small gap from bottom
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
});