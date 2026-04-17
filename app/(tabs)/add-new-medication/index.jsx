import { View } from 'react-native'
import AddMedicationForm from '../../../components/AddMedicationForm'
import AddMedicationHeader from '../../../components/AddMedicationHeader'

export default function AddNewMedication() {
  return (
    <View>
        <AddMedicationHeader/>
        <AddMedicationForm/>
    </View>
  )
}