import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { auth, db } from '../../config/FirebaseConfig';


export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to profile changes in real-time
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ActivityIndicator size={'large'} color={'#8b5cf6'} style={{marginTop: '50%'}} />
  }

  return (
    <View style={{
      padding: 25,
      backgroundColor: '#f3f1ff',
      height: '100%',
      width: '100%',
    }}>
      <Header />

      {/* Pass the profile info to the list so it knows whose meds to show */}
      <MedicationList userProfile={userProfile} />

    </View>
  );
}