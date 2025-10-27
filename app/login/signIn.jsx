import { useRouter } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/FirebaseConfig';
import Colors from '../../Constant/Colors';
import { setLocalStorage } from '../../service/Storage';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('(tabs)');
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const onSignInClick = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Logged in user:', user.email);

      // Save user data to AsyncStorage (make sure the key matches MedicationList)
      await setLocalStorage('userDetails', user);

      Alert.alert('Success', 'Logged in successfully!');
      router.replace('(tabs)');
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Login Error', 'No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Login Error', 'Incorrect password.');
      } else {
        Alert.alert('Login Error', error.message);
      }
    }
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's Sign You In</Text>
      <Text style={styles.subText}>Welcome Back</Text>
      <Text style={styles.subText}>You've been missed!</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Email"
          style={styles.textInput}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Password"
          style={styles.textInput}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={onSignInClick}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonCreate}
        onPress={() => router.push('/login/signUp')}
      >
        <Text style={styles.buttonCreateText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subText: {
    fontSize: 20,
    marginTop: 5,
    color: Colors.GRAY,
  },
  inputContainer: {
    marginTop: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  textInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 10,
    fontSize: 16,
    marginTop: 5,
    backgroundColor: 'white',
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
    marginTop: 35,
  },
  buttonText: {
    fontSize: 17,
    color: 'white',
    textAlign: 'center',
  },
  buttonCreate: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  buttonCreateText: {
    fontSize: 17,
    color: Colors.PRIMARY,
    textAlign: 'center',
  },
});
