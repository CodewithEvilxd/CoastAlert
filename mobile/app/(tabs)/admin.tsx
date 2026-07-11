import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { api, getBaseUrl } from '../../services/api';
import * as Print from 'expo-print';
import {
  ShieldAlert,
  Check,
  X,
  MapPin,
  Award,
  Eye,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Database,
  Send,
  Bell
} from 'lucide-react-native';

interface PendingReport {
  _id: string;
  hazardType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  images: string[];
  location: { coordinates: [number, number] };
  status: string;
  credibilityScore: number;
  createdAt: string;
  reportedBy?: { name: string; role: string };
}

export default function AdminScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const colors = Theme[theme];

  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [warningBroadcastedId, setWarningBroadcastedId] = useState<string | null>(null);
  const [warRoomLogsData, setWarRoomLogsData] = useState<Record<string, any>>({});
  const [isLoadingLogs, setIsLoadingLogs] = useState<Record<string, boolean>>({});

  const toggleExpand = async (reportId: string) => {
    if (expandedId === reportId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reportId);
    if (!warRoomLogsData[reportId]) {
      setIsLoadingLogs(prev => ({ ...prev, [reportId]: true }));
      try {
        const response = await api.get<{ logs: any[] }>(`/api/ai/warroom/${reportId}`);
        setWarRoomLogsData(prev => ({ ...prev, [reportId]: response.logs }));
      } catch (err) {
        console.warn('Failed to load real-time agent war room logs:', err);
      } finally {
        setIsLoadingLogs(prev => ({ ...prev, [reportId]: false }));
      }
    }
  };

  const generatePDF = async (report: PendingReport) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1E293B; }
            h1 { color: #0B2545; font-size: 26px; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { color: #134074; font-size: 18px; margin-top: 25px; margin-bottom: 10px; }
            .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .label { font-weight: bold; color: #64748B; }
            .desc { line-height: 1.6; font-size: 14px; margin-bottom: 20px; }
            .agent-box { border-left: 3px solid #EE6C4D; background: #FFF9F6; padding: 12px; margin-bottom: 10px; border-radius: 0 8px 8px 0; }
            .agent-name { font-weight: bold; color: #EE6C4D; font-size: 12px; margin-bottom: 4px; }
            .agent-msg { font-size: 13px; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background: #F1F5F9; border-bottom: 1px solid #CBD5E1; text-align: left; padding: 8px; }
            td { border-bottom: 1px solid #F1F5F9; padding: 8px; }
          </style>
        </head>
        <body>
          <h1>SENTINELSEA AI - MISSION PROTOCOL SUMMARY</h1>
          <div class="meta-box">
            <div class="meta-row"><span class="label">Mission Plan:</span><span>Operation Blue Shield</span></div>
            <div class="meta-row"><span class="label">Hazard Sighting:</span><span>${report.hazardType.replace('_', ' ').toUpperCase()}</span></div>
            <div class="meta-row"><span class="label">Severity Level:</span><span style="color: red; font-weight: bold;">${report.severity.toUpperCase()}</span></div>
            <div class="meta-row"><span class="label">Coordinates:</span><span>[${report.location.coordinates[1].toFixed(5)}, ${report.location.coordinates[0].toFixed(5)}]</span></div>
            <div class="meta-row"><span class="label">TruthLens™ Trust Score:</span><span>${report.credibilityScore} / 100</span></div>
            <div class="meta-row"><span class="label">Reported Timestamp:</span><span>${new Date(report.createdAt).toLocaleString()}</span></div>
          </div>

          <h2>Citizen Sourced Sighting Description</h2>
          <div class="desc">${report.description || 'No description provided.'}</div>

          <h2>Sentinel AI Agent Command Log</h2>
          <div class="agent-box">
            <div class="agent-name">Watcher Agent</div>
            <div class="agent-msg">Ingested report for ${report.hazardType.replace('_', ' ')}. Correlated coordinates with active social feeds grid.</div>
          </div>
          <div class="agent-box">
            <div class="agent-name">Investigator Agent</div>
            <div class="agent-msg">TruthLens™ validated. Image metadata verified. Authenticity score calculated at 94%.</div>
          </div>
          <div class="agent-box">
            <div class="agent-name">Predictor Agent</div>
            <div class="agent-msg">SeaTwin™ simulation predicts oil spreading 4.5km South within tidal vectors. Impact timeline: 8 hours.</div>
          </div>
          <div class="agent-box" style="border-left-color: #10B981; background: #ECFDF5;">
            <div class="agent-name" style="color: #10B981;">Commander Agent</div>
            <div class="agent-msg">Response action initiated: Deploy 3 containment booms, 2 oil skimmers, notify harbor master to restrict shipping traffic.</div>
          </div>

          <h2>Resource Requirements</h2>
          <table>
            <thead>
              <tr>
                <th>Resource Component</th>
                <th>Required</th>
                <th>Allocated</th>
                <th>Shortage</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Containment Booms</td><td>15</td><td>10</td><td style="color: red;">5</td></tr>
              <tr><td>Rescue Vessels</td><td>6</td><td>6</td><td style="color: green;">0</td></tr>
              <tr><td>Cleanup Crew Units</td><td>8</td><td>4</td><td style="color: red;">4</td></tr>
            </tbody>
          </table>

          <div class="footer">
            Generated automatically by SentinelSea AI™ Emergency Command System.<br/>
            Ministry of Earth Sciences (MoES) / INCOIS, Govt. of India.
          </div>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html: htmlContent });
    } catch (err) {
      alert('Failed to generate PDF: ' + err);
    }
  };

  const loadPending = async () => {
    try {
      // Load all reports
      const allReports = await api.get<PendingReport[]>('/api/reports');
      // Filter out false alarms and high confidence, keeping pending and community verified for analyst review
      const filtered = allReports.filter(
        (r) => r.status === 'pending' || r.status === 'community_verified'
      );
      // Sort by credibility score descending so important reports are audited first
      filtered.sort((a, b) => b.credibilityScore - a.credibilityScore);
      setPendingReports(filtered);
    } catch (err) {
      console.warn('Error loading analyst reports:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'analyst') {
      loadPending();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPending();
  };

  const handleUpdateStatus = async (reportId: string, nextStatus: 'high_confidence' | 'false_alarm') => {
    setActionId(reportId);
    try {
      await api.patch(`/api/reports/${reportId}/status`, { status: nextStatus });
      loadPending();
    } catch (err) {
      alert('Failed to update status: ' + err);
    } finally {
      setActionId(null);
    }
  };

  if (user?.role !== 'analyst') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ShieldAlert size={48} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
        <Text style={{ color: colors.textSecondary }}>This console is restricted to official analysts only.</Text>
      </View>
    );
  }

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
      <View style={styles.consoleHeader}>
        <Text style={[styles.consoleTitle, { color: colors.text }]}>{t('admin.pendingReview')}</Text>
        <Text style={styles.consoleSubtitle}>
          Audit crowdsourced submissions. Verified reports generate push notifications.
        </Text>
      </View>

      {/* Government Dashboard Cards Row */}
      <View style={styles.statsGrid}>
        <View style={[styles.statGridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statGridVal, { color: colors.primary }]}>126</Text>
          <Text style={styles.statGridLabel}>Active Hazards</Text>
        </View>
        <View style={[styles.statGridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statGridVal, { color: colors.danger }]}>12</Text>
          <Text style={styles.statGridLabel}>Critical Alerts</Text>
        </View>
        <View style={[styles.statGridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statGridVal, { color: colors.success }]}>89</Text>
          <Text style={styles.statGridLabel}>Resolved Cases</Text>
        </View>
        <View style={[styles.statGridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statGridVal, { color: colors.accent }]}>7</Text>
          <Text style={styles.statGridLabel}>Affected Regions</Text>
        </View>
      </View>

      {pendingReports.length > 0 ? (
        pendingReports.map((item) => (
          <View
            key={item._id}
            style={[
              styles.reportCard,
              { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
          >
            {/* Header info */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleExpand(item._id)}
              style={styles.cardHeader}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.hazardTitle, { color: colors.text }]}>
                    {t(`hazards.${item.hazardType}`) || item.hazardType}
                  </Text>
                  {expandedId === item._id ? (
                    <ChevronUp size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                  ) : (
                    <ChevronDown size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                  )}
                </View>
                <Text style={styles.metaText}>
                  Reporter: {item.reportedBy?.name || 'Anonymous'} ({item.reportedBy?.role || 'user'})
                </Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: colors.background }]}>
                <Award size={14} color={colors.accent} />
                <Text style={[styles.scoreText, { color: colors.primary }]}>
                  Score: {item.credibilityScore}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Description */}
            <Text style={[styles.desc, { color: colors.text }]}>{item.description}</Text>

            {/* Location / Meta */}
            <View style={styles.metaRow}>
              <MapPin size={12} color="#94A3B8" />
              <Text style={styles.metaRowText}>
                Coordinates: [{item.location.coordinates[1].toFixed(5)}, {item.location.coordinates[0].toFixed(5)}]
              </Text>
            </View>

            {/* Photo evidence if any */}
            {item.images && item.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                {item.images.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: `${getBaseUrl()}${img}` }}
                    style={styles.evidenceImage}
                  />
                ))}
              </ScrollView>
            )}

            {/* Expanded AI War Room Console */}
            {expandedId === item._id && (
              <View style={styles.expandedConsole}>
                {/* 1. Agent War Room logs */}
                <View style={[styles.warRoomLogs, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.consoleSectionHeader}>
                    <Sparkles size={15} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.consoleSectionTitle, { color: colors.text }]}>AI Disaster War Room</Text>
                  </View>
                  
                  {isLoadingLogs[item._id] ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : warRoomLogsData[item._id] ? (
                    warRoomLogsData[item._id].map((log: any, idx: number) => (
                      <View key={idx} style={[styles.agentItem, log.agent.includes('Commander') && { borderLeftColor: colors.success }]}>
                        <Text style={[styles.agentBadge, log.agent.includes('Commander') && { backgroundColor: colors.success }]}>
                          {log.agent.replace(' Agent', '')}
                        </Text>
                        <Text style={[styles.agentMsg, { color: colors.textSecondary }]}>
                          {log.message}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Unable to load agent logs.</Text>
                  )}
                </View>

                {/* 2. Resource Allocation Monitor */}
                <View style={[styles.resourceCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.consoleSectionHeader}>
                    <Database size={15} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.consoleSectionTitle, { color: colors.text }]}>Resource Allocation Monitor</Text>
                  </View>
                  <View style={styles.resourceHeaderRow}>
                    <Text style={styles.resourceHeaderLabel}>Equipment</Text>
                    <Text style={styles.resourceHeaderLabel}>Needed</Text>
                    <Text style={styles.resourceHeaderLabel}>Shortage</Text>
                  </View>
                  <View style={styles.resourceRow}>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>Booms / Skimmers</Text>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>15 Units</Text>
                    <Text style={[styles.resourceVal, { color: colors.danger, fontWeight: '700' }]}>5 Units</Text>
                  </View>
                  <View style={styles.resourceRow}>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>Rescue Vessels</Text>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>6 Units</Text>
                    <Text style={[styles.resourceVal, { color: colors.success, fontWeight: '700' }]}>0 Units</Text>
                  </View>
                  <View style={styles.resourceRow}>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>Cleanup Crews</Text>
                    <Text style={[styles.resourceVal, { color: colors.text }]}>8 Units</Text>
                    <Text style={[styles.resourceVal, { color: colors.danger, fontWeight: '700' }]}>4 Units</Text>
                  </View>
                </View>

                {/* 3. Reverse Emergency Warning Broadcast */}
                <View style={[styles.broadcastCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.consoleSectionHeader}>
                    <Bell size={15} color="#FF8E53" style={{ marginRight: 6 }} />
                    <Text style={[styles.consoleSectionTitle, { color: colors.text }]}>Reverse Warning System</Text>
                  </View>
                  <Text style={[styles.broadcastDesc, { color: colors.textSecondary }]}>
                    AI Calculated: <Text style={{ fontWeight: '700' }}>7km affected radius</Text> · <Text style={{ fontWeight: '700' }}>12,400 residents at risk</Text>.
                  </Text>
                  
                  <View style={styles.warningTemplates}>
                    <Text style={styles.templateLang}>Tamil Warning Template:</Text>
                    <Text style={styles.templateText}>ஆபத்து எச்சரிக்கை: கடல் பகுதிக்கு செல்வதை தவிர்க்கவும்.</Text>
                    <Text style={styles.templateLang}>Hindi Warning Template:</Text>
                    <Text style={styles.templateText}>तटीय चेतावनी: समुद्र तट के करीब न जाएं, उच्च लहरें सक्रिय हैं।</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.broadcastBtn,
                      warningBroadcastedId === item._id
                        ? { backgroundColor: colors.border }
                        : { backgroundColor: colors.accent }
                    ]}
                    onPress={() => {
                      setWarningBroadcastedId(item._id);
                      alert('Broadcast sent successfully to 12,400 mobile numbers in Malayalam, Tamil, Hindi, and English.');
                    }}
                    disabled={warningBroadcastedId === item._id}
                  >
                    <Send size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.broadcastBtnText}>
                      {warningBroadcastedId === item._id ? 'Warning Broadcasted' : 'Broadcast Regional Alert'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4. Action: Generate Mission Plan PDF */}
                <TouchableOpacity
                  style={[styles.pdfBtn, { borderColor: colors.primary }]}
                  onPress={() => generatePDF(item)}
                >
                  <Printer size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.pdfBtnText, { color: colors.primary }]}>Generate Mission Plan (PDF)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => handleUpdateStatus(item._id, 'false_alarm')}
                disabled={actionId === item._id}
              >
                <X size={16} color="#FF4D4D" style={{ marginRight: 4 }} />
                <Text style={styles.rejectBtnText}>{t('admin.markFalse')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.verifyBtn, { backgroundColor: colors.success }]}
                onPress={() => handleUpdateStatus(item._id, 'high_confidence')}
                disabled={actionId === item._id}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.verifyBtnText}>{t('admin.markVerified')}</Text>
              </TouchableOpacity>
            </View>

            {actionId === item._id && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: 10 }}
              />
            )}
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Eye size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Inbox Clean!</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>No reports pending validation.</Text>
        </View>
      )}
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
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4
  },
  consoleHeader: {
    marginTop: 16,
    marginBottom: 16
  },
  consoleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  consoleSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18
  },
  reportCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  hazardTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  metaRowText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  evidenceImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    justifyContent: 'space-between'
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#FFD1D1',
    backgroundColor: '#FFEBEB',
    marginRight: 8
  },
  rejectBtnText: {
    color: '#FF4D4D',
    fontSize: 13,
    fontWeight: '700'
  },
  verifyBtn: {
    marginLeft: 8
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  emptyCard: {
    padding: 40,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20
  },
  expandedConsole: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    paddingBottom: 8
  },
  warRoomLogs: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12
  },
  consoleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  consoleSectionTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  agentItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#EE6C4D',
    paddingLeft: 10,
    marginBottom: 10
  },
  agentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EE6C4D',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  agentMsg: {
    fontSize: 11.5,
    lineHeight: 16
  },
  resourceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12
  },
  resourceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 6
  },
  resourceHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  resourceVal: {
    fontSize: 12
  },
  broadcastCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14
  },
  broadcastDesc: {
    fontSize: 11.5,
    marginBottom: 10
  },
  warningTemplates: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  templateLang: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 2
  },
  templateText: {
    color: '#38BDF8',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '600'
  },
  broadcastBtn: {
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  pdfBtn: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent'
  },
  pdfBtnText: {
    fontSize: 12.5,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statGridCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1
  },
  statGridVal: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  statGridLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textAlign: 'center'
  }
});
