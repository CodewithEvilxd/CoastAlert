import React, { useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/theme';
import { Bell, Trash2, X, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function NotificationCenterModal() {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();
  const { theme } = useTheme();
  const colors = Theme[theme];

  // Mark all notifications as read when opening the modal
  useEffect(() => {
    markAllAsRead();
  }, []);

  const getFormatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Center</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Trash2 size={16} color={colors.danger} />
            <Text style={[styles.clearBtnText, { color: colors.danger }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.alertHeaderRow}>
                <View style={styles.alertTitleBadge}>
                  <AlertTriangle size={16} color={colors.accent} />
                  <Text style={[styles.alertTitle, { color: colors.text }]}>{item.title}</Text>
                </View>
                <Text style={styles.timeText}>{getFormatDate(item.receivedAt)}</Text>
              </View>
              <Text style={[styles.alertBody, { color: colors.textSecondary }]}>{item.body}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.bellOutline, { backgroundColor: colors.surface }]}>
            <Bell size={48} color="#94A3B8" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
          <Text style={styles.emptyDesc}>Nearby critical hazard alerts and official broadcasts will appear here.</Text>
        </View>
      )}

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  backBtn: {
    marginRight: 10,
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4
  },
  listPadding: {
    padding: 16
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  alertTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500'
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 18
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  bellOutline: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20
  }
});
