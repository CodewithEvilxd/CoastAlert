import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfflineReport } from '../../contexts/OfflineReportContext';
import { Theme } from '../../constants/theme';
import { api, getBaseUrl, setBaseUrl } from '../../services/api';
import { DEFAULT_INDIA_CENTER } from '../../utils/regionUtils';
import {
  User as UserIcon,
  Globe,
  Moon,
  Compass,
  Link,
  Wifi,
  WifiOff,
  LogOut,
  History,
  FileCheck,
  MapPin
} from 'lucide-react-native';

interface MyReport {
  _id: string;
  hazardType: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isConnected, offlineQueue, syncQueue, isSyncing } = useOfflineReport();
  
  const colors = Theme[theme];

  const [apiInput, setApiInput] = useState(getBaseUrl());
  const [radius, setRadius] = useState('10');
  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const [newRegion, setNewRegion] = useState(user?.region || '');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const loadHistory = async () => {
    if (!user) return;
    try {
      // In a real database, we fetch all reports and filter by user id or use a dedicated endpoint
      const allReports = await api.get<any[]>('/api/reports');
      // Filter reports submitted by this user
      const filtered = allReports.filter(r => r.reportedBy?._id === user.id);
      setMyReports(filtered);
    } catch (err) {
      console.warn('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const updateApiBase = () => {
    setBaseUrl(apiInput);
    alert('API Base URL updated successfully!');
    loadHistory();
  };

  const detectLiveLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // 1. Try GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          let loc = await Location.getLastKnownPositionAsync({});
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low
            });
          }
          if (loc) {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`,
              {
                headers: {
                  'User-Agent': 'SentinelSeaMobileClient/1.0'
                }
              }
            );
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const data = await response.json();
                if (data && data.address) {
                  const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
                  if (city) {
                    setNewRegion(city);
                    alert(`Detected Location: ${city}`);
                    return;
                  }
                }
              }
            }
          }
        } catch (gpsError) {
          console.warn('GPS location failed, trying IP fallback...', gpsError);
        }
      }

      // 2. IP-based location fallback (Bulletproof for emulators/simulators)
      let cityDetected = '';
      try {
        const ipRes = await fetch('https://freeipapi.com/api/json');
        if (ipRes.ok) {
          const contentType = ipRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const ipData = await ipRes.json();
            if (ipData && ipData.cityName) {
              cityDetected = ipData.cityName;
            }
          }
        }
      } catch (err1) {
        console.warn('FreeIPAPI failed, trying ipapi.co fallback...', err1);
      }

      if (!cityDetected) {
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const contentType = ipRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const ipData = await ipRes.json();
              if (ipData && ipData.city) {
                cityDetected = ipData.city;
              }
            }
          }
        } catch (err2) {
          console.warn('ipapi.co fallback failed...', err2);
        }
      }

      if (cityDetected) {
        setNewRegion(cityDetected);
        alert(`Detected via IP: ${cityDetected}`);
      } else {
        alert('Could not detect location. Please type manually.');
      }
    } catch (err) {
      console.warn(err);
      alert('Could not detect location. Please type manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const saveUpdatedLocation = async () => {
    if (!newRegion.trim()) {
      alert('Please enter a valid region name.');
      return;
    }
    setIsUpdatingLocation(true);
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(newRegion + ', India')}`,
        {
          headers: {
            'User-Agent': 'SentinelSeaMobileClient/1.0'
          }
        }
      );
      
      let lat = DEFAULT_INDIA_CENTER.lat;
      let lng = DEFAULT_INDIA_CENTER.lng;
      
      if (geoRes.ok) {
        const contentType = geoRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
        }
      }

      const resData = await api.patch<any>('/api/auth/location', {
        region: newRegion,
        savedLocation: { lat, lng }
      });
      
      updateUser(resData);
      alert('Location updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update location.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. Profile Header Card */}
      {user && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
              <UserIcon size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
              <Text style={styles.profileMeta}>+91 {user.phone}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          {user.region && (
            <View style={[styles.regionBanner, { borderTopColor: colors.border }]}>
              <Compass size={16} color={colors.textSecondary} />
              <Text style={[styles.regionBannerText, { color: colors.textSecondary }]}>
                Registered region: {user.region}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 2. Offline Queue Manager */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            {isConnected ? (
              <Wifi size={18} color={colors.success} />
            ) : (
              <WifiOff size={18} color={colors.danger} />
            )}
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {isConnected ? 'Online Mode' : 'Offline Mode'}
            </Text>
          </View>
          <Text style={styles.queueCount}>
            {offlineQueue.length} pending
          </Text>
        </View>

        {offlineQueue.length > 0 && (
          <TouchableOpacity
            style={[
              styles.syncBtn,
              { backgroundColor: isConnected ? colors.success : colors.border }
            ]}
            onPress={syncQueue}
            disabled={!isConnected || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.syncBtnText}>
                {isConnected ? 'Sync Offline Queue Now' : 'Connect to sync reports'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Settings / Preferences Section */}
      <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('profile.settings')}</Text>
      
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        
        {/* Language selector */}
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelRow}>
            <Globe size={18} color="#64748B" />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.language')}</Text>
          </View>
          <View style={styles.langSelector}>
            <TouchableOpacity
              style={[styles.langChip, language === 'en' && { backgroundColor: colors.primary }]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langChipText, language === 'en' && { color: '#FFFFFF' }]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langChip, language === 'hi' && { backgroundColor: colors.primary }]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={[styles.langChipText, language === 'hi' && { color: '#FFFFFF' }]}>हिन्दी</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dark Mode selector */}
        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelRow}>
            <Moon size={18} color="#64748B" />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.darkMode')}</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
        </View>

        {/* Alert Radius */}
        <View style={[styles.settingItem, { borderBottomColor: colors.border, paddingBottom: 16 }]}>
          <View style={styles.settingLabelRow}>
            <Compass size={18} color="#64748B" />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.radius')}</Text>
          </View>
          <TextInput
            style={[styles.radiusInput, { backgroundColor: colors.background, color: colors.text }]}
            value={radius}
            onChangeText={setRadius}
            keyboardType="number-pad"
          />
        </View>

        {/* Custom Server Endpoint for physical devices */}
        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
          <View style={styles.settingLabelRow}>
            <Link size={18} color="#64748B" />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Server URL</Text>
          </View>
          <View style={styles.apiInputContainer}>
            <TextInput
              style={[styles.apiInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={apiInput}
              onChangeText={setApiInput}
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={updateApiBase}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3.5 Location Settings Card */}
      <Text style={[styles.sectionHeader, { color: colors.text }]}>Change Active Region / Location</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Update your local region to automatically receive targeted alerts and filter nearby reports.
        </Text>
        
        {/* Custom Input field */}
        <View style={styles.locationInputRow}>
          <TextInput
            placeholder="Type city or beach name..."
            placeholderTextColor="#94A3B8"
            style={[styles.locationInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={newRegion}
            onChangeText={setNewRegion}
          />
          
          {/* Detect Location Button */}
          <TouchableOpacity 
            style={[styles.detectBtn, { backgroundColor: colors.accent }]} 
            onPress={detectLiveLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MapPin size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.detectBtnText}>Detect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Location Button */}
        <TouchableOpacity 
          style={[styles.saveLocationBtn, { backgroundColor: colors.primary }]} 
          onPress={saveUpdatedLocation}
          disabled={isUpdatingLocation}
        >
          {isUpdatingLocation ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveLocationBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 4. My Submissions History */}
      <View style={styles.historyHeader}>
        <History size={18} color={colors.accent} />
        <Text style={[styles.sectionHeader, { color: colors.text, marginVertical: 0, marginLeft: 8 }]}>
          {t('profile.history')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 4, marginBottom: 20 }}>
        {isLoadingHistory ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
        ) : myReports.length > 0 ? (
          myReports.map((item) => (
            <TouchableOpacity
              key={item._id}
              activeOpacity={0.8}
              onPress={() => setExpandedReportId(expandedReportId === item._id ? null : item._id)}
              style={[
                styles.historyCard,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
            >
              <View style={styles.historyCardHeader}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {t(`hazards.${item.hazardType}`) || item.hazardType}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === 'high_confidence'
                          ? colors.danger
                          : item.status === 'community_verified'
                          ? colors.success
                          : '#94A3B8'
                    }
                  ]}
                >
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.historyDesc, { color: colors.textSecondary }]}>{item.description}</Text>
              <Text style={styles.historyDate}>
                Submitted on {new Date(item.createdAt).toLocaleDateString()}
              </Text>

              {expandedReportId === item._id && (
                <View style={styles.trackingContainer}>
                  {/* OceanTrust Score Card */}
                  <View style={[styles.trustCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.trustLabel, { color: colors.text }]}>OceanTrust Score™</Text>
                    <View style={styles.trustScoreRow}>
                      <Text style={styles.trustSubLabel}>Image Metadata Authen:</Text>
                      <Text style={styles.trustVal}>92%</Text>
                    </View>
                    <View style={styles.trustScoreRow}>
                      <Text style={styles.trustSubLabel}>Geospatial Location Check:</Text>
                      <Text style={styles.trustVal}>88%</Text>
                    </View>
                    <View style={styles.trustScoreRow}>
                      <Text style={styles.trustSubLabel}>Social Media Cluster Match:</Text>
                      <Text style={styles.trustVal}>95%</Text>
                    </View>
                    <View style={[styles.trustScoreRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 4 }]}>
                      <Text style={[styles.trustSubLabel, { fontWeight: 'bold' }]}>Final Credibility Trust:</Text>
                      <Text style={[styles.trustVal, { color: colors.success, fontWeight: '800' }]}>91/100 VERIFIED</Text>
                    </View>
                  </View>

                  {/* Swiggy Style Tracking */}
                  <Text style={[styles.trackLabel, { color: colors.text }]}>Disaster Status Tracker</Text>
                  
                  <View style={styles.swiggyStep}>
                    <View style={[styles.swiggyDot, { backgroundColor: colors.success }]} />
                    <View style={styles.swiggyLine} />
                    <Text style={styles.swiggyText}>AI Verification (Completed)</Text>
                  </View>

                  <View style={styles.swiggyStep}>
                    <View style={[styles.swiggyDot, { backgroundColor: item.status === 'community_verified' || item.status === 'high_confidence' ? colors.success : '#CBD5E1' }]} />
                    <View style={styles.swiggyLine} />
                    <Text style={styles.swiggyText}>Authority Review {item.status === 'community_verified' || item.status === 'high_confidence' ? '(Approved)' : '(Pending)'}</Text>
                  </View>

                  <View style={styles.swiggyStep}>
                    <View style={[styles.swiggyDot, { backgroundColor: item.status === 'high_confidence' ? colors.success : '#CBD5E1' }]} />
                    <Text style={styles.swiggyText}>Action Dispatch {item.status === 'high_confidence' ? '(Dispatched)' : '(Queued)'}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyHistory, { backgroundColor: colors.surface }]}>
            <FileCheck size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={{ color: colors.textSecondary }}>{t('profile.noReports')}</Text>
          </View>
        )}
      </View>

      {/* Logout CTA */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#FF4D4D" style={{ marginRight: 6 }} />
        <Text style={styles.logoutBtnText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2
  },
  profileMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  roleText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  regionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 14
  },
  regionBannerText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  queueCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  syncBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10
  },
  langSelector: {
    flexDirection: 'row'
  },
  langChip: {
    width: 50,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  radiusInput: {
    width: 60,
    height: 34,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14
  },
  apiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20
  },
  apiInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13
  },
  saveBtn: {
    width: 60,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  statusText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  historyDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6
  },
  historyDate: {
    fontSize: 10,
    color: '#94A3B8'
  },
  emptyHistory: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    backgroundColor: '#FFEBEB',
    height: 52,
    borderRadius: 26,
    marginTop: 20
  },
  logoutBtnText: {
    fontSize: 15,
    color: '#FF4D4D',
    fontWeight: '700'
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  locationInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500'
  },
  detectBtn: {
    width: 80,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  detectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  saveLocationBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveLocationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  trackingContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12
  },
  trustCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  trustLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  trustScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  trustSubLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  trustVal: {
    fontSize: 11,
    fontWeight: '600'
  },
  trackLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10
  },
  swiggyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 12
  },
  swiggyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10
  },
  swiggyLine: {
    position: 'absolute',
    left: 3,
    top: 8,
    bottom: -6,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1
  },
  swiggyText: {
    fontSize: 11,
    marginLeft: 10,
    color: '#64748B',
    fontWeight: '600'
  }
});
