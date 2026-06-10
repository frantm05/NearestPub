import './src/i18n';

import React from 'react';
import { useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { FavoritesProvider } from './src/state/FavoritesProvider';
import { FiltersProvider } from './src/state/FiltersProvider';
import { LocationProvider } from './src/state/LocationProvider';
import { PubsProvider } from './src/state/PubsProvider';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { ToastProvider } from './src/state/ToastProvider';
import { themes } from './src/theme/palette';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

function ThemedApp() {
  const { navigationTheme, scheme } = useAppTheme();
  const { hydrated } = useSettings();

  // One-frame gate so the persisted theme/language apply before first paint.
  if (!hydrated) {
    return null;
  }

  return (
    <ToastProvider>
      <LocationProvider>
        <PubsProvider>
          <FavoritesProvider>
            <FiltersProvider>
              <NavigationContainer theme={navigationTheme}>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            </FiltersProvider>
          </FavoritesProvider>
        </PubsProvider>
      </LocationProvider>
    </ToastProvider>
  );
}

function Boot() {
  const systemScheme = useColorScheme();
  const background =
    themes.crispPilsner[systemScheme === 'dark' ? 'dark' : 'light'].colors.background;

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SettingsProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SettingsProvider>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Boot />
    </SafeAreaProvider>
  );
}
