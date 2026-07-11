import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfflineReport } from '../../contexts/OfflineReportContext';
import { Theme } from '../../constants/theme';
import { api } from '../../services/api';
import {
  X,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CheckCircle
} from 'lucide-react-native';

// Dynamically import MapView / WebView on native to prevent web crash
let MapView: any = null;
let Marker: any = null;
let UrlTile: any = null;
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    const ImportedMapView = Maps.default || Maps.MapView || Maps;
    MapView = ImportedMapView;
    Marker = Maps.Marker || ImportedMapView.Marker || Maps.default?.Marker || Maps.MapView?.Marker;
    UrlTile = Maps.UrlTile || ImportedMapView.UrlTile || Maps.default?.UrlTile || Maps.MapView?.UrlTile;
  } catch (err) {
    console.warn('Failed to load react-native-maps:', err);
  }

  try {
    WebView = require('react-native-webview').WebView;
  } catch (err) {
    console.warn('Failed to load react-native-webview:', err);
  }
}

const { width } = Dimensions.get('window');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function ReportWizard() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isConnected, addToQueue } = useOfflineReport();
  const colors = Theme[theme];

  const [step, setStep] = useState(1);
  const [hazardType, setHazardType] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState(false);

  const mapRegion = coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }
    : {
        latitude: 22.0,
        longitude: 78.0,
        latitudeDelta: 5.0,
        longitudeDelta: 5.0
      };

  useEffect(() => {
    if (coords && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(mapRegion, 500);
    }
  }, [coords, mapRegion]);

  const shouldUseWebViewFallback = !MapView || !UrlTile || !Marker || !WebView || Platform.OS === 'web';

  const renderNativeMap = () => (
    <MapView
      ref={mapRef}
      style={styles.miniMap}
      initialRegion={mapRegion}
      region={mapRegion}
      onMapReady={() => setIsMapReady(true)}
    >
      {UrlTile ? (
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
      ) : null}
      <Marker
        coordinate={coords!}
        draggable
        onDragEnd={(e: any) => setCoords(e.nativeEvent.coordinate)}
      />
    </MapView>
  );

  const renderMapFallback = () => (
    <View style={[styles.miniMapPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      {WebView ? (
        <WebView
          style={styles.miniMap}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          source={{
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}</style>
                </head>
                <body>
                  <div id="map"></div>
                  <script>
                    const map = L.map('map').setView([${coords?.latitude}, ${coords?.longitude}], 13);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                    L.marker([${coords?.latitude}, ${coords?.longitude}]).addTo(map);
                  </script>
                </body>
              </html>
            `
          }}
        />
      ) : (
        <>
          <MapPin size={32} color={colors.accent} />
          <Text style={[styles.mapCoords, { color: colors.text }]}>Latitude: {coords?.latitude.toFixed(5)}, Longitude: {coords?.longitude.toFixed(5)}</Text>
        </>
      )}
    </View>
  );

  // 1. Auto fetch GPS on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      } else {
        // Fallback India center when GPS is unavailable
        setCoords({ latitude: 22.0, longitude: 78.0 });
      }
    } catch (err) {
      setCoords({ latitude: 22.0, longitude: 78.0 });
    } finally {
      setIsLocating(false);
    }
  };

  // 2. Capture Evidence (Camera or Gallery)
  const pickImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        alert('Permission to access camera/gallery is required.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 3 - images.length
          });

      if (!result.canceled && result.assets) {
        const selectedUris = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...selectedUris].slice(0, 3));
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 3. Report description input
  const handleSubmit = async () => {
    if (!hazardType || !coords) return;
    setIsSubmitting(true);
    
    const reportPayload = {
      hazardType,
      description,
      severity,
      latitude: coords.latitude,
      longitude: coords.longitude,
      images
    };

    if (!isConnected) {
      // Offline mode: Queue and save to AsyncStorage
      await addToQueue(reportPayload);
      alert(t('report.offlineQueued'));
      router.replace('/(tabs)');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create Multipart FormData
      const formData = new FormData();
      formData.append('hazardType', hazardType);
      formData.append('description', description);
      formData.append('severity', severity);
      formData.append('latitude', String(coords.latitude));
      formData.append('longitude', String(coords.longitude));

      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('images', {
          uri: imageUri,
          name: filename,
          type
        } as any);
      });

      // Submit via REST API
      await api.post('/api/reports', formData, true);
      alert(t('report.submitSuccess'));
      router.replace('/(tabs)');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report. Switched to offline queue.');
      // Auto-fallback queue on API error
      await addToQueue(reportPayload);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header Toolbar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.closeBtn}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('report.title')} (Step {step}/5)
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress Line */}
      <View style={styles.progressBar}>
        <View style={[styles.progressIndicator, { width: `${(step / 5) * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* STEP 1: SELECT HAZARD */}
        {step === 1 && (
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('report.selectType')}</Text>
            <View style={styles.grid}>
              {[
                { type: 'tsunami', label: t('hazards.tsunami') },
                { type: 'high_waves', label: t('hazards.high_waves') },
                { type: 'coastal_flooding', label: t('hazards.coastal_flooding') },
                { type: 'storm_surge', label: t('hazards.storm_surge') },
                { type: 'oil_spill', label: t('hazards.oil_spill') },
                { type: 'unusual_sea_behavior', label: t('hazards.unusual_sea_behavior') },
                { type: 'marine_debris', label: t('hazards.marine_debris') },
                { type: 'rip_current', label: t('hazards.rip_current') },
                { type: 'other', label: t('hazards.other') }
              ].map((item) => {
                const selected = hazardType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.gridCard,
                      { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border },
                      selected && styles.gridCardActive
                    ]}
                    onPress={() => setHazardType(item.type)}
                  >
                    <AlertTriangle size={32} color={selected ? colors.accent : colors.primary} />
                    <Text style={[styles.gridLabel, { color: selected ? colors.accent : colors.text }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: CAPTURE EVIDENCE */}
        {step === 2 && (
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('report.captureEvidence')}</Text>
            <Text style={styles.subtitle}>Upload visual proofs (Max 3 photos)</Text>
            
            <View style={styles.evidenceBtnRow}>
              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(true)}>
                <Camera size={24} color={colors.accent} />
                <Text style={[styles.mediaBtnText, { color: colors.text }]}>{t('report.takePhoto')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => pickImage(false)}>
                <ImageIcon size={24} color={colors.primary} />
                <Text style={[styles.mediaBtnText, { color: colors.text }]}>{t('report.chooseGallery')}</Text>
              </TouchableOpacity>
            </View>

            {/* Thumbnail previews */}
            <View style={styles.thumbnailRow}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity style={styles.deleteThumbnail} onPress={() => removeImage(idx)}>
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: MAP LOCATION */}
        {step === 3 && (
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('report.locationPin')}</Text>
            <Text style={styles.subtitle}>{t('report.gpsInstruction')}</Text>

            {isLocating && <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />}

            {coords && (
              <View style={styles.mapContainer}>
                {!isWeb && MapView ? (
                  <MapView
                    ref={mapRef}
                    style={styles.miniMap}
                    initialRegion={mapRegion}
                    region={mapRegion}
                    onMapReady={() => setIsMapReady(true)}
                  >
                    {UrlTile ? (
                      <UrlTile
                        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maximumZ={19}
                        flipY={false}
                      />
                    ) : null}
                    <Marker
                      coordinate={coords}
                      draggable
                      onDragEnd={(e: any) => setCoords(e.nativeEvent.coordinate)}
                    />
                  </MapView>
                ) : (
                  // Web map simulation
                  <View style={[styles.miniMapPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MapPin size={32} color={colors.accent} />
                    <Text style={[styles.mapCoords, { color: colors.text }]}>
                      Latitude: {coords.latitude.toFixed(5)}, Longitude: {coords.longitude.toFixed(5)}
                    </Text>
                    <TouchableOpacity style={[styles.recenterBtn, { backgroundColor: colors.primary }]} onPress={fetchLocation}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Refresh GPS</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* STEP 4: DESCRIBE & SEVERITY */}
        {step === 4 && (
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('report.describeHazard')}</Text>
            
            {/* Speech to text simulation */}
            <View style={styles.descInputContainer}>
              <TextInput
                style={[
                  styles.descInput,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }
                ]}
                placeholder={t('report.speakDescription')}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Severity slider selection */}
            <Text style={[styles.label, { color: colors.text }]}>{t('report.severityLevel')}</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map((sev) => {
                const active = severity === sev;
                let badgeColor = colors.success;
                if (sev === 'medium') badgeColor = colors.warning;
                if (sev === 'high') badgeColor = '#FF8E53';
                if (sev === 'critical') badgeColor = colors.danger;

                return (
                  <TouchableOpacity
                    key={sev}
                    style={[
                      styles.severityChip,
                      active ? { backgroundColor: badgeColor } : { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text style={[styles.severityChipText, active && { color: '#FFFFFF' }]}>
                      {t(`report.severity${sev.charAt(0).toUpperCase() + sev.slice(1)}`) || sev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('report.reviewSubmit')}</Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              
              {/* Type summary */}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Hazard Type:</Text>
                <Text style={[styles.reviewVal, { color: colors.text }]}>
                  {hazardType ? t(`hazards.${hazardType}`) : 'None'}
                </Text>
              </View>

              {/* Severity summary */}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Severity:</Text>
                <Text
                  style={[
                    styles.reviewVal,
                    {
                      color:
                        severity === 'critical' || severity === 'high'
                          ? colors.danger
                          : colors.warning,
                      fontWeight: '800'
                    }
                  ]}
                >
                  {severity.toUpperCase()}
                </Text>
              </View>

              {/* Coordinates summary */}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={[styles.reviewVal, { color: colors.text }]}>
                  {coords ? `[${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}]` : 'None'}
                </Text>
              </View>

              {/* Photos summary */}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Photos:</Text>
                <Text style={[styles.reviewVal, { color: colors.text }]}>
                  {images.length} uploaded
                </Text>
              </View>

              {/* Description summary */}
              <Text style={[styles.reviewLabel, { marginTop: 12 }]}>Description:</Text>
              <Text style={[styles.reviewDesc, { color: colors.text }]}>
                {description || 'No description provided.'}
              </Text>
            </View>

            {/* Offline warning banner if disconnected */}
            {!isConnected && (
              <View style={styles.offlineWarningBanner}>
                <Text style={styles.offlineWarningText}>
                  No internet connection. Submitting will save report to offline queue and auto-sync when online.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>{t('report.submitReport')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        {step > 1 ? (
          <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={prevStep}>
            <ChevronLeft size={20} color={colors.text} />
            <Text style={[styles.navBtnText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}

        {step < 5 ? (
          <TouchableOpacity
            style={[
              styles.navBtn,
              {
                backgroundColor:
                  (step === 1 && !hazardType) ? colors.border : colors.primary
              }
            ]}
            onPress={nextStep}
            disabled={step === 1 && !hazardType}
          >
            <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>Next</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>
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
  closeBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%'
  },
  progressIndicator: {
    height: '100%'
  },
  scrollInner: {
    padding: 24,
    paddingBottom: 100
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridCard: {
    width: '47%',
    height: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  gridCardActive: {
    backgroundColor: '#FFEFE6'
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center'
  },
  evidenceBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  mediaBtn: {
    width: '48%',
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6
  },
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  thumbnailWrapper: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
    position: 'relative'
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8
  },
  deleteThumbnail: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4D4D',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  mapContainer: {
    borderRadius: 14,
    height: 240,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  miniMap: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  miniMapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  mapCoords: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 12
  },
  recenterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18
  },
  descInputContainer: {
    position: 'relative',
    marginBottom: 20
  },
  descInput: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    paddingRight: 56,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top'
  },
  micBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  severityChip: {
    width: '23%',
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  severityChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  reviewLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  },
  reviewVal: {
    fontSize: 14,
    fontWeight: '700'
  },
  reviewDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  offlineWarningBanner: {
    backgroundColor: '#FFEFE6',
    borderWidth: 1,
    borderColor: '#FFD8C2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },
  offlineWarningText: {
    fontSize: 12,
    color: '#EE6C4D',
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center'
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30
  },
  submitBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderTopWidth: 1
  },
  navBtn: {
    width: 100,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 4
  }
});
