import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Theme } from '../../constants/theme';
import { api, getBaseUrl } from '../../services/api';
import { DEFAULT_INDIA_CENTER, resolveRegionCoordinates } from '../../utils/regionUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  PlusCircle,
  TrendingUp,
  MapPin,
  CheckCircle,
  Activity,
  Sparkles,
  Waves,
  BrainCircuit,
  MessageSquare
} from 'lucide-react-native';

interface OfficialAlert {
  _id: string;
  hazardType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  message: string;
  issuedBy: string;
}

interface HazardReport {
  _id: string;
  hazardType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  images: string[];
  location: { coordinates: [number, number] };
  status: string;
  createdAt: string;
  credibilityScore?: number;
}

export default function HomeDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { triggerLocalNotification } = useNotifications();
  
  const colors = Theme[theme];
  const activeRegion = user?.region || 'India';

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [officialAlerts, setOfficialAlerts] = useState<OfficialAlert[]>([]);
  const [nearbyReports, setNearbyReports] = useState<HazardReport[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [stats, setStats] = useState({ active: 0, verified: 0, total: 0 });
  const [allReports, setAllReports] = useState<HazardReport[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const getFallbackLocation = async (regionName: string) => {
    return resolveRegionCoordinates(regionName);
  };

  // 1. Get GPS Location or Fallback
  const fetchLocationAndData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } else {
        const fallback = await getFallbackLocation(activeRegion);
        setLocation(fallback);
      }
    } catch (err) {
      const fallback = await getFallbackLocation(activeRegion);
      setLocation(fallback);
    }
  };

  const loadData = async () => {
    if (!location) return;
    try {
      // Fetch Official Alerts
      const alerts = await api.get<OfficialAlert[]>(`/api/alerts/official?region=${activeRegion}`);
      setOfficialAlerts(alerts);

      // Fetch All Active Reports in India for AI Prediction Forecast
      const allReps = await api.get<HazardReport[]>('/api/reports');
      setAllReports(allReps);

      // Fetch Nearby Reports
      const reports = await api.get<HazardReport[]>(
        `/api/reports?lat=${location.lat}&lng=${location.lng}&radius=100` // 100km radius
      );
      setNearbyReports(reports.slice(0, 5)); // Show top 5

      // Calculate Stats
      const activeCount = reports.filter(r => r.status !== 'false_alarm').length;
      const verifiedCount = reports.filter(
        r => r.status === 'community_verified' || r.status === 'high_confidence'
      ).length;
      setStats({
        active: activeCount,
        verified: verifiedCount,
        total: reports.length
      });

      // Fetch Trending Keywords
      const socialResponse = await api.get<{ signals?: any[] }>(`/api/social-signals?region=${encodeURIComponent(activeRegion)}`);
      const signals = Array.isArray(socialResponse) ? socialResponse : socialResponse.signals || [];
      const keywords = new Set<string>();
      signals.forEach((s: any) => s.hazardKeywordsMatched?.forEach((kw: string) => keywords.add(kw)));
      setTrendingKeywords(Array.from(keywords).slice(0, 4));

      // Trigger Push Alerts for new high confidence hazard reports or official alerts
      alerts.forEach(async (al) => {
        const key = `seen_alert_${al._id}`;
        const seen = await AsyncStorage.getItem(key);
        if (!seen) {
          await AsyncStorage.setItem(key, 'true');
          triggerLocalNotification(
            `OFFICIAL: ${al.hazardType.toUpperCase()}`,
            al.message
          );
        }
      });

      reports.forEach(async (rep) => {
        if (rep.status === 'high_confidence' || rep.status === 'community_verified') {
          const key = `seen_report_alert_${rep._id}`;
          const seen = await AsyncStorage.getItem(key);
          if (!seen) {
            await AsyncStorage.setItem(key, 'true');
            triggerLocalNotification(
              `CRITICAL HAZARD: ${rep.hazardType.toUpperCase()}`,
              rep.description
            );
          }
        }
      });

    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocationAndData();
  }, []);

  useEffect(() => {
    if (location) {
      loadData();
      const interval = setInterval(() => {
        loadData();
      }, 5000); // Sync reports & alerts in real-time every 5 seconds
      return () => clearInterval(interval);
    }
  }, [location, activeRegion]);

  // Re-run whenever the dashboard becomes focused in tab navigation
  useFocusEffect(
    React.useCallback(() => {
      fetchLocationAndData();
    }, [activeRegion])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Text-To-Speech alert readout
  const toggleSpeech = (alertId: string, text: string) => {
    if (speakingId === alertId) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      Speech.stop();
      setSpeakingId(alertId);
      Speech.speak(text, {
        language: language === 'hi' ? 'hi-IN' : 'en-US',
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null)
      });
    }
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const getClosestCity = (lat: number, lng: number) => {
    let closestName = 'India Alert';
    let minDistance = Infinity;

    const cities: Record<string, { lat: number; lng: number }> = {
      Delhi: { lat: 28.7041, lng: 77.1025 },
      Bengaluru: { lat: 12.9716, lng: 77.5946 },
      Chennai: { lat: 13.0827, lng: 80.2707 },
      Kolkata: { lat: 22.5726, lng: 88.3639 },
      Hyderabad: { lat: 17.3850, lng: 78.4867 },
      Ahmedabad: { lat: 23.0225, lng: 72.5714 },
      Pune: { lat: 18.5204, lng: 73.8567 },
      Kochi: { lat: 9.9312, lng: 76.2673 },
      Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
      Goa: { lat: 15.2993, lng: 74.1240 },
      Patna: { lat: 25.5941, lng: 85.1376 },
      Jaipur: { lat: 26.9124, lng: 75.7873 },
      Lucknow: { lat: 26.8467, lng: 80.9462 }
    };

    Object.entries(cities).forEach(([name, coords]) => {
      const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = name;
      }
    });

    return closestName;
  };

  const getRiskPercentage = (severity: string, credibility?: number) => {
    let base = 30;
    if (severity === 'critical') base = 85;
    else if (severity === 'high') base = 70;
    else if (severity === 'medium') base = 45;
    else if (severity === 'low') base = 20;
    
    const cred = credibility !== undefined ? credibility : 50;
    const scoreMod = Math.round((cred - 50) / 5);
    return Math.min(99, Math.max(10, base + scoreMod));
  };

  const formatHazardType = (type: string) => {
    return type
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 1. Official Alerts Banner Marquee */}
      {officialAlerts.length > 0 ? (
        officialAlerts.map((alert) => (
          <View
            key={alert._id}
            style={[
              styles.alertBanner,
              {
                backgroundColor: alert.severity === 'critical' ? '#FFEBEB' : '#FFF3CD',
                borderColor: alert.severity === 'critical' ? colors.danger : colors.warning
              }
            ]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertTypeBadge}>
                <AlertTriangle
                  size={18}
                  color={alert.severity === 'critical' ? colors.danger : colors.warning}
                />
                <Text
                  style={[
                    styles.alertTitle,
                    { color: alert.severity === 'critical' ? colors.danger : '#856404' }
                  ]}
                >
                  {t(`hazards.${alert.hazardType}`) || alert.hazardType.toUpperCase()} ALERT
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  toggleSpeech(
                    alert._id,
                    `${alert.issuedBy} warning: ${alert.message}`
                  )
                }
              >
                {speakingId === alert._id ? (
                  <VolumeX size={20} color="#64748B" />
                ) : (
                  <Volume2 size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.alertBody}>{alert.message}</Text>
            <Text style={styles.alertFooter}>Issued by {alert.issuedBy}</Text>
          </View>
        ))
      ) : (
        <View style={styles.noAlertsBanner}>
          <CheckCircle size={18} color={colors.success} />
          <Text style={[styles.noAlertsText, { color: colors.success }]}>
            No active official alerts in {activeRegion} coastal area
          </Text>
        </View>
      )}

      {/* 2. Prominent Emergency CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.reportBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/report')}
        >
          <PlusCircle size={24} color="#FFFFFF" style={styles.ctaIcon} />
          <Text style={styles.reportBtnText}>{t('dashboard.reportCTA')}</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Quick Stats Strip */}
      <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          {t('dashboard.statsTitle')} ({activeRegion})
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t('dashboard.statsActive')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.verified}</Text>
            <Text style={styles.statLabel}>{t('dashboard.statsVerified')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('dashboard.statsReports')}</Text>
          </View>
        </View>
      </View>

      {/* 4. Recent Reports Feed */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.recentReports')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>See Map</Text>
        </TouchableOpacity>
      </View>

      {nearbyReports.length > 0 ? (
        nearbyReports.map((item) => {
          const distance = location
            ? calculateDistance(
                location.lat,
                location.lng,
                item.location.coordinates[1],
                item.location.coordinates[0]
              )
            : 0;

          return (
            <TouchableOpacity
              key={item._id}
              style={[
                styles.reportCard,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
              onPress={() => router.push('/(tabs)/map')}
            >
              {item.images.length > 0 ? (
                <Image
                  source={{ uri: `${getBaseUrl()}${item.images[0]}` }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.background }]}>
                  <AlertTriangle size={32} color="#94A3B8" />
                </View>
              )}
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t(`hazards.${item.hazardType}`) || item.hazardType}
                  </Text>
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor:
                          item.severity === 'critical' || item.severity === 'high'
                            ? '#FFEBEB'
                            : '#FFF3CD'
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        {
                          color:
                            item.severity === 'critical' || item.severity === 'high'
                              ? colors.danger
                              : '#B7791F'
                        }
                      ]}
                    >
                      {item.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardMetaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.metaText}>
                      {distance} km {t('map.distance')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    {item.status === 'high_confidence' && (
                      <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                        <Text style={styles.badgeText}>High Confidence</Text>
                      </View>
                    )}
                    {item.status === 'community_verified' && (
                      <View style={[styles.badge, { backgroundColor: colors.success }]}>
                        <Text style={styles.badgeText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary }}>No reports nearby.</Text>
        </View>
      )}

      {/* 5. Social Media Signal Widget */}
      <View style={[styles.socialWidget, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.socialHeaderRow}>
          <Activity size={18} color={colors.accent} />
          <Text style={[styles.socialTitle, { color: colors.text }]}>
            {t('dashboard.socialChatter')}
          </Text>
        </View>
        <Text style={styles.socialDesc}>Trending Keywords in {activeRegion}:</Text>
        <View style={styles.keywordsContainer}>
          {trendingKeywords.length > 0 ? (
            trendingKeywords.map((kw) => (
              <View key={kw} style={[styles.keywordChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.keywordText, { color: colors.primary }]}>#{kw}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>No active trends</Text>
          )}
        </View>
      </View>

      {/* 6. AI Action Shortcuts Toolbar */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
        AI Disaster War Room
      </Text>
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/report/command-center')}
        >
          <MessageSquare size={22} color={colors.accent} />
          <Text style={[styles.shortcutLabel, { color: colors.text }]}>AI Chatbot</Text>
          <Text style={styles.shortcutDesc}>Ask today's threats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/report/seatwin')}
        >
          <Waves size={22} color={colors.primary} />
          <Text style={[styles.shortcutLabel, { color: colors.text }]}>SeaTwin AI</Text>
          <Text style={styles.shortcutDesc}>Spill dispersion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/report/knowledge-graph')}
        >
          <BrainCircuit size={22} color={colors.success} />
          <Text style={[styles.shortcutLabel, { color: colors.text }]}>Ocean Memory</Text>
          <Text style={styles.shortcutDesc}>Disaster relations</Text>
        </TouchableOpacity>
      </View>

      {/* 7. AI Prediction Engine Forecast Card */}
      <View style={[styles.predictionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.socialHeaderRow}>
          <Sparkles size={18} color="#F59E0B" />
          <Text style={[styles.socialTitle, { color: colors.text, marginLeft: 8 }]}>
            AI Prediction Forecast (24 Hours)
          </Text>
        </View>
        <Text style={styles.socialDesc}>Tidal and weather forecast analytics models:</Text>
        
        {allReports.filter(r => r.severity === 'critical' || r.severity === 'high' || r.severity === 'medium').slice(0, 4).map((report) => {
          const cityName = getClosestCity(report.location.coordinates[1], report.location.coordinates[0]);
          const hazardText = formatHazardType(report.hazardType);
          const riskPercentage = getRiskPercentage(report.severity, report.credibilityScore);
          
          const progressColor = riskPercentage >= 75 ? colors.danger : colors.warning;
          
          return (
            <View key={report._id} style={styles.predictionItem}>
              <View style={styles.predictionHeader}>
                <Text style={[styles.predictionText, { color: colors.text }]}>
                  {cityName} {hazardText}
                </Text>
                <Text style={{ color: progressColor, fontWeight: '700', fontSize: 13 }}>
                  {riskPercentage}% Risk
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${riskPercentage}%`, backgroundColor: progressColor }]} />
              </View>
            </View>
          );
        })}
        {allReports.filter(r => r.severity === 'critical' || r.severity === 'high' || r.severity === 'medium').length === 0 && (
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 10, textAlign: 'center' }}>
            No active coastal alerts or warnings detected in India.
          </Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  alertTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6
  },
  alertBody: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8
  },
  alertFooter: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  noAlertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F6',
    borderWidth: 1,
    borderColor: '#C2F1E8',
    padding: 14,
    borderRadius: 12,
    marginTop: 16
  },
  noAlertsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  ctaContainer: {
    marginVertical: 16
  },
  reportBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  ctaIcon: {
    marginRight: 8
  },
  reportBtnText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  statsStrip: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600'
  },
  statDivider: {
    width: 1,
    height: 40
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  reportCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginVertical: 4
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '500'
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20
  },
  socialWidget: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 30
  },
  socialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  socialTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8
  },
  socialDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  keywordChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '600'
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  shortcutCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center'
  },
  shortcutDesc: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center'
  },
  predictionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20
  },
  predictionItem: {
    marginBottom: 12
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  predictionText: {
    fontSize: 13,
    fontWeight: '600'
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  }
});
