import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../Constant/Colors';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/FirebaseConfig';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignInClick = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subText}>Let’s sign you in</Text>
        <Text style={styles.subTextSmall}>We’ve missed you!</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.textInput}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            style={styles.textInput}
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onSignInClick}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.signupPrompt}>
          <Text style={styles.promptText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login/signUp')}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.GRAY_DARK,
    marginTop: 5,
  },
  subTextSmall: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.GRAY,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: Colors.GRAY_DARK,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 50,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: Colors.DARK_TEXT,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  promptText: {
    fontSize: 15,
    color: Colors.GRAY_DARK,
  },
  signupText: {
    fontSize: 15,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
});
