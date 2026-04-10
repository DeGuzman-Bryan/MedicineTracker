// service/notifications.jsx
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

/**
 * Schedules a notification for a specific time of day.
 * @param {string} title - Medicine Name
 * @param {string} body - Dosage/Instructions
 * @param {Date} date - The specific time object from your picker
 */
export const scheduleMedicationNotification = async (title, body, date) => {
  const triggerTime = new Date(date);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for your ${title}! 💊`,
      body: body || "Don't forget to take your medication.",
      data: { screen: 'action-modal' }, // Deep link data if needed
      sound: 'default',
    },
    trigger: {
      hour: triggerTime.getHours(),
      minute: triggerTime.getMinutes(),
      repeats: true, // This makes it daily
    },
  });

  return identifier;
};