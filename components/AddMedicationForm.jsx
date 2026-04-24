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
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../config/FirebaseConfig';
import { TypeList, WhenToTake } from '../Constant/Options';
import { FormatDate, getDatesRange } from '../service/ConvertDateTime';
import { requestPermissions, scheduleMedicationNotification } from '../service/notifications';

const { height } = Dimensions.get('window');

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
    reminder: '',
    reminderDateObj: null 
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

    if (!formData?.name || !formData?.reminder) {
      Alert.alert('Missing Info', 'Medicine Name and Reminder Time are required.');
      return;
    }

    const effectiveStart = formData.startDate || FormatDate(new Date());
    let datesArray = [];
    if (effectiveStart && formData.endDate) {
        datesArray = getDatesRange(effectiveStart, formData.endDate);
    } else {
        datesArray = [effectiveStart];
    }

    try {
      const docRef = doc(db, 'medication', docId);
      
      // 🌟 THE FIX: Grab absolutely every variation of the partner's email from the database
      const myEmail = user?.email;
      const partnerEmail = 
        user?.linkedPatientEmail || 
        user?.linkedCaregiverEmail || 
        user?.patientEmail || 
        user?.caregiverEmail || 
        user?.linkedEmail;

      const accessArray = [myEmail, partnerEmail].filter(Boolean);

      const dataToSave = {
        ...formData,
        userEmail: myEmail || 'guest',
        accessibleBy: accessArray, 
        docId,
        startDate: effectiveStart,
        dates: datesArray,
        type: formData.type || null,
        dose: formData.dose || '',
        when: formData.when || '',
      };

      delete dataToSave.reminderDateObj;

      if (isEditing) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, dataToSave);
      }

      const permissionGranted = await requestPermissions(); 
      
      if (permissionGranted) {
          const triggerDate = new Date();

          if (formData.reminderDateObj) {
              triggerDate.setHours(formData.reminderDateObj.getHours(), formData.reminderDateObj.getMinutes(), 0, 0);
          } else {
              const cleanTimeStr = formData.reminder.replace(/[\u202F\u00A0]/g, ' ').trim();
              const [time, modifier] = cleanTimeStr.split(' '); 
              let [hours, minutes] = time.split(':');

              hours = parseInt(hours, 10);
              minutes = parseInt(minutes, 10);

              if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

              triggerDate.setHours(hours, minutes, 0, 0);
          }

          if (triggerDate <= new Date()) {
              triggerDate.setDate(triggerDate.getDate() + 1);
          }

          await scheduleMedicationNotification(
              formData.name,
              `Dose: ${formData.dose || 'Take your medicine'}`,
              triggerDate 
          );
      }

      Alert.alert('Success', isEditing ? 'Updated!' : 'Saved!', [
        { text: 'OK', onPress: () => router.replace('(tabs)') }
      ]);
    } catch (e) { 
      console.error("Save Error:", e);
      Alert.alert('Error', 'Failed to save medication.'); 
    }
  };

  return (
    <View style={styles.rootContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.inputGroup}>
          <Ionicons name="medkit-outline" size={22} color="#8b5cf6" />
          <TextInput style={styles.textInput} placeholder="Medicine Name (Required)" value={formData.name || ''} onChangeText={(v) => onHandleInputChange('name', v)} />
        </View>

        <Text style={styles.label}>Type (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {TypeList && TypeList.map((item, index) => (
            <TouchableOpacity key={index.toString()} style={[styles.typeChip, item.name === (formData?.type?.name || formData?.type) && styles.typeChipActive]} onPress={() => onHandleInputChange('type', item)}>
              <Text style={[styles.typeText, item.name === (formData?.type?.name || formData?.type) && styles.typeTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.inputGroup, { marginTop: 15 }]}>
          <Ionicons name="eyedrop-outline" size={22} color="#8b5cf6" />
          <TextInput style={styles.textInput} placeholder="Dose (Optional, e.g. 2 tablets)" value={formData.dose || ''} onChangeText={(v) => onHandleInputChange('dose', v)} />
        </View>

        <Text style={styles.label}>When to Take (Optional)</Text>
        <View style={styles.inputGroup}>
          <AntDesign name="field-time" size={22} color="#8b5cf6" />
          <Picker selectedValue={formData?.when || ''} onValueChange={(v) => onHandleInputChange('when', v)} style={{ flex: 1 }}>
            <Picker.Item label="Not Specified" value="" />
            {WhenToTake && WhenToTake.map((item, index) => (
              <Picker.Item key={index.toString()} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Duration (Optional)</Text>
        <View style={styles.dateGroup}>
          <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowStartDate(true)}>
            <AntDesign name="calendar" size={22} color="#8b5cf6" />
            <Text style={{ marginLeft: 10, fontSize: 13 }}>{formData?.startDate ? formData.startDate : 'Start Date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndDate(true)}>
            <AntDesign name="calendar" size={22} color="#8b5cf6" />
            <Text style={{ marginLeft: 10, fontSize: 13 }}>{formData?.endDate ? formData.endDate : 'End Date'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Reminder Time (Required)</Text>
        <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
          <FontAwesome6 name="user-clock" size={22} color="#8b5cf6" />
          <Text style={{ marginLeft: 10 }}>{formData.reminder || 'Select Time'}</Text>
        </TouchableOpacity>

        {showStartDate && <RNDateTimePicker value={getSafeDate(formData.startDate)} mode="date" onChange={(e, d) => { setShowStartDate(false); if (d && e.type !== 'dismissed') onHandleInputChange('startDate', FormatDate(d)); }} />}
        {showEndDate && <RNDateTimePicker value={getSafeDate(formData.endDate)} mode="date" onChange={(e, d) => { setShowEndDate(false); if (d && e.type !== 'dismissed') onHandleInputChange('endDate', FormatDate(d)); }} />}
        {showTimePicker && <RNDateTimePicker value={formData.reminderDateObj || new Date()} mode="time" is24Hour={false} onChange={(e, d) => { setShowTimePicker(false); if (d && e.type !== 'dismissed') { const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); onHandleInputChange('reminder', timeStr); onHandleInputChange('reminderDateObj', d); } }} />}

        <TouchableOpacity style={styles.button} onPress={SaveMedication}>
          <Text style={styles.buttonText}>{params?.docId ? 'Update Medication' : 'Save Medication'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, width: '100%', minHeight: Math.round(height), backgroundColor: '#F9FAFB' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 250 }, 
  label: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#555' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', marginBottom: 10 },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  horizontalScroll: { marginBottom: 5 },
  typeChip: { padding: 10, paddingHorizontal: 15, borderRadius: 50, borderWidth: 1, borderColor: '#8b5cf6', marginRight: 10 },
  typeChipActive: { backgroundColor: '#8b5cf6' },
  typeText: { color: '#8b5cf6' },
  typeTextActive: { color: 'white' },
  dateGroup: { flexDirection: 'row', gap: 10 },
  button: { padding: 16, backgroundColor: '#8b5cf6', borderRadius: 50, marginTop: 25 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }
});