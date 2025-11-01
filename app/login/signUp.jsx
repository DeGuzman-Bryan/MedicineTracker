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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: userName });

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        userName,
        email,
        createdAt: new Date(),
      });

      await setLocalStorage("userDetails", {
        uid: user.uid,
        email: user.email,
        displayName: userName,
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("(tabs)") },
      ]);
    } catch (error) {
      console.error("Signup Error:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Signup Error", "Email is already in use.");
      } else {
        Alert.alert("Signup Error", error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subText}>Join us and start tracking your medication</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Enter your full name"
            style={styles.textInput}
            onChangeText={setFullName}
            value={fullName}
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="Enter your username"
            style={styles.textInput}
            onChangeText={setUserName}
            value={userName}
            placeholderTextColor={Colors.GRAY}
          />
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
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            style={styles.textInput}
            onChangeText={setPassword}
            secureTextEntry
            value={password}
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={OnCreateAccount}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login/signIn")}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.linkText}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    textAlign: "center",
    color: Colors.GRAY_DARK,
    marginTop: 5,
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
    backgroundColor: "#f8f9fa",
    borderRadius: 50,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: Colors.DARK_TEXT,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    color: Colors.GRAY_DARK,
    fontSize: 15,
    marginTop: 18,
  },
  linkText: {
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
});
