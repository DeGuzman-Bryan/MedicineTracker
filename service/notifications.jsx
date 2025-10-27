import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

// Configure notifications
PushNotification.configure({
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  },
  requestPermissions: Platform.OS === 'ios',
});

// Schedule a single notification
export const scheduleNotification = (id, title, message, date) => {
  PushNotification.localNotificationSchedule({
    id: `${id}`, // unique id
    title: title,
    message: message,
    date: date, // JS Date object
    allowWhileIdle: true,
  });
};

// Cancel all notifications
export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};
