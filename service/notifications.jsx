import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications behave when the app is OPEN
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
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // --- CRITICAL FIX: Explicitly create the channel for Android Dev Builds ---
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
    });
  }

  return finalStatus === "granted";
};

/**
 * Schedules a daily notification for real medications
 */
export const scheduleMedicationNotification = async (title, body, date) => {
  const triggerTime = new Date(date);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 Time for ${title}`,
      body: `${body}. Stay healthy!`,
      sound: true,
    },
    trigger: {
      hour: triggerTime.getHours(),
      minute: triggerTime.getMinutes(),
      repeats: true,
      channelId: 'default', // Link to the channel we created above
    },
  });

  return identifier;
};