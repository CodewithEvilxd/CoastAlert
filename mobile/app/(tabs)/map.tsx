import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  TextInput
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { api, getBaseUrl } from '../../services/api';
import { DEFAULT_INDIA_CENTER, resolveRegionCoordinates, getRegionSuggestions } from '../../utils/regionUtils';
import {
  Filter,
  MapPin,
  Maximize2,
  Calendar,
  AlertTriangle,
  Heart,
  CheckCircle,
  X,
  TrendingUp,
  Clock,
  BrainCircuit,
  Waves,
  ShieldAlert,
  Search
} from 'lucide-react-native';

// Dynamically import MapView / WebView on native to prevent web crash
let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps.MapView || Maps;
    Marker = Maps.Marker;
    UrlTile = Maps.UrlTile;
    
    WebView = require('react-native-webview').WebView;
  } catch (err) {
    console.warn('Failed to load native map modules:', err);
  }
}

const { width, height } = Dimensions.get('window');

const HAZARD_TYPES = [
  'all',
  'tsunami',
  'high_waves',
  'coastal_flooding',
  'storm_surge',
  'oil_spill',
  'unusual_sea_behavior',
  'marine_debris',
  'rip_current',
  'other'
];

interface HazardReport {
  _id: string;
  hazardType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  images: string[];
  location: { coordinates: [number, number] }; // [lng, lat]
  status: string;
  credibilityScore: number;
  confirmations: string[];
  reportedBy?: { name: string; role: string };
  createdAt: string;
}

