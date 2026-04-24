import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function MedicationCardItem({ medicine, selectedDate = '' }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    CheckStatus();
  }, [medicine, selectedDate]);

  const CheckStatus = () => {
    const data = Array.isArray(medicine?.action) 
      ? medicine.action.find((item) => item.date === selectedDate) 
      : null;
    setStatus(data);
  };

  let reminderTime = '';
  if (medicine?.reminder) {
    if (medicine.reminder.seconds) {
      const date = new Date(medicine.reminder.seconds * 1000);
      reminderTime = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      reminderTime = medicine.reminder.toString();
    }
  }

  const defaultIcon = 'https://cdn-icons-png.flaticon.com/512/822/822143.png'; 
  const iconUri = medicine?.type?.icon || medicine?.type || defaultIcon;

  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: typeof iconUri === 'string' ? iconUri : defaultIcon }} 
        style={styles.icon} 
      />

      <View style={styles.details}>
          <Text style={styles.name}>
            {typeof medicine?.name === 'object' ? 'Unnamed' : String(medicine?.name || '')}
          </Text>

          {medicine?.when ? (
            <Text style={styles.when}>
              {typeof medicine.when === 'object' && medicine.when?.seconds
                ? new Date(medicine.when.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : String(medicine.when)}
            </Text>
          ) : null}

          <Text style={styles.dose}>
            {String(medicine?.dose || '')} {' '}
            {medicine?.type?.name 
              ? String(medicine.type.name) 
              : (typeof medicine?.type === 'string' ? medicine.type : '')}
          </Text>
        </View>

      <View style={styles.rightSection}>
        <View style={styles.statusIcon}>
          {status?.status === 'Taken' ? (
            <FontAwesome name="check-circle" size={24} color={'#4caf50'} />
          ) : status?.status === 'Missed' ? (
            <FontAwesome name="times-circle" size={24} color={'#f44336'} />
          ) : null}
        </View>

        {reminderTime ? (
          <View style={styles.timeContainer}>
            <EvilIcons name="clock" size={18} color={'#333'} />
            <Text style={styles.timeText}>{reminderTime}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { width: 55, height: 55, borderRadius: 12, marginRight: 15 },
  details: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  when: { fontSize: 14, color: '#666', marginTop: 2 },
  dose: { fontSize: 13, color: '#888', marginTop: 2 },
  rightSection: { alignItems: 'flex-end', justifyContent: 'center' },
  statusIcon: { marginBottom: 8 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 5, borderRadius: 10 },
  timeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 3 },
});