import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
  } catch (err) {
    console.warn('Failed to load expo-notifications:', err);
  }
}

export interface AlertNotification {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
}

interface NotificationContextProps {
  notifications: AlertNotification[];
  unreadCount: number;
  triggerLocalNotification: (title: string, body: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  triggerLocalNotification: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {}
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    // Load local notification history
    loadNotifications();
  }, []);

  useEffect(() => {
    if (isExpoGo || Platform.OS === 'web' || !Notifications || !user) {
      return;
    }

    // 1. Request OS Push permissions and register this device token if authenticated.
    registerForPushNotificationsAsync();
    
    // 2. Setup listener for foreground notifications
    const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body } = notification.request.content;
      addNotification(title || 'Hazard Alert', body || '');
    });

    return () => subscription.remove();
  }, [user]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web' || isExpoGo || !Notifications || !user) return;
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notifications!');
        return;
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B'
        });
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const expoToken = tokenResponse?.data || tokenResponse?.value || tokenResponse;
      if (!expoToken || typeof expoToken !== 'string') {
        console.warn('Failed to retrieve Expo push token.');
        return;
      }

      const storedToken = await AsyncStorage.getItem('expo_push_token');
      if (storedToken === expoToken) {
        return;
      }

      await AsyncStorage.setItem('expo_push_token', expoToken);
      await api.post('/api/notifications/register', { token: expoToken });
    } catch (err) {
      console.warn('Error setting up push notifications:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('alert_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load notifications history:', err);
    }
  };

  const saveNotifications = async (list: AlertNotification[]) => {
    try {
      await AsyncStorage.setItem('alert_notifications', JSON.stringify(list));
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to save notifications history:', err);
    }
  };

  const addNotification = async (title: string, body: string) => {
    const newAlert: AlertNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      receivedAt: new Date().toISOString(),
      isRead: false
    };
    
    const updated = [newAlert, ...notifications];
    await saveNotifications(updated);
  };

  const triggerLocalNotification = async (title: string, body: string) => {
    // Save to history list in all cases
    await addNotification(title, body);

    if (Platform.OS === 'web' || isExpoGo || !Notifications) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX
        },
        trigger: null // Deliver immediately
      });
    } catch (err) {
      console.warn('Failed to schedule local notification:', err);
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    await saveNotifications(updated);
  };

  const clearAll = async () => {
    await saveNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        triggerLocalNotification,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
