import React from 'react';
import { Text, type TextProps } from 'react-native';

import { typography, type TypographyVariant } from '../theme/palette';
import { useAppTheme } from '../theme/ThemeProvider';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/** Themed text primitive; captions and micro labels default to muted ink. */
export function AppText({
  variant = 'body',
  color,
  center = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { theme } = useAppTheme();
  const defaultColor =
    variant === 'caption' || variant === 'micro'
      ? theme.colors.textMuted
      : theme.colors.text;

  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? defaultColor },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
