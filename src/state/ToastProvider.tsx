import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/ThemeProvider';
import { cardShadow, radius, spacing, typography } from '../theme/palette';

export type ToastTone = 'success' | 'info' | 'danger';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 3200;

const DEFAULT_ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  info: 'beer',
  danger: 'alert-circle',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Required<ToastOptions> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  const showToast = useCallback(
    ({ message, tone = 'info', icon }: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, tone, icon: icon ?? DEFAULT_ICONS[tone] });
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(dismiss, TOAST_DURATION_MS);
    },
    [dismiss, progress],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const toneColor =
    toast?.tone === 'success'
      ? theme.colors.success
      : toast?.tone === 'danger'
        ? theme.colors.danger
        : theme.colors.accent;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}
        >
          <Animated.View
            style={[
              styles.toast,
              cardShadow(theme),
              {
                top: insets.top + spacing.sm,
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, 0],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name={toast.icon} size={18} color={toneColor} />
            <Animated.Text
              numberOfLines={2}
              style={[typography.label, styles.message, { color: theme.colors.text }]}
            >
              {toast.message}
            </Animated.Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '88%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: {
    flexShrink: 1,
  },
});

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
