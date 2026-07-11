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
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Theme } from '../../constants/theme';
import { AlertCircle, Phone, Lock } from 'lucide-react-native';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!phone || !password) {
      setErrorMsg(t('auth.validationError'));
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, password);
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
          <View style={styles.inner}>
            {/* Header Branding */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>CA</Text>
              </View>
              <Text style={styles.appName}>{t('appName')}</Text>
              <Text style={styles.tagline}>{t('tagline')}</Text>
            </View>

            {/* Input Form */}
            <View style={styles.form}>
              {errorMsg && (
                <View style={styles.errorAlert}>
                  <AlertCircle size={20} color={Theme.light.danger} style={styles.errorIcon} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

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

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('auth.login')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Route Toggles */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.replace('/(auth)/signup')} style={{ marginBottom: 12 }}>
                <Text style={styles.footerLink}>{t('auth.noAccount')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.replace('/report')}>
                <Text style={[styles.footerLink, { color: '#EE6C4D' }]}>
                  Report Hazard Anonymously
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0B2545',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  logoText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0B2545',
    marginBottom: 8
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10
  },
  form: {
    width: '100%',
    marginBottom: 40
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEB',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20
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
    marginBottom: 16,
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
    marginBottom: 10
  },
  footerLink: {
    fontSize: 14,
    color: '#134074',
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});
