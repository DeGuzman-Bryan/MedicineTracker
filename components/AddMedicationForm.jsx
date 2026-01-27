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
        dates: dates,
      });

      Alert.alert('Success', 'Medication added successfully!', [{ text: 'OK' }]);
      setFormData({});
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
      <FlatList
        data={TypeList}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 5 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.typeChip,
              item.name === formData?.type?.name && styles.typeChipActive,
            ]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text
              style={[
                styles.typeText,
                item.name === formData?.type?.name && styles.typeTextActive,
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

      {/* Start & End Dates */}
      <Text style={styles.label}>Duration</Text>
      <View style={styles.dateGroup}>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowStartDate(true)}>
          <AntDesign style={styles.icon} name="calendar" size={22} />
          <Text style={styles.text}>
            {formData?.startDate ? FormatDateForText(formData?.startDate) : 'Start Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndDate(true)}>
          <AntDesign style={styles.icon} name="calendar" size={22} />
          <Text style={styles.text}>
            {formData?.endDate ? FormatDateForText(formData?.endDate) : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Time */}
      <Text style={styles.label}>Reminder Time</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
        <FontAwesome6 style={styles.icon} name="user-clock" size={22} />
        <Text style={styles.text}>
          {formData?.reminder
            ? new Date(formData.reminder).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Select Reminder Time'}
        </Text>
      </TouchableOpacity>

      {/* DateTime Pickers */}
      {showStartDate && (
        <RNDateTimePicker
          minimumDate={new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate)
              onHandleInputChange('startDate', FormatDate(selectedDate));
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
            if (event.type === 'set' && selectedDate)
              onHandleInputChange('endDate', FormatDate(selectedDate));
            setShowEndDate(false);
          }}
          value={formData?.endDate ? new Date(formData.endDate) : new Date()}
        />
      )}

      {showTimePicker && (
        <RNDateTimePicker
          mode="time"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate)
              onHandleInputChange('reminder', selectedDate);
            setShowTimePicker(false);
          }}
          value={formData?.reminder ? new Date(formData.reminder) : new Date()}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={SaveMedication}>
        <Text style={styles.buttonText}>Save Medication</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#555',
  },
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
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#111',
  },
  icon: {
    color: '#8b5cf6',
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    color: '#111',
    marginLeft: 5,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    marginRight: 10,
    backgroundColor: 'white',
  },
  typeChipActive: {
    backgroundColor: '#8b5cf6',
  },
  typeText: {
    fontSize: 15,
    color: '#8b5cf6',
  },
  typeTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  dateGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
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
  buttonText: {
    fontSize: 17,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});