export default function MapScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const colors = Theme[theme];
  const mapRef = useRef<any>(null);
  const webviewRef = useRef<any>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [economyData, setEconomyData] = useState<Record<string, any>>({});
  const [isLoadingEconomy, setIsLoadingEconomy] = useState<Record<string, boolean>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedRegions, setSuggestedRegions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const coords = await resolveRegionCoordinates(searchQuery);
      setLocation(coords);

      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({
          type: 'RECENTER',
          payload: coords
        }));
      }
    } catch (err) {
      console.warn('Region search failed:', err);
      alert('Location not found. Try searching for Goa, Kolkata, Chennai, or other coastal cities.');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchEconomyProjections = async (reportId: string) => {
    if (economyData[reportId]) return;
    setIsLoadingEconomy(prev => ({ ...prev, [reportId]: true }));
    try {
      const data = await api.get<any>(`/api/ai/economy/${reportId}`);
      setEconomyData(prev => ({ ...prev, [reportId]: data }));
    } catch (err) {
      console.warn('Failed to load real-time economy calculations:', err);
    } finally {
      setIsLoadingEconomy(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const getMapCenter = () => {
    if (selectedReport) {
      return {
        lat: selectedReport.location.coordinates[1],
        lng: selectedReport.location.coordinates[0]
      };
    }
    if (location) {
      return location;
    }
    if (user?.savedLocation) {
      return user.savedLocation;
    }
    return DEFAULT_INDIA_CENTER;
  };

  const updateSuggestions = (query: string) => {
    setSearchQuery(query);
    setSuggestedRegions(getRegionSuggestions(query));
  };

  const selectSuggestion = async (region: string) => {
    setSearchQuery(region);
    setSuggestedRegions([]);
    try {
      const coords = await resolveRegionCoordinates(region);
      setLocation(coords);
      if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({ type: 'RECENTER', payload: coords }));
      }
    } catch (err) {
      console.warn('Suggestion lookup failed:', err);
    }
  };

  useEffect(() => {
    if (selectedReport) {
      fetchEconomyProjections(selectedReport._id);
    }
  }, [selectedReport]);

  // Filters state
  const [filterType, setFilterType] = useState('all');
  const [filterTime, setFilterTime] = useState('7d'); // default 7 days
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const getEconomicProjections = (report: HazardReport) => {
    let fishing = 0, tourism = 0, infra = 0;
    const sev = report.severity;
    if (report.hazardType === 'oil_spill') {
      if (sev === 'low') { fishing = 1000000; tourism = 500000; }
      else if (sev === 'medium') { fishing = 5000000; tourism = 2000000; }
      else if (sev === 'high') { fishing = 12000000; tourism = 4000000; }
      else { fishing = 23000000; tourism = 8000000; }
    } else if (report.hazardType === 'coastal_flooding' || report.hazardType === 'storm_surge') {
      if (sev === 'low') { infra = 1500000; fishing = 500000; }
      else if (sev === 'medium') { infra = 6000000; fishing = 2000000; }
      else if (sev === 'high') { infra = 11000000; fishing = 4000000; }
      else { infra = 24000000; fishing = 8000000; tourism = 3000000; }
    } else {
      if (sev === 'low') { infra = 200000; }
      else if (sev === 'medium') { infra = 1000000; }
      else if (sev === 'high') { infra = 3500000; }
      else { infra = 8500000; }
    }
    const total = fishing + tourism + infra;
    const savings = Math.round(total * 0.6);
    return { fishing, tourism, infra, total, savings };
  };

  const resolveSearchRegionCoordinates = async (regionName: string) => {
    return resolveRegionCoordinates(regionName);
  };

  const isCoordinatesInIndia = (lat: number, lng: number) => {
    return lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0;
  };

  const fetchLocationAndData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low
          });
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          
          // Verify if the GPS coordinates are in India (otherwise it is default US Emulator mock GPS)
          if (isCoordinatesInIndia(lat, lng)) {
            setLocation({ lat, lng });
            return;
          }
        } catch (gpsError) {
          console.log('Map GPS query failed, falling back to geocoding:', gpsError);
        }
      }

      // Fallback: Geocode user's active home region (e.g. Patna, Bihar)
      if (user?.region) {
        const coords = await resolveRegionCoordinates(user.region);
        setLocation(coords);
      } else {
        setLocation(DEFAULT_INDIA_CENTER);
      }
    } catch (err) {
      console.warn('Location initialization failed:', err);
      if (user?.region) {
        const coords = await resolveRegionCoordinates(user.region);
        setLocation(coords);
      } else {
        setLocation(DEFAULT_INDIA_CENTER);
      }
    }
  };

  const loadReports = async () => {
    if (!location) return;
    try {
      let endpoint = `/api/reports?timeRange=${filterTime}`;
      if (filterType !== 'all') {
        endpoint += `&hazardType=${filterType}`;
      }
      
      const data = await api.get<HazardReport[]>(endpoint);
      setReports(data);
      
      // If selectedReport exists, update its details in the sheet (e.g. confirmations count)
      if (selectedReport) {
        const updated = data.find(r => r._id === selectedReport._id);
        if (updated) {
          setSelectedReport(updated);
        }
      }
    } catch (err) {
      console.warn('Error loading reports on map:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationAndData();
  }, []);

  useEffect(() => {
    if (location) {
      loadReports();
      const interval = setInterval(() => {
        loadReports();
      }, 5000); // Sync map markers and reports in real-time every 5 seconds
      return () => clearInterval(interval);
    }
  }, [location?.lat, location?.lng, filterType, filterTime]);

  useFocusEffect(
    React.useCallback(() => {
      fetchLocationAndData();
    }, [user?.region])
  );

  const recenter = () => {
    if (location) {
      if (mapRef.current && mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion({
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
      } else if (webviewRef.current) {
        webviewRef.current.postMessage(JSON.stringify({
          type: 'RECENTER',
          payload: { lat: location.lat, lng: location.lng }
        }));
      }
    }
  };

  // Perform "I saw this too" community confirmation
  const handleConfirm = async (reportId: string) => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const updated = await api.post<HazardReport>(`/api/reports/${reportId}/confirm`, {});
      setSelectedReport(updated);
      // Reload reports to update all pins
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Already confirmed or failed to confirm.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return colors.danger;
    if (severity === 'high') return '#FF8E53';
    if (severity === 'medium') return colors.warning;
    return colors.success;
  };

  const getSeverityBadgeColor = (severity: string) => {
    if (severity === 'critical') return '#FFEBEB';
    if (severity === 'high') return '#FFEFE6';
    if (severity === 'medium') return '#FFF9E6';
    return '#E6F9F6';
  };

  const getFormatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || !location) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Acquiring Live Coordinates...</Text>
      </View>
    );
  }

  // Check if we are running in Web environment
  const isWeb = Platform.OS === 'web';
  const mapCenter = getMapCenter();

  return (
    <View style={styles.container}>
      {/* Floating Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search any India location (e.g. Goa, Kochi)..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={updateSuggestions}
          onSubmitEditing={handleSearch}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCapitalize="words"
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSuggestedRegions([]);
            }} style={{ padding: 4 }}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )
        )}
      </View>
      {suggestedRegions.length > 0 && (
        <View style={[styles.suggestionsDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {suggestedRegions.map((region) => (
            <TouchableOpacity
              key={region}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(region)}
            >
              <Text style={[styles.suggestionText, { color: colors.text }]}>{region}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!isWeb && WebView ? (
        <WebView
          ref={webviewRef}
          style={styles.map}
          originWhitelist={['*']}
          source={{
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; }
    html, body, #map { height: 100%; width: 100vw; background: #0F172A; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false
    }).setView([${mapCenter.lat}, ${mapCenter.lng}], 12);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // User location ring
    L.circle([${location.lat}, ${location.lng}], {
      color: '#38BDF8',
      fillColor: '#38BDF8',
      fillOpacity: 0.3,
      radius: 400
    }).addTo(map);

    const reports = ${JSON.stringify(reports)};
    reports.forEach(r => {
      const lat = r.location.coordinates[1];
      const lng = r.location.coordinates[0];
      
      let color = '#10B981';
      if (r.severity === 'critical') color = '#EF4444';
      else if (r.severity === 'high') color = '#FF8E53';
      else if (r.severity === 'medium') color = '#F59E0B';

      const marker = L.circleMarker([lat, lng], {
        radius: 12,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_REPORT', payload: r }));
      });
    });

    window.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'RECENTER') {
          map.setView([data.payload.lat, data.payload.lng], 13);
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
            `
          }}
          onMessage={(event: any) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'SELECT_REPORT') {
                setSelectedReport(data.payload);
              }
            } catch (err) {}
          }}
        />
      ) : (
        // Web fallback view for map preview
        <View style={[styles.webMapContainer, { backgroundColor: '#E2E8F0' }]}>
          <Text style={styles.webMapTitle}>Ocean Hazard Map Overview</Text>
          <Text style={styles.webMapSubtitle}>
            Showing {reports.length} hazards across India. (React Native Maps is active on Android/iOS)
          </Text>
          <ScrollView contentContainerStyle={styles.webGrid}>
            {reports.map((r) => (
              <TouchableOpacity
                key={r._id}
                style={[
                  styles.webReportPinCard,
                  {
                    borderLeftColor: getSeverityColor(r.severity),
                    backgroundColor: colors.surface
                  }
                ]}
                onPress={() => setSelectedReport(r)}
              >
                <View style={styles.webPinHeader}>
                  <Text style={[styles.webPinTitle, { color: colors.text }]}>
                    {t(`hazards.${r.hazardType}`) || r.hazardType}
                  </Text>
                  <Text style={[styles.webPinDist, { color: colors.textSecondary }]}>
                    [{r.location.coordinates[1].toFixed(4)}, {r.location.coordinates[0].toFixed(4)}]
                  </Text>
                </View>
                <Text style={styles.webPinDesc} numberOfLines={1}>
                  {r.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 2. Floating Filter Button & Panel */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={[styles.floatingFilterBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color="#FFFFFF" />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>

        {!isWeb && (
          <TouchableOpacity style={[styles.floatingRecenterBtn, { backgroundColor: '#FFFFFF' }]} onPress={recenter}>
            <Maximize2 size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Modal panel overlay */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.filterPanelHeader}>
            <Text style={[styles.filterPanelTitle, { color: colors.text }]}>Filter Map Hazards</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.filterLabel}>Hazard Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {HAZARD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  filterType === type ? { backgroundColor: colors.accent } : { backgroundColor: colors.background }
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[styles.chipText, filterType === type && { color: '#FFFFFF' }]}>
                  {type === 'all' ? 'All Types' : t(`hazards.${type}`) || type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Time Frame</Text>
          <View style={styles.timeFilterContainer}>
            {['24h', '7d', '30d'].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeTab,
                  filterTime === time ? { backgroundColor: colors.primary } : { backgroundColor: colors.background }
                ]}
                onPress={() => setFilterTime(time)}
              >
                <Text style={[styles.timeTabText, filterTime === time && { color: '#FFFFFF' }]}>
                  {time === '24h' ? 'Last 24 Hours' : time === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 3. Bottom Sheet details card when marker tapped */}
      {selectedReport && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityBadgeColor(selectedReport.severity) }
                ]}
              >
                <Text style={[styles.severityText, { color: getSeverityColor(selectedReport.severity) }]}>
                  {selectedReport.severity.toUpperCase()}
                </Text>
              </View>
              {selectedReport.status === 'high_confidence' && (
                <View style={[styles.statusBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.statusText}>HIGH CONFIDENCE</Text>
                </View>
              )}
              {selectedReport.status === 'community_verified' && (
                <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.statusText}>COMMUNITY VERIFIED</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t(`hazards.${selectedReport.hazardType}`) || selectedReport.hazardType}
            </Text>
            
            <Text style={styles.sheetReporter}>
              {t('map.reporter')}: {selectedReport.reportedBy?.name || 'Anonymous citizen'} ({selectedReport.reportedBy?.role || 'user'})
            </Text>
            
            <Text style={styles.sheetTime}>
              Reported on {getFormatDate(selectedReport.createdAt)}
            </Text>

            <Text style={[styles.sheetDesc, { color: colors.text }]}>
              {selectedReport.description}
            </Text>

            {/* Display Photos if uploaded */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                {selectedReport.images.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: `${getBaseUrl()}${img}` }}
                    style={styles.sheetImage}
                  />
                ))}
              </ScrollView>
            )}

            {/* Verification Stats & Community Confirm CTA */}
            <View style={[styles.verificationStats, { backgroundColor: colors.background }]}>
              <View style={styles.statLine}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.statLineText, { color: colors.text }]}>
                  Community confirmations count: {selectedReport.confirmations.length}
                </Text>
              </View>
              <View style={styles.statLine}>
                <AlertTriangle size={16} color={colors.primary} />
                <Text style={[styles.statLineText, { color: colors.text }]}>
                  Algorithmic Credibility Score: {selectedReport.credibilityScore} / 100
                </Text>
              </View>
            </View>

            {/* AI Simulations & Relation Graph buttons */}
            <View style={styles.actionShortcutsRow}>
              <TouchableOpacity
                style={[styles.actionShortcutBtn, { backgroundColor: colors.primary }]}
                onPress={() =>
                  router.push({
                    pathname: '/report/seatwin',
                    params: { 
                      type: selectedReport.hazardType, 
                      name: t(`hazards.${selectedReport.hazardType}`) || selectedReport.hazardType,
                      reportId: selectedReport._id
                    }
                  })
                }
              >
                <Waves size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionShortcutText}>SeaTwin AI™</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionShortcutBtn, { backgroundColor: colors.success }]}
                onPress={() => router.push({
                  pathname: '/report/knowledge-graph',
                  params: { reportId: selectedReport._id }
                })}
              >
                <BrainCircuit size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionShortcutText}>Ocean Memory</Text>
              </TouchableOpacity>
            </View>

            {/* Blue Economy Projections */}
            {(() => {
              const reportId = selectedReport._id;
              const eco = economyData[reportId];
              return (
                <View style={[styles.economyReportCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.economyHeader}>
                    <TrendingUp size={15} color="#FF8E53" style={{ marginRight: 6 }} />
                    <Text style={[styles.economyTitle, { color: colors.text }]}>Blue Economy Damage Forecast</Text>
                  </View>
                  
                  {isLoadingEconomy[reportId] ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                  ) : eco ? (
                    <>
                      {eco.losses.fishing > 0 && (
                        <View style={styles.lossRow}>
                          <Text style={styles.lossLabel}>Fishing Industry Loss:</Text>
                          <Text style={[styles.lossVal, { color: colors.text }]}>₹{(eco.losses.fishing / 100000).toFixed(1)} Lakhs</Text>
                        </View>
                      )}
                      {eco.losses.tourism > 0 && (
                        <View style={styles.lossRow}>
                          <Text style={styles.lossLabel}>Tourism Industry Loss:</Text>
                          <Text style={[styles.lossVal, { color: colors.text }]}>₹{(eco.losses.tourism / 100000).toFixed(1)} Lakhs</Text>
                        </View>
                      )}
                      {eco.losses.infrastructure > 0 && (
                        <View style={styles.lossRow}>
                          <Text style={styles.lossLabel}>Infrastructure Loss:</Text>
                          <Text style={[styles.lossVal, { color: colors.text }]}>₹{(eco.losses.infrastructure / 100000).toFixed(1)} Lakhs</Text>
                        </View>
                      )}
                      
                      <View style={[styles.lossRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4 }]}>
                        <Text style={[styles.lossLabel, { fontWeight: '700' }]}>Total Economic Impact:</Text>
                        <Text style={[styles.lossVal, { color: colors.danger, fontWeight: '800' }]}>
                          ₹{eco.losses.total >= 10000000 ? `${(eco.losses.total / 10000000).toFixed(2)} Cr` : `${(eco.losses.total / 100000).toFixed(1)} Lakhs`}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Unable to load economic metrics.</Text>
                  )}
                </View>
              );
            })()}

            {/* Swiggy-Style Status Timeline */}
            <View style={[styles.timelineCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>Disaster Response Timeline</Text>
              
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: colors.text }]}>Report Submitted</Text>
                  <Text style={styles.stepDesc}>Citizen reported via Sentinel App</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: colors.text }]}>Social Correlated</Text>
                  <Text style={styles.stepDesc}>15 tweets verified inside active grid</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor:
                        selectedReport.status === 'high_confidence' ||
                        selectedReport.status === 'community_verified' ||
                        selectedReport.status === 'action_taken'
                          ? colors.success
                          : '#CBD5E1'
                    }
                  ]}
                />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: colors.text }]}>TruthLens™ Verified</Text>
                  <Text style={styles.stepDesc}>Algorithmic credibility score verified</Text>
                </View>
              </View>

              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: selectedReport.status === 'action_taken' ? colors.success : '#CBD5E1' }
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: colors.text }]}>Action Dispatched</Text>
                  <Text style={styles.stepDesc}>Emergency command crew dispatched</Text>
                </View>
              </View>
            </View>

            {/* Community Confirmation button */}
            {user && (
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  selectedReport.confirmations.includes(user.id)
                    ? { backgroundColor: colors.border }
                    : { backgroundColor: colors.success }
                ]}
                onPress={() => handleConfirm(selectedReport._id)}
                disabled={selectedReport.confirmations.includes(user.id) || isConfirming}
              >
                {isConfirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Heart size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBtnText}>
                      {selectedReport.confirmations.includes(user.id)
                        ? t('map.alreadyVerified')
                        : t('map.verifyButton')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  map: {
    width: '100%',
    height: '100%'
  },
  webMapContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start'
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B2545',
    textAlign: 'center',
    marginBottom: 4
  },
  webMapSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20
  },
  webGrid: {
    paddingBottom: 120
  },
  searchBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0
  },
  webReportPinCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  webPinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  webPinTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  webPinDist: {
    fontSize: 12,
    fontFamily: 'monospace'
  },
  webPinDesc: {
    fontSize: 13,
    color: '#64748B'
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    zIndex: 110,
    borderRadius: 14,
    borderWidth: 1,
    maxHeight: 240,
    overflow: 'hidden'
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  floatingContainer: {
    position: 'absolute',
    top: 76,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  floatingFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  filterBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6
  },
  floatingRecenterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  filtersPanel: {
    position: 'absolute',
    top: 132,
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase'
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  timeFilterContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    padding: 3
  },
  timeTab: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  timeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 200
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetScroll: {
    flex: 1
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4
  },
  sheetReporter: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2
  },
  sheetTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12
  },
  sheetDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  sheetImage: {
    width: 140,
    height: 90,
    borderRadius: 8,
    marginRight: 10
  },
  verificationStats: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  statLineText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600'
  },
  confirmBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  actionShortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  actionShortcutBtn: {
    width: '48%',
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  actionShortcutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  economyReportCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  economyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  economyTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  lossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  lossLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  lossVal: {
    fontSize: 13,
    fontWeight: '700'
  },
  timelineCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16
  },
  timelineStep: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 20
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 10
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -6,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1
  },
  timelineContent: {
    flex: 1,
    marginLeft: 14
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  }
});
