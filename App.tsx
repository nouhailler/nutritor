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
import { useCallback, Component } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from './src/navigation/AppShell';
import { Colors } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

// On web, useFonts can hang silently (no resolved, no error), so we cap the wait.
const IS_WEB = Platform.OS === 'web';

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'red', marginBottom: 12 }}>
            Erreur de rendu
          </Text>
          <Text style={{ fontSize: 13, color: '#333', fontFamily: 'monospace' }}>
            {this.state.error.message}
          </Text>
          <Text style={{ fontSize: 11, color: '#666', marginTop: 12, fontFamily: 'monospace' }}>
            {this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

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
        <View style={{ flex: 1, backgroundColor: Colors.paper }} onLayout={onLayout}>
          <AppShell />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
