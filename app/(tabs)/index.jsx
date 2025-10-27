import { View } from 'react-native'; // ✅ added this line
import Header from '../../components/Header';
import MedicationList from '../../components/MedicationList';

export default function HomeScreen() {
  return (
    <View style={{
      padding: 25,
      backgroundColor: 'white',
      height: '100%',
      width: '100%',
    }}>
      <Header />

      <MedicationList />

    </View>
  );
}
