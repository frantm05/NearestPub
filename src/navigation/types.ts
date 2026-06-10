import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Nearby: undefined;
  MapTab: undefined;
  FavoritesTab: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PubDetail: { venueId: string };
  WalkRoute: { venueId: string };
  Compass: { venueId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
