import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { api } from '../../services/api';
import {
  TrendingUp,
  MessageCircle,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Frown,
  Smile
} from 'lucide-react-native';

interface SocialSignal {
  _id: string;
  platform: string;
  postText: string;
  hazardKeywordsMatched: string[];
  sentimentScore: number;
  urgencyScore: number;
  region: string;
  postedAt: string;
}

export default function SocialSignalsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const colors = Theme[theme];
  const activeRegion = user?.region || 'India';

  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [volumeData, setVolumeData] = useState<{ label: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGlobalFallback, setIsGlobalFallback] = useState(false);

  const loadData = async () => {
    try {
      const response = await api.get<{ signals?: SocialSignal[]; usedFallback?: boolean }>(`/api/social-signals?region=${encodeURIComponent(activeRegion)}`);
      const isObjectResponse = !Array.isArray(response);
      const data: SocialSignal[] = isObjectResponse ? response.signals || [] : response;
      const usedFallback = isObjectResponse ? response.usedFallback ?? false : false;

      setSignals(data);
      setIsGlobalFallback(usedFallback);

      // Extract unique keywords
      const kwSet = new Set<string>();
      data.forEach((signal: SocialSignal) => signal.hazardKeywordsMatched.forEach(k => kwSet.add(k)));
      setKeywords(Array.from(kwSet));

      // Build a real-time volume chart from actual signal timestamps
      const counts: Record<string, number> = {};
      data.forEach((s: SocialSignal) => {
        const time = new Date(s.postedAt);
        const hourStr = `${time.getHours().toString().padStart(2, '0')}:00`;
        counts[hourStr] = (counts[hourStr] || 0) + 1;
      });

      const formattedVolume = Object.keys(counts)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ label: key, count: counts[key] }));
      setVolumeData(formattedVolume);

    } catch (err) {
      console.warn('Error loading social signals:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeRegion]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Triggers the backend NLP scoring pipeline live
  const triggerNLPAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await api.post('/api/social-signals/analyze', {});
      loadData();
    } catch (err) {
      console.warn('NLP pipeline trigger failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 75) return colors.danger;
    if (score >= 40) return colors.warning;
    return colors.textSecondary;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Find max volume to scale custom chart bars
  const maxVolume = Math.max(...volumeData.map(d => d.count), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Description & Re-analyze action */}
      <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.topHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>NLP Ingestion Engine</Text>
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
            onPress={triggerNLPAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Analyze</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDesc}>
          This panel processes actual citizen hazard reports and local social signals in {activeRegion}. Urgent posts are flagged based on sentiment, keyword density, and incident severity.
        </Text>
      </View>

      {/* Custom Sleek Pure React Native Chart */}
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('social.volumeTitle')}</Text>
        <View style={styles.barChartRow}>
          {volumeData.map((data, idx) => {
            const barHeight = (data.count / maxVolume) * 120;
            return (
              <View key={idx} style={styles.chartCol}>
                <Text style={[styles.barCount, { color: colors.text }]}>{data.count}</Text>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: Math.max(barHeight, 8),
                      backgroundColor: colors.accent,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6
                    }
                  ]}
                />
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{data.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Trending Keywords badge list */}
      <View style={[styles.trendsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <TrendingUp size={16} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
            {t('social.trendingKeywords')}
          </Text>
        </View>
        <View style={styles.keywordsGrid}>
          {keywords.map((kw) => (
            <View key={kw} style={[styles.kwChip, { backgroundColor: colors.background }]}>
              <Text style={[styles.kwText, { color: colors.primary }]}>#{kw}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Signals Feed list */}
      <Text style={[styles.feedTitle, { color: colors.text }]}>{t('social.liveFeed')}</Text>
      
      {isGlobalFallback && (
        <View style={[styles.fallbackBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Showing latest global social signals because no local region feed was available.</Text>
        </View>
      )}
      {signals.length > 0 ? (
        signals.map((item) => (
          <View
            key={item._id}
            style={[
              styles.feedCard,
              { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
          >
            <View style={styles.feedCardHeader}>
              <View style={styles.platformRow}>
                {item.platform === 'twitter' ? (
                  <MessageSquare size={16} color="#1DA1F2" />
                ) : (
                  <MessageCircle size={16} color="#1877F2" />
                )}
                <Text style={[styles.platformText, { color: colors.textSecondary }]}>
                  {item.platform.toUpperCase()} · {item.region}
                </Text>
              </View>

              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgencyScore) }]}>
                <ShieldAlert size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.urgencyText}>
                  {t('social.urgencyBadge')}: {item.urgencyScore}
                </Text>
              </View>
            </View>

            <Text style={[styles.postText, { color: colors.text }]}>{item.postText}</Text>

            <View style={styles.feedCardFooter}>
              {/* Sentiment Indicator */}
              <View style={styles.sentimentRow}>
                {item.sentimentScore < 0 ? (
                  <>
                    <Frown size={14} color={colors.danger} />
                    <Text style={[styles.sentimentText, { color: colors.danger }]}>
                      Negative Sentiment ({item.sentimentScore})
                    </Text>
                  </>
                ) : (
                  <>
                    <Smile size={14} color={colors.success} />
                    <Text style={[styles.sentimentText, { color: colors.success }]}>
                      Neutral/Positive ({item.sentimentScore})
                    </Text>
                  </>
                )}
              </View>
              
              {/* Keywords Tagged */}
              <View style={styles.keywordTagsRow}>
                {item.hazardKeywordsMatched.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.emptyFeed, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary }}>No social signals detected in this region.</Text>
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
    alignItems: 'center'
  },
  topCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    marginBottom: 14
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20
  },
  chartContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    height: 160
  },
  chartCol: {
    alignItems: 'center',
    flex: 1
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  chartBar: {
    width: '45%'
  },
  barLabel: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500'
  },
  trendsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  keywordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  kwChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  kwText: {
    fontSize: 12,
    fontWeight: '600'
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12
  },
  feedCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10
  },
  urgencyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  feedCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10
  },
  fallbackBanner: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12
  },
  fallbackText: {
    fontSize: 13,
    lineHeight: 18
  },
  sentimentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sentimentText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4
  },
  keywordTagsRow: {
    flexDirection: 'row'
  },
  tagChip: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 6
  },
  tagChipText: {
    fontSize: 9,
    color: '#334155',
    fontWeight: '700'
  },
  emptyFeed: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center'
  }
});
