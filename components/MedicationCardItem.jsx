import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../Constant/Colors';

export default function MedicationCardItem({ medicine, selectedDate = '' }) {
  const [status, setStatus] = useState();
  const router = useRouter();

  useEffect(() => {
    CheckStatus();
  }, [medicine, selectedDate]);

  const CheckStatus = () => {
    const data = medicine?.action?.find((item) => item.date === selectedDate);
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

  const handleEdit = () => {
    router.push({
      pathname: '/add-new-medication/edit-medicine',
      params: { medicine: JSON.stringify(medicine) }, // ✅ pass the data as string
    });
  };

  return (
    <View style={styles.card}>
      {/* Left image */}
      <Image source={{ uri: medicine?.type?.icon }} style={styles.icon} />

      {/* Middle text info */}
      <View style={styles.details}>
        <Text style={styles.name}>{medicine?.name}</Text>
        <Text style={styles.when}>{medicine?.when}</Text>
        <Text style={styles.dose}>
          {medicine?.dose} {medicine?.type?.name}
        </Text>
      </View>

      {/* Right side: status on top, time below */}
      <View style={styles.rightSection}>
        {/* Edit Button */}
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <EvilIcons name="pencil" size={26} color={Colors.primary || '#8b5cf6'} />
        </TouchableOpacity>

        {status?.date && (
          <View style={styles.statusIcon}>
            {status.status === 'Taken' ? (
              <FontAwesome name="check-circle" size={22} color={Colors.success || 'green'} />
            ) : status.status === 'Missed' ? (
              <FontAwesome name="times-circle" size={22} color={Colors.error || 'red'} />
            ) : null}
          </View>
        )}

        {reminderTime ? (
          <View style={styles.timeContainer}>
            <EvilIcons name="clock" size={18} color={Colors.d} />
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
    backgroundColor: Colors.white || '#fcfcfcff',
    borderRadius: 20,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  icon: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: Colors.light || '#fcfcfcff',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark || '#222',
  },
  when: {
    fontSize: 15,
    color: '#555',
    marginTop: 2,
  },
  dose: {
    fontSize: 14,
    color: '#777',
    marginTop: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 65,
    paddingVertical: 2,
  },
  statusIcon: {
    marginBottom: 6,
  },
  editButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#f4f3ff',
    marginBottom: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
});
