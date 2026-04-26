import { useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity } from 'react-native';
import Colors from '../Constant/Colors';
import ConstantString from '../Constant/ConstantString';

export default function EmptyState() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 30,
      }}
    >
      <Image
        source={require('../assets/images/medicine.png')}
        style={{
          width: 120,
          height: 120,
          marginTop: 30,
        }}
      />

      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          marginTop: 25,
          textAlign: 'center',
        }}
      >
        {ConstantString.NoMedication}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: Colors.DARK_GRAY,
          textAlign: 'center',
          marginTop: 15,
          paddingHorizontal: 15,
        }}
      >
        {ConstantString.MedicationSubText}
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#8b5cf6',
          paddingVertical: 15,
          borderRadius: 10,
          width: '80%',
          marginTop: 30,
        }}
        onPress={() => router.push('/add-new-medication')}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontSize: 17,
            fontWeight: '600',
          }}
        >
          {ConstantString.AddNewMedicationBtn}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
