import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { isCoastalRegion } from '../../utils/regionUtils';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import {
  ArrowLeft,
  BrainCircuit,
  Search,
  Database,
  History,
  Info,
  Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GraphNode {
  id: string;
  label: string;
  type: 'hazard' | 'cause' | 'impact' | 'region' | 'action';
  x: number;
  y: number;
  details: {
    title: string;
    description: string;
    metrics: string[];
    historyLogs?: string[];
  };
}

interface GraphLink {
  source: string;
  target: string;
  relationship: string;
}

const LINKS: GraphLink[] = [
  { source: 'cause', target: 'hazard', relationship: 'caused_by' },
  { source: 'region', target: 'hazard', relationship: 'located_at' },
  { source: 'hazard', target: 'impact', relationship: 'affects' },
  { source: 'hazard', target: 'action', relationship: 'triggers' },
  { source: 'sentiment', target: 'hazard', relationship: 'reports' },
  { source: 'infrastructure', target: 'region', relationship: 'located_in' }
];

export default function OceanMemoryGraph() {
  const { user } = useAuth();
  const activeRegion = user?.region || 'India';
  const { reportId } = useLocalSearchParams();
  
  const { theme } = useTheme();
  const colors = Theme[theme];

  const [selectedNodeId, setSelectedNodeId] = useState<string>('region');
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [warRoomLogs, setWarRoomLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeId = reportId as string;
    let isFirstLoad = true;

    const loadRealLogs = async () => {
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
            setActiveReport(matchedReport);
          }
          
          const logsData = await api.get<any>(`/api/ai/warroom/${activeId}`);
          if (logsData && logsData.logs) {
            setWarRoomLogs(logsData.logs);
          }
        }
      } catch (err) {
        console.log('Error loading Ocean Memory real logs from backend:', err);
      } finally {
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    };
    
    loadRealLogs();
    const interval = setInterval(loadRealLogs, 5000); // Sync memory logs in real-time every 5 seconds
    return () => clearInterval(interval);
  }, [reportId, activeRegion]);

  const isCoastal = (reg: string) => isCoastalRegion(reg);

  const nodes: GraphNode[] = isCoastal(activeRegion) ? [
    {
      id: 'region',
      label: activeRegion,
      type: 'region',
      x: width / 2,
      y: 40,
      details: {
        title: `Location: ${activeRegion} Sector`,
        description: `Active coastal grid monitoring region for ${activeRegion}. Heavy industrial shipping traffic.`,
        metrics: ['Vulnerability Index: 88/100', 'Historical Alerts: 14 Cases'],
        historyLogs: [
          '2015 ➔ Severe Harbor Flooding',
          '2018 ➔ Storm impact and surge warning',
          `2023 ➔ Coastal erosion increased by 14% near ${activeRegion}`,
          `Pattern ➔ Storm-related surges increased by 32% in 10 yrs. Risk: HIGH.`
        ]
      }
    },
    {
      id: 'cause',
      label: 'Ship Collision',
      type: 'cause',
      x: 80,
      y: 100,
      details: {
        title: 'Trigger: Ship Collision',
        description: `Cargo vessel collision reported off the ${activeRegion} harbor gate.`,
        metrics: ['Timestamp: 10:02 AM', 'Vessel Type: Crude Carrier', 'Incident Code: #COL-901']
      }
    },
    {
      id: 'hazard',
      label: 'Oil Spill',
      type: 'hazard',
      x: width / 2,
      y: 160,
      details: {
        title: 'Hazard: Crude Oil Spill',
        description: `Category 3 chemical hazard spill spreading along the ${activeRegion} harbor boundary.`,
        metrics: ['Estimated Vol: 4,500 Liters', 'Viscosity: High Crude', 'Risk Tier: Critical']
      }
    },
    {
      id: 'impact',
      label: 'Marine Fauna',
      type: 'impact',
      x: width - 80,
      y: 100,
      details: {
        title: 'Impact: Marine Ecosystem',
        description: 'Ecological warning issued for local marine species and mangrove lines.',
        metrics: ['Fauna Threat Index: 92%', 'Mangrove Exposure: 4.2 km', 'Species at Risk: 24+']
      }
    },
    {
      id: 'action',
      label: 'Fishing Ban',
      type: 'action',
      x: width / 2,
      y: 270,
      details: {
        title: 'Action Protocol: Fishing Ban',
        description: `Emergency safety ban triggered restricting fishing trawler entries near ${activeRegion}.`,
        metrics: ['Effective Radius: 15 km', 'Affected Vessels: ~450 boats', 'Economic Impact: ₹1.2 Cr']
      }
    },
    {
      id: 'sentiment',
      label: 'Social Signal',
      type: 'impact',
      x: width - 80,
      y: 210,
      details: {
        title: 'Social Signal Analysis',
        description: `Real-time analysis of local social posts and reports near ${activeRegion}.`,
        metrics: ['Sentiment Score: 84% Positive', 'Inquiries Count: 140', 'Regional Alerts Sent: 3']
      }
    },
    {
      id: 'infrastructure',
      label: 'Vulnerability',
      type: 'region',
      x: 80,
      y: 210,
      details: {
        title: 'Shoreline Vulnerability Index',
        description: `Evaluates high-risk erosion zones and low-lying coastal structures near ${activeRegion}.`,
        metrics: ['Erosion Index: High', 'Flood Exposure: 1.8km Shore', 'Protected Breakwaters: 2 active']
      }
    }
  ] : [
    {
      id: 'region',
      label: activeRegion,
      type: 'region',
      x: width / 2,
      y: 40,
      details: {
        title: `Location: ${activeRegion} District Sector`,
        description: `Active river basin and plains monitoring zone for ${activeRegion}. High agricultural and riverbank density.`,
        metrics: ['Embankment Vulnerability: 82/100', 'Historical Flood Incidents: 19 Cases'],
        historyLogs: [
          '2016 ➔ Ganges River basin overflow & crop washout',
          '2019 ➔ Urban waterlogging and drainage failures',
          `2024 ➔ Riverbank soil erosion increased by 18% near ${activeRegion}`,
          `Pattern ➔ Monsoon peak discharges increased by 22% in 5 yrs. Risk: HIGH.`
        ]
      }
    },
    {
      id: 'cause',
      label: 'Cloudburst Rain',
      type: 'cause',
      x: 80,
      y: 100,
      details: {
        title: 'Trigger: Cloudburst Precipitation',
        description: 'Excessive high-intensity rainfall exceeding 90mm/hr registered in upstream catchments.',
        metrics: ['Rainfall Rate: 98mm/hr', 'Upstream Level: +3.2m', 'Precip Code: #MON-802']
      }
    },
    {
      id: 'hazard',
      label: 'River Overflow',
      type: 'hazard',
      x: width / 2,
      y: 160,
      details: {
        title: 'Hazard: Riverine Flooding & Overflow',
        description: `River channels overflowing embankments, threatening agricultural lowlands near ${activeRegion}.`,
        metrics: ['Flow Rate: 42,000 cusecs', 'Discharge Trend: Rising', 'Risk Tier: Critical']
      }
    },
    {
      id: 'impact',
      label: 'Farmland Washout',
      type: 'impact',
      x: width - 80,
      y: 100,
      details: {
        title: 'Impact: Agricultural Washout',
        description: 'Submergence of standing crops and severe topsoil erosion along the floodplains.',
        metrics: ['Crop Submergence: 1,200 Hectares', 'Erosion Depth: 1.2 meters', 'Affected Farmers: 1,400+']
      }
    },
    {
      id: 'action',
      label: 'Evacuation Alert',
      type: 'action',
      x: width / 2,
      y: 270,
      details: {
        title: 'Action Protocol: Evacuation Alert',
        description: 'Emergency relocation commands triggered for low-lying block communities near riverbanks.',
        metrics: ['Evacuated Zones: 4 Blocks', 'Shelter Points: 8 active', 'Relocated Count: 3,200+']
      }
    },
    {
      id: 'sentiment',
      label: 'Social Distress',
      type: 'impact',
      x: width - 80,
      y: 210,
      details: {
        title: 'Social Distress Signals',
        description: `Real-time social feeds tracking water levels and civic complaints in ${activeRegion}.`,
        metrics: ['SOS Feeds Tracked: 240', 'Distress Index: High (88%)', 'Inland Rescue Requests: 14']
      }
    },
    {
      id: 'infrastructure',
      label: 'Embankment Breach',
      type: 'region',
      x: 80,
      y: 210,
      details: {
        title: 'Embankment Security Index',
        description: `Monitors structurally weakened river barriers and dykes upstream of ${activeRegion}.`,
        metrics: ['Barrier Structural Rating: Weak', 'Seepage Points Detected: 3', 'Active Fortification: Sandbagging']
      }
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'region': return '#38BDF8';
      case 'cause': return '#EE6C4D';
      case 'hazard': return colors.danger;
      case 'impact': return '#F59E0B';
      case 'action': return colors.success;
      default: return colors.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontWeight: '600' }}>Syncing with Ocean Memory DB...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isCoastal(activeRegion) ? 'Ocean' : 'River'} Memory Graph</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 1. Dynamic SVG Network Graph */}
      <View style={[styles.canvasCard, { backgroundColor: '#091A2E', borderColor: colors.border }]}>
        <View style={styles.canvasHeader}>
          <BrainCircuit size={16} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.canvasTitle}>{isCoastal(activeRegion) ? 'Ocean' : 'River'} Neurons Schema View</Text>
        </View>

        <Svg width={width - 24} height={320} style={styles.svg}>
          {/* Relationship Connection Lines */}
          {LINKS.map((link, idx) => {
            const sourceNode = nodes.find(n => n.id === link.source)!;
            const targetNode = nodes.find(n => n.id === link.target)!;
            const isHighlighted = link.source === selectedNodeId || link.target === selectedNodeId;
            return (
              <Line
                key={idx}
                x1={sourceNode.x - 12}
                y1={sourceNode.y}
                x2={targetNode.x - 12}
                y2={targetNode.y}
                stroke={isHighlighted ? '#38BDF8' : '#1E293B'}
                strokeWidth={isHighlighted ? 3 : 1.5}
                strokeDasharray={isHighlighted ? '4 2' : undefined}
              />
            );
          })}

          {/* Nodes Rendering */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const color = getNodeColor(node.type);
            return (
              <React.Fragment key={node.id}>
                {/* Node Outer Selection Halo */}
                {isSelected && (
                  <Circle
                    cx={node.x - 12}
                    cy={node.y}
                    r={24}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )}
                {/* Main Node Circle */}
                <Circle
                  cx={node.x - 12}
                  cy={node.y}
                  r={16}
                  fill={color}
                  onPress={() => setSelectedNodeId(node.id)}
                />
                {/* Node Label Text */}
                <SvgText
                  x={node.x - 12}
                  y={node.y + 30}
                  fill="#E2E8F0"
                  fontSize={10}
                  fontWeight="bold"
                  textAnchor="middle"
                  onPress={() => setSelectedNodeId(node.id)}
                >
                  {node.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
        <Text style={styles.tapPrompt}>Tap any neuron node to query relation database</Text>
        
        {/* Color Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.legendText}>Region</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EE6C4D' }]} />
            <Text style={styles.legendText}>Trigger</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Hazard</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Impact</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Action</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 2. Selected Node Metadata Info Card */}
        {selectedNode && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Info size={18} color={getNodeColor(selectedNode.type)} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Node Details</Text>
            </View>

            <Text style={[styles.nodeTitle, { color: colors.text }]}>
              {selectedNodeId === 'region' && activeReport
                ? `Location: ${activeRegion} Basin Alert`
                : selectedNodeId === 'hazard' && activeReport
                ? `Hazard: ${activeReport.hazardType.replace('_', ' ').toUpperCase()}`
                : selectedNode.details.title}
            </Text>
            <Text style={[styles.nodeDesc, { color: colors.textSecondary }]}>
              {selectedNodeId === 'region' && activeReport
                ? `Active monitoring sector for ${activeRegion}. High confidence alert registered: ${activeReport.description}`
                : selectedNodeId === 'hazard' && activeReport
                ? activeReport.description
                : selectedNode.details.description}
            </Text>

            {/* Metrics */}
            <Text style={styles.subTitle}>Relational Parameters:</Text>
            {selectedNode.details.metrics.map((met, idx) => (
              <View key={idx} style={styles.metricItem}>
                <Database size={13} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={[styles.metricText, { color: colors.text }]}>{met}</Text>
              </View>
            ))}

            {/* Ocean Memory Timeline Logs (for regional nodes) */}
            {selectedNodeId === 'region' && (
              <View style={{ marginTop: 16 }}>
                <View style={styles.historyHeader}>
                  <History size={16} color="#38BDF8" style={{ marginRight: 6 }} />
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    {isCoastal(activeRegion) ? 'Ocean' : 'River'} Brain Memory Logs
                  </Text>
                </View>
                <View style={styles.historyBox}>
                  {warRoomLogs.length > 0 ? (
                    warRoomLogs.map((log, idx) => (
                      <Text key={idx} style={styles.historyLogText}>
                        {log.agent} ➔ {log.message}
                      </Text>
                    ))
                  ) : (
                    selectedNode.details.historyLogs?.map((log, idx) => (
                      <Text key={idx} style={styles.historyLogText}>
                        {log}
                      </Text>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* Ask AI Command Center Button */}
            <TouchableOpacity 
              style={[styles.aiCommandBtn, { backgroundColor: colors.accent, marginTop: 18 }]}
              onPress={() => router.push({
                pathname: '/report/command-center',
                params: { prefill: `Explain the relationship between ${selectedNode.details.title} and other ocean hazard factors.` }
              })}
            >
              <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.aiCommandBtnText}>Query Relation via Command Center AI</Text>
            </TouchableOpacity>
          </View>
        )}
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
  canvasCard: {
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative'
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  canvasTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700'
  },
  svg: {
    alignSelf: 'center'
  },
  tapPrompt: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600'
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20
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
  nodeTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6
  },
  nodeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600'
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  historyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12
  },
  historyLogText: {
    color: '#38BDF8',
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700'
  },
  aiCommandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  aiCommandBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});
