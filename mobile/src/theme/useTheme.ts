// SparkMatch — Active theme hook
// Returns the palette (dark/light) for the current mode plus brand colors.
// Subscribes to the store so any screen using it re-renders on toggle.
import { useAppStore } from '../store/appStore';
import { Colors, ThemeColors } from './colors';

export interface ActiveTheme extends ThemeColors {
  isDark: boolean;
  // Brand colors (mode-independent)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  like: string;
  dislike: string;
  superLike: string;
  boost: string;
  verified: string;
  online: string;
  error: string;
  success: string;
  white: string;
  overlay: string;
}

export function useTheme(): ActiveTheme {
  const isDark = useAppStore((s) => s.isDarkMode);
  const palette = isDark ? Colors.dark : Colors.light;

  return {
    ...palette,
    isDark,
    primary: Colors.primary,
    primaryDark: Colors.primaryDark,
    primaryLight: Colors.primaryLight,
    secondary: Colors.secondary,
    like: Colors.like,
    dislike: Colors.dislike,
    superLike: Colors.superLike,
    boost: Colors.boost,
    verified: Colors.verified,
    online: Colors.online,
    error: Colors.error,
    success: Colors.success,
    white: Colors.white,
    overlay: Colors.overlay,
  };
}
