import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { isCoastalRegion } from '../../utils/regionUtils';
import {
  ArrowLeft,
  Clock,
  Compass,
  TrendingUp,
  AlertTriangle,
  Activity,
  ShieldCheck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SimulationPhase {
  hours: number;
  spreadDistance: string;
  impactArea: string;
  threatLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  blueEconomyLoss: string;
  actions: string[];
}

const PHASES: Record<string, Record<number, SimulationPhase>> = {
  oil_spill: {
    6: {
      hours: 6,
      spreadDistance: '1.2 km South-West',
      impactArea: 'Open harbor channel, shipping lanes restricted.',
      threatLevel: 'Moderate',
      blueEconomyLoss: '₹15 Lakhs (Shipping delays)',
      actions: ['Deploy first-tier containment booms', 'Notify port authority and coast guard']
    },
    12: {
      hours: 12,
      spreadDistance: '4.8 km South',
      impactArea: 'Approaching shallow fishing breeding zones. High threat to local catches.',
      threatLevel: 'High',
      blueEconomyLoss: '₹1.2 Crores (Fishery shutdown)',
      actions: ['Dispatch oil skimmer vessels', 'Alert local fishing cooperative societies']
    },
    24: {
      hours: 24,
      spreadDistance: '9.5 km South-East',
      impactArea: 'Reaching public beaches and tourist shorelines in the affected coastal region.',
      threatLevel: 'Critical',
      blueEconomyLoss: '₹3.1 Crores (Ecosystem & Tourism)',
      actions: ['Mobilize shore clean-up crews', 'Trigger emergency regional warning notifications']
    }
  },
  default: {
    6: {
      hours: 6,
      spreadDistance: '800 meters',
      impactArea: 'Low-lying port roads flooded, water entering drainage system.',
      threatLevel: 'Moderate',
      blueEconomyLoss: '₹10 Lakhs (Logistics damage)',
      actions: ['Deploy temporary sandbags', 'Monitor tidal gauges']
    },
    12: {
      hours: 12,
      spreadDistance: '2.5 km',
      impactArea: 'Residential coastal border lanes flooded. High risk of waterlogging.',
      threatLevel: 'High',
      blueEconomyLoss: '₹85 Lakhs (Property damage)',
      actions: ['Trigger local community alerts', 'Prepare evacuation shelter points']
    },
    24: {
      hours: 24,
      spreadDistance: '6.0 km',
      impactArea: 'Submerging primary road networks and low-lying coastal farmland.',
      threatLevel: 'Critical',
      blueEconomyLoss: '₹2.4 Crores (Infrastructure & Crop loss)',
      actions: ['Execute emergency rescue operations', 'Close primary coastal roadways']
    }
  }
};

const TELEMETRY: Record<string, Record<number, Array<{ label: string; value: string; trend: string }>>> = {
  oil_spill: {
    6: [
      { label: 'Spill Area', value: '1.2 km²', trend: '+15%' },
      { label: 'Wave Height', value: '1.4 m', trend: 'Stable' },
      { label: 'Wind Speed', value: '14 knots', trend: 'NE' },
      { label: 'Current Flow', value: '0.6 knots', trend: 'South' }
    ],
    12: [
      { label: 'Spill Area', value: '4.8 km²', trend: '+300%' },
      { label: 'Wave Height', value: '2.1 m', trend: 'Rising' },
      { label: 'Wind Speed', value: '19 knots', trend: 'NNE' },
      { label: 'Current Flow', value: '1.1 knots', trend: 'SSE' }
    ],
    24: [
      { label: 'Spill Area', value: '9.5 km²', trend: '+80%' },
      { label: 'Wave Height', value: '3.4 m', trend: 'Severe' },
      { label: 'Wind Speed', value: '28 knots', trend: 'North' },
      { label: 'Current Flow', value: '1.8 knots', trend: 'East' }
    ]
  },
  default: {
    6: [
      { label: 'Flood Level', value: '0.4 m', trend: '+5%' },
      { label: 'Wave Height', value: '1.8 m', trend: 'Stable' },
      { label: 'Wind Speed', value: '18 knots', trend: 'SW' },
      { label: 'Tidal Flow', value: '1.1 knots', trend: 'Flood' }
    ],
    12: [
      { label: 'Flood Level', value: '1.1 m', trend: '+175%' },
      { label: 'Wave Height', value: '2.9 m', trend: 'Rising' },
      { label: 'Wind Speed', value: '24 knots', trend: 'WSW' },
      { label: 'Tidal Flow', value: '1.8 knots', trend: 'Flood' }
    ],
    24: [
      { label: 'Flood Level', value: '2.4 m', trend: '+118%' },
      { label: 'Wave Height', value: '4.2 m', trend: 'Severe' },
      { label: 'Wind Speed', value: '36 knots', trend: 'West' },
      { label: 'Tidal Flow', value: '2.5 knots', trend: 'Critical' }
    ]
  }
};

const formatINR = (value?: number) => {
  if (value === undefined || value === null) return '₹0';
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Crores`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(0)} Lakhs`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function SeaTwinSimulation() {
  const { type = 'default', name = 'Coastal Hazard', reportId } = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = Theme[theme];

  const activeRegion = user?.region || 'India';
  const isCoastal = isCoastalRegion(activeRegion);

  const [activeHour, setActiveHour] = useState<number>(6);
  const [report, setReport] = useState<any | null>(null);
  const [economyInfo, setEconomyInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let activeId = reportId as string;
    let isFirstLoad = true;

    const loadRealData = async () => {
      try {
        if (isFirstLoad) {
          setLoading(true);
        }
        
        if (!activeId) {
          const reports = await api.get<any[]>('/api/reports');
          const normalizedRegion = activeRegion.trim().toLowerCase();
          const regionalReports = reports.filter(r => {
            const reportRegion = String(r.region || '').toLowerCase();
            const matchesRegion = normalizedRegion === 'india' || reportRegion.includes(normalizedRegion);
            return matchesRegion && r.status !== 'false_alarm';
          });
          
          if (regionalReports.length > 0) {
            activeId = regionalReports[0]._id;
          } else if (reports.length > 0) {
            activeId = reports[0]._id;
          }
        }
        
        if (activeId) {
          const allReps = await api.get<any[]>('/api/reports');
          const matchedReport = allReps.find(r => r._id === activeId);
          if (matchedReport) {
            setReport(matchedReport);
          }
          
          const eco = await api.get<any>(`/api/ai/economy/${activeId}`);
          setEconomyInfo(eco);
        }
      } catch (err) {
        console.log('Error loading SeaTwin real data from backend:', err);
      } finally {
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    };
    
    loadRealData();
    const interval = setInterval(loadRealData, 5000); // Sync simulator details in real-time every 5 seconds
    return () => clearInterval(interval);
  }, [reportId, activeRegion]);

  const hazardKey = PHASES[type as string] ? (type as string) : 'default';

  let currentData = PHASES[hazardKey][activeHour];
  let telemetryData = TELEMETRY[hazardKey][activeHour];

  if (!isCoastal) {
    const riverPhases: Record<number, SimulationPhase> = {
      6: {
        hours: 6,
        spreadDistance: '400 meters outward',
        impactArea: `Low-lying areas near the riverbanks of ${activeRegion} are waterlogged.`,
        threatLevel: 'Moderate',
        blueEconomyLoss: '₹8 Lakhs (Crop damage)',
        actions: ['Deploy sandbags along weakened dyke zones', 'Monitor water levels at upstream barrages']
      },
      12: {
        hours: 12,
        spreadDistance: '1.8 km spread',
        impactArea: `Water entering residential blocks and sub-lanes of ${activeRegion}. High inundation.`,
        threatLevel: 'High',
        blueEconomyLoss: '₹45 Lakhs (Infrastructure damage)',
        actions: ['Trigger evacuation alerts for low-lying blocks', 'Prepare emergency relief shelters']
      },
      24: {
        hours: 24,
        spreadDistance: '4.5 km broad inundation',
        impactArea: `Primary state highways and agricultural fields near ${activeRegion} fully submerged.`,
        threatLevel: 'Critical',
        blueEconomyLoss: '₹1.8 Crores (Severe crop & logistics loss)',
        actions: ['Execute emergency rescue operations', 'Close high-risk roadways and bridge lanes']
      }
    };
    currentData = riverPhases[activeHour];

    const riverTelemetry: Record<number, Array<{ label: string; value: string; trend: string }>> = {
      6: [
        { label: 'River Level', value: 'Danger +0.5m', trend: '+10%' },
        { label: 'Flow Velocity', value: '1.2 m/s', trend: 'Stable' },
        { label: 'Rainfall Vol', value: '45 mm/hr', trend: 'Steady' },
        { label: 'Embankment status', value: 'Stable', trend: 'Good' }
      ],
      12: [
        { label: 'River Level', value: 'Danger +1.8m', trend: '+260%' },
        { label: 'Flow Velocity', value: '2.4 m/s', trend: 'Rising' },
        { label: 'Rainfall Vol', value: '82 mm/hr', trend: 'Severe' },
        { label: 'Embankment status', value: 'Seepage', trend: 'Warning' }
      ],
      24: [
        { label: 'River Level', value: 'Danger +3.2m', trend: '+77%' },
        { label: 'Flow Velocity', value: '3.8 m/s', trend: 'Critical' },
        { label: 'Rainfall Vol', value: '110 mm/hr', trend: 'Extremely Heavy' },
        { label: 'Embankment status', value: 'Breached', trend: 'Critical' }
      ]
    };
    telemetryData = riverTelemetry[activeHour];
  }

  useEffect(() => {
    // 1. Trigger rotating sweep sonar animation loop
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    // 2. Trigger animated dispersion pulsing when timeline changes
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: activeHour === 6 ? 1.1 : activeHour === 12 ? 1.5 : 2.0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, [activeHour]);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Low': return colors.success;
      case 'Moderate': return colors.warning;
      case 'High': return '#FF8E53';
      case 'Critical': return colors.danger;
      default: return colors.primary;
    }
  };

  const getDynamicActions = () => {
    if (report?.hazardType === 'oil_spill') {
      return ['Deploy first-tier oil containment booms and barriers', 'Mobilize coast guard skimmer vessels to incident center', 'Restrict shipping lanes and coordinate with port authorities'];
    }
    if (report?.hazardType === 'coastal_flooding' || report?.hazardType === 'storm_surge' || report?.hazardType === 'river_overflow') {
      return ['Trigger evacuation alerts for low-lying block communities', 'Deploy sandbags and reinforce weak river dykes/seawalls', 'Monitor drainage sluice gates and tide/river gauges'];
    }
    return currentData.actions;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontWeight: '600' }}>Syncing with SentinelSea DB...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header toolbar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isCoastal ? 'SeaTwin' : 'RiverTwin'} AI™ Digital Twin</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {isCoastal ? name : name.toString().replace(/coastal/gi, 'Riverine').replace(/ocean/gi, 'River')} Impact Simulation
        </Text>
        <Text style={styles.subtitle}>
          {isCoastal ? 'AI-Powered Coastal Impact Prediction Model' : 'AI-Powered Riverine Flood Inundation Model'}
        </Text>

        {/* 1. Interactive Digital Twin Radar/Map Visual */}
        <View style={[styles.radarCard, { backgroundColor: '#091A2E', borderColor: colors.border }]}>
          
          {/* Circular Grid Rings */}
          <View style={styles.radarRingOuter}>
            <View style={styles.radarRingMiddle}>
              <View style={styles.radarRingInner} />
            </View>
          </View>

          {/* Animated Dispersion Ring */}
          <Animated.View
            style={[
              styles.dispersionRing,
              {
                borderColor: getThreatColor(report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel),
                transform: [{ scale: scaleAnim }]
              }
            ]}
          />

          {/* Sonar Radar Sweep Line */}
          <Animated.View
            style={[
              styles.radarSweepLine,
              {
                transform: [
                  { rotate: spin }
                ]
              }
            ]}
          />

          {/* Floating Radar Particle Dots */}
          <View style={[styles.radarParticle, { top: 70, left: 100, backgroundColor: getThreatColor(report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel) }]} />
          <View style={[styles.radarParticle, { top: 120, right: 90, backgroundColor: getThreatColor(report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel) }]} />
          <View style={[styles.radarParticle, { bottom: 80, left: 120, backgroundColor: getThreatColor(report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel) }]} />

          {/* Coastline Simulation Line Graphic */}
          <View style={styles.coastlinePath} />

          {/* Compass Icon indicator */}
          <View style={styles.compassBox}>
            <Compass size={18} color="#94A3B8" />
            <Text style={styles.compassText}>N</Text>
          </View>

          {/* Coordinates Marker Pin */}
          <View style={[styles.markerPin, { backgroundColor: colors.accent }]} />
          <Text style={styles.markerText}>Incident Center</Text>

          {/* Floating Time indicator */}
          <View style={styles.floatingTimeBadge}>
            <Text style={styles.floatingTimeText}>Forecast: +{activeHour} hrs</Text>
          </View>
        </View>

        {/* 2. Interactive Timeline Selectors */}
        <View style={styles.timelineRow}>
          {[6, 12, 24].map((hr) => (
            <TouchableOpacity
              key={hr}
              style={[
                styles.timeChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                activeHour === hr && { backgroundColor: colors.accent, borderColor: colors.accent }
              ]}
              onPress={() => setActiveHour(hr)}
            >
              <Clock size={16} color={activeHour === hr ? '#FFFFFF' : colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.timeChipText, { color: colors.text }, activeHour === hr && { color: '#FFFFFF' }]}>
                {hr} Hours
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2.5 Real-Time Ocean Sensor Telemetry Panel */}
        <View style={[styles.telemetryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.telemetryTitle, { color: colors.text }]}>{isCoastal ? 'SeaTwin' : 'RiverTwin'} Live Telemetry Panel</Text>
          <View style={styles.telemetryGrid}>
            {telemetryData.map((item, idx) => (
              <View key={idx} style={[styles.telemetryItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={styles.telemetryItemLabel}>{item.label}</Text>
                <Text style={[styles.telemetryItemValue, { color: colors.text }]}>{item.value}</Text>
                <View style={styles.telemetryTrendRow}>
                  <Text style={[styles.telemetryTrendText, { color: item.trend.startsWith('+') || item.trend === 'Rising' || item.trend === 'Severe' || item.trend === 'Critical' ? colors.danger : colors.success }]}>
                    {item.trend}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. AI Predictive Analytics Cards */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Activity size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{isCoastal ? 'Forecast Spread Details' : 'Inundation Vector Details'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{isCoastal ? 'Spread Vector:' : 'Inundation Extent:'}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{report ? (isCoastal ? `${(activeHour * 0.35).toFixed(1)} km Spread` : `${(activeHour * 0.15).toFixed(1)} km Inundation`) : currentData.spreadDistance}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Threat:</Text>
            <View style={[styles.threatBadge, { backgroundColor: getThreatColor(report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel) }]}>
              <Text style={styles.threatText}>{report?.severity ? (report.severity === 'low' ? 'Low' : report.severity === 'medium' ? 'Moderate' : report.severity === 'high' ? 'High' : 'Critical') : currentData.threatLevel}</Text>
            </View>
          </View>

          <Text style={styles.descriptionLabel}>Predicted Impact Area:</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{report ? report.description : currentData.impactArea}</Text>
        </View>

        {/* 4. Blue Economy Business Loss Card */}
        <View style={[styles.economyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <TrendingUp size={18} color="#FF8E53" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{isCoastal ? 'Blue Economy Impact' : 'Regional Economic Impact'}</Text>
          </View>
          <Text style={styles.economyDesc}>{isCoastal ? 'Projected Regional Financial Damage:' : 'Projected Farm & Infrastructure Loss:'}</Text>
          <Text style={[styles.lossValue, { color: colors.danger }]}>{economyInfo ? formatINR(economyInfo.losses.total) : currentData.blueEconomyLoss}</Text>
          <View style={[styles.savingAlert, { backgroundColor: '#E6F9F6' }]}>
            <ShieldCheck size={16} color={colors.success} style={{ marginRight: 6 }} />
            <Text style={[styles.savingText, { color: colors.success }]}>
              {economyInfo ? `Early Response saves ${formatINR(economyInfo.preventionSaving)} (60% saved).` : (isCoastal ? 'Early Dispatch mitigates 60% damage.' : 'Early barrage control & dyke reinforcement mitigates 60% damage.')}
            </Text>
          </View>
        </View>

        {/* 5. Recommended Actions Command Checklist */}
        <View style={[styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <AlertTriangle size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Response Protocols</Text>
          </View>
          {getDynamicActions().map((act, index) => (
            <View key={index} style={styles.actionItem}>
              <View style={[styles.bulletPoint, { backgroundColor: colors.accent }]} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>{act}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  backBtn: {
    padding: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20
  },
  radarCard: {
    height: 250,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  radarRingOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarRingMiddle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  dispersionRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(238, 108, 77, 0.12)'
  },
  coastlinePath: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 60,
    height: 3,
    backgroundColor: '#38BDF8',
    opacity: 0.6,
    borderRadius: 2
  },
  compassBox: {
    position: 'absolute',
    top: 16,
    left: 16,
    alignItems: 'center'
  },
  compassText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2
  },
  markerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  markerText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    top: 136
  },
  floatingTimeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  floatingTimeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700'
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  timeChip: {
    width: '31%',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700'
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700'
  },
  threatBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10
  },
  threatText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18
  },
  economyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  economyDesc: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4
  },
  lossValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10
  },
  savingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8
  },
  savingText: {
    fontSize: 11,
    fontWeight: '700'
  },
  actionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  radarSweepLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10
  },
  radarParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  telemetryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  telemetryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  telemetryItem: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8
  },
  telemetryItemLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2
  },
  telemetryItemValue: {
    fontSize: 15,
    fontWeight: '800'
  },
  telemetryTrendRow: {
    marginTop: 2,
    alignItems: 'flex-start'
  },
  telemetryTrendText: {
    fontSize: 9,
    fontWeight: '700'
  }
});
