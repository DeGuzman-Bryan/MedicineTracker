import { useRouter } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/FirebaseConfig';
import { setLocalStorage } from '../../service/Storage';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role) {
          router.replace('(tabs)');
        } else {
          router.replace('/login/roleSelection');
        }
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
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data().role) {
        
        // 🌟 THE SYNC FIX: Guarantee both user email and partner emails save properly
        const finalUserData = {
          ...userDoc.data(),
          email: user.email // Hard-saving this guarantees it's always available
        };

        await setLocalStorage('userDetails', finalUserData);
        console.log('✅ Role found, going to Dashboard');
        router.replace('(tabs)');
      } else {
        console.log('⚠️ No role found, going to Role Selection');
        router.replace('/login/roleSelection');
      }

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
      <View style={styles.form}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subText}>Let's Sign You in.</Text>
          <Text style={styles.subText2}>We missed you!</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
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
            placeholder="Enter your password"
            style={styles.textInput}
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onSignInClick}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.textLinkContainer}>
          <Text style={styles.textLink}>
            Don’t have an account?{' '}
            <Text
              style={styles.textLinkHighlight}
              onPress={() => router.push('/login/signUp')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8b5cf6', // New design
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  subText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginTop: 4,
  },
  subText2: {
    fontSize: 14,
    fontWeight: '400',
    color: 'gray',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    padding: 14,
    borderWidth: 1.3,
    borderColor: '#D1D5DB',
    borderRadius: 50,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 15,
    borderRadius: 50,
    marginTop: 15,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  textLinkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  textLink: {
    fontSize: 15,
    color: 'gray',
  },
  textLinkHighlight: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
});