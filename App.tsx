import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from './src/navigation/AppShell';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ModeProvider } from './src/contexts/ModeContext';
import { Colors } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

// On web, useFonts can hang silently (no resolved, no error), so we cap the wait.
const IS_WEB = Platform.OS === 'web';

export default function App() {
  const [fontsLoaded, fontError] = useFonts(
    IS_WEB
      ? {} // skip custom font loading on web — use system fonts
      : {
          InstrumentSerif_400Regular,
          InstrumentSerif_400Regular_Italic,
          Geist_300Light,
          Geist_400Regular,
          Geist_500Medium,
          Geist_600SemiBold,
          JetBrainsMono_400Regular,
          JetBrainsMono_500Medium,
        },
  );

  // On web we pass {}, so useFonts resolves immediately (fontsLoaded=true).
  // On native, also accept a font-load error as "ready" to avoid infinite blank.
  const ready = fontsLoaded || !!fontError;

  const onLayout = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ModeProvider>
          <View style={{ flex: 1, backgroundColor: Colors.paper }} onLayout={onLayout}>
            <AppShell />
          </View>
        </ModeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
