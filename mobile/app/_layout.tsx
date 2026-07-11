import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Custom Context Providers
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { OfflineReportProvider } from '../contexts/OfflineReportContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading keeps index or tabs active
  initialRouteName: 'index',
};

// Prevent splash screen from hiding early
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OfflineReportProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
          </OfflineReportProvider>
        </AuthProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="report" 
        options={{ 
          presentation: 'modal', 
          headerShown: false 
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
