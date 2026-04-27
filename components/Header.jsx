import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../config/FirebaseConfig';

// IMPORTANT: No 'import' for the image here.

export default function Header() {
  const [userName, setUserName] = useState('');
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data()?.userName);
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();
  }, [user]);

  return (
    <ImageBackground 
      source={require('../assets/images/med1.jpg')} 
      style={styles.headerContainer}
      imageStyle={styles.imageInnerStyle}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>
              Welcome, {userName || 'Guest'}!
            </Text>
            <Text style={styles.subGreetingText}>
              How are you feeling today?
            </Text>
          </View>

          
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#8b5cf6', 
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingBottom: 30,
    paddingHorizontal: 25,
    height: 180, // Set a specific height to see the image better
    overflow: 'hidden', 
  },
  imageInnerStyle: {
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    opacity: 0.85, 
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subGreetingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E0D7FF',
    marginTop: 4,
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 12,
  }
});