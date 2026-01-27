import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../config/FirebaseConfig';
import { TypeList, WhenToTake } from '../Constant/Options';
import { FormatDate, FormatDateForText, getDatesRange } from '../service/ConvertDateTime';

export default function AddMedicationForm() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- FIXED: PREVENTS CRASH & PARSE ERROR ---
  useEffect(() => {
    if (params?.docId && formData?.docId !== params.docId) {
      let parsedType = params.type;
      // Added safety check to prevent "JSON Parse error: Unexpected character: o"
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

  const SaveMedication = async () => {
    const isEditing = !!params?.docId;
    const docId = isEditing ? params.docId : Date.now().toString();
    const userString = await AsyncStorage.getItem('userDetails');
    const user = JSON.parse(userString);

    if (!formData?.name || !formData?.startDate || !formData?.endDate) {
      Alert.alert('Missing Fields', 'Please fill in the Name and Dates.');
      return;
    }

    const dates = getDatesRange(formData.startDate, formData.endDate).map((d) =>
      typeof d === 'string' ? d : FormatDate(d)
    );

    try {
      const docRef = doc(db, 'medication', docId);
      const dataToSave = {
        ...formData,
        userEmail: user?.email || 'guest',
        docId,
        startDate: typeof formData.startDate === 'string' ? formData.startDate : FormatDate(formData.startDate),
        endDate: typeof formData.endDate === 'string' ? formData.endDate : FormatDate(formData.endDate),
        dates: dates,
      };

      if (isEditing) {
        await updateDoc(docRef, dataToSave);
      } else {
        await setDoc(docRef, dataToSave);
      }

      Alert.alert('Success', isEditing ? 'Updated!' : 'Saved!', [
        { text: 'OK', onPress: () => router.replace('(tabs)') }
      ]);
    } catch (e) { Alert.alert('Error', 'Failed to save.'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Restored exact layout from your screenshot */}
      <View style={styles.inputGroup}>
        <Ionicons name="medkit-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Medicine Name"
          value={formData.name || ''}
          onChangeText={(v) => onHandleInputChange('name', v)}
        />
      </View>

      <Text style={styles.label}>Type</Text>
      <FlatList
        data={TypeList}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.typeChip, item.name === formData?.type?.name && styles.typeChipActive]}
            onPress={() => onHandleInputChange('type', item)}
          >
            <Text style={[styles.typeText, item.name === formData?.type?.name && styles.typeTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.inputGroup}>
        <Ionicons name="eyedrop-outline" size={22} color="#8b5cf6" />
        <TextInput
          style={styles.textInput}
          placeholder="Dose (e.g. 2 tablets, 5ml)"
          value={formData.dose || ''}
          onChangeText={(v) => onHandleInputChange('dose', v)}
        />
      </View>

      <Text style={styles.label}>When to Take</Text>
      <View style={styles.inputGroup}>
        <AntDesign name="field-time" size={22} color="#8b5cf6" />
        <Picker
          selectedValue={formData?.when || ''}
          onValueChange={(v) => onHandleInputChange('when', v)}
          style={{ flex: 1 }}
        >
          {WhenToTake.map((item, index) => <Picker.Item key={index} label={item} value={item} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Duration</Text>
      <View style={styles.dateGroup}>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowStartDate(true)}>
          <AntDesign name="calendar" size={22} color="#8b5cf6" />
          <Text style={{marginLeft: 10}}>{formData?.startDate ? FormatDateForText(formData?.startDate) : 'Start Date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowEndDate(true)}>
          <AntDesign name="calendar" size={22} color="#8b5cf6" />
          <Text style={{marginLeft: 10}}>{formData?.endDate ? FormatDateForText(formData?.endDate) : 'End Date'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Reminder Time</Text>
      <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
        <FontAwesome6 name="user-clock" size={22} color="#8b5cf6" />
        <Text style={{marginLeft: 10}}>{formData.reminder || 'Select Time'}</Text>
      </TouchableOpacity>

      {showStartDate && <RNDateTimePicker value={new Date()} mode="date" onChange={(e, d) => { setShowStartDate(false); if(d) onHandleInputChange('startDate', FormatDate(d)); }} />}
      {showEndDate && <RNDateTimePicker value={new Date()} mode="date" onChange={(e, d) => { setShowEndDate(false); if(d) onHandleInputChange('endDate', FormatDate(d)); }} />}
      {showTimePicker && <RNDateTimePicker value={new Date()} mode="time" is24Hour={false} onChange={(e, d) => { setShowTimePicker(false); if(d) onHandleInputChange('reminder', d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})); }} />}

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