import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface QueuedReport {
  id: string;
  hazardType: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  images: string[]; // local file URIs
  timestamp: number;
}

interface OfflineReportContextProps {
  isConnected: boolean;
  offlineQueue: QueuedReport[];
  addToQueue: (report: Omit<QueuedReport, 'id' | 'timestamp'>) => Promise<void>;
  syncQueue: () => Promise<void>;
  isSyncing: boolean;
  clearQueue: () => Promise<void>;
}

const OfflineReportContext = createContext<OfflineReportContextProps>({
  isConnected: true,
  offlineQueue: [],
  addToQueue: async () => {},
  syncQueue: async () => {},
  isSyncing: false,
  clearQueue: async () => {}
});

export const OfflineReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<QueuedReport[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 1. Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && !!state.isInternetReachable;
      setIsConnected(connected);
    });

    // Load initial queue
    loadQueue();

    return () => unsubscribe();
  }, []);

  // 2. Auto-sync when transitioning from offline to online
  useEffect(() => {
    if (isConnected && offlineQueue.length > 0 && !isSyncing) {
      console.log('Network connected! Triggering automatic sync of pending reports...');
      syncQueue();
    }
  }, [isConnected]);

  const loadQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_report_queue');
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load offline report queue:', err);
    }
  };

  const saveQueue = async (queue: QueuedReport[]) => {
    try {
      await AsyncStorage.setItem('offline_report_queue', JSON.stringify(queue));
      setOfflineQueue(queue);
    } catch (err) {
      console.warn('Failed to save offline report queue:', err);
    }
  };

  const addToQueue = async (reportData: Omit<QueuedReport, 'id' | 'timestamp'>) => {
    const newReport: QueuedReport = {
      ...reportData,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    const updated = [...offlineQueue, newReport];
    await saveQueue(updated);
  };

  const syncQueue = async () => {
    if (isSyncing || offlineQueue.length === 0) return;
    setIsSyncing(true);

    const remaining: QueuedReport[] = [...offlineQueue];
    const failed: QueuedReport[] = [];

    console.log(`Syncing ${remaining.length} offline reports to backend...`);

    for (const item of remaining) {
      try {
        const formData = new FormData();
        formData.append('hazardType', item.hazardType);
        formData.append('description', item.description);
        formData.append('severity', item.severity);
        formData.append('latitude', String(item.latitude));
        formData.append('longitude', String(item.longitude));
        formData.append('isOfflineSynced', 'true');

        if (item.images && item.images.length > 0) {
          item.images.forEach((imageUri: string, index: number) => {
            const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('images', {
              uri: imageUri,
              name: filename,
              type
            } as any);
          });
        }

        // Send to backend
        await api.post('/api/reports', formData, true);
        console.log(`Successfully synced offline report ID: ${item.id}`);
      } catch (err: any) {
        console.error(`Failed to sync offline report ID: ${item.id}. Error:`, err.message);
        failed.push(item);
      }
    }

    // Update queue with only failed items
    await saveQueue(failed);
    setIsSyncing(false);
  };

  const clearQueue = async () => {
    await saveQueue([]);
  };

  return (
    <OfflineReportContext.Provider
      value={{
        isConnected,
        offlineQueue,
        addToQueue,
        syncQueue,
        isSyncing,
        clearQueue
      }}
    >
      {children}
    </OfflineReportContext.Provider>
  );
};

export const useOfflineReport = () => useContext(OfflineReportContext);
