import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Theme } from '../../constants/theme';
import { AlertCircle, User as UserIcon, Phone, Lock, MapPin } from 'lucide-react-native';

export default function Signup() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'volunteer'>('citizen');
  const [region, setRegion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const detectLiveLocation = async () => {
    setIsDetectingLocation(true);
    setErrorMsg(null);
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
                    setRegion(city);
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
        setRegion(cityDetected);
      } else {
        setErrorMsg('Could not detect location. Please type manually.');
      }
    } catch (err) {
      console.warn(err);
      setErrorMsg('Could not detect location. Please type manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSignup = async () => {
    setErrorMsg(null);
    if (!name || !phone || !password) {
      setErrorMsg(t('auth.validationError'));
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, phone, password, role, region);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.authFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
            {/* Header Branding */}
            <View style={styles.brandContainer}>
              <Text style={styles.title}>{t('auth.signup')}</Text>
              <Text style={styles.subtitle}>{t('tagline')}</Text>
            </View>

            {/* Input Form */}
            <View style={styles.form}>
              {errorMsg && (
                <View style={styles.errorAlert}>
                  <AlertCircle size={20} color={Theme.light.danger} style={styles.errorIcon} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <UserIcon size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.name')}
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Phone size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phone')}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Role Selection Segment */}
              <Text style={styles.label}>{t('auth.role')}</Text>
              <View style={styles.roleTabs}>
                <TouchableOpacity
                  style={[styles.roleTab, role === 'citizen' && styles.roleTabActive]}
                  onPress={() => setRole('citizen')}
                >
                  <Text style={[styles.roleTabText, role === 'citizen' && styles.roleTabActiveText]}>
                    {t('auth.roleCitizen')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, role === 'volunteer' && styles.roleTabActive]}
                  onPress={() => setRole('volunteer')}
                >
                  <Text style={[styles.roleTabText, role === 'volunteer' && styles.roleTabActiveText]}>
                    {t('auth.roleVolunteer')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Region Selection */}
              <Text style={styles.label}>{t('auth.region')}</Text>
              
              {/* Custom Region Input */}
              <View style={styles.regionInputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type city or beach (e.g. Goa, Kochi)"
                    placeholderTextColor="#94A3B8"
                    value={region}
                    onChangeText={setRegion}
                    autoCapitalize="words"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.detectBtn, isDetectingLocation && { opacity: 0.7 }]}
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

              <Text style={[styles.label, { marginTop: 16 }]}>Popular India locations</Text>
              <View style={styles.regionSelector}>
                {['Goa', 'Patna', 'Kolkata', 'Srinagar', 'Agra'].map((reg) => (
                  <TouchableOpacity
                    key={reg}
                    style={[styles.regionChip, region.toLowerCase() === reg.toLowerCase() && styles.regionChipActive]}
                    onPress={() => setRegion(reg)}
                  >
                    <Text
                      style={[
                        styles.regionChipText,
                        region.toLowerCase() === reg.toLowerCase() && styles.regionChipTextActive
                      ]}
                    >
                      {reg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('auth.signup')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}>{t('auth.haveAccount')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9'
  },
  keyboardView: {
    flex: 1
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 30
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B2545',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center'
  },
  form: {
    width: '100%'
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEB',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  errorIcon: {
    marginRight: 10
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4D',
    fontWeight: '500',
    flex: 1
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1D2A44',
    height: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    marginBottom: 8
  },
  roleTabs: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3
  },
  roleTab: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  roleTabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500'
  },
  roleTabActiveText: {
    color: '#0B2545',
    fontWeight: '600'
  },
  regionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  regionChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    marginBottom: 8
  },
  regionChipActive: {
    backgroundColor: '#0B2545',
    borderColor: '#0B2545'
  },
  regionChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500'
  },
  regionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  regionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  detectBtn: {
    backgroundColor: '#0B2545',
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  detectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B2545',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10
  },
  footerLink: {
    fontSize: 14,
    color: '#134074',
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});
