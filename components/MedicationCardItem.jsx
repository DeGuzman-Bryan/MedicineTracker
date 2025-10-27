import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Colors from '../Constant/Colors';

export default function MedicationCardItem({ medicine, selectedDate = '' }) {
  const [status, setStatus] = useState();

  useEffect(() => {
    CheckStatus();
  }, [medicine, selectedDate]);

  const CheckStatus = () => {
    const data = medicine?.action?.find((item) => item.date === selectedDate);
    console.log('--', data);
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

  return (
    <View style={styles.subContainer}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: medicine?.type?.icon }}
            style={styles.icon}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.name}>{medicine?.name}</Text>
          <Text style={styles.when}>{medicine?.when}</Text>
          <Text style={styles.dose}>
            {medicine?.dose} {medicine?.type?.name}
          </Text>
        </View>

        {/* 🕒 Time container on the right */}
        {reminderTime ? (
          <View style={styles.timeContainer}>
            <EvilIcons name="clock" size={20} color="black" />
            <Text style={styles.timeText}>{reminderTime}</Text>
          </View>
        ) : null}
      </View>

      {/* ✅ or ❌ Status Icon */}
      {status?.date && (
        <View style={styles.statusIcon}>
          {status.status === 'Taken' ? (
            <FontAwesome name="check-circle" size={24} color="green" />
          ) : status.status === 'Missed' ? (
            <FontAwesome name="times-circle" size={24} color="red" />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  subContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.l,
    marginTop: 10,
    borderRadius: 15,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
  },
  imageContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginRight: 15,
  },
  icon: {
    width: 75,
    height: 75,
    borderRadius: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  when: {
    fontSize: 16,
    color: '#333',
  },
  dose: {
    fontSize: 15,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  statusIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
});
