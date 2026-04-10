import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../config/FirebaseConfig';
import { TypeList, WhenToTake } from '../Constant/Options';
import { FormatDate, getDatesRange } from '../service/ConvertDateTime';
import { scheduleMedicationNotification, requestPermissions } from '../service/notifications';

export default function AddMedicationForm() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    type: null,
    dose: '',
    when: '',
    startDate: null,
    endDate: null,
    reminder: ''
  });

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (params?.docId) {
      let parsedType = params.type;
      if (typeof params.type === 'string' && params.type.startsWith('{')) {
        try { parsedType = JSON.parse(params.type); } catch (e) { console.log(e); }
      }
      setFormData({
        ...params,
        type: parsedType,
        reminder: params.reminder || ''
      });
    }
  }, [params.docId]);

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const m = moment(dateStr); 
    return m.isValid() ? m.toDate() : new Date();
  };

  const SaveMedication = async () => {
    const isEditing = !!params?.docId;
    const docId = isEditing ? params.docId : Date.now().toString();
    const userString = await AsyncStorage.getItem('userDetails');
    const user = JSON.parse(userString);

    // Only Name and Reminder are strictly required
    if (!formData?.name || !formData?.reminder) {
      Alert.alert('Missing Info', 'Medicine Name and Reminder Time are required.');
      return;
    }

    // Logic for Dates array: Fallback to today ONLY for the database record if no start date is picked
    const effectiveStart = formData.startDate || FormatDate(new Date());
    let datesArray = [];

    if (effectiveStart && formData.endDate) {
        datesArray = getDatesRange(effectiveStart, formData.endDate);
    } else {
        datesArray = [effectiveStart];
    }

    try {
      const docRef = doc(db, 'medication', docId);
      const dataToSave = {
        ...formData,
        userEmail: user?.email || 'guest',
        docId,
        startDate: effectiveStart,
        dates: datesArray,
        // Ensure optional fields are at least empty strings/nulls if not touched
        type: formData.type || null,
        dose: formData.dose || '',
        when: formData.when || '',
      };

      if (isEditing) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, dataToSave);
      }

      const hasPermission = await requestPermissions();
        if (hasPermission) {
            // formData.reminder is expected to be a Date object or valid ISO string
            await scheduleMedicationNotification(
                formData.name,
                `Dose: ${formData.dose || 'Not specified'}`,
                formData.reminder 
            );
        }

      Alert.alert('Success', isEditing ? 'Updated!' : 'Saved!', [
        { text: 'OK', onPress: () => router.replace('(tabs)') }
      ]);
    } catch (e) { 
      console.error(e);
      Alert.alert('Error', 'Failed to save medication.'); 
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Medicine Name (REQUIRED) */}
      <View style={styles.inputGroup}>
        <Ionicons name="medkit-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Medicine Name (Required)"
          value={formData.name || ''}
          onChangeText={(v) => onHandleInputChange('name', v)}
        />
      </View>

      {/* Type Selection (OPTIONAL) */}
      <Text style={styles.label}>Type (Optional)</Text>
      <FlatList
        data={TypeList}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.typeChip, 
              item.name === (formData?.type?.name || formData?.type) && styles.typeChipActive
            ]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text style={[
              styles.typeText, 
              item.name === (formData?.type?.name || formData?.type) && styles.typeTextActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Dose Input (OPTIONAL) */}
      <View style={[styles.inputGroup, { marginTop: 15 }]}>
        <Ionicons name="eyedrop-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Dose (Optional, e.g. 2 tablets)"
          value={formData.dose || ''}
          onChangeText={(v) => onHandleInputChange('dose', v)}
        />
      </View>

      {/* When to Take (OPTIONAL) */}
      <Text style={styles.label}>When to Take (Optional)</Text>
      <View style={styles.inputGroup}>
        <AntDesign name="field-time" size={22} color="#8b5cf6" />
        <Picker
          selectedValue={formData?.when || ''}
          onValueChange={(v) => onHandleInputChange('when', v)}
          style={{ flex: 1 }}
        >
          <Picker.Item label="Not Specified" value="" />
          {WhenToTake.map((item, index) => (
            <Picker.Item key={index} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* Duration (OPTIONAL) */}
      <Text style={styles.label}>Duration (Optional)</Text>
      <View style={styles.dateGroup}>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowStartDate(true)}>
          <AntDesign name="calendar" size={22} color="#8b5cf6" />
          <Text style={{ marginLeft: 10, fontSize: 13 }}>
            {formData?.startDate ? formData.startDate : 'Start Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndDate(true)}>
          <AntDesign name="calendar" size={22} color="#8b5cf6" />
          <Text style={{ marginLeft: 10, fontSize: 13 }}>
            {formData?.endDate ? formData.endDate : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Time (REQUIRED) */}
      <Text style={styles.label}>Reminder Time (Required)</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
        <FontAwesome6 name="user-clock" size={22} color="#8b5cf6" />
        <Text style={{ marginLeft: 10 }}>{formData.reminder || 'Select Time'}</Text>
      </TouchableOpacity>

      {/* Pickers */}
      {showStartDate && (
        <RNDateTimePicker 
          value={getSafeDate(formData.startDate)} 
          mode="date" 
          onChange={(e, d) => { 
            setShowStartDate(false); 
            if (d && e.type !== 'dismissed') onHandleInputChange('startDate', FormatDate(d)); 
          }} 
        />
      )}

      {showEndDate && (
        <RNDateTimePicker 
          value={getSafeDate(formData.endDate)} 
          mode="date" 
          onChange={(e, d) => { 
            setShowEndDate(false); 
            if (d && e.type !== 'dismissed') onHandleInputChange('endDate', FormatDate(d)); 
          }} 
        />
      )}

      {showTimePicker && (
        <RNDateTimePicker 
          value={new Date()} 
          mode="time" 
          is24Hour={false} 
          onChange={(e, d) => { 
            setShowTimePicker(false); 
            if (d) {
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                onHandleInputChange('reminder', timeStr);
            }
          }} 
        />
      )}

      <TouchableOpacity style={styles.button} onPress={SaveMedication}>
        <Text style={styles.buttonText}>{params?.docId ? 'Update Medication' : 'Save Medication'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F9FAFB' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#555' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', marginBottom: 10 },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  typeChip: { padding: 10, paddingHorizontal: 15, borderRadius: 50, borderWidth: 1, borderColor: '#8b5cf6', marginRight: 10 },
  typeChipActive: { backgroundColor: '#8b5cf6' },
  typeText: { color: '#8b5cf6' },
  typeTextActive: { color: 'white' },
  dateGroup: { flexDirection: 'row', gap: 10 },
  button: { padding: 16, backgroundColor: '#8b5cf6', borderRadius: 50, marginTop: 25 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }
});