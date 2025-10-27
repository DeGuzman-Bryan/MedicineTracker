import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../config/FirebaseConfig';
import Colors from '../Constant/Colors';
import { TypeList, WhenToTake } from '../Constant/Options';
import { FormatDate, FormatDateForText, getDatesRange } from '../service/ConvertDateTime';

const getLocalStorage = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.log('Error reading local storage', e);
    return null;
  }
};

export default function AddMedicationForm() {
  const [formData, setFormData] = useState({});
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const SaveMedication = async () => {
    const docId = Date.now().toString();
    const user = await getLocalStorage('userDetails');

    if (
      !formData?.name ||
      !formData?.type ||
      !formData?.dose ||
      !formData?.startDate ||
      !formData?.endDate ||
      !formData?.when ||
      !formData?.reminder
    ) {
      Alert.alert('Missing Fields', 'Please fill in all fields before saving.', [{ text: 'OK' }]);
      return;
    }

    // ✅ Ensure all dates are formatted strings
    const dates = getDatesRange(formData?.startDate, formData.endDate).map((d) =>
      typeof d === 'string' ? d : FormatDate(d)
    );

    try {
      await setDoc(doc(db, 'medication', docId), {
        ...formData,
        userEmail: user?.email || 'guest',
        docId,
        startDate: FormatDate(formData.startDate),
        endDate: FormatDate(formData.endDate),
        dates: dates, // ✅ formatted date strings for easy querying
      });

      Alert.alert('Success', 'Medication added successfully!', [{ text: 'OK' }]);
      setFormData({});
    } catch (e) {
      console.log('Firestore error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    }
  };

  return (
    <ScrollView style={{ padding: 25 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Add New Medication</Text>

      {/* Medicine Name */}
      <View style={styles.inputGroup}>
        <Ionicons style={styles.icon} name="medkit-outline" size={24} color="black" />
        <TextInput
          style={styles.textInput}
          placeholder=" Medicine Name"
          value={formData.name || ''}
          onChangeText={(value) => onHandleInputChange('name', value)}
        />
      </View>

      {/* Medicine Type */}
      <FlatList
        data={TypeList}
        horizontal
        style={{ marginTop: 5 }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.inputGroup,
              { marginRight: 10 },
              { backgroundColor: item.name === formData?.type?.name ? Colors.PRIMARY : 'white' },
            ]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text
              style={[
                styles.typeText,
                { color: item.name === formData?.type?.name ? 'white' : 'black' },
              ]}
            >
              {item?.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

      {/* Dose */}
      <View style={styles.inputGroup}>
        <Ionicons style={styles.icon} name="eyedrop-outline" size={24} color="black" />
        <TextInput
          style={styles.textInput}
          placeholder=" Dose Ex. 2, 5ml"
          value={formData.dose || ''}
          onChangeText={(value) => onHandleInputChange('dose', value)}
        />
      </View>

      {/* When to Take */}
      <View style={styles.inputGroup}>
        <AntDesign style={styles.icon} name="field-time" size={24} color="black" />
        <Picker
          selectedValue={formData?.when || ''}
          onValueChange={(itemValue) => onHandleInputChange('when', itemValue)}
          style={{ width: '90%' }}
        >
          {WhenToTake.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Start & End Dates */}
      <View style={styles.dateGroup}>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowStartDate(true)}>
          <AntDesign style={styles.icon} name="calendar" size={24} color="black" />
          <Text style={styles.text}>
            {formData?.startDate ? FormatDateForText(formData?.startDate) : 'Start Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndDate(true)}>
          <AntDesign style={styles.icon} name="calendar" size={24} color="black" />
          <Text style={styles.text}>
            {formData?.endDate ? FormatDateForText(formData?.endDate) : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Time */}
      <View style={styles.dateGroup}>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
          <FontAwesome6 style={styles.icon} name="user-clock" size={24} color="black" />
          <Text style={styles.text}>
            {formData?.reminder
              ? new Date(formData.reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Select Reminder Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTime Pickers */}
      {showStartDate && (
        <RNDateTimePicker
          minimumDate={new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) onHandleInputChange('startDate', FormatDate(selectedDate));
            setShowStartDate(false);
          }}
          value={formData?.startDate ? new Date(formData.startDate) : new Date()}
        />
      )}

      {showEndDate && (
        <RNDateTimePicker
          minimumDate={new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) onHandleInputChange('endDate', FormatDate(selectedDate));
            setShowEndDate(false);
          }}
          value={formData?.endDate ? new Date(formData.endDate) : new Date()}
        />
      )}

      {showTimePicker && (
        <RNDateTimePicker
          mode="time"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) onHandleInputChange('reminder', selectedDate);
            setShowTimePicker(false);
          }}
          value={formData?.reminder ? new Date(formData.reminder) : new Date()}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={SaveMedication}>
        <Text style={styles.buttonText}>Add new Medication</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 25, fontWeight: 'bold' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
    backgroundColor: 'white',
  },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  icon: { color: Colors.PRIMARY, borderRightWidth: 1, paddingRight: 12, borderColor: '#E5E7EB' },
  typeText: { fontSize: 16 },
  text: { fontSize: 16, padding: 10, flex: 1, marginLeft: 10 },
  dateGroup: { flexDirection: 'row', gap: 10 },
  button: { padding: 15, backgroundColor: Colors.PRIMARY, borderRadius: 15, width: '100%', marginTop: 25 },
  buttonText: { fontSize: 17, color: 'white', textAlign: 'center' },
});
