import React from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Theme } from '../../constants/theme';
import { Home, Map, MessageSquare, User, Shield, Bell } from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  
  const colors = Theme[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowOpacity: 0.1,
          elevation: 2
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('appName'),
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/modal')}
              style={{ marginRight: 16, position: 'relative' }}
            >
              <Bell size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.notificationBadge,
                    { backgroundColor: colors.danger }
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Live Map',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social Signals',
          tabBarLabel: 'Social',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin.title'),
          tabBarLabel: 'Admin',
          href: user?.role === 'analyst' ? '/(tabs)/admin' : null, // Hide tab if not analyst
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
    textAlign: 'center'
  }
});
