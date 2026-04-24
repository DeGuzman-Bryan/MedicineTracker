import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { db } from '../config/FirebaseConfig';
import { TypeList, WhenToTake } from '../Constant/Options';
import { FormatDate, getDatesRange } from '../service/ConvertDateTime';
import { requestPermissions, scheduleMedicationNotification } from '../service/notifications';

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
      const docRef = doc(db, 'Medication', docId);
      const dataToSave = {
        ...formData,
        userEmail: user?.email || 'guest',
        docId,
        startDate: effectiveStart,
        dates: datesArray,
        type: formData.type || null,
        dose: formData.dose || '',
        when: formData.when || '',
        action: formData.action || []
      };

      // OFFLINE-FIRST LOGIC: We don't 'await' the save so the app stays responsive
      if (isEditing) {
        updateDoc(docRef, dataToSave).catch(e => console.log("Offline update queued"));
      } else {
        setDoc(docRef, dataToSave).catch(e => console.log("Offline add queued"));
      }

      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        ToastAndroid.show("Saved offline! Syncing later.", ToastAndroid.SHORT);
      } else {
        ToastAndroid.show("Saved successfully!", ToastAndroid.SHORT);
      }

      // Handle Notifications
      const permissionGranted = await requestPermissions();
      if (permissionGranted) {
          const [time, modifier] = formData.reminder.split(' ');
          let [hours, minutes] = time.split(':');
          hours = parseInt(hours, 10);
          minutes = parseInt(minutes, 10);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          const triggerDate = new Date();
          triggerDate.setHours(hours, minutes, 0, 0);
          if (triggerDate <= new Date()) triggerDate.setDate(triggerDate.getDate() + 1);

          scheduleMedicationNotification(
              formData.name,
              `Dose: ${formData.dose || 'Take your medicine'}`,
              triggerDate
          );
      }

      router.replace('(tabs)');
    } catch (e) {
      console.error("Save Error:", e);
      Alert.alert('Error', 'Failed to save medication.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }}>
      {/* 1. Medicine Name Input */}
      <View style={styles.inputGroup}>
        <Ionicons name="medkit-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Medicine Name (Required)"
          value={formData.name || ''}
          onChangeText={(v) => onHandleInputChange('name', v)}
        />
      </View>

      {/* 2. Medicine Type List */}
      <Text style={styles.label}>Type (Optional)</Text>
      <FlatList
        data={TypeList}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.typeChip, (item.name === (formData?.type?.name || formData?.type)) && styles.typeChipActive]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text style={[styles.typeText, (item.name === (formData?.type?.name || formData?.type)) && styles.typeTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 3. Dosage Input */}
      <View style={[styles.inputGroup, { marginTop: 15 }]}>
        <Ionicons name="eyedrop-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Dose (Optional)"
          value={formData.dose || ''}
          onChangeText={(v) => onHandleInputChange('dose', v)}
        />
      </View>

      {/* 4. When to Take Picker */}
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

      {/* 5. Duration (Dates) */}
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

      {/* 6. Reminder Time */}
      <Text style={styles.label}>Reminder Time (Required)</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
        <FontAwesome6 name="user-clock" size={22} color="#8b5cf6" />
        <Text style={{ marginLeft: 10 }}>{formData.reminder || 'Select Time'}</Text>
      </TouchableOpacity>

      {/* Pickers (Hidden until clicked) */}
      {showStartDate && <RNDateTimePicker value={getSafeDate(formData.startDate)} mode="date" onChange={(e, d) => { setShowStartDate(false); if (d && e.type !== 'dismissed') onHandleInputChange('startDate', FormatDate(d)); }} />}
      {showEndDate && <RNDateTimePicker value={getSafeDate(formData.endDate)} mode="date" onChange={(e, d) => { setShowEndDate(false); if (d && e.type !== 'dismissed') onHandleInputChange('endDate', FormatDate(d)); }} />}
      {showTimePicker && <RNDateTimePicker value={new Date()} mode="time" is24Hour={false} onChange={(e, d) => { setShowTimePicker(false); if (d) onHandleInputChange('reminder', d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })); }} />}

      {/* 7. Save Button */}
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