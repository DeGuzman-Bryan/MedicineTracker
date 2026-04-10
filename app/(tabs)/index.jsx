import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';
import { auth, db } from '../../config/FirebaseConfig';


export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    }
    setLoading(false);
  };

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