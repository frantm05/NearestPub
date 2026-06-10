import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { CompassScreen } from '../screens/CompassScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { MapScreen } from '../screens/MapScreen';
import { NearbyScreen } from '../screens/NearbyScreen';
import { PubDetailScreen } from '../screens/PubDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WalkRouteScreen } from '../screens/WalkRouteScreen';
import { typography } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<
  keyof TabParamList,
  { focused: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }
> = {
  Nearby: { focused: 'beer', idle: 'beer-outline' },
  MapTab: { focused: 'map', idle: 'map-outline' },
  FavoritesTab: { focused: 'heart', idle: 'heart-outline' },
  Settings: { focused: 'settings', idle: 'settings-outline' },
};

function TabNavigator() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.hairline,
        },
        tabBarLabelStyle: { ...typography.micro, letterSpacing: 0.2 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].focused : TAB_ICONS[route.name].idle}
            size={size - 2}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="Nearby" component={NearbyScreen} options={{ title: t('tabs.nearby') }} />
      <Tabs.Screen name="MapTab" component={MapScreen} options={{ title: t('tabs.map') }} />
      <Tabs.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ title: t('tabs.favorites') }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tabs.settings') }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="PubDetail" component={PubDetailScreen} />
      <Stack.Screen name="WalkRoute" component={WalkRouteScreen} />
      <Stack.Screen name="Compass" component={CompassScreen} />
    </Stack.Navigator>
  );
}
