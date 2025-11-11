import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import Colors from '../../Constant/Colors';
import { TypeList, WhenToTake } from '../../Constant/Options';
import { FormatDateForText, getDatesRange } from '../../service/ConvertDateTime';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function EditMedicine() {
  const router = useRouter();
  const { medicine } = useLocalSearchParams();
  const parsedMedicine = JSON.parse(medicine);

  // Helper: parse Firestore timestamp or string to JS Date
  const parseDate = (value) => {
    if (!value) return new Date();
    if (typeof value === 'string') return new Date(value);
    if (value.seconds) return new Date(value.seconds * 1000);
    return value;
  };

  const [formData, setFormData] = useState({
    ...parsedMedicine,
    endDate: parseDate(parsedMedicine.endDate),
    reminder: parseDate(parsedMedicine.reminder),
  });

  const [showEndDate, setShowEndDate] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const SaveMedication = async () => {
    if (
      !formData?.name ||
      !formData?.type ||
      !formData?.dose ||
      !formData?.endDate ||
      !formData?.when ||
      !formData?.reminder
    ) {
      Alert.alert('Missing Fields', 'Please fill in all fields before saving.', [{ text: 'OK' }]);
      return;
    }

    // Convert dates to ISO strings for storing in Firestore array
    const dates = getDatesRange(new Date(), formData.endDate)
      .map((d) => {
        const dateObj = typeof d === 'string' ? new Date(d) : d;
        return dateObj instanceof Date && !isNaN(dateObj) ? dateObj.toISOString() : null;
      })
      .filter(Boolean);

    try {
      await updateDoc(doc(db, 'medication', formData.docId), {
        ...formData,
        endDate: Timestamp.fromDate(formData.endDate),
        reminder: Timestamp.fromDate(formData.reminder),
        dates,
      });

      Alert.alert('Success', 'Medication updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log('Firestore error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Medicine Name */}
      <View style={styles.inputGroup}>
        <Ionicons style={styles.icon} name="medkit-outline" size={22} />
        <TextInput
          style={styles.textInput}
          placeholder="Medicine Name"
          placeholderTextColor="#999"
          value={formData.name || ''}
          onChangeText={(value) => onHandleInputChange('name', value)}
        />
      </View>

      {/* Medicine Type */}
      <Text style={styles.label}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
        {TypeList.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.typeChip, item.name === formData?.type?.name && styles.typeChipActive]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text style={[styles.typeText, item.name === formData?.type?.name && styles.typeTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dose */}
      <View style={styles.inputGroup}>
        <Ionicons style={styles.icon} name="eyedrop-outline" size={22} />
        <TextInput
          style={styles.textInput}
          placeholder="Dose (e.g. 2 tablets, 5ml)"
          placeholderTextColor="#999"
          value={formData.dose || ''}
          onChangeText={(value) => onHandleInputChange('dose', value)}
        />
      </View>

      {/* When to Take */}
      <Text style={styles.label}>When to Take</Text>
      <View style={[styles.inputGroup, { paddingRight: 0 }]}>
        <AntDesign style={styles.icon} name="field-time" size={22} />
        <Picker
          selectedValue={formData?.when || ''}
          onValueChange={(itemValue) => onHandleInputChange('when', itemValue)}
          style={{ flex: 1 }}
        >
          {WhenToTake.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* End Date */}
      <Text style={styles.label}>End Date</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowEndDate(true)}>
        <AntDesign style={styles.icon} name="calendar" size={22} />
        <Text style={styles.text}>
          {formData?.endDate ? FormatDateForText(formData.endDate) : 'Select End Date'}
        </Text>
      </TouchableOpacity>

      {/* Reminder Time */}
      <Text style={styles.label}>Reminder Time</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
        <FontAwesome6 style={styles.icon} name="user-clock" size={22} />
        <Text style={styles.text}>
          {formData?.reminder
            ? formData.reminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Select Reminder Time'}
        </Text>
      </TouchableOpacity>

      {/* DateTime Pickers */}
      {showEndDate && (
        <RNDateTimePicker
          minimumDate={new Date()}
          mode="date"
          value={formData.endDate}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) onHandleInputChange('endDate', selectedDate);
            setShowEndDate(false);
          }}
        />
      )}

      {showTimePicker && (
        <RNDateTimePicker
          mode="time"
          value={formData.reminder}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) onHandleInputChange('reminder', selectedDate);
            setShowTimePicker(false);
          }}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={SaveMedication}>
        <Text style={styles.buttonText}>Update Medication</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F9FAFB' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#555' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#111' },
  icon: { color: '#8b5cf6', marginRight: 10 },
  text: { fontSize: 16, color: '#111', marginLeft: 5 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    marginRight: 10,
    backgroundColor: 'white',
  },
  typeChipActive: { backgroundColor: '#8b5cf6' },
  typeText: { fontSize: 15, color: '#8b5cf6' },
  typeTextActive: { color: 'white', fontWeight: '600' },
  button: {
    padding: 15,
    backgroundColor: '#8b5cf6',
    borderRadius: 50,
    marginTop: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: { fontSize: 17, color: 'white', fontWeight: '600', textAlign: 'center' },
});
