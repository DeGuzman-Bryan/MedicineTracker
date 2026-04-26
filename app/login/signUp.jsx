import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../../Constant/Colors";
import { setLocalStorage } from "../../service/Storage";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/FirebaseConfig";

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const OnCreateAccount = async () => {
    if (!fullName || !email || !password || !userName) {
      Alert.alert("Error", "Please fill all details");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Update Firebase Auth display name
      await updateProfile(user, { displayName: userName });

      // ✅ Store minimal user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        userName,
        email,
        createdAt: new Date(),
      });

      // ✅ Save user in local storage (same key used in SignIn.js)
      await setLocalStorage("userDetails", {
        uid: user.uid,
        email: user.email,
        displayName: userName,
      });

      console.log("✅ Account created successfully:", user.email);
      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("(tabs)"), // Directly go to home screen
        },
      ]);
    } catch (error) {
      console.error("❌ Signup Error:", error);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Signup Error", "Email is already in use.");
      } else {
        Alert.alert("Signup Error", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
      <Text style={styles.title}>Create New Account</Text>
      <Text style={styles.subText}>Join us to start tracking your medications!</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Full Name"
          style={styles.textInput}
          onChangeText={setFullName}
          value={fullName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Username"
          style={styles.textInput}
          onChangeText={setUserName}
          value={userName}
        />
      </View>

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
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={OnCreateAccount}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
        <View style={styles.textLinkContainer}>
          <Text style={styles.textLink}>
            Already have an account?{' '}
            <Text
              style={styles.textLinkHighlight}
                onPress={() => router.push('/login/signIn')}
            >
              Sign In
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
      backgroundColor: '#8b5cf6',
      paddingHorizontal: 25,
      justifyContent: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'gray',
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  textInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 50,
    fontSize: 16,
    backgroundColor: "white",
  },
  button: {
    padding: 15,
    backgroundColor: '#8b5cf6',
    borderRadius: 50,
    marginTop: 35,
  },
  buttonText: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
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